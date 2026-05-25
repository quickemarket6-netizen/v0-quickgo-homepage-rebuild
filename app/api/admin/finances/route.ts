import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const period = searchParams.get("period") ?? "30"
  const daysAgo = new Date(Date.now() - parseInt(period) * 86400000).toISOString()

  // Parallel queries for dashboard
  const [
    revenueResult,
    pendingPayoutsResult,
    vendorWalletsResult,
    recentTransactionsResult,
    commissionTrendResult,
    fraudFlagsResult,
  ] = await Promise.all([
    // Total revenue (commissions earned)
    supabase
      .from("commission_logs")
      .select("quickgo_commission, vendor_net_amount, gross_amount, created_at")
      .gte("created_at", daysAgo)
      .order("created_at", { ascending: true }),

    // Pending payouts
    supabase
      .from("vendor_payouts")
      .select("*, vendors(name, logo_url)")
      .eq("status", "pending")
      .order("created_at", { ascending: false }),

    // All vendor wallets
    supabase
      .from("vendor_wallets")
      .select("*, vendors(id, name, logo_url, is_active)")
      .order("available_balance", { ascending: false })
      .limit(20),

    // Recent payment transactions
    supabase
      .from("payment_transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30),

    // Daily commission trend
    supabase
      .from("commission_logs")
      .select("quickgo_commission, vendor_net_amount, created_at")
      .gte("created_at", daysAgo),

    // Frozen wallets (fraud indicators)
    supabase
      .from("vendor_wallets")
      .select("vendor_id, freeze_reason, vendors(name)")
      .eq("frozen", true),
  ])

  const commissions = revenueResult.data ?? []
  const totalRevenue = commissions.reduce((s, c) => s + Number(c.gross_amount ?? 0), 0)
  const totalCommissions = commissions.reduce((s, c) => s + Number(c.quickgo_commission ?? 0), 0)
  const totalVendorPaid = commissions.reduce((s, c) => s + Number(c.vendor_net_amount ?? 0), 0)

  // Aggregate daily for chart
  const dailyMap: Record<string, { date: string; revenue: number; commission: number; vendor: number }> = {}
  for (const c of commissions) {
    const date = c.created_at.slice(0, 10)
    if (!dailyMap[date]) dailyMap[date] = { date, revenue: 0, commission: 0, vendor: 0 }
    dailyMap[date].revenue += Number(c.gross_amount ?? 0)
    dailyMap[date].commission += Number(c.quickgo_commission ?? 0)
    dailyMap[date].vendor += Number(c.vendor_net_amount ?? 0)
  }
  const dailyTrend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

  const pendingPayoutsTotal = (pendingPayoutsResult.data ?? []).reduce(
    (s, p) => s + Number(p.amount), 0
  )

  return NextResponse.json({
    summary: {
      total_revenue: totalRevenue,
      total_commissions: totalCommissions,
      total_vendor_paid: totalVendorPaid,
      pending_payouts_count: pendingPayoutsResult.data?.length ?? 0,
      pending_payouts_total: pendingPayoutsTotal,
      frozen_wallets: fraudFlagsResult.data?.length ?? 0,
    },
    daily_trend: dailyTrend,
    pending_payouts: pendingPayoutsResult.data ?? [],
    vendor_wallets: vendorWalletsResult.data ?? [],
    recent_transactions: recentTransactionsResult.data ?? [],
    fraud_flags: fraudFlagsResult.data ?? [],
  })
}
