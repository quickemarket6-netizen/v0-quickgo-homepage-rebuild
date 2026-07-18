/**
 * QuickGo Financial Security Layer
 * Rate limiting (Upstash Redis / in-memory fallback), fraud detection, duplicate prevention
 */

import { createHash } from "node:crypto"
import { createClient } from "@/lib/supabase/server"
import { NextRequest } from "next/server"
import { Redis } from "@upstash/redis"
import { Ratelimit } from "@upstash/ratelimit"

// ─── In-memory fallback (local dev / missing env vars) ───────────────────────

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function evictExpired(now: number): void {
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) rateLimitStore.delete(key)
  }
}

function checkInMemory(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  if (Math.random() < 0.01) evictExpired(now)
  const entry = rateLimitStore.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1, resetAt: now + config.windowMs }
  }
  if (entry.count >= config.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }
  entry.count++
  return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt }
}

// ─── Upstash Redis backend ────────────────────────────────────────────────────

let _redis: Redis | null = null

function getRedis(): Redis | null {
  if (_redis) return _redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  _redis = new Redis({ url, token })
  return _redis
}

// Convert milliseconds to the "N unit" string format Upstash expects.
function msToWindow(ms: number): `${number} ${"ms" | "s" | "m" | "h" | "d"}` {
  const s = ms / 1000
  if (s < 60) return `${Math.round(s)} s`
  const m = s / 60
  if (m < 60) return `${Math.round(m)} m`
  const h = m / 60
  if (h < 24) return `${Math.round(h)} h`
  return `${Math.round(h / 24)} d`
}

// Cache Ratelimit instances — one per unique (maxRequests, windowMs) pair so
// each config gets its own sliding-window counter bucket.
const _rlCache = new Map<string, Ratelimit>()

function getRatelimit(config: RateLimitConfig): Ratelimit | null {
  const r = getRedis()
  if (!r) return null
  const cacheKey = `${config.maxRequests}:${config.windowMs}`
  if (_rlCache.has(cacheKey)) return _rlCache.get(cacheKey)!
  const rl = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(config.maxRequests, msToWindow(config.windowMs)),
    prefix: "quickgo:rl",
    analytics: false,
  })
  _rlCache.set(cacheKey, rl)
  return rl
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number }

const PAYOUT_RATE_LIMITS: RateLimitConfig = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000,
}

const PAYMENT_RATE_LIMITS: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 1000,
}

/**
 * Distributed rate limit check backed by Upstash Redis (sliding window).
 * Falls back to in-memory when UPSTASH_REDIS_REST_URL / TOKEN are absent.
 * On Redis failure, fails open (allows the request) to avoid blocking users.
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const rl = getRatelimit(config)

  if (!rl) {
    return checkInMemory(key, config)
  }

  try {
    const { success, remaining, reset } = await rl.limit(key)
    return { allowed: success, remaining, resetAt: reset }
  } catch (err) {
    console.error("[ratelimit] Redis error, failing open:", err)
    return { allowed: true, remaining: 0, resetAt: Date.now() + config.windowMs }
  }
}

export async function checkPayoutRateLimit(vendorId: string) {
  return checkRateLimit(`payout:${vendorId}`, PAYOUT_RATE_LIMITS)
}

export async function checkPaymentRateLimit(ipAddress: string) {
  return checkRateLimit(`payment:${ipAddress}`, PAYMENT_RATE_LIMITS)
}

/**
 * Extract IP from Next.js request
 */
export function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  )
}

/**
 * Fraud scoring — returns a score 0-100 (higher = more suspicious)
 */
export async function calculateFraudScore(params: {
  vendorId: string
  amount: number
  payoutMethod: string
  ipAddress: string
}): Promise<{ score: number; flags: string[] }> {
  const supabase = await createClient()
  const flags: string[] = []
  let score = 0

  const { data: wallet } = await supabase
    .from("vendor_wallets")
    .select("available_balance, total_earned")
    .eq("vendor_id", params.vendorId)
    .single()

  if (wallet) {
    const ratio = params.amount / (wallet.total_earned || 1)
    if (ratio > 0.9) { score += 30; flags.push("Retrait > 90% du total gagné") }
    if (params.amount > 500_000) { score += 20; flags.push("Montant élevé (> 500K FCFA)") }
  }

  const hourAgo = new Date(Date.now() - 3600000).toISOString()
  const { data: recentPayouts } = await supabase
    .from("vendor_payouts")
    .select("id")
    .eq("vendor_id", params.vendorId)
    .gte("created_at", hourAgo)

  if ((recentPayouts?.length ?? 0) >= 2) {
    score += 25
    flags.push("Plusieurs retraits dans la dernière heure")
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("created_at")
    .eq("id", params.vendorId)
    .single()

  if (vendor) {
    const daysSinceCreation = (Date.now() - new Date(vendor.created_at).getTime()) / 86400000
    if (daysSinceCreation < 7) {
      score += 15
      flags.push("Vendeur récent (< 7 jours)")
    }
  }

  const { count: orderCount } = await supabase
    .from("commission_logs")
    .select("*", { count: "exact", head: true })
    .eq("vendor_id", params.vendorId)
    .eq("status", "released")

  if ((orderCount ?? 0) === 0 && params.amount > 10_000) {
    score += 25
    flags.push("Aucune commande livrée associée aux fonds")
  }

  return { score, flags }
}

/**
 * Verify admin is authenticated and has admin role
 */
export async function verifyAdmin(): Promise<{
  valid: boolean
  adminId?: string
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { valid: false, error: "Non authentifié" }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!["admin", "super_admin"].includes(profile?.role ?? "")) return { valid: false, error: "Accès refusé — rôle admin requis" }

  return { valid: true, adminId: user.id }
}

/**
 * Verify vendor owns the vendor_id
 */
export async function verifyVendorOwnership(vendorId: string): Promise<{
  valid: boolean
  userId?: string
  error?: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { valid: false, error: "Non authentifié" }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("owner_id")
    .eq("id", vendorId)
    .single()

  if (!vendor || vendor.owner_id !== user.id) {
    return { valid: false, error: "Accès refusé — vous n'êtes pas propriétaire de ce vendeur" }
  }

  return { valid: true, userId: user.id }
}

/**
 * Generate a secure idempotency key
 */
export function generateIdempotencyKey(prefix: string, ...parts: string[]): string {
  const data = [prefix, ...parts].join(":")
  return createHash("sha256").update(data).digest("hex").slice(0, 32)
}
