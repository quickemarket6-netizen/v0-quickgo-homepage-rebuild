import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"
import { blockIPPersistent, unblockIPPersistent } from "@/lib/security/threat-logger"
import { logAdminAction } from "@/lib/security/log-admin-action"

// GET  /api/admin/security — threats + blocked IPs + login activity + KPI
// POST /api/admin/security — block_ip | unblock_ip | acknowledge

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const level  = searchParams.get("level")   // filter by threat level
  const limit  = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500)
  const hours  = parseInt(searchParams.get("hours") ?? "48")  // lookback window

  const since = new Date(Date.now() - hours * 3_600_000).toISOString()
  const today = new Date(); today.setHours(0, 0, 0, 0)

  // ── Parallel fetch ──────────────────────────────────────────
  const [
    { data: logsRaw, error: logsErr },
    { data: blockedRaw },
    { data: loginRaw },
    { data: kpiRaw },
  ] = await Promise.all([
    // Recent security logs
    supabase
      .from("security_logs")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(r => level && level !== "all" ? supabase.from("security_logs").select("*").eq("level", level).gte("created_at", since).order("created_at", { ascending: false }).limit(limit) : r),
    // Active blocked IPs
    supabase
      .from("blocked_ips")
      .select("ip_address, reason, blocked_at, expires_at, auto_blocked, blocked_by")
      .eq("is_active", true)
      .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
      .order("blocked_at", { ascending: false }),
    // Recent login attempts (last 24h)
    supabase
      .from("login_attempts")
      .select("id, email, ip_address, status, failure_reason, country, city, user_agent, created_at")
      .gte("created_at", new Date(Date.now() - 86_400_000).toISOString())
      .order("created_at", { ascending: false })
      .limit(50),
    // KPI from all-time + today
    supabase
      .from("security_logs")
      .select("level, blocked, created_at")
      .gte("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString()),
  ])

  if (logsErr) return NextResponse.json({ error: logsErr.message }, { status: 500 })

  // Map DB rows → ThreatEvent shape (matching the frontend interface)
  const threats = (logsRaw ?? []).map(row => ({
    id:           row.id,
    type:         row.type,
    level:        row.level,
    ip:           row.ip_address ?? "unknown",
    country:      row.country ?? "Unknown",
    city:         row.city ?? "Unknown",
    device:       row.device ?? "Unknown",
    browser:      row.browser ?? "Unknown",
    os:           row.os ?? "Unknown",
    fingerprint:  row.fingerprint ?? null,
    timestamp:    row.created_at,   // ISO string — frontend converts with new Date()
    endpoint:     row.endpoint ?? "/",
    payload:      row.payload_excerpt ?? null,
    requestCount: row.request_count ?? null,
    sessionId:    row.session_id ?? null,
    userId:       row.user_id ?? null,
    blocked:      row.blocked ?? false,
    alertsSent:   row.alert_sent ?? false,
    acknowledged: row.acknowledged ?? false,
  }))

  const all7d = kpiRaw ?? []
  const todayThreats = all7d.filter(r => r.created_at >= today.toISOString())

  // Security score: penalise by threat severity
  const critical7d = all7d.filter(r => r.level === "critical").length
  const high7d      = all7d.filter(r => r.level === "high").length
  const medium7d    = all7d.filter(r => r.level === "medium").length
  const penalty     = Math.min(40, critical7d * 8 + high7d * 3 + medium7d)
  const securityScore = Math.max(60, 100 - penalty)

  const kpi = {
    total_threats:    threats.length,
    critical_threats: threats.filter(t => t.level === "critical").length,
    high_threats:     threats.filter(t => t.level === "high").length,
    blocked_ips_count:(blockedRaw ?? []).length,
    threats_today:    todayThreats.length,
    security_score:   securityScore,
    failed_logins_24h:(loginRaw ?? []).filter(l => l.status === "failed" || l.status === "blocked").length,
  }

  // 24h hourly trend of security events
  const now = Date.now()
  const hourMap: Record<string, number> = {}
  for (let h = 23; h >= 0; h--) {
    const d = new Date(now - h * 3_600_000)
    hourMap[String(d.getHours()).padStart(2, "0") + "h"] = 0
  }
  ;(logsRaw ?? []).forEach(r => {
    const h = new Date(r.created_at).getHours()
    const key = String(h).padStart(2, "0") + "h"
    if (key in hourMap) hourMap[key]++
  })
  const trend_24h = Object.entries(hourMap).map(([hour, count]) => ({ hour, count }))

  return NextResponse.json({
    kpi,
    threats,
    blocked_ips:    blockedRaw ?? [],
    login_attempts: loginRaw ?? [],
    trend_24h,
  })
}

export async function POST(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const body = await req.json() as {
    action: "block_ip" | "unblock_ip" | "acknowledge" | "bulk_acknowledge"
    ip?: string
    threat_id?: string
    reason?: string
    duration_hours?: number
  }

  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown"

  // ── Block IP ────────────────────────────────────────────────
  if (body.action === "block_ip") {
    if (!body.ip) return NextResponse.json({ error: "ip requis" }, { status: 400 })

    await blockIPPersistent({
      ip:           body.ip,
      reason:       body.reason ?? "Manuel — admin action",
      blockedBy:    admin.adminId,
      durationHours: body.duration_hours ?? undefined,
      autoBlocked:  false,
    })

    await logAdminAction({
      adminId:   admin.adminId,
      action:    "block",
      resource:  "ip_address",
      resourceId: body.ip,
      ip:        ipAddress,
      metadata:  { reason: body.reason, duration_hours: body.duration_hours },
    })

    return NextResponse.json({ success: true })
  }

  // ── Unblock IP ──────────────────────────────────────────────
  if (body.action === "unblock_ip") {
    if (!body.ip) return NextResponse.json({ error: "ip requis" }, { status: 400 })

    await unblockIPPersistent({ ip: body.ip, unblockedBy: admin.adminId })

    await logAdminAction({
      adminId:   admin.adminId,
      action:    "unblock",
      resource:  "ip_address",
      resourceId: body.ip,
      ip:        ipAddress,
    })

    return NextResponse.json({ success: true })
  }

  // ── Acknowledge threat ──────────────────────────────────────
  if (body.action === "acknowledge") {
    if (!body.threat_id) return NextResponse.json({ error: "threat_id requis" }, { status: 400 })

    const supabase = await createClient()
    const { error } = await supabase
      .from("security_logs")
      .update({
        acknowledged:    true,
        acknowledged_by: admin.adminId,
        acknowledged_at: new Date().toISOString(),
      })
      .eq("id", body.threat_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  // ── Bulk acknowledge all ────────────────────────────────────
  if (body.action === "bulk_acknowledge") {
    const supabase = await createClient()
    await supabase
      .from("security_logs")
      .update({
        acknowledged:    true,
        acknowledged_by: admin.adminId,
        acknowledged_at: new Date().toISOString(),
      })
      .eq("acknowledged", false)

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "action invalide" }, { status: 400 })
}
