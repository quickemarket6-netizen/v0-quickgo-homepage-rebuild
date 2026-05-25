import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET user orders
export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      vendor:vendors(id, name, slug, logo_url, phone),
      driver:drivers(
        id,
        user:profiles(full_name, avatar_url, phone),
        rating
      ),
      items:order_items(*)
    `)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// CREATE order
export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const body = await request.json()
  const { 
    vendor_id, 
    items, 
    delivery_address,
    delivery_latitude,
    delivery_longitude,
    payment_method = "cash",
    notes,
    promo_code
  } = body
  
  // Calculate totals
  let subtotal = 0
  for (const item of items) {
    subtotal += item.unit_price * item.quantity
  }
  
  // Get vendor delivery fee
  const { data: vendor } = await supabase
    .from("vendors")
    .select("delivery_fee")
    .eq("id", vendor_id)
    .single()
  
  const delivery_fee = vendor?.delivery_fee || 500
  let discount = 0
  
  // Apply promo code if provided
  if (promo_code) {
    const { data: promo } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", promo_code)
      .eq("is_active", true)
      .single()
    
    if (promo && subtotal >= promo.min_order_amount) {
      if (promo.discount_type === "percentage") {
        discount = (subtotal * promo.discount_value) / 100
      } else {
        discount = promo.discount_value
      }
      
      // Increment promo usage
      await supabase
        .from("promo_codes")
        .update({ current_uses: promo.current_uses + 1 })
        .eq("id", promo.id)
    }
  }
  
  const service_fee = Math.round(subtotal * 0.02) // 2% service fee
  const total = subtotal + delivery_fee + service_fee - discount
  
  // Generate order number
  const order_number = `QG-${Date.now().toString(36).toUpperCase()}`
  
  // Create order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      order_number,
      customer_id: user.id,
      vendor_id,
      status: "pending",
      subtotal,
      delivery_fee,
      service_fee,
      discount,
      total,
      payment_method,
      delivery_address,
      delivery_latitude,
      delivery_longitude,
      notes,
      estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000).toISOString()
    })
    .select()
    .single()
  
  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 })
  }
  
  // Create order items
  const orderItems = items.map((item: any) => ({
    order_id: order.id,
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity,
    unit_price: item.unit_price,
    total_price: item.unit_price * item.quantity,
    notes: item.notes
  }))
  
  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems)
  
  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 })
  }
  
  // Clear cart
  await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", user.id)
  
  // Create notification
  await supabase
    .from("notifications")
    .insert({
      user_id: user.id,
      title: "Commande confirmee",
      message: `Votre commande ${order_number} a ete recue et est en cours de traitement.`,
      type: "order",
      data: { order_id: order.id, order_number }
    })
  
  return NextResponse.json(order, { status: 201 })
}
