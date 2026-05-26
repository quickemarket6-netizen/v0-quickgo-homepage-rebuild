import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  return data?.role === "admin" || data?.role === "super_admin" ? user : null
}

// GET — wallet balance + orders pending driver payment
export async function GET(req: Request) {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get("filter") ?? "unpaid" // unpaid | paid | all

  // Delivery wallet singleton
  const { data: wallet, error: walletErr } = await supabase
    .from("delivery_wallet")
    .select("*")
    .limit(1)
    .single()

  if (walletErr) return NextResponse.json({ error: walletErr.message }, { status: 500 })

  // Order deliveries with related data
  let query = supabase
    .from("order_delivery")
    .select(`
      id, delivery_fee, delivery_type, driver_status,
      driver_paid, driver_paid_at, driver_payment_method, driver_payment_reference,
      created_at, updated_at,
      order:orders(id, order_number, total, created_at, status,
        customer:profiles!orders_customer_id_fkey(full_name, phone),
        vendor:vendors(name)
      ),
      driver:profiles!order_delivery_driver_id_fkey(id, full_name, phone, avatar_url),
      delivery_rate:delivery_rates(name, amount)
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  if (filter === "unpaid")  query = query.eq("driver_paid", false).eq("driver_status", "delivered")
  if (filter === "paid")    query = query.eq("driver_paid", true)

  const { data: deliveries, error: delErr } = await query
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  // Summary stats
  const pendingPayment = (deliveries ?? [])
    .filter((d) => !d.driver_paid && d.driver_status === "delivered")
    .reduce((s, d) => s + (d.delivery_fee ?? 0), 0)

  return NextResponse.json({
    wallet,
    deliveries: deliveries ?? [],
    pending_payment: pendingPayment,
  })
}

// POST — pay a driver from the delivery wallet
export async function POST(req: Request) {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })

  const { order_delivery_id, driver_id, amount, payment_method, payment_reference } = await req.json()

  if (!order_delivery_id || !driver_id || !amount || !payment_method)
    return NextResponse.json({ error: "order_delivery_id, driver_id, amount et payment_method sont requis" }, { status: 400 })

  // Check order_delivery exists and not already paid
  const { data: od, error: odErr } = await supabase
    .from("order_delivery")
    .select("id, driver_paid, driver_id, delivery_fee")
    .eq("id", order_delivery_id)
    .single()

  if (odErr || !od) return NextResponse.json({ error: "Livraison introuvable" }, { status: 404 })
  if (od.driver_paid)  return NextResponse.json({ error: "Ce livreur a déjà été payé pour cette livraison" }, { status: 409 })
  if (od.driver_id !== driver_id) return NextResponse.json({ error: "Le chauffeur ne correspond pas" }, { status: 422 })

  // Atomic deduction from delivery wallet + mark as paid
  const { data: result, error: fnErr } = await supabase.rpc("pay_driver_from_delivery_wallet", {
    p_driver_id: driver_id,
    p_amount: amount,
    p_order_delivery_id: order_delivery_id,
  })

  if (fnErr) return NextResponse.json({ error: fnErr.message }, { status: 500 })
  if (!result?.success) return NextResponse.json({ error: result?.error ?? "Paiement refusé" }, { status: 422 })

  // Store payment method + reference
  await supabase
    .from("order_delivery")
    .update({
      driver_payment_method: payment_method,
      driver_payment_reference: payment_reference ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", order_delivery_id)

  return NextResponse.json({ success: true, paid: amount })
}
