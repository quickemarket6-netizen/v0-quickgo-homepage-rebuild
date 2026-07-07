import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin, getClientIP } from "@/lib/payments/security"
import { logAdminAction } from "@/lib/security/log-admin-action"

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
    .from("orders")
    .select(`
      id, order_number, status, total_amount, delivery_fee, created_at,
      delivery_address,
      customer:profiles!orders_customer_id_fkey(full_name, phone),
      vendor:vendors(name),
      driver_rel:drivers(user:profiles(full_name))
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (status !== "all") query = query.eq("status", status)
  if (search) {
    query = query.or(`order_number.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Summary counts per status
  const { data: summary } = await supabase
    .from("orders")
    .select("status")

  const counts: Record<string, number> = {}
  for (const o of summary ?? []) {
    counts[o.status] = (counts[o.status] ?? 0) + 1
  }

  return NextResponse.json({ orders: data ?? [], total: count ?? 0, summary: counts })
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: "id et status requis" }, { status: 400 })

  const { data: prev } = await supabase
    .from("orders")
    .select("status")
    .eq("id", id)
    .single()

  const { data, error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audit — an admin forcing an order status (esp. cancelled/refunded) is a
  // privileged override worth tracing.
  await logAdminAction({
    adminId: admin.adminId!,
    action: status === "cancelled" ? "reject" : "update",
    resource: "order",
    resourceId: id,
    before: prev ?? undefined,
    after: { status },
    ip: getClientIP(req),
  })

  return NextResponse.json(data)
}
