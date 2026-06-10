import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

// GET  /api/admin/faq — all items (including inactive)
// POST /api/admin/faq — create item

export async function GET() {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("faq_items")
    .select("*")
    .order("category")
    .order("sort_order")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data ?? [] })
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const body = await req.json() as {
    category?: string
    question?: string
    answer?: string
    sort_order?: number
    is_active?: boolean
  }

  if (!body.question?.trim()) return NextResponse.json({ error: "question requis" }, { status: 400 })
  if (!body.answer?.trim())   return NextResponse.json({ error: "answer requis" }, { status: 400 })

  const { data, error } = await supabase
    .from("faq_items")
    .insert({
      category:   body.category ?? "general",
      question:   body.question.trim(),
      answer:     body.answer.trim(),
      sort_order: body.sort_order ?? 0,
      is_active:  body.is_active ?? true,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
