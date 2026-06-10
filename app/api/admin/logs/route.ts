import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

// GET /api/admin/logs — unified system log view
// Sources: security_logs + admin_action_logs, unified into Log shape

const SERVICE_COLORS: Record<string, string> = {
  security:        "#ef4444",
  auth:            "#3b82f6",
  orders:          "#22c55e",
  payouts:         "#f97316",
  cms:             "#8b5cf6",
  blog:            "#ec4899",
  faq:             "#eab308",
  vendor:          "#06b6d4",
  driver:          "#10b981",
  system:          "#6b6b8a",
  notifications:   "#a78bfa",
  "payment-gateway": "#f97316",
  database:        "#ef4444",
  deliveries:      "#eab308",
  api:             "#22d3ee",
  storage:         "#ec4899",
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const levelFilter   = searchParams.get("level")   // error|warn|info|all
  const serviceFilter = searchParams.get("service")
  const limit         = Math.min(parseInt(searchParams.get("limit") ?? "100"), 500)
  const hours         = parseInt(searchParams.get("hours") ?? "24")
  const since         = new Date(Date.now() - hours * 3_600_000).toISOString()

  // ── Fetch both sources in parallel ────────────────────────────
  const [{ data: secRaw }, { data: adminRaw }] = await Promise.all([
    supabase
      .from("security_logs")
      .select("id, type, level, ip_address, user_id, endpoint, payload_excerpt, created_at, blocked, acknowledged")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("admin_action_logs")
      .select("id, admin_id, admin_email, action, resource, resource_id, ip_address, created_at, metadata")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(limit),
  ])

  // ── Normalise security_logs → Log shape ────────────────────────
  function threatLevelToLogLevel(level: string): string {
    if (level === "critical" || level === "high") return "error"
    if (level === "medium") return "warn"
    return "info"
  }

  const secLogs = (secRaw ?? []).map(r => ({
    id:          r.id,
    level:       threatLevelToLogLevel(r.level),
    service:     "security",
    message:     `${r.type?.replace(/_/g, " ").toUpperCase()} — ${r.endpoint ?? "/"}${r.blocked ? " [BLOQUÉ]" : ""}`,
    ip:          r.ip_address ?? "unknown",
    user:        r.user_id ? `user:${r.user_id.slice(0, 8)}` : "system",
    duration_ms: 0,
    ts:          r.created_at,
    source:      "security",
    acknowledged: r.acknowledged,
  }))

  // ── Normalise admin_action_logs → Log shape ────────────────────
  const adminLogs = (adminRaw ?? []).map(r => ({
    id:          r.id,
    level:       "info",
    service:     r.resource ?? "admin",
    message:     `Admin ${r.action?.toUpperCase()} on ${r.resource} ${r.resource_id ? `#${String(r.resource_id).slice(0, 8)}` : ""}`.trim(),
    ip:          r.ip_address ?? "unknown",
    user:        r.admin_email ?? `admin:${r.admin_id?.slice(0, 8) ?? "?"}`,
    duration_ms: 0,
    ts:          r.created_at,
    source:      "admin_action",
    acknowledged: true,
  }))

  // ── Combine + sort by timestamp ─────────────────────────────────
  let combined = [...secLogs, ...adminLogs]
    .sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime())
    .slice(0, limit)

  // Apply filters
  if (levelFilter && levelFilter !== "all") {
    combined = combined.filter(l => l.level === levelFilter)
  }
  if (serviceFilter && serviceFilter !== "all") {
    combined = combined.filter(l => l.service === serviceFilter)
  }

  // ── KPI ─────────────────────────────────────────────────────────
  const errors = combined.filter(l => l.level === "error").length
  const warns  = combined.filter(l => l.level === "warn").length
  const infos  = combined.filter(l => l.level === "info").length

  const services = Array.from(new Set(combined.map(l => l.service)))
  const kpi = {
    total_today:      combined.length,
    errors_count:     errors,
    warns_count:      warns,
    infos_count:      infos,
    avg_response_ms:  0,
    services_count:   services.length,
  }

  // ── Service distribution ─────────────────────────────────────────
  const svcCount: Record<string, number> = {}
  combined.forEach(l => { svcCount[l.service] = (svcCount[l.service] ?? 0) + 1 })
  const total = Math.max(combined.length, 1)
  const service_distribution = Object.entries(svcCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([service, count]) => ({
      service, count, pct: Math.round(count / total * 100),
      color: SERVICE_COLORS[service] ?? "#6b6b8a",
    }))

  // ── Level distribution ───────────────────────────────────────────
  const level_distribution = [
    { level: "error", count: errors, color: "#ef4444" },
    { level: "warn",  count: warns,  color: "#f59e0b" },
    { level: "info",  count: infos,  color: "#3b82f6" },
  ]

  // ── Hourly trend (last 24h) ──────────────────────────────────────
  const now = Date.now()
  const hourMap: Record<string, { errors: number; warns: number; infos: number }> = {}
  for (let h = 23; h >= 0; h--) {
    const d = new Date(now - h * 3_600_000)
    hourMap[String(d.getHours()).padStart(2, "0") + "h"] = { errors: 0, warns: 0, infos: 0 }
  }
  combined.forEach(l => {
    const key = String(new Date(l.ts).getHours()).padStart(2, "0") + "h"
    if (key in hourMap) {
      if (l.level === "error") hourMap[key].errors++
      else if (l.level === "warn") hourMap[key].warns++
      else hourMap[key].infos++
    }
  })
  const hourly_trend = Object.entries(hourMap).map(([hour, counts]) => ({ hour, ...counts }))

  return NextResponse.json({
    kpi,
    logs:                combined,
    service_distribution,
    level_distribution,
    hourly_trend,
  })
}
