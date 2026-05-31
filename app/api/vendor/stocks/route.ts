import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET  /api/vendor/stocks  → full stock overview for the authenticated vendor
// PUT  /api/vendor/stocks  → { id, stock_quantity } update a product's stock
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, name")
    .eq("owner_id", user.id)
    .single()

  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, price, stock_quantity, is_available, images, category:categories(id, name, slug)")
    .eq("vendor_id", vendor.id)
    .order("stock_quantity", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Build category breakdown for chart
  const catMap = new Map<string, { name: string; total: number; low: number; out: number }>()
  for (const p of products ?? []) {
    const cat = (p.category as unknown as { name: string; slug: string } | null)?.name ?? "Autre"
    const cur = catMap.get(cat) ?? { name: cat, total: 0, low: 0, out: 0 }
    cur.total++
    if (p.stock_quantity === 0) cur.out++
    else if (p.stock_quantity <= 5) cur.low++
    catMap.set(cat, cur)
  }

  const all = products ?? []
  const kpi = {
    total: all.length,
    in_stock: all.filter((p) => p.stock_quantity > 5).length,
    low_stock: all.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 5).length,
    out_of_stock: all.filter((p) => p.stock_quantity === 0).length,
    total_units: all.reduce((s, p) => s + (p.stock_quantity ?? 0), 0),
  }

  return NextResponse.json({
    products: all,
    kpi,
    by_category: Array.from(catMap.values()),
  })
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("owner_id", user.id)
    .single()

  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const body = await req.json()
  const { id, stock_quantity } = body as { id: string; stock_quantity: number }
  if (!id || typeof stock_quantity !== "number" || stock_quantity < 0)
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 })

  const { data, error } = await supabase
    .from("products")
    .update({ stock_quantity, is_available: stock_quantity > 0 })
    .eq("id", id)
    .eq("vendor_id", vendor.id) // ensure ownership
    .select("id, stock_quantity, is_available")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
