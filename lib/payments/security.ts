/**
 * QuickGo Financial Security Layer
 * Rate limiting, fraud detection, duplicate prevention
 */

import { createClient } from "@/lib/supabase/server"
import { NextRequest } from "next/server"

// In-memory rate limiting (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const PAYOUT_RATE_LIMITS: RateLimitConfig = {
  maxRequests: 3,
  windowMs: 60 * 60 * 1000, // 3 payout requests per hour per vendor
}

const PAYMENT_RATE_LIMITS: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 10 payment initiations per minute per IP
}

/**
 * Rate limit check — returns true if allowed, false if blocked
 */
export function checkRateLimit(key: string, config: RateLimitConfig): {
  allowed: boolean
  remaining: number
  resetAt: number
} {
  const now = Date.now()
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

export function checkPayoutRateLimit(vendorId: string) {
  return checkRateLimit(`payout:${vendorId}`, PAYOUT_RATE_LIMITS)
}

export function checkPaymentRateLimit(ipAddress: string) {
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

  // Check 1: Unusually large amount
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

  // Check 2: Multiple payouts in short period
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

  // Check 3: New vendor (< 7 days)
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

  // Check 4: No completed orders (wallet balance from unknown source)
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

  if (profile?.role !== "admin") return { valid: false, error: "Accès refusé — rôle admin requis" }

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
  const crypto = require("crypto") as typeof import("crypto")
  const data = [prefix, ...parts].join(":")
  return crypto.createHash("sha256").update(data).digest("hex").slice(0, 32)
}
