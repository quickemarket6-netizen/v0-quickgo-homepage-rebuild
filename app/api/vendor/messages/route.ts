import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("owner_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const conversationId = req.nextUrl.searchParams.get("conversation_id")
  const filter = req.nextUrl.searchParams.get("filter") ?? "all"

  if (conversationId) {
    const { data: messages } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_type, sender_id, content, created_at, read_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", conversationId)
      .eq("sender_type", "customer")
      .is("read_at", null)

    return NextResponse.json({ messages: messages ?? [] })
  }

  let query = supabase
    .from("conversations")
    .select("id, customer_id, order_id, subject, status, created_at, updated_at, profiles:customer_id ( full_name, avatar_url )")
    .eq("vendor_id", vendor.id)
    .order("updated_at", { ascending: false })

  if (filter === "archived") query = query.eq("status", "archived")
  else if (filter !== "all" && filter !== "unread") query = query.eq("status", "open")
  else query = query.eq("status", "open")

  const { data: convs } = await query

  const conversations = await Promise.all((convs ?? []).map(async (c) => {
    const { data: lastMsg } = await supabase
      .from("messages")
      .select("content, created_at, sender_type")
      .eq("conversation_id", c.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    const { count: unreadCount } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", c.id)
      .eq("sender_type", "customer")
      .is("read_at", null)

    const profile = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles

    return {
      id: c.id,
      customer_id: c.customer_id,
      order_id: c.order_id as string | null,
      subject: c.subject as string,
      status: c.status as "open" | "archived",
      created_at: c.created_at as string,
      updated_at: c.updated_at as string,
      customer_name: (profile as { full_name?: string } | null)?.full_name ?? "Client",
      customer_avatar: (profile as { avatar_url?: string } | null)?.avatar_url ?? null,
      last_message: lastMsg?.content ?? "",
      last_message_at: lastMsg?.created_at ?? (c.created_at as string),
      last_sender: lastMsg?.sender_type ?? null,
      unread_count: unreadCount ?? 0,
    }
  }))

  const filtered = filter === "unread" ? conversations.filter(c => c.unread_count > 0) : conversations
  const totalUnread = conversations.reduce((s, c) => s + c.unread_count, 0)

  const { count: archivedCount } = await supabase
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("vendor_id", vendor.id)
    .eq("status", "archived")

  return NextResponse.json({
    conversations: filtered,
    kpi: { total: conversations.length, unread: totalUnread, archived: archivedCount ?? 0 },
    counts: { all: conversations.length, unread: conversations.filter(c => c.unread_count > 0).length, archived: archivedCount ?? 0 },
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("owner_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const { conversation_id, content } = await req.json() as { conversation_id?: string; content?: string }
  if (!conversation_id || !content?.trim()) {
    return NextResponse.json({ error: "conversation_id et content requis" }, { status: 400 })
  }

  const { data: conv } = await supabase
    .from("conversations").select("id").eq("id", conversation_id).eq("vendor_id", vendor.id).single()
  if (!conv) return NextResponse.json({ error: "Conversation introuvable" }, { status: 404 })

  const { data: message, error } = await supabase
    .from("messages")
    .insert({ conversation_id, sender_type: "vendor", sender_id: user.id, content: content.trim() })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversation_id)

  return NextResponse.json({ success: true, message })
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("owner_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const { conversation_id, action } = await req.json() as { conversation_id?: string; action?: "archive" | "unarchive" }
  if (!conversation_id || !action) return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 })

  const { error } = await supabase
    .from("conversations")
    .update({ status: action === "archive" ? "archived" : "open" })
    .eq("id", conversation_id).eq("vendor_id", vendor.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
