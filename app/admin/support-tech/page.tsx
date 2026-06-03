"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Headphones, ArrowLeft, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, Activity, Server, Cpu, HardDrive, TrendingUp,
  AlertCircle, Info, Wrench, Globe, Zap, Shield,
} from "lucide-react"
import Link from "next/link"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts"

// ─── types ───────────────────────────────────────────────────────────────────
interface Service { id: string; name: string; status: string; uptime: number; response_ms: number; cpu_pct: number; ram_pct: number; last_incident: string | null; region: string }
interface Incident { id: string; title: string; severity: string; status: string; service: string; started_at: string; resolved_at: string | null; affected_users: number }
interface UptimeDay { day: string; uptime: number; p95_ms: number }
interface ResourceSummary { avg_cpu: number; avg_ram: number; max_cpu_service: string; max_ram_service: string }
interface Kpi { operational_count: number; degraded_count: number; maintenance_count: number; avg_uptime: number; avg_response_ms: number; active_incidents: number }
interface PageData { kpi: Kpi; services: Service[]; incidents: Incident[]; uptime_trend: UptimeDay[]; resource_summary: ResourceSummary }

// ─── configs ─────────────────────────────────────────────────────────────────
const SVC_STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string; pulse: boolean }> = {
  operational: { label:"Opérationnel", color:"text-green-300",  bg:"bg-green-500/15",  border:"border-green-500/30",  dot:"bg-green-400",  pulse:false },
  degraded:    { label:"Dégradé",      color:"text-amber-300",  bg:"bg-amber-500/15",  border:"border-amber-500/30",  dot:"bg-amber-400",  pulse:true  },
  maintenance: { label:"Maintenance",  color:"text-blue-300",   bg:"bg-blue-500/15",   border:"border-blue-500/30",   dot:"bg-blue-400",   pulse:true  },
  down:        { label:"Hors ligne",   color:"text-red-300",    bg:"bg-red-500/15",    border:"border-red-500/30",    dot:"bg-red-400",    pulse:true  },
}
const INC_SEVERITY_CFG: Record<string, { label: string; color: string; bg: string; border: string; Icon: typeof AlertCircle }> = {
  critical: { label:"Critique",  color:"text-red-300",    bg:"bg-red-500/15",    border:"border-red-500/30",    Icon: AlertCircle  },
  warning:  { label:"Avertis.",  color:"text-amber-300",  bg:"bg-amber-500/15",  border:"border-amber-500/30",  Icon: AlertTriangle},
  info:     { label:"Info",      color:"text-blue-300",   bg:"bg-blue-500/15",   border:"border-blue-500/30",   Icon: Info         },
}
const INC_STATUS_CFG: Record<string, { label: string; color: string }> = {
  investigating: { label:"Investigation",color:"text-amber-400"  },
  scheduled:     { label:"Planifié",     color:"text-blue-400"   },
  resolved:      { label:"Résolu",       color:"text-green-400"  },
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtRelative(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `il y a ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

function CountUp({ target, decimals = 0 }: { target: number; decimals?: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const steps = 40; let i = 0
    const iv = setInterval(() => {
      i++; setVal(Math.round((target * i / steps) * 10 ** decimals) / 10 ** decimals)
      if (i >= steps) clearInterval(iv)
    }, 800 / steps)
    return () => clearInterval(iv)
  }, [target, decimals])
  return <>{decimals > 0 ? val.toFixed(decimals) : val}</>
}

function KpiCard({ label, value, sub, subUp, icon: Icon, iconColor, delay, decimals = 0, suffix = "", pulse = false }:
  { label: string; value: number; sub?: string; subUp?: boolean; icon: typeof Headphones; iconColor: string; delay: number; decimals?: number; suffix?: string; pulse?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-[#6b6b8a] uppercase tracking-wider font-medium">{label}</span>
          <span className="text-2xl font-bold text-white leading-none">
            <CountUp target={value} decimals={decimals} />{suffix}
          </span>
        </div>
        <div className="relative">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}20` }}>
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
          {pulse && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />}
          {pulse && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500" />}
        </div>
      </div>
      {sub && (
        <div className={`flex items-center gap-1 text-[12px] font-medium ${subUp ? "text-green-400" : "text-[#6b6b8a]"}`}>
          {subUp && <TrendingUp className="w-3.5 h-3.5" />}
          {sub}
        </div>
      )}
    </motion.div>
  )
}

function ResourceBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }}
          transition={{ duration: 0.7 }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
      <span className="text-[11px] font-semibold w-8 text-right" style={{ color }}>{value}%</span>
    </div>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────
export default function SupportTechPage() {
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [lastUpdated, setLastUpdated] = useState(new Date())

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    const res = await fetch("/api/admin/support-tech")
    const json: PageData = await res.json()
    setData(json)
    setLastUpdated(new Date())
    if (isRefresh) setTimeout(() => setRefreshing(false), 600)
    else setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
        <Headphones className="w-10 h-10 text-purple-400" />
      </motion.div>
    </div>
  )

  const kpi = data!.kpi
  const services = data!.services

  const filtered = services.filter(s =>
    statusFilter === "all" || s.status === statusFilter
  )
  const filterKey = statusFilter

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur border-b border-[#1e1e2e] px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-xl hover:bg-[#1e1e2e] transition-colors">
            <ArrowLeft className="w-4 h-4 text-[#6b6b8a]" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Headphones className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white leading-none">Support technique</h1>
              <p className="text-[11px] text-[#6b6b8a] mt-0.5">
                Mis à jour {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
            </div>
            {(kpi.degraded_count > 0 || kpi.maintenance_count > 0) && (
              <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                {kpi.degraded_count + kpi.maintenance_count} service{kpi.degraded_count + kpi.maintenance_count > 1 ? "s" : ""} affecté{kpi.degraded_count + kpi.maintenance_count > 1 ? "s" : ""}
              </motion.span>
            )}
          </div>
          <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => load(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#16161f] border border-[#1e1e2e] text-[#6b6b8a] hover:text-white transition-colors text-[12px]">
            <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}>
              <RefreshCw className="w-3.5 h-3.5" />
            </motion.div>
            Actualiser
          </motion.button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Opérationnels"   value={kpi.operational_count}  sub="Services en ligne"   subUp icon={CheckCircle2} iconColor="#22c55e" delay={0}    />
          <KpiCard label="Dégradés"        value={kpi.degraded_count}     sub="Performance réduite"       icon={AlertTriangle} iconColor="#f59e0b" delay={0.07} pulse={kpi.degraded_count > 0} />
          <KpiCard label="Maintenance"     value={kpi.maintenance_count}  sub="En cours"                  icon={Wrench}        iconColor="#3b82f6" delay={0.14} />
          <KpiCard label="Uptime moyen"    value={kpi.avg_uptime}         sub="Sur 30 jours"        subUp icon={Shield}      iconColor="#22c55e" delay={0.21} decimals={2} suffix="%" />
          <KpiCard label="Latence moy."    value={kpi.avg_response_ms}    sub="Réponse API"               icon={Zap}          iconColor="#8b5cf6" delay={0.28} suffix="ms" />
          <KpiCard label="Incidents actifs" value={kpi.active_incidents}  sub="À résoudre"          icon={AlertCircle}   iconColor="#ef4444" delay={0.35} pulse={kpi.active_incidents > 0} />
        </div>

        {/* active incidents alert */}
        {data!.incidents.filter(i => i.status !== "resolved").length > 0 && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="text-[13px] font-bold text-amber-300">{data!.incidents.filter(i => i.status !== "resolved").length} incident{data!.incidents.filter(i=>i.status!=="resolved").length>1?"s":""} en cours</span>
            </div>
            <div className="space-y-2">
              {data!.incidents.filter(i => i.status !== "resolved").map((inc, i) => {
                const sevCfg = INC_SEVERITY_CFG[inc.severity] ?? INC_SEVERITY_CFG.info
                const stCfg  = INC_STATUS_CFG[inc.status] ?? INC_STATUS_CFG.resolved
                return (
                  <motion.div key={inc.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.08 }}
                    className="flex items-center gap-3 p-2.5 bg-[#0a0a0f]/60 rounded-xl"
                  >
                    <sevCfg.Icon className={`w-4 h-4 ${sevCfg.color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-[12px] font-medium text-white">{inc.title}</span>
                      <div className="flex items-center gap-2 text-[10px] text-[#6b6b8a]">
                        <span>{inc.service}</span>
                        <span>·</span>
                        <span>{fmtRelative(inc.started_at)}</span>
                        {inc.affected_users > 0 && <><span>·</span><span>{inc.affected_users} utilisateurs</span></>}
                      </div>
                    </div>
                    <span className={`text-[11px] font-semibold shrink-0 ${stCfg.color}`}>{stCfg.label}</span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* main grid */}
        <div className="grid grid-cols-5 gap-6">
          {/* services – 3/5 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="col-span-3 bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-[#1e1e2e] flex items-center gap-2">
              <Server className="w-4 h-4 text-[#6b6b8a]" />
              <span className="text-[13px] font-semibold text-white flex-1">État des services ({services.length})</span>
              <div className="flex items-center gap-1">
                {["all","operational","degraded","maintenance"].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${statusFilter === s ? "bg-blue-600 text-white" : "text-[#6b6b8a] hover:text-white hover:bg-[#1e1e2e]"}`}>
                    {s === "all" ? "Tous" : SVC_STATUS_CFG[s]?.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 540 }}>
              <AnimatePresence mode="wait">
                <motion.div key={filterKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {filtered.map((svc, i) => {
                    const cfg = SVC_STATUS_CFG[svc.status] ?? SVC_STATUS_CFG.operational
                    const cpuColor = svc.cpu_pct >= 80 ? "#ef4444" : svc.cpu_pct >= 60 ? "#f59e0b" : "#22c55e"
                    const ramColor = svc.ram_pct >= 80 ? "#ef4444" : svc.ram_pct >= 60 ? "#f59e0b" : "#8b5cf6"
                    return (
                      <motion.div key={svc.id}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.05 }}
                        className="px-4 py-3.5 border-b border-[#1e1e2e] last:border-0 hover:bg-[#1e1e2e]/40 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative shrink-0 mt-0.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[13px] font-semibold text-white">{svc.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>{cfg.label}</span>
                              <span className="text-[10px] text-[#4a4a6a] flex items-center gap-0.5"><Globe className="w-2.5 h-2.5" />{svc.region}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mt-2">
                              <div>
                                <p className="text-[10px] text-[#6b6b8a] mb-1">Uptime</p>
                                <p className={`text-[12px] font-bold ${svc.uptime >= 99.9 ? "text-green-400" : svc.uptime >= 99 ? "text-amber-400" : "text-red-400"}`}>{svc.uptime}%</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-[#6b6b8a] mb-1">Réponse</p>
                                <p className={`text-[12px] font-bold ${svc.response_ms === 0 ? "text-[#6b6b8a]" : svc.response_ms < 100 ? "text-green-400" : svc.response_ms < 300 ? "text-amber-400" : "text-red-400"}`}>
                                  {svc.response_ms === 0 ? "—" : `${svc.response_ms}ms`}
                                </p>
                              </div>
                              <div>
                                <p className="text-[10px] text-[#6b6b8a] mb-1">Dernier incident</p>
                                <p className="text-[11px] text-[#6b6b8a]">{svc.last_incident ? fmtRelative(svc.last_incident) : "Jamais"}</p>
                              </div>
                            </div>
                            {svc.cpu_pct > 0 && (
                              <div className="grid grid-cols-2 gap-3 mt-2">
                                <div>
                                  <p className="text-[10px] text-[#6b6b8a] mb-1 flex items-center gap-1"><Cpu className="w-2.5 h-2.5" />CPU</p>
                                  <ResourceBar value={svc.cpu_pct} color={cpuColor} />
                                </div>
                                <div>
                                  <p className="text-[10px] text-[#6b6b8a] mb-1 flex items-center gap-1"><HardDrive className="w-2.5 h-2.5" />RAM</p>
                                  <ResourceBar value={svc.ram_pct} color={ramColor} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* right panel – 2/5 */}
          <div className="col-span-2 flex flex-col gap-4">
            {/* uptime trend */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.49, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Uptime & Latence 7j
              </h3>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400" /><span className="text-[11px] text-[#6b6b8a]">Uptime %</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" /><span className="text-[11px] text-[#6b6b8a]">P95 ms</span></div>
              </div>
              <ResponsiveContainer width="100%" height={110}>
                <AreaChart data={data!.uptime_trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gUptime" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v.toFixed ? v.toFixed(1) : v} />
                  <Tooltip contentStyle={{ background: "#16161f", border: "1px solid #1e1e2e", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="uptime" stroke="#22c55e" strokeWidth={2} fill="url(#gUptime)" name="Uptime %" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* resources summary */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.56, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                Ressources globales
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] text-[#6b6b8a]">CPU moyen</span>
                    <span className="text-[12px] font-bold text-white">{data!.resource_summary.avg_cpu}%</span>
                  </div>
                  <ResourceBar value={data!.resource_summary.avg_cpu} color={data!.resource_summary.avg_cpu >= 70 ? "#ef4444" : "#22c55e"} />
                  <p className="text-[10px] text-[#4a4a6a] mt-1">Plus utilisé: {data!.resource_summary.max_cpu_service}</p>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] text-[#6b6b8a]">RAM moyenne</span>
                    <span className="text-[12px] font-bold text-white">{data!.resource_summary.avg_ram}%</span>
                  </div>
                  <ResourceBar value={data!.resource_summary.avg_ram} color={data!.resource_summary.avg_ram >= 70 ? "#ef4444" : "#8b5cf6"} />
                  <p className="text-[10px] text-[#4a4a6a] mt-1">Plus utilisé: {data!.resource_summary.max_ram_service}</p>
                </div>
              </div>
            </motion.div>

            {/* incident history */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.63, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                Historique incidents
              </h3>
              <div className="space-y-2.5">
                {data!.incidents.map((inc, i) => {
                  const sevCfg = INC_SEVERITY_CFG[inc.severity] ?? INC_SEVERITY_CFG.info
                  const stCfg  = INC_STATUS_CFG[inc.status] ?? INC_STATUS_CFG.resolved
                  return (
                    <motion.div key={inc.id}
                      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.65 + i * 0.06 }}
                      className={`p-3 rounded-xl border ${sevCfg.bg} ${sevCfg.border}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <sevCfg.Icon className={`w-3.5 h-3.5 ${sevCfg.color} shrink-0`} />
                        <span className="text-[12px] font-medium text-white flex-1 truncate">{inc.title}</span>
                        <span className={`text-[10px] font-semibold shrink-0 ${stCfg.color}`}>{stCfg.label}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[#6b6b8a]">
                        <span>{inc.service}</span>
                        <span>·</span>
                        <span>{fmtRelative(inc.started_at)}</span>
                        {inc.resolved_at && <><span>·</span><CheckCircle2 className="w-2.5 h-2.5 text-green-400" /></>}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
