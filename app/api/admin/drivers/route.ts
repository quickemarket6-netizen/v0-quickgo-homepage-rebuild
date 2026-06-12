import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

const VALID_STATUSES = ["online", "delivering", "offline", "suspended"]

const DRIVER_SELECT = `
  id, status, vehicle_type, vehicle_brand, vehicle_model, license_plate,
  rating, total_deliveries, total_earnings, city, is_verified, created_at,
  user:profiles!user_id(id, full_name, phone, email, avatar_url)
`

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") ?? "all"
  const search = searchParams.get("search") ?? ""
  const page   = Math.max(1, parseInt(searchParams.get("page")  ?? "1"))
  const limit  = Math.min(100, parseInt(searchParams.get("limit") ?? "20"))
  const offset = (page - 1) * limit

  // ── Summary counts (always across all statuses) ────────────────────────────
  const { data: allForSummary } = await supabase.from("drivers").select("status")
  const summary: Record<string, number> = {}
  for (const d of allForSummary ?? []) summary[d.status] = (summary[d.status] ?? 0) + 1

  // ── Build base query ───────────────────────────────────────────────────────
  let base = supabase.from("drivers").select(DRIVER_SELECT, { count: "exact" })
  if (status !== "all") base = base.eq("status", status)

  // ── Search: fetch all matching rows then filter + paginate client-side ──────
  if (search.trim()) {
    const { data, error } = await base.order("total_deliveries", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const q = search.toLowerCase()
    const filtered = (data ?? []).filter(d => {
      const u = d.user as { full_name?: string; email?: string } | null
      return (
        (u?.full_name?.toLowerCase().includes(q) ?? false) ||
        (u?.email?.toLowerCase().includes(q)     ?? false)
      )
    })

    return NextResponse.json({
      drivers: filtered.slice(offset, offset + limit),
      total:   filtered.length,
      summary,
    })
  }

  // ── Normal paginated query ─────────────────────────────────────────────────
  const { data, error, count } = await base
    .order("total_deliveries", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ drivers: data ?? [], total: count ?? 0, summary })
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const { id, status } = await req.json()
  if (!id || !status)                  return NextResponse.json({ error: "id et status requis" }, { status: 400 })
  if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: "status invalide"    }, { status: 400 })

  const { data, error } = await supabase
    .from("drivers")
    .update({ status })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — register an existing user (by email) as a driver
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const { email, vehicle_type, city } = await req.json() as {
    email?: string; vehicle_type?: string; city?: string
  }
  if (!email?.trim()) return NextResponse.json({ error: "Email requis" }, { status: 400 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("email", email.trim())
    .single()
  if (!profile) {
    return NextResponse.json({ error: "Aucun utilisateur trouvé avec cet email — créez d'abord le compte" }, { status: 404 })
  }

  const { data: existing } = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", profile.id)
    .maybeSingle()
  if (existing) {
    return NextResponse.json({ error: "Cet utilisateur est déjà livreur" }, { status: 400 })
  }

  const { data: driver, error } = await supabase
    .from("drivers")
    .insert({
      user_id: profile.id,
      status: "offline",
      vehicle_type: vehicle_type ?? "moto",
      city: city ?? null,
    })
    .select("id")
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from("profiles").update({ role: "driver" }).eq("id", profile.id)

  return NextResponse.json({ success: true, driver_id: driver.id }, { status: 201 })
}
