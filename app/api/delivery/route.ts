import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET available delivery requests for driver
export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  // Get driver
  const { data: driver } = await supabase
    .from("drivers")
    .select("id, current_latitude, current_longitude")
    .eq("user_id", user.id)
    .eq("is_online", true)
    .single()
  
  if (!driver) {
    return NextResponse.json({ error: "Vous devez etre en ligne" }, { status: 403 })
  }
  
  // Get pending delivery requests
  const { data: requests, error } = await supabase
    .from("delivery_requests")
    .select(`
      *,
      customer:profiles(full_name, phone)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Calculate distance for each request
  const requestsWithDistance = requests?.map(req => {
    let distance = null
    if (driver.current_latitude && driver.current_longitude && req.pickup_latitude && req.pickup_longitude) {
      // Simple distance calculation (Haversine formula)
      const R = 6371 // Earth's radius in km
      const dLat = toRad(req.pickup_latitude - driver.current_latitude)
      const dLon = toRad(req.pickup_longitude - driver.current_longitude)
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(driver.current_latitude)) * Math.cos(toRad(req.pickup_latitude)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
      distance = Math.round(R * c * 10) / 10
    }
    
    return { ...req, distance_from_driver: distance }
  })
  
  return NextResponse.json(requestsWithDistance)
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}

// CREATE delivery request (customer)
export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const body = await request.json()
  const {
    package_type,
    package_description,
    pickup_address,
    pickup_latitude,
    pickup_longitude,
    pickup_contact,
    pickup_phone,
    delivery_address,
    delivery_latitude,
    delivery_longitude,
    delivery_contact,
    delivery_phone,
    notes,
    payment_method = "cash"
  } = body
  
  // Calculate distance and price
  let distance_km = 5 // Default
  if (pickup_latitude && pickup_longitude && delivery_latitude && delivery_longitude) {
    const R = 6371
    const dLat = toRad(delivery_latitude - pickup_latitude)
    const dLon = toRad(delivery_longitude - pickup_longitude)
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(toRad(pickup_latitude)) * Math.cos(toRad(delivery_latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    distance_km = Math.round(R * c * 10) / 10
  }
  
  // Price calculation: base + per km
  const basePrice = 500
  const pricePerKm = 200
  const packageMultiplier = package_type === "large" ? 1.5 : package_type === "fragile" ? 1.3 : 1
  const price = Math.round((basePrice + (distance_km * pricePerKm)) * packageMultiplier)
  
  // Estimated duration (avg 3 min per km in Yaounde traffic)
  const estimated_duration = Math.round(distance_km * 3) + 10 // +10 min for pickup/dropoff
  
  // Generate tracking number
  const tracking_number = `QGD-${Date.now().toString(36).toUpperCase()}`
  
  const { data, error } = await supabase
    .from("delivery_requests")
    .insert({
      tracking_number,
      customer_id: user.id,
      package_type,
      package_description,
      pickup_address,
      pickup_latitude,
      pickup_longitude,
      pickup_contact,
      pickup_phone,
      delivery_address,
      delivery_latitude,
      delivery_longitude,
      delivery_contact,
      delivery_phone,
      distance_km,
      estimated_duration,
      price,
      payment_method,
      notes
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}
