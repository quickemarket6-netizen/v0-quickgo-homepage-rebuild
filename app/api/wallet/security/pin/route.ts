import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { scrypt, randomBytes, timingSafeEqual } from "crypto"
import { promisify } from "util"
import { checkRateLimit } from "@/lib/payments/security"

const scryptAsync = promisify(scrypt)

// 5 PIN changes per 15 minutes per user
const PIN_RATE_LIMIT = { maxRequests: 5, windowMs: 15 * 60 * 1000 }

async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16).toString("hex")
  const derived = (await scryptAsync(pin, salt, 64)) as Buffer
  return `${salt}:${derived.toString("hex")}`
}

async function verifyPin(pin: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":")
  if (!salt || !hash) return false
  const derived = (await scryptAsync(pin, salt, 64)) as Buffer
  const storedBuf = Buffer.from(hash, "hex")
  if (derived.length !== storedBuf.length) return false
  return timingSafeEqual(derived, storedBuf)
}

// POST — set or change the wallet PIN
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const rl = checkRateLimit(`pin:${user.id}`, PIN_RATE_LIMIT)
  if (!rl.allowed) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez dans 15 minutes" }, { status: 429 })
  }

  const { pin, current_pin } = await req.json() as { pin?: string; current_pin?: string }

  if (!pin || !/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: "Le PIN doit contenir 4 à 6 chiffres" }, { status: 400 })
  }

  // Read existing hash from profiles table (not user_metadata — hashes must not appear in the JWT)
  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_pin_hash")
    .eq("id", user.id)
    .single()

  const existingHash: string | null = (profile as { wallet_pin_hash?: string | null })?.wallet_pin_hash ?? null

  // If a PIN is already set, require the current one
  if (existingHash) {
    if (!current_pin) {
      return NextResponse.json({ error: "PIN actuel requis pour le modifier" }, { status: 400 })
    }
    const ok = await verifyPin(current_pin, existingHash)
    if (!ok) {
      return NextResponse.json({ error: "PIN actuel incorrect" }, { status: 403 })
    }
  }

  const newHash = await hashPin(pin)

  // Use service role so the update bypasses any restrictive RLS on profiles
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Serveur non configuré" }, { status: 500 })
  }
  const service = createServiceClient(supabaseUrl, serviceKey)

  const { error } = await service
    .from("profiles")
    .update({
      wallet_pin_hash: newHash,
      wallet_pin_updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) return NextResponse.json({ error: "Erreur lors de la mise à jour du PIN" }, { status: 500 })

  return NextResponse.json({ success: true, had_pin: Boolean(existingHash) })
}

// GET — tells the client whether a PIN is configured
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("wallet_pin_hash, wallet_pin_updated_at")
    .eq("id", user.id)
    .single()

  const p = profile as { wallet_pin_hash?: string | null; wallet_pin_updated_at?: string | null } | null
  return NextResponse.json({
    has_pin: Boolean(p?.wallet_pin_hash),
    updated_at: p?.wallet_pin_updated_at ?? null,
  })
}
