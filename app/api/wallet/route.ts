import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  // Get wallet balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_balance, points")
    .eq("id", user.id)
    .single()
  
  // Get recent transactions
  const { data: transactions } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)
  
  return NextResponse.json({
    balance: profile?.wallet_balance || 0,
    points: profile?.points || 0,
    transactions: transactions || []
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const { type, amount, description } = await request.json()

  // Only debit operations are allowed from this client endpoint.
  // Credits (cashback, refund) must go through system/payment webhooks.
  if (type !== "debit" && type !== "withdrawal") {
    return NextResponse.json({ error: "Type d'opération non autorisé" }, { status: 403 })
  }

  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
  }

  // Get current balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_balance")
    .eq("id", user.id)
    .single()

  const currentBalance = profile?.wallet_balance || 0

  if (currentBalance < amount) {
    return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 })
  }
  const newBalance = currentBalance - amount

  // Update balance first with optimistic lock — fails if balance changed concurrently
  const { data: updated, error: profileError } = await supabase
    .from("profiles")
    .update({ wallet_balance: newBalance })
    .eq("id", user.id)
    .eq("wallet_balance", currentBalance)
    .select("id")

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }
  if (!updated || updated.length === 0) {
    return NextResponse.json({ error: "Solde modifié, veuillez réessayer" }, { status: 409 })
  }

  // Audit log after confirmed balance update
  const { data: transaction, error: txError } = await supabase
    .from("wallet_transactions")
    .insert({
      user_id: user.id,
      type,
      amount,
      balance_after: newBalance,
      description
    })
    .select()
    .single()

  if (txError) {
    console.error("[wallet] audit log failed:", txError.message)
  }

  return NextResponse.json({
    transaction: transaction ?? null,
    new_balance: newBalance
  })
}
