import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const [
    { data: profile },
    { data: recentOrders },
    { data: products },
    { data: categories },
    { count: unreadCount },
    { count: cartCount },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, wallet_balance, points, city, rating")
      .eq("id", user.id)
      .single(),
    supabase
      .from("orders")
      .select(`
        id, order_number, status, total_amount, created_at, estimated_delivery_time,
        vendor:vendors(name),
        items:order_items(product_name, quantity),
        driver_rel:drivers(user:profiles(full_name, phone))
      `)
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("products")
      .select("id, name, price, original_price, image_url, rating, vendor:vendors(name, slug), category:categories(name)")
      .eq("is_available", true)
      .eq("is_featured", true)
      .limit(8),
    supabase
      .from("categories")
      .select("id, name, slug, icon, color")
      .eq("is_active", true)
      .order("sort_order")
      .limit(8),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false),
    supabase
      .from("cart_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ])

  return NextResponse.json({
    profile,
    recentOrders: recentOrders ?? [],
    products: products ?? [],
    categories: categories ?? [],
    unreadCount: unreadCount ?? 0,
    cartCount: cartCount ?? 0,
  })
}
