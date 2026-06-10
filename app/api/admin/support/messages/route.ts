import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

// GET /api/admin/support/messages?ticket_number=TKT-1142
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const ticketNumber = req.nextUrl.searchParams.get("ticket_number")
  if (!ticketNumber) return NextResponse.json({ error: "ticket_number requis" }, { status: 400 })

  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("id, body, customer_name, created_at")
    .eq("ticket_number", ticketNumber)
    .single()

  if (!ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 })

  const { data: messages, error } = await supabase
    .from("ticket_messages")
    .select("id, sender_name, body, is_internal, created_at")
    .eq("ticket_id", ticket.id)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Prepend the original ticket body as the first message
  const thread = [
    {
      id: ticket.id + "_body",
      sender_name: ticket.customer_name ?? "Client",
      body: ticket.body,
      is_internal: false,
      created_at: ticket.created_at,
      is_original: true,
    },
    ...(messages ?? []).map((m) => ({ ...m, is_original: false })),
  ]

  return NextResponse.json({ messages: thread })
}
