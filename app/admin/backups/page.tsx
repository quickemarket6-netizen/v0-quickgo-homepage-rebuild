"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Database, ArrowLeft, RefreshCw, Plus, Download,
  CheckCircle2, AlertCircle, Clock, HardDrive, Shield,
  TrendingUp, Archive, Play, Pause, RotateCcw, Zap,
  Lock, Cloud,
} from "lucide-react"
import Link from "next/link"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"

// ─── types ───────────────────────────────────────────────────────────────────
interface Backup { id: string; type: string; status: string; size_mb: number; duration_s: number; created_at: string; storage: string; compressed: boolean; encrypted: boolean }
interface Schedule { id: string; name: string; type: string; cron: string; next_run: string; enabled: boolean; storage: string; retention_days: number }
interface StorageDay { day: string; full: number; incremental: number; logs: number }
interface Kpi { total_backups: number; success_count: number; failed_count: number; total_storage_mb: number; last_full_size_mb: number; schedules_active: number; success_rate: number }
interface PageData { kpi: Kpi; backups: Backup[]; schedules: Schedule[]; storage_trend: StorageDay[] }

// ─── configs ─────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; Icon: typeof CheckCircle2 }> = {
  success: { label:"Succès", color:"text-green-300",  bg:"bg-green-500/15",  border:"border-green-500/30",  Icon: CheckCircle2 },
  failed:  { label:"Échoué", color:"text-red-300",    bg:"bg-red-500/15",    border:"border-red-500/30",    Icon: AlertCircle  },
  running: { label:"En cours",color:"text-blue-300",  bg:"bg-blue-500/15",   border:"border-blue-500/30",   Icon: Clock        },
}
const TYPE_CFG: Record<string, { label: string; color: string; Icon: typeof Archive }> = {
  full:        { label:"Complet",     color:"text-blue-400",   Icon: Database },
  incremental: { label:"Incrémental", color:"text-purple-400", Icon: Archive  },
  logs:        { label:"Logs",        color:"text-amber-400",  Icon: Clock    },
  media:       { label:"Médias",      color:"text-green-400",  Icon: Cloud    },
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtSize(mb: number) {
  if (mb >= 1024) return (mb / 1024).toFixed(2) + " GB"
  return mb + " MB"
}
function fmtRelative(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `il y a ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}
function fmtFuture(iso: string) {
  const m = Math.round((new Date(iso).getTime() - Date.now()) / 60_000)
  if (m < 60) return `dans ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `dans ${h}h`
  return `dans ${Math.floor(h / 24)}j`
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

function KpiCard({ label, value, sub, subUp, icon: Icon, iconColor, delay, suffix = "" }:
  { label: string; value: number; sub?: string; subUp?: boolean; icon: typeof Database; iconColor: string; delay: number; suffix?: string }) {
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
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}20` }}>
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
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
export default function BackupsPage() {
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [toggledSchedules, setToggledSchedules] = useState<Set<string>>(new Set())
  const [backingUp, setBackingUp] = useState(false)

  async function handleBackupNow() {
    if (backingUp) return
    setBackingUp(true)
    try {
      const res = await fetch("/api/admin/backups", { method: "POST" })
      if (res.ok) await load(true)
    } finally {
      setBackingUp(false)
    }
  }

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch("/api/admin/backups")
      if (!res.ok) {
        const err = await res.json().catch(() => null)
        throw new Error(err?.error ?? `Erreur ${res.status}`)
      }
      const json: PageData = await res.json()
      setData(json)
      setError(null)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement")
    } finally {
      if (isRefresh) setTimeout(() => setRefreshing(false), 600)
      else setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
        <Database className="w-10 h-10 text-blue-400" />
      </motion.div>
    </div>
  )

  if (!loading && (error || !data)) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="text-[16px] font-bold text-white mb-2">Impossible de charger les données</h2>
        <p className="text-[13px] text-[#6b6b8a] mb-6">{error ?? "Une erreur est survenue."}</p>
        <button onClick={() => load()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-medium transition-colors">
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    </div>
  )

  const kpi = data!.kpi

  const filtered = data!.backups.filter(b => {
    const matchType   = typeFilter === "all" || b.type === typeFilter
    const matchStatus = statusFilter === "all" || b.status === statusFilter
    return matchType && matchStatus
  })

  const filterKey = `${typeFilter}-${statusFilter}`

  function isScheduleEnabled(s: Schedule) {
    return toggledSchedules.has(s.id) ? !s.enabled : s.enabled
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <AdminSidebar />
      <div className="flex-1 overflow-auto text-white">
      {/* header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur border-b border-[#1e1e2e] px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-xl hover:bg-[#1e1e2e] transition-colors">
            <ArrowLeft className="w-4 h-4 text-[#6b6b8a]" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white leading-none">Sauvegardes</h1>
              <p className="text-[11px] text-[#6b6b8a] mt-0.5">
                Mis à jour {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => load(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#16161f] border border-[#1e1e2e] text-[#6b6b8a] hover:text-white transition-colors text-[12px]">
              <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}>
                <RefreshCw className="w-3.5 h-3.5" />
              </motion.div>
              Actualiser
            </motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={handleBackupNow} disabled={backingUp}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-[12px] font-medium transition-colors">
              <Zap className={`w-3.5 h-3.5 ${backingUp ? "animate-pulse" : ""}`} />
              {backingUp ? "Backup en cours…" : "Backup maintenant"}
            </motion.button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Total backups"    value={kpi.total_backups}     sub="Archivés"          icon={Database}    iconColor="#3b82f6" delay={0}    />
          <KpiCard label="Réussis"          value={kpi.success_count}     sub="Sans erreur"  subUp icon={CheckCircle2}iconColor="#22c55e" delay={0.07} />
          <KpiCard label="Échoués"          value={kpi.failed_count}      sub="À investiguer"     icon={AlertCircle} iconColor="#ef4444" delay={0.14} />
          <KpiCard label="Stockage total"   value={Math.round(kpi.total_storage_mb / 1024 * 10) / 10} sub="Go utilisés" subUp icon={HardDrive} iconColor="#8b5cf6" delay={0.21} suffix=" GB" />
          <KpiCard label="Planifications"   value={kpi.schedules_active}  sub="Actives"      subUp icon={Clock}      iconColor="#f97316" delay={0.28} />
          <KpiCard label="Taux de succès"   value={kpi.success_rate}      sub="Sur 30 jours" subUp icon={Shield}     iconColor="#22c55e" delay={0.35} suffix="%" />
        </div>

        {/* main grid */}
        <div className="grid grid-cols-5 gap-6">
          {/* backups list – 3/5 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="col-span-3 bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
          >
            {/* filters */}
            <div className="p-4 border-b border-[#1e1e2e] flex items-center gap-2 flex-wrap">
              {["all","full","incremental","logs"].map(t => (
                <button key={t} onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all ${typeFilter === t ? "bg-blue-600 text-white" : "text-[#6b6b8a] hover:text-white hover:bg-[#1e1e2e]"}`}>
                  {t === "all" ? "Tous" : TYPE_CFG[t]?.label}
                </button>
              ))}
              <div className="h-4 w-px bg-[#1e1e2e]" />
              {["all","success","failed"].map(s => (
                <button key={s} onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all ${statusFilter === s ? "bg-green-600 text-white" : "text-[#6b6b8a] hover:text-white hover:bg-[#1e1e2e]"}`}>
                  {s === "all" ? "Tous statuts" : STATUS_CFG[s]?.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 520 }}>
              <AnimatePresence mode="wait">
                <motion.div key={filterKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1e1e2e]">
                        <th className="text-left text-[11px] text-[#6b6b8a] font-medium px-4 py-2.5">ID & Type</th>
                        <th className="text-center text-[11px] text-[#6b6b8a] font-medium px-2 py-2.5">Statut</th>
                        <th className="text-right text-[11px] text-[#6b6b8a] font-medium px-2 py-2.5">Taille</th>
                        <th className="text-right text-[11px] text-[#6b6b8a] font-medium px-4 py-2.5">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((backup, i) => {
                        const sCfg = STATUS_CFG[backup.status] ?? STATUS_CFG.success
                        const tCfg = TYPE_CFG[backup.type] ?? TYPE_CFG.full
                        return (
                          <motion.tr key={backup.id}
                            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.25, delay: i * 0.04 }}
                            className="border-b border-[#1e1e2e] last:border-0 hover:bg-[#1e1e2e]/40 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <tCfg.Icon className={`w-4 h-4 shrink-0 ${tCfg.color}`} />
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-mono text-[#4a4a6a]">{backup.id}</span>
                                    <span className={`text-[10px] font-medium ${tCfg.color}`}>{tCfg.label}</span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-[#4a4a6a]">{backup.storage}</span>
                                    {backup.encrypted && <Lock className="w-2.5 h-2.5 text-green-400" />}
                                    {backup.compressed && <Archive className="w-2.5 h-2.5 text-blue-400" />}
                                    {backup.status === "success" && <span className="text-[10px] text-[#4a4a6a]">{backup.duration_s}s</span>}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${sCfg.bg} ${sCfg.color} ${sCfg.border}`}>
                                <sCfg.Icon className="w-3 h-3" />{sCfg.label}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-right">
                              <span className={`text-[12px] font-medium ${backup.size_mb > 0 ? "text-white" : "text-[#4a4a6a]"}`}>
                                {backup.size_mb > 0 ? fmtSize(backup.size_mb) : "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-[11px] text-[#6b6b8a]">{fmtRelative(backup.created_at)}</span>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* right panel – 2/5 */}
          <div className="col-span-2 flex flex-col gap-4">
            {/* schedules */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.49, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Planifications
              </h3>
              <div className="space-y-3">
                {data!.schedules.map((sched, i) => {
                  const enabled = isScheduleEnabled(sched)
                  const tCfg = TYPE_CFG[sched.type] ?? TYPE_CFG.full
                  return (
                    <motion.div key={sched.id}
                      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.52 + i * 0.07 }}
                      className={`p-3 rounded-xl border transition-colors ${enabled ? "bg-[#0a0a0f] border-[#1e1e2e]" : "bg-[#0a0a0f] border-[#1e1e2e] opacity-60"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <tCfg.Icon className={`w-3.5 h-3.5 ${tCfg.color}`} />
                        <span className="text-[12px] font-medium text-white flex-1">{sched.name}</span>
                        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setToggledSchedules(prev => {
                            const next = new Set(prev)
                            next.has(sched.id) ? next.delete(sched.id) : next.add(sched.id)
                            return next
                          })}
                          className={`p-1 rounded-lg transition-colors ${enabled ? "text-green-400 hover:bg-green-500/20" : "text-[#6b6b8a] hover:bg-[#1e1e2e]"}`}>
                          {enabled ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
                        </motion.button>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#6b6b8a]">
                        <code className="font-mono">{sched.cron}</code>
                        <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{fmtFuture(sched.next_run)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-[#4a4a6a]">
                        <span>{sched.storage}</span>
                        <span>·</span>
                        <span>Rétention {sched.retention_days}j</span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>

            {/* storage trend */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.56, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Stockage 7 jours (MB)
              </h3>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /><span className="text-[11px] text-[#6b6b8a]">Complet</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" /><span className="text-[11px] text-[#6b6b8a]">Incrémental</span></div>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={data!.storage_trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gFull" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gIncr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? (v/1000).toFixed(1)+"k" : String(v)} />
                  <Tooltip contentStyle={{ background: "#16161f", border: "1px solid #1e1e2e", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [fmtSize(v), ""]} />
                  <Area type="monotone" dataKey="full"        stroke="#3b82f6" strokeWidth={2} fill="url(#gFull)" name="Complet" />
                  <Area type="monotone" dataKey="incremental" stroke="#8b5cf6" strokeWidth={2} fill="url(#gIncr)" name="Incrémental" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* restore button */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.63, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-3 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" />
                Restauration
              </h3>
              <p className="text-[12px] text-[#6b6b8a] mb-4">Dernier backup complet: <span className="text-white font-medium">{data!.backups.find(b => b.type === "full" && b.status === "success") ? fmtRelative(data!.backups.find(b => b.type === "full" && b.status === "success")!.created_at) : "—"}</span></p>
              <div className="space-y-2">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-amber-600/20 border border-amber-500/30 text-amber-400 text-[13px] font-medium hover:bg-amber-600/30 transition-colors">
                  <RotateCcw className="w-4 h-4" />
                  Restaurer dernier backup
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] text-[#6b6b8a] text-[13px] font-medium hover:text-white transition-colors">
                  <Download className="w-4 h-4" />
                  Télécharger backup
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
