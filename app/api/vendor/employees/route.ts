import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

type MemberStatus = "active" | "invited" | "inactive"
type MemberRole   = "owner" | "manager" | "sales" | "support" | "logistics" | "accountant"

type MemberRow = {
  id: string; vendor_id: string; name: string; email: string
  phone: string | null; role: MemberRole; status: MemberStatus
  avatar_url: string | null; last_active: string | null; created_at: string
}

async function getVendor(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { user: null, vendor: null }
  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("owner_id", user.id).single()
  return { user, vendor: vendor as { id: string } | null }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { user, vendor } = await getVendor(supabase)
  if (!user)   return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const filter = req.nextUrl.searchParams.get("filter") ?? "all"

  let query = supabase
    .from("team_members")
    .select("id, vendor_id, name, email, phone, role, status, avatar_url, last_active, created_at")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })

  if (filter === "active")   query = query.eq("status", "active")
  if (filter === "invited")  query = query.eq("status", "invited")
  if (filter === "inactive") query = query.eq("status", "inactive")

  const { data: members } = await query
  const rows = (members ?? []) as unknown as MemberRow[]

  const { data: all } = await supabase
    .from("team_members")
    .select("id, status")
    .eq("vendor_id", vendor.id)
  const allRows = (all ?? []) as { id: string; status: MemberStatus }[]

  return NextResponse.json({
    members: rows,
    kpi: {
      total:    allRows.length,
      active:   allRows.filter(m => m.status === "active").length,
      invited:  allRows.filter(m => m.status === "invited").length,
      inactive: allRows.filter(m => m.status === "inactive").length,
    },
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { user, vendor } = await getVendor(supabase)
  if (!user)   return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const body = await req.json() as {
    name?: string; email?: string; phone?: string; role?: MemberRole
  }

  if (!body.name?.trim())  return NextResponse.json({ error: "Nom requis" }, { status: 400 })
  if (!body.email?.trim()) return NextResponse.json({ error: "Email requis" }, { status: 400 })

  const { data: existing } = await supabase
    .from("team_members")
    .select("id")
    .eq("vendor_id", vendor.id)
    .eq("email", body.email.trim().toLowerCase())
    .single()

  if (existing) return NextResponse.json({ error: "Cet email est déjà dans l'équipe" }, { status: 409 })

  const { data: member, error } = await supabase
    .from("team_members")
    .insert({
      vendor_id: vendor.id,
      name:      body.name.trim(),
      email:     body.email.trim().toLowerCase(),
      phone:     body.phone?.trim() ?? null,
      role:      body.role ?? "sales",
      status:    "invited",
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, member })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { user, vendor } = await getVendor(supabase)
  if (!user)   return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const body = await req.json() as {
    member_id: string; role?: MemberRole; status?: MemberStatus
  }

  if (!body.member_id) return NextResponse.json({ error: "member_id requis" }, { status: 400 })

  const update: Record<string, unknown> = {}
  if (body.role   !== undefined) update.role   = body.role
  if (body.status !== undefined) update.status = body.status

  const { error } = await supabase
    .from("team_members")
    .update(update)
    .eq("id", body.member_id)
    .eq("vendor_id", vendor.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { user, vendor } = await getVendor(supabase)
  if (!user)   return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const body = await req.json() as { member_id: string }
  if (!body.member_id) return NextResponse.json({ error: "member_id requis" }, { status: 400 })

  const { error } = await supabase
    .from("team_members")
    .delete()
    .eq("id", body.member_id)
    .eq("vendor_id", vendor.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
