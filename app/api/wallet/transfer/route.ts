import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

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
  const newRecipientBalance = (recipientProfile.wallet_balance ?? 0) + amt
  const desc = note?.trim() ? note.trim() : undefined

  // Debit sender
  const { error: debitErr } = await supabase
    .from("profiles")
    .update({ wallet_balance: newSenderBalance })
    .eq("id", user.id)
  if (debitErr) return NextResponse.json({ error: "Erreur débit expéditeur" }, { status: 500 })

  // Credit recipient
  const { error: creditErr } = await supabase
    .from("profiles")
    .update({ wallet_balance: newRecipientBalance })
    .eq("id", recipientProfile.id)
  if (creditErr) {
    // Rollback sender debit
    await supabase.from("profiles").update({ wallet_balance: senderBalance }).eq("id", user.id)
    return NextResponse.json({ error: "Erreur crédit destinataire" }, { status: 500 })
  }

  // Insert wallet transactions (fire-and-forget)
  const ts = new Date().toISOString()
  await supabase.from("wallet_transactions").insert([
    {
      user_id: user.id,
      type: "transfer_out",
      amount: amt,
      balance_after: newSenderBalance,
      description: `Transfert vers ${recipientProfile.full_name ?? recipient}${desc ? ` — ${desc}` : ""}`,
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
  ]).then(undefined, () => {})

  // Notify recipient
  await supabase.from("notifications").insert({
    user_id: recipientProfile.id,
    title: "Transfert reçu 💸",
    message: `Vous avez reçu ${new Intl.NumberFormat("fr-FR").format(amt)} FCFA de ${senderProfile?.full_name ?? "quelqu'un"}.`,
    is_read: false,
  }).then(undefined, () => {})

  return NextResponse.json({
    success: true,
    new_balance: newSenderBalance,
    recipient_name: recipientProfile.full_name ?? recipient,
  })
}
