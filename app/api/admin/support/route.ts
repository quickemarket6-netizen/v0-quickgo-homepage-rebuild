import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

// ── helpers ────────────────────────────────────────────────────────────────

function startOfDay(offsetDays = 0) {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  d.setUTCDate(d.getUTCDate() - offsetDays)
  return d.toISOString()
}

const CAT_COLORS: Record<string, string> = {
  livraison: "#3b82f6", paiement: "#f97316", technique: "#8b5cf6",
  commande:  "#22c55e", plainte:  "#ef4444", compte:    "#eab308",
  general:   "#6b6b8a",
}

// ── GET ────────────────────────────────────────────────────────────────────

export async function GET() {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()

  // 1. All tickets (last 200, ordered newest-first)
  const { data: ticketsRaw, error: tErr } = await supabase
    .from("support_tickets")
    .select("id, ticket_number, subject, category, priority, status, customer_type, customer_name, assigned_to, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(200)

  if (tErr) return NextResponse.json({ error: tErr.message }, { status: 500 })

  // 2. Message counts per ticket
  const ticketIds = (ticketsRaw ?? []).map((t) => t.id)
  const { data: msgCounts } = ticketIds.length
    ? await supabase
        .from("ticket_messages")
        .select("ticket_id")
        .in("ticket_id", ticketIds)
    : { data: [] }

  const msgMap: Record<string, number> = {}
  for (const m of msgCounts ?? []) {
    msgMap[m.ticket_id] = (msgMap[m.ticket_id] ?? 0) + 1
  }

  const tickets = (ticketsRaw ?? []).map((t) => ({
    id:            t.ticket_number ?? t.id,
    subject:       t.subject,
    category:      t.category,
    priority:      t.priority,
    status:        t.status,
    customer_name: t.customer_name ?? "—",
    customer_type: t.customer_type ?? "client",
    assigned_to:   t.assigned_to ?? null,
    created_at:    t.created_at,
    updated_at:    t.updated_at,
    messages:      msgMap[t.id] ?? 0,
  }))

  // 3. KPI
  const today = startOfDay()
  const open       = tickets.filter((t) => t.status === "open")
  const inProg     = tickets.filter((t) => t.status === "in_progress")
  const escalated  = tickets.filter((t) => t.status === "escalated")
  const resolvedToday = tickets.filter(
    (t) => ["resolved", "closed"].includes(t.status) && t.updated_at >= today,
  )
  const urgent = tickets.filter((t) => t.priority === "urgent")

  // 4. Agents (admin/super_admin profiles)
  const { data: agentProfiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("role", ["admin", "super_admin"])
    .limit(20)

  const agents = (agentProfiles ?? []).map((p) => {
    const name = p.full_name ?? "Admin"
    const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    const assigned = tickets.filter((t) => t.assigned_to === name)
    return {
      id:                    p.id,
      name,
      avatar:                initials,
      online:                true,
      tickets_open:          assigned.filter((t) => ["open", "in_progress"].includes(t.status)).length,
      tickets_resolved_today: assigned.filter(
        (t) => ["resolved", "closed"].includes(t.status) && t.updated_at >= today,
      ).length,
      avg_response_min: 5,
    }
  })

  // 5. Category distribution
  const catCount: Record<string, number> = {}
  for (const t of tickets) catCount[t.category] = (catCount[t.category] ?? 0) + 1

  const category_distribution = Object.entries(catCount).map(([cat, count]) => ({
    category: cat,
    count,
    pct:   Math.round((count / Math.max(tickets.length, 1)) * 100),
    color: CAT_COLORS[cat] ?? "#6b6b8a",
  }))

  // 6. Status distribution
  const status_distribution = [
    { status: "Ouverts",   count: open.length,      color: "#ef4444" },
    { status: "En cours",  count: inProg.length,    color: "#f59e0b" },
    { status: "Escaladés", count: escalated.length, color: "#8b5cf6" },
    { status: "Résolus",   count: resolvedToday.length, color: "#22c55e" },
  ]

  // 7. Volume trend (last 7 days)
  const volume_trend = Array.from({ length: 7 }).map((_, i) => {
    const dayStart = startOfDay(6 - i)
    const dayEnd   = startOfDay(5 - i)
    const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
    const d = new Date(dayStart)
    return {
      day:      i === 6 ? "Auj" : DAYS[d.getUTCDay()],
      opened:   tickets.filter((t) => t.created_at >= dayStart && t.created_at < dayEnd).length,
      resolved: tickets.filter(
        (t) => ["resolved", "closed"].includes(t.status) && t.updated_at >= dayStart && t.updated_at < dayEnd,
      ).length,
    }
  })

  return NextResponse.json({
    kpi: {
      open_tickets:      open.length + inProg.length,
      urgent_count:      urgent.length,
      escalated_count:   escalated.length,
      resolved_today:    resolvedToday.length,
      avg_response_min:  5,
      satisfaction_rate: 87,
      yesterday_open:    tickets.filter(
        (t) => t.created_at >= startOfDay(1) && t.created_at < today,
      ).length,
    },
    tickets,
    agents,
    category_distribution,
    status_distribution,
    volume_trend,
  })
}

// ── PATCH — update status / assign / reply ─────────────────────────────────

export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const body = await req.json() as {
    ticket_number?: string
    action: "update_status" | "assign" | "reply"
    status?: string
    assigned_to?: string
    assigned_to_id?: string
    message?: string
    is_internal?: boolean
  }

  const { ticket_number, action } = body
  if (!ticket_number) return NextResponse.json({ error: "ticket_number requis" }, { status: 400 })

  // Resolve UUID from ticket_number
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id")
    .eq("ticket_number", ticket_number)
    .single()

  if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 })
  const ticketId = ticket.id

  if (action === "update_status") {
    const VALID = ["open", "in_progress", "escalated", "resolved", "closed"]
    if (!body.status || !VALID.includes(body.status)) {
      return NextResponse.json({ error: "status invalide" }, { status: 400 })
    }
    const patch: Record<string, unknown> = { status: body.status }
    if (body.status === "resolved") patch.resolved_at = new Date().toISOString()
    if (body.status === "closed")   patch.closed_at   = new Date().toISOString()

    const { error } = await supabase.from("support_tickets").update(patch).eq("id", ticketId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === "assign") {
    const { error } = await supabase.from("support_tickets").update({
      assigned_to:    body.assigned_to ?? null,
      assigned_to_id: body.assigned_to_id ?? null,
      status:         "in_progress",
    }).eq("id", ticketId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === "reply") {
    if (!body.message?.trim()) return NextResponse.json({ error: "message requis" }, { status: 400 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", admin.adminId)
      .single()

    const { error } = await supabase.from("ticket_messages").insert({
      ticket_id:   ticketId,
      sender_id:   admin.adminId,
      sender_name: profile?.full_name ?? "Admin",
      body:        body.message.trim(),
      is_internal: body.is_internal ?? false,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "action invalide" }, { status: 400 })
}
