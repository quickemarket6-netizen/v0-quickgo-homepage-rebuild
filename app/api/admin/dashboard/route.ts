import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

export async function GET() {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    revenueRes,
    activeOrdersRes,
    onlineDriversRes,
    liveOrdersRes,
    topDriversRes,
    cityStatsRes,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total_amount")
      .gte("created_at", todayStart.toISOString())
      .neq("status", "cancelled"),

    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("status", ["pending", "confirmed", "preparing", "ready", "delivering"]),

    supabase
      .from("drivers")
      .select("id", { count: "exact", head: true })
      .in("status", ["online", "delivering"]),

    supabase
      .from("orders")
      .select(`
        id, order_number, status, total_amount, created_at,
        delivery_address,
        customer:profiles!orders_customer_id_fkey(full_name),
        driver_profile:drivers(user:profiles(full_name))
      `)
      .in("status", ["pending", "confirmed", "preparing", "ready", "delivering"])
      .order("created_at", { ascending: false })
      .limit(8),

    supabase
      .from("drivers")
      .select("id, total_deliveries, total_earnings, rating, user:profiles(full_name)")
      .order("total_deliveries", { ascending: false })
      .limit(5),

    supabase
      .from("orders")
      .select("delivery_address, total_amount")
      .gte("created_at", todayStart.toISOString())
      .neq("status", "cancelled"),
  ])

  const totalRevenue = (revenueRes.data ?? []).reduce((s, o) => s + Number(o.total_amount ?? 0), 0)

  // City stats from delivery_address JSONB
  const cityMap: Record<string, { orders: number; revenue: number }> = {}
  for (const o of cityStatsRes.data ?? []) {
    const city = (o.delivery_address as Record<string, string> | null)?.city ?? "Autre"
    if (!cityMap[city]) cityMap[city] = { orders: 0, revenue: 0 }
    cityMap[city].orders++
    cityMap[city].revenue += Number(o.total_amount ?? 0)
  }
  const cityStats = Object.entries(cityMap)
    .map(([city, data]) => ({ city, ...data }))
    .sort((a, b) => b.orders - a.orders)
    .slice(0, 5)

  return NextResponse.json({
    stats: {
      revenue: totalRevenue,
      activeOrders: activeOrdersRes.count ?? 0,
      onlineDrivers: onlineDriversRes.count ?? 0,
    },
    liveOrders: liveOrdersRes.data ?? [],
    topDrivers: topDriversRes.data ?? [],
    cityStats,
  })
}
