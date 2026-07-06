import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { initiatePayment } from "@/lib/payments/cinetpay"
import { checkPaymentRateLimit, getClientIP } from "@/lib/payments/security"
import { randomUUID } from "crypto"

const MIN_TOPUP = 500
const MAX_TOPUP = 1_000_000

// POST /api/wallet/topup — recharge du portefeuille QuickGo Pay via CinetPay
// (Orange Money / MTN MoMo). Le crédit n'est appliqué qu'au retour du webhook,
// après double vérification du paiement — jamais côté client.
export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  const rateCheck = await checkPaymentRateLimit(ip)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Veuillez patienter." }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const amount = Math.round(Number(body?.amount))
  if (!Number.isFinite(amount) || amount < MIN_TOPUP || amount > MAX_TOPUP) {
    return NextResponse.json(
      { error: `Montant invalide (entre ${MIN_TOPUP} et ${new Intl.NumberFormat("fr-FR").format(MAX_TOPUP)} FCFA).` },
      { status: 400 },
    )
  }
  const phone = typeof body?.phone === "string" ? body.phone.replace(/[^\d+]/g, "").slice(0, 20) : undefined

  // Le préfixe TOPUP + l'absence d'order_id identifient la transaction comme
  // une recharge dans le webhook.
  const transactionId = `TOPUP${randomUUID().replace(/-/g, "").slice(0, 15).toUpperCase()}`
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://quickgo.cm"

  const result = await initiatePayment({
    transaction_id: transactionId,
    amount,
    description: "Recharge portefeuille QuickGo Pay",
    customer_name: user.email ?? "Client QuickGo",
    customer_email: user.email ?? "client@quickgo.cm",
    customer_phone_number: phone ?? "+237600000000",
    return_url: `${appUrl}/wallet?topup=success`,
    notify_url: `${appUrl}/api/payments/webhook`,
    channels: "ALL",
    metadata: JSON.stringify({ purpose: "wallet_topup", customer_id: user.id }),
  })

  if (!result.success) {
    return NextResponse.json({ error: result.message ?? "Initiation de paiement échouée" }, { status: 502 })
  }

  const { error: insertErr } = await supabase
    .from("payment_transactions")
    .insert({
      customer_id: user.id,
      payment_provider: "cinetpay",
      transaction_id: transactionId,
      amount,
      currency: "XAF",
      status: "pending",
      payment_url: result.payment_url,
      idempotency_key: `topup:${transactionId}`,
    })

  if (insertErr) {
    console.error("[topup] enregistrement transaction échoué:", insertErr.message)
    return NextResponse.json({ error: "Erreur interne, réessayez." }, { status: 500 })
  }

  return NextResponse.json({ payment_url: result.payment_url, transaction_id: transactionId })
}
