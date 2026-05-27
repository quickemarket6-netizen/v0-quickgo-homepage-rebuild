import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  return data?.role === "admin" || data?.role === "super_admin" ? user : null
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })

  const body = await req.json()
  const allowed = ["name", "amount", "conditions", "priority", "is_active"]
  const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  if (!Object.keys(update).length)
    return NextResponse.json({ error: "Aucun champ modifiable" }, { status: 400 })

  const { data, error } = await supabase
    .from("delivery_rates")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })

  const { error } = await supabase
    .from("delivery_rates")
    .delete()
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
