import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { sendPushToUser } from "@/lib/push/send"

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

  // Dispatch : la commande vient de passer « prête » → prévenir les livreurs
  // en ligne pour qu'elle soit récupérée sans attendre qu'ils rafraîchissent.
  if (update.status === "ready") {
    const { data: vendor } = await supabase
      .from("vendors").select("name, city").eq("id", vendorId).single()
    const { data: onlineDrivers } = await supabase
      .from("drivers")
      .select("user_id")
      .eq("status", "online")
      .limit(20)

    const title = "Nouvelle course disponible 🛵"
    const message = `Commande ${data.order_number} prête chez ${vendor?.name ?? "une boutique"}${vendor?.city ? ` (${vendor.city})` : ""} — ${new Intl.NumberFormat("fr-FR").format(data.delivery_fee ?? 0)} FCFA de course.`

    for (const d of onlineDrivers ?? []) {
      if (!d.user_id) continue
      await supabase.from("notifications").insert({
        user_id: d.user_id,
        title,
        message,
        type: "delivery",
        data: { order_id: id },
      })
      await sendPushToUser(d.user_id, {
        title,
        body: message,
        url: "/driver/missions",
        tag: `ready-${id}`,
      })
    }
  }

  return NextResponse.json(data)
}
