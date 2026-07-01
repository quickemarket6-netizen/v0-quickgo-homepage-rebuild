"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plug, ArrowLeft, RefreshCw, Plus, Search,
  Copy, Eye, EyeOff, CheckCircle2, AlertCircle, Clock,
  TrendingUp, Zap, Globe, Shield, BarChart2, Webhook,
  RotateCcw, Activity,
} from "lucide-react"
import Link from "next/link"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"
import { toast } from "sonner"

// ─── types ───────────────────────────────────────────────────────────────────
interface ApiKey { id: string; name: string; service: string; status: string; created_at: string; last_used: string; requests_today: number; requests_month: number }
interface Webhook { id: string; url: string; event: string; status: string; last_triggered: string; success_rate: number }
interface ServiceUsage { name: string; requests: number }
interface TrendDay { day: string; requests: number }
interface Kpi { active_keys: number; revoked_keys: number; requests_today: number; requests_month: number; webhooks_active: number; avg_success_rate: number }
interface PageData { kpi: Kpi; api_keys: ApiKey[]; webhooks: Webhook[]; service_usage: ServiceUsage[]; requests_trend: TrendDay[] }

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k"
  return String(n)
}
function fmtRelative(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (m < 1) return "à l'instant"
  if (m < 60) return `il y a ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}
function maskKey(id: string) {
  return `qg_${id.toLowerCase().replace("-","")}_${"•".repeat(32)}`
}

const SERVICE_COLORS: Record<string, string> = {
  "Google Maps":"#22c55e", "Firebase":"#f97316", "QuickGo Vendors":"#3b82f6",
  "Orange Money":"#f97316","MTN Money":"#eab308","Wave":"#3b82f6","CinetPay":"#22c55e",
  "PayPal":"#8b5cf6","Twilio":"#ef4444","SendGrid":"#3b82f6","Sentry":"#8b5cf6",
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
  { label: string; value: number; sub?: string; subUp?: boolean; icon: typeof Plug; iconColor: string; delay: number; suffix?: string }) {
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
export default function ApiPage() {
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<"keys" | "webhooks">("keys")
  const [search, setSearch] = useState("")
  const [revealedKey, setRevealedKey] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [showNewKey, setShowNewKey] = useState(false)
  const [newKey, setNewKey] = useState({ name: "", service: "" })
  const [creating, setCreating] = useState(false)
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch("/api/admin/integrations")
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

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newKey),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setCreatedSecret(json.secret)
        setNewKey({ name: "", service: "" })
        load(true)
      } else {
        setCreateError(json.error ?? "Erreur lors de la création")
      }
    } catch {
      setCreateError("Erreur réseau")
    } finally {
      setCreating(false)
    }
  }

  function copyKey(id: string, value: string) {
    navigator.clipboard?.writeText(value)
    setCopiedKey(id)
    toast.success("Clé copiée")
    setTimeout(() => setCopiedKey(null), 2000)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
        <Plug className="w-10 h-10 text-cyan-400" />
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
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[13px] font-medium transition-colors">
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    </div>
  )

  const kpi = data!.kpi

  const filteredKeys = data!.api_keys.filter(k => {
    const matchStatus = statusFilter === "all" || k.status === statusFilter
    const matchSearch = !search || k.name.toLowerCase().includes(search.toLowerCase()) || k.service.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const filteredWebhooks = data!.webhooks.filter(w =>
    !search || w.url.toLowerCase().includes(search.toLowerCase()) || w.event.toLowerCase().includes(search.toLowerCase())
  )

  const filterKey = `${activeTab}-${statusFilter}-${search}`

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
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Plug className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white leading-none">API & Intégrations</h1>
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
              onClick={() => { setShowNewKey(true); setCreatedSecret(null) }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[12px] font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Nouvelle clé
            </motion.button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Clés actives"       value={kpi.active_keys}      sub="Intégrations live"  subUp icon={Shield}    iconColor="#22c55e" delay={0}    />
          <KpiCard label="Révoquées"           value={kpi.revoked_keys}     sub="Désactivées"              icon={AlertCircle} iconColor="#ef4444" delay={0.07} />
          <KpiCard label="Requêtes / jour"     value={kpi.requests_today}   sub="Toutes APIs"        subUp icon={Zap}        iconColor="#3b82f6" delay={0.14} />
          <KpiCard label="Requêtes / mois"     value={Math.round(kpi.requests_month / 1000)} sub="En milliers"   subUp icon={BarChart2}  iconColor="#8b5cf6" delay={0.21} suffix="k" />
          <KpiCard label="Webhooks actifs"     value={kpi.webhooks_active}  sub="En écoute"          subUp icon={Activity}   iconColor="#f97316" delay={0.28} />
          <KpiCard label="Taux de succès"      value={Math.round(kpi.avg_success_rate)} sub="Webhooks"       subUp icon={CheckCircle2}iconColor="#22c55e" delay={0.35} suffix="%" />
        </div>

        {/* main grid */}
        <div className="grid grid-cols-5 gap-6">
          {/* keys / webhooks – 3/5 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="col-span-3 bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-[#1e1e2e] space-y-3">
              <div className="flex items-center gap-2">
                {(["keys","webhooks"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${activeTab === tab ? "bg-cyan-600 text-white" : "text-[#6b6b8a] hover:text-white hover:bg-[#1e1e2e]"}`}>
                    {tab === "keys" ? `Clés API (${data!.api_keys.length})` : `Webhooks (${data!.webhooks.length})`}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b6b8a]" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-9 pr-4 py-2 text-[13px] text-white placeholder-[#6b6b8a] outline-none focus:border-cyan-500/50" />
                </div>
                {activeTab === "keys" && (
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2 text-[12px] text-white outline-none">
                    <option value="all">Tous statuts</option>
                    <option value="active">Active</option>
                    <option value="revoked">Révoquée</option>
                  </select>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 520 }}>
              <AnimatePresence mode="wait">
                <motion.div key={filterKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {activeTab === "keys" ? (
                    <div className="divide-y divide-[#1e1e2e]">
                      {filteredKeys.map((key, i) => {
                        const isRevealed = revealedKey === key.id
                        const isCopied   = copiedKey === key.id
                        const svcColor   = SERVICE_COLORS[key.service] ?? "#6b6b8a"
                        const keyValue   = isRevealed ? `qg_${key.id.toLowerCase()}_prod_••••••••••••••••` : maskKey(key.id)
                        return (
                          <motion.div key={key.id}
                            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            className={`px-4 py-4 hover:bg-[#1e1e2e]/40 transition-colors ${key.status === "revoked" ? "opacity-50" : ""}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${svcColor}20` }}>
                                <Plug className="w-4 h-4" style={{ color: svcColor }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[13px] font-bold text-white font-mono">{key.name}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${key.status === "active" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                    {key.status === "active" ? "Active" : "Révoquée"}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: `${svcColor}15`, color: svcColor }}>
                                    {key.service}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <code className={`text-[11px] font-mono ${isRevealed ? "text-green-400" : "text-[#4a4a6a]"} flex-1 truncate`}>
                                    {keyValue}
                                  </code>
                                  <button onClick={() => setRevealedKey(isRevealed ? null : key.id)}
                                    className="p-1 rounded-lg hover:bg-[#1e1e2e] text-[#6b6b8a] hover:text-white transition-colors">
                                    {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>
                                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => copyKey(key.id, keyValue)}
                                    className="p-1 rounded-lg hover:bg-[#1e1e2e] transition-colors">
                                    {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-[#6b6b8a]" />}
                                  </motion.button>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-[11px] text-[#6b6b8a]">
                                  <span>Utilisée {fmtRelative(key.last_used)}</span>
                                  <span className="text-[#4a4a6a]">•</span>
                                  <span>{fmtNum(key.requests_today)}/j</span>
                                  <span className="text-[#4a4a6a]">•</span>
                                  <span>{fmtNum(key.requests_month)}/mois</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="divide-y divide-[#1e1e2e]">
                      {filteredWebhooks.map((wh, i) => (
                        <motion.div key={wh.id}
                          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.06 }}
                          className="px-4 py-4 hover:bg-[#1e1e2e]/40 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${wh.status === "active" ? "bg-green-500/15" : "bg-[#1e1e2e]"}`}>
                              <Activity className={`w-4 h-4 ${wh.status === "active" ? "text-green-400" : "text-[#6b6b8a]"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${wh.status === "active" ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-400"}`}>
                                  {wh.event}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${wh.status === "active" ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"}`}>
                                  {wh.status === "active" ? "Actif" : "Pausé"}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#6b6b8a] font-mono truncate">{wh.url}</p>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[11px] text-[#6b6b8a]">Dernier: {fmtRelative(wh.last_triggered)}</span>
                                <div className="flex items-center gap-1.5">
                                  <div className="w-16 h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{ width: `${wh.success_rate}%`, background: wh.success_rate >= 95 ? "#22c55e" : wh.success_rate >= 85 ? "#f59e0b" : "#ef4444" }} />
                                  </div>
                                  <span className={`text-[11px] font-medium ${wh.success_rate >= 95 ? "text-green-400" : wh.success_rate >= 85 ? "text-amber-400" : "text-red-400"}`}>
                                    {wh.success_rate}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* right panel – 2/5 */}
          <div className="col-span-2 flex flex-col gap-4">
            {/* requests trend */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.49, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Requêtes 7 jours
              </h3>
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={data!.requests_trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gReq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => fmtNum(v)} />
                  <Tooltip contentStyle={{ background: "#16161f", border: "1px solid #1e1e2e", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [fmtNum(v), "Requêtes"]} />
                  <Area type="monotone" dataKey="requests" stroke="#22d3ee" strokeWidth={2} fill="url(#gReq)" name="Requêtes" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* service usage */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.56, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-purple-400" />
                Usage par service (auj.)
              </h3>
              <div className="space-y-2.5">
                {data!.service_usage.map((s, i) => {
                  const max = data!.service_usage[0].requests
                  const color = SERVICE_COLORS[s.name] ?? "#6b6b8a"
                  return (
                    <div key={s.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] text-[#6b6b8a]">{s.name}</span>
                        <span className="text-[12px] font-semibold text-white">{fmtNum(s.requests)}</span>
                      </div>
                      <div className="h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(s.requests / max) * 100}%` }}
                          transition={{ duration: 0.7, delay: 0.6 + i * 0.07 }}
                          className="h-full rounded-full" style={{ background: color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>

            {/* webhook health */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.63, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                Santé webhooks
              </h3>
              <div className="space-y-2.5">
                {data!.webhooks.map((wh, i) => (
                  <motion.div key={wh.id}
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.65 + i * 0.07 }}
                    className="flex items-center gap-3"
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${wh.status === "active" ? (wh.success_rate >= 95 ? "bg-green-400" : "bg-amber-400") : "bg-[#6b6b8a]"} ${wh.status === "active" ? "animate-pulse" : ""}`} />
                    <span className="flex-1 text-[11px] text-[#6b6b8a] font-mono truncate">{wh.event}</span>
                    <span className={`text-[11px] font-semibold ${wh.success_rate >= 95 ? "text-green-400" : wh.success_rate >= 85 ? "text-amber-400" : "text-red-400"}`}>
                      {wh.success_rate}%
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      </div>

      {/* New API Key Modal */}
      {showNewKey && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-6 max-w-md w-full">
            {createdSecret ? (
              <>
                <h3 className="text-[15px] font-bold text-white mb-2">Clé générée</h3>
                <p className="text-[12px] text-[#6b6b8a] mb-3">
                  Copiez ce secret maintenant — il ne sera plus jamais affiché.
                </p>
                <div className="p-3 rounded-xl bg-[#0a0a0f] border border-cyan-500/30 mb-4">
                  <code className="text-[12px] text-cyan-400 break-all">{createdSecret}</code>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { navigator.clipboard?.writeText(createdSecret) }}
                    className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-[13px] font-medium transition-colors">
                    Copier
                  </button>
                  <button onClick={() => { setShowNewKey(false); setCreatedSecret(null) }}
                    className="flex-1 py-2 rounded-xl border border-[#1e1e2e] text-[#6b6b8a] hover:text-white text-[13px] transition-colors">
                    Fermer
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-[15px] font-bold text-white mb-4">Nouvelle clé API</h3>
                <form onSubmit={handleCreateKey} className="space-y-4">
                  {createError && (
                    <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{createError}</p>
                  )}
                  <div>
                    <label className="block text-[12px] text-[#6b6b8a] mb-1.5">Nom de la clé *</label>
                    <input value={newKey.name} required
                      onChange={(e) => setNewKey((k) => ({ ...k, name: e.target.value }))}
                      placeholder="MON_SERVICE_PROD"
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] text-white text-[13px] font-mono focus:outline-none focus:border-cyan-500/50" />
                  </div>
                  <div>
                    <label className="block text-[12px] text-[#6b6b8a] mb-1.5">Service *</label>
                    <input value={newKey.service} required
                      onChange={(e) => setNewKey((k) => ({ ...k, service: e.target.value }))}
                      placeholder="Ex: Orange Money"
                      className="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] text-white text-[13px] focus:outline-none focus:border-cyan-500/50" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowNewKey(false)}
                      className="flex-1 py-2 rounded-xl border border-[#1e1e2e] text-[#6b6b8a] hover:text-white text-[13px] transition-colors">
                      Annuler
                    </button>
                    <button type="submit" disabled={creating}
                      className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-[13px] font-medium transition-colors">
                      {creating ? "Génération…" : "Générer la clé"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
