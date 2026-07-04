import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

// GET  /api/driver/available  — orders ready for pickup with no driver assigned
// POST /api/driver/available  — driver accepts a delivery job

const CATEGORY_TYPE: Record<string, string> = {
  restaurant: "restaurant",
  Restaurant:  "restaurant",
  Supermarché: "supermarket",
  supermarche: "supermarket",
  Pharmacie:   "pharmacy",
  pharmacie:   "pharmacy",
  Mode:        "package",
  Électronique:"package",
}

function categoryToType(cat?: string): string {
  if (!cat) return "package"
  return CATEGORY_TYPE[cat] ?? "package"
}

// Rough distance estimate (km) from delivery_fee — avg 700 CFA/km in Cameroon
function estimateKm(fee: number): number {
  return Math.max(1, Math.round((fee / 700) * 10) / 10)
}

function estimateTime(fee: number): number {
  return Math.max(10, Math.round(estimateKm(fee) * 4 + 5))
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, city")
    .eq("user_id", user.id)
    .single()

  if (!driver) return NextResponse.json({ error: "Profil livreur introuvable" }, { status: 404 })

  const cityFilter = req.nextUrl.searchParams.get("city") ?? driver.city

  // Orders that are ready (vendor prepared) and have no driver yet
  let query = supabase
    .from("orders")
    .select(`
      id, order_number, delivery_fee, delivery_address,
      created_at,
      vendor:vendors(id, name, slug, rating, address, city, category)
    `)
    .eq("status", "ready")
    .is("driver_id", null)
    .order("created_at", { ascending: true })
    .limit(30)

  if (cityFilter) {
    // Filter by vendor city — best proxy for driver's area
    query = query.eq("vendors.city", cityFilter)
  }

  const { data: orders, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const deliveries = (orders ?? []).map((o, i) => {
    const vendor = o.vendor as {
      id?: string; name?: string; rating?: number; address?: string; city?: string; category?: string
    } | null
    const fee       = Number(o.delivery_fee ?? 0)
    const addr      = typeof o.delivery_address === "string"
      ? JSON.parse(o.delivery_address)
      : (o.delivery_address ?? {})

    return {
      id:            o.id,
      order_number:  o.order_number,
      type:          categoryToType(vendor?.category),
      merchant:      vendor?.name ?? "Vendeur",
      pickup:        vendor?.address ?? vendor?.city ?? "Yaoundé",
      dropoff:       addr?.street ?? addr?.city ?? "Adresse client",
      distance:      estimateKm(fee),
      earnings:      fee,
      estimatedTime: estimateTime(fee),
      surge:         1.0,
      rating:        vendor?.rating ?? 4.5,
      difficulty:    fee > 3000 ? "hard" : fee > 1500 ? "medium" : "easy",
      traffic:       "moderate",
      featured:      i === 0,
    }
  })

  return NextResponse.json(deliveries)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { order_id } = await req.json() as { order_id?: string }
  if (!order_id) return NextResponse.json({ error: "order_id requis" }, { status: 400 })

  const { data: driver } = await supabase
    .from("drivers")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!driver) return NextResponse.json({ error: "Profil livreur introuvable" }, { status: 404 })

  // Race condition guard — only accept if still unassigned and ready
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, driver_id")
    .eq("id", order_id)
    .single()

  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 })
  if (order.status !== "ready") return NextResponse.json({ error: "Commande déjà prise en charge" }, { status: 409 })
  if (order.driver_id) return NextResponse.json({ error: "Commande déjà assignée à un livreur" }, { status: 409 })

  // orders.driver_id référence auth.users(id) → on stocke user.id (= profiles.id).
  // Statut "delivering" : commande assignée et en cours d'acheminement — c'est
  // le vocabulaire utilisé par active-delivery et le suivi client.
  const { data: updated, error } = await supabase
    .from("orders")
    .update({ driver_id: user.id, status: "delivering" })
    .eq("id", order_id)
    .eq("status", "ready")   // extra guard
    .is("driver_id", null)
    .select()
    .single()

  if (error || !updated) {
    return NextResponse.json({ error: "Impossible d'accepter la mission — déjà prise" }, { status: 409 })
  }

  // Increment driver total_deliveries counter
  await supabase.rpc("increment_driver_deliveries", { p_driver_id: driver.id }).maybeSingle()

  return NextResponse.json({ success: true, order: updated })
}
