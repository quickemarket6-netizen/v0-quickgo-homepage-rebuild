import { NextResponse } from "next/server"

function ts(minutesOffset: number) {
  return new Date(Date.now() + minutesOffset * 60_000).toISOString()
}

const SERVICES = [
  { id:"SVC-01", name:"API Gateway",          status:"operational",  uptime:99.98, response_ms:42,  cpu_pct:28, ram_pct:41, last_incident:ts(-43800), region:"Paris"   },
  { id:"SVC-02", name:"Database Primary",     status:"operational",  uptime:99.97, response_ms:8,   cpu_pct:35, ram_pct:62, last_incident:ts(-21900), region:"Paris"   },
  { id:"SVC-03", name:"Database Replica",     status:"operational",  uptime:99.99, response_ms:9,   cpu_pct:22, ram_pct:58, last_incident:null,       region:"Frankfurt"},
  { id:"SVC-04", name:"Payment Service",      status:"operational",  uptime:99.95, response_ms:124, cpu_pct:18, ram_pct:33, last_incident:ts(-8760),  region:"Paris"   },
  { id:"SVC-05", name:"Notification Service", status:"operational",  uptime:99.92, response_ms:68,  cpu_pct:24, ram_pct:45, last_incident:ts(-2880),  region:"Paris"   },
  { id:"SVC-06", name:"Geolocation Service",  status:"degraded",     uptime:98.72, response_ms:342, cpu_pct:78, ram_pct:71, last_incident:ts(-30),    region:"Paris"   },
  { id:"SVC-07", name:"Media CDN",            status:"operational",  uptime:99.94, response_ms:28,  cpu_pct:12, ram_pct:24, last_incident:ts(-43800), region:"Global"  },
  { id:"SVC-08", name:"Search Engine",        status:"operational",  uptime:99.88, response_ms:88,  cpu_pct:42, ram_pct:55, last_incident:ts(-17520), region:"Paris"   },
  { id:"SVC-09", name:"Email Service",        status:"operational",  uptime:99.91, response_ms:210, cpu_pct:8,  ram_pct:19, last_incident:ts(-8760),  region:"Global"  },
  { id:"SVC-10", name:"SMS Gateway",          status:"operational",  uptime:99.85, response_ms:185, cpu_pct:6,  ram_pct:15, last_incident:ts(-8760),  region:"Global"  },
  { id:"SVC-11", name:"Auth Service",         status:"operational",  uptime:99.99, response_ms:32,  cpu_pct:15, ram_pct:28, last_incident:null,       region:"Paris"   },
  { id:"SVC-12", name:"Delivery Matching",    status:"maintenance",  uptime:97.14, response_ms:0,   cpu_pct:0,  ram_pct:0,  last_incident:ts(-120),   region:"Paris"   },
]

const INCIDENTS = [
  { id:"INC-042", title:"Geolocation latency spike",     severity:"warning",  status:"investigating", service:"Geolocation Service", started_at:ts(-30),   resolved_at:null,   affected_users:284  },
  { id:"INC-041", title:"Delivery Matching maintenance",  severity:"info",     status:"scheduled",     service:"Delivery Matching",   started_at:ts(-120),  resolved_at:null,   affected_users:0    },
  { id:"INC-040", title:"FCM delivery failure (23 tokens)",severity:"warning", status:"resolved",     service:"Notification Service",started_at:ts(-180),  resolved_at:ts(-120),affected_users:23  },
  { id:"INC-039", title:"DB query timeout spike",         severity:"critical", status:"resolved",      service:"Database Primary",    started_at:ts(-720),  resolved_at:ts(-660),affected_users:1_240},
  { id:"INC-038", title:"API rate limit overload",        severity:"warning",  status:"resolved",      service:"API Gateway",         started_at:ts(-1440), resolved_at:ts(-1380),affected_users:42 },
  { id:"INC-037", title:"Orange Money webhook errors",    severity:"critical", status:"resolved",      service:"Payment Service",     started_at:ts(-2880), resolved_at:ts(-2820),affected_users:87 },
]

const operational = SERVICES.filter(s => s.status === "operational")
const degraded     = SERVICES.filter(s => s.status === "degraded")
const maintenance  = SERVICES.filter(s => s.status === "maintenance")

const avgUptime    = Math.round(SERVICES.reduce((sum, s) => sum + s.uptime, 0) / SERVICES.length * 100) / 100
const avgResponseMs = Math.round(SERVICES.filter(s => s.response_ms > 0).reduce((sum, s) => sum + s.response_ms, 0) / SERVICES.filter(s => s.response_ms > 0).length)

export async function GET() {
  return NextResponse.json({
    kpi: {
      operational_count: operational.length,
      degraded_count:    degraded.length,
      maintenance_count: maintenance.length,
      avg_uptime:        avgUptime,
      avg_response_ms:   avgResponseMs,
      active_incidents:  INCIDENTS.filter(i => i.status !== "resolved").length,
    },
    services: SERVICES,
    incidents: INCIDENTS,
    uptime_trend: Array.from({ length: 7 }, (_, i) => ({
      day: ["Lun","Mar","Mer","Jeu","Ven","Sam","Auj"][i],
      uptime: 99.0 + Math.random() * 1.0,
      p95_ms: 80 + Math.floor(Math.random() * 80),
    })),
    resource_summary: {
      avg_cpu: Math.round(SERVICES.filter(s=>s.cpu_pct>0).reduce((sum,s)=>sum+s.cpu_pct,0)/SERVICES.filter(s=>s.cpu_pct>0).length),
      avg_ram: Math.round(SERVICES.filter(s=>s.ram_pct>0).reduce((sum,s)=>sum+s.ram_pct,0)/SERVICES.filter(s=>s.ram_pct>0).length),
      max_cpu_service: SERVICES.reduce((a,b)=>a.cpu_pct>b.cpu_pct?a:b).name,
      max_ram_service: SERVICES.reduce((a,b)=>a.ram_pct>b.ram_pct?a:b).name,
    },
  })
}
