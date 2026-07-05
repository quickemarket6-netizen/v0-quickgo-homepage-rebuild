import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { SITE_URL } from "@/lib/site-config"

// Génère un code lisible (sans 0/O/1/I) — 8 caractères
function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 8; i++) code += alphabet[Math.floor(Math.random() * alphabet.length)]
  return code
}

// GET /api/referral — mon code, mon lien et mes statistiques de parrainage
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("id", user.id)
    .single()

  let code = profile?.referral_code ?? null

  // Génération paresseuse du code (retente en cas de collision unique)
  if (!code) {
    for (let attempt = 0; attempt < 3 && !code; attempt++) {
      const candidate = generateCode()
      const { error } = await supabase
        .from("profiles")
        .update({ referral_code: candidate })
        .eq("id", user.id)
      if (!error) code = candidate
    }
    if (!code) return NextResponse.json({ error: "Génération du code impossible, réessayez." }, { status: 500 })
  }

  const { data: referrals } = await supabase
    .from("referrals")
    .select("id, status, reward_amount, created_at, rewarded_at")
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false })

  const list = referrals ?? []
  const rewarded = list.filter((r) => r.status === "rewarded")

  return NextResponse.json({
    code,
    link: `${SITE_URL}/auth/register?ref=${code}`,
    total_referrals: list.length,
    rewarded_count: rewarded.length,
    total_earned: rewarded.reduce((s, r) => s + Number(r.reward_amount), 0),
    pending_count: list.length - rewarded.length,
    referrals: list.slice(0, 20),
  })
}

// POST /api/referral — activer un code de parrainage (filleul)
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const body = await request.json().catch(() => null)
  const code = typeof body?.code === "string" ? body.code.trim() : ""
  if (!code || code.length > 20) {
    return NextResponse.json({ error: "Code requis" }, { status: 400 })
  }

  const { data: result, error } = await supabase.rpc("claim_referral", { p_code: code })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!result?.success) {
    return NextResponse.json({ error: result?.error ?? "Code invalide" }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
