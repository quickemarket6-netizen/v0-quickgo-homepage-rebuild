import { NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/payments/security"

function ts(minutesOffset: number) {
  return new Date(Date.now() + minutesOffset * 60_000).toISOString()
}

// NOTE: demo dataset held in module memory — manual backups survive only for
// the lifetime of the server process. Hook to a real backup job for prod.
const BACKUPS = [
  { id:"BCK-0142", type:"full",        status:"success",  size_mb:2_480, duration_s:84,  created_at:ts(-180),   storage:"S3 Paris",      compressed:true,  encrypted:true  },
  { id:"BCK-0141", type:"incremental", status:"success",  size_mb:142,   duration_s:12,  created_at:ts(-360),   storage:"S3 Paris",      compressed:true,  encrypted:true  },
  { id:"BCK-0140", type:"incremental", status:"success",  size_mb:118,   duration_s:10,  created_at:ts(-720),   storage:"S3 Paris",      compressed:true,  encrypted:true  },
  { id:"BCK-0139", type:"incremental", status:"success",  size_mb:165,   duration_s:14,  created_at:ts(-1080),  storage:"S3 Paris",      compressed:true,  encrypted:true  },
  { id:"BCK-0138", type:"full",        status:"success",  size_mb:2_410, duration_s:81,  created_at:ts(-1440),  storage:"GCS Europe",    compressed:true,  encrypted:true  },
  { id:"BCK-0137", type:"incremental", status:"success",  size_mb:98,    duration_s:9,   created_at:ts(-1800),  storage:"S3 Paris",      compressed:true,  encrypted:true  },
  { id:"BCK-0136", type:"incremental", status:"failed",   size_mb:0,     duration_s:0,   created_at:ts(-2160),  storage:"S3 Paris",      compressed:false, encrypted:false },
  { id:"BCK-0135", type:"incremental", status:"success",  size_mb:134,   duration_s:11,  created_at:ts(-2520),  storage:"GCS Europe",    compressed:true,  encrypted:true  },
  { id:"BCK-0134", type:"full",        status:"success",  size_mb:2_380, duration_s:79,  created_at:ts(-2880),  storage:"S3 Paris",      compressed:true,  encrypted:true  },
  { id:"BCK-0133", type:"incremental", status:"success",  size_mb:121,   duration_s:10,  created_at:ts(-3240),  storage:"S3 Paris",      compressed:true,  encrypted:true  },
  { id:"BCK-0132", type:"incremental", status:"success",  size_mb:189,   duration_s:16,  created_at:ts(-3600),  storage:"GCS Europe",    compressed:true,  encrypted:true  },
  { id:"BCK-0131", type:"logs",        status:"success",  size_mb:48,    duration_s:5,   created_at:ts(-4320),  storage:"S3 Paris",      compressed:true,  encrypted:false },
]

const SCHEDULES = [
  { id:"SCH-01", name:"Backup complet quotidien",   type:"full",        cron:"0 2 * * *",   next_run:ts(120), enabled:true,  storage:"S3 Paris",   retention_days:30 },
  { id:"SCH-02", name:"Backup incrémental 6h",      type:"incremental", cron:"0 */6 * * *", next_run:ts(240), enabled:true,  storage:"S3 Paris",   retention_days:7  },
  { id:"SCH-03", name:"Backup logs hebdo",          type:"logs",        cron:"0 3 * * 0",   next_run:ts(5040),enabled:true,  storage:"GCS Europe", retention_days:90 },
  { id:"SCH-04", name:"Backup media mensuel",       type:"media",       cron:"0 4 1 * *",   next_run:ts(21000),enabled:false, storage:"GCS Europe", retention_days:365},
]

export async function GET() {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error ?? "Accès refusé" }, { status: 403 })

  const success = BACKUPS.filter(b => b.status === "success")
  const failed  = BACKUPS.filter(b => b.status === "failed")
  const totalStorage = success.reduce((s, b) => s + b.size_mb, 0)
  const lastFull = BACKUPS.find(b => b.type === "full" && b.status === "success")

  return NextResponse.json({
    kpi: {
      total_backups:     BACKUPS.length,
      success_count:     success.length,
      failed_count:      failed.length,
      total_storage_mb:  totalStorage,
      last_full_size_mb: lastFull?.size_mb ?? 0,
      schedules_active:  SCHEDULES.filter(s => s.enabled).length,
      success_rate:      Math.round(success.length / BACKUPS.length * 100),
    },
    backups: BACKUPS,
    schedules: SCHEDULES,
    storage_trend: [
      { day:"J-6", full:2_320, incremental:520, logs:45 },
      { day:"J-5", full:2_350, incremental:498, logs:42 },
      { day:"J-4", full:2_380, incremental:534, logs:48 },
      { day:"J-3", full:2_410, incremental:512, logs:51 },
      { day:"J-2", full:2_440, incremental:568, logs:46 },
      { day:"J-1", full:2_450, incremental:540, logs:44 },
      { day:"Auj", full:2_480, incremental:Math.round(142+118+165), logs:0 },
    ],
  })
}

// POST — trigger a manual backup (admin only)
export async function POST() {
  const admin = await verifyAdmin()
  if (!admin.valid) return NextResponse.json({ error: admin.error }, { status: 403 })

  const lastNum = parseInt(BACKUPS[0]?.id.replace("BCK-", "") ?? "0", 10)
  const backup = {
    id: `BCK-${String(lastNum + 1).padStart(4, "0")}`,
    type: "full",
    status: "success",
    size_mb: 2_480 + Math.round(Math.random() * 60),
    duration_s: 80 + Math.round(Math.random() * 10),
    created_at: new Date().toISOString(),
    storage: "S3 Paris",
    compressed: true,
    encrypted: true,
  }
  BACKUPS.unshift(backup)

  return NextResponse.json({ success: true, backup }, { status: 201 })
}
