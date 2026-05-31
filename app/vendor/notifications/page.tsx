"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, ShoppingBag, TrendingUp, Wallet, Users, BarChart3,
  Tag, Star, Settings, HelpCircle, Bell, BellRing, ChevronDown, ChevronRight,
  LogOut, User, Truck, Boxes, Ticket, MessageSquare, RefreshCw,
  CheckCircle, Trash2, Clock, ExternalLink, AlertTriangle, Info,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Types ────────────────────────────────────────────────────────────────────
type NotificationType = "order" | "review" | "payment" | "system" | "alert" | "promo"

interface Notification {
  id: string; type: NotificationType; title: string; body: string
  is_read: boolean; action_url: string | null; created_at: string
}
interface KPI    { total: number; unread: number; today: number }
interface Counts { all: number; unread: number; order: number; payment: number; system: number }

// ─── Constants ────────────────────────────────────────────────────────────────
const BACKGROUND_VIDEOS = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background%20videos%20E-market%20hero-tiwMHaJdezDuLsRvu9dKGD6duCx1gr.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/video%20market%20place%20background%20hero-ukKWRfEszbAZsD07cLFE1nT4OaJHBS.mp4",
]

const TYPE_CFG: Record<NotificationType, {
  label: string; color: string
  Icon: React.FC<{ className?: string; style?: React.CSSProperties }>
}> = {
  order:   { label: "Commande",  color: "#3b82f6", Icon: ShoppingBag   },
  review:  { label: "Avis",      color: "#f59e0b", Icon: Star          },
  payment: { label: "Paiement",  color: "#22c55e", Icon: Wallet        },
  system:  { label: "Système",   color: "#6b7280", Icon: Info          },
  alert:   { label: "Alerte",    color: "#ef4444", Icon: AlertTriangle },
  promo:   { label: "Promo",     color: "#8b5cf6", Icon: Tag           },
}

const FILTER_TABS = [
  { key: "all",     label: "Toutes"    },
  { key: "unread",  label: "Non lues"  },
  { key: "order",   label: "Commandes" },
  { key: "payment", label: "Paiements" },
  { key: "system",  label: "Système"   },
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
  { icon: Boxes,        label: "Stocks",        href: "/vendor/stocks" },
  { icon: Truck,        label: "Livraisons",    href: "/vendor/deliveries" },
  { icon: TrendingUp,   label: "Revenus",       href: "/vendor/analytics" },
  {
    icon: Wallet, label: "Portefeuille", href: "/vendor/wallet", expandable: true,
    children: [
      { label: "Solde & Retrait", href: "/vendor/wallet" },
      { label: "Retraits",        href: "/vendor/payouts" },
      { label: "Historique",      href: "/vendor/wallet/history" },
    ],
  },
  { icon: Users,        label: "Clients CRM",  href: "/vendor/crm" },
  { icon: BarChart3,    label: "Analyses",     href: "/vendor/analytics" },
  { icon: Tag,          label: "Promotions",   href: "/vendor/promotions" },
  { icon: Ticket,       label: "Coupons",      href: "/vendor/coupons" },
  { icon: Star,         label: "Avis",         href: "/vendor/reviews" },
  { icon: MessageSquare,label: "Messages",     href: "/vendor/messages" },
  { icon: Bell,         label: "Notifications",href: "/vendor/notifications", active: true },
  { icon: Settings,     label: "Paramètres",   href: "/vendor/settings" },
  { icon: HelpCircle,   label: "Aide",         href: "/vendor/help" },
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

function fmtRelative(s: string) {
  const diff = Date.now() - new Date(s).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return "À l'instant"
  if (mins  < 60) return `Il y a ${mins} min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days  < 7)  return `Il y a ${days}j`
  return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}

function getGroup(s: string): "today" | "yesterday" | "week" | "older" {
  const days = Math.floor((Date.now() - new Date(s).getTime()) / 86400000)
  if (days === 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 7)  return "week"
  return "older"
}
const GROUP_LABEL = { today: "Aujourd'hui", yesterday: "Hier", week: "Cette semaine", older: "Plus anciens" }

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, Icon, delay }: {
  label: string; value: number; sub: string; color: string
  Icon: React.FC<{ className?: string; style?: React.CSSProperties }>; delay: number
}) {
  const animated = useCountUp(value)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 120, damping: 18 }}
      whileHover={{ y: -3, boxShadow: `0 0 30px ${color}20` }}
      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden transition-all duration-300">
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20" style={{ background: color }} />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center relative z-10" style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="relative z-10">
        <p className="text-2xl font-black text-white leading-tight">{animated}</p>
        <p className="text-xs text-white/40 mt-0.5">{sub}</p>
        <p className="text-xs text-white/25 mt-1">{label}</p>
      </div>
    </motion.div>
  )
}

// ─── Notification Card ────────────────────────────────────────────────────────
function NotifCard({ notif, onRead, onDelete }: {
  notif: Notification
  onRead:  (id: string) => Promise<void>
  onDelete:(id: string) => Promise<void>
}) {
  const [deleting, setDeleting] = useState(false)
  const [reading,  setReading]  = useState(false)
  const cfg  = TYPE_CFG[notif.type]
  const Icon = cfg.Icon

  const handleRead   = async () => { setReading(true);  await onRead(notif.id);   setReading(false) }
  const handleDelete = async () => { setDeleting(true); await onDelete(notif.id); setDeleting(false) }

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
      className={`relative flex items-start gap-4 px-5 py-4 rounded-2xl border transition-all ${
        !notif.is_read
          ? "bg-white/[0.035] border-[#1e1e2e] hover:border-[#2a2a3e]"
          : "bg-transparent border-transparent hover:bg-white/[0.018]"
      }`}>
      {/* Unread accent bar */}
      {!notif.is_read && (
        <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full" style={{ background: cfg.color }} />
      )}

      {/* Icon */}
      <div className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center mt-0.5"
        style={{ background: cfg.color + "18" }}>
        <Icon className="w-5 h-5" style={{ color: cfg.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 justify-between">
          <p className={`text-sm font-semibold leading-snug ${!notif.is_read ? "text-white" : "text-white/45"}`}>
            {notif.title}
          </p>
          <span className="text-[11px] text-white/25 shrink-0 mt-0.5">{fmtRelative(notif.created_at)}</span>
        </div>
        <p className={`text-xs mt-1 leading-relaxed ${!notif.is_read ? "text-white/55" : "text-white/28"}`}>
          {notif.body}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold"
            style={{ background: cfg.color + "15", color: cfg.color }}>
            {cfg.label}
          </span>
          {notif.action_url && (
            <Link href={notif.action_url}
              className="flex items-center gap-1 text-xs text-white/28 hover:text-white/60 transition-colors">
              Voir <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0 mt-0.5">
        {!notif.is_read && (
          <button onClick={handleRead} disabled={reading}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/25 hover:text-[#22c55e] hover:bg-[#22c55e]/10 transition-colors disabled:opacity-40"
            title="Marquer comme lu">
            {reading ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle size={14} />}
          </button>
        )}
        <button onClick={handleDelete} disabled={deleting}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40">
          {deleting ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={13} />}
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const supabase = useRef(createClient()).current
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoIdx, setVideoIdx] = useState(0)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [vendorName, setVendorName] = useState("")

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter,  setFilter]  = useState("all")
  const [kpi,     setKpi]     = useState<KPI>({ total: 0, unread: 0, today: 0 })
  const [counts,  setCounts]  = useState<Counts>({ all: 0, unread: 0, order: 0, payment: 0, system: 0 })
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  // Vendor info
  useEffect(() => {
    supabase.auth.getUser().then((res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const user = res.data.user
      if (!user) return
      supabase.from("vendors").select("name").eq("owner_id", user.id).single()
        .then((r: { data: { name: string } | null }) => { if (r.data) setVendorName(r.data.name) })
    })
  }, [supabase])

  // Video
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.src = BACKGROUND_VIDEOS[videoIdx % BACKGROUND_VIDEOS.length]
    video.load()
    const onCanPlay = () => video.play().catch(() => {})
    video.addEventListener("canplay", onCanPlay)
    return () => video.removeEventListener("canplay", onCanPlay)
  }, [videoIdx])

  const toggleSection = (label: string) =>
    setExpandedSections(prev => ({ ...prev, [label]: !prev[label] }))

  // Load notifications
  const load = useCallback(async () => {
    const res = await fetch(`/api/vendor/notifications?filter=${filter}`)
    if (!res.ok) { setLoading(false); return }
    const d = await res.json()
    setNotifications(d.notifications ?? [])
    setKpi(d.kpi ?? { total: 0, unread: 0, today: 0 })
    setCounts(d.counts ?? { all: 0, unread: 0, order: 0, payment: 0, system: 0 })
    setLoading(false)
  }, [filter])

  useEffect(() => { setLoading(true); load() }, [load])

  const markRead = async (id: string) => {
    await fetch("/api/vendor/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_id: id }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setKpi(prev => ({ ...prev, unread: Math.max(0, prev.unread - 1) }))
  }

  const deleteNotif = async (id: string) => {
    await fetch("/api/vendor/notifications", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_id: id }),
    })
    setNotifications(prev => prev.filter(n => n.id !== id))
    setKpi(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }))
    setCounts(prev => ({ ...prev, all: Math.max(0, prev.all - 1) }))
  }

  const markAllRead = async () => {
    setMarkingAll(true)
    await fetch("/api/vendor/notifications", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setKpi(prev => ({ ...prev, unread: 0 }))
    setCounts(prev => ({ ...prev, unread: 0 }))
    setMarkingAll(false)
  }

  // Group notifications by date
  const groups: { key: string; label: string; items: Notification[] }[] = []
  for (const n of notifications) {
    const g = getGroup(n.created_at)
    const label = GROUP_LABEL[g]
    const existing = groups.find(x => x.key === g)
    if (existing) existing.items.push(n)
    else groups.push({ key: g, label, items: [n] })
  }

  const tabCount = (key: string) => {
    if (key === "all")     return counts.all
    if (key === "unread")  return counts.unread
    if (key === "order")   return counts.order
    if (key === "payment") return counts.payment
    if (key === "system")  return counts.system
    return 0
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Background orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#f59e0b] blur-[120px]" />
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.30, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#eab308] blur-[120px]" />
        <motion.div animate={{ scale: [1, 1.25, 1], opacity: [0.1, 0.22, 0.1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full bg-[#f97316] blur-[120px]" />
      </div>

      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-[#111118] border-r border-[#1e1e2e] relative z-10">
        <div className="p-4 border-b border-[#1e1e2e]">
          <Link href="/vendor/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center">
              <span className="text-white font-black text-sm">Q</span>
            </div>
            <div>
              <p className="text-white font-black text-base leading-none">QUICK<span className="text-[#a3e635]">GO</span></p>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">Vendeur</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => {
            const isExpanded     = expandedSections[item.label]
            const Icon           = item.icon
            const anyChildActive = ("expandable" in item && item.expandable) &&
              ("children" in item) && Array.isArray(item.children) &&
              item.children.some((c: { label: string; href: string; active?: boolean }) => c.active)
            return (
              <div key={item.label}>
                {("expandable" in item && item.expandable) ? (
                  <button onClick={() => toggleSection(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                      anyChildActive ? "text-[#a3e635] bg-[#a3e635]/10" : "text-white/50 hover:text-white hover:bg-[#1e1e2e]/60"
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <Link href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      ("active" in item && item.active)
                        ? "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20"
                        : "text-white/50 hover:text-white hover:bg-[#1e1e2e]/60"
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {!!("active" in item && item.active) && <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />}
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
                          <ChevronRight className="w-3 h-3" />{child.label}
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
            className="bg-gradient-to-br from-[#f59e0b]/15 to-[#f97316]/15 border border-[#f59e0b]/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1">
              {kpi.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#f59e0b] text-[#0a0a0f] text-[10px] font-black flex items-center justify-center">
                  {kpi.unread > 9 ? "9+" : kpi.unread}
                </span>
              )}
              <p className="text-white text-xs font-bold">Centre de notifications</p>
            </div>
            <p className="text-white/40 text-[10px]">Toutes vos alertes en un seul endroit</p>
          </motion.div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">

        {/* Header */}
        <div className="relative overflow-hidden bg-[#111118] shrink-0">
          <video ref={videoRef} muted loop playsInline onEnded={() => setVideoIdx(i => i + 1)}
            className="absolute inset-0 w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-transparent to-[#0a0a0f]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111118] via-transparent to-[#111118]" />
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-0 left-1/4 w-40 h-20 rounded-full bg-[#f59e0b] blur-3xl opacity-30" />
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 8, repeat: Infinity, delay: 2 }}
            className="absolute top-0 right-1/3 w-32 h-16 rounded-full bg-[#eab308] blur-3xl opacity-20" />

          <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <motion.div
                  animate={{ rotate: [-8, 8, -8], y: [0, -3, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-2xl bg-[#f59e0b]/20 border border-[#f59e0b]/30 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-[#f59e0b]" />
                </motion.div>
                <h1 className="text-2xl font-black text-white">
                  Centre de{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#f59e0b] to-[#f97316]">
                    Notifications
                  </span>
                </h1>
              </div>
              <p className="text-white/40 text-sm">Commandes, paiements, avis et alertes système</p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => { setLoading(true); load() }}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors">
                <RefreshCw className={`w-4 h-4 text-white/50 ${loading ? "animate-spin" : ""}`} />
              </motion.button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#f59e0b] to-[#f97316] flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm text-white/70 max-w-[100px] truncate">{vendorName || "Vendeur"}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#111118] border-[#1e1e2e] text-white min-w-[160px]">
                  <DropdownMenuItem className="hover:bg-white/5 cursor-pointer gap-2">
                    <User className="w-4 h-4" /> Mon profil
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-white/5 cursor-pointer gap-2">
                    <Settings className="w-4 h-4" /> Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#1e1e2e]" />
                  <DropdownMenuItem className="hover:bg-red-500/10 text-red-400 cursor-pointer gap-2"
                    onClick={() => supabase.auth.signOut().then(() => window.location.href = "/auth/login")}>
                    <LogOut className="w-4 h-4" /> Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">

          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-4">
            <KpiCard label="Notifications"  value={kpi.total}  sub="au total"   color="#f59e0b" Icon={Bell}    delay={0}   />
            <KpiCard label="Non lues"       value={kpi.unread} sub="à traiter"  color="#ef4444" Icon={BellRing} delay={0.1} />
            <KpiCard label="Aujourd'hui"    value={kpi.today}  sub="reçues"     color="#06b6d4" Icon={Clock}   delay={0.2} />
          </div>

          {/* Filter bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1 bg-[#111118]/80 backdrop-blur border border-[#1e1e2e] rounded-2xl p-1">
              {FILTER_TABS.map(tab => {
                const count = tabCount(tab.key)
                return (
                  <button key={tab.key} onClick={() => setFilter(tab.key)}
                    className={`relative px-3.5 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 ${
                      filter === tab.key ? "text-white" : "text-white/35 hover:text-white/60"
                    }`}>
                    {filter === tab.key && (
                      <motion.div layoutId="notif-tab"
                        className="absolute inset-0 rounded-xl bg-[#f59e0b]/15 border border-[#f59e0b]/25" />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                    {count > 0 && (
                      <span className={`relative z-10 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        filter === tab.key ? "bg-[#f59e0b]/20 text-[#f59e0b]" : "bg-white/8 text-white/30"
                      }`}>{count}</span>
                    )}
                  </button>
                )
              })}
            </div>

            {kpi.unread > 0 && (
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={markAllRead} disabled={markingAll}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-xs font-medium hover:bg-[#22c55e]/20 transition-all disabled:opacity-50">
                {markingAll
                  ? <RefreshCw size={13} className="animate-spin" />
                  : <CheckCircle size={13} />}
                Tout marquer comme lu
              </motion.button>
            )}
          </div>

          {/* Notification list */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 text-white/20 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-4">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
                className="w-20 h-20 rounded-3xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center">
                <Bell className="w-9 h-9 text-[#f59e0b]/30" />
              </motion.div>
              <div className="text-center">
                <p className="text-white/40 font-semibold text-sm">Aucune notification</p>
                <p className="text-white/20 text-xs mt-1">
                  {filter !== "all" ? "Essayez un autre filtre" : "Vous êtes à jour !"}
                </p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence mode="popLayout">
                {groups.map(group => (
                  <motion.div key={group.key} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {/* Date group header */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-semibold text-white/30 uppercase tracking-wider">
                        {group.label}
                      </span>
                      <div className="flex-1 h-px bg-white/[0.04]" />
                      <span className="text-[10px] text-white/20">{group.items.length}</span>
                    </div>

                    {/* Cards */}
                    <div className="bg-[#111118]/60 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
                      <AnimatePresence>
                        {group.items.map(n => (
                          <NotifCard key={n.id} notif={n} onRead={markRead} onDelete={deleteNotif} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
