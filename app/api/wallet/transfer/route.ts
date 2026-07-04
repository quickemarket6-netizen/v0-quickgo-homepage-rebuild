import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { checkRateLimit } from "@/lib/payments/security"

// 10 transfers per hour per user
const TRANSFER_RATE_LIMIT = { maxRequests: 10, windowMs: 60 * 60 * 1000 }

// Recent transfer recipients for the current user, derived from their
// past transfer_out transactions (most recent first, de-duplicated).
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

  const { data: rows } = await supabase
    .from("wallet_transactions")
    .select("metadata, created_at")
    .eq("user_id", user.id)
    .eq("type", "transfer_out")
    .order("created_at", { ascending: false })
    .limit(40)

  const seen = new Set<string>()
  const contacts: { name: string; phone: string; initial: string }[] = []
  for (const row of rows ?? []) {
    const meta = (row.metadata ?? {}) as Record<string, unknown>
    const contact = typeof meta.recipient_contact === "string" ? meta.recipient_contact : null
    const name = typeof meta.recipient_name === "string" ? meta.recipient_name : null
    if (!contact || seen.has(contact)) continue
    seen.add(contact)
    contacts.push({
      name: name ?? contact,
      phone: contact,
      initial: (name ?? contact).trim().charAt(0).toUpperCase() || "?",
    })
    if (contacts.length >= 5) break
  }

  return NextResponse.json({ contacts })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

  const rl = await checkRateLimit(`transfer:${user.id}`, TRANSFER_RATE_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de transferts, réessayez plus tard" }, { status: 429 })
  }

  const { recipient, amount, note } = await req.json() as {
    recipient?: string
    amount?: unknown
    note?: string
  }

  if (!recipient || typeof recipient !== "string" || recipient.trim() === "") {
    return NextResponse.json({ error: "Destinataire requis" }, { status: 400 })
  }

  const amt = Number(amount)
  if (!Number.isFinite(amt) || amt < 100) {
    return NextResponse.json({ error: "Montant invalide (minimum 100 FCFA)" }, { status: 400 })
  }
  if (amt > 500_000) {
    return NextResponse.json({ error: "Montant maximum dépassé (500 000 FCFA)" }, { status: 400 })
  }

  // Look up recipient by phone or email
  const clean = recipient.trim()
  const [byPhone, byEmail] = await Promise.all([
    supabase.from("profiles").select("id, full_name, wallet_balance").eq("phone", clean).single(),
    supabase.from("profiles").select("id, full_name, wallet_balance").eq("email", clean).single(),
  ])
  const recipientProfile = byPhone.data ?? byEmail.data
  if (!recipientProfile) {
    return NextResponse.json({ error: "Aucun compte QuickGo trouvé pour ce contact" }, { status: 404 })
  }
  if (recipientProfile.id === user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous transférer de l'argent à vous-même" }, { status: 400 })
  }

  // Fetch sender balance server-side (never trust client)
  const { data: senderProfile } = await supabase
    .from("profiles")
    .select("wallet_balance, full_name")
    .eq("id", user.id)
    .single()

  const senderBalance = senderProfile?.wallet_balance ?? 0
  if (senderBalance < amt) {
    return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 })
  }

  const newSenderBalance = senderBalance - amt
  const desc = note?.trim() ? note.trim() : undefined

  // Atomic debit with optimistic locking:
  // The WHERE wallet_balance = senderBalance ensures no concurrent modification
  // slipped between our read and this write. Returns 0 rows on conflict.
  const { data: debitResult, error: debitErr } = await supabase
    .from("profiles")
    .update({ wallet_balance: newSenderBalance })
    .eq("id", user.id)
    .eq("wallet_balance", senderBalance)
    .select("id")

  if (debitErr) return NextResponse.json({ error: "Erreur débit expéditeur" }, { status: 500 })
  if (!debitResult || debitResult.length === 0) {
    // Another concurrent operation already changed the balance
    return NextResponse.json({ error: "Solde modifié, veuillez réessayer" }, { status: 409 })
  }

  // Re-read recipient balance for a fresh snapshot before crediting.
  // If this read fails we must NOT fall back to a stale value — roll back instead.
  const { data: freshRecipient, error: freshErr } = await supabase
    .from("profiles")
    .select("wallet_balance")
    .eq("id", recipientProfile.id)
    .single()
  if (freshErr || !freshRecipient) {
    await supabase
      .from("profiles")
      .update({ wallet_balance: senderBalance })
      .eq("id", user.id)
      .eq("wallet_balance", newSenderBalance)
    return NextResponse.json({ error: "Erreur de lecture du destinataire, solde restauré" }, { status: 500 })
  }
  const recipientCurrentBalance = freshRecipient.wallet_balance ?? 0
  const finalRecipientBalance = recipientCurrentBalance + amt

  // Credit recipient with optimistic lock on their current balance
  const { data: creditResult, error: creditErr } = await supabase
    .from("profiles")
    .update({ wallet_balance: finalRecipientBalance })
    .eq("id", recipientProfile.id)
    .eq("wallet_balance", recipientCurrentBalance)
    .select("id")

  if (creditErr || !creditResult?.length) {
    // Rollback: restore sender's balance to exact value before the debit
    await supabase
      .from("profiles")
      .update({ wallet_balance: senderBalance })
      .eq("id", user.id)
      .eq("wallet_balance", newSenderBalance)
    return NextResponse.json({ error: "Erreur crédit destinataire, solde restauré" }, { status: 500 })
  }

  const newRecipientBalance = finalRecipientBalance

  // Audit trail — log failure instead of silently swallowing
  const ts = new Date().toISOString()
  const { error: txErr } = await supabase.from("wallet_transactions").insert([
    {
      user_id: user.id,
      type: "transfer_out",
      amount: amt,
      balance_after: newSenderBalance,
      description: `Transfert vers ${recipientProfile.full_name ?? recipient}${desc ? ` — ${desc}` : ""}`,
      metadata: {
        recipient_id: recipientProfile.id,
        recipient_name: recipientProfile.full_name ?? recipient,
        recipient_contact: clean,
      },
      created_at: ts,
    },
    {
      user_id: recipientProfile.id,
      type: "transfer_in",
      amount: amt,
      balance_after: newRecipientBalance,
      description: `Reçu de ${senderProfile?.full_name ?? "QuickGo"}${desc ? ` — ${desc}` : ""}`,
      created_at: ts,
    },
  ])
  if (txErr) console.error("[wallet/transfer] audit log failed:", txErr.message)

  // Notify recipient (fire-and-forget is acceptable for notifications)
  supabase.from("notifications").insert({
    user_id: recipientProfile.id,
    title: "Transfert reçu",
    message: `Vous avez reçu ${new Intl.NumberFormat("fr-FR").format(amt)} FCFA de ${senderProfile?.full_name ?? "quelqu'un"}.`,
    is_read: false,
  }).then(undefined, () => {})

  return NextResponse.json({
    success: true,
    new_balance: newSenderBalance,
    recipient_name: recipientProfile.full_name ?? recipient,
  })
}
