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
  
  const raw = (await request.json()) as Record<string, unknown>

  // Only allow fields a customer is permitted to set
  const ALLOWED = ["rating", "review", "cancellation_reason"] as const
  const safeBody: Record<string, unknown> = {}
  for (const key of ALLOWED) {
    if (key in raw) safeBody[key] = raw[key]
  }

  if (Object.keys(safeBody).length === 0) {
    return NextResponse.json({ error: "Aucun champ modifiable fourni" }, { status: 400 })
  }

  // Validate the whitelisted values
  if ("rating" in safeBody) {
    const r = safeBody.rating
    if (typeof r !== "number" || !Number.isInteger(r) || r < 1 || r > 5) {
      return NextResponse.json({ error: "Note invalide (1 à 5 attendu)" }, { status: 400 })
    }
  }
  for (const key of ["review", "cancellation_reason"] as const) {
    if (key in safeBody) {
      const v = safeBody[key]
      if (typeof v !== "string" || v.length > 1000) {
        return NextResponse.json({ error: `Champ ${key} invalide` }, { status: 400 })
      }
    }
  }

  const { data, error } = await supabase
    .from("orders")
    .update(safeBody)
    .eq("id", id)
    .eq("customer_id", user.id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
