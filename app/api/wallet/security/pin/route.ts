import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"

// POST /api/wallet/security/pin — set or change the wallet PIN.
// The PIN is hashed (salted with the user id) and stored in auth user metadata.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { pin, current_pin } = await req.json() as { pin?: string; current_pin?: string }

  if (!pin || !/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: "Le PIN doit contenir 4 à 6 chiffres" }, { status: 400 })
  }

  const hash = (value: string) =>
    createHash("sha256").update(`${user.id}:${value}`).digest("hex")

  // If a PIN is already set, require the current one to change it
  const existingHash = (user.user_metadata as { wallet_pin_hash?: string })?.wallet_pin_hash
  if (existingHash) {
    if (!current_pin || hash(current_pin) !== existingHash) {
      return NextResponse.json({ error: "PIN actuel incorrect" }, { status: 403 })
    }
  }

  const { error } = await supabase.auth.updateUser({
    data: { wallet_pin_hash: hash(pin), wallet_pin_updated_at: new Date().toISOString() },
  })
  if (error) return NextResponse.json({ error: "Erreur lors de la mise à jour du PIN" }, { status: 500 })

  return NextResponse.json({ success: true, had_pin: Boolean(existingHash) })
}

// GET — tells the client whether a PIN is already configured
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const meta = user.user_metadata as { wallet_pin_hash?: string; wallet_pin_updated_at?: string }
  return NextResponse.json({
    has_pin: Boolean(meta?.wallet_pin_hash),
    updated_at: meta?.wallet_pin_updated_at ?? null,
  })
}
