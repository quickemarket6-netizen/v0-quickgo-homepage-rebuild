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
  
  // Get current balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_balance")
    .eq("id", user.id)
    .single()
  
  const currentBalance = profile?.wallet_balance || 0
  let newBalance = currentBalance
  
  if (type === "credit" || type === "cashback" || type === "refund") {
    newBalance = currentBalance + amount
  } else if (type === "debit" || type === "withdrawal") {
    if (currentBalance < amount) {
      return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 })
    }
    newBalance = currentBalance - amount
  }
  
  // Create transaction
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
    return NextResponse.json({ error: txError.message }, { status: 500 })
  }
  
  // Update profile balance
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ wallet_balance: newBalance })
    .eq("id", user.id)
  
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }
  
  return NextResponse.json({
    transaction,
    new_balance: newBalance
  })
}
