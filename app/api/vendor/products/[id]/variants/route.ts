import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

const MAX_VARIANTS = 20

async function getOwnedProduct(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, productId: string) {
  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", userId).single()
  if (!vendor) return null
  const { data: product } = await supabase
    .from("products").select("id").eq("id", productId).eq("vendor_id", vendor.id).single()
  return product ? { vendorId: vendor.id, productId: product.id } : null
}

// GET /api/vendor/products/[id]/variants
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const owned = await getOwnedProduct(supabase, user.id, id)
  if (!owned) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })

  const { data, error } = await supabase
    .from("product_variants")
    .select("id, label, price, stock_quantity, is_available, position")
    .eq("product_id", id)
    .order("position")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// PUT /api/vendor/products/[id]/variants — remplace le jeu complet de
// variantes. body: { variants: [{ label, price, stock_quantity? }] }
// Un tableau vide supprime toutes les variantes (produit simple).
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const owned = await getOwnedProduct(supabase, user.id, id)
  if (!owned) return NextResponse.json({ error: "Produit introuvable" }, { status: 404 })

  const body = await req.json().catch(() => null)
  const raw = body?.variants
  if (!Array.isArray(raw)) {
    return NextResponse.json({ error: "variants (tableau) requis" }, { status: 400 })
  }
  if (raw.length > MAX_VARIANTS) {
    return NextResponse.json({ error: `Maximum ${MAX_VARIANTS} variantes` }, { status: 400 })
  }

  const seen = new Set<string>()
  const cleaned: { label: string; price: number; stock_quantity: number | null; position: number }[] = []
  for (const [i, v] of raw.entries()) {
    const label = typeof v?.label === "string" ? v.label.trim().slice(0, 80) : ""
    const price = Number(v?.price)
    if (!label) return NextResponse.json({ error: `Variante ${i + 1} : libellé requis` }, { status: 400 })
    if (seen.has(label.toLowerCase())) {
      return NextResponse.json({ error: `Variante « ${label} » en double` }, { status: 400 })
    }
    seen.add(label.toLowerCase())
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ error: `Variante « ${label} » : prix invalide` }, { status: 400 })
    }
    const stock = v?.stock_quantity === null || v?.stock_quantity === undefined || v?.stock_quantity === ""
      ? null : Number(v.stock_quantity)
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
      return NextResponse.json({ error: `Variante « ${label} » : stock invalide` }, { status: 400 })
    }
    cleaned.push({ label, price, stock_quantity: stock, position: i })
  }

  // Remplacement du jeu : upsert par (product_id, label) puis purge du reste —
  // les variantes conservées gardent leur id (référencées par paniers/commandes)
  const keptLabels = cleaned.map((v) => v.label)

  if (cleaned.length > 0) {
    const { error: upsertErr } = await supabase
      .from("product_variants")
      .upsert(
        cleaned.map((v) => ({ product_id: id, ...v, is_available: v.stock_quantity == null || v.stock_quantity > 0 })),
        { onConflict: "product_id,label" },
      )
    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })
  }

  let del = supabase.from("product_variants").delete().eq("product_id", id)
  if (keptLabels.length > 0) {
    // PostgREST not.in attend une liste entre parenthèses, virgules échappées
    const list = keptLabels.map((l) => `"${l.replace(/"/g, '\\"')}"`).join(",")
    del = del.not("label", "in", `(${list})`)
  }
  const { error: delErr } = await del
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  const { data } = await supabase
    .from("product_variants")
    .select("id, label, price, stock_quantity, is_available, position")
    .eq("product_id", id)
    .order("position")

  return NextResponse.json({ success: true, variants: data ?? [] })
}
