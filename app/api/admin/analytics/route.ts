import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

type OrderRow = {
  total_amount: number | null
  total: number | null
  created_at: string
  delivered_at: string | null
  delivery_address: Record<string, string> | null
  vendor_id: string | null
  vendors: { category: string | null } | null
}

function oTotal(o: { total_amount?: number | null; total?: number | null }) {
  return Number(o.total_amount ?? o.total ?? 0)
}

function pctChange(current: number, previous: number) {
  if (previous > 0) return Math.round(((current - previous) / previous) * 1000) / 10
  return current > 0 ? 100 : 0
}

function avgDeliveryMin(orders: OrderRow[]) {
  const delivered = orders.filter(o => o.delivered_at)
  if (delivered.length === 0) return null
  const totalMin = delivered.reduce(
    (s, o) => s + (new Date(o.delivered_at as string).getTime() - new Date(o.created_at).getTime()) / 60000,
    0
  )
  return Math.round(totalMin / delivered.length)
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 401 })

  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const periodDays = Math.max(1, parseInt(searchParams.get("period") ?? "30"))
  const periodStart = new Date(Date.now() - periodDays * 86400000).toISOString()
  const prevPeriodStart = new Date(Date.now() - 2 * periodDays * 86400000).toISOString()

  const [currentOrdersRes, prevOrdersRes, currentReviewsRes, prevReviewsRes] = await Promise.all([
    // 1. Orders in current period
    supabase.from("orders")
      .select("total_amount, total, created_at, delivered_at, delivery_address, vendor_id, vendors(category)")
      .gte("created_at", periodStart).neq("status", "cancelled"),
    // 2. Orders in previous period (comparison)
    supabase.from("orders")
      .select("total_amount, total, created_at, delivered_at, delivery_address, vendor_id, vendors(category)")
      .gte("created_at", prevPeriodStart).lt("created_at", periodStart).neq("status", "cancelled"),
    // 3. Reviews in current period
    supabase.from("reviews").select("rating").gte("created_at", periodStart),
    // 4. Reviews in previous period
    supabase.from("reviews").select("rating").gte("created_at", prevPeriodStart).lt("created_at", periodStart),
  ])

  const orders = (currentOrdersRes.data ?? []) as unknown as OrderRow[]
  const prevOrders = (prevOrdersRes.data ?? []) as unknown as OrderRow[]

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const revenue = orders.reduce((s, o) => s + oTotal(o), 0)
  const prevRevenue = prevOrders.reduce((s, o) => s + oTotal(o), 0)

  const deliveryMin = avgDeliveryMin(orders)
  const prevDeliveryMin = avgDeliveryMin(prevOrders)
  const deliveryChange = deliveryMin !== null && prevDeliveryMin !== null && prevDeliveryMin > 0
    ? Math.round(((deliveryMin - prevDeliveryMin) / prevDeliveryMin) * 1000) / 10
    : 0

  const ratings = (currentReviewsRes.data ?? []).map(r => Number(r.rating ?? 0)).filter(r => r > 0)
  const prevRatings = (prevReviewsRes.data ?? []).map(r => Number(r.rating ?? 0)).filter(r => r > 0)
  const satisfaction = ratings.length > 0
    ? Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10
    : null
  const prevSatisfaction = prevRatings.length > 0
    ? Math.round((prevRatings.reduce((s, r) => s + r, 0) / prevRatings.length) * 10) / 10
    : null
  const satisfactionChange = satisfaction !== null && prevSatisfaction !== null
    ? Math.round((satisfaction - prevSatisfaction) * 10) / 10
    : 0

  // ── Daily buckets (last 7 days) ───────────────────────────────────────────
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = d.toISOString().slice(0, 10)
    const slice = orders.filter(o => o.created_at.slice(0, 10) === key)
    return {
      day: DAY_LABELS[d.getDay()],
      date: key,
      orders: slice.length,
      revenue: slice.reduce((s, o) => s + oTotal(o), 0),
    }
  })

  // ── Top cities ────────────────────────────────────────────────────────────
  const cityMap: Record<string, number> = {}
  for (const o of orders) {
    const city = o.delivery_address?.city ?? "Autres"
    cityMap[city] = (cityMap[city] ?? 0) + 1
  }
  const sortedCities = Object.entries(cityMap).sort((a, b) => b[1] - a[1])
  const mainCities = sortedCities.slice(0, 4)
  const otherCount = sortedCities.slice(4).reduce((s, [, n]) => s + n, 0)
  const totalCityOrders = orders.length
  const topCities = [
    ...mainCities.map(([name, count]) => ({ name, orders: count })),
    ...(otherCount > 0 ? [{ name: "Autres", orders: otherCount }] : []),
  ].map(c => ({
    ...c,
    percentage: totalCityOrders > 0 ? Math.round((c.orders / totalCityOrders) * 100) : 0,
  }))

  // ── Top categories (vendor category) ─────────────────────────────────────
  const catMap: Record<string, { orders: number; revenue: number }> = {}
  for (const o of orders) {
    const cat = capitalize(o.vendors?.category ?? "Autres")
    if (!catMap[cat]) catMap[cat] = { orders: 0, revenue: 0 }
    catMap[cat].orders++
    catMap[cat].revenue += oTotal(o)
  }
  const prevCatMap: Record<string, number> = {}
  for (const o of prevOrders) {
    const cat = capitalize(o.vendors?.category ?? "Autres")
    prevCatMap[cat] = (prevCatMap[cat] ?? 0) + oTotal(o)
  }
  const topCategories = Object.entries(catMap)
    .map(([name, d]) => ({
      name,
      orders: d.orders,
      revenue: d.revenue,
      growth: pctChange(d.revenue, prevCatMap[name] ?? 0),
    }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5)

  return NextResponse.json({
    period_days: periodDays,
    kpi: {
      revenue,
      revenue_change: pctChange(revenue, prevRevenue),
      orders: orders.length,
      orders_change: pctChange(orders.length, prevOrders.length),
      avg_delivery_min: deliveryMin,
      delivery_change: deliveryChange,
      satisfaction,
      satisfaction_change: satisfactionChange,
    },
    weekly,
    summary: {
      total_orders: orders.length,
      total_revenue: revenue,
      avg_per_day: Math.round(orders.length / periodDays),
    },
    top_cities: topCities,
    top_categories: topCategories,
  })
}
