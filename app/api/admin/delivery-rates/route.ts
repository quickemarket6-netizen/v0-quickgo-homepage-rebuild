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

export async function GET() {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })

  const { data, error } = await supabase
    .from("delivery_rates")
    .select("*")
    .order("priority", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 403 })

  const body = await req.json()
  const { name, amount, conditions, priority, is_active } = body

  if (!name || amount == null)
    return NextResponse.json({ error: "name et amount sont requis" }, { status: 400 })

  const { data, error } = await supabase
    .from("delivery_rates")
    .insert({
      name,
      amount,
      conditions: conditions ?? {},
      priority: priority ?? 50,
      is_active: is_active ?? true,
      created_by_admin: admin.id,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
