"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, ShoppingCart, Users, BarChart3,
  Truck, Wallet, TrendingUp, Settings, Bell, MessageSquare,
  ChevronRight, LogOut, Star, Send, ThumbsUp, ThumbsDown,
  MessageCircle, RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReviewProduct { id: string; name: string }
interface ReviewProfile { full_name: string; avatar_url: string | null }
interface Review {
  id: string
  rating: number
  comment: string | null
  vendor_response: string | null
  responded_at: string | null
  created_at: string
  products: ReviewProduct | null
  profiles: ReviewProfile | null
}
interface KPI {
  avg_rating: number
  total_count: number
  response_rate: number
  this_month: number
  positive_count: number
  negative_count: number
  unanswered_count: number
}
interface Counts { all: number; positive: number; negative: number; unanswered: number }

// ─── Constants ────────────────────────────────────────────────────────────────
const VIDEO_URLS = [
  "https://ljqqgzftkumpnixqiuuh.supabase.co/storage/v1/object/public/assets/bg1.mp4",
  "https://ljqqgzftkumpnixqiuuh.supabase.co/storage/v1/object/public/assets/bg2.mp4",
]

const FILTER_TABS = [
  { key: "all",        label: "Tous" },
  { key: "positive",   label: "Positifs" },
  { key: "negative",   label: "Négatifs" },
  { key: "unanswered", label: "Sans réponse" },
] as const

const DIST_COLORS: Record<number, string> = {
  5: "#22c55e", 4: "#a3e635", 3: "#eab308", 2: "#f97316", 1: "#ef4444",
}

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendor/dashboard" },
  {
    icon: Package, label: "Produits", href: "/vendor/products",
    children: [
      { label: "Tous les produits",  href: "/vendor/products" },
      { label: "Ajouter un produit", href: "/vendor/products/new" },
      { label: "Catégories",         href: "/vendor/products/categories" },
    ],
  },
  { icon: ShoppingCart,  label: "Commandes",     href: "/vendor/orders" },
  { icon: Package,       label: "Stocks",        href: "/vendor/stocks" },
  { icon: Truck,         label: "Livraisons",    href: "/vendor/deliveries" },
  { icon: Users,         label: "CRM",           href: "/vendor/crm" },
  { icon: Star,          label: "Avis",          href: "/vendor/reviews", active: true },
  { icon: TrendingUp,    label: "Revenus",       href: "/vendor/analytics" },
  {
    icon: Wallet, label: "Portefeuille", href: "/vendor/wallet",
    children: [
      { label: "Solde & Retrait", href: "/vendor/wallet" },
      { label: "Retraits",        href: "/vendor/payouts" },
      { label: "Historique",      href: "/vendor/wallet/history" },
    ],
  },
  { icon: BarChart3,     label: "Analyses",      href: "/vendor/analytics" },
  { icon: Settings,      label: "Paramètres",    href: "/vendor/settings" },
  { icon: Bell,          label: "Notifications", href: "/vendor/notifications" },
  { icon: MessageSquare, label: "Messages",      href: "/vendor/messages" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) { setVal(0); return }
    const start = performance.now()
    const raf = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [target, duration])
  return val
}

function initials(name: string | null | undefined) {
  if (!name) return "?"
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()
}

function sentiment(rating: number) {
  if (rating >= 4) return { label: "Positif",  color: "#22c55e", bg: "#22c55e22" }
  if (rating <= 2) return { label: "Négatif",  color: "#ef4444", bg: "#ef444422" }
  return              { label: "Neutre",   color: "#6b7280", bg: "#6b728022" }
}

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size}
          className={i <= rating ? "text-[#eab308] fill-[#eab308]" : "text-gray-600"} />
      ))}
    </div>
  )
}

// ─── ReviewCard ───────────────────────────────────────────────────────────────
function ReviewCard({ review, onReply }: {
  review: Review
  onReply: (id: string, text: string) => Promise<void>
}) {
  const [expanded, setExpanded]   = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState("")
  const [sending, setSending]     = useState(false)
  const [localResponse, setLocalResponse] = useState(review.vendor_response)
  const sent = sentiment(review.rating)
  const name = review.profiles?.full_name ?? "Client"

  const handleReply = async () => {
    if (!replyText.trim()) return
    setSending(true)
    await onReply(review.id, replyText)
    setLocalResponse(replyText)
    setReplyOpen(false)
    setReplyText("")
    setSending(false)
  }

  const commentLong = (review.comment?.length ?? 0) > 180

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-xl border border-[#1e1e2e] bg-[#111118] p-5 space-y-4"
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
          style={{ background: "#eab30830", color: "#eab308" }}>
          {initials(review.profiles?.full_name)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span className="text-white font-medium text-sm">{name}</span>
            <Stars rating={review.rating} />
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: sent.bg, color: sent.color }}>
              {sent.label}
            </span>
            {review.products?.name && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1e1e2e] text-gray-400">
                {review.products.name}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500">
            {new Date(review.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <div>
          <p className={`text-sm text-gray-300 leading-relaxed ${!expanded && commentLong ? "line-clamp-3" : ""}`}>
            {review.comment}
          </p>
          {commentLong && (
            <button onClick={() => setExpanded(e => !e)} className="text-xs text-[#a3e635] mt-1 hover:underline">
              {expanded ? "Voir moins" : "Voir plus"}
            </button>
          )}
        </div>
      )}

      {/* Vendor response */}
      {localResponse && (
        <div className="ml-4 border-l-2 border-purple-500/40 pl-4">
          <p className="text-xs text-purple-400 font-medium mb-1">Votre réponse</p>
          <p className="text-sm text-gray-300">{localResponse}</p>
        </div>
      )}

      {/* Reply section */}
      <div className="flex items-center gap-2">
        {!localResponse && (
          <button
            onClick={() => setReplyOpen(r => !r)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#a3e635] transition-colors"
          >
            <MessageCircle size={13} />
            Répondre
          </button>
        )}
        {localResponse && (
          <button
            onClick={() => setReplyOpen(r => !r)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            <RefreshCw size={12} />
            Modifier
          </button>
        )}
      </div>

      <AnimatePresence>
        {replyOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 pt-1">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Écrivez votre réponse…"
                rows={3}
                className="flex-1 bg-[#0d0d14] border border-[#1e1e2e] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500/50 placeholder-gray-600 resize-none"
              />
              <button
                onClick={handleReply} disabled={sending || !replyText.trim()}
                className="w-10 h-10 self-end rounded-xl bg-[#a3e635]/20 border border-[#a3e635]/30 text-[#a3e635] hover:bg-[#a3e635]/30 transition-all disabled:opacity-40 flex items-center justify-center"
              >
                {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReviewsPage() {
  const supabase = createClient()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoIdx, setVideoIdx] = useState(0)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ Produits: false, Portefeuille: false })
  const [sidebarCollapsed, setSidebarCollapsed]  = useState(false)

  const [reviews, setReviews] = useState<Review[]>([])
  const [kpi, setKpi]         = useState<KPI>({ avg_rating: 0, total_count: 0, response_rate: 0, this_month: 0, positive_count: 0, negative_count: 0, unanswered_count: 0 })
  const [distribution, setDistribution] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
  const [counts, setCounts]   = useState<Counts>({ all: 0, positive: 0, negative: 0, unanswered: 0 })
  const [filter, setFilter]   = useState<string>("all")
  const [loading, setLoading] = useState(true)

  const animAvg      = useCountUp(Math.round(kpi.avg_rating * 10))
  const animTotal    = useCountUp(kpi.total_count)
  const animRate     = useCountUp(kpi.response_rate)
  const animMonth    = useCountUp(kpi.this_month)

  const fetchData = async (f = filter) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/vendor/reviews?filter=${f}`)
      if (!res.ok) throw new Error()
      const d = await res.json()
      setReviews(d.reviews ?? [])
      setKpi(d.kpi ?? kpi)
      setDistribution(d.distribution ?? distribution)
      setCounts(d.counts ?? counts)
    } catch { /* silent */ }
    setLoading(false)
  }

  useEffect(() => { fetchData(filter) }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReply = async (id: string, text: string) => {
    await fetch("/api/vendor/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review_id: id, response: text }),
    })
    fetchData(filter)
  }

  const handleLogout  = async () => { await supabase.auth.signOut(); window.location.href = "/auth/login" }
  const toggleSection = (label: string) => setExpandedSections(s => ({ ...s, [label]: !s[label] }))
  const filterCount   = (key: string) => counts[key as keyof Counts] ?? 0

  const maxDistCount  = Math.max(...Object.values(distribution), 1)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex overflow-hidden relative">
      {/* Video BG */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video ref={videoRef} autoPlay muted playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20"
          onEnded={() => setVideoIdx(i => (i + 1) % VIDEO_URLS.length)}
          key={videoIdx} src={VIDEO_URLS[videoIdx]} />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0f]/80 via-[#0a0a0f]/60 to-[#0a0a0f]/80" />
      </div>

      {/* Orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {[
          { color: "#eab308", x: "8%",  y: "10%", size: 320, d: 6 },
          { color: "#22c55e", x: "80%", y: "55%", size: 260, d: 8 },
          { color: "#8b5cf6", x: "45%", y: "80%", size: 200, d: 5 },
        ].map((o, i) => (
          <motion.div key={i} className="absolute rounded-full blur-3xl opacity-10"
            style={{ left: o.x, top: o.y, width: o.size, height: o.size, background: o.color }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.18, 0.1] }}
            transition={{ duration: o.d, repeat: Infinity, ease: "easeInOut" }} />
        ))}
      </div>

      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 72 : 260 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="relative z-30 flex-shrink-0 h-screen sticky top-0 flex flex-col bg-[#0d0d14]/95 backdrop-blur-xl border-r border-[#1e1e2e]"
      >
        <div className="flex items-center justify-between px-4 py-5 border-b border-[#1e1e2e]">
          {!sidebarCollapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#a3e635]/20 flex items-center justify-center">
                <span className="text-[#a3e635] font-bold text-sm">Q</span>
              </div>
              <span className="font-bold text-white">QuickGo</span>
            </Link>
          )}
          <button onClick={() => setSidebarCollapsed(c => !c)}
            className="w-8 h-8 rounded-lg bg-[#1e1e2e] flex items-center justify-center hover:bg-[#2a2a3e] transition-colors ml-auto">
            <ChevronRight size={14} className={`text-gray-400 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {SIDEBAR_ITEMS.map((item) => {
            const hasChildren = "children" in item && !!item.children
            const isExpanded  = expandedSections[item.label]
            const Icon        = item.icon
            const isActive    = ("active" in item) && item.active
            const anyChildActive = hasChildren && item.children.some(c => ("active" in c) && c.active)

            return (
              <div key={item.label}>
                {hasChildren ? (
                  <button onClick={() => toggleSection(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${anyChildActive ? "bg-[#a3e635]/10 text-[#a3e635]" : "text-gray-400 hover:bg-[#1e1e2e] hover:text-white"}`}>
                    <Icon size={18} className="flex-shrink-0" />
                    {!sidebarCollapsed && (
                      <><span className="flex-1 text-sm font-medium">{item.label}</span>
                      <ChevronRight size={14} className={`transition-transform ${isExpanded ? "rotate-90" : ""}`} /></>
                    )}
                  </button>
                ) : (
                  <Link href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? "bg-[#a3e635]/10 text-[#a3e635]" : "text-gray-400 hover:bg-[#1e1e2e] hover:text-white"}`}>
                    <Icon size={18} className="flex-shrink-0" />
                    {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                  </Link>
                )}

                <AnimatePresence>
                  {hasChildren && isExpanded && !sidebarCollapsed && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="ml-9 mt-1 space-y-1 overflow-hidden">
                      {item.children.map((child) => {
                        const childActive = ("active" in child) && child.active
                        return (
                          <Link key={child.label} href={child.href}
                            className={`block px-3 py-2 rounded-lg text-sm transition-all ${childActive ? "bg-[#a3e635]/15 text-[#a3e635] font-medium" : "text-gray-500 hover:text-white hover:bg-[#1e1e2e]"}`}>
                            {child.label}
                          </Link>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </nav>

        <div className="p-3 border-t border-[#1e1e2e]">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all">
            <LogOut size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Déconnexion</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-white">Avis & Notes</h1>
            <p className="text-sm text-gray-400 mt-1">Gérez les retours de vos clients</p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Note moyenne",    value: (animAvg / 10).toFixed(1), sub: "sur 5 étoiles",    color: "#eab308", Icon: Star },
              { label: "Total avis",      value: animTotal,                  sub: "avis reçus",       color: "#3b82f6", Icon: MessageCircle },
              { label: "Taux de réponse", value: `${animRate}%`,             sub: "réponses données", color: "#22c55e", Icon: ThumbsUp },
              { label: "Ce mois",         value: animMonth,                  sub: "nouveaux avis",    color: "#8b5cf6", Icon: Star },
            ].map((card, i) => (
              <motion.div key={card.label}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-[#1e1e2e] bg-[#111118] p-5 space-y-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: card.color + "22" }}>
                  <card.Icon size={18} style={{ color: card.color }} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                  <p className="text-xs text-gray-400">{card.sub}</p>
                </div>
                <p className="text-xs text-gray-500">{card.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Rating distribution + quick stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Distribution */}
            <div className="lg:col-span-2 rounded-2xl border border-[#1e1e2e] bg-[#111118] p-6 space-y-4">
              <div className="flex items-center gap-4 mb-2">
                <div>
                  <p className="text-4xl font-bold text-white">{kpi.avg_rating.toFixed(1)}</p>
                  <Stars rating={Math.round(kpi.avg_rating)} size={18} />
                  <p className="text-xs text-gray-400 mt-1">{kpi.total_count} avis au total</p>
                </div>
              </div>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = distribution[star] ?? 0
                  const pct   = maxDistCount > 0 ? (count / maxDistCount) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-12 flex-shrink-0">
                        <span className="text-xs text-gray-400 w-3 text-right">{star}</span>
                        <Star size={11} className="text-[#eab308] fill-[#eab308]" />
                      </div>
                      <div className="flex-1 h-2 rounded-full bg-[#1e1e2e] overflow-hidden">
                        <motion.div className="h-full rounded-full"
                          style={{ background: DIST_COLORS[star] }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: (6 - star) * 0.08, ease: "easeOut" }} />
                      </div>
                      <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick stats */}
            <div className="space-y-3">
              {[
                { label: "Avis positifs",    value: kpi.positive_count,   icon: ThumbsUp,   color: "#22c55e" },
                { label: "Avis négatifs",    value: kpi.negative_count,   icon: ThumbsDown, color: "#ef4444" },
                { label: "Sans réponse",     value: kpi.unanswered_count, icon: MessageCircle, color: "#f97316" },
              ].map((stat, i) => (
                <motion.div key={stat.label}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  className="rounded-xl border border-[#1e1e2e] bg-[#111118] p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: stat.color + "22" }}>
                    <stat.icon size={16} style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${filter === tab.key
                  ? "bg-[#a3e635]/15 border-[#a3e635]/40 text-[#a3e635]"
                  : "border-[#1e1e2e] text-gray-400 hover:border-[#2a2a3e] hover:text-white"}`}>
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${filter === tab.key ? "bg-[#a3e635]/20 text-[#a3e635]" : "bg-[#1e1e2e] text-gray-500"}`}>
                  {tab.key === "all" ? counts.all : filterCount(tab.key)}
                </span>
              </button>
            ))}
          </div>

          {/* Reviews list */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-36 rounded-xl bg-[#111118] border border-[#1e1e2e] animate-pulse" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-3">
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <Star size={48} className="text-gray-600" />
              </motion.div>
              <p className="text-gray-400 text-center">Aucun avis{filter !== "all" ? " dans cette catégorie" : " pour le moment"}</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {reviews.map(r => (
                  <ReviewCard key={r.id} review={r} onReply={handleReply} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  )
}
