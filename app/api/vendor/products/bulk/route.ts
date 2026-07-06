import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const MAX_ROWS = 200

// POST /api/vendor/products/bulk — import CSV côté vendeur.
// body: { products: [{ name, price, description?, original_price?,
//         stock_quantity?, category?, images? }] }
// Chaque ligne est validée indépendamment : les lignes valides sont créées,
// les invalides remontées avec leur numéro — un import partiel vaut mieux
// qu'un tout-ou-rien sur 200 lignes.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("owner_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const body = await req.json().catch(() => null)
  const rows = body?.products
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: "products (tableau) requis" }, { status: 400 })
  }
  if (rows.length > MAX_ROWS) {
    return NextResponse.json({ error: `Maximum ${MAX_ROWS} produits par import` }, { status: 400 })
  }

  // Résolution des catégories par nom OU slug (insensible à la casse)
  const { data: categories } = await supabase.from("categories").select("id, name, slug")
  const catMap = new Map<string, string>()
  for (const c of categories ?? []) {
    catMap.set(c.name.toLowerCase(), c.id)
    catMap.set(c.slug.toLowerCase(), c.id)
  }

  const toInsert: Record<string, unknown>[] = []
  const errors: { row: number; error: string }[] = []

  rows.forEach((raw: Record<string, unknown>, i) => {
    const rowNum = i + 2 // 1-indexé + ligne d'en-tête du CSV
    const name = typeof raw?.name === "string" ? raw.name.trim() : ""
    const price = Number(raw?.price)
    if (!name) { errors.push({ row: rowNum, error: "nom manquant" }); return }
    if (!Number.isFinite(price) || price <= 0) { errors.push({ row: rowNum, error: `prix invalide (« ${raw?.price} »)` }); return }

    const originalPrice = raw?.original_price !== undefined && raw?.original_price !== ""
      ? Number(raw.original_price) : null
    if (originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice <= price)) {
      errors.push({ row: rowNum, error: "prix barré invalide (doit être > prix)" }); return
    }

    const stock = raw?.stock_quantity !== undefined && raw?.stock_quantity !== ""
      ? Number(raw.stock_quantity) : 0
    if (!Number.isInteger(stock) || stock < 0) {
      errors.push({ row: rowNum, error: "stock invalide" }); return
    }

    let categoryId: string | null = null
    if (typeof raw?.category === "string" && raw.category.trim()) {
      categoryId = catMap.get(raw.category.trim().toLowerCase()) ?? null
      if (!categoryId) { errors.push({ row: rowNum, error: `catégorie inconnue (« ${raw.category} »)` }); return }
    }

    const images = Array.isArray(raw?.images)
      ? (raw.images as unknown[]).filter((u): u is string => typeof u === "string" && u.startsWith("http")).slice(0, 5)
      : []

    toInsert.push({
      vendor_id: vendor.id,
      name: name.slice(0, 200),
      description: typeof raw?.description === "string" ? raw.description.trim().slice(0, 2000) || null : null,
      price,
      original_price: originalPrice,
      stock_quantity: stock,
      is_available: stock > 0,
      category_id: categoryId,
      images,
      image_url: images[0] ?? null,
    })
  })

  let created = 0
  if (toInsert.length > 0) {
    const { data: inserted, error } = await supabase
      .from("products")
      .insert(toInsert)
      .select("id")
    if (error) {
      return NextResponse.json(
        { error: `Insertion échouée : ${error.message}`, errors },
        { status: 500 },
      )
    }
    created = inserted?.length ?? 0
  }

  return NextResponse.json({ success: true, created, skipped: errors.length, errors })
}
