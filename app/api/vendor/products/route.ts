import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}

// GET  — own products (all statuses, for vendor management)
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")
  const categoryId = searchParams.get("category_id")

  let query = supabase
    .from("products")
    .select("*, category:categories(id, name, slug, color, icon)")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })

  if (search)     query = query.ilike("name", `%${search}%`)
  if (categoryId) query = query.eq("category_id", categoryId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST — create a new product
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const body = await req.json()
  const {
    name, description, price, original_price,
    category_id, stock_quantity, is_featured, images,
  } = body as {
    name: string; description?: string; price: number; original_price?: number | null
    category_id?: string; stock_quantity?: number; is_featured?: boolean; images?: string[]
  }

  if (!name || typeof price !== "number" || price <= 0)
    return NextResponse.json({ error: "Nom et prix obligatoires" }, { status: 400 })

  const { data, error } = await supabase
    .from("products")
    const baseSlug = slugify(name.trim())
    const slug = `${baseSlug}-${Date.now().toString(36)}`
    .insert({
      vendor_id: vendor.id,
      name: name.trim(),
      slug,
      description: description?.trim() ?? null,
      price,
      original_price: original_price ?? null,
      category_id: category_id ?? null,
      stock_quantity: stock_quantity ?? 0,
      is_available: (stock_quantity ?? 0) > 0,
      is_featured: is_featured ?? false,
      images: images ?? [],
      rating: 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
