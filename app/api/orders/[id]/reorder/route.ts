import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// POST /api/orders/[id]/reorder — réachat en 1 clic.
// Recharge le panier avec les articles d'une commande passée, aux prix et
// disponibilités ACTUELS : les articles indisponibles sont ignorés (et
// signalés), les quantités sont plafonnées au stock restant.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, customer_id")
    .eq("id", id)
    .eq("customer_id", user.id)
    .single()
  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, product_name, quantity")
    .eq("order_id", id)
  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Commande sans articles" }, { status: 400 })
  }

  const productIds = items.map((i) => i.product_id).filter(Boolean) as string[]
  const { data: products } = await supabase
    .from("products")
    .select(`
      id, name, price, image_url, is_available, stock_quantity,
      vendor:vendors(id, name)
    `)
    .in("id", productIds)
  const productMap = new Map((products ?? []).map((p) => [p.id, p]))

  const added: Array<{
    product_id: string; name: string; price: number; quantity: number
    image_url: string | null; vendor_id: string | null; vendor_name: string | null
  }> = []
  const skipped: string[] = []
  const adjusted: string[] = []

  for (const item of items) {
    const product = item.product_id ? productMap.get(item.product_id) : null
    if (!product || !product.is_available) {
      skipped.push(item.product_name)
      continue
    }

    // Plafonne au stock restant (produits à stock non suivi : illimité)
    let qty = item.quantity
    if (product.stock_quantity != null) {
      if (product.stock_quantity <= 0) { skipped.push(item.product_name); continue }
      if (product.stock_quantity < qty) { qty = product.stock_quantity; adjusted.push(product.name) }
    }

    // Upsert dans le panier serveur (cumule si l'article y est déjà)
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .single()

    if (existing) {
      await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + qty, updated_at: new Date().toISOString() })
        .eq("id", existing.id)
    } else {
      await supabase
        .from("cart_items")
        .insert({ user_id: user.id, product_id: product.id, quantity: qty })
    }

    const vendor = (Array.isArray(product.vendor) ? product.vendor[0] : product.vendor) as { id: string; name: string } | null
    added.push({
      product_id: product.id,
      name: product.name,
      price: Number(product.price),   // prix ACTUEL, pas celui de l'ancienne commande
      quantity: qty,
      image_url: product.image_url,
      vendor_id: vendor?.id ?? null,
      vendor_name: vendor?.name ?? null,
    })
  }

  if (added.length === 0) {
    return NextResponse.json(
      { error: "Aucun article de cette commande n'est encore disponible.", skipped },
      { status: 409 },
    )
  }

  return NextResponse.json({
    success: true,
    order_number: order.order_number,
    added,
    skipped,
    adjusted,
  })
}
