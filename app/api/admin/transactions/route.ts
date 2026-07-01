import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

// ── Provider → display method mapping ───────────────────────────────────────
// payment_transactions.payment_provider is one of:
//   cinetpay | orange_money | mtn_momo | wallet | cash
const METHOD_LABELS: Record<string, string> = {
  cinetpay:     "CinetPay",
  orange_money: "Orange Money",
  mtn_momo:     "MTN Money",
  wallet:       "Wallet",
  cash:         "Espèces",
}
const METHOD_COLORS: Record<string, string> = {
  "Orange Money": "#f97316",
  "MTN Money":    "#eab308",
  "Wave":         "#3b82f6",
  "CinetPay":     "#22c55e",
  "PayPal":       "#8b5cf6",
  "Virement":     "#ec4899",
  "Wallet":       "#06b6d4",
  "Espèces":      "#6b7280",
}

// ── DB status → UI status mapping ───────────────────────────────────────────
// payment_transactions.status: initiated | pending | completed | failed | cancelled | refunded
function uiStatus(dbStatus: string | null): "success" | "failed" | "refunded" | "pending" {
  switch (dbStatus) {
    case "completed": return "success"
    case "refunded":  return "refunded"
    case "failed":
    case "cancelled": return "failed"
    default:          return "pending" // initiated | pending
  }
}

type ProfileRel = { full_name: string | null } | null
type OrderRel = { order_number: string | null; profiles: ProfileRel } | null
interface TxnRow {
  id: string
  transaction_id: string | null
  order_id: string | null
  amount: number | null
  status: string | null
  payment_provider: string | null
  created_at: string
  orders: OrderRel
}
interface CommissionRow {
  order_id: string
  quickgo_commission: number | null
  payment_fees: number | null
}

export async function GET() {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error ?? "Accès refusé" }, { status: 403 })

  const supabase = await createClient()

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString()

  // Fetch recent real transactions + related order/customer, and commission logs (for fee/commission).
  const [txnRes, yesterdayCountRes, commissionRes] = await Promise.all([
    supabase
      .from("payment_transactions")
      .select("id, transaction_id, order_id, amount, status, payment_provider, created_at, orders(order_number, profiles:profiles!orders_customer_id_fkey(full_name))")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("payment_transactions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", yesterdayStart)
      .lt("created_at", todayStart),
    supabase
      .from("commission_logs")
      .select("order_id, quickgo_commission, payment_fees"),
  ])

  const rows = (txnRes.data ?? []) as unknown as TxnRow[]

  // Index commission logs by order_id to enrich each transaction with real fee / commission.
  const commByOrder: Record<string, { commission: number; fee: number }> = {}
  for (const c of (commissionRes.data ?? []) as unknown as CommissionRow[]) {
    if (!c.order_id) continue
    commByOrder[c.order_id] = {
      commission: Number(c.quickgo_commission ?? 0),
      fee:        Number(c.payment_fees ?? 0),
    }
  }

  const transactions = rows.map((r) => {
    const status = uiStatus(r.status)
    const method = METHOD_LABELS[r.payment_provider ?? ""] ?? (r.payment_provider ?? "Autre")
    const comm = r.order_id ? commByOrder[r.order_id] : undefined
    return {
      id:            r.transaction_id ?? r.id,
      order_id:      r.orders?.order_number ?? (r.order_id ? r.order_id.slice(0, 8).toUpperCase() : "—"),
      customer_name: r.orders?.profiles?.full_name ?? "Client QuickGo",
      amount:        Number(r.amount ?? 0),
      method,
      status,
      timestamp:     r.created_at,
      fee:           comm?.fee ?? 0,
      commission:    comm?.commission ?? 0,
      // NOTE: payment_transactions has no device / IP columns — those forensic
      // fields are intentionally omitted rather than fabricated.
    }
  })

  const success  = transactions.filter((t) => t.status === "success")
  const failed   = transactions.filter((t) => t.status === "failed")
  const refunded = transactions.filter((t) => t.status === "refunded")
  const pending  = transactions.filter((t) => t.status === "pending")

  const totalVolume     = success.reduce((s, t) => s + t.amount, 0)
  const totalCommission = transactions.reduce((s, t) => s + t.commission, 0)
  const totalAmount     = transactions.reduce((s, t) => s + t.amount, 0)
  const avgAmount       = transactions.length ? Math.round(totalAmount / transactions.length) : 0

  const countToday = transactions.filter((t) => t.timestamp >= todayStart).length
  const yesterdayCount = yesterdayCountRes.count ?? 0

  const successRate    = transactions.length ? Math.round((success.length / transactions.length) * 1000) / 10 : 0
  const commissionRate = totalVolume > 0 ? Math.round((totalCommission / totalVolume) * 1000) / 10 : 0

  // ── Method distribution ────────────────────────────────────────────────────
  const methodCount: Record<string, number> = {}
  transactions.forEach((t) => { methodCount[t.method] = (methodCount[t.method] ?? 0) + 1 })
  const methodDistribution = Object.entries(methodCount).map(([method, count]) => ({
    method,
    count,
    pct: transactions.length ? Math.round((count / transactions.length) * 100) : 0,
    color: METHOD_COLORS[method] ?? "#6b6b8a",
  }))

  // ── 24h hourly trend (real, bucketed by hour of created_at within last 24h) ─
  const cutoff24h = Date.now() - 24 * 60 * 60 * 1000
  const hourlyTrend = Array.from({ length: 24 }, (_, h) => ({
    hour: String(h).padStart(2, "0") + "h",
    volume: 0,
    count: 0,
  }))
  for (const t of transactions) {
    const d = new Date(t.timestamp)
    if (d.getTime() < cutoff24h) continue
    const bucket = hourlyTrend[d.getHours()]
    bucket.volume += t.amount
    bucket.count += 1
  }

  // ── Status distribution ────────────────────────────────────────────────────
  const statusDistribution = [
    { status: "Succès",      count: success.length,  color: "#22c55e" },
    { status: "Échouées",    count: failed.length,   color: "#ef4444" },
    { status: "Remboursées", count: refunded.length, color: "#3b82f6" },
    { status: "En cours",    count: pending.length,  color: "#f59e0b" },
  ]

  return NextResponse.json({
    kpi: {
      volume_total:       totalVolume,
      count_today:        countToday,
      success_rate:       successRate,
      avg_amount:         avgAmount,
      failed_count:       failed.length,
      commission_quickgo: commissionRate,
      yesterday_count:    yesterdayCount,
    },
    transactions,
    method_distribution: methodDistribution,
    hourly_trend:        hourlyTrend,
    status_distribution: statusDistribution,
  })
}
