import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id, name, description, logo_url, category, address, phone, delivery_radius, notification_prefs")
    .eq("owner_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const { data: profile } = await supabase
    .from("profiles").select("full_name, phone, avatar_url").eq("id", user.id).single()

  const v = vendor as {
    id: string; name: string; description: string | null; logo_url: string | null
    category: string | null; address: string | null; phone: string | null
    delivery_radius: number | null; notification_prefs: Record<string, boolean> | null
  }
  const p = profile as { full_name: string | null; phone: string | null; avatar_url: string | null } | null

  return NextResponse.json({
    vendor: {
      name:             v.name             ?? "",
      description:      v.description      ?? "",
      logo_url:         v.logo_url         ?? "",
      category:         v.category         ?? "",
      address:          v.address          ?? "",
      delivery_radius:  v.delivery_radius  ?? "",
    },
    profile: {
      full_name:  p?.full_name  ?? user.user_metadata?.full_name ?? "",
      email:      user.email    ?? "",
      phone:      p?.phone      ?? "",
      avatar_url: p?.avatar_url ?? null,
    },
    notification_prefs: v.notification_prefs ?? {
      orders: true, reviews: true, payments: true, system: true, marketing: false,
    },
  })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("owner_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const body = await req.json() as Record<string, unknown> & { section: string }

  if (body.section === "profile") {
    const full_name = (body.full_name as string | undefined)?.trim()
    const phone     = (body.phone     as string | undefined)?.trim()
    const { error } = await supabase
      .from("profiles").upsert({ id: user.id, full_name, phone })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (body.section === "shop") {
    const update: Record<string, unknown> = {}
    if (body.name             !== undefined) update.name             = (body.name as string).trim()
    if (body.description      !== undefined) update.description      = (body.description as string).trim()
    if (body.category         !== undefined) update.category         = body.category
    if (body.address          !== undefined) update.address          = (body.address as string).trim()
    if (body.delivery_radius  !== undefined) update.delivery_radius  = body.delivery_radius
    const { error } = await supabase.from("vendors").update(update).eq("id", (vendor as { id: string }).id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (body.section === "notifications") {
    const { error } = await supabase
      .from("vendors").update({ notification_prefs: body.prefs }).eq("id", (vendor as { id: string }).id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (body.section === "security") {
    const pw = (body.new_password as string | undefined)?.trim()
    if (!pw || pw.length < 6) return NextResponse.json({ error: "Minimum 6 caractères requis" }, { status: 400 })
    const { error } = await supabase.auth.updateUser({ password: pw })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
