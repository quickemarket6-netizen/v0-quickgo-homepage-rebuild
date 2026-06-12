import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

// Page segment ids → profiles.role values
const ROLE_BY_SEGMENT: Record<string, string> = {
  clients: "customer",
  vendors: "vendor",
  drivers: "driver",
}

// communication_logs.channel has a CHECK (channel IN ('email','sms','push','whatsapp'))
const LOGGABLE_CHANNELS = ["email", "sms", "push", "whatsapp"]

type Campaign = {
  id: string
  title: string
  type: string
  channels: string[]
  sent: number
  opened: number
  clicked: number
  date: string
  status: string
}

export async function GET() {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 401 })

  const supabase = await createClient()
  const since30d = new Date(Date.now() - 30 * 86400000).toISOString()

  const [
    logsRes,
    broadcastsRes,
    notifTotalRes,
    notifReadRes,
    pushTotalRes,
    pushReadRes,
    allProfilesRes,
    clientsRes,
    vendorsRes,
    driversRes,
    activeOrdersRes,
  ] = await Promise.all([
    // 1. Sent campaigns (communication logs)
    supabase.from("communication_logs")
      .select("id, type, channel, subject, recipient, status, results_json, created_at")
      .order("created_at", { ascending: false }).limit(20),
    // 2. Scheduled / draft broadcasts
    supabase.from("broadcasts")
      .select("id, title, channels, segment, status, scheduled_at, created_at")
      .neq("status", "sent")
      .order("created_at", { ascending: false }).limit(20),
    // 3. In-app notifications total
    supabase.from("notifications").select("id", { count: "exact", head: true }),
    // 4. In-app notifications read
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", true),
    // 5. Push notifications total
    supabase.from("push_notifications").select("id", { count: "exact", head: true }),
    // 6. Push notifications read
    supabase.from("push_notifications").select("id", { count: "exact", head: true }).eq("read", true),
    // 7-10. Segment counts
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "customer"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "vendor"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "driver"),
    // 11. Active users = distinct customers with an order in the last 30 days
    supabase.from("orders").select("customer_id").gte("created_at", since30d),
  ])

  const notifTotal = notifTotalRes.count ?? 0
  const notifRead = notifReadRes.count ?? 0
  const pushTotal = pushTotalRes.count ?? 0
  const pushRead = pushReadRes.count ?? 0
  const activeUsers = new Set(
    (activeOrdersRes.data ?? []).map(o => o.customer_id).filter(Boolean)
  ).size

  const stats = {
    totalSent: notifTotal + pushTotal,
    // Read rate of in-app notifications (closest real metric to an open rate)
    openRate: notifTotal > 0 ? Math.round((notifRead / notifTotal) * 1000) / 10 : 0,
    // Read rate of push notifications (closest real metric to a click rate)
    clickRate: pushTotal > 0 ? Math.round((pushRead / pushTotal) * 1000) / 10 : 0,
    activeUsers,
  }

  const segments = [
    { id: "all", label: "Tous les utilisateurs", count: allProfilesRes.count ?? 0 },
    { id: "clients", label: "Clients", count: clientsRes.count ?? 0 },
    { id: "vendors", label: "Commercants", count: vendorsRes.count ?? 0 },
    { id: "drivers", label: "Livreurs", count: driversRes.count ?? 0 },
  ]

  const campaigns: Campaign[] = [
    ...(logsRes.data ?? []).map(l => {
      const fromJson = (l.results_json as { channels?: string[] } | null)?.channels
      const channels = Array.isArray(fromJson) && fromJson.length > 0
        ? fromJson
        : (l.channel ?? "").split(",").filter(Boolean)
      return {
        id: `log-${l.id}`,
        title: l.subject ?? "Sans titre",
        type: l.type ?? "broadcast",
        channels,
        sent: parseInt((l.recipient ?? "").replace(/\D/g, ""), 10) || 0,
        opened: 0,
        clicked: 0,
        date: l.created_at,
        status: l.status ?? "sent",
      }
    }),
    ...(broadcastsRes.data ?? []).map(b => ({
      id: `bc-${b.id}`,
      title: b.title,
      type: "broadcast",
      channels: (b.channels as string[] | null) ?? [],
      sent: 0,
      opened: 0,
      clicked: 0,
      date: b.scheduled_at ?? b.created_at,
      status: b.status,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  return NextResponse.json({ stats, segments, campaigns })
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 401 })

  const supabase = await createClient()
  const body = await req.json()
  const { channels, messageType, title, content, segment, scheduledAt } = body as {
    channels?: string[]
    messageType?: string
    title?: string
    content?: string
    segment?: string
    scheduledAt?: string | null
  }

  if (!title || !content || !Array.isArray(channels) || channels.length === 0) {
    return NextResponse.json(
      { error: "Titre, message et au moins un canal sont requis" },
      { status: 400 }
    )
  }

  // ── Scheduled campaign → broadcasts ────────────────────────────────────
  if (scheduledAt) {
    const { data: broadcast, error } = await supabase.from("broadcasts").insert({
      title,
      content,
      channels,
      segment: segment ?? "all",
      scheduled_at: scheduledAt,
      status: "scheduled",
      created_by: admin.adminId,
    }).select().single()

    if (error) {
      console.error("[Admin Communication] broadcast insert error:", error)
      return NextResponse.json({ error: "Erreur lors de la programmation" }, { status: 500 })
    }
    return NextResponse.json({ success: true, message: "Campagne programmée", broadcast })
  }

  // ── Immediate send → notifications rows for targeted users ─────────────
  let query = supabase.from("profiles").select("id")
  const role = segment ? ROLE_BY_SEGMENT[segment] : undefined
  if (segment && segment !== "all" && role) query = query.eq("role", role)
  const { data: profiles, error: profilesError } = await query.limit(1000)

  if (profilesError) {
    console.error("[Admin Communication] profiles error:", profilesError)
    return NextResponse.json({ error: "Erreur lors de la récupération des destinataires" }, { status: 500 })
  }

  const recipients = profiles ?? []

  // Use the service-role client when available (RLS on notifications only
  // lets users read/update their own rows), same pattern as /api/admin/seed.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const writer = supabaseUrl && serviceKey ? createServiceClient(supabaseUrl, serviceKey) : supabase

  let notificationsCreated = 0
  for (let i = 0; i < recipients.length; i += 500) {
    const chunk = recipients.slice(i, i + 500).map(p => ({
      user_id: p.id,
      type: messageType ?? "broadcast",
      title,
      body: content,
      data: { channels, segment: segment ?? "all" },
    }))
    const { error } = await writer.from("notifications").insert(chunk)
    if (error) console.error("[Admin Communication] notifications insert error:", error)
    else notificationsCreated += chunk.length
  }

  // Log the campaign (channel column is CHECK-constrained to a single value)
  const primaryChannel = channels.find(c => LOGGABLE_CHANNELS.includes(c)) ?? null
  const { error: logError } = await supabase.from("communication_logs").insert({
    user_id: admin.adminId,
    type: messageType ?? "broadcast",
    channel: primaryChannel,
    subject: title,
    content,
    recipient: `${recipients.length} destinataires`,
    results_json: { channels, segment: segment ?? "all", notifications_created: notificationsCreated },
    status: "sent",
  })
  if (logError) console.error("[Admin Communication] log insert error:", logError)

  return NextResponse.json({
    success: true,
    message: "Messages envoyés",
    recipientsCount: recipients.length,
    notificationsCreated,
  })
}
