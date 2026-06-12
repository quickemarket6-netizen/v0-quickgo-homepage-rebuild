import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

  const { data: driver } = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!driver) return NextResponse.json({ error: "Profil livreur non trouve" }, { status: 404 })

  // Check active marketplace order (delivering/ready)
  const { data: activeOrder } = await supabase
    .from("orders")
    .select(`
      id, order_number, total_amount, delivery_fee, delivery_address,
      customer:profiles!customer_id(full_name, phone),
      vendor:vendors(name, address, phone)
    `)
    .eq("driver_id", driver.id)
    .in("status", ["ready", "delivering"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activeOrder) {
    const addr = (() => {
      try {
        const a = typeof activeOrder.delivery_address === "string"
          ? JSON.parse(activeOrder.delivery_address as string)
          : activeOrder.delivery_address
        return [a?.street, a?.city].filter(Boolean).join(", ") || "Adresse non précisée"
      } catch { return "Adresse non précisée" }
    })()

    return NextResponse.json({
      type: "order",
      id: activeOrder.id,
      reference: activeOrder.order_number ?? activeOrder.id.slice(0, 8).toUpperCase(),
      destination: addr,
      customer_name: (activeOrder.customer as { full_name?: string } | null)?.full_name ?? "Client",
      customer_phone: (activeOrder.customer as { phone?: string } | null)?.phone ?? null,
      earning: activeOrder.delivery_fee ?? 0,
      tip: 0,
      order_type: "Standard",
    })
  }

  // Check active express delivery request
  const { data: activeRequest } = await supabase
    .from("delivery_requests")
    .select(`
      id, tracking_number, price, delivery_address, dropoff_address,
      delivery_contact, delivery_phone
    `)
    .eq("driver_id", driver.id)
    .in("status", ["accepted", "picked_up", "in_progress"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activeRequest) {
    return NextResponse.json({
      type: "express",
      id: activeRequest.id,
      reference: activeRequest.tracking_number ?? activeRequest.id.slice(0, 8).toUpperCase(),
      destination: activeRequest.delivery_address ?? activeRequest.dropoff_address ?? "Adresse non précisée",
      customer_name: activeRequest.delivery_contact ?? "Client",
      customer_phone: activeRequest.delivery_phone ?? null,
      earning: activeRequest.price ?? 0,
      tip: 0,
      order_type: "Express",
    })
  }

  return NextResponse.json(null)
}
