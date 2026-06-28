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

// "Caté Gorie" -> "cate-gorie".  NFD splits accented letters into base + combining
// mark; the [^a-z0-9] filter then drops the combining marks along with punctuation.
function slugify(input: string) {
  return input
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// List ALL categories (active + inactive) — admin view
export async function GET() {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })

  const body = await req.json()
  const { name, icon, color, is_active, sort_order } = body
  const slug = (body.slug && String(body.slug).trim()) ? slugify(String(body.slug)) : slugify(name ?? "")

  if (!name || !slug)
    return NextResponse.json({ error: "Le nom est requis" }, { status: 400 })

  const { data, error } = await supabase
    .from("categories")
    .insert({
      name,
      slug,
      icon: icon ?? null,
      color: color ?? null,
      is_active: is_active ?? true,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single()

  if (error) {
    // 23505 = unique_violation on slug
    if ((error as { code?: string }).code === "23505")
      return NextResponse.json({ error: "Ce slug existe déjà" }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
