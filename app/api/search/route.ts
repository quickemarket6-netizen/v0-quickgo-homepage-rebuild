import { createClient } from "@/lib/supabase/server"
import { escapeFilter } from "@/lib/utils"
import { NextResponse } from "next/server"

// GET /api/search?q= — recherche globale publique : produits + boutiques.
// Utilisée par la barre de recherche (suggestions instantanées).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = (searchParams.get("q") ?? "").trim()

  if (q.length < 2) {
    return NextResponse.json({ products: [], vendors: [] })
  }

  const pattern = `%${escapeFilter(q)}%`

  const supabase = await createClient()

  const [productsRes, vendorsRes] = await Promise.all([
    supabase
      .from("products")
      .select(`
        id, name, price, original_price, image_url, rating,
        vendor:vendors(id, name)
      `)
      .eq("is_available", true)
      .or(`name.ilike.${pattern},description.ilike.${pattern}`)
      .order("rating", { ascending: false, nullsFirst: false })
      .limit(8),
    supabase
      .from("vendors")
      .select("id, name, slug, logo_url, rating, review_count, delivery_fee, city")
      .eq("is_verified", true)
      .or(`name.ilike.${pattern},description.ilike.${pattern}`)
      .order("rating", { ascending: false, nullsFirst: false })
      .limit(4),
  ])

  return NextResponse.json({
    products: productsRes.data ?? [],
    vendors: vendorsRes.data ?? [],
  })
}
