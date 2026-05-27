"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  LayoutDashboard, Package, Clock, Heart, CreditCard, Settings,
  Bell, ChevronDown, ChevronRight, Star, MapPin, Truck, ShoppingBag,
  Gift, TrendingUp, Wallet, MessageSquare, HelpCircle, Search,
  Sparkles, CheckCircle, RefreshCw, ArrowUpRight, Zap,
  UtensilsCrossed, Pill, Smartphone, Shirt, Coffee,
} from "lucide-react"
import { Button } from "@/components/ui/button"

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
  driver_rel: { user: { full_name: string; phone: string } | null } | null
}
interface CategoryRow { id: string; name: string; slug: string; icon: string | null; color: string | null }
interface PromoRow { id: string; code: string; title: string; description: string; discount_type: string; discount_value: number }
interface HomeData {
  profile: Profile | null; recentOrders: OrderRow[]; categories: CategoryRow[]
  unreadCount: number; cartCount: number
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Tableau de bord",  href: "/dashboard",           active: true },
  { icon: ShoppingBag,     label: "Commander",         href: "/marketplace" },
  { icon: Package,         label: "Mes commandes",     href: "/marketplace/orders",  badge: "orders" },
  { icon: Clock,           label: "En cours",          href: "/tracking" },
  { icon: Heart,           label: "Favoris",           href: "/marketplace/favorites" },
  { icon: Wallet,          label: "Portefeuille",      href: "/wallet" },
  { icon: Gift,            label: "Récompenses",       href: "/marketplace/offers" },
  { icon: MessageSquare,   label: "Messages",          href: "/dashboard/messages",  badge: "unread" },
  { icon: HelpCircle,      label: "Support",           href: "/support" },
  { icon: Settings,        label: "Paramètres",        href: "/dashboard/settings" },
]

const CAT_ICONS: Record<string, typeof ShoppingBag> = {
  restaurant: UtensilsCrossed, pharmacie: Pill,
  electronique: Smartphone, mode: Shirt, cafe: Coffee,
  supermarche: ShoppingBag,
}

const PROMO_GRADIENTS = [
  { from: "#3b82f6", to: "#06b6d4" },
  { from: "#ea580c", to: "#dc2626" },
  { from: "#16a34a", to: "#059669" },
  { from: "#8b5cf6", to: "#ec4899" },
]

const ORDER_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "En attente",   color: "text-[#eab308]", bg: "bg-[#eab308]/20" },
  confirmed:  { label: "Confirmé",     color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/20" },
  preparing:  { label: "Préparation",  color: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/20" },
  ready:      { label: "Prêt",         color: "text-[#06b6d4]", bg: "bg-[#06b6d4]/20" },
  delivering: { label: "En route",     color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/20" },
  delivered:  { label: "Livré",        color: "text-[#22c55e]", bg: "bg-[#22c55e]/20" },
  cancelled:  { label: "Annulé",       color: "text-[#ef4444]", bg: "bg-[#ef4444]/20" },
}

const LEVEL_XP = [0, 200, 500, 1000, 2000, 4000, 8000]
function getLevel(pts: number) {
  let level = 1
  for (let i = 1; i < LEVEL_XP.length; i++) {
    if (pts >= LEVEL_XP[i]) level = i + 1; else break
  }
  const base = LEVEL_XP[Math.min(level - 1, LEVEL_XP.length - 1)]
  const next = LEVEL_XP[Math.min(level, LEVEL_XP.length - 1)]
  const nextName = ["Bronze","Argent","Or","Platine","Diamant","Légende","Maître"][Math.min(level, 6)]
  return { level, current: pts - base, max: next - base, nextName }
}

function formatCFA(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FCFA`
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA"
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClientDashboardPage() {
  const [data, setData] = useState<HomeData | null>(null)
  const [promos, setPromos] = useState<PromoRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/marketplace/home").then((r) => r.ok ? r.json() : null),
      fetch("/api/marketplace/offers").then((r) => r.ok ? r.json() : []),
    ]).then(([home, offers]) => {
      if (home) setData(home)
      setPromos(Array.isArray(offers) ? offers.slice(0, 2) : [])
    }).finally(() => setLoading(false))
  }, [])

  const profile = data?.profile
  const orders = data?.recentOrders ?? []
  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.status))
  const liveOrder = activeOrders.find((o) => o.status === "delivering")
  const categories = (data?.categories ?? []).slice(0, 4)
  const lvl = getLevel(profile?.points ?? 0)
  const xpPct = Math.min(100, lvl.max > 0 ? (lvl.current / lvl.max) * 100 : 0)
  const unreadBadge = data?.unreadCount ?? 0
  const activeBadge = activeOrders.length

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-[#111118] border-r border-[#1e1e2e]">
        {/* Logo */}
        <div className="p-5 border-b border-[#1e1e2e]">
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
                  <item.icon className="w-4.5 h-4.5 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {badge > 0 && (
                    <span className="bg-[#3b82f6] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-5 text-center">
                      {badge}
                    </span>
                  )}
                </Link>
              </motion.div>
            )
          })}
        </nav>

        {/* AI Card */}
        <div className="p-3 border-t border-[#1e1e2e]">
          <div className="bg-gradient-to-br from-[#8b5cf6]/20 to-[#ec4899]/15 border border-[#8b5cf6]/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#8b5cf6]" />
              <span className="text-white text-sm font-semibold">Assistant IA</span>
            </div>
            <p className="text-white/40 text-xs mb-3">Besoin d&apos;aide pour votre commande ?</p>
            <Link href="/ai">
              <Button size="sm" className="w-full h-8 bg-[#8b5cf6]/30 hover:bg-[#8b5cf6]/40 text-[#8b5cf6] border-0 rounded-lg text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Demander
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-[#1e1e2e] px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 bg-[#16161f] border border-[#1e1e2e] px-3 py-1.5 rounded-full">
              <MapPin className="w-3.5 h-3.5 text-[#3b82f6]" />
              <span className="text-white text-sm">Yaoundé</span>
              <ChevronDown className="w-3.5 h-3.5 text-white/30" />
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input type="text" placeholder="Rechercher produits, restaurants..."
                className="w-full bg-[#16161f] border border-[#1e1e2e] rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#3b82f6]/50" />
            </div>

            <div className="flex items-center gap-3">
              <Link href="/notifications" className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
                <Bell className="w-5 h-5 text-white/40" />
                {unreadBadge > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-[#ef4444] rounded-full" />}
              </Link>
              <div className="flex items-center gap-2 pl-3 border-l border-[#1e1e2e]">
                {loading ? (
                  <div className="w-9 h-9 rounded-xl bg-[#16161f] animate-pulse" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center border-2 border-[#a3e635]/30 shrink-0">
                    <span className="text-white font-bold text-xs">{profile ? initials(profile.full_name) : "?"}</span>
                  </div>
                )}
                <div className="hidden md:block">
                  <p className="text-white text-sm font-medium leading-tight">{profile?.full_name?.split(" ")[0] ?? "…"}</p>
                  <p className="text-[10px] text-[#a3e635]">Niveau {lvl.level}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-white/30" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="grid lg:grid-cols-3 gap-6">

            {/* ── Left 2-col ─────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Welcome card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-[#3b82f6]/20 via-[#06b6d4]/10 to-[#a3e635]/10 rounded-3xl p-6 border border-[#3b82f6]/30"
              >
                {loading ? (
                  <div className="space-y-3">
                    <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
                    <div className="h-4 w-72 bg-white/5 rounded animate-pulse" />
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-white mb-1">
                        Bonjour, {profile?.full_name?.split(" ")[0] ?? "là"} <span>👋</span>
                      </h1>
                      <p className="text-white/50 text-sm">Que souhaitez-vous commander aujourd&apos;hui ?</p>
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-[#eab308] fill-current" />
                          <span className="text-white font-semibold">{(profile?.points ?? 0).toLocaleString("fr-FR")}</span>
                          <span className="text-xs text-white/40">points</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-[#3b82f6]" />
                          <span className="text-white font-semibold">{orders.length}</span>
                          <span className="text-xs text-white/40">commandes récentes</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 shrink-0">
                      <Link href="/marketplace">
                        <Button className="rounded-full bg-[#3b82f6] hover:bg-[#3b82f6]/90 text-white gap-2">
                          <ShoppingBag className="w-4 h-4" /> Commander
                        </Button>
                      </Link>
                      <Link href="/delivery/create">
                        <Button variant="outline" className="rounded-full border-[#1e1e2e] gap-2">
                          <Truck className="w-4 h-4" /> Livraison
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Commandes",  value: orders.length,               icon: Package,    color: "#3b82f6" },
                  { label: "En cours",   value: activeOrders.length,          icon: Clock,      color: "#f97316" },
                  { label: "Favoris",    value: 0,                            icon: Heart,      color: "#ef4444" },
                  { label: "Solde",      value: profile?.wallet_balance ?? 0, icon: TrendingUp, color: "#a3e635", isCFA: true },
                ].map((stat, i) => (
                  <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                    whileHover={{ y: -2 }}
                    className="bg-[#16161f]/80 backdrop-blur-xl rounded-2xl p-4 border border-[#1e1e2e] hover:border-[#3b82f6]/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.06)] transition-all duration-300"
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `${stat.color}20` }}>
                      <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                    </div>
                    {loading ? (
                      <div className="h-7 w-12 bg-white/10 rounded animate-pulse mb-1" />
                    ) : (
                      <p className="text-2xl font-bold text-white">
                        {stat.isCFA ? formatCFA(stat.value as number).replace(" FCFA","") : stat.value}
                        {stat.isCFA && <span className="text-xs text-white/40 font-normal ml-1">F</span>}
                      </p>
                    )}
                    <p className="text-xs text-white/40">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Categories */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="bg-[#16161f]/80 backdrop-blur-xl rounded-3xl p-5 border border-[#1e1e2e]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Catégories</h3>
                  <Link href="/marketplace" className="text-[#3b82f6] text-xs flex items-center gap-1 hover:text-[#3b82f6]/80 transition-colors">
                    Voir tout <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                {loading ? (
                  <div className="grid grid-cols-4 gap-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {categories.length > 0 ? categories.map((cat) => {
                      const Icon = CAT_ICONS[cat.slug] ?? ShoppingBag
                      return (
                        <Link key={cat.id} href={`/marketplace/shops?cat=${cat.slug}`}>
                          <motion.div whileHover={{ y: -2, scale: 1.02 }} transition={{ duration: 0.15 }}
                            className="bg-[#1c1c28] hover:bg-[#1e1e2e] rounded-2xl p-4 text-center transition-colors border border-transparent hover:border-[#1e1e2e] cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center"
                              style={{ background: `${cat.color ?? "#3b82f6"}20` }}>
                              {cat.icon ? (
                                <span className="text-xl">{cat.icon}</span>
                              ) : (
                                <Icon className="w-5 h-5" style={{ color: cat.color ?? "#3b82f6" }} />
                              )}
                            </div>
                            <p className="text-white font-medium text-xs">{cat.name}</p>
                          </motion.div>
                        </Link>
                      )
                    }) : (
                      [
                        { label: "Restaurants", icon: "🍔", href: "/marketplace/shops?cat=restaurant", color: "#f97316" },
                        { label: "Pharmacies",  icon: "💊", href: "/marketplace/shops?cat=pharmacie",  color: "#ec4899" },
                        { label: "Supermarchés",icon: "🛒", href: "/marketplace/shops?cat=supermarche",color: "#22c55e" },
                        { label: "Mode",        icon: "👗", href: "/marketplace/shops?cat=mode",       color: "#8b5cf6" },
                      ].map((cat) => (
                        <Link key={cat.label} href={cat.href}>
                          <div className="bg-[#1c1c28] rounded-2xl p-4 text-center hover:bg-[#1e1e2e] transition-colors">
                            <span className="text-2xl mb-2 block">{cat.icon}</span>
                            <p className="text-white font-medium text-xs">{cat.label}</p>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                )}
              </motion.div>

              {/* Promos */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">Offres spéciales</h3>
                  <Link href="/marketplace/offers" className="text-[#3b82f6] text-xs flex items-center gap-1 hover:text-[#3b82f6]/80 transition-colors">
                    Voir tout <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                {loading ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {[0, 1].map((i) => <div key={i} className="h-32 rounded-2xl bg-[#16161f] animate-pulse" />)}
                  </div>
                ) : promos.length === 0 ? (
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      { title: "Livraison Gratuite", desc: "Sur votre prochaine commande", code: "FREE2024", gi: 0 },
                      { title: "-30% Restaurants",   desc: "Ce weekend seulement",         code: "WEEKEND30", gi: 1 },
                    ].map((p) => (
                      <PromoCard key={p.code} title={p.title} desc={p.desc} code={p.code} gi={p.gi} />
                    ))}
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {promos.map((p, i) => (
                      <PromoCard key={p.code} title={p.title} desc={p.description} code={p.code} gi={i} />
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* ── Right column ──────────────────────────────────────────────── */}
            <div className="space-y-5">

              {/* Live order tracking */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="bg-[#16161f]/80 backdrop-blur-xl rounded-3xl p-5 border border-[#1e1e2e]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-sm">Commande en cours</h3>
                  {liveOrder && (
                    <span className="flex items-center gap-1 text-xs text-[#22c55e]">
                      <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" /> Live
                    </span>
                  )}
                </div>
                {loading ? (
                  <div className="h-28 rounded-2xl bg-white/5 animate-pulse" />
                ) : liveOrder ? (
                  <div className="bg-[#1c1c28] rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/20 flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-5 h-5 text-[#3b82f6]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm truncate">{(liveOrder.vendor as { name?: string } | null)?.name ?? "Vendeur"}</p>
                        <p className="text-xs text-white/30">#{liveOrder.order_number}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[#a3e635] font-bold text-sm">
                          {liveOrder.estimated_delivery_time ? Math.max(0, Math.round((new Date(liveOrder.estimated_delivery_time).getTime() - Date.now()) / 60000)) + " min" : "—"}
                        </p>
                        <p className="text-[10px] text-white/30">ETA</p>
                      </div>
                    </div>
                    <div className="flex justify-between mb-3">
                      {[{ label: "Confirmé", done: true }, { label: "Prépare", done: true }, { label: "En route", active: true }, { label: "Livré", done: false }].map((s, i) => (
                        <div key={s.label} className="flex flex-col items-center gap-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors ${
                            s.active ? "border-[#3b82f6] bg-[#3b82f6] animate-pulse" :
                            s.done   ? "border-[#22c55e] bg-[#22c55e]" : "border-white/20 bg-transparent"
                          }`}>
                            {s.done ? <CheckCircle className="w-3.5 h-3.5 text-white" /> :
                             s.active ? <Truck className="w-3 h-3 text-white" /> :
                             <span className="w-1.5 h-1.5 rounded-full bg-white/20" />}
                          </div>
                          <span className={`text-[9px] ${s.active ? "text-[#3b82f6]" : "text-white/30"}`}>{s.label}</span>
                        </div>
                      ))}
                    </div>
                    <Link href="/tracking">
                      <Button className="w-full rounded-xl bg-[#3b82f6] hover:bg-[#3b82f6]/90 h-9 text-sm">
                        Suivre ma commande
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Truck className="w-8 h-8 mx-auto text-white/10 mb-2" />
                    <p className="text-white/30 text-xs">Aucune commande en transit</p>
                    <Link href="/marketplace">
                      <Button size="sm" className="mt-3 rounded-xl bg-[#3b82f6]/20 text-[#3b82f6] hover:bg-[#3b82f6]/30 h-8 text-xs">
                        Commander maintenant
                      </Button>
                    </Link>
                  </div>
                )}
              </motion.div>

              {/* Recent orders */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
                className="bg-[#16161f]/80 backdrop-blur-xl rounded-3xl p-5 border border-[#1e1e2e]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-sm">Historique</h3>
                  <Link href="/marketplace/orders" className="text-[#3b82f6] text-xs flex items-center gap-1 hover:text-[#3b82f6]/80 transition-colors">
                    Voir tout <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                {loading ? (
                  <div className="space-y-2">
                    {[0, 1, 2].map((i) => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}
                  </div>
                ) : orders.length === 0 ? (
                  <p className="text-white/30 text-xs text-center py-6">Aucune commande</p>
                ) : (
                  <div className="space-y-2">
                    {orders.slice(0, 3).map((order) => {
                      const cfg = ORDER_STATUS[order.status] ?? ORDER_STATUS["pending"]
                      return (
                        <div key={order.id} className="flex items-center gap-3 p-3 bg-[#1c1c28] rounded-xl hover:bg-[#1e1e2e] transition-colors">
                          <div className="w-9 h-9 rounded-xl bg-[#3b82f6]/20 flex items-center justify-center shrink-0">
                            <Package className="w-4 h-4 text-[#3b82f6]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-medium truncate">{(order.vendor as { name?: string } | null)?.name ?? "—"}</p>
                            <p className="text-[10px] text-white/30">#{order.order_number}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                            <p className="text-[10px] text-white/30 mt-0.5">{formatCFA(order.total_amount)}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </motion.div>

              {/* Wallet */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-[#3b82f6]/25 to-[#06b6d4]/15 rounded-3xl p-5 border border-[#3b82f6]/25"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-[#3b82f6]/30 flex items-center justify-center">
                    <Wallet className="w-4.5 h-4.5 text-[#3b82f6]" />
                  </div>
                  <span className="text-white font-semibold text-sm">QuickGo Pay</span>
                </div>
                {loading ? (
                  <div className="h-8 w-36 bg-white/10 rounded animate-pulse mb-1" />
                ) : (
                  <p className="text-3xl font-bold text-white mb-0.5">{formatCFA(profile?.wallet_balance ?? 0)}</p>
                )}
                <p className="text-xs text-white/40 mb-4">Solde disponible</p>
                <div className="flex gap-2">
                  <Link href="/wallet" className="flex-1">
                    <Button className="w-full rounded-xl bg-[#3b82f6] hover:bg-[#3b82f6]/90 h-9 text-sm">Recharger</Button>
                  </Link>
                  <Link href="/wallet">
                    <Button variant="outline" className="rounded-xl border-[#1e1e2e] h-9 text-sm">Historique</Button>
                  </Link>
                </div>
              </motion.div>

              {/* Points / rewards */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                className="bg-[#16161f]/80 backdrop-blur-xl rounded-3xl p-5 border border-[#1e1e2e]"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold text-sm">Mes points</h3>
                  <Star className="w-4.5 h-4.5 text-[#eab308] fill-current" />
                </div>
                {loading ? (
                  <div className="h-10 w-24 bg-white/10 rounded animate-pulse mx-auto" />
                ) : (
                  <>
                    <div className="text-center mb-3">
                      <p className="text-4xl font-bold text-white">{(profile?.points ?? 0).toLocaleString("fr-FR")}</p>
                      <p className="text-xs text-white/40 mt-0.5">points accumulés · Niveau {lvl.level}</p>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 mb-1.5 overflow-hidden">
                      <motion.div className="h-full rounded-full bg-gradient-to-r from-[#eab308] to-[#f97316]"
                        initial={{ width: 0 }} animate={{ width: `${xpPct}%` }} transition={{ duration: 0.8 }} />
                    </div>
                    <p className="text-[10px] text-white/30 text-center mb-3">
                      Encore {Math.max(0, lvl.max - lvl.current)} points pour {lvl.nextName}
                    </p>
                  </>
                )}
                <Link href="/marketplace/offers">
                  <Button variant="outline" className="w-full rounded-xl border-[#1e1e2e] text-white/60 hover:text-white h-9 text-sm">
                    Échanger mes points
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── PromoCard ────────────────────────────────────────────────────────────────
function PromoCard({ title, desc, code, gi }: { title: string; desc: string; code: string; gi: number }) {
  const { from, to } = PROMO_GRADIENTS[gi % PROMO_GRADIENTS.length]
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}
      className="rounded-2xl relative overflow-hidden cursor-pointer"
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative z-10 p-5">
        <Gift className="w-7 h-7 text-white/80 mb-2" />
        <h4 className="text-white font-bold text-base leading-tight">{title}</h4>
        <p className="text-white/70 text-xs mt-0.5 mb-3">{desc}</p>
        <div className="flex items-center justify-between">
          <code className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-mono font-bold">
            {code}
          </code>
          <Button size="sm" className="rounded-full bg-white/20 hover:bg-white/30 text-white border-0 h-7 text-xs">
            Utiliser
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
