import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  // Allow tracking by ID or tracking number
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
  
  // Check if it's a UUID or tracking number
  if (id.startsWith("QGD-")) {
    query = query.eq("tracking_number", id)
  } else {
    query = query.eq("id", id)
  }
  
  const { data, error } = await query.single()
  
  if (error) {
    return NextResponse.json({ error: "Livraison non trouvee" }, { status: 404 })
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
    .select("id")
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
      await supabase.rpc("increment_driver_stats", {
        p_driver_id: driver.id,
        p_earnings: delivery.price,
        p_deliveries: 1
      }).catch(() => {
        // Fallback if RPC doesn't exist
        supabase
          .from("drivers")
          .update({
            total_earnings: driver.total_earnings + delivery.price,
            total_deliveries: driver.total_deliveries + 1
          })
          .eq("id", driver.id)
      })
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
