import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  // `category` n'est pas une colonne de vendors (c'est category_id, une FK vers
  // categories) : la demander faisait échouer toute la requête, donc 403
  // "Vendeur introuvable" et rebond sans fin vers l'onboarding. On passe par la
  // ressource embarquée, aplatie ensuite en chaîne comme l'attend le client.
  const { data: vendorRow, error: vErr } = await supabase
    .from("vendors")
    .select("id, name, description, logo_url, is_verified, rating, commission_rate, status, category:categories(name)")
    .eq("user_id", user.id)
    .single()

  if (vErr || !vendorRow) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const categoryRel = vendorRow.category as { name?: string } | { name?: string }[] | null
  const vendor = {
    ...vendorRow,
    category: (Array.isArray(categoryRel) ? categoryRel[0] : categoryRel)?.name ?? null,
  }
  const vendorId = vendor.id

  const period = Math.min(90, Math.max(7, parseInt(req.nextUrl.searchParams.get("period") ?? "7")))
  const now = new Date()
  const todayStart     = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const monthStart     = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const periodStart    = new Date(Date.now() - period * 86400000).toISOString()
  const thirtyDaysAgo  = new Date(Date.now() - 30 * 86400000).toISOString()
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString()

  const [
    todayRes, monthRes, productCountRes, recentOrdersRes,
    chartOrdersRes, walletRes, commissionRes, notifRes,
    thirtyDayOrdersRes, unreadRes, lowStockRes,
    yesterdayOrdersRes, prevMonthRes, reviewsCountRes,
    productCatsRes, pendingOrdersRes, deliveringOrdersRes, unreadMsgRes,
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
    supabase.from("products").select("id, name, stock_quantity, images").eq("vendor_id", vendorId).lte("stock_quantity", 10).order("stock_quantity").limit(6),
    // New
    supabase.from("orders").select("total_amount, total").eq("vendor_id", vendorId).gte("created_at", yesterdayStart).lt("created_at", todayStart).neq("status", "cancelled"),
    supabase.from("orders").select("total_amount, total").eq("vendor_id", vendorId).gte("created_at", prevMonthStart).lt("created_at", monthStart).neq("status", "cancelled"),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("vendor_id", vendorId),
    supabase.from("products").select("name, category, images").eq("vendor_id", vendorId).limit(300),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("vendor_id", vendorId).in("status", ["pending", "confirmed", "preparing", "ready"]),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("vendor_id", vendorId).eq("status", "delivering"),
    supabase.from("conversations").select("id", { count: "exact", head: true }).eq("vendor_id", vendorId).gt("unread_vendor", 0),
  ])

  function orderTotal(o: { total_amount?: number | null; total?: number | null }) {
    return o.total_amount ?? o.total ?? 0
  }

  const todayOrders    = todayRes.data ?? []
  const todaySales     = todayOrders.reduce((s, o) => s + orderTotal(o), 0)
  const monthSales     = (monthRes.data ?? []).reduce((s, o) => s + orderTotal(o), 0)
  const yesterdaySales = (yesterdayOrdersRes.data ?? []).reduce((s, o) => s + orderTotal(o), 0)
  const prevMonthSales = (prevMonthRes.data ?? []).reduce((s, o) => s + orderTotal(o), 0)

  const monthGrowthPct = prevMonthSales > 0
    ? Math.round(((monthSales - prevMonthSales) / prevMonthSales) * 1000) / 10
    : 0

  // Chart
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

  // Category + image map from products
  type ProdRow = { name: string; category: string | null; images: string[] | null }
  const catMap   = new Map<string, string>()
  const imageMap = new Map<string, string | null>()
  for (const p of (productCatsRes.data ?? []) as unknown as ProdRow[]) {
    catMap.set(p.name, p.category ?? "Autres")
    imageMap.set(p.name, p.images?.[0] ?? null)
  }

  // Top products (last 30 days)
  const productMap = new Map<string, { name: string; sold: number; revenue: number; category: string; image_url: string | null }>()
  for (const order of thirtyDayOrdersRes.data ?? []) {
    for (const item of (order as unknown as { items: { product_name: string; quantity: number; total_price: number }[] }).items ?? []) {
      const key = item.product_name ?? "?"
      const cur = productMap.get(key) ?? { name: key, sold: 0, revenue: 0, category: catMap.get(key) ?? "Autres", image_url: imageMap.get(key) ?? null }
      cur.sold    += item.quantity ?? 1
      cur.revenue += item.total_price ?? 0
      productMap.set(key, cur)
    }
  }
  const topProducts = Array.from(productMap.values()).sort((a, b) => b.sold - a.sold).slice(0, 5)

  // Sales by category
  const catRevMap = new Map<string, number>()
  for (const p of productMap.values()) {
    catRevMap.set(p.category, (catRevMap.get(p.category) ?? 0) + p.revenue)
  }
  const salesByCategory = Array.from(catRevMap.entries())
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6)

  const commissions    = commissionRes.data ?? []
  const yesterdayDateStr = yesterdayStart.slice(0, 10)
  const yesterdayComm  = commissions.find((c) => c.created_at.slice(0, 10) === yesterdayDateStr) ?? null
  const monthCommTotal = commissions.reduce((s, c) => s + (c.quickgo_commission ?? 0), 0)

  return NextResponse.json({
    vendor,
    kpi: {
      today_sales:        todaySales,
      today_orders:       todayOrders.length,
      month_revenue:      monthSales,
      active_products:    productCountRes.count ?? 0,
      rating:             vendor.rating ?? 0,
      yesterday_sales:    yesterdaySales,
      yesterday_orders:   yesterdayOrdersRes.data?.length ?? 0,
      prev_month_revenue: prevMonthSales,
      reviews_count:      reviewsCountRes.count ?? 0,
      month_growth_pct:   monthGrowthPct,
    },
    chart,
    recent_orders:      recentOrdersRes.data ?? [],
    top_products:       topProducts,
    sales_by_category:  salesByCategory,
    wallet:             walletRes.data ?? null,
    commission: {
      yesterday:   yesterdayComm,
      month_total: monthCommTotal,
      rate:        vendor.commission_rate ?? 5,
    },
    notifications:        notifRes.data ?? [],
    unread_notifications: unreadRes.count ?? 0,
    low_stock:            lowStockRes.data ?? [],
    badges: {
      orders:        pendingOrdersRes.count    ?? 0,
      deliveries:    deliveringOrdersRes.count ?? 0,
      messages:      unreadMsgRes.count        ?? 0,
      notifications: unreadRes.count           ?? 0,
    },
  })
}
