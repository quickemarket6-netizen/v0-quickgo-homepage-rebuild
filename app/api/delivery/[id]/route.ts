import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Build query — PII fields only returned for authenticated owner/driver
  const isTrackingNumber = id.startsWith("QGD-")

  // Anonymous access via tracking number: return minimal public data (no PII).
  // Passe par la RPC track_parcel (SECURITY DEFINER) — le RLS de la table
  // n'autorise aucune lecture anonyme directe.
  if (!user) {
    if (!isTrackingNumber) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }
    const { data, error } = await supabase.rpc("track_parcel", { p_tracking: id })
    const parcel = Array.isArray(data) ? data[0] : data
    if (error || !parcel) return NextResponse.json({ error: "Livraison non trouvée" }, { status: 404 })
    return NextResponse.json(parcel)
  }

  // Authenticated: fetch full data then verify ownership
  let query = supabase
    .from("delivery_requests")
    .select(`
      *,
      customer:profiles!delivery_requests_customer_id_fkey(full_name, phone),
      driver:drivers(
        id,
        user:profiles(full_name, avatar_url, phone),
        rating,
        current_latitude,
        current_longitude,
        vehicle_type,
        vehicle_brand,
        vehicle_model,
        license_plate
      )
    `)

  const { data, error } = await (isTrackingNumber
    ? query.eq("tracking_number", id)
    : query.eq("id", id)
  ).single()

  if (error || !data) {
    return NextResponse.json({ error: "Livraison non trouvée" }, { status: 404 })
  }

  // Only the customer, the assigned driver, or an admin can read full data
  const driver = await supabase.from("drivers").select("id").eq("user_id", user.id).maybeSingle()
  const isOwner = (data as any).customer_id === user.id
  const isAssignedDriver = driver.data && (data as any).driver_id === driver.data.id

  if (!isOwner && !isAssignedDriver) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  return NextResponse.json(data)
}

// Update delivery status (driver)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const body = await request.json()
  const { status, action } = body
  
  // Get driver
  const { data: driver } = await supabase
    .from("drivers")
    .select("id, total_earnings, total_deliveries")
    .eq("user_id", user.id)
    .single()
  
  if (!driver) {
    return NextResponse.json({ error: "Profil livreur non trouve" }, { status: 404 })
  }
  
  // Handle accept action
  if (action === "accept") {
    const { data, error } = await supabase
      .from("delivery_requests")
      .update({
        driver_id: driver.id,
        status: "accepted",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .eq("status", "pending")
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: "Impossible d'accepter cette livraison" }, { status: 400 })
    }
    
    return NextResponse.json(data)
  }
  
  // Update status
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  }
  
  // If delivered, update driver stats
  if (status === "delivered") {
    const { data: delivery } = await supabase
      .from("delivery_requests")
      .select("price")
      .eq("id", id)
      .single()
    
    if (delivery) {
      // Update driver earnings
      const rpcResult = await supabase.rpc("increment_driver_stats", {
        p_driver_id: driver.id,
        p_earnings: delivery.price,
        p_deliveries: 1
      })
      if (rpcResult.error) {
        // Fallback if RPC doesn't exist
        await supabase
          .from("drivers")
          .update({
            total_earnings: driver.total_earnings + delivery.price,
            total_deliveries: driver.total_deliveries + 1
          })
          .eq("id", driver.id)
      }
    }
  }
  
  const { data, error } = await supabase
    .from("delivery_requests")
    .update(updateData)
    .eq("id", id)
    .eq("driver_id", driver.id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
