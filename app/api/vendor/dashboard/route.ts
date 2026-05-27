import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor, error: vErr } = await supabase
    .from("vendors")
    .select("id, name, description, logo_url, is_verified, rating, commission_rate, status")
    .eq("owner_id", user.id)
    .single()

  if (vErr || !vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })
  const vendorId = vendor.id

  const period = Math.min(90, Math.max(7, parseInt(req.nextUrl.searchParams.get("period") ?? "7")))
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const periodStart = new Date(Date.now() - period * 86400000).toISOString()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString()
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString()

  const [
    todayRes, monthRes, productCountRes, recentOrdersRes,
    chartOrdersRes, walletRes, commissionRes, notifRes,
    thirtyDayOrdersRes, unreadRes, lowStockRes,
  ] = await Promise.all([
    supabase.from("orders").select("total_amount, total").eq("vendor_id", vendorId).gte("created_at", todayStart).neq("status", "cancelled"),
    supabase.from("orders").select("total_amount, total").eq("vendor_id", vendorId).gte("created_at", monthStart).neq("status", "cancelled"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("vendor_id", vendorId).eq("is_available", true),
    supabase.from("orders").select(`
      id, order_number, status, total_amount, total, created_at, estimated_delivery_time,
      customer:profiles!orders_customer_id_fkey(full_name, phone, avatar_url),
      items:order_items(product_name, quantity, unit_price, total_price)
    `).eq("vendor_id", vendorId).order("created_at", { ascending: false }).limit(5),
    supabase.from("orders").select("total_amount, total, created_at").eq("vendor_id", vendorId).gte("created_at", periodStart).neq("status", "cancelled").order("created_at", { ascending: true }),
    supabase.from("vendor_wallets").select("available_balance, pending_balance, total_earned, total_withdrawn, next_payout_date, next_payout_amount").eq("vendor_id", vendorId).single(),
    supabase.from("commission_logs").select("gross_amount, quickgo_commission, vendor_net_amount, commission_rate, created_at").eq("vendor_id", vendorId).gte("created_at", yesterdayStart).order("created_at", { ascending: false }).limit(10),
    supabase.from("notifications").select("id, title, message, is_read, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("orders").select("id, items:order_items(product_name, quantity, total_price)").eq("vendor_id", vendorId).gte("created_at", thirtyDaysAgo).neq("status", "cancelled").limit(100),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false),
    supabase.from("products").select("id, name, stock_quantity, images").eq("vendor_id", vendorId).lte("stock_quantity", 5).order("stock_quantity").limit(5),
  ])

  function orderTotal(o: { total_amount?: number | null; total?: number | null }) {
    return o.total_amount ?? o.total ?? 0
  }

  const todayOrders = todayRes.data ?? []
  const todaySales = todayOrders.reduce((s, o) => s + orderTotal(o), 0)
  const monthSales = (monthRes.data ?? []).reduce((s, o) => s + orderTotal(o), 0)

  // Build period chart (one point per day)
  const chart = Array.from({ length: period }, (_, i) => {
    const d = new Date(Date.now() - (period - 1 - i) * 86400000)
    const dayStr = d.toISOString().slice(0, 10)
    const dayOrders = (chartOrdersRes.data ?? []).filter((o) => o.created_at.slice(0, 10) === dayStr)
    return {
      date: d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      sales: dayOrders.reduce((s, o) => s + orderTotal(o), 0),
      orders: dayOrders.length,
    }
  })

  // Top products from last 30 days
  const productMap = new Map<string, { name: string; sold: number; revenue: number }>()
  for (const order of thirtyDayOrdersRes.data ?? []) {
    for (const item of (order as unknown as { items: { product_name: string; quantity: number; total_price: number }[] }).items ?? []) {
      const key = item.product_name ?? "?"
      const cur = productMap.get(key) ?? { name: key, sold: 0, revenue: 0 }
      cur.sold += item.quantity ?? 1
      cur.revenue += item.total_price ?? 0
      productMap.set(key, cur)
    }
  }
  const topProducts = Array.from(productMap.values()).sort((a, b) => b.sold - a.sold).slice(0, 5)

  const commissions = commissionRes.data ?? []
  const yesterdayDateStr = yesterdayStart.slice(0, 10)
  const yesterdayComm = commissions.find((c) => c.created_at.slice(0, 10) === yesterdayDateStr) ?? null
  const monthCommTotal = commissions.reduce((s, c) => s + (c.quickgo_commission ?? 0), 0)

  return NextResponse.json({
    vendor,
    kpi: {
      today_sales: todaySales,
      today_orders: todayOrders.length,
      month_revenue: monthSales,
      active_products: productCountRes.count ?? 0,
      rating: vendor.rating ?? 0,
    },
    chart,
    recent_orders: recentOrdersRes.data ?? [],
    top_products: topProducts,
    wallet: walletRes.data ?? null,
    commission: {
      yesterday: yesterdayComm,
      month_total: monthCommTotal,
      rate: vendor.commission_rate ?? 5,
    },
    notifications: notifRes.data ?? [],
    unread_notifications: unreadRes.count ?? 0,
    low_stock: lowStockRes.data ?? [],
  })
}
