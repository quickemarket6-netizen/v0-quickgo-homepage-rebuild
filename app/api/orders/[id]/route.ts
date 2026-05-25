import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      vendor:vendors(id, name, slug, logo_url, phone, address, latitude, longitude),
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
      ),
      items:order_items(
        *,
        product:products(id, name, image_url)
      )
    `)
    .eq("id", id)
    .eq("customer_id", user.id)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  
  return NextResponse.json(data)
}

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
  
  const { data, error } = await supabase
    .from("orders")
    .update(body)
    .eq("id", id)
    .eq("customer_id", user.id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
