/**
 * Server-only threat and login event logger.
 * All writes are fire-and-forget — never block the request path.
 */

import { createClient } from "@/lib/supabase/server"
import type { ThreatType, ThreatLevel } from "./cybersecurity"
import { SecurityService } from "./cybersecurity"

export interface ThreatLogParams {
  type: ThreatType
  level: ThreatLevel
  ip: string
  endpoint: string
  method?: string
  userAgent?: string
  userId?: string
  sessionId?: string
  fingerprint?: string
  country?: string
  city?: string
  device?: string
  browser?: string
  os?: string
  payloadExcerpt?: string
  requestCount?: number
  blocked?: boolean
  metadata?: Record<string, unknown>
}

export async function logThreat(params: ThreatLogParams): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("security_logs")
      .insert({
        type:            params.type,
        level:           params.level,
        ip_address:      params.ip,
        endpoint:        params.endpoint,
        method:          params.method ?? null,
        user_agent:      params.userAgent ?? null,
        user_id:         params.userId ?? null,
        session_id:      params.sessionId ?? null,
        fingerprint:     params.fingerprint ?? null,
        country:         params.country ?? "Cameroon",
        city:            params.city ?? null,
        device:          params.device ?? null,
        browser:         params.browser ?? null,
        os:              params.os ?? null,
        payload_excerpt: params.payloadExcerpt?.slice(0, 500) ?? null,
        request_count:   params.requestCount ?? null,
        blocked:         params.blocked ?? false,
        alert_sent:      false,
        metadata:        params.metadata ?? {},
      })
      .select("id")
      .single()
    return data?.id ?? null
  } catch {
    return null
  }
}

export async function logLoginAttempt(params: {
  userId?: string
  email?: string
  phone?: string
  ip: string
  userAgent?: string
  fingerprint?: string
  country?: string
  city?: string
  status: "success" | "failed" | "blocked" | "suspicious"
  failureReason?: string
}): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from("login_attempts").insert({
      user_id:        params.userId ?? null,
      email:          params.email ?? null,
      phone:          params.phone ?? null,
      ip_address:     params.ip,
      user_agent:     params.userAgent ?? null,
      fingerprint:    params.fingerprint ?? null,
      country:        params.country ?? "Cameroon",
      city:           params.city ?? null,
      status:         params.status,
      failure_reason: params.failureReason ?? null,
    })
  } catch {
    // fire-and-forget
  }
}

export async function blockIPPersistent(params: {
  ip: string
  reason?: string
  blockedBy?: string
  durationHours?: number
  autoBlocked?: boolean
}): Promise<void> {
  try {
    const supabase = await createClient()
    const expiresAt = params.durationHours
      ? new Date(Date.now() + params.durationHours * 3_600_000).toISOString()
      : null

    await supabase
      .from("blocked_ips")
      .upsert({
        ip_address:   params.ip,
        reason:       params.reason ?? "Manual block",
        blocked_by:   params.blockedBy ?? null,
        expires_at:   expiresAt,
        auto_blocked: params.autoBlocked ?? false,
        is_active:    true,
        blocked_at:   new Date().toISOString(),
        unblocked_at: null,
        unblocked_by: null,
      }, { onConflict: "ip_address" })

    // Also block in-memory
    SecurityService.blockIP(params.ip, (params.durationHours ?? 24) * 3_600_000)
  } catch {
    // non-critical
  }
}

export async function unblockIPPersistent(params: {
  ip: string
  unblockedBy?: string
}): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase
      .from("blocked_ips")
      .update({
        is_active:    false,
        unblocked_at: new Date().toISOString(),
        unblocked_by: params.unblockedBy ?? null,
      })
      .eq("ip_address", params.ip)
      .eq("is_active", true)

    SecurityService.unblockIP(params.ip)
  } catch {
    // non-critical
  }
}

/** Parse User-Agent string into { device, browser, os } */
export function parseUserAgent(ua: string): { device: string; browser: string; os: string } {
  const isMobile = /mobile|android|iphone|ipad/i.test(ua)
  const isTablet = /ipad|tablet/i.test(ua)

  const browser = ua.includes("Chrome") && !ua.includes("Edg") ? "Chrome"
    : ua.includes("Firefox") ? "Firefox"
    : ua.includes("Safari") && !ua.includes("Chrome") ? "Safari"
    : ua.includes("Edg") ? "Edge"
    : ua.includes("OPR") || ua.includes("Opera") ? "Opera"
    : "Unknown"

  const os = ua.includes("Windows NT 10") ? "Windows 10"
    : ua.includes("Windows NT 11") ? "Windows 11"
    : ua.includes("Mac OS X") ? "macOS"
    : ua.includes("Android") ? "Android"
    : ua.includes("iOS") || ua.includes("iPhone") ? "iOS"
    : ua.includes("Linux") ? "Linux"
    : "Unknown"

  const device = isTablet ? "Tablet" : isMobile ? "Mobile" : "Desktop"

  return { device, browser, os }
}

/** Extract client IP from request headers */
export function extractIP(headers: Headers): string {
  return headers.get("x-real-ip")
    ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? headers.get("cf-connecting-ip")
    ?? "unknown"
}
