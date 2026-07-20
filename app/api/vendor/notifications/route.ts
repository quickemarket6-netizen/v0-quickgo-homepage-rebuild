import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

type NotificationType = "order" | "review" | "payment" | "system" | "alert" | "promo"

type NotifRow = {
  id: string; vendor_id: string; type: NotificationType
  title: string; body: string; is_read: boolean
  action_url: string | null; created_at: string
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const filter = req.nextUrl.searchParams.get("filter") ?? "all"

  let query = supabase
    .from("notifications")
    .select("id, vendor_id, type, title, body, is_read, action_url, created_at")
    .eq("vendor_id", vendor.id)
    .order("created_at", { ascending: false })

  if (filter === "unread")  query = query.eq("is_read", false)
  else if (filter === "order")   query = query.eq("type", "order")
  else if (filter === "payment") query = query.eq("type", "payment")
  else if (filter === "system")  query = query.in("type", ["system", "alert"])

  const { data: all } = await query
  const notifs = (all ?? []) as unknown as NotifRow[]

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: allForKpi } = await supabase
    .from("notifications").select("id, is_read, created_at").eq("vendor_id", vendor.id)

  const kpiRows = (allForKpi ?? []) as { id: string; is_read: boolean; created_at: string }[]
  const totalCount  = kpiRows.length
  const unreadCount = kpiRows.filter(n => !n.is_read).length
  const todayCount  = kpiRows.filter(n => new Date(n.created_at) >= todayStart).length

  const filterCounts = {
    all:     totalCount,
    unread:  unreadCount,
    order:   kpiRows.filter(() => true).length, // will be overridden
    payment: 0,
    system:  0,
  }

  // precise per-type counts
  const typeMap: Record<string, number> = {}
  for (const n of kpiRows as (typeof kpiRows[number] & { type?: string })[]) {
    if (n.type) typeMap[n.type] = (typeMap[n.type] ?? 0) + 1
  }

  return NextResponse.json({
    notifications: notifs,
    kpi: { total: totalCount, unread: unreadCount, today: todayCount },
    counts: {
      all:     totalCount,
      unread:  unreadCount,
      order:   (typeMap["order"]   ?? 0),
      payment: (typeMap["payment"] ?? 0),
      system:  (typeMap["system"]  ?? 0) + (typeMap["alert"] ?? 0),
    },
    _filterCounts: filterCounts,
  })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const body = await req.json() as { notification_id?: string; action?: string }

  if (body.action === "mark_all_read") {
    const { error } = await supabase
      .from("notifications").update({ is_read: true })
      .eq("vendor_id", vendor.id).eq("is_read", false)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (!body.notification_id) return NextResponse.json({ error: "notification_id requis" }, { status: 400 })

  const { error } = await supabase
    .from("notifications").update({ is_read: true })
    .eq("id", body.notification_id).eq("vendor_id", vendor.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const { notification_id } = await req.json() as { notification_id?: string }
  if (!notification_id) return NextResponse.json({ error: "notification_id requis" }, { status: 400 })

  const { error } = await supabase
    .from("notifications").delete()
    .eq("id", notification_id).eq("vendor_id", vendor.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
