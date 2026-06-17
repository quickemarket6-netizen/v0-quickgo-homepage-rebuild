import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET /api/tracking/[orderId] — initial snapshot for the tracking page
// Returns order details, tracking timeline, and last-known driver position.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const supabase = await createClient()
  const { orderId } = await params

  // Require authentication — tracking data contains PII (address, driver phone, GPS)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const [orderRes, eventsRes] = await Promise.all([
    supabase
      .from("orders")
      .select(`
        id, order_number, status, total, created_at,
        estimated_delivery_time, delivery_address,
        vendor:vendors(id, name, phone),
        driver:drivers(
          id, rating,
          current_latitude, current_longitude,
          user:profiles(full_name, phone)
        ),
        items:order_items(id, product_name, quantity, unit_price)
      `)
      .eq("id", orderId)
      .eq("customer_id", user.id) // IDOR guard: only the order owner can track
      .single(),
    supabase
      .from("tracking_events")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  if (orderRes.error || !orderRes.data) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = orderRes.data as any
  const drv = Array.isArray(order.driver) ? order.driver[0] : order.driver

  const driverPosition: [number, number] | null =
    drv?.current_latitude != null && drv?.current_longitude != null
      ? [Number(drv.current_latitude), Number(drv.current_longitude)]
      : null

  return NextResponse.json({
    order,
    events:         eventsRes.data ?? [],
    driverPosition,
  })
}
