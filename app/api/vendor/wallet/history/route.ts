import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("owner_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const filter = req.nextUrl.searchParams.get("filter") ?? "all"

  const [commRes, payoutsRes] = await Promise.all([
    supabase.from("commission_logs")
      .select("id, gross_amount, quickgo_commission, vendor_net_amount, commission_rate, created_at")
      .eq("vendor_id", vendor.id).order("created_at", { ascending: false }).limit(200),
    supabase.from("vendor_payouts")
      .select("id, amount, status, payout_method, reference_number, created_at, processed_at")
      .eq("vendor_id", vendor.id).order("created_at", { ascending: false }).limit(100),
  ])

  type CommLog = { id: string; gross_amount: number; quickgo_commission: number; vendor_net_amount: number; commission_rate: number; created_at: string }
  type Payout  = { id: string; amount: number; status: string; payout_method: string; reference_number: string | null; created_at: string }

  const comms   = (commRes.data   ?? []) as unknown as CommLog[]
  const payouts = (payoutsRes.data ?? []) as unknown as Payout[]

  type Tx = {
    id: string; type: "earning" | "payout" | "commission"
    amount: number; description: string; date: string; status: string
    detail?: string; reference?: string
  }
  const transactions: Tx[] = []

  if (filter === "all" || filter === "earnings") {
    for (const c of comms) {
      transactions.push({
        id: `e-${c.id}`, type: "earning",
        amount: c.vendor_net_amount ?? 0,
        description: "Vente encaissée",
        date: c.created_at, status: "completed",
        detail: `Brut : ${Math.round(c.gross_amount)} F — Commission : ${Math.round(c.quickgo_commission)} F`,
      })
    }
  }

  if (filter === "commissions") {
    for (const c of comms) {
      transactions.push({
        id: `c-${c.id}`, type: "commission",
        amount: c.quickgo_commission ?? 0,
        description: `Commission QuickGo (${c.commission_rate ?? 5}%)`,
        date: c.created_at, status: "deducted",
      })
    }
  }

  if (filter === "all" || filter === "payouts") {
    for (const p of payouts) {
      transactions.push({
        id: `p-${p.id}`, type: "payout",
        amount: p.amount ?? 0,
        description: `Retrait — ${p.payout_method ?? ""}`,
        date: p.created_at, status: p.status ?? "pending",
        reference: p.reference_number ?? undefined,
      })
    }
  }

  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalEarned     = comms.reduce((s, c) => s + (c.vendor_net_amount ?? 0), 0)
  const totalCommission = comms.reduce((s, c) => s + (c.quickgo_commission ?? 0), 0)
  const totalWithdrawn  = payouts
    .filter((p) => ["completed", "processed"].includes(p.status))
    .reduce((s, p) => s + (p.amount ?? 0), 0)
  const pendingPayouts  = payouts
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + (p.amount ?? 0), 0)

  return NextResponse.json({
    transactions,
    summary: { totalEarned, totalCommission, totalWithdrawn, pendingPayouts },
  })
}
