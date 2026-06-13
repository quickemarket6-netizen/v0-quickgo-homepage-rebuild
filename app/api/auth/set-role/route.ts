import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// "admin" is intentionally excluded — role elevation requires an existing admin via the admin panel
const VALID_ROLES = ["client", "vendor", "driver"] as const
type Role = (typeof VALID_ROLES)[number]

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const role = body.role as Role | undefined

  if (!role || !VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 })
  }

  // Only allow setting role if it hasn't been set yet (prevent escalation)
  const { data: existing } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (existing?.role && existing.role !== role) {
    // Role already set to something different — only admin can change it
    return NextResponse.json({ error: "Le rôle est déjà défini" }, { status: 403 })
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, role })
    .eq("id", user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, role })
}
