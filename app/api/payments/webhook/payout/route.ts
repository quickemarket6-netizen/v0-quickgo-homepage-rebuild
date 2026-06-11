/**
 * CinetPay Payout Webhook — called when transfer status changes
 */

import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { completePayoutTransfer } from "@/lib/payments/wallet-engine"
import { checkTransferStatus } from "@/lib/payments/cinetpay"

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const { client_transaction_id, transaction_id } = body

  if (!client_transaction_id) {
    return NextResponse.json({ error: "Missing client_transaction_id" }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: payout } = await supabase
    .from("vendor_payouts")
    .select("id, status")
    .eq("id", client_transaction_id)
    .single()

  if (!payout) return NextResponse.json({ error: "Payout not found" }, { status: 404 })
  if (payout.status === "completed") return NextResponse.json({ message: "Already completed" })

  // Never trust the status in the webhook body — re-verify with CinetPay's API.
  // A spoofed POST could otherwise mark a payout SUCCESS or trigger a refund.
  const verification = await checkTransferStatus(client_transaction_id)
  if (!verification.success || !verification.status) {
    return NextResponse.json({ error: "Unable to verify transfer status" }, { status: 502 })
  }
  const status = verification.status

  if (status === "SUCCESS") {
    await completePayoutTransfer(payout.id, transaction_id ?? "", client_transaction_id)
  } else if (status === "FAILED") {
    // Mark failed + refund to available balance
    await supabase
      .from("vendor_payouts")
      .update({ status: "failed", failure_reason: `CinetPay status: ${status}` })
      .eq("id", payout.id)

    // Get payout details to refund
    const { data: p } = await supabase
      .from("vendor_payouts")
      .select("vendor_id, amount")
      .eq("id", payout.id)
      .single()

    if (p) {
      // Refund: atomically restore available balance and reduce withdrawn
      await supabase.rpc("refund_payout_to_available" as string, {
        p_vendor_id: p.vendor_id,
        p_amount: p.amount,
      })

      // Notify vendor
      const { data: vendor } = await supabase
        .from("vendors")
        .select("owner_id")
        .eq("id", p.vendor_id)
        .single()

      if (vendor?.owner_id) {
        await supabase.from("financial_notifications").insert({
          user_id: vendor.owner_id,
          type: "payout_failed",
          title: "Retrait échoué",
          message: `Votre retrait a échoué (${status}). Les fonds ont été remis à disposition.`,
          amount: p.amount,
          reference_id: payout.id,
          reference_type: "payout",
        })
      }
    }
  }

  return NextResponse.json({ message: "OK" })
}
