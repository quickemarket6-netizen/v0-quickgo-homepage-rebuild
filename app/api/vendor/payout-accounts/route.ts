import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyVendorOwnership } from "@/lib/payments/security"

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { vendor_id, payout_method, account_name, phone_number, is_default } = body

  if (!vendor_id || !payout_method || !account_name || !phone_number) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
  }

  const ownership = await verifyVendorOwnership(vendor_id)
  if (!ownership.valid) return NextResponse.json({ error: ownership.error }, { status: 403 })

  const supabase = await createClient()

  // Check max accounts per vendor (max 5)
  const { count } = await supabase
    .from("vendor_payout_accounts")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", vendor_id)

  if ((count ?? 0) >= 5) {
    return NextResponse.json({ error: "Maximum 5 comptes de paiement autorisés" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("vendor_payout_accounts")
    .insert({ vendor_id, payout_method, account_name, phone_number, is_default: is_default ?? false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, account: data })
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const account_id = searchParams.get("account_id")
  const vendor_id = searchParams.get("vendor_id")

  if (!account_id || !vendor_id) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })

  const ownership = await verifyVendorOwnership(vendor_id)
  if (!ownership.valid) return NextResponse.json({ error: ownership.error }, { status: 403 })

  const supabase = await createClient()
  const { error } = await supabase
    .from("vendor_payout_accounts")
    .delete()
    .eq("id", account_id)
    .eq("vendor_id", vendor_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
