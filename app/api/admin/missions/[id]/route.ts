import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

// PATCH /api/admin/missions/[id]  — update / deactivate
// DELETE /api/admin/missions/[id] — soft-delete (deactivate)

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
  const { id: _id, created_at: _c, stats: _s, ...patch } = body

  const { data, error } = await supabase
    .from("driver_missions")
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
    .from("driver_missions")
    .update({ is_active: false })
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
