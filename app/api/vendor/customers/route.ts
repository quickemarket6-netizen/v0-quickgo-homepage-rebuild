import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET /api/vendor/customers
// Returns: customers who ordered from this vendor, with stats
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  // Pull all non-cancelled orders for this vendor with customer profiles
  const { data: orders, error } = await supabase
    .from("orders")
    .select(`
      id, total, total_amount, created_at, status,
      customer:profiles!orders_customer_id_fkey(id, full_name, phone, avatar_url, created_at)
    `)
    .eq("vendor_id", vendor.id)
    .neq("status", "cancelled")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Aggregate per customer
  type CustomerAgg = {
    id: string
    full_name: string
    phone: string
    avatar_url: string | null
    joined_at: string
    total_orders: number
    total_spent: number
    last_order_at: string
    avg_cart: number
  }

  const map = new Map<string, CustomerAgg>()

  for (const order of orders ?? []) {
    const c = order.customer as unknown as { id: string; full_name: string; phone: string; avatar_url: string | null; created_at: string } | null
    if (!c) continue
    const amount = (order.total_amount ?? order.total ?? 0) as number
    const existing = map.get(c.id)
    if (!existing) {
      map.set(c.id, {
        id: c.id,
        full_name: c.full_name ?? "—",
        phone: c.phone ?? "",
        avatar_url: c.avatar_url ?? null,
        joined_at: c.created_at,
        total_orders: 1,
        total_spent: amount,
        last_order_at: order.created_at as string,
        avg_cart: amount,
      })
    } else {
      existing.total_orders++
      existing.total_spent += amount
      if ((order.created_at as string) > existing.last_order_at) {
        existing.last_order_at = order.created_at as string
      }
      existing.avg_cart = existing.total_spent / existing.total_orders
    }
  }

  const customers = Array.from(map.values()).sort((a, b) => b.total_spent - a.total_spent)

  const now = Date.now()
  const thirtyDays = 30 * 86400000
  const sevenDays  = 7  * 86400000

  const kpi = {
    total:      customers.length,
    active:     customers.filter((c) => now - new Date(c.last_order_at).getTime() < thirtyDays).length,
    new_week:   customers.filter((c) => now - new Date(c.joined_at).getTime() < sevenDays).length,
    avg_cart:   customers.length > 0
      ? Math.round(customers.reduce((s, c) => s + c.avg_cart, 0) / customers.length)
      : 0,
    avg_orders: customers.length > 0
      ? Math.round(customers.reduce((s, c) => s + c.total_orders, 0) / customers.length)
      : 0,
  }

  // Segment
  const segmented = customers.map((c) => ({
    ...c,
    segment:
      c.total_orders >= 10 ? "vip" :
      c.total_orders >= 3  ? "regular" :
      "new",
  }))

  return NextResponse.json({ customers: segmented, kpi })
}
