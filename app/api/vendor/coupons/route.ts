import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

type CouponType = "percentage" | "fixed" | "free_shipping" | "gift"
type CouponStatus = "active" | "scheduled" | "expired" | "exhausted" | "inactive"

type CouponRow = {
  id: string; vendor_id: string; name: string; code: string
  type: CouponType; value: number | null; min_order_amount: number | null
  max_uses: number | null; current_uses: number; is_single_use: boolean
  starts_at: string | null; ends_at: string | null
  is_active: boolean; created_at: string
}

function couponStatus(c: CouponRow): CouponStatus {
  const now = new Date()
  if (!c.is_active) return "inactive"
  if (c.max_uses !== null && c.current_uses >= c.max_uses) return "exhausted"
  if (c.ends_at && new Date(c.ends_at) < now) return "expired"
  if (c.starts_at && new Date(c.starts_at) > now) return "scheduled"
  return "active"
}

function randomCode(len = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("owner_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const filter = req.nextUrl.searchParams.get("filter") ?? "all"

  const { data: all } = await supabase
    .from("coupons")
    .select("id, name, code, type, value, min_order_amount, max_uses, current_uses, is_single_use, starts_at, ends_at, is_active, created_at")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })

  const coupons = (all ?? []) as unknown as CouponRow[]
  const withStatus = coupons.map(c => ({ ...c, status: couponStatus(c) }))

  const filtered = filter === "all" ? withStatus : withStatus.filter(c => {
    if (filter === "active")    return c.status === "active"
    if (filter === "scheduled") return c.status === "scheduled"
    if (filter === "exhausted") return c.status === "exhausted"
    if (filter === "expired")   return c.status === "expired" || c.status === "inactive"
    return true
  })

  const totalUses       = withStatus.reduce((s, c) => s + (c.current_uses ?? 0), 0)
  const activeCount     = withStatus.filter(c => c.status === "active").length
  const exhaustedCount  = withStatus.filter(c => c.status === "exhausted").length
  const scheduledCount  = withStatus.filter(c => c.status === "scheduled").length
  const expiredCount    = withStatus.filter(c => c.status === "expired" || c.status === "inactive").length

  return NextResponse.json({
    coupons: filtered,
    kpi: { total: coupons.length, active: activeCount, total_uses: totalUses, exhausted: exhaustedCount },
    counts: { all: coupons.length, active: activeCount, scheduled: scheduledCount, exhausted: exhaustedCount, expired: expiredCount },
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("owner_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const body = await req.json() as {
    name?: string; code?: string; type?: string; value?: number | null
    min_order_amount?: number | null; max_uses?: number | null
    is_single_use?: boolean; starts_at?: string | null; ends_at?: string | null
    bulk?: number  // generate N codes
  }

  if (!body.name?.trim() || !body.type) {
    return NextResponse.json({ error: "Nom et type requis" }, { status: 400 })
  }
  if (!["percentage", "fixed", "free_shipping", "gift"].includes(body.type)) {
    return NextResponse.json({ error: "Type invalide" }, { status: 400 })
  }
  if (["percentage", "fixed"].includes(body.type) && !body.value) {
    return NextResponse.json({ error: "Valeur requise pour ce type" }, { status: 400 })
  }
  if (body.type === "percentage" && body.value && (body.value <= 0 || body.value > 100)) {
    return NextResponse.json({ error: "Le pourcentage doit être entre 1 et 100" }, { status: 400 })
  }

  const bulkCount = Math.min(body.bulk ?? 1, 50)
  const codes: string[] = []

  if (body.bulk && bulkCount > 1) {
    // Bulk generation — ignore provided code, generate unique ones
    for (let i = 0; i < bulkCount; i++) codes.push(randomCode())
  } else {
    if (!body.code?.trim()) return NextResponse.json({ error: "Code requis" }, { status: 400 })
    codes.push(body.code.toUpperCase().trim())
  }

  // Check uniqueness for all codes
  for (const code of codes) {
    const { data: existing } = await supabase
      .from("coupons").select("id").eq("vendor_id", vendor.id).eq("code", code).single()
    if (existing) return NextResponse.json({ error: `Le code "${code}" existe déjà` }, { status: 409 })
  }

  const rows = codes.map(code => ({
    vendor_id:        vendor.id,
    name:             body.name!.trim(),
    code,
    type:             body.type,
    value:            ["free_shipping", "gift"].includes(body.type!) ? null : (body.value ?? null),
    min_order_amount: body.min_order_amount ?? null,
    max_uses:         body.is_single_use ? 1 : (body.max_uses ?? null),
    is_single_use:    body.is_single_use ?? false,
    starts_at:        body.starts_at ?? null,
    ends_at:          body.ends_at ?? null,
    is_active:        true,
    current_uses:     0,
  }))

  const { error } = await supabase.from("coupons").insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, count: rows.length })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("owner_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const { coupon_id, is_active } = await req.json() as { coupon_id?: string; is_active?: boolean }
  if (!coupon_id || is_active === undefined) {
    return NextResponse.json({ error: "coupon_id et is_active requis" }, { status: 400 })
  }

  const { error } = await supabase
    .from("coupons").update({ is_active })
    .eq("id", coupon_id).eq("vendor_id", vendor.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("owner_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const { coupon_id } = await req.json() as { coupon_id?: string }
  if (!coupon_id) return NextResponse.json({ error: "coupon_id requis" }, { status: 400 })

  const { error } = await supabase
    .from("coupons").delete().eq("id", coupon_id).eq("vendor_id", vendor.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
