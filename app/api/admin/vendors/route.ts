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
    .from("vendors")
    .select(`
      id, name, description, category, city, status, is_verified, created_at,
      logo_url, commission_rate,
      owner:profiles(full_name, phone, email),
      wallet:vendor_wallets(available_balance, total_earned)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (status !== "all") query = query.eq("status", status)
  if (search) query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Order counts per vendor
  const ids = (data ?? []).map((v) => v.id)
  const { data: orderData } = await supabase
    .from("orders")
    .select("vendor_id")
    .in("vendor_id", ids)
    .neq("status", "cancelled")

  const orderMap: Record<string, number> = {}
  for (const o of orderData ?? []) {
    orderMap[o.vendor_id] = (orderMap[o.vendor_id] ?? 0) + 1
  }

  const vendors = (data ?? []).map((v) => ({
    ...v,
    total_orders: orderMap[v.id] ?? 0,
  }))

  const summary = {
    active: (data ?? []).filter((v) => v.status === "active").length,
    pending: (data ?? []).filter((v) => v.status === "pending").length,
    suspended: (data ?? []).filter((v) => v.status === "suspended").length,
    verified: (data ?? []).filter((v) => v.is_verified).length,
  }

  return NextResponse.json({ vendors, total: count ?? 0, summary })
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const { id, status, is_verified, commission_rate } = await req.json()
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (status !== undefined) updates.status = status
  if (is_verified !== undefined) updates.is_verified = is_verified
  if (commission_rate !== undefined) updates.commission_rate = commission_rate

  const { data, error } = await supabase
    .from("vendors")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
