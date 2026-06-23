import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { initiatePayment } from "@/lib/payments/cinetpay"
import { checkPaymentRateLimit, getClientIP, generateIdempotencyKey } from "@/lib/payments/security"
import { randomUUID } from "crypto"

// Strip ASCII control chars (incl. CR/LF/TAB), collapse whitespace, cap length.
// Prevents payload corruption / header injection in the downstream CinetPay call.
function sanitizeField(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined
  const controls = new RegExp("[\\x00-\\x1F\\x7F]", "g")
  const s = v.replace(controls, " ").replace(/\s+/g, " ").trim()
  return s ? s.slice(0, max) : undefined
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  const rateCheck = await checkPaymentRateLimit(ip)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Veuillez patienter." }, { status: 429 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await req.json()
  const { order_id } = body

  if (!order_id) {
    return NextResponse.json({ error: "order_id requis" }, { status: 400 })
  }

  const customer_name = sanitizeField(body.customer_name, 100)
  const customer_email = sanitizeField(body.customer_email, 150)
  const customer_phone = sanitizeField(body.customer_phone, 20)

  // Verify order belongs to user and fetch the authoritative total
  const { data: order } = await supabase
    .from("orders")
    .select("id, total, status, payment_status")
    .eq("id", order_id)
    .eq("customer_id", user.id)
    .single()

  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  if (order.payment_status === "paid") {
    return NextResponse.json({ error: "Commande déjà payée" }, { status: 400 })
  }

  // Always use the server-authoritative total — never trust client-supplied amount
  const amount = order.total
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Montant de commande invalide" }, { status: 400 })
  }

  const transactionId = randomUUID().replace(/-/g, "").slice(0, 20).toUpperCase()
  const idempotencyKey = generateIdempotencyKey("payment", order_id, user.id)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://quickgo.cm"

  // Check for existing payment transaction
  const { data: existing } = await supabase
    .from("payment_transactions")
    .select("id, payment_url, status")
    .eq("idempotency_key", idempotencyKey)
    .single()

  if (existing && existing.status === "pending" && existing.payment_url) {
    return NextResponse.json({ payment_url: existing.payment_url, transaction_id: existing.id })
  }

  // Initiate CinetPay payment
  const result = await initiatePayment({
    transaction_id: transactionId,
    amount,
    description: `QuickGo Commande #${order_id.slice(0, 8).toUpperCase()}`,
    customer_name: customer_name ?? user.email ?? "Client QuickGo",
    customer_email: customer_email ?? user.email ?? "client@quickgo.cm",
    customer_phone_number: customer_phone ?? "+237600000000",
    return_url: `${appUrl}/marketplace/orders?payment=success`,
    notify_url: `${appUrl}/api/payments/webhook`,
    channels: "ALL",
    metadata: JSON.stringify({ order_id, customer_id: user.id }),
  })

  if (!result.success) {
    return NextResponse.json({ error: result.message ?? "Initiation de paiement échouée" }, { status: 502 })
  }

  // Store payment transaction record
  const { data: txn } = await supabase
    .from("payment_transactions")
    .insert({
      order_id,
      customer_id: user.id,
      payment_provider: "cinetpay",
      transaction_id: transactionId,
      amount,
      currency: "XAF",
      status: "pending",
      payment_url: result.payment_url,
      idempotency_key: idempotencyKey,
    })
    .select()
    .single()

  return NextResponse.json({
    payment_url: result.payment_url,
    payment_token: result.payment_token,
    transaction_id: txn?.id,
  })
}
