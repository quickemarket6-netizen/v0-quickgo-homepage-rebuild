import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { checkPayoutRateLimit, calculateFraudScore } from "@/lib/payments/security"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, name, commission_rate")
    .eq("owner_id", user.id)
    .single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()

  const [walletRes, accountsRes, payoutsRes, commRes] = await Promise.all([
    supabase.from("vendor_wallets")
      .select("available_balance, pending_balance, total_earned, total_withdrawn, next_payout_date, next_payout_amount")
      .eq("vendor_id", vendor.id).single(),
    supabase.from("vendor_payout_accounts")
      .select("id, payout_method, account_name, phone_number, is_default, created_at")
      .eq("vendor_id", vendor.id).order("is_default", { ascending: false }),
    supabase.from("vendor_payouts")
      .select("id, amount, status, payout_method, reference_number, created_at, processed_at")
      .eq("vendor_id", vendor.id).order("created_at", { ascending: false }).limit(10),
    supabase.from("commission_logs")
      .select("vendor_net_amount, created_at")
      .eq("vendor_id", vendor.id).gte("created_at", thirtyDaysAgo).order("created_at", { ascending: true }),
  ])

  // 30-day daily earnings chart
  const chart = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000)
    const dayStr = d.toISOString().slice(0, 10)
    const dayLogs = (commRes.data ?? []).filter((l) => l.created_at.slice(0, 10) === dayStr)
    return {
      date: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      earned: dayLogs.reduce((s, l) => s + (l.vendor_net_amount ?? 0), 0),
    }
  })

  return NextResponse.json({
    vendor_id: vendor.id,
    wallet: walletRes.data,
    accounts: accountsRes.data ?? [],
    recent_payouts: payoutsRes.data ?? [],
    chart,
    commission_rate: vendor.commission_rate ?? 5,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await req.json() as { amount?: number; account_id?: string }
  const { amount, account_id } = body

  if (!amount || !account_id || amount <= 0) {
    return NextResponse.json({ error: "Montant et compte de paiement requis" }, { status: 400 })
  }

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("owner_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  // Rate limit (3 requests / hour)
  const rateCheck = await checkPayoutRateLimit(vendor.id)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Trop de demandes de retrait. Réessayez dans 1 heure." }, { status: 429 })
  }

  // Check balance
  const { data: wallet } = await supabase
    .from("vendor_wallets").select("available_balance").eq("vendor_id", vendor.id).single()
  if (!wallet || amount > (wallet.available_balance ?? 0)) {
    return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 })
  }
  if (amount < 1000) {
    return NextResponse.json({ error: "Montant minimum : 1 000 F CFA" }, { status: 400 })
  }

  // Verify account ownership
  const { data: account } = await supabase
    .from("vendor_payout_accounts")
    .select("payout_method, phone_number, account_name")
    .eq("id", account_id).eq("vendor_id", vendor.id).single()
  if (!account) return NextResponse.json({ error: "Compte de paiement introuvable" }, { status: 404 })

  // Fraud scoring
  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"
  const fraud = await calculateFraudScore({ vendorId: vendor.id, amount, payoutMethod: account.payout_method, ipAddress: ip })
  if (fraud.score >= 70) {
    return NextResponse.json({ error: "Demande bloquée par notre système de sécurité. Contactez le support." }, { status: 403 })
  }

  // Create pending payout request
  const { data: payout, error } = await supabase
    .from("vendor_payouts")
    .insert({ vendor_id: vendor.id, amount, status: "pending", payout_method: account.payout_method })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, payout })
}
