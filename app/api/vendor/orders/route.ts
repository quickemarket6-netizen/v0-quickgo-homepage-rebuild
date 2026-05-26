import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function getVendorId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("vendors")
    .select("id")
    .eq("owner_id", userId)
    .single()
  return data?.id ?? null
}

export async function GET(req: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const vendorId = await getVendorId(supabase, user.id)
  if (!vendorId) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")   // pending|confirmed|preparing|ready|delivering|delivered|cancelled
  const search = searchParams.get("search")
  const limit  = Math.min(Number(searchParams.get("limit")  ?? 50), 100)
  const offset = Number(searchParams.get("offset") ?? 0)

  let query = supabase
    .from("orders")
    .select(`
      id, order_number, status, payment_status, payment_method,
      subtotal, delivery_fee, discount, total, notes,
      delivery_address, created_at, updated_at, delivered_at,
      items:order_items(
        id, quantity, unit_price, total_price,
        product:products(id, name, images)
      ),
      customer:profiles!orders_customer_id_fkey(full_name, phone, avatar_url),
      driver:profiles!orders_driver_id_fkey(full_name, phone)
    `, { count: "exact" })
    .eq("vendor_id", vendorId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (status && status !== "all") query = query.eq("status", status)

  if (search) {
    query = query.or(
      `order_number.ilike.%${search}%`
    )
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Status summary counts
  const { data: counts } = await supabase
    .from("orders")
    .select("status")
    .eq("vendor_id", vendorId)

  const summary: Record<string, number> = {}
  for (const row of counts ?? []) {
    summary[row.status] = (summary[row.status] ?? 0) + 1
  }

  return NextResponse.json({ orders: data ?? [], total: count ?? 0, summary })
}
