import { NextResponse } from "next/server"

function ts(minutesOffset: number) {
  return new Date(Date.now() + minutesOffset * 60_000).toISOString()
}

const API_KEYS = [
  { id:"KEY-001", name:"MTN_MoMo_PROD",        service:"MTN Money",       status:"active",   created_at:ts(-87600), last_used:ts(-5),    requests_today:1_842, requests_month:48_200 },
  { id:"KEY-002", name:"ORANGE_MONEY_PROD",     service:"Orange Money",    status:"active",   created_at:ts(-87600), last_used:ts(-12),   requests_today:2_104, requests_month:62_800 },
  { id:"KEY-003", name:"WAVE_API_v2",           service:"Wave",            status:"active",   created_at:ts(-43800), last_used:ts(-8),    requests_today:892,   requests_month:24_100 },
  { id:"KEY-004", name:"CINETPAY_PROD",         service:"CinetPay",        status:"active",   created_at:ts(-43800), last_used:ts(-45),   requests_today:421,   requests_month:11_400 },
  { id:"KEY-005", name:"PAYPAL_SANDBOX",        service:"PayPal",          status:"active",   created_at:ts(-21900), last_used:ts(-120),  requests_today:87,    requests_month:2_100  },
  { id:"KEY-006", name:"FIREBASE_FCM_PROD",     service:"Firebase",        status:"active",   created_at:ts(-87600), last_used:ts(-3),    requests_today:4_200, requests_month:112_000},
  { id:"KEY-007", name:"GOOGLE_MAPS_PROD",      service:"Google Maps",     status:"active",   created_at:ts(-87600), last_used:ts(-2),    requests_today:8_421, requests_month:218_000},
  { id:"KEY-008", name:"TWILIO_SMS",            service:"Twilio",          status:"active",   created_at:ts(-43800), last_used:ts(-30),   requests_today:214,   requests_month:5_800  },
  { id:"KEY-009", name:"SENDGRID_EMAIL",        service:"SendGrid",        status:"active",   created_at:ts(-43800), last_used:ts(-22),   requests_today:342,   requests_month:9_200  },
  { id:"KEY-010", name:"SENTRY_DSN_PROD",       service:"Sentry",          status:"active",   created_at:ts(-17520), last_used:ts(-5),    requests_today:1_024, requests_month:28_400 },
  { id:"KEY-011", name:"INTERNAL_VENDOR_API",   service:"QuickGo Vendors", status:"active",   created_at:ts(-87600), last_used:ts(-1),    requests_today:3_812, requests_month:98_200 },
  { id:"KEY-012", name:"ORANGE_MONEY_SANDBOX",  service:"Orange Money",    status:"revoked",  created_at:ts(-87600), last_used:ts(-4320), requests_today:0,     requests_month:0      },
]

const WEBHOOKS = [
  { id:"WHK-01", url:"https://api.quickgo.cm/webhooks/mtn-momo",    event:"payment.success",  status:"active",  last_triggered:ts(-5),   success_rate:99.2 },
  { id:"WHK-02", url:"https://api.quickgo.cm/webhooks/orange-money", event:"payment.any",      status:"active",  last_triggered:ts(-12),  success_rate:97.8 },
  { id:"WHK-03", url:"https://api.quickgo.cm/webhooks/wave",         event:"transfer.done",    status:"active",  last_triggered:ts(-8),   success_rate:98.4 },
  { id:"WHK-04", url:"https://api.quickgo.cm/webhooks/driver-gps",   event:"location.update",  status:"active",  last_triggered:ts(-1),   success_rate:94.1 },
  { id:"WHK-05", url:"https://partner.davy-store.cm/orders",         event:"order.created",    status:"active",  last_triggered:ts(-42),  success_rate:96.5 },
  { id:"WHK-06", url:"https://api.cinetpay.com/v2/callback",         event:"payment.any",      status:"paused",  last_triggered:ts(-720), success_rate:85.3 },
]

const active   = API_KEYS.filter(k => k.status === "active")
const revoked  = API_KEYS.filter(k => k.status === "revoked")
const totalRequests = active.reduce((s, k) => s + k.requests_today, 0)
const totalMonth    = active.reduce((s, k) => s + k.requests_month, 0)

export async function GET() {
  return NextResponse.json({
    kpi: {
      active_keys:      active.length,
      revoked_keys:     revoked.length,
      requests_today:   totalRequests,
      requests_month:   totalMonth,
      webhooks_active:  WEBHOOKS.filter(w => w.status === "active").length,
      avg_success_rate: Math.round(WEBHOOKS.filter(w => w.status === "active").reduce((s, w) => s + w.success_rate, 0) / WEBHOOKS.filter(w => w.status === "active").length * 10) / 10,
    },
    api_keys: API_KEYS,
    webhooks: WEBHOOKS,
    service_usage: API_KEYS.filter(k => k.status === "active").map(k => ({
      name: k.service.length > 12 ? k.service.slice(0, 12) : k.service,
      requests: k.requests_today,
    })).sort((a, b) => b.requests - a.requests).slice(0, 8),
    requests_trend: [
      { day:"Lun", requests:18_200 }, { day:"Mar", requests:22_400 },
      { day:"Mer", requests:16_800 }, { day:"Jeu", requests:28_100 },
      { day:"Ven", requests:34_200 }, { day:"Sam", requests:41_000 },
      { day:"Auj", requests:totalRequests },
    ],
  })
}
