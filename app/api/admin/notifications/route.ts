import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

// ─── shape helpers ────────────────────────────────────────────────────────────
// The admin page consumes a fixed shape (see app/admin/notifications/page.tsx):
//   notifications[]: { id, type, channel, title, body, recipient, read, sent_at, priority }
//   campaigns[]:     { id, name, type, status, recipients, opened, clicked, sent_at, open_rate }
// The real tables don't carry every one of those columns, so where a backing
// column is absent we derive a safe value and comment it as a fallback.

const CHAN_COLOR: Record<string, string> = {
  push: "#3b82f6",
  email: "#8b5cf6",
  sms: "#22c55e",
}

// Map financial_notifications.type -> the page's TYPE_CFG keys (alert/warning/success/info)
function mapFinType(type: string | null): string {
  const t = (type ?? "").toLowerCase()
  if (t.includes("fail") || t.includes("error") || t.includes("fraud") || t.includes("froze") || t.includes("freeze")) return "alert"
  if (t.includes("warn") || t.includes("low") || t.includes("pending")) return "warning"
  if (t.includes("success") || t.includes("paid") || t.includes("complete") || t.includes("payout")) return "success"
  return "info"
}

export async function GET() {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error ?? "Accès refusé" }, { status: 403 })

  const supabase = await createClient()

  const [pushResult, finResult, broadcastsResult] = await Promise.all([
    // push_notifications: id, user_id, title, body, data, sent_at, read
    supabase
      .from("push_notifications")
      .select("id, user_id, title, body, sent_at, read")
      .order("sent_at", { ascending: false })
      .limit(100),

    // financial_notifications: id, user_id, type, title, message, amount, reference_id, reference_type, is_read, created_at
    supabase
      .from("financial_notifications")
      .select("id, user_id, type, title, message, is_read, created_at")
      .order("created_at", { ascending: false })
      .limit(100),

    // broadcasts: id, title, content, channels[], segment, scheduled_at, sent_at, status, created_at
    supabase
      .from("broadcasts")
      .select("id, title, channels, segment, status, sent_at, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  const pushRows = pushResult.data ?? []
  const finRows = finResult.data ?? []
  const broadcastRows = broadcastsResult.data ?? []

  // ── notifications ──────────────────────────────────────────────────────────
  const pushNotifs = pushRows.map((n) => ({
    id: n.id,
    type: "info", // fallback: push_notifications has no `type` column
    channel: "push", // these rows are push notifications by table
    title: n.title,
    body: n.body,
    recipient: n.user_id ?? "admin", // fallback: no dedicated recipient label column
    read: !!n.read,
    sent_at: n.sent_at,
    priority: "normal", // fallback: push_notifications has no `priority` column
  }))

  const finNotifs = finRows.map((n) => ({
    id: n.id,
    type: mapFinType(n.type), // derived from financial_notifications.type
    channel: "email", // fallback: financial_notifications has no channel column; delivered as email
    title: n.title,
    body: n.message ?? "", // financial_notifications.message -> body
    recipient: n.user_id ?? "admin",
    read: !!n.is_read, // financial_notifications.is_read -> read
    sent_at: n.created_at, // financial_notifications.created_at -> sent_at
    priority: mapFinType(n.type) === "alert" ? "urgent" : "normal", // derived, no priority column
  }))

  const notifications = [...pushNotifs, ...finNotifs].sort(
    (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime(),
  )

  // ── campaigns (from broadcasts) ────────────────────────────────────────────
  // broadcasts has no recipients/opened/clicked/open_rate columns -> safe fallbacks (0).
  const campaigns = broadcastRows.map((b) => {
    const channels: string[] = Array.isArray(b.channels) ? b.channels : []
    const type = channels[0] ?? "push" // broadcasts carry a channels[] array, not a single type
    // Map broadcast status lifecycle -> page CAMP_STATUS keys (active/paused/completed)
    const status =
      b.status === "sending" || b.status === "scheduled"
        ? "active"
        : b.status === "sent"
          ? "completed"
          : b.status === "cancelled"
            ? "paused"
            : "completed" // draft / unknown -> completed
    return {
      id: b.id,
      name: b.title,
      type,
      status,
      recipients: 0, // fallback: no recipients count column on broadcasts
      opened: 0, // fallback: no analytics columns on broadcasts
      clicked: 0, // fallback: no analytics columns on broadcasts
      sent_at: b.sent_at ?? b.created_at,
      open_rate: 0, // fallback: no open-rate column on broadcasts
    }
  })

  // ── KPIs (computed from real rows) ─────────────────────────────────────────
  const unread = notifications.filter((n) => !n.read)
  const urgent = notifications.filter((n) => n.priority === "urgent")
  const today = notifications.filter(
    (n) => Date.now() - new Date(n.sent_at).getTime() < 86_400_000,
  )
  const campaignsActive = campaigns.filter((c) => c.status === "active").length
  const avgOpenRate = campaigns.length
    ? Math.round((campaigns.reduce((s, c) => s + c.open_rate, 0) / campaigns.length) * 10) / 10
    : 0

  // ── channel distribution (real counts) ─────────────────────────────────────
  const channelCount: Record<string, number> = {}
  notifications.forEach((n) => {
    channelCount[n.channel] = (channelCount[n.channel] ?? 0) + 1
  })
  const channel_distribution = Object.entries(channelCount).map(([channel, count]) => ({
    channel,
    count,
    pct: notifications.length ? Math.round((count / notifications.length) * 100) : 0,
    color: CHAN_COLOR[channel] ?? "#22c55e",
  }))

  // ── 7-day volume trend (real counts bucketed by day) ───────────────────────
  const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]
  const volume_trend = Array.from({ length: 7 }).map((_, idx) => {
    const dayStart = new Date()
    dayStart.setHours(0, 0, 0, 0)
    dayStart.setDate(dayStart.getDate() - (6 - idx))
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    const isToday = idx === 6
    const inDay = notifications.filter((n) => {
      const t = new Date(n.sent_at).getTime()
      return t >= dayStart.getTime() && t < dayEnd.getTime()
    })
    return {
      day: isToday ? "Auj" : DAY_LABELS[dayStart.getDay()],
      push: inDay.filter((n) => n.channel === "push").length,
      email: inDay.filter((n) => n.channel === "email").length,
      sms: inDay.filter((n) => n.channel === "sms").length,
    }
  })

  return NextResponse.json({
    kpi: {
      unread_count: unread.length,
      urgent_count: urgent.length,
      sent_today: today.length,
      campaigns_active: campaignsActive,
      avg_open_rate: avgOpenRate,
      // fallback: no delivery-tracking column exists on the notification tables.
      // Assume 100% delivery when there is data, else 0.
      delivery_rate: notifications.length ? 100 : 0,
    },
    notifications,
    campaigns,
    channel_distribution,
    volume_trend,
  })
}

// ─── PATCH: persist a "mark read" ─────────────────────────────────────────────
// Sets push_notifications.read = true for the given id. push_notifications uses
// the column name `read` (see supabase/migrations/add_communication_tables.sql).
// If the id belongs to financial_notifications instead, we fall back to updating
// its `is_read` column.
export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error ?? "Accès refusé" }, { status: 403 })

  let body: { id?: string; read?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 })
  }

  const { id } = body
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 })
  const read = body.read ?? true

  const supabase = await createClient()

  // Try push_notifications first (`read` column).
  const pushUpdate = await supabase
    .from("push_notifications")
    .update({ read })
    .eq("id", id)
    .select("id")

  if (pushUpdate.data && pushUpdate.data.length > 0) {
    return NextResponse.json({ success: true, id, read, table: "push_notifications" })
  }

  // Fall back to financial_notifications (`is_read` column).
  const finUpdate = await supabase
    .from("financial_notifications")
    .update({ is_read: read })
    .eq("id", id)
    .select("id")

  if (finUpdate.data && finUpdate.data.length > 0) {
    return NextResponse.json({ success: true, id, read, table: "financial_notifications" })
  }

  return NextResponse.json({ error: "Notification introuvable" }, { status: 404 })
}
