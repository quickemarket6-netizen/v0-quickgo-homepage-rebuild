import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyVendorOwnership } from "@/lib/payments/security"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const vendor_id = searchParams.get("vendor_id")
  if (!vendor_id) return NextResponse.json({ error: "vendor_id requis" }, { status: 400 })

  const ownership = await verifyVendorOwnership(vendor_id)
  if (!ownership.valid) return NextResponse.json({ error: ownership.error }, { status: 403 })

  // Wallet balances
  const { data: wallet } = await supabase
    .from("vendor_wallets")
    .select("*")
    .eq("vendor_id", vendor_id)
    .single()

  // Recent payouts
  const { data: payouts } = await supabase
    .from("vendor_payouts")
    .select("*")
    .eq("vendor_id", vendor_id)
    .order("created_at", { ascending: false })
    .limit(20)

  // Commission history
  const { data: commissions } = await supabase
    .from("commission_logs")
    .select("*")
    .eq("vendor_id", vendor_id)
    .order("created_at", { ascending: false })
    .limit(20)

  // Payout accounts
  const { data: payoutAccounts } = await supabase
    .from("vendor_payout_accounts")
    .select("*")
    .eq("vendor_id", vendor_id)
    .order("is_default", { ascending: false })

  // Sales analytics (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
  const { data: recentCommissions } = await supabase
    .from("commission_logs")
    .select("gross_amount, vendor_net_amount, quickgo_commission, created_at")
    .eq("vendor_id", vendor_id)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: true })

  return NextResponse.json({
    wallet,
    payouts: payouts ?? [],
    commissions: commissions ?? [],
    payout_accounts: payoutAccounts ?? [],
    analytics: {
      last_30_days: recentCommissions ?? [],
    },
  })
}
