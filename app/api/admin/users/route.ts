import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") ?? "all"
  const search = searchParams.get("search") ?? ""
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = parseInt(searchParams.get("limit") ?? "20")
  const offset = (page - 1) * limit

  let query = supabase
    .from("profiles")
    .select("id, full_name, phone, email, role, created_at, avatar_url", { count: "exact" })
    .eq("role", "customer")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)

  const { data: profiles, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach order counts
  const ids = (profiles ?? []).map((p) => p.id)
  const { data: orderData } = await supabase
    .from("orders")
    .select("customer_id, total_amount")
    .in("customer_id", ids)

  const orderMap: Record<string, { count: number; total: number }> = {}
  for (const o of orderData ?? []) {
    if (!orderMap[o.customer_id]) orderMap[o.customer_id] = { count: 0, total: 0 }
    orderMap[o.customer_id].count++
    orderMap[o.customer_id].total += Number(o.total_amount ?? 0)
  }

  const users = (profiles ?? []).map((p) => ({
    ...p,
    orders_count: orderMap[p.id]?.count ?? 0,
    total_spent: orderMap[p.id]?.total ?? 0,
  }))

  const totalCount = count ?? 0

  return NextResponse.json({ users, total: totalCount })
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const { id, role } = await req.json()
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
