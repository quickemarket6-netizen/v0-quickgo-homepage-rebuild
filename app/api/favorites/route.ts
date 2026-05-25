import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const { data, error } = await supabase
    .from("favorites")
    .select(`
      *,
      product:products(
        *,
        vendor:vendors(id, name, slug, delivery_fee)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const { product_id } = await request.json()
  
  const { data, error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, product_id })
    .select()
    .single()
  
  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Deja dans les favoris" }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const { searchParams } = new URL(request.url)
  const product_id = searchParams.get("product_id")
  
  if (!product_id) {
    return NextResponse.json({ error: "product_id requis" }, { status: 400 })
  }
  
  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", product_id)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ deleted: true })
}
