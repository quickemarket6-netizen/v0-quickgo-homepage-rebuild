import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin, getClientIP } from "@/lib/payments/security"
import { logAdminAction } from "@/lib/security/log-admin-action"

// Le RLS de `vendors` n'expose que les boutiques actives et ne laisse chacun
// modifier que la sienne — aucune policy admin. Via le client de session, ce
// panneau ne verrait donc jamais une boutique "inactive" (celle qui attend
// justement une approbation) et le PATCH d'approbation ne toucherait aucune
// ligne, en silence. On opère au service_role, l'accès étant déjà gardé par
// verifyAdmin() (contrôle serveur sur profiles.role).
const SERVICE_KEY_MISSING = "Configuration serveur incomplète : SUPABASE_SERVICE_ROLE_KEY absente"

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = createAdminClient()
  if (!supabase) return NextResponse.json({ error: SERVICE_KEY_MISSING }, { status: 500 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") ?? "all"
  const search = searchParams.get("search") ?? ""
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = parseInt(searchParams.get("limit") ?? "20")
  const offset = (page - 1) * limit

  let query = supabase
    .from("vendors")
    .select(`
      id, name, description, city, status, is_verified, created_at,
      logo_url, commission_rate,
      category:categories(name, slug),
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

  // Les ressources embarquées de PostgREST arrivent en objet (relation
  // many-to-one) ou en tableau selon que la contrainte unique est détectée. On
  // aplatit systématiquement : le client attend `category` en simple chaîne, et
  // rendre un objet directement en JSX fait planter React ("Objects are not
  // valid as a React child").
  function one<T>(rel: T | T[] | null | undefined): T | null {
    return Array.isArray(rel) ? (rel[0] ?? null) : (rel ?? null)
  }

  const vendors = (data ?? []).map((v) => {
    const category = one(v.category as { name?: string } | { name?: string }[] | null)
    return {
      ...v,
      category:     category?.name ?? null,
      owner:        one(v.owner),
      wallet:       one(v.wallet),
      total_orders: orderMap[v.id] ?? 0,
    }
  })

  // Les compteurs portent sur toute la table, pas sur la page courante : sinon
  // un vendeur en attente en page 2 (ou masqué par le filtre de statut actif)
  // ne serait pas compté, et la carte "En attente" afficherait 0 alors qu'une
  // demande attend une approbation.
  const countBy = async (column: "status" | "is_verified", value: string | boolean) => {
    const { count: c } = await supabase
      .from("vendors")
      .select("id", { count: "exact", head: true })
      .eq(column, value)
    return c ?? 0
  }

  const [active, inactive, suspended, verified] = await Promise.all([
    countBy("status", "active"),
    countBy("status", "inactive"),
    countBy("status", "suspended"),
    countBy("is_verified", true),
  ])
  const summary = { active, inactive, suspended, verified }

  return NextResponse.json({ vendors, total: count ?? 0, summary })
}

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = createAdminClient()
  if (!supabase) return NextResponse.json({ error: SERVICE_KEY_MISSING }, { status: 500 })

  const { id, status, is_verified, commission_rate } = await req.json()
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (status !== undefined) updates.status = status
  if (is_verified !== undefined) updates.is_verified = is_verified
  if (commission_rate !== undefined) updates.commission_rate = commission_rate

  // Snapshot the fields we're about to change, for the audit trail.
  const { data: before } = await supabase
    .from("vendors")
    .select("status, is_verified, commission_rate")
    .eq("id", id)
    .single()

  const { data, error } = await supabase
    .from("vendors")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Audit — approving/suspending/verifying a vendor or changing its commission
  // is a privileged action and must leave a trace.
  const action = status === "active" ? "approve" : status === "suspended" ? "block" : "update"
  await logAdminAction({
    adminId: admin.adminId!,
    action,
    resource: "vendor",
    resourceId: id,
    before: before ?? undefined,
    after: updates,
    ip: getClientIP(req),
  })

  return NextResponse.json(data)
}
