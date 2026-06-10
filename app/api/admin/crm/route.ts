import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

// GET  /api/admin/crm?customer_id=xxx   → profile + orders + notes + tickets
// POST /api/admin/crm                   → add note

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const customerId = req.nextUrl.searchParams.get("customer_id")
  if (!customerId) return NextResponse.json({ error: "customer_id requis" }, { status: 400 })

  const [profileRes, ordersRes, notesRes, ticketsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, phone, email, city, created_at, wallet_balance, loyalty_points, cashback_balance")
      .eq("id", customerId)
      .single(),

    supabase
      .from("orders")
      .select("id, order_number, status, total, total_amount, created_at, vendor:vendors(name)")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(20),

    supabase
      .from("customer_notes")
      .select("id, agent_name, note, tags, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false }),

    supabase
      .from("support_tickets")
      .select("id, ticket_number, subject, status, priority, created_at")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  if (profileRes.error) return NextResponse.json({ error: profileRes.error.message }, { status: 500 })

  const orders   = ordersRes.data ?? []
  const spent    = orders.reduce((s, o) => s + Number(o.total_amount ?? o.total ?? 0), 0)
  const segment  = orders.length >= 10 ? "vip" : orders.length >= 3 ? "regular" : "new"

  return NextResponse.json({
    customer: {
      ...profileRes.data,
      orders_count: orders.length,
      total_spent:  spent,
      segment,
    },
    orders,
    notes:   notesRes.data   ?? [],
    tickets: ticketsRes.data ?? [],
  })
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const { customer_id, note, tags } = await req.json() as {
    customer_id?: string; note?: string; tags?: string[]
  }

  if (!customer_id || !note?.trim()) {
    return NextResponse.json({ error: "customer_id et note requis" }, { status: 400 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", admin.adminId)
    .single()

  const { data, error } = await supabase
    .from("customer_notes")
    .insert({
      customer_id,
      agent_id:   admin.adminId,
      agent_name: profile?.full_name ?? "Admin",
      note:       note.trim(),
      tags:       tags ?? [],
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
