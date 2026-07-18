"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, Clock, Heart, Settings,
  Bell, ChevronDown, Star, MapPin, Truck, ShoppingBag,
  Gift, Wallet, MessageSquare, HelpCircle, Search,
  CheckCircle, ArrowUpRight, Zap, Plus, ShoppingCart,
  ChevronLeft, ChevronRight, Moon, Sun, Crown, Flame,
  MessageCircle, Phone, Bike, Car, Pill, UtensilsCrossed,
  Smartphone, CreditCard, Tag, MoreHorizontal, LogOut, User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"
import { useT } from "@/lib/i18n/context"
import { LanguageSwitcher } from "@/components/ui/language-switcher"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Profile {
  full_name: string; avatar_url: string | null; wallet_balance: number
  points: number; city: string | null; rating: number | null
}
interface OrderRow {
  id: string; order_number: string; status: string; total_amount: number
  created_at: string; estimated_delivery_time: string | null
  vendor: { name: string } | null
  items: { product_name: string; quantity: number }[]
}
interface ProductRow {
  id: string; name: string; price: number; original_price: number | null
  image_url: string | null; rating: number | null
  vendor: { name: string; slug: string } | null
  category: { name: string } | null
}
interface CategoryRow { id: string; name: string; slug: string; icon: string | null; color: string | null }
interface PromoRow {
  id: string; code: string; title: string; description: string
  discount_type: string; discount_value: number; valid_until: string | null
}
interface HomeData {
  profile: Profile | null; recentOrders: OrderRow[]; products: ProductRow[]
  categories: CategoryRow[]; unreadCount: number; cartCount: number
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "nav2.home",         href: "/dashboard",               active: true },
  { icon: ShoppingBag,     label: "nav2.explore",         href: "/marketplace" },
  { icon: Smartphone,      label: "nav2.products",         href: "/marketplace/products" },
  { icon: Package,         label: "nav2.orders",        href: "/marketplace/orders",      badge: "orders" },
  { icon: Clock,           label: "nav2.tracking",    href: "/tracking" },
  { icon: Heart,           label: "nav2.favorites",          href: "/marketplace/favorites" },
  { icon: Wallet,          label: "nav2.wallet",           href: "/wallet" },
  { icon: MessageSquare,   label: "nav2.messages",         href: "/dashboard/messages",      badge: "unread" },
  { icon: Tag,             label: "nav2.promotions",       href: "/marketplace/offers" },
  { icon: HelpCircle,      label: "nav2.support",          href: "/support" },
  { icon: Settings,        label: "nav2.settings",       href: "/dashboard/settings" },
]

const QUICK_ACTIONS = [
  { label: "app.qa.groceries",      icon: ShoppingCart,   href: "/marketplace/shops?cat=supermarche", color: "#22c55e" },
  { label: "app.qa.restaurants",  icon: UtensilsCrossed,href: "/marketplace/shops?cat=restaurant",  color: "#f97316" },
  { label: "app.qa.pharmacy",    icon: Pill,           href: "/marketplace/shops?cat=pharmacie",   color: "#ec4899" },
  { label: "app.qa.delivery",    icon: Bike,           href: "/delivery/create",                   color: "#3b82f6" },
  { label: "app.qa.driver",    icon: Car,            href: "/delivery",                           color: "#8b5cf6" },
  { label: "app.qa.topup",    icon: CreditCard,     href: "/wallet",                            color: "#eab308" },
  { label: "app.qa.more",         icon: MoreHorizontal, href: "/marketplace",                       color: "#06b6d4" },
]

const HERO_SLIDES = [
  { title: "Everything Local.", subtitle: "Delivered Fast.", desc: "Produits, repas, courses, pharmacie et plus…", cta: "Commandez maintenant", href: "/marketplace", from: "#1a237e", to: "#0d47a1", accent: "#3b82f6" },
  { title: "Livraison Express", subtitle: "En 30 min chrono.", desc: "Nos livreurs partenaires disponibles 24h/7j dans toute la ville.", cta: "Commander maintenant", href: "/delivery/create", from: "#1b5e20", to: "#2e7d32", accent: "#22c55e" },
  { title: "Offres du jour", subtitle: "Jusqu'à −50%", desc: "Profitez de nos réductions exclusives sur les restaurants partenaires.", cta: "Voir les offres", href: "/marketplace/offers", from: "#7b1fa2", to: "#4a148c", accent: "#a855f7" },
]

const ORDER_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "app.status.pending",  color: "text-[#eab308]", bg: "bg-[#eab308]/20" },
  confirmed:  { label: "app.status.confirmed",    color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/20" },
  preparing:  { label: "app.status.preparing", color: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/20" },
  ready:      { label: "app.status.ready",        color: "text-[#06b6d4]", bg: "bg-[#06b6d4]/20" },
  delivering: { label: "app.status.delivering",    color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/20" },
  delivered:  { label: "app.status.delivered",       color: "text-[#22c55e]", bg: "bg-[#22c55e]/20" },
  cancelled:  { label: "app.status.cancelled",      color: "text-[#ef4444]", bg: "bg-[#ef4444]/20" },
}

const LEVEL_NAMES = ["Bronze","Argent","Or","Platine","Diamant","Légende","Maître"]
const LEVEL_XP    = [0, 200, 500, 1000, 2000, 4000, 8000]
function getLevel(pts: number) {
  let level = 1
  for (let i = 1; i < LEVEL_XP.length; i++) {
    if (pts >= LEVEL_XP[i]) level = i + 1; else break
  }
  const base = LEVEL_XP[Math.min(level - 1, LEVEL_XP.length - 1)]
  const next = LEVEL_XP[Math.min(level, LEVEL_XP.length - 1)]
  return { level, current: pts - base, max: next - base, name: LEVEL_NAMES[Math.min(level - 1, 6)], nextName: LEVEL_NAMES[Math.min(level, 6)] }
}
function formatCFA(n: number) {
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M FCFA`
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA"
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}

// ─── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(until: string | null) {
  const [remaining, setRemaining] = useState<{ h: number; m: number; s: number } | null>(null)
  useEffect(() => {
    if (!until) return
    const tick = () => {
      const diff = Math.max(0, new Date(until).getTime() - Date.now())
      setRemaining({ h: Math.floor(diff / 3_600_000), m: Math.floor((diff % 3_600_000) / 60_000), s: Math.floor((diff % 60_000) / 1_000) })
    }
    tick()
    const id = setInterval(tick, 1_000)
    return () => clearInterval(id)
  }, [until])
  return remaining
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClientDashboardPage() {
  const { t } = useT()
  const [data, setData] = useState<HomeData | null>(null)
  const [promos, setPromos] = useState<PromoRow[]>([])
  const [loading, setLoading] = useState(true)
  const [heroIdx, setHeroIdx] = useState(0)
  const [orderTab, setOrderTab] = useState<"active"|"done"|"cancelled">("active")
  const [darkMode, setDarkMode] = useState(true)
  const heroTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const startHeroTimer = useCallback(() => {
    if (heroTimer.current) clearInterval(heroTimer.current)
    heroTimer.current = setInterval(() => setHeroIdx((i) => (i + 1) % HERO_SLIDES.length), 4_000)
  }, [])

  useEffect(() => {
    Promise.all([
      fetch("/api/marketplace/home").then((r) => r.ok ? r.json() : null),
      fetch("/api/marketplace/offers").then((r) => r.ok ? r.json() : []),
    ]).then(([home, offers]) => {
      if (home) setData(home)
      setPromos(Array.isArray(offers) ? offers.slice(0, 3) : [])
    }).finally(() => setLoading(false))
    startHeroTimer()
    return () => { if (heroTimer.current) clearInterval(heroTimer.current) }
  }, [startHeroTimer])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/"
  }

  const profile    = data?.profile
  const orders     = data?.recentOrders ?? []
  const products   = data?.products ?? []
  const categories = data?.categories ?? []
  const activeOrders    = orders.filter((o) => !["delivered","cancelled"].includes(o.status))
  const doneOrders      = orders.filter((o) => o.status === "delivered")
  const cancelledOrders = orders.filter((o) => o.status === "cancelled")
  const liveOrder   = activeOrders.find((o) => o.status === "delivering")
  const lvl         = getLevel(profile?.points ?? 0)
  const xpPct       = Math.min(100, lvl.max > 0 ? (lvl.current / lvl.max) * 100 : 0)
  const unreadBadge = data?.unreadCount ?? 0
  const cartBadge   = data?.cartCount ?? 0
  const activeBadge = activeOrders.length

  const tabOrders = orderTab === "active" ? activeOrders : orderTab === "done" ? doneOrders : cancelledOrders

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[#111118] border-r border-[#1e1e2e]">
        {/* Logo */}
        <div className="p-5 border-b border-[#1e1e2e] shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center shrink-0">
              <span className="text-white font-black text-base">Q</span>
            </div>
            <div>
              <p className="text-white font-black text-base leading-none">QUICK<span className="text-[#a3e635]">GO</span></p>
              <p className="text-[9px] text-white/30 leading-none mt-0.5">Everything. Delivered.</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item, idx) => {
            const badge = item.badge === "unread" ? unreadBadge : item.badge === "orders" ? activeBadge : 0
            return (
              <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}>
                <Link href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${
                    item.active
                      ? "bg-[#a3e635]/10 border-l-2 border-[#a3e635] text-[#a3e635] rounded-r-xl pl-[10px]"
                      : "rounded-xl text-white/40 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1">{t(item.label)}</span>
                  {badge > 0 && (
                    <span className="bg-[#3b82f6] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-5 text-center">{badge}</span>
                  )}
                </Link>
              </motion.div>
            )
          })}
        </nav>

        {/* Premium card */}
        <div className="px-3 pb-3 shrink-0">
          <div className="bg-gradient-to-br from-[#eab308]/20 to-[#f97316]/15 border border-[#eab308]/25 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <Crown className="w-4 h-4 text-[#eab308]" />
              <span className="text-white text-sm font-semibold">QuickGo Premium</span>
            </div>
            <p className="text-white/40 text-xs mb-3 leading-relaxed">Livraison gratuite, offres exclusives et plus</p>
            <Link href="/wallet/rewards">
              <Button size="sm" className="w-full h-8 bg-[#eab308] hover:bg-[#eab308]/90 text-black rounded-lg text-xs font-bold">
                Devenir Premium
              </Button>
            </Link>
          </div>
        </div>

        {/* User profile + XP + dark mode */}
        <div className="border-t border-[#1e1e2e] p-4 shrink-0 space-y-3">
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              <Image src={profile.avatar_url} alt="avatar" width={38} height={38} className="rounded-xl object-cover w-[38px] h-[38px]" />
            ) : (
              <div className="w-[38px] h-[38px] rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">{profile ? initials(profile.full_name) : "?"}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{profile?.full_name?.split(" ")[0] ?? "…"}</p>
              <div className="flex items-center gap-1.5">
                <Star className="w-3 h-3 text-[#eab308] fill-current" />
                <span className="text-xs text-white/40">{(profile?.rating ?? 4.9).toFixed(1)} · Niveau {lvl.level}</span>
              </div>
            </div>
          </div>
          {/* XP bar */}
          <div>
            <div className="flex justify-between text-[10px] text-white/30 mb-1">
              <span>{lvl.current} XP</span>
              <span>{lvl.max} XP</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-[#eab308] to-[#f97316]"
                initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 0.8 }} />
            </div>
          </div>
          {/* Dark mode toggle */}
          <button onClick={() => setDarkMode((v) => !v)}
            className="flex items-center justify-between w-full text-white/40 hover:text-white transition-colors"
          >
            <div className="flex items-center gap-2 text-xs">
              {darkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              <span>Mode Sombre</span>
            </div>
            <div className={`w-9 h-5 rounded-full transition-colors relative ${darkMode ? "bg-[#a3e635]" : "bg-white/20"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${darkMode ? "left-[18px]" : "left-0.5"}`} />
            </div>
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-auto">

        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-[#1e1e2e] px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <button className="flex items-center gap-2 bg-[#16161f] border border-[#1e1e2e] px-3 py-1.5 rounded-full hover:border-[#3b82f6]/40 transition-colors">
              <MapPin className="w-3.5 h-3.5 text-[#3b82f6]" />
              <span className="text-white text-sm">{profile?.city ?? "Yaoundé"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/30" />
            </button>

            <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input type="text" placeholder="Rechercher un produit, un vendeur..."
                className="w-full bg-[#16161f] border border-[#1e1e2e] rounded-full pl-10 pr-10 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#3b82f6]/50" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#3b82f6] flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher className="hidden sm:inline-flex" />
              <Link href="/notifications" className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
                <Bell className="w-5 h-5 text-white/40" />
                {unreadBadge > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-[#ef4444] rounded-full animate-pulse" />}
              </Link>
              <Link href="/marketplace/cart" className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
                <ShoppingCart className="w-5 h-5 text-white/40" />
                {cartBadge > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#3b82f6] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {cartBadge}
                  </span>
                )}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 pl-3 border-l border-[#1e1e2e] hover:opacity-90 transition-opacity focus:outline-none">
                    {loading ? (
                      <div className="w-9 h-9 rounded-xl bg-[#16161f] animate-pulse" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center border-2 border-[#a3e635]/60 shrink-0 shadow-[0_0_12px_rgba(163,230,53,0.25)]">
                        <span className="text-white font-bold text-xs">{profile ? initials(profile.full_name) : "?"}</span>
                      </div>
                    )}
                    <div className="hidden md:block text-left">
                      <p className="text-white text-sm font-medium leading-tight">{profile?.full_name?.split(" ")[0] ?? "…"}</p>
                      <p className="text-[10px] text-[#a3e635]">{lvl.name} · Niv. {lvl.level}</p>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-[#16161f] border-[#1e1e2e]">
                  <div className="px-3 py-2 border-b border-[#1e1e2e]">
                    <p className="text-white text-sm font-semibold truncate">{profile?.full_name ?? "Mon compte"}</p>
                    <p className="text-[#a3e635] text-xs">{lvl.name} · Niveau {lvl.level}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer">
                      <User className="h-4 w-4" /> Mon profil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings" className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer">
                      <Settings className="h-4 w-4" /> Paramètres
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#1e1e2e]" />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2 text-red-400 hover:text-red-300 cursor-pointer focus:text-red-300"
                  >
                    <LogOut className="h-4 w-4" /> Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="grid lg:grid-cols-3 gap-6">

            {/* ── Left 2-col ─────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Hero carousel */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="relative rounded-3xl overflow-hidden h-52 cursor-pointer group"
                style={{ background: `linear-gradient(135deg, ${HERO_SLIDES[heroIdx].from}, ${HERO_SLIDES[heroIdx].to})` }}
              >
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-20 -translate-y-1/3 translate-x-1/4"
                  style={{ background: HERO_SLIDES[heroIdx].accent }} />
                <div className="relative z-10 p-7 flex flex-col justify-between h-full">
                  <div>
                    <AnimatePresence mode="wait">
                      <motion.div key={heroIdx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                        <p className="text-white/70 text-sm font-medium mb-0.5">{HERO_SLIDES[heroIdx].desc}</p>
                        <h2 className="text-white text-3xl font-black leading-tight">{HERO_SLIDES[heroIdx].title}</h2>
                        <h2 className="text-3xl font-black leading-tight" style={{ color: HERO_SLIDES[heroIdx].accent }}>{HERO_SLIDES[heroIdx].subtitle}</h2>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="flex items-center justify-between">
                    <Link href={HERO_SLIDES[heroIdx].href}>
                      <Button className="rounded-full h-9 px-5 text-sm font-semibold text-black" style={{ background: HERO_SLIDES[heroIdx].accent }}>
                        {HERO_SLIDES[heroIdx].cta} →
                      </Button>
                    </Link>
                    <div className="flex gap-1.5">
                      {HERO_SLIDES.map((_, i) => (
                        <button key={i} onClick={() => { setHeroIdx(i); startHeroTimer() }}
                          className={`rounded-full transition-all ${i === heroIdx ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/30"}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {/* Arrow controls */}
                <button onClick={() => { setHeroIdx((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length); startHeroTimer() }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronLeft className="w-4 h-4 text-white" />
                </button>
                <button onClick={() => { setHeroIdx((i) => (i + 1) % HERO_SLIDES.length); startHeroTimer() }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className="w-4 h-4 text-white" />
                </button>
              </motion.div>

              {/* Actions rapides */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">{t("dash.quickActions")}</h3>
                  <Link href="/marketplace" className="text-[#3b82f6] text-xs flex items-center gap-1 hover:opacity-80 transition-opacity">
                    Tout voir <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {QUICK_ACTIONS.map((action, i) => (
                    <Link key={action.href} href={action.href}>
                      <motion.div whileHover={{ y: -3, scale: 1.05 }} transition={{ duration: 0.15 }}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.05 } }}
                        className="flex flex-col items-center gap-2 cursor-pointer"
                      >
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-[#1e1e2e] hover:border-[#3b82f6]/30 transition-colors"
                          style={{ background: `${action.color}20` }}>
                          <action.icon className="w-5 h-5" style={{ color: action.color }} />
                        </div>
                        <span className="text-[10px] text-white/50 font-medium text-center leading-tight">{t(action.label)}</span>
                      </motion.div>
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Recommandé pour vous */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Recommandé pour vous</h3>
                  <Link href="/marketplace/products" className="text-[#3b82f6] text-xs flex items-center gap-1 hover:opacity-80 transition-opacity">
                    Tout voir <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                {loading ? (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="w-44 shrink-0 h-56 rounded-2xl bg-[#16161f] animate-pulse" />
                    ))}
                  </div>
                ) : products.length === 0 ? (
                  <div className="text-center py-8 text-white/30 text-sm">Aucun produit disponible</div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {products.map((p, i) => (
                      <ProductCard key={p.id} product={p} delay={i * 0.04} />
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Offres spéciales */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Offres spéciales</h3>
                  <Link href="/marketplace/offers" className="text-[#3b82f6] text-xs flex items-center gap-1 hover:opacity-80 transition-opacity">
                    {t("nav2.seeAll")} <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                {loading ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    {[0,1,2].map((i) => <div key={i} className="h-36 rounded-2xl bg-[#16161f] animate-pulse" />)}
                  </div>
                ) : promos.length === 0 ? (
                  <div className="text-center py-8 rounded-2xl bg-[#16161f] border border-[#1e1e2e]">
                    <Gift className="w-7 h-7 text-white/10 mx-auto mb-2" />
                    <p className="text-white/30 text-sm">Aucune offre disponible pour le moment</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    {promos.map((p, i) => (
                      <PromoCard key={p.id} promo={p} colorIdx={i} />
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* ── Right column ──────────────────────────────────────────────── */}
            <div className="space-y-5">

              {/* Mon Wallet */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-[#3b82f6]/25 to-[#06b6d4]/15 rounded-3xl p-5 border border-[#3b82f6]/25"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-semibold text-sm">Mon Wallet</span>
                  <Link href="/wallet" className="text-[#3b82f6] text-xs hover:opacity-80 transition-opacity">{t("nav2.seeAll")}</Link>
                </div>
                <p className="text-xs text-white/40 mb-1">{t("dash.balance")}</p>
                {loading ? (
                  <div className="h-8 w-36 bg-white/10 rounded animate-pulse mb-1" />
                ) : (
                  <p className="text-3xl font-bold text-white mb-0.5">{formatCFA(profile?.wallet_balance ?? 0)}</p>
                )}
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {[
                    { label: "Orange\nMoney", color: "#f97316", emoji: "🟠" },
                    { label: "MTN\nMoMo",     color: "#eab308", emoji: "🟡" },
                    { label: "Historique",    color: "#06b6d4", emoji: "📋" },
                    { label: "Coupons",       color: "#a3e635", emoji: "🏷️" },
                  ].map((item) => (
                    <Link key={item.label} href="/wallet">
                      <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                        <span className="text-xl">{item.emoji}</span>
                        <span className="text-[9px] text-white/40 text-center leading-tight whitespace-pre-line">{item.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link href="/wallet" className="block mt-3">
                  <Button className="w-full rounded-xl bg-[#3b82f6] hover:bg-[#3b82f6]/90 h-9 text-sm">
                    <Plus className="w-4 h-4 mr-2" /> Recharger
                  </Button>
                </Link>
              </motion.div>

              {/* Mes commandes (avec tabs) */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                className="bg-[#16161f]/80 backdrop-blur-xl rounded-3xl p-5 border border-[#1e1e2e]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm">{t("dash.myOrders")}</h3>
                  <Link href="/marketplace/orders" className="text-[#3b82f6] text-xs hover:opacity-80 transition-opacity">{t("nav2.seeAll")}</Link>
                </div>
                {/* Tabs */}
                <div className="flex gap-1 mb-4 bg-[#0a0a0f] rounded-xl p-1">
                  {(["active","done","cancelled"] as const).map((tab) => (
                    <button key={tab} onClick={() => setOrderTab(tab)}
                      className={`flex-1 text-[10px] font-medium py-1.5 rounded-lg transition-colors ${
                        orderTab === tab ? "bg-[#1e1e2e] text-white" : "text-white/30 hover:text-white/60"
                      }`}
                    >
                      {tab === "active" ? "En cours" : tab === "done" ? "Terminées" : "Annulées"}
                    </button>
                  ))}
                </div>
                {loading ? (
                  <div className="space-y-2">{[0,1].map((i) => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}</div>
                ) : tabOrders.length === 0 ? (
                  <div className="text-center py-6">
                    <Package className="w-7 h-7 text-white/10 mx-auto mb-2" />
                    <p className="text-white/30 text-xs">{t("dash.noOrders")}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tabOrders.slice(0, 3).map((order) => {
                      const cfg = ORDER_STATUS[order.status] ?? ORDER_STATUS["pending"]
                      return (
                        <div key={order.id} className="flex items-center gap-3 p-3 bg-[#1c1c28] rounded-xl hover:bg-[#1e1e2e] transition-colors">
                          <div className="w-9 h-9 rounded-xl bg-[#3b82f6]/20 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-[#3b82f6]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">{(order.vendor as { name?: string } | null)?.name ?? "—"}</p>
                            <p className="text-[10px] text-white/30">#{order.order_number} · {formatDate(order.created_at)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{t(cfg.label)}</span>
                            <p className="text-[10px] text-white/30 mt-0.5">{formatCFA(order.total_amount)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>

              {/* Suivi en direct */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                className="bg-[#16161f]/80 backdrop-blur-xl rounded-3xl p-5 border border-[#1e1e2e]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm">Suivi en direct</h3>
                  <Link href="/tracking" className="text-[#3b82f6] text-xs hover:opacity-80 transition-opacity">Voir sur la carte</Link>
                </div>
                {liveOrder ? (
                  <div>
                    {/* Mini map placeholder */}
                    <div className="relative h-24 rounded-2xl bg-gradient-to-br from-[#0d1117] to-[#161b22] border border-[#1e1e2e] overflow-hidden mb-3">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 200 80" className="w-full h-full opacity-30">
                          <path d="M20,60 Q60,20 100,40 Q140,60 180,30" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="4 2" />
                          <circle cx="20" cy="60" r="5" fill="#8b5cf6" />
                          <circle cx="180" cy="30" r="5" fill="#22c55e" />
                          <circle cx="110" cy="38" r="7" fill="#3b82f6" stroke="#fff" strokeWidth="1.5" />
                          <text x="115" y="42" fontSize="8" fill="white">🛵</text>
                        </svg>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#3b82f6]/20 border-2 border-[#3b82f6]/50 flex items-center justify-center shrink-0">
                        <Bike className="w-5 h-5 text-[#3b82f6]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{(liveOrder as { driver_rel?: { user?: { full_name?: string } | null } | null })?.driver_rel?.user?.full_name ?? "Livreur"}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-[#eab308] fill-current" />
                          <span className="text-xs text-white/40">4.9 · Votre commande arrive dans</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[#a3e635] font-bold text-sm">
                          {liveOrder.estimated_delivery_time ? Math.max(0, Math.round((new Date(liveOrder.estimated_delivery_time).getTime() - Date.now()) / 60_000)) + " min" : "~12 min"}
                        </p>
                      </div>
                    </div>
                    <Link href="/tracking" className="block mt-3">
                      <Button className="w-full rounded-xl bg-[#3b82f6] hover:bg-[#3b82f6]/90 h-9 text-sm">
                        Suivre ma commande
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Truck className="w-8 h-8 mx-auto text-white/10 mb-2" />
                    <p className="text-white/30 text-xs">Aucune livraison en cours</p>
                    <Link href="/marketplace">
                      <Button size="sm" className="mt-3 rounded-xl bg-[#3b82f6]/20 text-[#3b82f6] hover:bg-[#3b82f6]/30 h-8 text-xs">
                        Commander maintenant
                      </Button>
                    </Link>
                  </div>
                )}
              </motion.div>

              {/* Points */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="bg-[#16161f]/80 backdrop-blur-xl rounded-3xl p-5 border border-[#1e1e2e]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold text-sm">Mes points</h3>
                  <Star className="w-4 h-4 text-[#eab308] fill-current" />
                </div>
                {loading ? (
                  <div className="h-10 w-24 bg-white/10 rounded animate-pulse mx-auto" />
                ) : (
                  <>
                    <div className="text-center mb-3">
                      <p className="text-4xl font-bold text-white">{(profile?.points ?? 0).toLocaleString("fr-FR")}</p>
                      <p className="text-xs text-white/40 mt-0.5">{lvl.name} · Niveau {lvl.level}</p>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 mb-1.5 overflow-hidden">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-[#eab308] to-[#f97316]"
                        initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 0.8 }} />
                    </div>
                    <p className="text-[10px] text-white/30 text-center mb-3">Encore {Math.max(0, lvl.max - lvl.current)} points pour {lvl.nextName}</p>
                  </>
                )}
                <Link href="/marketplace/offers">
                  <Button variant="outline" className="w-full rounded-xl border-[#1e1e2e] text-white/60 hover:text-white h-9 text-sm">
                    Échanger mes points
                  </Button>
                </Link>
              </motion.div>

              {/* Besoin d'aide */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
                className="bg-[#16161f]/80 backdrop-blur-xl rounded-3xl p-5 border border-[#1e1e2e]"
              >
                <p className="text-white font-semibold text-sm mb-1">Besoin d&apos;aide ?</p>
                <p className="text-white/40 text-xs mb-4">Notre équipe est là pour vous.</p>
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/support">
                    <Button variant="outline" className="w-full h-10 rounded-xl border-[#1e1e2e] text-white/60 hover:text-white text-xs gap-2">
                      <MessageCircle className="w-3.5 h-3.5" /> Chat en direct
                    </Button>
                  </Link>
                  <a href="https://wa.me/237600000000" target="_blank" rel="noopener noreferrer">
                    <Button className="w-full h-10 rounded-xl bg-[#22c55e]/20 hover:bg-[#22c55e]/30 text-[#22c55e] border-0 text-xs gap-2">
                      <Phone className="w-3.5 h-3.5" /> WhatsApp
                    </Button>
                  </a>
                </div>
              </motion.div>

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── PromoCard (avec countdown) ──────────────────────────────────────────────
const PROMO_COLORS = [
  { from: "#1e3a5f", to: "#0d47a1", accent: "#3b82f6", label: "LIVRAISON EXPRESS" },
  { from: "#1a3a1a", to: "#1b5e20", accent: "#22c55e", label: "COURSES DU JOUR" },
  { from: "#3b1a5f", to: "#4a148c", accent: "#a855f7", label: "RESTAURANTS" },
]

function PromoCard({ promo, colorIdx }: { promo: PromoRow; colorIdx: number }) {
  const cfg = PROMO_COLORS[colorIdx % PROMO_COLORS.length]
  const countdown = useCountdown(promo.valid_until)
  const discountLabel = promo.discount_type === "percent" ? `-${promo.discount_value}%` : `-${promo.discount_value} FCFA`

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}
      className="rounded-2xl relative overflow-hidden cursor-pointer"
      style={{ background: `linear-gradient(135deg, ${cfg.from}, ${cfg.to})` }}
    >
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute top-0 right-0 w-28 h-28 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2"
        style={{ background: cfg.accent }} />
      <div className="relative z-10 p-4">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 inline-block"
          style={{ background: `${cfg.accent}30`, color: cfg.accent }}>
          {cfg.label}
        </span>
        <p className="text-white/60 text-xs mb-0.5">{promo.description}</p>
        <p className="text-white font-black text-3xl leading-none mb-3" style={{ color: cfg.accent }}>
          {discountLabel}
        </p>
        {countdown && (
          <div className="flex items-center gap-1 mb-3">
            <Clock className="w-3 h-3 text-white/40" />
            <span className="text-[10px] text-white/40">Expire dans </span>
            <span className="text-[10px] font-bold" style={{ color: cfg.accent }}>
              {String(countdown.h).padStart(2,"0")}:{String(countdown.m).padStart(2,"0")}:{String(countdown.s).padStart(2,"0")}
            </span>
          </div>
        )}
        <Link href="/marketplace/offers">
          <Button size="sm" className="rounded-full h-7 text-xs px-4 border-0 font-semibold"
            style={{ background: `${cfg.accent}30`, color: cfg.accent }}>
            Profiter →
          </Button>
        </Link>
      </div>
    </motion.div>
  )
}

// ─── ProductCard ──────────────────────────────────────────────────────────────
function ProductCard({ product, delay }: { product: ProductRow; delay: number }) {
  const img = product.image_url ?? (product as { images?: string[] | null }).images?.[0] ?? null
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0, transition: { delay } }}
      whileHover={{ y: -3 }} transition={{ duration: 0.15 }}
      className="w-44 shrink-0"
    >
      <Link href={`/marketplace/product/${product.id}`}
        className="block bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden hover:border-[#3b82f6]/30 transition-all group"
      >
        <div className="relative h-32 bg-gradient-to-br from-[#1c1c28] to-[#0a0a0f]">
          {img ? (
            <Image src={img} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="176px" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-white/10" />
            </div>
          )}
          <button className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 hover:text-red-400 transition-colors"
            onClick={(e) => e.preventDefault()}>
            <Heart className="w-3 h-3 text-white" />
          </button>
        </div>
        <div className="p-3">
          <p className="text-white text-xs font-semibold leading-tight line-clamp-2 mb-1">{product.name}</p>
          <p className="text-[10px] text-white/30 mb-2 truncate">{product.vendor?.name ?? "—"}</p>
          <div className="flex items-center justify-between">
            <p className="text-[#a3e635] font-bold text-sm">{new Intl.NumberFormat("fr-FR").format(product.price)}<span className="text-[9px] text-white/30 font-normal ml-0.5">F</span></p>
            {product.rating != null && (
              <span className="flex items-center gap-0.5 text-[10px] text-[#eab308]">
                <Star className="w-2.5 h-2.5 fill-current" /> {product.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

