"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Layers, ArrowLeft, RefreshCw, Plus, Search,
  Eye, Edit3, Archive, Globe, FileText, TrendingUp,
  CheckCircle2, Clock, AlertCircle, BarChart2, Star,
  ToggleLeft, ToggleRight, Download, Tag,
} from "lucide-react"
import Link from "next/link"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"

// ─── types ───────────────────────────────────────────────────────────────────
interface Page { id: string; title: string; slug: string; type: string; status: string; views_today: number; views_month: number; last_edited: string; author: string; seo_score: number }
interface Block { id: string; name: string; page: string; type: string; enabled: boolean; last_edited: string }
interface TypeDist { type: string; count: number; pct: number; color: string }
interface TopPage { title: string; views: number; seo: number }
interface TrendDay { day: string; views: number }
interface Kpi { published_count: number; draft_count: number; archived_count: number; total_views_today: number; avg_seo_score: number; blocks_active: number }
interface PageData { kpi: Kpi; pages: Page[]; blocks: Block[]; type_distribution: TypeDist[]; top_pages: TopPage[]; views_trend: TrendDay[] }

// ─── configs ─────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  published: { label:"Publié",   color:"text-green-300",  bg:"bg-green-500/15",  border:"border-green-500/30",  dot:"bg-green-400"  },
  draft:     { label:"Brouillon",color:"text-amber-300",  bg:"bg-amber-500/15",  border:"border-amber-500/30",  dot:"bg-amber-400"  },
  archived:  { label:"Archivé",  color:"text-[#6b6b8a]",  bg:"bg-[#1e1e2e]",     border:"border-[#1e1e2e]",     dot:"bg-[#6b6b8a]"  },
}
const TYPE_LABELS: Record<string, string> = {
  landing:"Landing", static:"Statique", legal:"Légal", promo:"Promo",
  faq:"FAQ", guide:"Guide", blog:"Blog", system:"Système",
}
const TYPE_COLORS: Record<string, string> = {
  landing:"#3b82f6", static:"#22c55e", legal:"#6b6b8a", promo:"#f97316",
  faq:"#8b5cf6", guide:"#eab308", blog:"#ec4899", system:"#6b6b8a",
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtRelative(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (m < 60) return `il y a ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}
function fmtNum(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + "k"
  return String(n)
}

function SeoBar({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : score > 0 ? "#ef4444" : "#6b6b8a"
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full" style={{ background: color }} />
      </div>
      <span className="text-[11px] font-semibold" style={{ color }}>{score > 0 ? score : "—"}</span>
    </div>
  )
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
  { label: string; value: number; sub?: string; subUp?: boolean; icon: typeof Layers; iconColor: string; delay: number; suffix?: string }) {
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
export default function CmsPage() {
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<"pages" | "blocks">("pages")
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [toggledBlocks, setToggledBlocks] = useState<Set<string>>(new Set())
  const [showNewPage, setShowNewPage] = useState(false)
  const [newPage, setNewPage] = useState({ title: "", slug: "", type: "static", status: "draft" })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  async function handleCreatePage(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch("/api/admin/cms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPage),
      })
      const json = await res.json()
      if (res.ok) {
        setShowNewPage(false)
        setNewPage({ title: "", slug: "", type: "static", status: "draft" })
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

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch("/api/admin/cms")
      if (!res.ok) throw new Error(`Erreur ${res.status} lors du chargement des pages`)
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
        <Layers className="w-10 h-10 text-blue-400" />
      </motion.div>
    </div>
  )

  if (error || !data) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <div className="bg-[#16161f] border border-red-500/30 rounded-2xl p-8 max-w-md w-full flex flex-col items-center text-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <h2 className="text-[15px] font-bold text-white">Impossible de charger le CMS</h2>
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
  const pages = data!.pages
  const blocks = data!.blocks

  const filtered = pages.filter(p => {
    const matchStatus = statusFilter === "all" || p.status === statusFilter
    const matchType   = typeFilter === "all" || p.type === typeFilter
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchType && matchSearch
  })

  const filterKey = `${statusFilter}-${typeFilter}-${search}-${activeTab}`

  function isBlockEnabled(block: Block) {
    return toggledBlocks.has(block.id) ? !block.enabled : block.enabled
  }

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
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white leading-none">CMS & Pages</h1>
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
              onClick={() => setShowNewPage(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[12px] font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Nouvelle page
            </motion.button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Publiées"        value={kpi.published_count}   sub="Pages en ligne"     subUp  icon={Globe}       iconColor="#22c55e" delay={0}    />
          <KpiCard label="Brouillons"      value={kpi.draft_count}       sub="En préparation"           icon={FileText}    iconColor="#f59e0b" delay={0.07} />
          <KpiCard label="Archivées"       value={kpi.archived_count}    sub="Hors ligne"               icon={Archive}     iconColor="#6b6b8a" delay={0.14} />
          <KpiCard label="Vues aujourd'hui" value={kpi.total_views_today} sub="Toutes pages"       subUp  icon={Eye}         iconColor="#3b82f6" delay={0.21} />
          <KpiCard label="Score SEO moyen" value={kpi.avg_seo_score}     sub="Pages publiées"     subUp  icon={Star}        iconColor="#f97316" suffix="%" delay={0.28} />
          <KpiCard label="Blocs actifs"    value={kpi.blocks_active}     sub="Composants live"    subUp  icon={Layers}      iconColor="#8b5cf6" delay={0.35} />
        </div>

        {/* main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* pages / blocks list – 3/5 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="col-span-3 bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
          >
            {/* tabs + filters */}
            <div className="p-4 border-b border-[#1e1e2e] space-y-3">
              <div className="flex items-center gap-2">
                {(["pages","blocks"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${activeTab === tab ? "bg-blue-600 text-white" : "text-[#6b6b8a] hover:text-white hover:bg-[#1e1e2e]"}`}>
                    {tab === "pages" ? `Pages (${pages.length})` : `Blocs (${blocks.length})`}
                  </button>
                ))}
              </div>
              {activeTab === "pages" && (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b6b8a]" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Rechercher par titre ou slug..."
                      className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-9 pr-4 py-2 text-[13px] text-white placeholder-[#6b6b8a] outline-none focus:border-blue-500/50" />
                  </div>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2 text-[12px] text-white outline-none">
                    <option value="all">Tous statuts</option>
                    <option value="published">Publié</option>
                    <option value="draft">Brouillon</option>
                    <option value="archived">Archivé</option>
                  </select>
                  <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                    className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2 text-[12px] text-white outline-none">
                    <option value="all">Tous types</option>
                    {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 520 }}>
              <AnimatePresence mode="wait">
                <motion.div key={filterKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {activeTab === "pages" ? (
                    filtered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 text-[#6b6b8a]">
                        <FileText className="w-10 h-10 mb-3 opacity-30" />
                        <p className="text-sm">Aucune page trouvée</p>
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#1e1e2e]">
                            <th className="text-left text-[11px] text-[#6b6b8a] font-medium px-4 py-2.5">Page</th>
                            <th className="text-center text-[11px] text-[#6b6b8a] font-medium px-2 py-2.5">Statut</th>
                            <th className="text-right text-[11px] text-[#6b6b8a] font-medium px-2 py-2.5">Vues/j</th>
                            <th className="text-right text-[11px] text-[#6b6b8a] font-medium px-4 py-2.5">SEO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((page, i) => {
                            const cfg = STATUS_CFG[page.status] ?? STATUS_CFG.archived
                            const typeColor = TYPE_COLORS[page.type] ?? "#6b6b8a"
                            return (
                              <motion.tr key={page.id}
                                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                                className="border-b border-[#1e1e2e] last:border-0 hover:bg-[#1e1e2e]/40 transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[13px] font-semibold text-white">{page.title}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-[#4a4a6a] font-mono">{page.slug}</span>
                                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: `${typeColor}20`, color: typeColor }}>
                                        {TYPE_LABELS[page.type] ?? page.type}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-[#4a4a6a]">{page.author} · {fmtRelative(page.last_edited)}</span>
                                  </div>
                                </td>
                                <td className="px-2 py-3 text-center">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                    <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />{cfg.label}
                                  </span>
                                </td>
                                <td className="px-2 py-3 text-right">
                                  <span className="text-[13px] font-semibold text-white">{fmtNum(page.views_today)}</span>
                                </td>
                                <td className="px-4 py-3">
                                  <SeoBar score={page.seo_score} />
                                </td>
                              </motion.tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )
                  ) : (
                    <div className="divide-y divide-[#1e1e2e]">
                      {blocks.map((block, i) => {
                        const enabled = isBlockEnabled(block)
                        return (
                          <motion.div key={block.id}
                            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: Math.min(i * 0.06, 0.4) }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[#1e1e2e]/40 transition-colors"
                          >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${enabled ? "bg-blue-500/15" : "bg-[#1e1e2e]"}`}>
                              <Layers className={`w-4 h-4 ${enabled ? "text-blue-400" : "text-[#6b6b8a]"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-white">{block.name}</p>
                              <p className="text-[11px] text-[#6b6b8a]">{block.page} · {fmtRelative(block.last_edited)}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${enabled ? "bg-green-500/20 text-green-400" : "bg-[#1e1e2e] text-[#6b6b8a]"}`}>
                              {block.type}
                            </span>
                            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                              onClick={() => setToggledBlocks(prev => {
                                const next = new Set(prev)
                                next.has(block.id) ? next.delete(block.id) : next.add(block.id)
                                return next
                              })}
                              aria-label={enabled ? "Désactiver le bloc" : "Activer le bloc"}
                              className="shrink-0">
                              {enabled
                                ? <ToggleRight className="w-6 h-6 text-green-400" />
                                : <ToggleLeft className="w-6 h-6 text-[#6b6b8a]" />}
                            </motion.button>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* right panel – 2/5 */}
          <div className="col-span-2 flex flex-col gap-4">
            {/* top pages */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.49, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                Top pages du jour
              </h3>
              <div className="space-y-2.5">
                {data!.top_pages.map((p, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[#4a4a6a] font-bold w-4">{i + 1}.</span>
                        <span className="text-[12px] text-white">{p.title}</span>
                      </div>
                      <span className="text-[12px] font-bold text-white">{fmtNum(p.views)}</span>
                    </div>
                    <div className="h-1 bg-[#1e1e2e] rounded-full overflow-hidden ml-6">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(p.views / data!.top_pages[0].views) * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.55 + i * 0.08 }}
                        className={`h-full rounded-full ${i === 0 ? "bg-blue-500" : i === 1 ? "bg-blue-400" : "bg-[#4a4a6a]"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* views trend */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.56, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Vues 7 derniers jours
              </h3>
              <ResponsiveContainer width="100%" height={110}>
                <AreaChart data={data!.views_trend} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1000 ? (v/1000).toFixed(0)+"k" : String(v)} />
                  <Tooltip contentStyle={{ background: "#16161f", border: "1px solid #1e1e2e", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} fill="url(#gViews)" name="Vues" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* type distribution */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.63, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-purple-400" />
                Types de pages
              </h3>
              <div className="space-y-2">
                {data!.type_distribution.sort((a, b) => b.count - a.count).map((t, i) => (
                  <div key={t.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-[#6b6b8a]">{TYPE_LABELS[t.type] ?? t.type}</span>
                      <span className="text-[12px] font-semibold text-white">{t.count}</span>
                    </div>
                    <div className="h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${t.pct}%` }}
                        transition={{ duration: 0.7, delay: 0.68 + i * 0.08 }}
                        className="h-full rounded-full" style={{ background: t.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      </div>

      {/* New Page Modal */}
      {showNewPage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-[15px] font-bold text-white mb-4">Nouvelle page CMS</h3>
            <form onSubmit={handleCreatePage} className="space-y-4">
              {createError && (
                <p className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">{createError}</p>
              )}
              <div>
                <label className="block text-[12px] text-[#6b6b8a] mb-1.5">Titre *</label>
                <input value={newPage.title} required
                  onChange={(e) => {
                    const title = e.target.value
                    setNewPage((p) => ({
                      ...p, title,
                      slug: p.slug === "" || p.slug === slugify(p.title) ? slugify(title) : p.slug,
                    }))
                  }}
                  placeholder="Ex: Conditions générales"
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] text-white text-[13px] focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-[12px] text-[#6b6b8a] mb-1.5">Slug *</label>
                <input value={newPage.slug} required
                  onChange={(e) => setNewPage((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="conditions-generales"
                  className="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] text-white text-[13px] font-mono focus:outline-none focus:border-blue-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] text-[#6b6b8a] mb-1.5">Type</label>
                  <select value={newPage.type}
                    onChange={(e) => setNewPage((p) => ({ ...p, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] text-white text-[13px] focus:outline-none">
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] text-[#6b6b8a] mb-1.5">Statut</label>
                  <select value={newPage.status}
                    onChange={(e) => setNewPage((p) => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-[#0a0a0f] border border-[#1e1e2e] text-white text-[13px] focus:outline-none">
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowNewPage(false)}
                  className="flex-1 py-2 rounded-xl border border-[#1e1e2e] text-[#6b6b8a] hover:text-white text-[13px] transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-[13px] font-medium transition-colors">
                  {creating ? "Création…" : "Créer la page"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}
