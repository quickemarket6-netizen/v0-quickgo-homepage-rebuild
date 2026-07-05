import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { CASH_ON_HAND_CAP } from "@/lib/payments/cash"

const REMITTANCE_METHODS = new Set(["cash_deposit", "orange_money", "mtn_momo"])

// GET /api/driver/cash — solde d'espèces + journal (collectes et remises)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, cash_on_hand")
    .eq("user_id", user.id)
    .single()
  if (!driver) return NextResponse.json({ error: "Profil livreur non trouvé" }, { status: 404 })

  const { data: events } = await supabase
    .from("driver_cash_events")
    .select("id, order_id, type, amount, balance_after, status, method, note, created_at")
    .eq("driver_id", driver.id)
    .order("created_at", { ascending: false })
    .limit(30)

  const pendingRemittance = (events ?? [])
    .filter((e) => e.type === "remittance" && e.status === "pending")
    .reduce((s, e) => s + Number(e.amount), 0)

  return NextResponse.json({
    cash_on_hand: Number(driver.cash_on_hand ?? 0),
    cap: CASH_ON_HAND_CAP,
    pending_remittance: pendingRemittance,
    blocked: Number(driver.cash_on_hand ?? 0) >= CASH_ON_HAND_CAP,
    events: events ?? [],
  })
}

// POST /api/driver/cash — déclarer une remise d'espèces (validée par un admin)
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, cash_on_hand")
    .eq("user_id", user.id)
    .single()
  if (!driver) return NextResponse.json({ error: "Profil livreur non trouvé" }, { status: 404 })

  const body = await request.json().catch(() => null)
  const amount = Number(body?.amount)
  const method = typeof body?.method === "string" && REMITTANCE_METHODS.has(body.method)
    ? body.method : "cash_deposit"
  const note = typeof body?.note === "string" ? body.note.slice(0, 500) : null

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Montant invalide" }, { status: 400 })
  }

  const cashOnHand = Number(driver.cash_on_hand ?? 0)

  // Les remises déjà déclarées (en attente de validation) réduisent ce qui
  // peut encore être déclaré — évite les doubles déclarations.
  const { data: pending } = await supabase
    .from("driver_cash_events")
    .select("amount")
    .eq("driver_id", driver.id)
    .eq("type", "remittance")
    .eq("status", "pending")
  const alreadyPending = (pending ?? []).reduce((s, e) => s + Number(e.amount), 0)

  if (amount > cashOnHand - alreadyPending) {
    return NextResponse.json(
      { error: `Montant supérieur au cash à remettre (${cashOnHand - alreadyPending} FCFA restants à déclarer).` },
      { status: 400 },
    )
  }

  const { data: event, error } = await supabase
    .from("driver_cash_events")
    .insert({
      driver_id: driver.id,
      type: "remittance",
      amount,
      status: "pending",
      method,
      note,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(event, { status: 201 })
}
