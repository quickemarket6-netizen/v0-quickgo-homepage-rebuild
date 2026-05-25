import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET cart items
export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const { data, error } = await supabase
    .from("cart_items")
    .select(`
      *,
      product:products(
        id, name, slug, price, original_price, image_url,
        vendor:vendors(id, name, slug, delivery_fee)
      )
    `)
    .eq("user_id", user.id)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// ADD to cart
export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const { product_id, quantity = 1 } = await request.json()
  
  // Check if item already exists
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("user_id", user.id)
    .eq("product_id", product_id)
    .single()
  
  if (existing) {
    // Update quantity
    const { data, error } = await supabase
      .from("cart_items")
      .update({ quantity: existing.quantity + quantity, updated_at: new Date().toISOString() })
      .eq("id", existing.id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data)
  }
  
  // Insert new item
  const { data, error } = await supabase
    .from("cart_items")
    .insert({ user_id: user.id, product_id, quantity })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}

// UPDATE cart item
export async function PUT(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const { id, quantity } = await request.json()
  
  if (quantity <= 0) {
    // Delete if quantity is 0 or less
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ deleted: true })
  }
  
  const { data, error } = await supabase
    .from("cart_items")
    .update({ quantity, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// DELETE cart item
export async function DELETE(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  const clearAll = searchParams.get("clearAll")
  
  if (clearAll === "true") {
    const { error } = await supabase
      .from("cart_items")
      .delete()
      .eq("user_id", user.id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ cleared: true })
  }
  
  if (!id) {
    return NextResponse.json({ error: "ID requis" }, { status: 400 })
  }
  
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ deleted: true })
}
