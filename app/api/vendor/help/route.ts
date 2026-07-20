import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

type TicketStatus   = "open" | "in_progress" | "resolved" | "closed"
type TicketPriority = "low" | "medium" | "high" | "urgent"

type TicketRow = {
  id: string; vendor_id: string; subject: string; category: string
  message: string; status: TicketStatus; priority: TicketPriority; created_at: string
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, vendor_id, subject, category, message, status, priority, created_at")
    .eq("vendor_id", (vendor as { id: string }).id)
    .order("created_at", { ascending: false })
    .limit(10)

  const rows = (tickets ?? []) as unknown as TicketRow[]

  return NextResponse.json({
    tickets: rows,
    counts: {
      open:        rows.filter(t => t.status === "open").length,
      in_progress: rows.filter(t => t.status === "in_progress").length,
      resolved:    rows.filter(t => t.status === "resolved" || t.status === "closed").length,
    },
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors").select("id").eq("user_id", user.id).single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const body = await req.json() as {
    subject?: string; category?: string; message?: string; priority?: string
  }

  if (!body.subject?.trim() || !body.message?.trim()) {
    return NextResponse.json({ error: "Sujet et message requis" }, { status: 400 })
  }

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      vendor_id: (vendor as { id: string }).id,
      subject:   body.subject.trim(),
      category:  body.category ?? "general",
      message:   body.message.trim(),
      priority:  body.priority ?? "medium",
      status:    "open",
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, ticket })
}
