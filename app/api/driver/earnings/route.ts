import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Driver earnings & analytics — everything is computed from real deliveries
// (marketplace orders + express requests). No estimated bonuses/tips, no
// hardcoded rates: what the driver sees is what the data says.

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

type Earning = { amount: number; at: string; ref: string; kind: "order" | "express" }

export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, total_earnings, total_deliveries, rating, user:profiles(wallet_balance)")
    .eq("user_id", user.id)
    .single()

  if (!driver) {
    return NextResponse.json({ error: "Profil livreur non trouve" }, { status: 404 })
  }

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(todayStart); weekStart.setDate(weekStart.getDate() - 6)
  const monthStart = new Date(todayStart); monthStart.setDate(monthStart.getDate() - 29)

  // One 30-day window feeds every widget (summary, chart, hours, transactions).
  const [ordersRes, expressRes, cancelledRes] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_number, delivery_fee, actual_delivery_time")
      .eq("driver_id", user.id)   // orders.driver_id → auth.users(id)
      .eq("status", "delivered")
      .gte("actual_delivery_time", monthStart.toISOString()),
    supabase
      .from("delivery_requests")
      .select("id, tracking_number, price, updated_at")
      .eq("driver_id", driver.id)
      .eq("status", "delivered")
      .gte("updated_at", monthStart.toISOString()),
    // Real completion rate: deliveries lost to cancellation while assigned.
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("driver_id", user.id)
      .eq("status", "cancelled")
      .gte("created_at", monthStart.toISOString()),
  ])

  const earningsList: Earning[] = [
    ...(ordersRes.data ?? []).map(o => ({
      amount: Number(o.delivery_fee ?? 0),
      at: o.actual_delivery_time as string,
      ref: o.order_number ? `Commande #${o.order_number}` : `Commande ${String(o.id).slice(0, 8).toUpperCase()}`,
      kind: "order" as const,
    })),
    ...(expressRes.data ?? []).map(d => ({
      amount: Number(d.price ?? 0),
      at: d.updated_at as string,
      ref: d.tracking_number ? `Express ${d.tracking_number}` : `Express ${String(d.id).slice(0, 8).toUpperCase()}`,
      kind: "express" as const,
    })),
  ].filter(e => e.at)

  const sumSince = (since: Date) => {
    const list = earningsList.filter(e => new Date(e.at) >= since)
    return { earnings: list.reduce((s, e) => s + e.amount, 0), deliveries: list.length }
  }

  // 7-day chart (oldest → today)
  const chart = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(todayStart); day.setDate(day.getDate() - (6 - i))
    const next = new Date(day); next.setDate(next.getDate() + 1)
    const list = earningsList.filter(e => { const t = new Date(e.at); return t >= day && t < next })
    return {
      day: DAY_LABELS[day.getDay()],
      earnings: list.reduce((s, e) => s + e.amount, 0),
      trips: list.length,
      current: i === 6,
    }
  })

  // Earnings share per time slot over the last 7 days
  const SLOTS = [[6, 9], [9, 12], [12, 15], [15, 18], [18, 21], [21, 24]] as const
  const weekList = earningsList.filter(e => new Date(e.at) >= weekStart)
  const weekTotal = weekList.reduce((s, e) => s + e.amount, 0)
  const hours = SLOTS.map(([from, to]) => {
    const slot = weekList.filter(e => { const h = new Date(e.at).getHours(); return h >= from && h < to })
    const amount = slot.reduce((s, e) => s + e.amount, 0)
    return {
      hour: `${from}h-${to}h`,
      percentage: weekTotal > 0 ? Math.round((amount / weekTotal) * 100) : 0,
    }
  })

  const delivered30d = earningsList.length
  const cancelled30d = cancelledRes.count ?? 0
  const completionRate = delivered30d + cancelled30d > 0
    ? Math.round((delivered30d / (delivered30d + cancelled30d)) * 100)
    : null // no activity yet — nothing honest to display

  const recent = [...earningsList]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, 6)
    .map((e, i) => ({ id: i, description: e.ref, amount: e.amount, kind: e.kind, at: e.at }))

  const walletBalance = Number(
    (Array.isArray(driver.user) ? driver.user[0] : driver.user)?.wallet_balance ?? 0
  )

  return NextResponse.json({
    summary: {
      today: sumSince(todayStart),
      week: sumSince(weekStart),
      month: sumSince(monthStart),
    },
    chart,
    hours,
    recent,
    completion_rate: completionRate,
    rating: driver.rating,
    wallet_balance: walletBalance,
    all_time: {
      total_earnings: Number(driver.total_earnings ?? 0),
      total_deliveries: Number(driver.total_deliveries ?? 0),
    },
  })
}
