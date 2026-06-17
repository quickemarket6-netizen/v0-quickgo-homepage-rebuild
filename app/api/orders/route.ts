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

  if (!vendor_id || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "vendor_id et items requis" }, { status: 400 })
  }

  // Validate and price items from DB — never trust client-supplied prices
  const productIds: string[] = items.map((i: any) => i.product_id).filter(Boolean)
  if (productIds.length !== items.length) {
    return NextResponse.json({ error: "product_id requis pour chaque item" }, { status: 400 })
  }
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, name, price, is_available, vendor_id")
    .in("id", productIds)
  if (prodErr || !products) {
    return NextResponse.json({ error: "Erreur de récupération des produits" }, { status: 500 })
  }
  const priceMap = new Map(products.map(p => [p.id, p]))

  let subtotal = 0
  for (const item of items) {
    const product = priceMap.get(item.product_id)
    if (!product) return NextResponse.json({ error: `Produit introuvable: ${item.product_id}` }, { status: 400 })
    if (!product.is_available) return NextResponse.json({ error: `Produit indisponible: ${product.name}` }, { status: 400 })
    if (product.vendor_id !== vendor_id) return NextResponse.json({ error: "Produit hors du périmètre du vendeur" }, { status: 400 })
    const qty = Math.max(1, parseInt(item.quantity) || 1)
    subtotal += product.price * qty
  }

  // Get vendor delivery fee
  const { data: vendor } = await supabase
    .from("vendors")
    .select("delivery_fee")
    .eq("id", vendor_id)
    .single()

  const delivery_fee = vendor?.delivery_fee || 500
  let discount = 0

  // Apply promo code if provided — atomic increment prevents race conditions
  if (promo_code) {
    const { data: promo } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", promo_code)
      .eq("is_active", true)
      .single()

    if (promo && subtotal >= promo.min_order_amount) {
      // Atomic increment with guard: only succeeds if current_uses < max_uses
      const maxUses = promo.max_uses ?? 2_147_483_647
      const { data: promoUpdated } = await supabase
        .from("promo_codes")
        .update({ current_uses: promo.current_uses + 1 })
        .eq("id", promo.id)
        .lt("current_uses", maxUses)
        .select("current_uses")

      if (promoUpdated && promoUpdated.length > 0) {
        if (promo.discount_type === "percentage") {
          discount = Math.round((subtotal * promo.discount_value) / 100)
        } else {
          discount = promo.discount_value
        }
      }
      // If promoUpdated is empty, promo was exhausted concurrently — silently skip discount
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
    return NextResponse.json({ error: "Erreur de création de commande" }, { status: 500 })
  }

  // Create order items with DB-validated prices
  const orderItems = items.map((item: any) => {
    const product = priceMap.get(item.product_id)!
    const qty = Math.max(1, parseInt(item.quantity) || 1)
    return {
      order_id: order.id,
      product_id: item.product_id,
      product_name: product.name,
      quantity: qty,
      unit_price: product.price,
      total_price: product.price * qty,
      notes: item.notes
    }
  })
  
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
