import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyPayment } from "@/lib/payments/cinetpay"

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { transaction_id } = await req.json()
  if (!transaction_id) return NextResponse.json({ error: "transaction_id requis" }, { status: 400 })

  const { data: txn } = await supabase
    .from("payment_transactions")
    .select("*")
    .eq("transaction_id", transaction_id)
    .eq("customer_id", user.id)
    .single()

  if (!txn) return NextResponse.json({ error: "Transaction introuvable" }, { status: 404 })

  // If already in final state, return it
  if (txn.status === "completed") {
    return NextResponse.json({ status: "completed", transaction: txn })
  }

  // Poll CinetPay
  const result = await verifyPayment(transaction_id)

  if (result.success && result.status === "ACCEPTED" && txn.status !== "completed") {
    await supabase
      .from("payment_transactions")
      .update({ status: "completed" })
      .eq("id", txn.id)

    return NextResponse.json({ status: "completed", payment_method: result.payment_method })
  }

  return NextResponse.json({
    status: txn.status,
    cinetpay_status: result.status,
    message: result.message,
  })
}
