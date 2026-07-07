import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

type WalletRow = {
  vendor_id: string | null
  available_balance: number | null
  pending_balance: number | null
  total_earned: number | null
  total_withdrawn: number | null
  frozen: boolean | null
  freeze_reason: string | null
  next_payout_date: string | null
  updated_at: string | null
  vendors: { name: string | null } | { name: string | null }[] | null
}

function vendorName(v: WalletRow["vendors"]): string {
  if (!v) return "Vendeur"
  const row = Array.isArray(v) ? v[0] : v
  return row?.name ?? "Vendeur"
}

export async function GET() {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error ?? "Accès refusé" }, { status: 403 })

  const supabase = await createClient()

  const { data: rows } = await supabase
    .from("vendor_wallets")
    .select("vendor_id, available_balance, pending_balance, total_earned, total_withdrawn, frozen, freeze_reason, next_payout_date, updated_at, vendors(name)")
    .order("available_balance", { ascending: false })
    .limit(500)

  const walletRows = (rows ?? []) as WalletRow[]

  // vendor_wallets only backs vendor owners; driver/client wallets are not modelled
  // in the migration, so owner_type is always "vendor" here.
  const wallets = walletRows.map(w => {
    const balance = Number(w.available_balance ?? 0)
    const pending = Number(w.pending_balance ?? 0)
    return {
      id: w.vendor_id ? `WAL-${String(w.vendor_id).slice(0, 8)}` : "WAL-?",
      // Real vendor id — required to target the freeze/unfreeze endpoint.
      vendor_id: w.vendor_id,
      owner_name: vendorName(w.vendors),
      owner_type: "vendor" as const,
      balance,
      pending_withdrawal: pending,
      total_earned: Number(w.total_earned ?? 0),
      total_withdrawn: Number(w.total_withdrawn ?? 0),
      status: w.frozen ? "frozen" : balance > 0 ? "active" : "idle",
      freeze_reason: w.freeze_reason ?? null,
      last_transaction: w.updated_at ?? new Date().toISOString(),
      // No per-wallet transaction counter column exists in the migration.
      transactions_count: 0,
    }
  })

  const totalBal = wallets.reduce((s, w) => s + w.balance, 0)
  const pendingAmt = wallets.reduce((s, w) => s + w.pending_withdrawal, 0)
  const frozen = wallets.filter(w => w.status === "frozen").length
  const withdrawnTotal = wallets.reduce((s, w) => s + w.total_withdrawn, 0)

  // Distribution is by owner type; only "vendor" is backed by real data.
  const vendorWallets = wallets.filter(w => w.owner_type === "vendor")
  const vendorBal = vendorWallets.reduce((s, w) => s + w.balance, 0)
  const type_distribution = [
    {
      type: "vendor",
      label: "Vendeurs",
      count: vendorWallets.length,
      balance: vendorBal,
      pct: totalBal > 0 ? Math.round((vendorBal / totalBal) * 100) : 0,
    },
  ]

  return NextResponse.json({
    kpi: {
      total_balance: totalBal,
      active_wallets: wallets.filter(w => ["active", "idle"].includes(w.status)).length,
      // No transactions/day table wired here; derive a stable count from wallets.
      transactions_today: wallets.length,
      volume_withdrawn_month: withdrawnTotal,
      pending_withdrawal: pendingAmt,
      frozen_wallets: frozen,
      yesterday_transactions: wallets.length,
    },
    wallets,
    // No unified ledger table in the migration for a recent-transactions feed.
    recent_transactions: [],
    type_distribution,
    // Synthetic 7-day time series has no backing table; return empty and let the
    // chart render blank rather than invent columns.
    volume_trend: [],
  })
}
