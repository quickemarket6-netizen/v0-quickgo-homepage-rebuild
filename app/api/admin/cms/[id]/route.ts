import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

// PATCH /api/admin/cms/[id] — update page fields
// DELETE /api/admin/cms/[id] — archive page

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const { id } = await params
  const supabase = await createClient()
  const body = await req.json() as Record<string, unknown>

  // Strip read-only fields
  const { id: _id, created_at: _c, author_id: _a, ...patch } = body

  const { data, error } = await supabase
    .from("cms_pages")
    .update(patch)
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const { id } = await params
  const supabase = await createClient()

  const { error } = await supabase
    .from("cms_pages")
    .update({ status: "archived" })
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
