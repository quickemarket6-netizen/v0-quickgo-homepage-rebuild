import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Average urban delivery speed (km/h) used to turn a straight-line distance
// into a rough ETA when no routing engine is wired up.
const AVG_DELIVERY_SPEED_KMH = 22

// Great-circle distance between two lat/lng points, in kilometres.
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const R = 6371 // Earth radius in km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Compute distance (km) + ETA (min) from the driver position to a destination.
// Returns nulls when either endpoint lacks coordinates.
function routeMetrics(
  from: { lat: number | null; lng: number | null },
  to: { lat: number | null; lng: number | null }
): { distance_km: number | null; eta_min: number | null } {
  if (from.lat == null || from.lng == null || to.lat == null || to.lng == null) {
    return { distance_km: null, eta_min: null }
  }
  const distance_km = Math.round(haversineKm(from.lat, from.lng, to.lat, to.lng) * 10) / 10
  const eta_min = Math.max(1, Math.round((distance_km / AVG_DELIVERY_SPEED_KMH) * 60))
  return { distance_km, eta_min }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, current_latitude, current_longitude")
    .eq("user_id", user.id)
    .single()

  if (!driver) return NextResponse.json({ error: "Profil livreur non trouve" }, { status: 404 })

  const driverPos = {
    lat: driver.current_latitude as number | null,
    lng: driver.current_longitude as number | null,
  }

  // Check active marketplace order (delivering/ready)
  const { data: activeOrder } = await supabase
    .from("orders")
    .select(`
      id, order_number, total_amount, delivery_fee, delivery_address,
      delivery_latitude, delivery_longitude,
      customer:profiles!customer_id(full_name, phone),
      vendor:vendors(name, address, phone)
    `)
    .eq("driver_id", user.id)
    .in("status", ["picked_up", "delivering"])
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

    const metrics = routeMetrics(driverPos, {
      lat: activeOrder.delivery_latitude as number | null,
      lng: activeOrder.delivery_longitude as number | null,
    })

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
      distance_km: metrics.distance_km,
      eta_min: metrics.eta_min,
    })
  }

  // Check active express delivery request
  const { data: activeRequest } = await supabase
    .from("delivery_requests")
    .select(`
      id, tracking_number, price, delivery_address, dropoff_address,
      dropoff_lat, dropoff_lng, delivery_contact, delivery_phone
    `)
    .eq("driver_id", driver.id)
    .in("status", ["accepted", "picked_up", "in_progress"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (activeRequest) {
    const metrics = routeMetrics(driverPos, {
      lat: activeRequest.dropoff_lat as number | null,
      lng: activeRequest.dropoff_lng as number | null,
    })

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
      distance_km: metrics.distance_km,
      eta_min: metrics.eta_min,
    })
  }

  return NextResponse.json(null)
}
