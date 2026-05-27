import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function getVendorId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("vendors")
    .select("id")
    .eq("owner_id", userId)
    .single()
  return data?.id ?? null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const vendorId = await getVendorId(supabase, user.id)
  if (!vendorId) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      items:order_items(
        id, quantity, unit_price, total_price,
        product:products(id, name, images)
      ),
      customer:profiles!orders_customer_id_fkey(full_name, phone, avatar_url),
      driver:profiles!orders_driver_id_fkey(full_name, phone)
    `)
    .eq("id", id)
    .eq("vendor_id", vendorId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const vendorId = await getVendorId(supabase, user.id)
  if (!vendorId) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const body = await req.json()
  const allowed = ["status", "notes"]
  const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  if (!Object.keys(update).length)
    return NextResponse.json({ error: "Aucun champ modifiable fourni" }, { status: 400 })

  const VENDOR_TRANSITIONS: Record<string, string[]> = {
    pending:   ["confirmed", "cancelled"],
    confirmed: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
  }

  if (update.status) {
    const { data: current } = await supabase
      .from("orders")
      .select("status")
      .eq("id", id)
      .eq("vendor_id", vendorId)
      .single()

    if (!current) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })

    const allowed_next = VENDOR_TRANSITIONS[current.status] ?? []
    if (!allowed_next.includes(update.status as string))
      return NextResponse.json({ error: `Transition ${current.status} → ${update.status} non autorisée` }, { status: 422 })
  }

  const { data, error } = await supabase
    .from("orders")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("vendor_id", vendorId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
