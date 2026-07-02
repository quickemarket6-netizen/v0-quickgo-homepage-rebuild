"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MessageCircle, ArrowLeft, RefreshCw, Download, Search, ChevronRight, AlertTriangle, Clock, CheckCircle2,
  User, Store, Truck, TrendingUp, TrendingDown, Circle,
  AlertCircle, Flame, ShieldAlert, Tag, Send,
  MoreVertical, UserCheck } from "lucide-react"
import Link from "next/link"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell } from "recharts"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"

// ─── types ───────────────────────────────────────────────────────────────────
interface Ticket {
  id: string; subject: string; category: string; priority: string
  status: string; customer_name: string; customer_type: string
  assigned_to: string | null; created_at: string; updated_at: string; messages: number
}
interface Agent { id: string; name: string; avatar: string; online: boolean; tickets_open: number; tickets_resolved_today: number; avg_response_min: number }
interface CatDist { category: string; count: number; pct: number; color: string }
interface StatusDist { status: string; count: number; color: string }
interface TrendDay { day: string; opened: number; resolved: number }
interface Kpi { open_tickets: number; urgent_count: number; escalated_count: number; resolved_today: number; avg_response_min: number; satisfaction_rate: number; yesterday_open: number }
interface PageData { kpi: Kpi; tickets: Ticket[]; agents: Agent[]; category_distribution: CatDist[]; status_distribution: StatusDist[]; volume_trend: TrendDay[] }

// ─── configs ─────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string; pulse: boolean; Icon: typeof Circle }> = {
  open:        { label:"Ouvert",    color:"text-red-300",    bg:"bg-red-500/15",    border:"border-red-500/30",    dot:"bg-red-400",    pulse:true,  Icon: AlertCircle  },
  in_progress: { label:"En cours",  color:"text-amber-300",  bg:"bg-amber-500/15",  border:"border-amber-500/30",  dot:"bg-amber-400",  pulse:true,  Icon: Clock        },
  escalated:   { label:"Escaladé",  color:"text-purple-300", bg:"bg-purple-500/15", border:"border-purple-500/30", dot:"bg-purple-400", pulse:true,  Icon: ShieldAlert  },
  resolved:    { label:"Résolu",    color:"text-green-300",  bg:"bg-green-500/15",  border:"border-green-500/30",  dot:"bg-green-400",  pulse:false, Icon: CheckCircle2 },
  closed:      { label:"Fermé",     color:"text-[#6b6b8a]",  bg:"bg-[#1e1e2e]",     border:"border-[#1e1e2e]",     dot:"bg-[#6b6b8a]",  pulse:false, Icon: CheckCircle2 },
}
const PRIORITY_CFG: Record<string, { label: string; color: string; bg: string; Icon: typeof Flame }> = {
  urgent: { label:"Urgent", color:"text-red-400",    bg:"bg-red-500/20",    Icon: Flame        },
  high:   { label:"Haute",  color:"text-orange-400", bg:"bg-orange-500/20", Icon: AlertTriangle},
  normal: { label:"Normal", color:"text-blue-400",   bg:"bg-blue-500/20",   Icon: Circle       },
  low:    { label:"Basse",  color:"text-[#6b6b8a]",  bg:"bg-[#1e1e2e]",     Icon: Circle       },
}
const CAT_LABELS: Record<string, string> = {
  livraison:"Livraison", paiement:"Paiement", technique:"Technique",
  commande:"Commande", plainte:"Plainte", compte:"Compte",
}
const CUST_CFG: Record<string, { Icon: typeof User; color: string }> = {
  client: { Icon: User,  color:"text-cyan-400"   },
  vendor: { Icon: Store, color:"text-blue-400"   },
  driver: { Icon: Truck, color:"text-purple-400" },
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

function CountUp({ target, duration = 800, decimals = 0 }: { target: number; duration?: number; decimals?: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const steps = 40
    let i = 0
    const iv = setInterval(() => {
      i++
      setVal(Math.round((target * i / steps) * 10 ** decimals) / 10 ** decimals)
      if (i >= steps) clearInterval(iv)
    }, duration / steps)
    return () => clearInterval(iv)
  }, [target, duration, decimals])
  return <>{decimals > 0 ? val.toFixed(decimals) : val}</>
}

// ─── sub-components ──────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, subUp, icon: Icon, iconColor, pulse, delay, decimals = 0, suffix = "" }:
  { label: string; value: number; sub?: string; subUp?: boolean; icon: typeof MessageCircle; iconColor: string; pulse?: boolean; delay: number; decimals?: number; suffix?: string }) {
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
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}20` }}>
            <Icon className="w-5 h-5" style={{ color: iconColor }} />
          </div>
          {pulse && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />}
          {pulse && <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500" />}
        </div>
      </div>
      {sub && (
        <div className={`flex items-center gap-1 text-[12px] font-medium ${subUp === false ? "text-red-400" : "text-green-400"}`}>
          {subUp === false ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
          {sub}
        </div>
      )}
    </motion.div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.closed
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""}`} />
      {cfg.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const cfg = PRIORITY_CFG[priority] ?? PRIORITY_CFG.low
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.color}`}>
      <cfg.Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────
export default function SupportPage() {
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [catFilter, setCatFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [lastUpdated, setLastUpdated] = useState(new Date())

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch("/api/admin/support")
      if (!res.ok) throw new Error(`Erreur ${res.status} lors du chargement des tickets`)
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
      <div className="flex flex-col items-center gap-4">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
          <MessageCircle className="w-10 h-10 text-blue-400" />
        </motion.div>
        <AnimatePresence mode="wait">
          {[0,1,2].map(i => (
            <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, delay: i * 0.4, repeat: Infinity }}
              className="text-[#6b6b8a] text-sm absolute" style={{ top: `calc(50% + ${40 + i * 20}px)` }}>
              {["Chargement des tickets...", "Analyse des priorités...", "Préparation du CRM..."][i]}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="bg-[#16161f] border border-red-500/30 rounded-2xl p-8 max-w-md w-full flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <h2 className="text-[15px] font-bold text-white">Impossible de charger le support</h2>
          <p className="text-[13px] text-[#6b6b8a] mt-1.5">{error ?? "Aucune donnée disponible"}</p>
        </div>
        <button onClick={() => { setLoading(true); load() }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-medium transition-colors">
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    </div>
  )

  const kpi = data!.kpi
  const tickets = data!.tickets

  const statusTabs = [
    { key: "all",         label: "Tous",       count: tickets.length },
    { key: "open",        label: "Ouverts",    count: tickets.filter(t => t.status === "open").length },
    { key: "in_progress", label: "En cours",   count: tickets.filter(t => t.status === "in_progress").length },
    { key: "escalated",   label: "Escaladés",  count: tickets.filter(t => t.status === "escalated").length },
    { key: "resolved",    label: "Résolus",    count: tickets.filter(t => ["resolved","closed"].includes(t.status)).length },
  ]

  const filtered = tickets.filter(t => {
    const matchStatus   = statusFilter === "all" || t.status === statusFilter || (statusFilter === "resolved" && t.status === "closed")
    const matchPriority = priorityFilter === "all" || t.priority === priorityFilter
    const matchCat      = catFilter === "all" || t.category === catFilter
    const matchSearch   = !search || t.subject.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()) || t.customer_name.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchPriority && matchCat && matchSearch
  })

  const filterKey = `${statusFilter}-${priorityFilter}-${catFilter}-${search}`

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <AdminSidebar />
      <div className="flex-1 overflow-auto text-white">
      {/* header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur border-b border-[#1e1e2e] px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" aria-label="Retour au tableau de bord" className="p-2 rounded-xl hover:bg-[#1e1e2e] transition-colors">
            <ArrowLeft className="w-4 h-4 text-[#6b6b8a]" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white leading-none">CRM & Support</h1>
              <p className="text-[11px] text-[#6b6b8a] mt-0.5">
                Mis à jour {lastUpdated.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" })}
              </p>
            </div>
            {kpi.urgent_count > 0 && (
              <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[11px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                {kpi.urgent_count} urgent{kpi.urgent_count > 1 ? "s" : ""}
              </motion.span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => load(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#16161f] border border-[#1e1e2e] text-[#6b6b8a] hover:text-white transition-colors text-[12px]">
              <motion.div animate={refreshing ? { rotate: 360 } : { rotate: 0 }}
                transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}>
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
        {/* KPI cards */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Tickets ouverts"    value={kpi.open_tickets}       sub={`+${kpi.open_tickets - kpi.yesterday_open} vs hier`}  subUp={false}  icon={MessageCircle}  iconColor="#ef4444" pulse   delay={0}    />
          <KpiCard label="Urgents"            value={kpi.urgent_count}       sub="Nécessitent une action"                                subUp={false}  icon={Flame}          iconColor="#f97316" pulse   delay={0.07} />
          <KpiCard label="Escaladés"          value={kpi.escalated_count}    sub="Vers management"                                       subUp={false}  icon={ShieldAlert}    iconColor="#8b5cf6"         delay={0.14} />
          <KpiCard label="Résolus aujourd'hui" value={kpi.resolved_today}    sub="Bonne performance"                                     subUp={true}   icon={CheckCircle2}   iconColor="#22c55e"         delay={0.21} />
          <KpiCard label="Temps de réponse"   value={kpi.avg_response_min}   sub="Délai moyen"                                                          icon={Clock}          iconColor="#3b82f6" decimals={1} suffix="min" delay={0.28} />
          <KpiCard label="Satisfaction"        value={kpi.satisfaction_rate}  sub="Score client"                                          subUp={true}   icon={UserCheck}      iconColor="#22c55e" suffix="%" delay={0.35} />
        </div>

        {/* main content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* ticket table – 3/5 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="col-span-3 bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
          >
            {/* filters */}
            <div className="p-4 border-b border-[#1e1e2e] space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b6b8a]" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher ticket, client..."
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white placeholder-[#6b6b8a] outline-none focus:border-blue-500/50" />
                </div>
                <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
                  className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-[12px] text-white outline-none focus:border-blue-500/50">
                  <option value="all">Toutes priorités</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">Haute</option>
                  <option value="normal">Normal</option>
                  <option value="low">Basse</option>
                </select>
                <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                  className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-[12px] text-white outline-none focus:border-blue-500/50">
                  <option value="all">Toutes catégories</option>
                  {Object.entries(CAT_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {/* status tabs */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {statusTabs.map(tab => (
                  <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all ${
                      statusFilter === tab.key ? "bg-blue-600 text-white" : "text-[#6b6b8a] hover:text-white hover:bg-[#1e1e2e]"
                    }`}>
                    {tab.label}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === tab.key ? "bg-white/20" : "bg-[#1e1e2e]"}`}>{tab.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* tickets list */}
            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 520 }}>
              <AnimatePresence mode="wait">
                <motion.div key={filterKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}>
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-[#6b6b8a]">
                      <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm">Aucun ticket trouvé</p>
                    </div>
                  ) : filtered.map((ticket, i) => {
                    const custCfg = CUST_CFG[ticket.customer_type] ?? CUST_CFG.client
                    const isExpanded = expandedRow === ticket.id
                    return (
                      <div key={ticket.id} className="border-b border-[#1e1e2e] last:border-0">
                        <motion.div
                          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
                          className="px-4 py-3 hover:bg-[#1e1e2e]/50 cursor-pointer transition-colors"
                          onClick={() => setExpandedRow(isExpanded ? null : ticket.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="shrink-0 mt-0.5">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${PRIORITY_CFG[ticket.priority]?.bg ?? "bg-[#1e1e2e]"}`}>
                                {(() => { const cfg = PRIORITY_CFG[ticket.priority]; return cfg ? <cfg.Icon className={`w-4 h-4 ${cfg.color}`} /> : null })()}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[13px] font-semibold text-white truncate">{ticket.subject}</span>
                                <span className="text-[10px] text-[#4a4a6a] font-mono shrink-0">{ticket.id}</span>
                              </div>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <div className={`flex items-center gap-1 text-[11px] ${custCfg.color}`}>
                                  <custCfg.Icon className="w-3 h-3" />
                                  {ticket.customer_name}
                                </div>
                                <span className="text-[#4a4a6a] text-[10px]">•</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-[#1e1e2e] text-[#6b6b8a]`}>{CAT_LABELS[ticket.category] ?? ticket.category}</span>
                                <span className="text-[#4a4a6a] text-[10px]">•</span>
                                <span className="text-[11px] text-[#6b6b8a]">{fmtRelative(ticket.updated_at)}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <StatusBadge status={ticket.status} />
                              <div className="flex items-center gap-1.5">
                                {ticket.assigned_to ? (
                                  <span className="text-[10px] text-[#6b6b8a] flex items-center gap-1"><UserCheck className="w-3 h-3" />{ticket.assigned_to}</span>
                                ) : (
                                  <span className="text-[10px] text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />Non assigné</span>
                                )}
                                <span className="flex items-center gap-0.5 text-[10px] text-[#6b6b8a]"><MessageCircle className="w-3 h-3" />{ticket.messages}</span>
                              </div>
                            </div>
                            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronRight className="w-4 h-4 text-[#6b6b8a] shrink-0" />
                            </motion.div>
                          </div>
                        </motion.div>

                        {/* expanded detail */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 ml-11 space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="bg-[#0a0a0f] rounded-xl p-3">
                                    <p className="text-[10px] text-[#6b6b8a] mb-1">Priorité</p>
                                    <PriorityBadge priority={ticket.priority} />
                                  </div>
                                  <div className="bg-[#0a0a0f] rounded-xl p-3">
                                    <p className="text-[10px] text-[#6b6b8a] mb-1">Créé</p>
                                    <p className="text-[12px] text-white font-medium">{fmtRelative(ticket.created_at)}</p>
                                  </div>
                                  <div className="bg-[#0a0a0f] rounded-xl p-3">
                                    <p className="text-[10px] text-[#6b6b8a] mb-1">Messages</p>
                                    <p className="text-[12px] text-white font-medium">{ticket.messages} échanges</p>
                                  </div>
                                </div>
                                {/* quick reply */}
                                <div className="flex items-center gap-2">
                                  <input
                                    value={replyText[ticket.id] ?? ""}
                                    onChange={e => setReplyText(prev => ({ ...prev, [ticket.id]: e.target.value }))}
                                    placeholder="Répondre au ticket..."
                                    className="flex-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2 text-[12px] text-white placeholder-[#6b6b8a] outline-none focus:border-blue-500/50"
                                  />
                                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    aria-label="Envoyer la réponse"
                                    className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors">
                                    <Send className="w-4 h-4" />
                                  </motion.button>
                                  {ticket.status === "open" || ticket.status === "in_progress" ? (
                                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                      className="px-3 py-2 rounded-xl bg-green-600/20 border border-green-500/30 text-green-400 text-[12px] font-medium hover:bg-green-600/30 transition-colors">
                                      Résoudre
                                    </motion.button>
                                  ) : null}
                                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                                    aria-label="Plus d'options"
                                    className="p-2 rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] text-[#6b6b8a] hover:text-white transition-colors">
                                    <MoreVertical className="w-4 h-4" />
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* right panel – 2/5 */}
          <div className="col-span-2 flex flex-col gap-4">
            {/* agents */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.49, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400" />
                Agents de support
              </h3>
              <div className="space-y-3">
                {data!.agents.map((agent, i) => (
                  <motion.div key={agent.id}
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.49 + i * 0.06 }}
                    className="flex items-center gap-3"
                  >
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-600/30 border border-[#1e1e2e] flex items-center justify-center">
                        <span className="text-[11px] font-bold text-white">{agent.avatar}</span>
                      </div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#16161f] ${agent.online ? "bg-green-400" : "bg-[#6b6b8a]"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-medium text-white">{agent.name}</span>
                        <span className="text-[11px] text-[#6b6b8a]">{agent.avg_response_min}min moy.</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-amber-400">{agent.tickets_open} ouverts</span>
                        <span className="text-[10px] text-[#4a4a6a]">•</span>
                        <span className="text-[11px] text-green-400">{agent.tickets_resolved_today} résolus</span>
                      </div>
                      <div className="mt-1.5 h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(100, (agent.tickets_resolved_today / 15) * 100)}%` }}
                          transition={{ duration: 0.8, delay: 0.6 + i * 0.1 }}
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* category distribution */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.56, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-400" />
                Catégories
              </h3>
              <div className="space-y-2.5">
                {data!.category_distribution.sort((a,b) => b.count - a.count).map((c, i) => (
                  <div key={c.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-[#6b6b8a]">{CAT_LABELS[c.category] ?? c.category}</span>
                      <span className="text-[12px] font-semibold text-white">{c.count} <span className="text-[#4a4a6a] font-normal">({c.pct}%)</span></span>
                    </div>
                    <div className="h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${c.pct}%` }}
                        transition={{ duration: 0.7, delay: 0.6 + i * 0.08 }}
                        className="h-full rounded-full" style={{ background: c.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* volume trend */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.63, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Tickets 7 derniers jours
              </h3>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="text-[11px] text-[#6b6b8a]">Ouverts</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400" /><span className="text-[11px] text-[#6b6b8a]">Résolus</span></div>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={data!.volume_trend} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradOpen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradRes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#16161f", border: "1px solid #1e1e2e", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="opened" stroke="#ef4444" strokeWidth={2} fill="url(#gradOpen)" name="Ouverts" />
                  <Area type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} fill="url(#gradRes)" name="Résolus" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>

        {/* bottom row: status donut */}
        <div className="grid grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
          >
            <h3 className="text-[13px] font-semibold text-white mb-4">Répartition des statuts</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={data!.status_distribution} dataKey="count" cx="50%" cy="50%" innerRadius={32} outerRadius={50} strokeWidth={0}>
                    {data!.status_distribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {data!.status_distribution.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="text-[11px] text-[#6b6b8a]">{s.status}</span>
                    </div>
                    <span className="text-[12px] font-semibold text-white">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.77, ease: [0.22, 1, 0.36, 1] }}
            className="col-span-2 bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
          >
            <h3 className="text-[13px] font-semibold text-white mb-4">Tickets urgents & escaladés</h3>
            <div className="space-y-2.5">
              {tickets.filter(t => t.priority === "urgent" || t.status === "escalated").map((t, i) => (
                <motion.div key={t.id}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.8 + i * 0.05 }}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${t.status === "escalated" ? "bg-purple-500/10 border-purple-500/20" : "bg-red-500/10 border-red-500/20"}`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.status === "escalated" ? "bg-purple-500/20" : "bg-red-500/20"}`}>
                    {t.status === "escalated" ? <ShieldAlert className="w-3.5 h-3.5 text-purple-400" /> : <Flame className="w-3.5 h-3.5 text-red-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-white truncate">{t.subject}</p>
                    <p className="text-[10px] text-[#6b6b8a]">{t.customer_name} · {t.id} · {fmtRelative(t.created_at)}</p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={t.status} />
                  </div>
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
