import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Get driver profile
export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const { data: driver, error } = await supabase
    .from("drivers")
    .select(`
      *,
      user:profiles(full_name, avatar_url, phone, email, wallet_balance)
    `)
    .eq("user_id", user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: "Profil livreur non trouve" }, { status: 404 })
  }
  
  // Get today's stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const { data: todayOrders } = await supabase
    .from("orders")
    .select("total, delivery_fee")
    .eq("driver_id", user.id)   // orders.driver_id → auth.users(id)
    .eq("status", "delivered")
    .gte("actual_delivery_time", today.toISOString())
  
  const todayEarnings = todayOrders?.reduce((sum, o) => sum + (o.delivery_fee || 0), 0) || 0
  const todayDeliveries = todayOrders?.length || 0
  
  // Get active missions
  const { data: missions } = await supabase
    .from("driver_mission_progress")
    .select(`
      *,
      mission:driver_missions(*)
    `)
    .eq("driver_id", driver.id)
    .eq("is_completed", false)
  
  return NextResponse.json({
    ...driver,
    today_earnings: todayEarnings,
    today_deliveries: todayDeliveries,
    active_missions: missions || []
  })
}

// Register as driver or update profile
export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const body = await request.json()
  const {
    vehicle_type,
    vehicle_brand,
    vehicle_model,
    license_plate,
    license_number
  } = body
  
  // Check if already a driver
  const { data: existingDriver } = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", user.id)
    .single()
  
  if (existingDriver) {
    // Update existing
    const { data, error } = await supabase
      .from("drivers")
      .update({
        vehicle_type,
        vehicle_brand,
        vehicle_model,
        license_plate,
        license_number,
        updated_at: new Date().toISOString()
      })
      .eq("user_id", user.id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data)
  }
  
  // Create new driver profile
  const { data, error } = await supabase
    .from("drivers")
    .insert({
      user_id: user.id,
      vehicle_type,
      vehicle_brand,
      vehicle_model,
      license_plate,
      license_number
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Update user role
  await supabase
    .from("profiles")
    .update({ role: "driver" })
    .eq("id", user.id)
  
  return NextResponse.json(data, { status: 201 })
}

// Update driver status (online/offline, location)
export async function PUT(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const body = await request.json()
  const { is_online, current_latitude, current_longitude } = body

  const updateData: any = { updated_at: new Date().toISOString() }

  // Online/offline toggle. `drivers.status` is the single source of truth read
  // by dispatch (/api/delivery, /api/driver/available, control-center); we keep
  // the legacy `is_online` boolean in sync for backward compatibility.
  if (typeof is_online === "boolean") {
    // Never clobber an active or suspended driver: a courier mid-delivery stays
    // "delivering", and a suspended account can't bring itself back online.
    const { data: current } = await supabase
      .from("drivers")
      .select("status")
      .eq("user_id", user.id)
      .single()

    const locked = current?.status === "delivering" || current?.status === "suspended"
    if (!locked) {
      updateData.status = is_online ? "online" : "offline"
    }
    updateData.is_online = is_online
  }

  if (current_latitude && current_longitude) {
    updateData.current_latitude = current_latitude
    updateData.current_longitude = current_longitude
  }

  const { data, error } = await supabase
    .from("drivers")
    .update(updateData)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
