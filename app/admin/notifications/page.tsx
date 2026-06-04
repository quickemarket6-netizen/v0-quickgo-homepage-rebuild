"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell, ArrowLeft, RefreshCw, Download, Search,
  CheckCircle2, AlertCircle, Info, AlertTriangle, Flame,
  Mail, MessageSquare, Smartphone, TrendingUp, TrendingDown,
  Send, Megaphone, Users, Eye, MousePointer, Clock, Star,
} from "lucide-react"
import Link from "next/link"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"

// ─── types ───────────────────────────────────────────────────────────────────
interface Notification {
  id: string; type: string; channel: string; title: string; body: string
  recipient: string; read: boolean; sent_at: string; priority: string
}
interface Campaign {
  id: string; name: string; type: string; status: string
  recipients: number; opened: number; clicked: number; sent_at: string; open_rate: number
}
interface ChanDist { channel: string; count: number; pct: number; color: string }
interface TrendDay { day: string; push: number; email: number; sms: number }
interface Kpi { unread_count: number; urgent_count: number; sent_today: number; campaigns_active: number; avg_open_rate: number; delivery_rate: number }
interface PageData { kpi: Kpi; notifications: Notification[]; campaigns: Campaign[]; channel_distribution: ChanDist[]; volume_trend: TrendDay[] }

// ─── configs ─────────────────────────────────────────────────────────────────
const TYPE_CFG: Record<string, { label: string; color: string; bg: string; border: string; Icon: typeof Bell }> = {
  alert:   { label:"Alerte",    color:"text-red-300",    bg:"bg-red-500/15",    border:"border-red-500/30",    Icon: AlertCircle  },
  warning: { label:"Avertis.",  color:"text-amber-300",  bg:"bg-amber-500/15",  border:"border-amber-500/30",  Icon: AlertTriangle},
  success: { label:"Succès",    color:"text-green-300",  bg:"bg-green-500/15",  border:"border-green-500/30",  Icon: CheckCircle2 },
  info:    { label:"Info",      color:"text-blue-300",   bg:"bg-blue-500/15",   border:"border-blue-500/30",   Icon: Info         },
}
const CHAN_CFG: Record<string, { label: string; Icon: typeof Bell; color: string }> = {
  push:  { label:"Push",  Icon: Smartphone,   color:"text-blue-400"   },
  email: { label:"Email", Icon: Mail,         color:"text-purple-400" },
  sms:   { label:"SMS",   Icon: MessageSquare,color:"text-green-400"  },
}
const CAMP_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label:"Actif",     color:"text-green-400",  bg:"bg-green-500/20"  },
  paused:    { label:"Pausé",     color:"text-amber-400",  bg:"bg-amber-500/20"  },
  completed: { label:"Terminé",   color:"text-[#6b6b8a]",  bg:"bg-[#1e1e2e]"     },
}
const CAMP_TYPE_CFG: Record<string, { Icon: typeof Bell; color: string }> = {
  push:  { Icon: Smartphone,   color:"text-blue-400"   },
  email: { Icon: Mail,         color:"text-purple-400" },
  sms:   { Icon: MessageSquare,color:"text-green-400"  },
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
function fmtNum(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k"
  return String(n)
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

// ─── sub-components ──────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, subUp, icon: Icon, iconColor, pulse, delay, decimals = 0, suffix = "" }:
  { label: string; value: number; sub?: string; subUp?: boolean; icon: typeof Bell; iconColor: string; pulse?: boolean; delay: number; decimals?: number; suffix?: string }) {
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

// ─── main page ───────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [typeFilter, setTypeFilter] = useState("all")
  const [chanFilter, setChanFilter] = useState("all")
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all")
  const [search, setSearch] = useState("")
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    const res = await fetch("/api/admin/notifications")
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
        <Bell className="w-10 h-10 text-blue-400" />
      </motion.div>
    </div>
  )

  const kpi = data!.kpi
  const allNotifs = data!.notifications

  const filtered = allNotifs.filter(n => {
    const matchType  = typeFilter === "all" || n.type === typeFilter
    const matchChan  = chanFilter === "all" || n.channel === chanFilter
    const isRead     = n.read || readIds.has(n.id)
    const matchRead  = readFilter === "all" || (readFilter === "unread" && !isRead) || (readFilter === "read" && isRead)
    const matchSearch= !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.body.toLowerCase().includes(search.toLowerCase())
    return matchType && matchChan && matchRead && matchSearch
  })

  const filterKey = `${typeFilter}-${chanFilter}-${readFilter}-${search}`
  const unreadCount = allNotifs.filter(n => !n.read && !readIds.has(n.id)).length

  function markRead(id: string) {
    setReadIds(prev => new Set([...prev, id]))
  }
  function markAllRead() {
    setReadIds(new Set(allNotifs.map(n => n.id)))
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
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[9px] font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white leading-none">Notifications</h1>
              <p className="text-[11px] text-[#6b6b8a] mt-0.5">
                Mis à jour {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={markAllRead}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600/20 border border-green-500/30 text-green-400 hover:bg-green-600/30 transition-colors text-[12px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tout marquer lu
              </motion.button>
            )}
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
              <Send className="w-3.5 h-3.5" />
              Envoyer
            </motion.button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Non lus"           value={kpi.unread_count}      sub="À traiter"                    subUp={false}  icon={Bell}         iconColor="#ef4444" pulse  delay={0}    />
          <KpiCard label="Urgents"           value={kpi.urgent_count}      sub="Priorité haute"               subUp={false}  icon={Flame}        iconColor="#f97316" pulse  delay={0.07} />
          <KpiCard label="Envoyés aujourd'hui" value={kpi.sent_today}      sub="Toutes plateformes"           subUp={true}   icon={Send}         iconColor="#3b82f6"        delay={0.14} />
          <KpiCard label="Campagnes actives"  value={kpi.campaigns_active}  sub="En diffusion"                subUp={true}   icon={Megaphone}    iconColor="#8b5cf6"        delay={0.21} />
          <KpiCard label="Taux d'ouverture"  value={kpi.avg_open_rate}     sub="Moyenne campagnes"            subUp={true}   icon={Eye}          iconColor="#22c55e" decimals={1} suffix="%" delay={0.28} />
          <KpiCard label="Taux de livraison" value={kpi.delivery_rate}     sub="Push + Email + SMS"           subUp={true}   icon={CheckCircle2} iconColor="#22c55e" decimals={1} suffix="%" delay={0.35} />
        </div>

        {/* main grid */}
        <div className="grid grid-cols-5 gap-6">
          {/* notification list – 3/5 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="col-span-3 bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
          >
            {/* filters */}
            <div className="p-4 border-b border-[#1e1e2e] space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b6b8a]" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher une notification..."
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white placeholder-[#6b6b8a] outline-none focus:border-blue-500/50" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* type filter */}
                {["all","alert","warning","success","info"].map(t => (
                  <button key={t} onClick={() => setTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all ${typeFilter === t ? "bg-blue-600 text-white" : "text-[#6b6b8a] hover:text-white hover:bg-[#1e1e2e]"}`}>
                    {t === "all" ? "Tous" : TYPE_CFG[t]?.label}
                  </button>
                ))}
                <div className="h-4 w-px bg-[#1e1e2e]" />
                {/* channel filter */}
                {["all","push","email","sms"].map(c => (
                  <button key={c} onClick={() => setChanFilter(c)}
                    className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all ${chanFilter === c ? "bg-purple-600 text-white" : "text-[#6b6b8a] hover:text-white hover:bg-[#1e1e2e]"}`}>
                    {c === "all" ? "Tous canaux" : CHAN_CFG[c]?.label}
                  </button>
                ))}
                <div className="h-4 w-px bg-[#1e1e2e]" />
                <button onClick={() => setReadFilter(readFilter === "unread" ? "all" : "unread")}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-medium transition-all ${readFilter === "unread" ? "bg-amber-600 text-white" : "text-[#6b6b8a] hover:text-white hover:bg-[#1e1e2e]"}`}>
                  Non lus
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 520 }}>
              <AnimatePresence mode="wait">
                <motion.div key={filterKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-[#6b6b8a]">
                      <Bell className="w-10 h-10 mb-3 opacity-30" />
                      <p className="text-sm">Aucune notification</p>
                    </div>
                  ) : filtered.map((notif, i) => {
                    const typeCfg = TYPE_CFG[notif.type] ?? TYPE_CFG.info
                    const chanCfg = CHAN_CFG[notif.channel] ?? CHAN_CFG.push
                    const isRead  = notif.read || readIds.has(notif.id)
                    return (
                      <motion.div key={notif.id}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-[#1e1e2e] last:border-0 transition-colors hover:bg-[#1e1e2e]/40 ${!isRead ? "bg-blue-500/5" : ""}`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${typeCfg.bg} border ${typeCfg.border}`}>
                          <typeCfg.Icon className={`w-4 h-4 ${typeCfg.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[13px] font-semibold ${isRead ? "text-[#aaaacc]" : "text-white"}`}>{notif.title}</span>
                            {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${chanCfg.color} bg-[#1e1e2e]`}>
                              <chanCfg.Icon className="w-2.5 h-2.5" />{chanCfg.label}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#6b6b8a] mt-0.5 line-clamp-2">{notif.body}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-[#4a4a6a]">{fmtRelative(notif.sent_at)}</span>
                            {notif.priority === "urgent" && <span className="text-[10px] text-red-400 font-bold flex items-center gap-0.5"><Flame className="w-2.5 h-2.5" />Urgent</span>}
                          </div>
                        </div>
                        {!isRead && (
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => markRead(notif.id)}
                            className="shrink-0 p-1.5 rounded-lg hover:bg-green-500/20 text-[#6b6b8a] hover:text-green-400 transition-colors mt-0.5">
                            <CheckCircle2 className="w-4 h-4" />
                          </motion.button>
                        )}
                      </motion.div>
                    )
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* right panel – 2/5 */}
          <div className="col-span-2 flex flex-col gap-4">
            {/* channel donut */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.49, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-400" />
                Canaux de diffusion
              </h3>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={100} height={100}>
                  <PieChart>
                    <Pie data={data!.channel_distribution} dataKey="count" cx="50%" cy="50%" innerRadius={30} outerRadius={48} strokeWidth={0}>
                      {data!.channel_distribution.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2.5">
                  {data!.channel_distribution.map((c, i) => (
                    <div key={c.channel}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] text-[#6b6b8a] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                          {CHAN_CFG[c.channel]?.label ?? c.channel}
                        </span>
                        <span className="text-[12px] font-semibold text-white">{c.count} <span className="text-[#4a4a6a]">({c.pct}%)</span></span>
                      </div>
                      <div className="h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${c.pct}%` }}
                          transition={{ duration: 0.7, delay: 0.55 + i * 0.1 }}
                          className="h-full rounded-full" style={{ background: c.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* volume trend */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.56, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Volume 7 jours
              </h3>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /><span className="text-[11px] text-[#6b6b8a]">Push</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" /><span className="text-[11px] text-[#6b6b8a]">Email</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400" /><span className="text-[11px] text-[#6b6b8a]">SMS</span></div>
              </div>
              <ResponsiveContainer width="100%" height={100}>
                <AreaChart data={data!.volume_trend} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gPush" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gEmail" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} /><stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} /></linearGradient>
                    <linearGradient id="gSms" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#16161f", border: "1px solid #1e1e2e", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="push"  stroke="#3b82f6" strokeWidth={2} fill="url(#gPush)"  name="Push" />
                  <Area type="monotone" dataKey="email" stroke="#8b5cf6" strokeWidth={2} fill="url(#gEmail)" name="Email" />
                  <Area type="monotone" dataKey="sms"   stroke="#22c55e" strokeWidth={2} fill="url(#gSms)"   name="SMS" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* campaigns */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.63, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-400" />
                Campagnes
              </h3>
              <div className="space-y-3">
                {data!.campaigns.map((camp, i) => {
                  const campCfg = CAMP_TYPE_CFG[camp.type] ?? CAMP_TYPE_CFG.push
                  const statCfg = CAMP_STATUS[camp.status] ?? CAMP_STATUS.completed
                  return (
                    <motion.div key={camp.id}
                      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.65 + i * 0.06 }}
                      className="p-3 bg-[#0a0a0f] rounded-xl"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <campCfg.Icon className={`w-3.5 h-3.5 ${campCfg.color}`} />
                          <span className="text-[12px] font-medium text-white truncate max-w-[130px]">{camp.name}</span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statCfg.bg} ${statCfg.color}`}>{statCfg.label}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#6b6b8a]">
                        <div className="flex items-center gap-1"><Users className="w-3 h-3" />{fmtNum(camp.recipients)}</div>
                        <div className="flex items-center gap-1"><Eye className="w-3 h-3" />{camp.open_rate}%</div>
                        <div className="flex items-center gap-1"><MousePointer className="w-3 h-3" />{fmtNum(camp.clicked)}</div>
                      </div>
                      <div className="mt-2 h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${camp.open_rate}%` }}
                          transition={{ duration: 0.8, delay: 0.7 + i * 0.1 }}
                          className={`h-full rounded-full ${camp.status === "active" ? "bg-green-500" : camp.status === "paused" ? "bg-amber-500" : "bg-[#6b6b8a]"}`} />
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
    </div>
  )
}
