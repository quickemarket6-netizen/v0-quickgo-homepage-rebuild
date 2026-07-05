import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// /api/addresses — carnet d'adresses de livraison de l'utilisateur.
// La table addresses est protégée par RLS (owner only).

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const street = typeof body?.street === "string" ? body.street.trim() : ""
  if (!street || street.length > 500) {
    return NextResponse.json({ error: "Adresse (street) requise" }, { status: 400 })
  }

  const label = typeof body?.label === "string" && body.label.trim() ? body.label.trim().slice(0, 60) : "Domicile"
  const district = typeof body?.district === "string" ? body.district.trim().slice(0, 200) : null
  const city = typeof body?.city === "string" && body.city.trim() ? body.city.trim().slice(0, 100) : "Yaoundé"
  const lat = typeof body?.lat === "number" && Number.isFinite(body.lat) ? body.lat : null
  const lng = typeof body?.lng === "number" && Number.isFinite(body.lng) ? body.lng : null
  const isDefault = body?.is_default === true

  // Une seule adresse par défaut (index unique partiel) : on rétrograde
  // l'ancienne par défaut avant d'en promouvoir une nouvelle.
  if (isDefault) {
    await supabase.from("addresses").update({ is_default: false })
      .eq("user_id", user.id).eq("is_default", true)
  }

  const { data, error } = await supabase
    .from("addresses")
    .insert({ user_id: user.id, label, street, district, city, lat, lng, is_default: isDefault })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const id = typeof body?.id === "string" ? body.id : null
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  if (body?.is_default === true) {
    await supabase.from("addresses").update({ is_default: false })
      .eq("user_id", user.id).eq("is_default", true)
  }

  const patch: Record<string, unknown> = {}
  for (const key of ["label", "street", "district", "city"] as const) {
    if (typeof body?.[key] === "string") patch[key] = body[key].trim()
  }
  for (const key of ["lat", "lng"] as const) {
    if (typeof body?.[key] === "number" && Number.isFinite(body[key])) patch[key] = body[key]
  }
  if (typeof body?.is_default === "boolean") patch.is_default = body.is_default

  const { data, error } = await supabase
    .from("addresses")
    .update(patch)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
