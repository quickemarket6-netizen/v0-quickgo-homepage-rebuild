import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET available delivery requests for driver
export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  // Get driver — la colonne de disponibilité est `status` (online/delivering/
  // offline/suspended), pas `is_online` qui n'existe dans aucune migration
  const { data: driver } = await supabase
    .from("drivers")
    .select("id, status, current_latitude, current_longitude")
    .eq("user_id", user.id)
    .single()

  if (!driver) {
    return NextResponse.json({ error: "Profil livreur non trouvé" }, { status: 404 })
  }
  if (!["online", "delivering"].includes(driver.status ?? "")) {
    return NextResponse.json({ error: "Vous devez être en ligne" }, { status: 403 })
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

  // Paiement QuickGo Pay : débit atomique AVANT la création de la demande —
  // le cash reste dû au livreur à la remise du colis.
  if (payment_method === "quickgo_pay") {
    let debited = false
    for (let attempt = 0; attempt < 3 && !debited; attempt++) {
      const { data: profile } = await supabase
        .from("profiles").select("wallet_balance").eq("id", user.id).single()
      const balance = Number(profile?.wallet_balance ?? 0)
      if (balance < price) {
        return NextResponse.json(
          { error: `Solde QuickGo Pay insuffisant (${new Intl.NumberFormat("fr-FR").format(balance)} FCFA pour ${new Intl.NumberFormat("fr-FR").format(price)} FCFA).` },
          { status: 400 },
        )
      }
      const { data: upd } = await supabase
        .from("profiles")
        .update({ wallet_balance: balance - price })
        .eq("id", user.id)
        .eq("wallet_balance", profile?.wallet_balance ?? 0)
        .select("id")
      if (upd && upd.length > 0) {
        debited = true
        await supabase.from("wallet_transactions").insert({
          user_id: user.id,
          type: "debit",
          amount: price,
          balance_after: balance - price,
          reference: tracking_number,
          description: `Livraison colis ${tracking_number}`,
        })
      }
    }
    if (!debited) {
      return NextResponse.json({ error: "Solde modifié pendant l'opération, réessayez." }, { status: 409 })
    }
  }

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
    // Compensation : la demande n'a pas été créée → rembourse le débit wallet
    if (payment_method === "quickgo_pay") {
      const { data: profile } = await supabase
        .from("profiles").select("wallet_balance").eq("id", user.id).single()
      const balance = Number(profile?.wallet_balance ?? 0)
      await supabase.from("profiles")
        .update({ wallet_balance: balance + price })
        .eq("id", user.id)
      await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: "credit",
        amount: price,
        balance_after: balance + price,
        reference: tracking_number,
        description: `Remboursement — création de livraison ${tracking_number} échouée`,
      })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
