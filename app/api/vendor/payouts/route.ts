import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { checkPayoutRateLimit, calculateFraudScore } from "@/lib/payments/security"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, name, commission_rate")
    .eq("owner_id", user.id)
    .single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const filter = req.nextUrl.searchParams.get("filter") ?? "all"

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [allPayoutsRes, monthPayoutsRes, walletRes, accountsRes] = await Promise.all([
    supabase.from("vendor_payouts")
      .select("id, amount, status, payout_method, reference_number, created_at, processed_at")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false }),
    supabase.from("vendor_payouts")
      .select("amount, status")
      .eq("vendor_id", vendor.id)
      .gte("created_at", monthStart),
    supabase.from("vendor_wallets")
      .select("available_balance, pending_balance")
      .eq("vendor_id", vendor.id)
      .single(),
    supabase.from("vendor_payout_accounts")
      .select("id, payout_method, account_name, phone_number, is_default")
      .eq("vendor_id", vendor.id)
      .order("is_default", { ascending: false }),
  ])

  type PayoutRow = { id: string; amount: number; status: string; payout_method: string; reference_number: string | null; created_at: string; processed_at: string | null }
  const all = (allPayoutsRes.data ?? []) as unknown as PayoutRow[]
  const month = (monthPayoutsRes.data ?? []) as unknown as { amount: number; status: string }[]

  // Filter payouts
  const filtered = filter === "all" ? all : all.filter((p) => p.status === filter)

  // KPIs
  const pending      = all.filter((p) => p.status === "pending")
  const completed    = all.filter((p) => ["completed", "processed"].includes(p.status))
  const failed       = all.filter((p) => ["failed", "cancelled"].includes(p.status))
  const totalPending = pending.reduce((s, p) => s + (p.amount ?? 0), 0)
  const totalAllTime = completed.reduce((s, p) => s + (p.amount ?? 0), 0)
  const monthDone    = month.filter((p) => ["completed", "processed"].includes(p.status)).reduce((s, p) => s + (p.amount ?? 0), 0)
  const successRate  = all.length > 0 ? Math.round((completed.length / all.length) * 100) : 0

  return NextResponse.json({
    vendor_id: vendor.id,
    payouts: filtered,
    kpi: {
      pending_count: pending.length,
      pending_amount: totalPending,
      completed_month: monthDone,
      total_withdrawn: totalAllTime,
      success_rate: successRate,
      total_count: all.length,
    },
    wallet: walletRes.data,
    accounts: accountsRes.data ?? [],
    counts: {
      all: all.length,
      pending: pending.length,
      processing: all.filter((p) => p.status === "processing").length,
      completed: completed.length,
      failed: failed.length,
    },
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

  const rateCheck = checkPayoutRateLimit(vendor.id)
  if (!rateCheck.allowed) {
    return NextResponse.json({ error: "Trop de demandes de retrait. Réessayez dans 1 heure." }, { status: 429 })
  }

  const { data: wallet } = await supabase
    .from("vendor_wallets").select("available_balance").eq("vendor_id", vendor.id).single()
  if (!wallet || amount > (wallet.available_balance ?? 0)) {
    return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 })
  }
  if (amount < 1000) {
    return NextResponse.json({ error: "Montant minimum : 1 000 F CFA" }, { status: 400 })
  }

  const { data: account } = await supabase
    .from("vendor_payout_accounts")
    .select("payout_method, phone_number, account_name")
    .eq("id", account_id).eq("vendor_id", vendor.id).single()
  if (!account) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 })

  const ip = req.headers.get("x-real-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown"
  const fraud = await calculateFraudScore({ vendorId: vendor.id, amount, payoutMethod: account.payout_method, ipAddress: ip })
  if (fraud.score >= 70) {
    return NextResponse.json({ error: "Demande bloquée par le système de sécurité. Contactez le support." }, { status: 403 })
  }

  const { data: payout, error } = await supabase
    .from("vendor_payouts")
    .insert({ vendor_id: vendor.id, amount, status: "pending", payout_method: account.payout_method })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, payout })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { payout_id } = await req.json() as { payout_id?: string }
  if (!payout_id) return NextResponse.json({ error: "payout_id requis" }, { status: 400 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("owner_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  // Only cancel pending payouts
  const { data: payout } = await supabase
    .from("vendor_payouts")
    .select("id, status")
    .eq("id", payout_id)
    .eq("vendor_id", vendor.id)
    .single()

  if (!payout) return NextResponse.json({ error: "Retrait introuvable" }, { status: 404 })
  if (payout.status !== "pending") {
    return NextResponse.json({ error: "Seuls les retraits en attente peuvent être annulés" }, { status: 400 })
  }

  const { error } = await supabase
    .from("vendor_payouts")
    .update({ status: "cancelled" })
    .eq("id", payout_id)
    .eq("vendor_id", vendor.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
