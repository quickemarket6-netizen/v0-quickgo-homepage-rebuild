import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { logLoginAttempt, parseUserAgent, extractIP } from "@/lib/security/threat-logger"
import { SecurityService } from "@/lib/security/cybersecurity"

// POST /api/auth/login-event
// Called by client auth flows to persist login attempts to DB

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    email?: string
    phone?: string
    status: "success" | "failed" | "blocked" | "suspicious"
    userId?: string
    failureReason?: string
  }

  const ip          = extractIP(req.headers)
  const ua          = req.headers.get("user-agent") ?? ""
  const { device, browser, os } = parseUserAgent(ua)
  const fingerprint = SecurityService.generateFingerprint(ua, ip)

  await logLoginAttempt({
    userId:        body.userId,
    email:         body.email,
    phone:         body.phone,
    ip,
    userAgent:     ua,
    fingerprint,
    device,
    browser,
    os,
    status:        body.status,
    failureReason: body.failureReason,
  })

  // Check brute-force and auto-block if needed
  if (body.status === "failed") {
    const bruteCheck = SecurityService.checkBruteForce(ip, "/api/auth/login")
    if (bruteCheck.blocked) {
      const supabase = await createClient()
      // Persist auto-block
      await supabase.from("blocked_ips").upsert({
        ip_address:   ip,
        reason:       `Brute force — ${bruteCheck.attempts} tentatives`,
        auto_blocked: true,
        is_active:    true,
        expires_at:   new Date(Date.now() + 15 * 60_000).toISOString(),
        blocked_at:   new Date().toISOString(),
        unblocked_at: null,
        unblocked_by: null,
      }, { onConflict: "ip_address" })
    }
  }

  return NextResponse.json({ recorded: true })
}
