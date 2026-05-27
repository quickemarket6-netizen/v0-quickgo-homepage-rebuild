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
    .from("drivers")
    .select(`
      id, status, vehicle_type, vehicle_brand, vehicle_model, license_plate,
      rating, total_deliveries, total_earnings, city, created_at,
      user:profiles(id, full_name, phone, email, avatar_url)
    `, { count: "exact" })
    .order("total_deliveries", { ascending: false })
    .range(offset, offset + limit - 1)

  if (status !== "all") query = query.eq("status", status)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (search) {
    const filtered = (data ?? []).filter((d) => {
      const name = (d.user as { full_name?: string } | null)?.full_name?.toLowerCase() ?? ""
      const email = (d.user as { email?: string } | null)?.email?.toLowerCase() ?? ""
      const q = search.toLowerCase()
      return name.includes(q) || email.includes(q)
    })
    return NextResponse.json({ drivers: filtered, total: filtered.length, summary: buildSummary(data ?? []) })
  }

  return NextResponse.json({ drivers: data ?? [], total: count ?? 0, summary: buildSummary(data ?? []) })
}

function buildSummary(drivers: { status: string }[]) {
  const counts: Record<string, number> = {}
  for (const d of drivers) {
    counts[d.status] = (counts[d.status] ?? 0) + 1
  }
  return counts
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: "id et status requis" }, { status: 400 })

  const { data, error } = await supabase
    .from("drivers")
    .update({ status })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
