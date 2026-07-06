/**
 * CinetPay Payment Webhook
 * Called by CinetPay after a customer completes payment
 * This is the most critical financial endpoint — guards against replay attacks
 */

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import { verifyPayment, validateWebhookSignature } from "@/lib/payments/cinetpay"
import { creditVendorPending, calculateCommission } from "@/lib/payments/wallet-engine"

// CinetPay sends POST with form data or JSON
export async function POST(req: NextRequest) {
  let body: Record<string, string>

  const contentType = req.headers.get("content-type") ?? ""
  if (contentType.includes("application/json")) {
    body = await req.json()
  } else {
    const formData = await req.formData()
    body = Object.fromEntries(formData.entries()) as Record<string, string>
  }

  const cpm_trans_id = body.cpm_trans_id ?? body.transaction_id
  const cpm_site_id = body.cpm_site_id ?? body.site_id

  if (!cpm_trans_id) {
    return NextResponse.json({ error: "Missing transaction_id" }, { status: 400 })
  }

  // Reject webhooks that don't target our CinetPay site
  const expectedSiteId = process.env.CINETPAY_SITE_ID
  if (expectedSiteId && cpm_site_id && cpm_site_id !== expectedSiteId) {
    return NextResponse.json({ error: "Invalid site_id" }, { status: 401 })
  }

  // Validate signature when CinetPay provides one (defense in depth on top of
  // the double-verification with verifyPayment below)
  const receivedSig = body.signature ?? req.headers.get("x-token") ?? ""
  if (receivedSig && !validateWebhookSignature(body, receivedSig)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  // Le webhook n'a AUCUNE session utilisateur : sous le client anon, le RLS
  // bloque silencieusement les updates (payment_transactions n'a pas de
  // policy UPDATE, orders exige auth.uid()). Le client service-role est
  // indispensable ici.
  const admin = createAdminClient()
  if (!admin) {
    console.error("[webhook] SUPABASE_SERVICE_ROLE_KEY manquante — le règlement des paiements ne peut pas aboutir")
  }
  const supabase = admin ?? await createClient()

  // Look up payment transaction
  const { data: txn } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("transaction_id", cpm_trans_id)
    .single()

  if (!txn) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
  }

  // Idempotency: already processed
  if (txn.status === "completed") {
    return NextResponse.json({ message: "Already processed" })
  }

  // Store raw webhook data
  await supabase
    .from("payment_transactions")
    .update({
      raw_response: body,
      webhook_received_at: new Date().toISOString(),
    })
    .eq("id", txn.id)

  // Verify with CinetPay API (double-verification, not just trust webhook)
  const verification = await verifyPayment(cpm_trans_id)

  if (!verification.success || verification.status !== "ACCEPTED") {
    await supabase
      .from("payment_transactions")
      .update({ status: "failed", raw_response: { ...body, verification } })
      .eq("id", txn.id)

    // Update order payment status
    if (txn.order_id) {
      await supabase
        .from("orders")
        .update({ payment_status: "failed" })
        .eq("id", txn.order_id)
    }

    return NextResponse.json({ message: "Payment not accepted" })
  }

  // Verify paid amount matches expected amount to prevent partial-payment attacks
  if (verification.amount !== undefined && Number(verification.amount) < Number(txn.amount)) {
    console.error(`[webhook] amount mismatch: expected ${txn.amount}, got ${verification.amount}`)
    await supabase
      .from("payment_transactions")
      .update({ status: "failed", raw_response: { ...body, verification } })
      .eq("id", txn.id)
    return NextResponse.json({ message: "Amount mismatch" })
  }

  // Mark payment as completed
  await supabase
    .from("payment_transactions")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", txn.id)

  // ── Recharge de portefeuille (transaction sans commande) ────────────────────
  // Les recharges QuickGo Pay portent un transaction_id préfixé TOPUP et
  // aucun order_id : on crédite le wallet du client, une seule fois
  // (idempotence par référence de transaction).
  if (!txn.order_id && typeof txn.transaction_id === "string" && txn.transaction_id.startsWith("TOPUP") && txn.customer_id) {
    const { data: alreadyCredited } = await supabase
      .from("wallet_transactions")
      .select("id")
      .eq("reference", txn.transaction_id)
      .limit(1)

    if (!alreadyCredited || alreadyCredited.length === 0) {
      let credited = false
      for (let attempt = 0; attempt < 3 && !credited; attempt++) {
        const { data: profile } = await supabase
          .from("profiles").select("wallet_balance").eq("id", txn.customer_id).single()
        const balance = Number(profile?.wallet_balance ?? 0)
        const { data: upd } = await supabase
          .from("profiles")
          .update({ wallet_balance: balance + Number(txn.amount) })
          .eq("id", txn.customer_id)
          .eq("wallet_balance", profile?.wallet_balance ?? 0)
          .select("id")
        if (upd && upd.length > 0) {
          credited = true
          await supabase.from("wallet_transactions").insert({
            user_id: txn.customer_id,
            type: "credit",
            amount: Number(txn.amount),
            balance_after: balance + Number(txn.amount),
            reference: txn.transaction_id,
            description: "Recharge QuickGo Pay (Mobile Money)",
          })
          await supabase.from("notifications").insert({
            user_id: txn.customer_id,
            title: "Recharge réussie 💳",
            message: `${new Intl.NumberFormat("fr-FR").format(Number(txn.amount))} FCFA ajoutés à votre portefeuille QuickGo Pay.`,
            type: "wallet",
            data: { transaction_id: txn.transaction_id },
          })
        }
      }
      if (!credited) {
        console.error(`[webhook] crédit de recharge non appliqué pour ${txn.transaction_id}`)
      }
    }
    return NextResponse.json({ message: "OK" })
  }

  // Update order payment status + status to confirmed.
  // Panier multi-vendeurs : le paiement couvre tout le groupe de checkout —
  // chaque sous-commande passe à "paid" et chaque vendeur est crédité.
  if (txn.order_id) {
    type PayableOrder = {
      id: string
      vendor_id: string | null
      total: number
      delivery_fee: number | null
      vendors: { commission_rate: number | null } | null
    }
    let ordersToSettle: PayableOrder[] = []

    // Lookup groupe tolérant : colonne absente (migration non appliquée) → mono-commande
    const { data: groupInfo } = await supabase
      .from("orders")
      .select("checkout_group_id")
      .eq("id", txn.order_id)
      .single()

    if (groupInfo?.checkout_group_id) {
      const { data: groupOrders } = await supabase
        .from("orders")
        .select("id, vendor_id, total, delivery_fee, payment_status, vendors(commission_rate)")
        .eq("checkout_group_id", groupInfo.checkout_group_id)
      ordersToSettle = ((groupOrders ?? []) as unknown as (PayableOrder & { payment_status: string })[])
        .filter((o) => o.payment_status !== "paid")
    } else {
      const { data: order } = await supabase
        .from("orders")
        .select("id, vendor_id, total, delivery_fee, vendors(commission_rate)")
        .eq("id", txn.order_id)
        .single()
      if (order) ordersToSettle = [order as unknown as PayableOrder]
    }

    for (const order of ordersToSettle) {
      await supabase
        .from("orders")
        .update({ payment_status: "paid", status: "confirmed" })
        .eq("id", order.id)

      if (order.vendor_id) {
        await creditVendorPending({
          orderId: order.id,
          vendorId: order.vendor_id,
          grossAmount: order.total,
          deliveryFee: order.delivery_fee ?? 0,
          customCommissionRate: order.vendors?.commission_rate ?? undefined,
        }, supabase)
      }
    }
  }

  return NextResponse.json({ message: "OK" })
}

// CinetPay sometimes sends GET to verify endpoint is alive
export async function GET() {
  return NextResponse.json({ status: "webhook_active" })
}
