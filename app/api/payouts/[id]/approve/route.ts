import { NextRequest, NextResponse } from "next/server"
import { approveAndProcessPayout } from "@/lib/payments/wallet-engine"
import { initiateTransfer } from "@/lib/payments/cinetpay"
import { verifyAdmin, getClientIP } from "@/lib/payments/security"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: payoutId } = await params

  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const ip = getClientIP(req)

  // Approve and deduct from wallet
  const approveResult = await approveAndProcessPayout(payoutId, admin.adminId!, ip)
  if (!approveResult.success) {
    return NextResponse.json({ error: approveResult.error }, { status: 400 })
  }

  // Get payout details for CinetPay transfer
  const supabase = await createClient()
  const { data: payout } = await supabase
    .from("vendor_payouts")
    .select("*, vendors(name)")
    .eq("id", payoutId)
    .single() as {
      data: {
        id: string
        amount: number
        payout_method: "orange_money" | "mtn_momo"
        payout_phone: string
        vendor_id: string
        vendors: { name: string } | null
      } | null
    }

  if (!payout) return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 })

  // Initiate transfer via CinetPay
  const transferResult = await initiateTransfer({
    vendor_payout_id: payoutId,
    amount: payout.amount,
    phone_number: payout.payout_phone,
    payout_method: payout.payout_method,
    vendor_name: payout.vendors?.name ?? "Vendeur QuickGo",
    description: `QuickGo Payout ${payoutId.slice(0, 8).toUpperCase()}`,
  })

  if (!transferResult.success) {
    // Mark as failed, rollback wallet deduction
    await supabase
      .from("vendor_payouts")
      .update({ status: "failed", failure_reason: transferResult.message })
      .eq("id", payoutId)

    // Refund to available
    await supabase.rpc("credit_vendor_pending" as string, {
      p_vendor_id: payout.vendor_id,
      p_amount: payout.amount,
      p_order_id: payoutId,
    })

    return NextResponse.json(
      { error: `Transfert CinetPay échoué: ${transferResult.message}` },
      { status: 502 },
    )
  }

  // Update with CinetPay reference
  await supabase
    .from("vendor_payouts")
    .update({
      cinetpay_transaction_id: transferResult.transaction_id,
      cinetpay_reference: transferResult.provider_reference,
      status: "processing",
    })
    .eq("id", payoutId)

  return NextResponse.json({
    success: true,
    message: "Paiement initié avec succès",
    cinetpay_reference: transferResult.provider_reference,
  })
}
