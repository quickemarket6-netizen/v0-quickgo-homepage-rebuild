import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// POST /api/newsletter { email, source? } — inscription à la newsletter.
// Passe par la RPC subscribe_newsletter (upsert idempotent, ne révèle jamais
// si l'email était déjà inscrit).
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : ""
  const source = typeof body?.source === "string" ? body.source.slice(0, 40) : "footer"

  if (!EMAIL_RE.test(email) || email.length > 160) {
    return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc("subscribe_newsletter", { p_email: email, p_source: source })
  if (error) {
    console.error("[newsletter] inscription échouée:", error.message)
    return NextResponse.json({ error: "Inscription impossible pour le moment." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
