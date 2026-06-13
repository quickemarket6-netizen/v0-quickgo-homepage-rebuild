import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
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

  // Whitelist assignable roles — admin/super_admin promotion is intentionally excluded
  const ASSIGNABLE_ROLES = ["customer", "vendor", "driver", "suspended"]
  if (role !== undefined && !ASSIGNABLE_ROLES.includes(role)) {
    return NextResponse.json({ error: "Rôle non autorisé via cette action" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — create a new user account (requires service role key)
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Service role non configuré" }, { status: 500 })
  }

  const { full_name, email, phone, password, role } = await req.json() as {
    full_name?: string; email?: string; phone?: string; password?: string; role?: string
  }

  if (!full_name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: "Nom, email et mot de passe requis" }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Mot de passe : minimum 8 caractères" }, { status: 400 })
  }
  const allowedRoles = ["customer", "vendor", "driver"]
  const userRole = allowedRoles.includes(role ?? "") ? role! : "customer"

  const service = createServiceClient(supabaseUrl, serviceKey)
  const { data: created, error: createErr } = await service.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name.trim() },
  })
  if (createErr) {
    return NextResponse.json({ error: createErr.message }, { status: 400 })
  }

  // The profiles row is normally created by trigger; upsert to set fields either way
  await service.from("profiles").upsert({
    id: created.user.id,
    full_name: full_name.trim(),
    email: email.trim(),
    phone: phone?.trim() || null,
    role: userRole,
  }, { onConflict: "id" })

  return NextResponse.json({ success: true, user_id: created.user.id }, { status: 201 })
}
