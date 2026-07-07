import { createClient } from "@/lib/supabase/server"
import { verifyAdmin } from "@/lib/payments/security"
import { NextResponse } from "next/server"

export async function GET() {
  // Dispatch overview: exposes every driver's name/status, all live orders and
  // platform revenue. That's supervisor-only data — a regular driver must not
  // see the whole fleet, so gate it behind the admin/super_admin role.
  const admin = await verifyAdmin()
  if (!admin.valid) {
    return NextResponse.json({ error: admin.error }, { status: admin.error === "Non authentifié" ? 401 : 403 })
  }

  const supabase = await createClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [driversRes, activeOrdersRes, todayOrdersRes] = await Promise.all([
    supabase.from("drivers")
      .select("id, status, user:profiles!user_id(full_name)")
      .in("status", ["online", "delivering", "offline"])
      .order("status")
      .limit(20),
    supabase.from("orders")
      .select(`
        id, order_number, status, delivery_fee,
        vendor:vendors(name),
        driver:drivers(user:profiles!user_id(full_name))
      `)
      .in("status", ["confirmed", "preparing", "ready", "delivering", "pending"])
      .order("created_at", { ascending: false })
      .limit(20),
    supabase.from("orders")
      .select("delivery_fee")
      .eq("status", "delivered")
      .gte("created_at", todayStart.toISOString()),
  ])

  type DriverRow = { id: string; status: string; user: { full_name?: string | null } | null }
  type OrderRow = {
    id: string; order_number?: string | null; status: string; delivery_fee?: number | null
    vendor: { name?: string | null } | null
    driver: { user: { full_name?: string | null } | null } | null
  }

  const drivers: DriverRow[] = (driversRes.data ?? []) as unknown as DriverRow[]
  const orders: OrderRow[] = (activeOrdersRes.data ?? []) as unknown as OrderRow[]
  const liveRevenue = (todayOrdersRes.data ?? []).reduce((s, o) => s + (Number(o.delivery_fee) || 0), 0)

  const driverList = drivers.slice(0, 10).map((d) => ({
    id: d.id,
    name: d.user?.full_name ?? "Livreur",
    status: d.status,
    eta: null, // real per-driver ETA requires live routing; not fabricated here
    earning: 0, // individual earnings not exposed for privacy
  }))

  const orderList = orders.slice(0, 10).map((o) => ({
    id: `#${o.order_number ?? o.id.slice(0, 6).toUpperCase()}`,
    merchant: (o.vendor as { name?: string } | null)?.name ?? "Commerçant",
    status: o.status,
    driver: (o.driver as { user?: { full_name?: string | null } } | null)?.user?.full_name ?? null,
    eta: null, // real ETA requires live routing; not fabricated here
  }))

  const activeDrivers = drivers.filter((d) => d.status === "delivering").length
  const onlineDrivers = drivers.filter((d) => d.status === "online").length
  const pendingOrders = orders.filter((o) => o.status === "pending").length
  const activeOrders = orders.filter((o) => o.status !== "pending").length

  return NextResponse.json({
    drivers: driverList,
    orders: orderList,
    stats: {
      active_drivers: activeDrivers,
      online_drivers: onlineDrivers,
      total_drivers: drivers.length,
      active_orders: activeOrders,
      pending_orders: pendingOrders,
      live_revenue: liveRevenue,
    },
  })
}
