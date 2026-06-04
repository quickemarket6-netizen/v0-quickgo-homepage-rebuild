import { NextResponse } from "next/server"

function ts(minutesOffset: number) {
  return new Date(Date.now() + minutesOffset * 60_000).toISOString()
}

const LOGS = [
  { id:"LOG-8921", level:"error",   service:"payment-gateway",  message:"Webhook Orange Money timeout after 30s",                   ip:"41.202.207.12",  user:"system",           duration_ms:30_012, ts:ts(-2)   },
  { id:"LOG-8920", level:"warn",    service:"auth",              message:"Failed login attempt (3/5) for fomoujunior2@gmail.com",    ip:"196.188.234.71", user:"fomoujunior2@gmail.com", duration_ms:84,  ts:ts(-5)   },
  { id:"LOG-8919", level:"info",    service:"orders",            message:"Order CMD-78821 created successfully for Marie Ngo",       ip:"196.184.108.33", user:"client_C001",      duration_ms:128, ts:ts(-8)   },
  { id:"LOG-8918", level:"info",    service:"notifications",     message:"Push notification batch #47 sent to 1242 devices",         ip:"10.0.0.2",       user:"system",           duration_ms:842, ts:ts(-12)  },
  { id:"LOG-8917", level:"error",   service:"database",          message:"Query timeout on table transactions (>5s)",               ip:"10.0.0.1",       user:"system",           duration_ms:5_084, ts:ts(-18) },
  { id:"LOG-8916", level:"info",    service:"deliveries",        message:"Driver D001 assigned to CMD-78821 automatically",         ip:"10.0.0.2",       user:"system",           duration_ms:42,  ts:ts(-22)  },
  { id:"LOG-8915", level:"warn",    service:"api",               message:"Rate limit reached for endpoint /api/orders (IP: 41.202.x)",ip:"41.202.207.12",user:"vendor_V003",      duration_ms:12,  ts:ts(-28)  },
  { id:"LOG-8914", level:"info",    service:"auth",              message:"Admin login successful: Emmanuel Admin (2FA verified)",    ip:"196.188.100.42", user:"super_admin",      duration_ms:312, ts:ts(-35)  },
  { id:"LOG-8913", level:"info",    service:"payment-gateway",   message:"Payout PAY-0084 processed via Wave: 1 850 000 FCFA",      ip:"10.0.0.2",       user:"system",           duration_ms:1_824, ts:ts(-42) },
  { id:"LOG-8912", level:"error",   service:"storage",           message:"Image upload failed: file size exceeds 5MB limit",        ip:"196.184.209.11", user:"vendor_V007",      duration_ms:234, ts:ts(-48)  },
  { id:"LOG-8911", level:"warn",    service:"geolocation",       message:"GPS coordinates invalid for driver D007 (0,0 detected)",  ip:"10.0.0.3",       user:"driver_D007",      duration_ms:28,  ts:ts(-55)  },
  { id:"LOG-8910", level:"info",    service:"cms",               message:"Page /promo/juin-2026 published by Jean Mvondo",          ip:"196.188.100.55", user:"admin_jean",       duration_ms:98,  ts:ts(-62)  },
  { id:"LOG-8909", level:"info",    service:"orders",            message:"Order CMD-78820 delivered, rating 5/5 submitted",         ip:"196.184.108.77", user:"client_C002",      duration_ms:64,  ts:ts(-75)  },
  { id:"LOG-8908", level:"error",   service:"notifications",     message:"FCM token invalid for 23 devices, cleanup queued",        ip:"10.0.0.2",       user:"system",           duration_ms:412, ts:ts(-90)  },
  { id:"LOG-8907", level:"warn",    service:"payment-gateway",   message:"CinetPay callback missing transaction_id field",          ip:"154.66.78.212",  user:"system",           duration_ms:18,  ts:ts(-102) },
  { id:"LOG-8906", level:"info",    service:"auth",              message:"Password changed successfully for Sylvie Kengne",         ip:"196.188.234.92", user:"support_sylvie",   duration_ms:184, ts:ts(-120) },
  { id:"LOG-8905", level:"info",    service:"backups",           message:"Daily backup completed: 2.4GB, 0 errors",                 ip:"10.0.0.1",       user:"system",           duration_ms:84_420, ts:ts(-180)},
  { id:"LOG-8904", level:"warn",    service:"database",          message:"Connection pool at 85% capacity (85/100 connections)",    ip:"10.0.0.1",       user:"system",           duration_ms:0,   ts:ts(-240) },
  { id:"LOG-8903", level:"info",    service:"api",               message:"API key rotated for integration MTN_MoMo_PROD",           ip:"196.188.100.42", user:"super_admin",      duration_ms:88,  ts:ts(-360) },
  { id:"LOG-8902", level:"error",   service:"deliveries",        message:"Delivery route calculation failed: no drivers available", ip:"10.0.0.2",       user:"system",           duration_ms:2_134, ts:ts(-480)},
]

const errors   = LOGS.filter(l => l.level === "error")
const warns    = LOGS.filter(l => l.level === "warn")
const infos    = LOGS.filter(l => l.level === "info")

const serviceCount: Record<string, number> = {}
LOGS.forEach(l => { serviceCount[l.service] = (serviceCount[l.service] ?? 0) + 1 })

const serviceColors: Record<string, string> = {
  "payment-gateway":"#f97316", "auth":"#3b82f6", "orders":"#22c55e",
  "notifications":"#8b5cf6", "database":"#ef4444", "deliveries":"#eab308",
  "api":"#22d3ee", "storage":"#ec4899", "geolocation":"#6b6b8a",
  "cms":"#a78bfa", "backups":"#4ade80",
}

export async function GET() {
  return NextResponse.json({
    kpi: {
      total_today:   LOGS.length,
      errors_count:  errors.length,
      warns_count:   warns.length,
      infos_count:   infos.length,
      avg_response_ms: Math.round(LOGS.reduce((s, l) => s + l.duration_ms, 0) / LOGS.length),
      services_count: Object.keys(serviceCount).length,
    },
    logs: LOGS,
    service_distribution: Object.entries(serviceCount).map(([service, count]) => ({
      service, count,
      pct: Math.round(count / LOGS.length * 100),
      color: serviceColors[service] ?? "#6b6b8a",
    })).sort((a, b) => b.count - a.count),
    level_distribution: [
      { level:"error", count:errors.length,  color:"#ef4444" },
      { level:"warn",  count:warns.length,   color:"#f59e0b" },
      { level:"info",  count:infos.length,   color:"#3b82f6" },
    ],
    hourly_trend: Array.from({ length: 12 }, (_, h) => ({
      hour: String(h * 2).padStart(2, "0") + "h",
      errors: Math.floor(Math.random() * 4),
      warns:  Math.floor(Math.random() * 5),
      infos:  Math.floor(Math.random() * 12) + 2,
    })),
  })
}
