import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { creditVendorPending, releasePendingFunds } from "@/lib/payments/wallet-engine"
import { sendPushToUser } from "@/lib/push/send"

// POST /api/driver/deliver — confirmation de livraison côté serveur.
// Centralise toute la logique financière du "dernier kilomètre" :
//   1. commande → delivered + actual_delivery_time
//   2. cash : le livreur encaisse → cash_on_hand++, journal de collecte,
//      commande marquée payée, vendeur crédité (fonds en attente)
//   3. tous modes payés : fonds vendeur libérés (pending → available)
export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const orderId = typeof body?.order_id === "string" ? body.order_id : null
  if (!orderId) return NextResponse.json({ error: "order_id requis" }, { status: 400 })

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, cash_on_hand")
    .eq("user_id", user.id)
    .single()
  if (!driver) return NextResponse.json({ error: "Profil livreur non trouvé" }, { status: 404 })

  // orders.driver_id référence auth.users(id) — c'est user.id, pas driver.id
  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, status, payment_method, payment_status, total, delivery_fee, vendor_id, customer_id")
    .eq("id", orderId)
    .eq("driver_id", user.id)
    .single()
  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  if (!["picked_up", "delivering", "ready"].includes(order.status)) {
    return NextResponse.json({ error: `Commande non livrable (statut ${order.status})` }, { status: 409 })
  }

  const isCash = order.payment_method === "cash"

  // Transition atomique — le filtre statut évite la double confirmation
  const { data: updated } = await supabase
    .from("orders")
    .update({
      status: "delivered",
      actual_delivery_time: new Date().toISOString(),
      ...(isCash ? { payment_status: "paid" } : {}),
    })
    .eq("id", orderId)
    .in("status", ["picked_up", "delivering", "ready"])
    .select("id")

  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: "Commande déjà clôturée" }, { status: 409 })
  }

  // ── Encaissement cash ───────────────────────────────────────────────────────
  let cashBalance: number | null = null
  if (isCash && order.total > 0) {
    const { data: adj } = await supabase.rpc("adjust_driver_cash", {
      p_driver_id: driver.id,
      p_amount: order.total,
    })
    if (adj?.success) {
      cashBalance = adj.balance
      await supabase.from("driver_cash_events").insert({
        driver_id: driver.id,
        order_id: orderId,
        type: "collection",
        amount: order.total,
        balance_after: adj.balance,
        status: "confirmed",
        created_by: user.id,
        note: `Encaissement commande ${order.order_number}`,
      })
    } else {
      // La livraison reste valide même si la migration cash n'est pas encore
      // appliquée — on trace pour réconciliation manuelle.
      console.error(`[deliver] adjust_driver_cash échoué pour ${orderId}:`, adj?.error)
    }

    // Le vendeur est crédité comme pour un paiement en ligne : la plateforme
    // lui doit sa part, le livreur doit le cash à la plateforme.
    if (order.payment_status !== "paid") {
      await creditVendorPending({
        orderId: order.id,
        vendorId: order.vendor_id,
        grossAmount: order.total,
        deliveryFee: order.delivery_fee ?? 0,
      })
    }
  }

  // ── Libération des fonds vendeur (pending → available) ────────────────────
  const release = await releasePendingFunds(orderId)
  if (!release.success) {
    console.error(`[deliver] release funds échoué pour ${orderId}:`, release.error)
  }

  // Notification client (in-app + push web)
  await supabase.from("notifications").insert({
    user_id: order.customer_id,
    title: "Commande livrée",
    message: `Votre commande ${order.order_number} a été livrée. Bon appétit / bonne réception !`,
    type: "order",
    data: { order_id: orderId },
  })
  await sendPushToUser(order.customer_id, {
    title: "Commande livrée ✅",
    body: `Votre commande ${order.order_number} vient d'être livrée.`,
    url: "/marketplace/orders",
    tag: `order-${orderId}`,
  })

  return NextResponse.json({
    success: true,
    order_id: orderId,
    status: "delivered",
    ...(cashBalance != null ? { cash_on_hand: cashBalance } : {}),
  })
}
