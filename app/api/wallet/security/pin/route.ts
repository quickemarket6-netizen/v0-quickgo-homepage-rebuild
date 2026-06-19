import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { scrypt, randomBytes, timingSafeEqual, type ScryptOptions } from "crypto"
import { checkRateLimit } from "@/lib/payments/security"

// Promisified scrypt that supports cost options (promisify picks the 3-arg overload)
function scryptAsync(password: string, salt: string, keylen: number, options: ScryptOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derived) => {
      if (err) reject(err)
      else resolve(derived as Buffer)
    })
  })
}

// 5 PIN changes per 15 minutes per user
const PIN_RATE_LIMIT = { maxRequests: 5, windowMs: 15 * 60 * 1000 }

// Hardened scrypt cost. The keyspace of a 4-6 digit PIN is tiny (10^4–10^6),
// so a leaked hash must be expensive to attack offline. N=2^15 with a server
// pepper means even a full DB leak can't be brute-forced without the env secret.
const SCRYPT = { N: 1 << 15, r: 8, p: 1, keylen: 64, maxmem: 96 * 1024 * 1024 }
const HASH_VERSION = "v2"

// Optional server-side pepper — combined into the hash input. A leaked
// wallet_pin_hash is useless to an attacker who doesn't also hold this secret.
function pepper(): string {
  return process.env.WALLET_PIN_PEPPER ?? ""
}

async function hashPin(pin: string): Promise<string> {
  const salt = randomBytes(16).toString("hex")
  const derived = await scryptAsync(pepper() + pin, salt, SCRYPT.keylen, SCRYPT)
  return `${HASH_VERSION}:${salt}:${derived.toString("hex")}`
}

// Returns true/false for a valid comparison; null when the stored hash is malformed.
async function verifyPin(pin: string, stored: string): Promise<boolean | null> {
  const parts = stored.split(":")
  // Expected shape: version:salt:hash
  const [version, salt, hash] = parts.length === 3 ? parts : ["", "", ""]
  if (version !== HASH_VERSION || !salt || !hash || !/^[0-9a-f]+$/i.test(hash)) {
    return null // corrupt / unknown format — caller must surface a recovery path
  }
  const derived = await scryptAsync(pepper() + pin, salt, SCRYPT.keylen, SCRYPT)
  const storedBuf = Buffer.from(hash, "hex")
  if (derived.length !== storedBuf.length) return false
  return timingSafeEqual(derived, storedBuf)
}

function serviceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return null
  return createServiceClient(supabaseUrl, serviceKey)
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

  const service = serviceClient()
  if (!service) return NextResponse.json({ error: "Serveur non configuré" }, { status: 500 })

  // Read existing hash via the SERVICE client so a restrictive RLS policy on
  // profiles can't return null and let a caller skip the current-PIN check.
  const { data: profile, error: readErr } = await service
    .from("profiles")
    .select("wallet_pin_hash")
    .eq("id", user.id)
    .single()
  if (readErr) {
    return NextResponse.json({ error: "Erreur de lecture du profil" }, { status: 500 })
  }

  const existingHash: string | null = (profile as { wallet_pin_hash?: string | null })?.wallet_pin_hash ?? null

  // If a PIN is already set, require the current one
  if (existingHash) {
    if (!current_pin) {
      return NextResponse.json({ error: "PIN actuel requis pour le modifier" }, { status: 400 })
    }
    const ok = await verifyPin(current_pin, existingHash)
    if (ok === null) {
      // Stored hash is corrupt — don't lock the user out silently
      return NextResponse.json(
        { error: "PIN corrompu, contactez le support pour réinitialiser", code: "PIN_CORRUPT" },
        { status: 409 },
      )
    }
    if (!ok) {
      return NextResponse.json({ error: "PIN actuel incorrect" }, { status: 403 })
    }
  }

  const newHash = await hashPin(pin)

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

  const service = serviceClient()
  if (!service) return NextResponse.json({ error: "Serveur non configuré" }, { status: 500 })

  const { data: profile } = await service
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
