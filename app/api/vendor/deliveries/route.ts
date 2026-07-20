import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/vendor/deliveries
// Returns orders that have entered the delivery phase (picked_up / delivering / delivered)
// with driver, customer and ETA info
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get("filter") ?? "all" // all | active | delivered | late

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  // Fetch all delivery-phase orders for this vendor
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id, order_number, status, total, total_amount,
      created_at, delivered_at, estimated_delivery_time,
      delivery_address,
      customer:profiles!orders_customer_id_fkey(full_name, phone, avatar_url),
      driver:profiles!orders_driver_id_fkey(full_name, phone, avatar_url),
      items:order_items(product_name, quantity)
    `)
    .eq("vendor_id", vendor.id)
    .in("status", ["picked_up", "delivering", "delivered", "ready"])
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const all = orders ?? []
  const filtered = filter === "active"
    ? all.filter((o) => ["picked_up", "delivering", "ready"].includes(o.status))
    : filter === "delivered"
    ? all.filter((o) => o.status === "delivered")
    : filter === "late"
    ? all.filter((o) =>
        ["picked_up", "delivering"].includes(o.status) &&
        o.estimated_delivery_time &&
        new Date(o.estimated_delivery_time as string) < now
      )
    : all

  // KPI
  const kpi = {
    active:          all.filter((o) => ["picked_up", "delivering"].includes(o.status)).length,
    delivered_today: all.filter((o) => o.status === "delivered" && (o.delivered_at as string) >= todayStart).length,
    delivered_month: all.filter((o) => o.status === "delivered" && (o.created_at as string) >= monthStart).length,
    late:            all.filter((o) =>
      ["picked_up", "delivering"].includes(o.status) &&
      o.estimated_delivery_time &&
      new Date(o.estimated_delivery_time as string) < now
    ).length,
  }

  return NextResponse.json({ orders: filtered, kpi })
}
