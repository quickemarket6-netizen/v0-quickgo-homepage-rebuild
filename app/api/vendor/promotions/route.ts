import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// Promotion row type
type PromoRow = {
  id: string
  vendor_id: string
  name: string
  code: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  min_order_amount: number | null
  max_uses: number | null
  current_uses: number
  starts_at: string | null
  ends_at: string | null
  is_active: boolean
  created_at: string
}

function promoStatus(p: PromoRow): "active" | "scheduled" | "expired" | "inactive" {
  const now = new Date()
  if (!p.is_active) return "inactive"
  if (p.ends_at && new Date(p.ends_at) < now) return "expired"
  if (p.starts_at && new Date(p.starts_at) > now) return "scheduled"
  return "active"
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
    .from("promotions")
    .select("id, name, code, discount_type, discount_value, min_order_amount, max_uses, current_uses, starts_at, ends_at, is_active, created_at")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })

  const promos = (all ?? []) as unknown as PromoRow[]

  const withStatus = promos.map(p => ({ ...p, status: promoStatus(p) }))

  const filtered = filter === "all" ? withStatus : withStatus.filter(p => {
    if (filter === "active")    return p.status === "active"
    if (filter === "scheduled") return p.status === "scheduled"
    if (filter === "expired")   return p.status === "expired" || p.status === "inactive"
    return true
  })

  const activeCount    = withStatus.filter(p => p.status === "active").length
  const totalUses      = withStatus.reduce((s, p) => s + (p.current_uses ?? 0), 0)
  const scheduledCount = withStatus.filter(p => p.status === "scheduled").length
  const expiredCount   = withStatus.filter(p => p.status === "expired" || p.status === "inactive").length

  return NextResponse.json({
    promotions: filtered,
    kpi: {
      total:          promos.length,
      active:         activeCount,
      total_uses:     totalUses,
      scheduled:      scheduledCount,
    },
    counts: {
      all:       promos.length,
      active:    activeCount,
      scheduled: scheduledCount,
      expired:   expiredCount,
    },
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
    name?: string; code?: string; discount_type?: string; discount_value?: number
    min_order_amount?: number | null; max_uses?: number | null
    starts_at?: string | null; ends_at?: string | null
  }

  if (!body.name?.trim() || !body.code?.trim() || !body.discount_type || !body.discount_value) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })
  }
  if (!["percentage", "fixed"].includes(body.discount_type)) {
    return NextResponse.json({ error: "Type de réduction invalide" }, { status: 400 })
  }
  if (body.discount_type === "percentage" && (body.discount_value <= 0 || body.discount_value > 100)) {
    return NextResponse.json({ error: "Le pourcentage doit être entre 1 et 100" }, { status: 400 })
  }

  // Check code uniqueness for this vendor
  const { data: existing } = await supabase
    .from("promotions")
    .select("id")
    .eq("vendor_id", vendor.id)
    .eq("code", body.code.toUpperCase().trim())
    .single()
  if (existing) return NextResponse.json({ error: "Ce code promo existe déjà" }, { status: 409 })

  const { data: promo, error } = await supabase
    .from("promotions")
    .insert({
      vendor_id:        vendor.id,
      name:             body.name.trim(),
      code:             body.code.toUpperCase().trim(),
      discount_type:    body.discount_type,
      discount_value:   body.discount_value,
      min_order_amount: body.min_order_amount ?? null,
      max_uses:         body.max_uses ?? null,
      starts_at:        body.starts_at ?? null,
      ends_at:          body.ends_at ?? null,
      is_active:        true,
      current_uses:     0,
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, promo })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("owner_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const { promotion_id, is_active } = await req.json() as { promotion_id?: string; is_active?: boolean }
  if (!promotion_id || is_active === undefined) {
    return NextResponse.json({ error: "promotion_id et is_active requis" }, { status: 400 })
  }

  const { error } = await supabase
    .from("promotions")
    .update({ is_active })
    .eq("id", promotion_id)
    .eq("vendor_id", vendor.id)

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

  const { promotion_id } = await req.json() as { promotion_id?: string }
  if (!promotion_id) return NextResponse.json({ error: "promotion_id requis" }, { status: 400 })

  const { error } = await supabase
    .from("promotions")
    .delete()
    .eq("id", promotion_id)
    .eq("vendor_id", vendor.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
