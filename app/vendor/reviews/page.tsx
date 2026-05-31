"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, ShoppingBag, TrendingUp, Wallet, Users, BarChart3,
  Tag, Star, Settings, HelpCircle, Bell, ChevronDown, ChevronRight,
  LogOut, User, Truck, Boxes, Send, ThumbsUp, ThumbsDown, MessageCircle,
  RefreshCw, Ticket, MessageSquare,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Types ────────────────────────────────────────────────────────────────────
interface ReviewProduct { id: string; name: string }
interface ReviewProfile { full_name: string; avatar_url: string | null }
interface Review {
  id: string; rating: number; comment: string | null
  vendor_response: string | null; responded_at: string | null; created_at: string
  products: ReviewProduct | null; profiles: ReviewProfile | null
}
interface KPI {
  avg_rating: number; total_count: number; response_rate: number; this_month: number
  positive_count: number; negative_count: number; unanswered_count: number
}
interface Counts { all: number; positive: number; negative: number; unanswered: number }

// ─── Constants ────────────────────────────────────────────────────────────────
const BACKGROUND_VIDEOS = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background%20videos%20E-market%20hero-tiwMHaJdezDuLsRvu9dKGD6duCx1gr.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/video%20market%20place%20background%20hero-ukKWRfEszbAZsD07cLFE1nT4OaJHBS.mp4",
]

const DIST_COLORS: Record<number, string> = {
  5: "#22c55e", 4: "#a3e635", 3: "#eab308", 2: "#f97316", 1: "#ef4444",
}

const FILTER_TABS = [
  { key: "all",        label: "Tous" },
  { key: "positive",   label: "Positifs" },
  { key: "negative",   label: "Négatifs" },
  { key: "unanswered", label: "Sans réponse" },
] as const

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendor/dashboard" },
  { icon: ShoppingBag,     label: "Commandes",       href: "/vendor/orders" },
  {
    icon: Package, label: "Produits", href: "/vendor/products", expandable: true,
    children: [
      { label: "Tous les produits",  href: "/vendor/products" },
      { label: "Ajouter un produit", href: "/vendor/products/new" },
      { label: "Catégories",         href: "/vendor/products/categories" },
    ],
  },
  { icon: Boxes,      label: "Stocks",       href: "/vendor/stocks" },
  { icon: Truck,      label: "Livraisons",   href: "/vendor/deliveries" },
  { icon: TrendingUp, label: "Revenus",      href: "/vendor/analytics" },
  {
    icon: Wallet, label: "Portefeuille", href: "/vendor/wallet", expandable: true,
    children: [
      { label: "Solde & Retrait", href: "/vendor/wallet" },
      { label: "Retraits",        href: "/vendor/payouts" },
      { label: "Historique",      href: "/vendor/wallet/history" },
    ],
  },
  { icon: Users,      label: "Clients CRM", href: "/vendor/crm" },
  { icon: BarChart3,  label: "Analyses",    href: "/vendor/analytics" },
  { icon: Tag,        label: "Promotions",  href: "/vendor/promotions" },
  { icon: Ticket,     label: "Coupons",     href: "/vendor/coupons" },
  { icon: Star,         label: "Avis",     href: "/vendor/reviews", active: true },
  { icon: MessageSquare,label: "Messages", href: "/vendor/messages" },
  { icon: Bell,         label: "Notifications",href: "/vendor/notifications" },
  { icon: Settings,   label: "Paramètres",  href: "/vendor/settings" },
  { icon: HelpCircle, label: "Aide",        href: "/vendor/help" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
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
  if (rating >= 4) return { label: "Positif", color: "#22c55e", bg: "#22c55e22" }
  if (rating <= 2) return { label: "Négatif", color: "#ef4444", bg: "#ef444422" }
  return              { label: "Neutre",  color: "#6b7280", bg: "#6b728022" }
}

// ─── Stars display ────────────────────────────────────────────────────────────
function Stars({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size}
          className={i <= rating ? "text-[#eab308] fill-[#eab308]" : "text-white/20"} />
      ))}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, Icon, delay }: {
  label: string; value: string | number; sub: string; color: string
  Icon: React.FC<{ className?: string; style?: React.CSSProperties }>; delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 120, damping: 18 }}
      whileHover={{ y: -3, boxShadow: `0 0 30px ${color}20` }}
      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-3
        hover:border-opacity-60 transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20"
        style={{ background: color }} />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center relative z-10"
        style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="relative z-10">
        <p className="text-2xl font-black text-white leading-tight">{value}</p>
        <p className="text-xs text-white/40 mt-0.5">{sub}</p>
        <p className="text-xs text-white/25 mt-1">{label}</p>
      </div>
    </motion.div>
  )
}

// ─── Review Card ──────────────────────────────────────────────────────────────
function ReviewCard({ review, onReply }: {
  review: Review; onReply: (id: string, text: string) => Promise<void>
}) {
  const [expanded, setExpanded]           = useState(false)
  const [replyOpen, setReplyOpen]         = useState(false)
  const [replyText, setReplyText]         = useState("")
  const [sending, setSending]             = useState(false)
  const [localResponse, setLocalResponse] = useState(review.vendor_response)
  const sent = sentiment(review.rating)
  const commentLong = (review.comment?.length ?? 0) > 180

  const handleReply = async () => {
    if (!replyText.trim()) return
    setSending(true)
    await onReply(review.id, replyText)
    setLocalResponse(replyText)
    setReplyOpen(false)
    setReplyText("")
    setSending(false)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      whileHover={{ borderColor: "#2a2a3e" }}
      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 space-y-4 transition-colors"
    >
      {/* Top row */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm"
          style={{ background: "#eab30830", color: "#eab308" }}>
          {initials(review.profiles?.full_name)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <span className="text-white font-semibold text-sm">{review.profiles?.full_name ?? "Client"}</span>
            <Stars rating={review.rating} />
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: sent.bg, color: sent.color }}>{sent.label}</span>
            {review.products?.name && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#1e1e2e] text-white/40">
                {review.products.name}
              </span>
            )}
          </div>
          <p className="text-xs text-white/30">
            {new Date(review.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
      </div>

      {review.comment && (
        <div>
          <p className={`text-sm text-white/70 leading-relaxed ${!expanded && commentLong ? "line-clamp-3" : ""}`}>
            {review.comment}
          </p>
          {commentLong && (
            <button onClick={() => setExpanded(e => !e)} className="text-xs text-[#a3e635] mt-1 hover:underline">
              {expanded ? "Voir moins" : "Voir plus"}
            </button>
          )}
        </div>
      )}

      {localResponse && (
        <div className="ml-4 border-l-2 border-[#8b5cf6]/40 pl-4">
          <p className="text-xs text-[#8b5cf6] font-medium mb-1">Votre réponse</p>
          <p className="text-sm text-white/60">{localResponse}</p>
        </div>
      )}

      <div className="flex items-center gap-3">
        {!localResponse ? (
          <button onClick={() => setReplyOpen(r => !r)}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-[#a3e635] transition-colors">
            <MessageCircle size={13} /> Répondre
          </button>
        ) : (
          <button onClick={() => setReplyOpen(r => !r)}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
            <RefreshCw size={12} /> Modifier
          </button>
        )}
      </div>

      <AnimatePresence>
        {replyOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex gap-2 pt-1">
              <textarea
                value={replyText} onChange={e => setReplyText(e.target.value)}
                placeholder="Écrivez votre réponse…" rows={3}
                className="flex-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-3 text-white text-sm
                  focus:outline-none focus:border-[#a3e635]/50 placeholder-white/20 resize-none"
              />
              <button onClick={handleReply} disabled={sending || !replyText.trim()}
                className="w-10 h-10 self-end rounded-xl bg-[#a3e635]/20 border border-[#a3e635]/30 text-[#a3e635]
                  hover:bg-[#a3e635]/30 transition-all disabled:opacity-40 flex items-center justify-center">
                {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReviewsPage() {
  const supabase = useRef(createClient())
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoIdx, setVideoIdx] = useState(0)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ Produits: false, Portefeuille: false })
  const [vendorName, setVendorName]   = useState("")
  const [vendorInits, setVendorInits] = useState("")

  const [reviews, setReviews]     = useState<Review[]>([])
  const [kpi, setKpi]             = useState<KPI>({ avg_rating: 0, total_count: 0, response_rate: 0, this_month: 0, positive_count: 0, negative_count: 0, unanswered_count: 0 })
  const [distribution, setDist]   = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
  const [counts, setCounts]       = useState<Counts>({ all: 0, positive: 0, negative: 0, unanswered: 0 })
  const [filter, setFilter]       = useState("all")
  const [loading, setLoading]     = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Video cycling
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.src = BACKGROUND_VIDEOS[videoIdx % BACKGROUND_VIDEOS.length]
    video.load()
    const onCanPlay = () => video.play().catch(() => {})
    video.addEventListener("canplay", onCanPlay, { once: true })
    return () => video.removeEventListener("canplay", onCanPlay)
  }, [videoIdx])

  // Vendor info
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.current.auth.getUser()
      if (!user) return
      const { data: v } = await supabase.current.from("vendors").select("name").eq("owner_id", user.id).single()
      if (v) {
        const name = (v as { name: string }).name
        setVendorName(name)
        setVendorInits(name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase())
      }
    }
    void load()
  }, [])

  const fetchData = async (quiet = false) => {
    if (!quiet) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await fetch(`/api/vendor/reviews?filter=${filter}`)
      if (res.ok) {
        const d = await res.json()
        setReviews(d.reviews ?? [])
        setKpi(d.kpi ?? kpi)
        setDist(d.distribution ?? distribution)
        setCounts(d.counts ?? counts)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { void fetchData() }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReply = async (id: string, text: string) => {
    await fetch("/api/vendor/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review_id: id, response: text }),
    })
    void fetchData(true)
  }

  const handleSignOut  = async () => { await supabase.current.auth.signOut(); window.location.href = "/auth/login" }
  const toggleSection  = (label: string) => setExpandedSections(s => ({ ...s, [label]: !s[label] }))
  const filterCount    = (key: string) => key === "all" ? counts.all : (counts[key as keyof Counts] ?? 0)
  const maxDistCount   = Math.max(...Object.values(distribution), 1)

  const animTotal  = useCountUp(kpi.total_count)
  const animRate   = useCountUp(kpi.response_rate)
  const animMonth  = useCountUp(kpi.this_month)

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-[#eab308] blur-[130px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-[#22c55e] blur-[120px]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          className="absolute top-2/3 left-1/2 w-72 h-72 rounded-full bg-[#8b5cf6] blur-[120px]"
        />
      </div>

      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-[#111118] border-r border-[#1e1e2e] relative z-10">
        <div className="px-5 py-5 border-b border-[#1e1e2e]">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center shrink-0">
              <span className="text-white font-black text-base">Q</span>
            </div>
            <div>
              <p className="text-white font-black text-base leading-none">QUICK<span className="text-[#a3e635]">GO</span></p>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">Vendeur</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => {
            const isExpanded = expandedSections[item.label]
            const Icon = item.icon
            return (
              <div key={item.label}>
                {("expandable" in item && item.expandable) ? (
                  <button onClick={() => toggleSection(item.label)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:text-white hover:bg-[#1e1e2e]/60 transition-all text-sm">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <Link href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      ("active" in item && item.active)
                        ? "bg-[#a3e635]/10 text-[#a3e635] border border-[#a3e635]/20"
                        : "text-white/50 hover:text-white hover:bg-[#1e1e2e]/60"
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                    {("active" in item && item.active) && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#a3e635]" />
                    )}
                  </Link>
                )}
                <AnimatePresence>
                  {("expandable" in item && item.expandable) && isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden ml-7 mt-0.5 space-y-0.5">
                      {("children" in item && Array.isArray(item.children) ? item.children : []).map((child: { href: string; label: string }) => (
                        <Link key={child.href} href={child.href}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white hover:bg-[#1e1e2e]/40 transition-all">
                          <ChevronRight className="w-3 h-3" />
                          {child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </nav>

        <div className="p-3">
          <motion.div whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-[#a3e635]/20 to-[#3b82f6]/20 border border-[#a3e635]/20 rounded-2xl p-4">
            <p className="text-white text-xs font-bold mb-1">Développez votre activité</p>
            <p className="text-white/40 text-[10px] mb-3">Boostez vos ventes avec QuickGo</p>
            <Link href="/vendor/dashboard"
              className="w-full py-1.5 rounded-lg bg-[#a3e635] text-[#0a0a0f] text-xs font-bold flex items-center justify-center gap-1.5">
              Voir le tableau de bord
            </Link>
          </motion.div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">

        {/* ── Header with video ── */}
        <div className="relative overflow-hidden bg-[#111118]">
          <video ref={videoRef} muted loop playsInline
            onEnded={() => setVideoIdx(i => i + 1)}
            className="absolute inset-0 w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-transparent to-[#0a0a0f]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111118] via-transparent to-[#111118]" />

          {/* Mini orbs in header */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-0 left-1/4 w-40 h-20 rounded-full bg-[#eab308] blur-3xl opacity-30"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, delay: 2 }}
            className="absolute top-0 right-1/3 w-32 h-16 rounded-full bg-[#22c55e] blur-3xl opacity-20"
          />

          <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-2xl bg-[#eab308]/20 border border-[#eab308]/30 flex items-center justify-center"
                >
                  <Star className="w-5 h-5 text-[#eab308] fill-[#eab308]" />
                </motion.div>
                <h1 className="text-2xl font-black text-white">
                  Avis &{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#eab308] to-[#22c55e]">
                    Notes
                  </span>
                </h1>
              </div>
              <p className="text-white/40 text-sm">Gérez les retours de vos clients</p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button onClick={() => fetchData(true)}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                <RefreshCw className={`w-4 h-4 text-white/60 ${refreshing ? "animate-spin" : ""}`} />
              </motion.button>

              <Link href="/vendor/notifications">
                <motion.div whileHover={{ scale: 1.05 }}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                  <Bell className="w-4 h-4 text-white/60" />
                </motion.div>
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-3 border-l border-[#1e1e2e]">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#eab308] to-[#22c55e] border-2 border-[#a3e635]/60 shadow-[0_0_12px_rgba(163,230,53,0.25)] flex items-center justify-center">
                      <span className="text-white font-black text-sm">{vendorInits || "V"}</span>
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-white text-sm font-semibold leading-tight">{vendorName || "Vendeur"}</p>
                      <p className="text-white/40 text-xs">Gestionnaire</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-[#16161f] border-[#1e1e2e]">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer">
                      <User className="w-4 h-4" /> Mon profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/vendor/settings" className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer">
                      <Settings className="w-4 h-4" /> Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#1e1e2e]" />
                  <DropdownMenuItem onClick={handleSignOut}
                    className="flex items-center gap-2 text-[#ef4444] hover:text-[#ef4444] cursor-pointer">
                    <LogOut className="w-4 h-4" /> Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Note moyenne"    value={kpi.avg_rating.toFixed(1)} sub="sur 5 étoiles"    color="#eab308" Icon={Star}          delay={0}    />
            <KpiCard label="Total avis"      value={animTotal}                  sub="avis reçus"       color="#3b82f6" Icon={MessageCircle} delay={0.06} />
            <KpiCard label="Taux de réponse" value={`${animRate}%`}             sub="réponses données" color="#22c55e" Icon={ThumbsUp}       delay={0.12} />
            <KpiCard label="Ce mois"         value={animMonth}                  sub="nouveaux avis"    color="#8b5cf6" Icon={Star}          delay={0.18} />
          </div>

          {/* Distribution + Quick stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-6 space-y-5">
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-5xl font-black text-white">{kpi.avg_rating.toFixed(1)}</p>
                  <Stars rating={Math.round(kpi.avg_rating)} size={20} />
                  <p className="text-xs text-white/30 mt-1">{kpi.total_count} avis au total</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {[5, 4, 3, 2, 1].map(star => {
                  const count = distribution[star] ?? 0
                  const pct   = (count / maxDistCount) * 100
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-12 shrink-0 justify-end">
                        <span className="text-xs text-white/40">{star}</span>
                        <Star size={11} className="text-[#eab308] fill-[#eab308]" />
                      </div>
                      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div className="h-full rounded-full"
                          style={{ background: DIST_COLORS[star] }}
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: (6 - star) * 0.08, ease: "easeOut" }} />
                      </div>
                      <span className="text-xs text-white/30 w-5 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: "Avis positifs",  value: kpi.positive_count,   icon: ThumbsUp,      color: "#22c55e" },
                { label: "Avis négatifs",  value: kpi.negative_count,   icon: ThumbsDown,    color: "#ef4444" },
                { label: "Sans réponse",   value: kpi.unanswered_count, icon: MessageCircle, color: "#f97316" },
              ].map((s, i) => (
                <motion.div key={s.label}
                  initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -2, boxShadow: `0 0 20px ${s.color}15` }}
                  className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-4 flex items-center gap-3 transition-all relative overflow-hidden">
                  <div className="absolute -top-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-20"
                    style={{ background: s.color }} />
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 relative z-10"
                    style={{ background: s.color + "22" }}>
                    <s.icon size={16} style={{ color: s.color }} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-lg font-black text-white">{s.value}</p>
                    <p className="text-xs text-white/40">{s.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  filter === tab.key
                    ? "bg-[#a3e635]/10 text-[#a3e635] border-[#a3e635]/20"
                    : "border-[#1e1e2e] text-white/50 hover:text-white hover:bg-[#1e1e2e]/60"
                }`}>
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  filter === tab.key ? "bg-[#a3e635]/20 text-[#a3e635]" : "bg-white/5 text-white/30"
                }`}>{filterCount(tab.key)}</span>
              </button>
            ))}
          </div>

          {/* Reviews list */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-36 rounded-2xl bg-[#16161f] animate-pulse" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-3">
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <Star size={48} className="text-white/20" />
              </motion.div>
              <p className="text-white/40 text-center">Aucun avis{filter !== "all" ? " dans cette catégorie" : " pour le moment"}</p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {reviews.map(r => <ReviewCard key={r.id} review={r} onReply={handleReply} />)}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  )
}
