import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendPushToUser } from "@/lib/push/send"

// POST /api/vendor/orders/[id]/substitute — gestion d'un article en rupture
// pendant la préparation (avant remise au livreur).
//
// body: { order_item_id, action: "remove" | "substitute",
//         replacement_product_id?, quantity? }
//
// - remove     : l'article est retiré, le client remboursé de la ligne
// - substitute : remplacé par un produit du même vendeur, à prix égal ou
//                inférieur ; la différence est remboursée
//
// Remboursements : crédit immédiat sur le portefeuille QuickGo Pay du client
// si la commande était payée ; commande cash → le total à encaisser baisse.
// Les fonds en attente du vendeur sont réduits d'autant (net de commission).

const EDITABLE_STATUSES = ["pending", "confirmed", "preparing"]

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, name")
    .eq("owner_id", user.id)
    .single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const body = await request.json().catch(() => null)
  const orderItemId = typeof body?.order_item_id === "string" ? body.order_item_id : null
  const action = body?.action
  if (!orderItemId || !["remove", "substitute"].includes(action)) {
    return NextResponse.json({ error: "order_item_id et action (remove|substitute) requis" }, { status: 400 })
  }

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, subtotal, total, total_amount, customer_id, vendor_id")
    .eq("id", id)
    .eq("vendor_id", vendor.id)
    .single()
  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  if (!EDITABLE_STATUSES.includes(order.status)) {
    return NextResponse.json(
      { error: `Commande non modifiable (statut ${order.status}) — la préparation est terminée.` },
      { status: 409 },
    )
  }

  const { data: item } = await supabase
    .from("order_items")
    .select("id, product_id, product_name, quantity, unit_price, total_price, notes")
    .eq("id", orderItemId)
    .eq("order_id", id)
    .single()
  if (!item) return NextResponse.json({ error: "Article introuvable dans cette commande" }, { status: 404 })

  // Restaure le stock d'un produit (verrou optimiste, produits non suivis ignorés)
  const restoreStock = async (productId: string | null, qty: number) => {
    if (!productId) return
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: fresh } = await supabase
        .from("products").select("stock_quantity").eq("id", productId).single()
      if (fresh?.stock_quantity == null) return
      const { data: upd } = await supabase
        .from("products")
        .update({ stock_quantity: fresh.stock_quantity + qty, is_available: true })
        .eq("id", productId)
        .eq("stock_quantity", fresh.stock_quantity)
        .select("id")
      if (upd && upd.length > 0) return
    }
  }

  let delta = 0                 // montant retiré du total de la commande (≥ 0)
  let changeSummary = ""

  if (action === "remove") {
    const { count } = await supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("order_id", id)
    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: "Dernier article de la commande — annulez la commande plutôt que de le retirer." },
        { status: 400 },
      )
    }

    const { error: delErr } = await supabase
      .from("order_items")
      .delete()
      .eq("id", orderItemId)
      .eq("order_id", id)
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

    await restoreStock(item.product_id, item.quantity)
    delta = Number(item.total_price)
    changeSummary = `« ${item.product_name} » retiré (rupture de stock)`
  } else {
    // ── Substitution ──────────────────────────────────────────────────────────
    const replacementId = typeof body?.replacement_product_id === "string" ? body.replacement_product_id : null
    if (!replacementId) {
      return NextResponse.json({ error: "replacement_product_id requis pour une substitution" }, { status: 400 })
    }
    const qty = Number(body?.quantity ?? item.quantity)
    if (!Number.isInteger(qty) || qty < 1 || qty > 999) {
      return NextResponse.json({ error: "Quantité invalide" }, { status: 400 })
    }

    const { data: replacement } = await supabase
      .from("products")
      .select("id, name, price, is_available, stock_quantity, vendor_id")
      .eq("id", replacementId)
      .eq("vendor_id", vendor.id)   // même boutique uniquement
      .single()
    if (!replacement || !replacement.is_available) {
      return NextResponse.json({ error: "Produit de remplacement indisponible" }, { status: 400 })
    }
    if (replacement.id === item.product_id) {
      return NextResponse.json({ error: "Le remplacement est identique à l'article d'origine" }, { status: 400 })
    }

    const newLineTotal = Number(replacement.price) * qty
    if (newLineTotal > Number(item.total_price)) {
      return NextResponse.json(
        { error: "Le remplacement doit être à prix égal ou inférieur à l'article d'origine (aucun paiement supplémentaire ne peut être demandé au client)." },
        { status: 400 },
      )
    }

    // Réserve le stock du remplaçant (verrou optimiste, 3 tentatives)
    if (replacement.stock_quantity != null) {
      let reserved = false
      for (let attempt = 0; attempt < 3 && !reserved; attempt++) {
        const { data: fresh } = await supabase
          .from("products").select("stock_quantity").eq("id", replacement.id).single()
        const cur = fresh?.stock_quantity
        if (cur == null) { reserved = true; break }
        if (cur < qty) {
          return NextResponse.json({ error: `Stock insuffisant pour ${replacement.name} (${cur} restants)` }, { status: 400 })
        }
        const { data: upd } = await supabase
          .from("products")
          .update({ stock_quantity: cur - qty, is_available: cur - qty > 0 })
          .eq("id", replacement.id)
          .eq("stock_quantity", cur)
          .select("id")
        reserved = !!upd && upd.length > 0
      }
      if (!reserved) return NextResponse.json({ error: "Conflit de stock, réessayez." }, { status: 409 })
    }

    const substitutionNote = `Substitué : ${item.product_name} → ${replacement.name}`
    const { error: updErr } = await supabase
      .from("order_items")
      .update({
        product_id: replacement.id,
        product_name: replacement.name,
        quantity: qty,
        unit_price: replacement.price,
        total_price: newLineTotal,
        notes: item.notes ? `${item.notes} · ${substitutionNote}` : substitutionNote,
      })
      .eq("id", orderItemId)
      .eq("order_id", id)
    if (updErr) {
      await restoreStock(replacement.id, qty)   // rend la réservation
      return NextResponse.json({ error: updErr.message }, { status: 500 })
    }

    await restoreStock(item.product_id, item.quantity)
    delta = Number(item.total_price) - newLineTotal
    changeSummary = `« ${item.product_name} » remplacé par « ${replacement.name} »`
  }

  // ── Ajustement des totaux de la commande ────────────────────────────────────
  if (delta > 0) {
    await supabase
      .from("orders")
      .update({
        subtotal: Math.max(0, Number(order.subtotal) - delta),
        total: Math.max(0, Number(order.total) - delta),
        total_amount: Math.max(0, Number(order.total_amount ?? order.total) - delta),
      })
      .eq("id", id)
  }

  // ── Remboursement de la différence si la commande était payée ──────────────
  let refunded = 0
  if (order.payment_status === "paid" && delta > 0) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: profile } = await supabase
        .from("profiles").select("wallet_balance").eq("id", order.customer_id).single()
      const balance = profile?.wallet_balance ?? 0
      const { data: upd } = await supabase
        .from("profiles")
        .update({ wallet_balance: balance + delta })
        .eq("id", order.customer_id)
        .eq("wallet_balance", balance)
        .select("id")
      if (upd && upd.length > 0) {
        refunded = delta
        await supabase.from("wallet_transactions").insert({
          user_id: order.customer_id,
          type: "credit",
          amount: delta,
          balance_after: balance + delta,
          description: `Remboursement partiel commande ${order.order_number} (article en rupture)`,
        })
        break
      }
    }

    // Réduction des fonds en attente du vendeur, nets de commission :
    // le vendeur ne doit conserver que sa part sur le nouveau total.
    const { data: commLog } = await supabase
      .from("commission_logs")
      .select("id, quickgo_commission_rate, gross_amount, quickgo_commission, payment_fees, vendor_net_amount")
      .eq("order_id", id)
      .eq("status", "held")
      .single()

    if (commLog) {
      const rate = Number(commLog.quickgo_commission_rate ?? 0.07)
      const deltaCommission = Math.round(delta * rate)
      const deltaFees = Math.round(delta * 0.02)
      const deltaVendorNet = Math.min(
        Number(commLog.vendor_net_amount),
        Math.max(0, delta - deltaCommission - deltaFees),
      )

      if (deltaVendorNet > 0) {
        const { data: reversed } = await supabase.rpc("credit_vendor_pending", {
          p_vendor_id: order.vendor_id,
          p_amount: -deltaVendorNet,
          p_order_id: id,
        })
        if (reversed?.success) {
          // Le log reste cohérent avec ce qui sera libéré à la livraison
          await supabase
            .from("commission_logs")
            .update({
              gross_amount: Number(commLog.gross_amount) - delta,
              quickgo_commission: Number(commLog.quickgo_commission) - deltaCommission,
              payment_fees: Number(commLog.payment_fees) - deltaFees,
              vendor_net_amount: Number(commLog.vendor_net_amount) - deltaVendorNet,
            })
            .eq("id", commLog.id)
        } else {
          console.error(`[substitute] reprise fonds vendeur échouée pour ${id}:`, reversed?.error)
        }
      }
    }
  }

  // ── Notification client (in-app + push) ─────────────────────────────────────
  const refundText = refunded > 0
    ? ` ${new Intl.NumberFormat("fr-FR").format(refunded)} FCFA remboursés sur votre portefeuille QuickGo Pay.`
    : delta > 0 && order.payment_status !== "paid"
      ? ` Le total à payer est réduit de ${new Intl.NumberFormat("fr-FR").format(delta)} FCFA.`
      : ""
  await supabase.from("notifications").insert({
    user_id: order.customer_id,
    title: "Commande modifiée",
    message: `${vendor.name} : ${changeSummary} dans votre commande ${order.order_number}.${refundText}`,
    type: "order",
    data: { order_id: id },
  })
  await sendPushToUser(order.customer_id, {
    title: "Commande modifiée",
    body: `${changeSummary} — commande ${order.order_number}.${refundText}`,
    url: "/marketplace/orders",
    tag: `order-${id}`,
  })

  return NextResponse.json({
    success: true,
    action,
    delta,
    refunded,
    summary: changeSummary,
  })
}
