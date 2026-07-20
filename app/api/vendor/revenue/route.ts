import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, name, logo_url, is_verified, rating, commission_rate, status")
    .eq("user_id", user.id)
    .single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const period = Math.min(90, Math.max(7, parseInt(req.nextUrl.searchParams.get("period") ?? "30")))
  const now = new Date()

  const todayStart      = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const yesterdayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString()
  const weekStart       = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString()
  const prevWeekStart   = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14).toISOString()
  const monthStart      = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const prevMonthStart  = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const prevMonthEnd    = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()
  const yearStart       = new Date(now.getFullYear(), 0, 1).toISOString()
  const prevYearStart   = new Date(now.getFullYear() - 1, 0, 1).toISOString()
  const prevYearEnd     = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59).toISOString()
  const periodStart     = new Date(Date.now() - period * 86400000).toISOString()
  const thirtyDaysAgo   = new Date(Date.now() - 30 * 86400000).toISOString()

  function orderTotal(o: { total_amount?: number | null; total?: number | null }) {
    return o.total_amount ?? o.total ?? 0
  }
  function sum(rows: { total_amount?: number | null; total?: number | null }[]) {
    return rows.reduce((s, o) => s + orderTotal(o), 0)
  }
  function pctChange(curr: number, prev: number) {
    if (prev === 0) return curr > 0 ? 100 : 0
    return Math.round(((curr - prev) / prev) * 100)
  }

  const [
    todayRes, yesterdayRes,
    weekRes, prevWeekRes,
    monthRes, prevMonthRes,
    yearRes, prevYearRes,
    periodRes, commRes, walletRes, thirtyDayRes,
  ] = await Promise.all([
    supabase.from("orders").select("total_amount, total").eq("vendor_id", vendor.id).gte("created_at", todayStart).neq("status", "cancelled"),
    supabase.from("orders").select("total_amount, total").eq("vendor_id", vendor.id).gte("created_at", yesterdayStart).lt("created_at", todayStart).neq("status", "cancelled"),
    supabase.from("orders").select("total_amount, total").eq("vendor_id", vendor.id).gte("created_at", weekStart).neq("status", "cancelled"),
    supabase.from("orders").select("total_amount, total").eq("vendor_id", vendor.id).gte("created_at", prevWeekStart).lt("created_at", weekStart).neq("status", "cancelled"),
    supabase.from("orders").select("total_amount, total").eq("vendor_id", vendor.id).gte("created_at", monthStart).neq("status", "cancelled"),
    supabase.from("orders").select("total_amount, total").eq("vendor_id", vendor.id).gte("created_at", prevMonthStart).lt("created_at", prevMonthEnd).neq("status", "cancelled"),
    supabase.from("orders").select("total_amount, total").eq("vendor_id", vendor.id).gte("created_at", yearStart).neq("status", "cancelled"),
    supabase.from("orders").select("total_amount, total").eq("vendor_id", vendor.id).gte("created_at", prevYearStart).lt("created_at", prevYearEnd).neq("status", "cancelled"),
    supabase.from("orders").select("total_amount, total, created_at").eq("vendor_id", vendor.id).gte("created_at", periodStart).neq("status", "cancelled").order("created_at", { ascending: true }),
    supabase.from("commission_logs").select("gross_amount, quickgo_commission, vendor_net_amount").eq("vendor_id", vendor.id).gte("created_at", monthStart),
    supabase.from("vendor_wallets").select("available_balance, pending_balance, total_earned, total_withdrawn").eq("vendor_id", vendor.id).single(),
    supabase.from("orders").select("id, total_amount, total, created_at, items:order_items(product_name, quantity, total_price)").eq("vendor_id", vendor.id).gte("created_at", thirtyDaysAgo).neq("status", "cancelled").limit(200),
  ])

  // Revenue comparison KPIs
  const todayRev     = sum(todayRes.data ?? [])
  const yesterdayRev = sum(yesterdayRes.data ?? [])
  const weekRev      = sum(weekRes.data ?? [])
  const prevWeekRev  = sum(prevWeekRes.data ?? [])
  const monthRev     = sum(monthRes.data ?? [])
  const prevMonthRev = sum(prevMonthRes.data ?? [])
  const yearRev      = sum(yearRes.data ?? [])
  const prevYearRev  = sum(prevYearRes.data ?? [])

  // Period chart (one point per day)
  const periodOrders = periodRes.data ?? []
  const chart = Array.from({ length: period }, (_, i) => {
    const d = new Date(Date.now() - (period - 1 - i) * 86400000)
    const dayStr = d.toISOString().slice(0, 10)
    const dayOrders = periodOrders.filter((o) => o.created_at.slice(0, 10) === dayStr)
    return {
      date: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      revenue: dayOrders.reduce((s, o) => s + orderTotal(o), 0),
      orders: dayOrders.length,
    }
  })

  // Revenue by day of week (aggregated over the period)
  const DOW = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
  const by_dow = DOW.map((label, i) => ({
    day: label,
    revenue: periodOrders
      .filter((o) => new Date(o.created_at).getDay() === i)
      .reduce((s, o) => s + orderTotal(o), 0),
  }))

  // Top products by revenue (last 30 days)
  const productMap = new Map<string, { name: string; sold: number; revenue: number }>()
  const thirtyOrders = thirtyDayRes.data ?? []
  for (const order of thirtyOrders) {
    for (const item of (order as unknown as { items: { product_name: string; quantity: number; total_price: number }[] }).items ?? []) {
      const key = item.product_name ?? "?"
      const cur = productMap.get(key) ?? { name: key, sold: 0, revenue: 0 }
      cur.sold += item.quantity ?? 1
      cur.revenue += item.total_price ?? 0
      productMap.set(key, cur)
    }
  }
  const top_products = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8)

  // Avg order value (30d)
  const total30dRev = thirtyOrders.reduce((s, o) => s + orderTotal(o as unknown as { total_amount?: number; total?: number }), 0)
  const avg_order_value = thirtyOrders.length > 0 ? Math.round(total30dRev / thirtyOrders.length) : 0

  // Commission this month
  const comms = commRes.data ?? []
  const commission_month = Math.round(comms.reduce((s, c) => s + (c.quickgo_commission ?? 0), 0))

  return NextResponse.json({
    vendor,
    kpi: {
      today: todayRev,
      today_change: pctChange(todayRev, yesterdayRev),
      week: weekRev,
      week_change: pctChange(weekRev, prevWeekRev),
      month: monthRev,
      month_change: pctChange(monthRev, prevMonthRev),
      year: yearRev,
      year_change: pctChange(yearRev, prevYearRev),
      avg_order_value,
      commission_month,
      commission_rate: vendor.commission_rate ?? 5,
    },
    chart,
    by_dow,
    top_products,
    wallet: walletRes.data ?? null,
  })
}
