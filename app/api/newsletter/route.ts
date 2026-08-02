import { createClient } from "@/lib/supabase/server"
import { checkRateLimit } from "@/lib/payments/security"
import { extractIP } from "@/lib/security/threat-logger"
import { NextResponse } from "next/server"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

// POST /api/newsletter { email, source? } — inscription à la newsletter.
// Passe par la RPC subscribe_newsletter (upsert idempotent, ne révèle jamais
// si l'email était déjà inscrit).
export async function POST(request: Request) {
  // Endpoint anonyme qui écrit en base : sans limite, il permet d'inonder la
  // table d'inscriptions. Même cadrage que /api/auth/login-event.
  const ip = extractIP(request.headers)
  const rl = await checkRateLimit(`newsletter:${ip}`, { maxRequests: 5, windowMs: 10 * 60 * 1000 })
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez plus tard." }, { status: 429 })
  }

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
