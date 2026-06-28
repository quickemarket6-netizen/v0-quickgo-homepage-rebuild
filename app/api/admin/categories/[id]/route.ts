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

function slugify(input: string) {
  return input
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
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
  const allowed = ["name", "slug", "icon", "color", "is_active", "sort_order"]
  const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  if (typeof update.slug === "string") update.slug = slugify(update.slug)

  if (!Object.keys(update).length)
    return NextResponse.json({ error: "Aucun champ modifiable" }, { status: 400 })

  const { data, error } = await supabase
    .from("categories")
    .update(update)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    if ((error as { code?: string }).code === "23505")
      return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
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
    .from("categories")
    .delete()
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
