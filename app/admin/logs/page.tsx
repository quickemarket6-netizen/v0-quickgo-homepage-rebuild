"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText, ArrowLeft, RefreshCw, Download, Search,
  AlertCircle, AlertTriangle, Info, CheckCircle2,
  Server, Clock, TrendingUp, Filter, ChevronDown,
  Terminal, Wifi, Database,
} from "lucide-react"
import Link from "next/link"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts"

// ─── types ───────────────────────────────────────────────────────────────────
interface Log { id: string; level: string; service: string; message: string; ip: string; user: string; duration_ms: number; ts: string }
interface ServiceDist { service: string; count: number; pct: number; color: string }
interface LevelDist { level: string; count: number; color: string }
interface HourlyPoint { hour: string; errors: number; warns: number; infos: number }
interface Kpi { total_today: number; errors_count: number; warns_count: number; infos_count: number; avg_response_ms: number; services_count: number }
interface PageData { kpi: Kpi; logs: Log[]; service_distribution: ServiceDist[]; level_distribution: LevelDist[]; hourly_trend: HourlyPoint[] }

// ─── configs ─────────────────────────────────────────────────────────────────
const LEVEL_CFG: Record<string, { label: string; color: string; bg: string; border: string; textColor: string; Icon: typeof AlertCircle }> = {
  error: { label:"ERROR", color:"#ef4444", bg:"bg-red-500/15",   border:"border-red-500/30",   textColor:"text-red-400",   Icon: AlertCircle  },
  warn:  { label:"WARN",  color:"#f59e0b", bg:"bg-amber-500/15", border:"border-amber-500/30", textColor:"text-amber-400", Icon: AlertTriangle },
  info:  { label:"INFO",  color:"#3b82f6", bg:"bg-blue-500/15",  border:"border-blue-500/30",  textColor:"text-blue-400",  Icon: Info         },
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}
function fmtRelative(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (m < 1) return "maintenant"
  if (m < 60) return `il y a ${m}min`
  return `il y a ${Math.floor(m / 60)}h`
}
function fmtMs(ms: number) {
  if (ms >= 1000) return (ms / 1000).toFixed(1) + "s"
  return ms + "ms"
}

function CountUp({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const steps = 40; let i = 0
    const iv = setInterval(() => {
      i++; setVal(Math.round(target * i / steps))
      if (i >= steps) clearInterval(iv)
    }, 800 / steps)
    return () => clearInterval(iv)
  }, [target])
  return <>{val}</>
}

function KpiCard({ label, value, sub, subUp, icon: Icon, iconColor, delay, suffix = "", pulse = false }:
  { label: string; value: number; sub?: string; subUp?: boolean; icon: typeof FileText; iconColor: string; delay: number; suffix?: string; pulse?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-[#6b6b8a] uppercase tracking-wider font-medium">{label}</span>
          <span className="text-2xl font-bold text-white leading-none"><CountUp target={value} />{suffix}</span>
        </div>
        <div className="relative">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}20` }}>
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
          {pulse && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />}
          {pulse && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500" />}
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

// ─── main page ───────────────────────────────────────────────────────────────
export default function LogsPage() {
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [levelFilter, setLevelFilter] = useState("all")
  const [serviceFilter, setServiceFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [liveMode, setLiveMode] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const liveRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    const res = await fetch("/api/admin/logs")
    const json: PageData = await res.json()
    setData(json)
    setLastUpdated(new Date())
    if (isRefresh) setTimeout(() => setRefreshing(false), 600)
    else setLoading(false)
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    if (liveMode) {
      liveRef.current = setInterval(() => load(true), 5_000)
    } else {
      if (liveRef.current) clearInterval(liveRef.current)
    }
    return () => { if (liveRef.current) clearInterval(liveRef.current) }
  }, [liveMode])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
        <Terminal className="w-10 h-10 text-green-400" />
      </motion.div>
    </div>
  )

  const kpi = data!.kpi
  const services = [...new Set(data!.logs.map(l => l.service))].sort()

  const filtered = data!.logs.filter(l => {
    const matchLevel   = levelFilter === "all" || l.level === levelFilter
    const matchService = serviceFilter === "all" || l.service === serviceFilter
    const matchSearch  = !search || l.message.toLowerCase().includes(search.toLowerCase()) || l.service.toLowerCase().includes(search.toLowerCase()) || l.id.toLowerCase().includes(search.toLowerCase())
    return matchLevel && matchService && matchSearch
  })

  const filterKey = `${levelFilter}-${serviceFilter}-${search}`

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur border-b border-[#1e1e2e] px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-xl hover:bg-[#1e1e2e] transition-colors">
            <ArrowLeft className="w-4 h-4 text-[#6b6b8a]" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Terminal className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white leading-none">Logs système</h1>
              <p className="text-[11px] text-[#6b6b8a] mt-0.5">
                Mis à jour {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => setLiveMode(!liveMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-medium transition-all ${liveMode ? "bg-green-600/20 border-green-500/30 text-green-400" : "bg-[#16161f] border-[#1e1e2e] text-[#6b6b8a] hover:text-white"}`}>
              <span className={`w-2 h-2 rounded-full ${liveMode ? "bg-green-400 animate-pulse" : "bg-[#6b6b8a]"}`} />
              Live
            </motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => load(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#16161f] border border-[#1e1e2e] text-[#6b6b8a] hover:text-white transition-colors text-[12px]">
              <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}>
                <RefreshCw className="w-3.5 h-3.5" />
              </motion.div>
              Actualiser
            </motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-medium transition-colors">
              <Download className="w-3.5 h-3.5" />
              Exporter
            </motion.button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Total logs"      value={kpi.total_today}      sub="Dernières 8h"       icon={FileText}     iconColor="#3b82f6" delay={0}    />
          <KpiCard label="Erreurs"         value={kpi.errors_count}     sub="Critiques"          icon={AlertCircle}  iconColor="#ef4444" delay={0.07} pulse />
          <KpiCard label="Avertissements"  value={kpi.warns_count}      sub="À surveiller"       icon={AlertTriangle}iconColor="#f59e0b" delay={0.14} />
          <KpiCard label="Informatifs"     value={kpi.infos_count}      sub="Opérations normales"icon={Info}         iconColor="#3b82f6" delay={0.21} />
          <KpiCard label="Temps moy."     value={kpi.avg_response_ms}  sub="Réponse API"        icon={Clock}        iconColor="#8b5cf6" delay={0.28} suffix="ms" />
          <KpiCard label="Services"        value={kpi.services_count}   sub="Microservices"      icon={Server}       iconColor="#22c55e" delay={0.35} />
        </div>

        {/* main grid */}
        <div className="grid grid-cols-5 gap-6">
          {/* logs terminal – 3/5 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="col-span-3 bg-[#0d0d14] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
            style={{ fontFamily: "'Courier New', monospace" }}
          >
            {/* terminal header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-[#16161f] border-b border-[#1e1e2e]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <span className="text-[12px] text-[#6b6b8a] flex-1">quickgo-system-logs — bash</span>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6b6b8a]" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="grep..."
                    className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-green-400 placeholder-[#4a4a6a] outline-none focus:border-green-500/50 w-36" />
                </div>
                <select value={levelFilter} onChange={e => setLevelFilter(e.target.value)}
                  className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-2 py-1.5 text-[11px] text-white outline-none">
                  <option value="all">Tous</option>
                  <option value="error">ERROR</option>
                  <option value="warn">WARN</option>
                  <option value="info">INFO</option>
                </select>
                <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}
                  className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg px-2 py-1.5 text-[11px] text-white outline-none">
                  <option value="all">Tous services</option>
                  {services.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* log entries */}
            <div className="flex-1 overflow-y-auto p-3 space-y-0.5" style={{ maxHeight: 500 }}>
              <AnimatePresence mode="wait">
                <motion.div key={filterKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  {filtered.length === 0 ? (
                    <div className="flex items-center justify-center py-12 text-[#4a4a6a] text-[12px]">
                      No matching logs found.
                    </div>
                  ) : filtered.map((log, i) => {
                    const cfg = LEVEL_CFG[log.level] ?? LEVEL_CFG.info
                    return (
                      <motion.div key={log.id}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: i * 0.02 }}
                        className={`flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-[#16161f]/80 transition-colors group text-[11px]`}
                      >
                        <span className="text-[#4a4a6a] shrink-0 pt-0.5 w-20">{fmtTime(log.ts)}</span>
                        <span className={`shrink-0 font-bold px-1.5 py-0.5 rounded text-[10px] ${cfg.bg} ${cfg.textColor}`}>{cfg.label}</span>
                        <span className="text-[#8b5cf6] shrink-0">[{log.service}]</span>
                        <span className={`flex-1 ${log.level === "error" ? "text-red-300" : log.level === "warn" ? "text-amber-300" : "text-[#aaaacc]"} leading-relaxed`}>{log.message}</span>
                        <span className="shrink-0 text-[#4a4a6a] group-hover:text-[#6b6b8a] transition-colors">{fmtMs(log.duration_ms)}</span>
                      </motion.div>
                    )
                  })}
                  <div className="flex items-center gap-2 px-2 py-2 text-[11px] text-green-400">
                    <span className="animate-pulse">█</span>
                    <span className="text-[#4a4a6a]">Showing {filtered.length}/{data!.logs.length} entries</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* right panel – 2/5 */}
          <div className="col-span-2 flex flex-col gap-4">
            {/* hourly trend */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.49, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Volume par heure
              </h3>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="text-[11px] text-[#6b6b8a]">Erreurs</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="text-[11px] text-[#6b6b8a]">Warnings</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /><span className="text-[11px] text-[#6b6b8a]">Info</span></div>
              </div>
              <ResponsiveContainer width="100%" height={110}>
                <AreaChart data={data!.hourly_trend} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gErr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gWrn" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gInf" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="hour" tick={{ fill: "#6b6b8a", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b6b8a", fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#16161f", border: "1px solid #1e1e2e", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="infos"  stroke="#3b82f6" strokeWidth={1.5} fill="url(#gInf)" name="Info" />
                  <Area type="monotone" dataKey="warns"  stroke="#f59e0b" strokeWidth={1.5} fill="url(#gWrn)" name="Warnings" />
                  <Area type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={2}   fill="url(#gErr)" name="Erreurs" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* service distribution */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.56, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <Server className="w-4 h-4 text-purple-400" />
                Services
              </h3>
              <div className="space-y-2">
                {data!.service_distribution.map((s, i) => (
                  <div key={s.service}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-[#6b6b8a]">{s.service}</span>
                      <span className="text-[12px] font-semibold text-white">{s.count} <span className="text-[#4a4a6a]">({s.pct}%)</span></span>
                    </div>
                    <div className="h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }}
                        transition={{ duration: 0.7, delay: 0.6 + i * 0.07 }}
                        className="h-full rounded-full" style={{ background: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* level + recent errors */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.63, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400" />
                Erreurs récentes
              </h3>
              <div className="space-y-2.5">
                {data!.logs.filter(l => l.level === "error").slice(0, 4).map((log, i) => (
                  <motion.div key={log.id}
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.65 + i * 0.07 }}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-red-400 font-mono font-bold">[{log.service}]</span>
                      <span className="text-[10px] text-[#4a4a6a]">{fmtRelative(log.ts)}</span>
                    </div>
                    <p className="text-[11px] text-red-300 line-clamp-2">{log.message}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
