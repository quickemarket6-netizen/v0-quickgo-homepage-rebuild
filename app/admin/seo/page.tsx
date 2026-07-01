"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Globe, ArrowLeft, RefreshCw, Search, TrendingUp, TrendingDown,
  ArrowUp, ArrowDown, Minus, Eye, MousePointer, BarChart2,
  CheckCircle2, AlertCircle, ExternalLink, Star, Link2,
} from "lucide-react"
import Link from "next/link"
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, Line,
} from "recharts"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"

// ─── types ───────────────────────────────────────────────────────────────────
interface Keyword { id: string; keyword: string; position: number; prev_position: number; volume: number; difficulty: number; ctr: number; impressions: number; clicks: number }
interface SeoPage { url: string; title: string; score: number; issues: number; index_status: string; backlinks: number; organic_clicks: number }
interface TrendPoint { month: string; clicks: number; impressions: number }
interface Kpi { total_clicks: number; total_impressions: number; avg_position: number; avg_ctr: number; keywords_improved: number; pages_indexed: number; total_keywords: number }
interface PageData { kpi: Kpi; keywords: Keyword[]; pages: SeoPage[]; performance_trend: TrendPoint[] }

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k"
  return String(n)
}
function diffColor(pos: number, prev: number) {
  if (pos < prev) return "text-green-400"
  if (pos > prev) return "text-red-400"
  return "text-[#6b6b8a]"
}
function diffIcon(pos: number, prev: number) {
  if (pos < prev) return <ArrowUp className="w-3 h-3" />
  if (pos > prev) return <ArrowDown className="w-3 h-3" />
  return <Minus className="w-3 h-3" />
}
function seoColor(score: number) {
  if (score >= 80) return "#22c55e"
  if (score >= 60) return "#f59e0b"
  if (score > 0)   return "#ef4444"
  return "#6b6b8a"
}
function diffColor2(score: number) {
  if (score >= 80) return "bg-green-500"
  if (score >= 60) return "bg-amber-500"
  return "bg-red-500"
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

function KpiCard({ label, value, sub, subUp, icon: Icon, iconColor, delay, decimals = 0, suffix = "" }:
  { label: string; value: number; sub?: string; subUp?: boolean; icon: typeof Globe; iconColor: string; delay: number; decimals?: number; suffix?: string }) {
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
export default function SeoPage() {
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<"keywords" | "pages">("keywords")
  const [sortBy, setSortBy] = useState<"position" | "volume" | "clicks" | "ctr">("position")
  const [search, setSearch] = useState("")
  const [lastUpdated, setLastUpdated] = useState(new Date())

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch("/api/admin/seo")
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
        <Globe className="w-10 h-10 text-green-400" />
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
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-[13px] font-medium transition-colors">
          <RefreshCw className="w-4 h-4" />
          Réessayer
        </button>
      </div>
    </div>
  )

  const kpi = data!.kpi
  const keywords = [...data!.keywords]
    .filter(k => !search || k.keyword.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "position") return a.position - b.position
      if (sortBy === "volume")   return b.volume - a.volume
      if (sortBy === "clicks")   return b.clicks - a.clicks
      return b.ctr - a.ctr
    })

  const filterKey = `${activeTab}-${sortBy}-${search}`

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
            <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white leading-none">SEO Center</h1>
              <p className="text-[11px] text-[#6b6b8a] mt-0.5">
                Mis à jour {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
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
          <KpiCard label="Clics organiques"  value={kpi.total_clicks}      sub="Ce mois"          subUp icon={MousePointer} iconColor="#3b82f6" delay={0}    />
          <KpiCard label="Impressions"        value={kpi.total_impressions}  sub="Recherches Google" subUp icon={Eye}          iconColor="#8b5cf6" delay={0.07} />
          <KpiCard label="Position moyenne"   value={kpi.avg_position}       sub="Mots-clés suivis"       icon={BarChart2}    iconColor="#f97316" delay={0.14} decimals={1} />
          <KpiCard label="CTR moyen"          value={kpi.avg_ctr}            sub="Taux de clic"     subUp icon={TrendingUp}  iconColor="#22c55e" delay={0.21} decimals={1} suffix="%" />
          <KpiCard label="Mots-clés améliorés" value={kpi.keywords_improved} sub={`sur ${kpi.total_keywords} suivis`} subUp icon={ArrowUp} iconColor="#22c55e" delay={0.28} />
          <KpiCard label="Pages indexées"     value={kpi.pages_indexed}      sub="Google Search"    subUp icon={CheckCircle2} iconColor="#22c55e" delay={0.35} />
        </div>

        {/* main grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {/* keywords / pages table – 3/5 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="col-span-3 bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
          >
            <div className="p-4 border-b border-[#1e1e2e] space-y-3">
              <div className="flex items-center gap-2">
                {(["keywords","pages"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${activeTab === tab ? "bg-green-600 text-white" : "text-[#6b6b8a] hover:text-white hover:bg-[#1e1e2e]"}`}>
                    {tab === "keywords" ? `Mots-clés (${data!.keywords.length})` : `Pages (${data!.pages.length})`}
                  </button>
                ))}
              </div>
              {activeTab === "keywords" && (
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b6b8a]" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Rechercher un mot-clé..."
                      className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-9 pr-4 py-2 text-[13px] text-white placeholder-[#6b6b8a] outline-none focus:border-green-500/50" />
                  </div>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
                    className="bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2 text-[12px] text-white outline-none">
                    <option value="position">Par position</option>
                    <option value="volume">Par volume</option>
                    <option value="clicks">Par clics</option>
                    <option value="ctr">Par CTR</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 520 }}>
              <AnimatePresence mode="wait">
                <motion.div key={filterKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {activeTab === "keywords" ? (
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#1e1e2e]">
                          <th className="text-left text-[11px] text-[#6b6b8a] font-medium px-4 py-2.5">Mot-clé</th>
                          <th className="text-center text-[11px] text-[#6b6b8a] font-medium px-2 py-2.5">Pos.</th>
                          <th className="text-right text-[11px] text-[#6b6b8a] font-medium px-2 py-2.5">Volume</th>
                          <th className="text-right text-[11px] text-[#6b6b8a] font-medium px-2 py-2.5">Clics</th>
                          <th className="text-right text-[11px] text-[#6b6b8a] font-medium px-4 py-2.5">CTR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {keywords.map((kw, i) => {
                          const diff = kw.prev_position - kw.position
                          return (
                            <motion.tr key={kw.id}
                              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4) }}
                              className="border-b border-[#1e1e2e] last:border-0 hover:bg-[#1e1e2e]/40 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div>
                                  <p className="text-[13px] font-medium text-white">{kw.keyword}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <div className="w-16 h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${kw.difficulty}%` }} />
                                    </div>
                                    <span className="text-[10px] text-[#6b6b8a]">Diff. {kw.difficulty}%</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-2 py-3 text-center">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className={`text-[14px] font-bold ${kw.position <= 3 ? "text-green-400" : kw.position <= 10 ? "text-white" : "text-[#6b6b8a]"}`}>
                                    #{kw.position}
                                  </span>
                                  <div className={`flex items-center gap-0.5 text-[10px] font-medium ${diffColor(kw.position, kw.prev_position)}`}>
                                    {diffIcon(kw.position, kw.prev_position)}
                                    {Math.abs(diff) > 0 ? Math.abs(diff) : "="}
                                  </div>
                                </div>
                              </td>
                              <td className="px-2 py-3 text-right">
                                <span className="text-[12px] text-[#aaaacc]">{fmtNum(kw.volume)}/mo</span>
                              </td>
                              <td className="px-2 py-3 text-right">
                                <span className="text-[13px] font-semibold text-white">{fmtNum(kw.clicks)}</span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className={`text-[12px] font-medium ${kw.ctr >= 10 ? "text-green-400" : kw.ctr >= 5 ? "text-amber-400" : "text-[#6b6b8a]"}`}>{kw.ctr}%</span>
                              </td>
                            </motion.tr>
                          )
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div className="divide-y divide-[#1e1e2e]">
                      {data!.pages.map((page, i) => (
                        <motion.div key={page.url}
                          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4) }}
                          className="px-4 py-3 hover:bg-[#1e1e2e]/40 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[13px] font-semibold text-white">{page.title}</span>
                                {page.index_status === "not_indexed" && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">Non indexé</span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-[11px] text-[#4a4a6a] font-mono">{page.url}</span>
                                <span className="flex items-center gap-1 text-[11px] text-[#6b6b8a]"><Link2 className="w-3 h-3" />{page.backlinks}</span>
                                <span className="flex items-center gap-1 text-[11px] text-blue-400"><MousePointer className="w-3 h-3" />{fmtNum(page.organic_clicks)}</span>
                                {page.issues > 0 && (
                                  <span className="flex items-center gap-1 text-[11px] text-amber-400"><AlertCircle className="w-3 h-3" />{page.issues} problème{page.issues > 1 ? "s" : ""}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className="text-[14px] font-bold" style={{ color: seoColor(page.score) }}>{page.score}</span>
                              <div className="w-20 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${page.score}%` }}
                                  transition={{ duration: 0.7, delay: 0.5 + i * 0.06 }}
                                  className={`h-full rounded-full ${diffColor2(page.score)}`} />
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
            {/* performance trend */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.49, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Performance 6 mois
              </h3>
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400" /><span className="text-[11px] text-[#6b6b8a]">Clics</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400/60" /><span className="text-[11px] text-[#6b6b8a]">Impressions</span></div>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <ComposedChart data={data!.performance_trend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gClicks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => fmtNum(v)} />
                  <Tooltip contentStyle={{ background: "#16161f", border: "1px solid #1e1e2e", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number, name: string) => [fmtNum(v), name === "clicks" ? "Clics" : "Impressions"]} />
                  <Bar dataKey="impressions" fill="#8b5cf620" radius={[4,4,0,0]} name="impressions" />
                  <Area type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} fill="url(#gClicks)" name="clicks" />
                </ComposedChart>
              </ResponsiveContainer>
            </motion.div>

            {/* top gainers */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.56, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <ArrowUp className="w-4 h-4 text-green-400" />
                Meilleurs progrès
              </h3>
              <div className="space-y-2.5">
                {[...data!.keywords]
                  .filter(k => k.position < k.prev_position)
                  .sort((a, b) => (b.prev_position - b.position) - (a.prev_position - a.position))
                  .slice(0, 5)
                  .map((kw, i) => (
                    <motion.div key={kw.id}
                      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.6 + i * 0.07 }}
                      className="flex items-center justify-between gap-2 p-2.5 bg-[#0a0a0f] rounded-xl"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-white truncate">{kw.keyword}</p>
                        <p className="text-[10px] text-[#6b6b8a]">#{kw.prev_position} → #{kw.position}</p>
                      </div>
                      <div className="flex items-center gap-1 text-green-400 font-bold text-[12px] shrink-0">
                        <ArrowUp className="w-3.5 h-3.5" />
                        +{kw.prev_position - kw.position}
                      </div>
                    </motion.div>
                  ))}
              </div>
            </motion.div>

            {/* top 3 positions */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.63, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400" />
                Positions #1 &amp; #2
              </h3>
              <div className="space-y-2.5">
                {data!.keywords.filter(k => k.position <= 2).map((kw, i) => (
                  <div key={kw.id} className="p-3 bg-[#0a0a0f] rounded-xl border border-[#1e1e2e]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[13px] font-black ${kw.position === 1 ? "text-amber-400" : "text-[#6b6b8a]"}`}>#{kw.position}</span>
                      <span className="text-[12px] font-medium text-white">{kw.keyword}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#6b6b8a]">
                      <span>{fmtNum(kw.clicks)} clics</span>
                      <span>{kw.ctr}% CTR</span>
                      <span>{fmtNum(kw.impressions)} impressions</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
