import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { creditVendorPending } from "@/lib/payments/wallet-engine"
import { sendPushToUser } from "@/lib/push/send"
import { randomUUID } from "crypto"

const PAYMENT_METHODS = new Set(["orange_money", "mtn_momo", "quickgo_pay", "cash"])

// Tarifs des options de livraison — source de vérité serveur, jamais le client.
const DELIVERY_OPTION_FEES: Record<string, number> = {
  express: 2500,
  standard: 1500,
  scheduled: 1000,
}

// GET user orders
export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      vendor:vendors(id, name, slug, logo_url, phone, latitude, longitude),
      driver:drivers(
        id,
        user:profiles(full_name, avatar_url, phone),
        rating
      ),
      items:order_items(*)
    `)
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// CREATE order
export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const body = await request.json()
  const {
    vendor_id,
    items,
    delivery_address,
    delivery_latitude,
    delivery_longitude,
    payment_method = "cash",
    delivery_option,
    substitution_preference,
    notes,
    promo_code
  } = body

  const substitutionPref = ["substitute", "refund", "contact"].includes(substitution_preference)
    ? substitution_preference
    : null

  // vendor_id n'est plus requis : le vendeur de chaque article est déterminé
  // côté serveur depuis products.vendor_id, et le panier peut couvrir
  // plusieurs boutiques (une sous-commande par vendeur).
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "items requis" }, { status: 400 })
  }
  if (!PAYMENT_METHODS.has(payment_method)) {
    return NextResponse.json({ error: "Mode de paiement invalide" }, { status: 400 })
  }
  void vendor_id // accepté pour compatibilité, mais jamais utilisé comme source de vérité

  // Validate and price items from DB — never trust client-supplied prices
  const productIds: string[] = items.map((i: any) => i.product_id).filter(Boolean)
  if (productIds.length !== items.length) {
    return NextResponse.json({ error: "product_id requis pour chaque item" }, { status: 400 })
  }
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, name, price, is_available, vendor_id, stock_quantity")
    .in("id", productIds)
  if (prodErr || !products) {
    return NextResponse.json({ error: "Erreur de récupération des produits" }, { status: 500 })
  }
  const priceMap = new Map(products.map(p => [p.id, p]))

  // Single validation pass: verify each item and build normalized line items,
  // grouped by the product's real vendor. Quantity validated explicitly.
  type LineItem = { product_id: string; product_name: string; quantity: number; unit_price: number; total_price: number; notes?: string }
  const groups = new Map<string, { lineItems: LineItem[]; subtotal: number }>()
  let combinedSubtotal = 0

  for (const item of items) {
    const product = priceMap.get(item.product_id)
    if (!product) return NextResponse.json({ error: `Produit introuvable: ${item.product_id}` }, { status: 400 })
    if (!product.is_available) return NextResponse.json({ error: `Produit indisponible: ${product.name}` }, { status: 400 })
    if (!product.vendor_id) return NextResponse.json({ error: `Produit sans vendeur: ${product.name}` }, { status: 400 })

    const qty = Number(item.quantity)
    if (!Number.isInteger(qty) || qty < 1 || qty > 999) {
      return NextResponse.json({ error: `Quantité invalide pour ${product.name}` }, { status: 400 })
    }
    // Contrôle de stock (les produits à stock non suivi ont stock_quantity null)
    if (product.stock_quantity != null && product.stock_quantity < qty) {
      return NextResponse.json(
        { error: `Stock insuffisant pour ${product.name} (${product.stock_quantity} restant${product.stock_quantity > 1 ? "s" : ""}).` },
        { status: 400 },
      )
    }

    const lineTotal = product.price * qty
    combinedSubtotal += lineTotal
    const group = groups.get(product.vendor_id) ?? { lineItems: [], subtotal: 0 }
    group.lineItems.push({
      product_id: product.id,
      product_name: product.name,
      quantity: qty,
      unit_price: product.price,
      total_price: lineTotal,
      notes: item.notes,
    })
    group.subtotal += lineTotal
    groups.set(product.vendor_id, group)
  }

  // Frais de livraison par vendeur : l'option choisie (Express/Standard/
  // Programmé) prime, sinon le tarif du vendeur. Chaque boutique expédie
  // séparément, donc les frais s'appliquent par sous-commande.
  const vendorIds = [...groups.keys()]
  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, delivery_fee, owner_id")
    .in("id", vendorIds)
  const vendorFeeMap = new Map((vendors ?? []).map((v) => [v.id, v.delivery_fee as number | null]))
  const vendorOwnerMap = new Map((vendors ?? []).map((v) => [v.id, v.owner_id as string | null]))

  const optionFee = DELIVERY_OPTION_FEES[delivery_option as string]

  // Promo : validée une seule fois sur le sous-total combiné, incrément
  // atomique unique, remise répartie au prorata entre les sous-commandes.
  let combinedDiscount = 0
  if (promo_code) {
    const { data: promo } = await supabase
      .from("promo_codes")
      .select("*")
      .eq("code", promo_code)
      .eq("is_active", true)
      .single()

    if (promo && combinedSubtotal >= promo.min_order_amount) {
      const maxUses = promo.max_uses ?? 2_147_483_647
      const { data: promoUpdated } = await supabase
        .from("promo_codes")
        .update({ current_uses: promo.current_uses + 1 })
        .eq("id", promo.id)
        .lt("current_uses", maxUses)
        .select("current_uses")

      if (promoUpdated && promoUpdated.length > 0) {
        combinedDiscount = promo.discount_type === "percentage"
          ? Math.round((combinedSubtotal * promo.discount_value) / 100)
          : promo.discount_value
      }
      // If promoUpdated is empty, promo was exhausted concurrently — skip discount
    }
  }

  // ── Décrémentation du stock (A5) ───────────────────────────────────────────
  // Verrou optimiste par produit avec 3 tentatives : le stock est réservé
  // AVANT la création des commandes, et restauré si quoi que ce soit échoue
  // ensuite. Les produits à stock non suivi (null) sont ignorés.
  const qtyByProduct = new Map<string, number>()
  for (const group of groups.values()) {
    for (const li of group.lineItems) {
      qtyByProduct.set(li.product_id, (qtyByProduct.get(li.product_id) ?? 0) + li.quantity)
    }
  }

  const stockAdjusted: { id: string; qty: number }[] = []
  const restoreStock = async () => {
    for (const adj of stockAdjusted) {
      const { data: fresh } = await supabase
        .from("products").select("stock_quantity").eq("id", adj.id).single()
      if (fresh?.stock_quantity != null) {
        await supabase
          .from("products")
          .update({ stock_quantity: fresh.stock_quantity + adj.qty, is_available: true })
          .eq("id", adj.id)
      }
    }
  }

  for (const [pid, qty] of qtyByProduct) {
    if (priceMap.get(pid)?.stock_quantity == null) continue
    let ok = false
    for (let attempt = 0; attempt < 3 && !ok; attempt++) {
      const { data: fresh } = await supabase
        .from("products").select("stock_quantity, name").eq("id", pid).single()
      const cur = fresh?.stock_quantity
      if (cur == null) { ok = true; break }
      if (cur < qty) {
        await restoreStock()
        return NextResponse.json(
          { error: `Stock insuffisant pour ${fresh?.name ?? "un produit"} (${cur} restant${cur > 1 ? "s" : ""}).` },
          { status: 400 },
        )
      }
      const { data: upd } = await supabase
        .from("products")
        .update({ stock_quantity: cur - qty, is_available: cur - qty > 0 })
        .eq("id", pid)
        .eq("stock_quantity", cur)   // verrou optimiste
        .select("id")
      ok = !!upd && upd.length > 0
    }
    if (!ok) {
      await restoreStock()
      return NextResponse.json({ error: "Conflit de stock, veuillez réessayer." }, { status: 409 })
    }
    stockAdjusted.push({ id: pid, qty })
  }

  // Identifiant de groupe uniquement pour les paniers multi-vendeurs, inséré
  // conditionnellement : le flux mono-vendeur ne dépend pas de la migration
  // add_checkout_group.sql.
  const checkoutGroupId = groups.size > 1 ? randomUUID() : null

  const createdOrders: Array<Record<string, unknown> & { id: string; order_number: string; vendor_id: string; total: number; delivery_fee: number }> = []
  const allOrderItems: Array<LineItem & { order_id: string }> = []
  let distributedDiscount = 0
  let groupIndex = 0
  // Passe à false si la colonne substitution_preference n'existe pas encore
  // (migration add_substitutions.sql non appliquée) — la commande prime.
  let includeSubstitutionPref = substitutionPref != null

  const rollback = async () => {
    if (createdOrders.length > 0) {
      await supabase.from("orders").delete().in("id", createdOrders.map((o) => o.id))
    }
    await restoreStock()
  }

  for (const [groupVendorId, group] of groups) {
    groupIndex++
    const delivery_fee = optionFee ?? vendorFeeMap.get(groupVendorId) ?? 500
    const service_fee = Math.round(group.subtotal * 0.02) // 2% service fee

    // Répartition au prorata ; la dernière sous-commande absorbe l'arrondi
    const discount = groupIndex === groups.size
      ? combinedDiscount - distributedDiscount
      : Math.round(combinedDiscount * (group.subtotal / combinedSubtotal))
    distributedDiscount += discount

    const total = group.subtotal + delivery_fee + service_fee - discount
    const order_number = `QG-${Date.now().toString(36).toUpperCase()}${groups.size > 1 ? `-${groupIndex}` : ""}`

    const baseOrder = {
      order_number,
      customer_id: user.id,
      vendor_id: groupVendorId,
      status: "pending",
      subtotal: group.subtotal,
      delivery_fee,
      service_fee,
      discount,
      total,
      total_amount: total,   // colonne héritée lue par le suivi et le dashboard
      payment_method,
      payment_status: "pending",
      delivery_address,
      delivery_latitude,
      delivery_longitude,
      notes,
      estimated_delivery_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      ...(checkoutGroupId ? { checkout_group_id: checkoutGroupId } : {}),
    }

    let { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        ...baseOrder,
        ...(includeSubstitutionPref ? { substitution_preference: substitutionPref } : {}),
      })
      .select()
      .single()

    // Base sans la colonne substitution_preference → on retente sans elle
    if (orderError && includeSubstitutionPref && orderError.message?.includes("substitution_preference")) {
      includeSubstitutionPref = false
      ;({ data: order, error: orderError } = await supabase
        .from("orders")
        .insert(baseOrder)
        .select()
        .single())
    }

    if (orderError || !order) {
      console.error("[orders] insert failed:", orderError?.message)
      await rollback()
      return NextResponse.json({ error: "Erreur de création de commande" }, { status: 500 })
    }

    createdOrders.push(order)
    allOrderItems.push(...group.lineItems.map((li) => ({ order_id: order.id, ...li })))
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(allOrderItems)

  if (itemsError) {
    // Roll back orphaned orders so we never leave phantom orders with no items
    console.error("[orders] order_items insert failed, rolling back:", itemsError.message)
    await rollback()
    return NextResponse.json({ error: "Erreur lors de l'ajout des articles" }, { status: 500 })
  }

  const combinedTotal = createdOrders.reduce((s, o) => s + o.total, 0)

  // Paiement par portefeuille QuickGo Pay : débit atomique du total combiné.
  // Orange Money / MTN MoMo passent par /api/payments/initiate (CinetPay) ;
  // le cash reste "pending" jusqu'à la remise en main propre.
  if (payment_method === "quickgo_pay") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", user.id)
      .single()

    const balance = profile?.wallet_balance ?? 0
    if (balance < combinedTotal) {
      await rollback()
      return NextResponse.json(
        { error: `Solde QuickGo Pay insuffisant (${balance} FCFA pour un total de ${combinedTotal} FCFA).` },
        { status: 400 },
      )
    }

    // Débit avec verrou optimiste — échoue si le solde a changé entre-temps
    const { data: debited } = await supabase
      .from("profiles")
      .update({ wallet_balance: balance - combinedTotal })
      .eq("id", user.id)
      .eq("wallet_balance", balance)
      .select("id")

    if (!debited || debited.length === 0) {
      await rollback()
      return NextResponse.json({ error: "Solde modifié pendant la commande, réessayez." }, { status: 409 })
    }

    await supabase.from("wallet_transactions").insert({
      user_id: user.id,
      type: "debit",
      amount: combinedTotal,
      balance_after: balance - combinedTotal,
      description: `Paiement commande${createdOrders.length > 1 ? "s" : ""} ${createdOrders.map((o) => o.order_number).join(", ")}`,
    })

    await supabase
      .from("orders")
      .update({ payment_status: "paid", status: "confirmed" })
      .in("id", createdOrders.map((o) => o.id))

    // Créditer chaque vendeur (fonds en attente), comme le webhook CinetPay
    for (const order of createdOrders) {
      order.payment_status = "paid"
      order.status = "confirmed"
      await creditVendorPending({
        orderId: order.id,
        vendorId: order.vendor_id,
        grossAmount: order.total,
        deliveryFee: order.delivery_fee,
      })
    }
  }

  // Clear cart
  await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", user.id)

  // Create notification (une seule, couvrant toutes les sous-commandes)
  const orderNumbers = createdOrders.map((o) => o.order_number).join(", ")
  await supabase
    .from("notifications")
    .insert({
      user_id: user.id,
      title: "Commande confirmee",
      message: createdOrders.length > 1
        ? `Vos commandes ${orderNumbers} ont ete recues (${createdOrders.length} boutiques, livraisons separees).`
        : `Votre commande ${orderNumbers} a ete recue et est en cours de traitement.`,
      type: "order",
      data: { order_ids: createdOrders.map((o) => o.id), order_numbers: orderNumbers },
    })

  await sendPushToUser(user.id, {
    title: "Commande reçue 🛒",
    body: createdOrders.length > 1
      ? `Vos commandes ${orderNumbers} ont été reçues (${createdOrders.length} boutiques).`
      : `Votre commande ${orderNumbers} a été reçue et est en cours de traitement.`,
    url: "/marketplace/orders",
  })

  // Alerter chaque boutique — une commande qui dort sans que le vendeur le
  // sache est une commande perdue (le Realtime du dashboard ne couvre que
  // l'onglet ouvert).
  for (const order of createdOrders) {
    const ownerId = vendorOwnerMap.get(order.vendor_id)
    if (!ownerId) continue
    const itemCount = allOrderItems.filter((li) => li.order_id === order.id)
      .reduce((s, li) => s + li.quantity, 0)
    const message = `Commande ${order.order_number} — ${itemCount} article${itemCount > 1 ? "s" : ""}, ${new Intl.NumberFormat("fr-FR").format(order.total)} FCFA (${payment_method === "cash" ? "paiement à la livraison" : "paiement en ligne"}).`
    await supabase.from("notifications").insert({
      user_id: ownerId,
      title: "Nouvelle commande 🛎️",
      message,
      type: "order",
      data: { order_id: order.id },
    })
    await sendPushToUser(ownerId, {
      title: "Nouvelle commande 🛎️",
      body: message,
      url: `/vendor/orders/${order.id}`,
      tag: `new-order-${order.id}`,
    })
  }

  // Réponse : ancre (première commande) à la racine pour compatibilité,
  // plus le détail du groupe.
  const anchor = createdOrders[0]
  return NextResponse.json({
    ...anchor,
    orders: createdOrders,
    order_count: createdOrders.length,
    combined_total: combinedTotal,
    checkout_group_id: checkoutGroupId,
  }, { status: 201 })
}
