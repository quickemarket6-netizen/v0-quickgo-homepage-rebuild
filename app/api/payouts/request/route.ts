import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { createPayoutRequest } from "@/lib/payments/wallet-engine"
import {
  checkPayoutRateLimit,
  verifyVendorOwnership,
  calculateFraudScore,
  generateIdempotencyKey,
} from "@/lib/payments/security"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { vendor_id, amount, payout_method, payout_phone, payout_account_id } = body

  if (!vendor_id || !amount || !payout_method || !payout_phone) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
  }

  // Verify ownership
  const ownership = await verifyVendorOwnership(vendor_id)
  if (!ownership.valid) return NextResponse.json({ error: ownership.error }, { status: 403 })

  // Rate limit
  const rateCheck = await checkPayoutRateLimit(vendor_id)
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "Trop de demandes de retrait. Veuillez patienter 1 heure." },
      { status: 429 },
    )
  }

  // Fraud scoring
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for") ?? "unknown"
  const { score, flags } = await calculateFraudScore({
    vendorId: vendor_id,
    amount,
    payoutMethod: payout_method,
    ipAddress: ip,
  })

  if (score >= 80) {
    // High fraud risk — block and alert
    const supabase = await createClient()
    const { data: vendor } = await supabase.from("vendors").select("user_id").eq("id", vendor_id).single()
    if (vendor?.user_id) {
      await supabase.from("financial_notifications").insert({
        user_id: vendor.user_id,
        type: "fraud_alert",
        title: "Retrait bloqué — vérification requise",
        message: "Votre demande de retrait nécessite une vérification manuelle. Notre équipe vous contactera.",
        amount,
        reference_type: "fraud_block",
      })
    }
    return NextResponse.json(
      { error: "Demande en cours de vérification. Notre équipe vous contactera.", fraud_flags: flags },
      { status: 403 },
    )
  }

  const idempotencyKey = generateIdempotencyKey("payout", vendor_id, String(amount), payout_phone)
  const result = await createPayoutRequest({
    vendorId: vendor_id,
    amount,
    payoutMethod: payout_method,
    payoutPhone: payout_phone,
    payoutAccountId: payout_account_id,
    requestedBy: ownership.userId!,
    idempotencyKey,
  })

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    success: true,
    payout_id: result.payoutId,
    fraud_score: score,
    message: "Demande de retrait créée avec succès. En attente de validation admin.",
  })
}
