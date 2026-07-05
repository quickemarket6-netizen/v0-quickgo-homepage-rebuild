import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET /api/vendors/[id] — fiche publique d'une boutique : profil + catalogue.
// Seuls les vendeurs vérifiés sont exposés (même règle que le listing).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: vendor, error } = await supabase
    .from("vendors")
    .select(`
      id, name, slug, description, city, address, phone,
      rating, review_count, delivery_fee, delivery_time_min,
      logo_url, cover_url, is_verified, is_open, status,
      category:categories(id, name, slug, color)
    `)
    .eq("id", id)
    .eq("is_verified", true)
    .single()

  if (error || !vendor) {
    return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 })
  }

  const { data: products } = await supabase
    .from("products")
    .select(`
      id, name, price, original_price, image_url, images,
      rating, stock_quantity, is_available,
      category:categories(id, name, slug)
    `)
    .eq("vendor_id", id)
    .order("is_available", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(80)

  return NextResponse.json({ vendor, products: products ?? [] })
}
