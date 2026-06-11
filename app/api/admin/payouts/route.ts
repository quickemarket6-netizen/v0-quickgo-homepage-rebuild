import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"
import { approveAndProcessPayout, rejectPayout } from "@/lib/payments/wallet-engine"
import { initiateTransfer } from "@/lib/payments/cinetpay"

// GET  /api/admin/payouts — list payouts + KPI + distributions
// POST /api/admin/payouts — admin action: approve | reject | process

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get("status") // pending | processing | completed | rejected | all
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200)
  const offset = parseInt(searchParams.get("offset") ?? "0")

  // ── Fetch payouts with owner info ──────────────────────────────
  let query = supabase
    .from("vendor_payouts")
    .select(`
      id, owner_type, owner_name, amount, payout_method, payout_phone,
      status, initiated_by_admin, idempotency_key,
      approved_at, processed_at, created_at, updated_at,
      failure_reason, rejection_reason,
      cinetpay_transaction_id, cinetpay_reference,
      vendor_id, driver_id,
      vendors:vendor_id ( name ),
      drivers:driver_id ( full_name )
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter)
  }

  const { data: payoutsRaw, error: payoutsErr } = await query
  if (payoutsErr) return NextResponse.json({ error: payoutsErr.message }, { status: 500 })

  // Resolve display name from joined tables
  const payouts = (payoutsRaw ?? []).map((p) => ({
    ...p,
    owner_name: p.owner_name
      ?? (p.owner_type === "vendor"
        ? (p.vendors as { name?: string } | null)?.name
        : (p.drivers as { full_name?: string } | null)?.full_name)
      ?? "Inconnu",
    vendors: undefined,
    drivers: undefined,
  }))

  // ── KPI ────────────────────────────────────────────────────────
  const { data: kpiRows } = await supabase
    .from("vendor_payouts")
    .select("status, amount, created_at, payout_method, owner_type")

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const allPayouts = kpiRows ?? []
  const pending    = allPayouts.filter(p => p.status === "pending")
  const processing = allPayouts.filter(p => p.status === "processing")
  const todayDone  = allPayouts.filter(p =>
    p.status === "completed" && p.created_at >= startOfDay)
  const todayRej   = allPayouts.filter(p =>
    p.status === "rejected" && p.created_at >= startOfDay)
  const allAmounts = allPayouts.map(p => Number(p.amount)).filter(Boolean)

  const kpi = {
    pending_count:   pending.length + processing.length,
    pending_amount:  [...pending, ...processing].reduce((s, p) => s + Number(p.amount), 0),
    processed_today: todayDone.length,
    rejected_today:  todayRej.length,
    avg_amount:      allAmounts.length
      ? Math.round(allAmounts.reduce((s, a) => s + a, 0) / allAmounts.length)
      : 0,
    commission_rate: 7,  // 7% — from wallet-engine constant
  }

  // ── Method distribution (pending + processing) ──────────────────
  const methodMap: Record<string, number> = {}
  ;[...pending, ...processing].forEach(p => {
    const m = p.payout_method ?? "unknown"
    methodMap[m] = (methodMap[m] ?? 0) + 1
  })
  const totalPending = [...pending, ...processing].length || 1
  const METHOD_COLORS: Record<string, string> = {
    orange_money: "#f97316",
    mtn_momo: "#eab308",
    wave: "#3b82f6",
    cinetpay: "#22c55e",
    bank: "#8b5cf6",
  }
  const method_distribution = Object.entries(methodMap).map(([method, count]) => ({
    method,
    label: method === "orange_money" ? "Orange Money"
      : method === "mtn_momo" ? "MTN MoMo"
      : method === "wave" ? "Wave"
      : method === "cinetpay" ? "CinetPay"
      : method === "bank" ? "Banque"
      : method,
    count,
    pct: Math.round(count / totalPending * 100),
    color: METHOD_COLORS[method] ?? "#6b7280",
  }))

  // ── Type breakdown ─────────────────────────────────────────────
  const vendorPending = [...pending, ...processing].filter(p => p.owner_type === "vendor" || !p.owner_type)
  const driverPending = [...pending, ...processing].filter(p => p.owner_type === "driver")
  const type_breakdown = [
    {
      type: "vendor",
      label: "Vendeurs",
      count: vendorPending.length,
      amount: vendorPending.reduce((s, p) => s + Number(p.amount), 0),
    },
    {
      type: "driver",
      label: "Livreurs",
      count: driverPending.length,
      amount: driverPending.reduce((s, p) => s + Number(p.amount), 0),
    },
  ]

  // ── 7-day volume trend (completed payouts) ─────────────────────
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const { data: trendRows } = await supabase
    .from("vendor_payouts")
    .select("amount, created_at")
    .eq("status", "completed")
    .gte("created_at", sevenDaysAgo.toISOString())

  const DAYS_FR = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
  const trendMap: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    trendMap[key] = 0
  }
  ;(trendRows ?? []).forEach(r => {
    const key = r.created_at.slice(0, 10)
    if (key in trendMap) trendMap[key] += Number(r.amount)
  })

  const volume_trend = Object.entries(trendMap).map(([dateStr, amount], idx, arr) => {
    const d = new Date(dateStr)
    const label = idx === arr.length - 1 ? "Auj" : DAYS_FR[d.getDay()]
    return { day: label, amount: Math.round(amount) }
  })

  return NextResponse.json({ kpi, payouts, method_distribution, type_breakdown, volume_trend })
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const body = await req.json() as {
    action: "approve" | "reject" | "process_cinetpay"
    payout_id: string
    reason?: string
  }

  const ipAddress = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown"

  if (!body.payout_id) {
    return NextResponse.json({ error: "payout_id requis" }, { status: 400 })
  }

  // ── approve: deduct wallet + mark processing ────────────────────
  if (body.action === "approve") {
    const result = await approveAndProcessPayout(body.payout_id, admin.adminId!, ipAddress)
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })

    // Fetch payout to fire CinetPay transfer immediately
    const { data: payout } = await supabase
      .from("vendor_payouts")
      .select("*, vendor:vendor_id(name), driver:driver_id(full_name)")
      .eq("id", body.payout_id)
      .single() as {
        data: {
          id: string; amount: number; payout_method: string; payout_phone: string;
          owner_name?: string; vendor_id?: string; driver_id?: string;
          vendor?: { name?: string } | null;
          driver?: { full_name?: string } | null;
        } | null
      }

    if (payout && (payout.payout_method === "orange_money" || payout.payout_method === "mtn_momo")) {
      const ownerName = payout.owner_name
        ?? payout.vendor?.name
        ?? payout.driver?.full_name
        ?? "QuickGo Partner"

      const transfer = await initiateTransfer({
        vendor_payout_id: payout.id,
        amount: Number(payout.amount),
        phone_number: payout.payout_phone,
        payout_method: payout.payout_method as "orange_money" | "mtn_momo",
        vendor_name: ownerName,
      })

      if (transfer.success) {
        await supabase
          .from("vendor_payouts")
          .update({
            status: "processing",
            cinetpay_transaction_id: transfer.transaction_id,
            cinetpay_reference: transfer.provider_reference,
          })
          .eq("id", body.payout_id)
      } else {
        // Transfer failed — keep as approved for manual retry
        return NextResponse.json({
          success: true,
          warning: `Approuvé mais transfert CinetPay échoué: ${transfer.message}`,
        })
      }
    }

    return NextResponse.json({ success: true })
  }

  // ── reject ──────────────────────────────────────────────────────
  if (body.action === "reject") {
    if (!body.reason?.trim()) {
      return NextResponse.json({ error: "reason requis pour rejection" }, { status: 400 })
    }
    const result = await rejectPayout(body.payout_id, admin.adminId!, body.reason, ipAddress)
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json({ success: true })
  }

  // ── manual CinetPay retry ───────────────────────────────────────
  if (body.action === "process_cinetpay") {
    const { data: payout } = await supabase
      .from("vendor_payouts")
      .select("*, vendor:vendor_id(name), driver:driver_id(full_name)")
      .eq("id", body.payout_id)
      .in("status", ["approved", "processing"])
      .single() as {
        data: {
          id: string; amount: number; payout_method: string; payout_phone: string;
          owner_name?: string; vendor_id?: string; driver_id?: string;
          vendor?: { name?: string } | null;
          driver?: { full_name?: string } | null;
        } | null
      }

    if (!payout) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 })

    const ownerName = payout.owner_name
      ?? payout.vendor?.name
      ?? payout.driver?.full_name
      ?? "QuickGo Partner"

    const transfer = await initiateTransfer({
      vendor_payout_id: payout.id,
      amount: Number(payout.amount),
      phone_number: payout.payout_phone,
      payout_method: payout.payout_method as "orange_money" | "mtn_momo",
      vendor_name: ownerName,
    })

    if (!transfer.success) {
      return NextResponse.json({ error: transfer.message }, { status: 502 })
    }

    await supabase
      .from("vendor_payouts")
      .update({
        status: "processing",
        cinetpay_transaction_id: transfer.transaction_id,
        cinetpay_reference: transfer.provider_reference,
      })
      .eq("id", body.payout_id)

    return NextResponse.json({ success: true, transaction_id: transfer.transaction_id })
  }

  return NextResponse.json({ error: "action invalide" }, { status: 400 })
}
