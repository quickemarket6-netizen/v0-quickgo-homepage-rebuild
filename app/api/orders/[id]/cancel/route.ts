import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { sendPushToUser } from "@/lib/push/send"

// Statuts encore annulables par le client : avant que le vendeur ne commence
// la préparation. Au-delà (preparing/ready/delivering), passer par le support.
const CANCELLABLE_STATUSES = ["pending", "confirmed"]

// POST /api/orders/[id]/cancel — annulation d'une commande par le client.
// Restaure le stock, rembourse le portefeuille QuickGo Pay si la commande
// était payée, et reprend les fonds en attente crédités au vendeur.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  let reason: string | undefined
  try {
    const body = await request.json()
    if (typeof body?.reason === "string" && body.reason.length <= 500) reason = body.reason
  } catch { /* corps vide accepté */ }

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_status, payment_method, total, vendor_id, customer_id")
    .eq("id", id)
    .eq("customer_id", user.id)
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  }
  if (!CANCELLABLE_STATUSES.includes(order.status)) {
    return NextResponse.json(
      { error: "Cette commande ne peut plus être annulée (préparation déjà commencée). Contactez le support." },
      { status: 409 },
    )
  }

  // Transition atomique : le filtre sur le statut évite la course avec le
  // vendeur qui passerait la commande en préparation au même moment.
  let { data: cancelled, error: cancelErr } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      ...(reason ? { cancellation_reason: reason } : {}),
    })
    .eq("id", id)
    .eq("customer_id", user.id)
    .in("status", CANCELLABLE_STATUSES)
    .select("id")

  // Si la colonne cancellation_reason n'existe pas dans cette base, on
  // retente sans elle : l'annulation prime sur la traçabilité du motif.
  if (cancelErr && reason) {
    ;({ data: cancelled } = await supabase
      .from("orders")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("customer_id", user.id)
      .in("status", CANCELLABLE_STATUSES)
      .select("id"))
  }

  if (!cancelled || cancelled.length === 0) {
    return NextResponse.json(
      { error: "La commande a changé d'état entre-temps, annulation impossible." },
      { status: 409 },
    )
  }

  // ── Restauration du stock ──────────────────────────────────────────────────
  // Verrou optimiste par produit (même pattern que la décrémentation à la
  // commande). Les produits à stock non suivi (null) sont ignorés.
  const { data: items } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", id)

  for (const item of items ?? []) {
    if (!item.product_id) continue
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: fresh } = await supabase
        .from("products").select("stock_quantity").eq("id", item.product_id).single()
      if (fresh?.stock_quantity == null) break
      const { data: upd } = await supabase
        .from("products")
        .update({ stock_quantity: fresh.stock_quantity + item.quantity, is_available: true })
        .eq("id", item.product_id)
        .eq("stock_quantity", fresh.stock_quantity)
        .select("id")
      if (upd && upd.length > 0) break
    }
  }

  // ── Remboursement ──────────────────────────────────────────────────────────
  // Toute commande déjà payée (QuickGo Pay ou Mobile Money) est remboursée
  // sur le portefeuille QuickGo Pay du client — crédit immédiat, sans délai
  // d'agrégateur. Le cash n'a rien encaissé : rien à rembourser.
  let refunded = 0
  if (order.payment_status === "paid" && order.total > 0) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: profile } = await supabase
        .from("profiles").select("wallet_balance").eq("id", user.id).single()
      const balance = profile?.wallet_balance ?? 0
      const { data: upd } = await supabase
        .from("profiles")
        .update({ wallet_balance: balance + order.total })
        .eq("id", user.id)
        .eq("wallet_balance", balance)
        .select("id")
      if (upd && upd.length > 0) {
        refunded = order.total
        await supabase.from("wallet_transactions").insert({
          user_id: user.id,
          type: "credit",
          amount: order.total,
          balance_after: balance + order.total,
          description: `Remboursement commande ${order.order_number} (annulation)`,
        })
        break
      }
    }

    await supabase
      .from("orders")
      .update({ payment_status: "refunded" })
      .eq("id", id)

    // Reprise des fonds en attente crédités au vendeur au moment du paiement.
    // credit_vendor_pending (SECURITY DEFINER) accepte un montant négatif :
    // il annule à la fois pending_balance et total_earned.
    // commission_logs n'est pas lisible par le client (RLS) → service-role.
    const fin = createAdminClient() ?? supabase
    const { data: commLog } = await fin
      .from("commission_logs")
      .select("id, vendor_id, vendor_net_amount")
      .eq("order_id", id)
      .eq("status", "held")
      .single()

    if (commLog) {
      const { data: reversed } = await fin.rpc("credit_vendor_pending", {
        p_vendor_id: commLog.vendor_id,
        p_amount: -commLog.vendor_net_amount,
        p_order_id: id,
      })
      if (reversed?.success) {
        await fin
          .from("commission_logs")
          .update({ status: "cancelled" })
          .eq("id", commLog.id)
      } else {
        console.error(`[cancel] reprise fonds vendeur échouée pour ${id}:`, reversed?.error)
      }
    }
  }

  // ── Notifications ──────────────────────────────────────────────────────────
  await supabase.from("notifications").insert({
    user_id: user.id,
    title: "Commande annulée",
    message: refunded > 0
      ? `Votre commande ${order.order_number} a été annulée. ${new Intl.NumberFormat("fr-FR").format(refunded)} FCFA remboursés sur votre portefeuille QuickGo Pay.`
      : `Votre commande ${order.order_number} a été annulée.`,
    type: "order",
    data: { order_id: id },
  })

  const { data: vendor } = await supabase
    .from("vendors").select("owner_id, name").eq("id", order.vendor_id).single()
  if (vendor?.owner_id) {
    await supabase.from("notifications").insert({
      user_id: vendor.owner_id,
      title: "Commande annulée",
      message: `La commande ${order.order_number} a été annulée par le client.`,
      type: "order",
      data: { order_id: id },
    })
    await sendPushToUser(vendor.owner_id, {
      title: "Commande annulée",
      body: `La commande ${order.order_number} a été annulée par le client.`,
      url: "/vendor/orders",
      tag: `order-${id}`,
    })
  }

  return NextResponse.json({
    success: true,
    order_id: id,
    status: "cancelled",
    refunded,
  })
}
