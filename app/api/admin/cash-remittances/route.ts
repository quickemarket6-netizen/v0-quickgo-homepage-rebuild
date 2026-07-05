import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

// GET /api/admin/cash-remittances — remises en attente + soldes cash des livreurs
export async function GET() {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()

  const [remittancesRes, driversRes] = await Promise.all([
    supabase
      .from("driver_cash_events")
      .select(`
        id, driver_id, type, amount, status, method, note, created_at, reviewed_at,
        driver:drivers(id, cash_on_hand, user:profiles(full_name, phone))
      `)
      .eq("type", "remittance")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("drivers")
      .select("id, cash_on_hand, user:profiles(full_name, phone)")
      .gt("cash_on_hand", 0)
      .order("cash_on_hand", { ascending: false })
      .limit(50),
  ])

  return NextResponse.json({
    remittances: remittancesRes.data ?? [],
    drivers_with_cash: driversRes.data ?? [],
  })
}

// POST /api/admin/cash-remittances — confirmer ou rejeter une remise
// body: { id, action: "confirm" | "reject", note? }
export async function POST(request: Request) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const body = await request.json().catch(() => null)
  const id = typeof body?.id === "string" ? body.id : null
  const action = body?.action
  if (!id || !["confirm", "reject"].includes(action)) {
    return NextResponse.json({ error: "id et action (confirm|reject) requis" }, { status: 400 })
  }

  const { data: event } = await supabase
    .from("driver_cash_events")
    .select("id, driver_id, amount, status, type, driver:drivers(user_id)")
    .eq("id", id)
    .eq("type", "remittance")
    .single()

  if (!event) return NextResponse.json({ error: "Remise introuvable" }, { status: 404 })
  if (event.status !== "pending") {
    return NextResponse.json({ error: "Remise déjà traitée" }, { status: 409 })
  }

  if (action === "confirm") {
    // Débit atomique du cash en main — échoue si le solde deviendrait négatif
    const { data: adj } = await supabase.rpc("adjust_driver_cash", {
      p_driver_id: event.driver_id,
      p_amount: -Number(event.amount),
    })
    if (!adj?.success) {
      return NextResponse.json(
        { error: adj?.error ?? "Ajustement du cash impossible" },
        { status: 409 },
      )
    }

    await supabase
      .from("driver_cash_events")
      .update({
        status: "confirmed",
        balance_after: adj.balance,
        reviewed_by: admin.adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending")
  } else {
    await supabase
      .from("driver_cash_events")
      .update({
        status: "rejected",
        note: typeof body?.note === "string" ? body.note.slice(0, 500) : undefined,
        reviewed_by: admin.adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending")
  }

  // Notifier le livreur
  const driverUserId = (event.driver as { user_id?: string } | null)?.user_id
  if (driverUserId) {
    await supabase.from("notifications").insert({
      user_id: driverUserId,
      title: action === "confirm" ? "Remise de cash confirmée" : "Remise de cash rejetée",
      message: action === "confirm"
        ? `Votre remise de ${new Intl.NumberFormat("fr-FR").format(Number(event.amount))} FCFA a été confirmée.`
        : `Votre remise de ${new Intl.NumberFormat("fr-FR").format(Number(event.amount))} FCFA a été rejetée. Contactez le support.`,
      type: "wallet",
      data: { cash_event_id: id },
    })
  }

  return NextResponse.json({ success: true, id, action })
}
