import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      vendor:vendors(id, name, slug, rating, phone, address, delivery_fee, is_open),
      category:categories(id, name, slug, color)
    `)
    .eq("id", id)
    .single()

  // Variantes (taille, contenance…) — requête séparée et tolérante : la
  // table peut ne pas exister tant que add_vendor_features.sql n'est pas
  // appliquée, la fiche doit s'afficher quand même.
  let variants: unknown[] = []
  if (data) {
    const { data: v } = await supabase
      .from("product_variants")
      .select("id, label, price, stock_quantity, is_available, position")
      .eq("product_id", id)
      .order("position")
    variants = v ?? []
  }
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  // Produits similaires : même catégorie d'abord, complétés par la même
  // boutique si besoin — jusqu'à 8, jamais le produit courant.
  const p = data as { category_id?: string | null; vendor?: { id?: string } | null }
  const relatedMap = new Map<string, unknown>()
  const relatedSelect = `
    id, name, price, original_price, image_url, images, rating,
    stock_quantity, is_available,
    vendor:vendors(id, name, slug, delivery_fee)
  `
  if (p.category_id) {
    const { data: sameCat } = await supabase
      .from("products")
      .select(relatedSelect)
      .eq("category_id", p.category_id)
      .eq("is_available", true)
      .neq("id", id)
      .order("rating", { ascending: false, nullsFirst: false })
      .limit(8)
    for (const r of sameCat ?? []) relatedMap.set(r.id, r)
  }
  if (relatedMap.size < 8 && p.vendor?.id) {
    const { data: sameVendor } = await supabase
      .from("products")
      .select(relatedSelect)
      .eq("vendor_id", p.vendor.id)
      .eq("is_available", true)
      .neq("id", id)
      .order("rating", { ascending: false, nullsFirst: false })
      .limit(8)
    for (const r of sameVendor ?? []) if (relatedMap.size < 8) relatedMap.set(r.id, r)
  }
  const related = [...relatedMap.values()]

  // Statistiques de conversion : une vue par affichage de fiche.
  // Best-effort et non bloquant — tolère l'absence de la table
  // (migration add_vendor_features.sql non appliquée).
  try {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from("product_views").insert({
      product_id: id,
      vendor_id: (data as { vendor?: { id?: string } | null }).vendor?.id ?? null,
      viewer_id: user?.id ?? null,
    })
  } catch { /* table absente ou RLS — la fiche s'affiche quand même */ }

  return NextResponse.json({ ...data, variants, related })
}
