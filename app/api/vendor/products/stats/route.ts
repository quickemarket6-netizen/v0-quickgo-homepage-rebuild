import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET /api/vendor/products/stats — performance produits sur 30 jours :
// vues (product_views), unités vendues + CA (commandes payées ou livrées),
// taux de conversion vues → ventes.
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const since = new Date(Date.now() - 30 * 86_400_000).toISOString()

  // Vues (30 j) — agrégées en mémoire ; tolère l'absence de la table
  const viewCounts = new Map<string, number>()
  const { data: views } = await supabase
    .from("product_views")
    .select("product_id")
    .eq("vendor_id", vendor.id)
    .gte("created_at", since)
    .limit(50_000)
  for (const v of views ?? []) {
    viewCounts.set(v.product_id, (viewCounts.get(v.product_id) ?? 0) + 1)
  }

  // Ventes (30 j) : lignes des commandes payées/livrées de la boutique
  const { data: orders } = await supabase
    .from("orders")
    .select("id, payment_status, status, created_at")
    .eq("vendor_id", vendor.id)
    .gte("created_at", since)
  const paidOrderIds = (orders ?? [])
    .filter((o) => o.payment_status === "paid" || o.status === "delivered")
    .map((o) => o.id)

  const salesByProduct = new Map<string, { units: number; revenue: number; orders: Set<string> }>()
  if (paidOrderIds.length > 0) {
    const { data: items } = await supabase
      .from("order_items")
      .select("product_id, order_id, quantity, total_price")
      .in("order_id", paidOrderIds)
    for (const it of items ?? []) {
      if (!it.product_id) continue
      const entry = salesByProduct.get(it.product_id) ?? { units: 0, revenue: 0, orders: new Set<string>() }
      entry.units += it.quantity
      entry.revenue += Number(it.total_price)
      entry.orders.add(it.order_id)
      salesByProduct.set(it.product_id, entry)
    }
  }

  // Catalogue de la boutique pour les noms/images
  const { data: products } = await supabase
    .from("products")
    .select("id, name, image_url, price, is_available, stock_quantity")
    .eq("vendor_id", vendor.id)

  const stats = (products ?? []).map((p) => {
    const viewsCount = viewCounts.get(p.id) ?? 0
    const sales = salesByProduct.get(p.id)
    const orderCount = sales?.orders.size ?? 0
    return {
      id: p.id,
      name: p.name,
      image_url: p.image_url,
      price: p.price,
      is_available: p.is_available,
      stock_quantity: p.stock_quantity,
      views: viewsCount,
      units_sold: sales?.units ?? 0,
      revenue: sales?.revenue ?? 0,
      order_count: orderCount,
      // Conversion : commandes contenant le produit / vues de sa fiche
      conversion: viewsCount > 0 ? Math.round((orderCount / viewsCount) * 1000) / 10 : null,
    }
  })
  .sort((a, b) => b.revenue - a.revenue || b.views - a.views)

  return NextResponse.json({
    period_days: 30,
    total_views: (views ?? []).length,
    products: stats,
  })
}
