"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import {
  Home, Compass, Package, MapPin, Heart, Wallet, MessageSquare,
  Tag, HelpCircle, Settings, Bell, ShoppingCart, ChevronRight,
  ChevronLeft, Star, Plus, Bike, Car, Zap, UtensilsCrossed,
  ShoppingBag, Phone as PhoneIcon, Moon, Sun, Crown, Truck,
  CreditCard, History, TicketPercent, ArrowRight, X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// ─── types ────────────────────────────────────────────────────────────────────

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
interface ProductRow {
  id: string; name: string; price: number; original_price: number | null
  image_url: string | null; rating: number | null
  vendor: { name: string; slug: string } | null
  category: { name: string } | null
}
interface CategoryRow { id: string; name: string; slug: string; icon: string | null; color: string | null }
interface HomeData {
  profile: Profile | null; recentOrders: OrderRow[]; products: ProductRow[]
  categories: CategoryRow[]; unreadCount: number; cartCount: number
}

// ─── constants ─────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: Home,           label: "Accueil",       href: "/marketplace",        active: true },
  { icon: Compass,        label: "Explorer",      href: "/marketplace/shops" },
  { icon: Package,        label: "Commandes",     href: "/marketplace/orders" },
  { icon: MapPin,         label: "Live Tracking", href: "/tracking" },
  { icon: Heart,          label: "Favoris",       href: "/marketplace/favorites" },
  { icon: Wallet,         label: "Wallet",        href: "/wallet" },
  { icon: MessageSquare,  label: "Messages",      href: "/dashboard/messages",  badge: true },
  { icon: Tag,            label: "Promotions",    href: "/marketplace/offers" },
  { icon: HelpCircle,     label: "Support",       href: "/support" },
  { icon: Settings,       label: "Paramètres",    href: "/dashboard/settings" },
]

const QUICK_ACTIONS = [
  { label: "Courses",     icon: ShoppingBag,     href: "/marketplace/shops?cat=supermarche",  color: "text-green-400",   bg: "bg-green-500/20" },
  { label: "Restaurants", icon: UtensilsCrossed,  href: "/marketplace/shops?cat=restaurant",  color: "text-orange-400",  bg: "bg-orange-500/20" },
  { label: "Pharmacie",   icon: Plus,             href: "/marketplace/shops?cat=pharmacie",   color: "text-blue-400",    bg: "bg-blue-500/20" },
  { label: "Livraison",   icon: Bike,             href: "/delivery",                           color: "text-purple-400",  bg: "bg-purple-500/20" },
  { label: "Chauffeur",   icon: Car,              href: "/services",                           color: "text-yellow-400",  bg: "bg-yellow-500/20" },
  { label: "Recharger",   icon: Zap,              href: "/wallet",                             color: "text-cyan-400",    bg: "bg-cyan-500/20" },
  { label: "Plus",        icon: ShoppingCart,     href: "/marketplace/shops",                  color: "text-gray-400",    bg: "bg-white/5" },
]

const HERO_SLIDES = [
  { title: "Everything Local.", accent: "Delivered Fast.", desc: "Produits, repas, courses, pharmacie et plus…\nLivrés chez vous en un clic.", cta: "Commandez maintenant", bg: "from-quickgo-blue/70 via-quickgo-cyan/30 to-transparent" },
  { title: "Livraison Express", accent: "en 30 min.", desc: "Nos livreurs partenaires sont prêts à vous servir\n24h/24, 7j/7.", cta: "Voir les vendeurs", bg: "from-purple-600/70 via-quickgo-blue/30 to-transparent" },
  { title: "QuickGo Premium", accent: "— Livraison 0 F.", desc: "Abonnez-vous et profitez de livraisons gratuites\net d'offres exclusives.", cta: "Devenir Premium", bg: "from-quickgo-lime/50 via-green-600/30 to-transparent" },
]

const ORDER_STATUS: Record<string, { label: string; color: string; step: number }> = {
  pending:    { label: "En attente",      color: "text-yellow-400",  step: 0 },
  confirmed:  { label: "Confirmé",        color: "text-blue-400",    step: 1 },
  preparing:  { label: "En préparation",  color: "text-purple-400",  step: 2 },
  ready:      { label: "Prêt",            color: "text-cyan-400",    step: 3 },
  delivering: { label: "En livraison",    color: "text-quickgo-blue", step: 4 },
  delivered:  { label: "Livré",           color: "text-green-400",   step: 5 },
  cancelled:  { label: "Annulé",          color: "text-red-400",     step: -1 },
}

const LEVEL_XP = [0, 200, 500, 1000, 2000, 4000, 8000]
function getLevel(pts: number) {
  let level = 1
  for (let i = 1; i < LEVEL_XP.length; i++) {
    if (pts >= LEVEL_XP[i]) level = i + 1
    else break
  }
  const base = LEVEL_XP[Math.min(level - 1, LEVEL_XP.length - 1)]
  const next = LEVEL_XP[Math.min(level, LEVEL_XP.length - 1)]
  return { level, current: pts - base, max: next - base }
}

function formatCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA"
}
function formatETA(iso: string | null) {
  if (!iso) return "—"
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / 60000)
  if (diff <= 0) return "Imminent"
  if (diff < 60) return `${diff} min`
  return `${Math.floor(diff / 60)}h${diff % 60 > 0 ? diff % 60 + "m" : ""}`
}

// ─── component ─────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [data, setData] = useState<HomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [heroIdx, setHeroIdx] = useState(0)
  const [orderTab, setOrderTab] = useState<"active" | "done" | "cancelled">("active")
  const [search, setSearch] = useState("")
  const heroTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch("/api/marketplace/home")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setData(d) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    heroTimer.current = setInterval(() => setHeroIdx((i) => (i + 1) % HERO_SLIDES.length), 5000)
    return () => { if (heroTimer.current) clearInterval(heroTimer.current) }
  }, [])

  const profile = data?.profile
  const activeOrders = (data?.recentOrders ?? []).filter((o) => !["delivered", "cancelled"].includes(o.status))
  const doneOrders = (data?.recentOrders ?? []).filter((o) => o.status === "delivered")
  const cancelledOrders = (data?.recentOrders ?? []).filter((o) => o.status === "cancelled")
  const liveOrder = activeOrders.find((o) => o.status === "delivering")
  const lvl = getLevel(profile?.points ?? 0)

  const tabOrders = orderTab === "active" ? activeOrders : orderTab === "done" ? doneOrders : cancelledOrders

  return (
    <div className="min-h-screen bg-background flex">

      {/* ── Left Sidebar ── */}
      <aside className="hidden lg:flex w-[240px] flex-col border-r border-border/30 bg-card/30 sticky top-0 h-screen">
        {/* Logo */}
        <div className="p-5 border-b border-border/30">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center shrink-0">
              <span className="text-white font-bold">Q</span>
            </div>
            <div>
              <span className="font-bold text-white">QUICK</span><span className="font-bold text-quickgo-lime">GO</span>
              <p className="text-[9px] text-muted-foreground leading-none">Everything. Delivered.</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <Link key={item.label} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                item.active ? "bg-quickgo-lime text-black font-semibold" : "text-muted-foreground hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="text-sm">{item.label}</span>
              {item.badge && (data?.unreadCount ?? 0) > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {data!.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Premium Banner */}
        <div className="mx-3 mb-3 p-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-white font-semibold text-sm">QuickGo Premium</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Livraison gratuite, offres exclusives et plus</p>
          <button className="w-full py-1.5 rounded-xl bg-quickgo-lime text-black text-xs font-bold hover:bg-quickgo-lime/90 transition-colors">
            Devenir Premium
          </button>
        </div>

        {/* User Profile */}
        {loading ? (
          <div className="mx-3 mb-3 p-3 rounded-2xl bg-card/50 h-20 animate-pulse" />
        ) : profile ? (
          <div className="mx-3 mb-3 p-3 rounded-2xl bg-card/50 border border-border/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center text-white font-bold text-sm shrink-0">
                {profile.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"}
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{profile.full_name ?? "Utilisateur"}</p>
                <p className="text-xs text-yellow-400 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> {profile.rating?.toFixed(1) ?? "—"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Niveau {lvl.level}</span>
              <span>{profile.points} / {lvl.current + lvl.max} XP</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-quickgo-blue to-quickgo-lime transition-all"
                style={{ width: `${Math.min(100, (lvl.current / lvl.max) * 100)}%` }} />
            </div>
          </div>
        ) : null}

        {/* Dark mode toggle */}
        <div className="px-5 pb-4 flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-2"><Moon className="w-3.5 h-3.5" /> Mode Sombre</span>
          <div className="w-9 h-5 bg-quickgo-blue rounded-full relative">
            <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white" />
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/30 px-5 py-3">
          <div className="flex items-center gap-3">
            {/* City */}
            <button className="flex items-center gap-1.5 text-white text-sm font-medium hover:bg-white/5 px-2 py-1 rounded-lg shrink-0">
              <MapPin className="w-4 h-4 text-quickgo-blue" />
              {profile?.city ?? "Yaoundé"}
              <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
            </button>
            {/* Search */}
            <div className="relative flex-1">
              <Input placeholder="Rechercher un produit, un vendeur..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-card/50 border-border/30 rounded-full pl-4 pr-12 h-9 text-sm" />
              <button className="absolute right-1 top-1 h-7 w-7 rounded-full bg-quickgo-blue flex items-center justify-center">
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
            {/* Icons */}
            <div className="flex items-center gap-1 shrink-0">
              <Link href="/notifications" className="relative p-2 hover:bg-white/5 rounded-full">
                <Bell className="w-5 h-5 text-muted-foreground" />
                {(data?.unreadCount ?? 0) > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
                )}
              </Link>
              <Link href="/marketplace/cart" className="relative p-2 hover:bg-white/5 rounded-full">
                <ShoppingCart className="w-5 h-5 text-muted-foreground" />
                {(data?.cartCount ?? 0) > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 rounded-full bg-quickgo-blue text-white text-[9px] flex items-center justify-center px-0.5">
                    {data!.cartCount}
                  </span>
                )}
              </Link>
              <Link href="/dashboard/settings" className="p-2 hover:bg-white/5 rounded-full">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center">
                  <span className="text-white font-bold text-[10px]">
                    {profile?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2) ?? "U"}
                  </span>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <div className="p-5 space-y-6">
          {/* Hero Carousel */}
          <div className="relative rounded-2xl overflow-hidden h-48 bg-card/50">
            <AnimatePresence mode="wait">
              <motion.div key={heroIdx}
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4 }}
                className={`absolute inset-0 bg-gradient-to-r ${HERO_SLIDES[heroIdx].bg} flex items-center px-8`}
              >
                <div className="max-w-xs">
                  <h2 className="text-2xl font-bold text-white leading-tight">
                    {HERO_SLIDES[heroIdx].title}
                    <br /><span className="text-quickgo-lime">{HERO_SLIDES[heroIdx].accent}</span>
                  </h2>
                  <p className="text-sm text-white/70 mt-2 whitespace-pre-line">{HERO_SLIDES[heroIdx].desc}</p>
                  <button className="mt-4 px-5 py-2 rounded-full bg-white text-black font-semibold text-sm flex items-center gap-2 hover:bg-white/90 transition-colors">
                    {HERO_SLIDES[heroIdx].cta} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
            {/* Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {HERO_SLIDES.map((_, i) => (
                <button key={i} onClick={() => setHeroIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === heroIdx ? "w-6 bg-white" : "w-1.5 bg-white/40"}`} />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Actions rapides</h3>
              <Link href="/marketplace/shops" className="text-quickgo-blue text-xs">Tout voir</Link>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {QUICK_ACTIONS.map((a) => (
                <Link key={a.label} href={a.href} className="flex flex-col items-center gap-2 group">
                  <div className={`w-12 h-12 rounded-2xl ${a.bg} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                    <a.icon className={`w-5 h-5 ${a.color}`} />
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center leading-none">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recommended Products */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Recommandé pour vous</h3>
              <Link href="/marketplace/shops" className="text-quickgo-blue text-xs">Tout voir</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-36 shrink-0 rounded-2xl h-52 bg-card/30 animate-pulse" />
                ))
              ) : data?.products.length === 0 ? (
                <p className="text-muted-foreground text-sm">Aucun produit pour le moment</p>
              ) : (data?.products ?? []).map((product) => (
                <Link key={product.id} href={`/marketplace/product/${product.id}`}
                  className="w-36 shrink-0 rounded-2xl bg-card/50 border border-border/30 overflow-hidden hover:border-quickgo-blue/30 transition-colors group"
                >
                  <div className="relative aspect-square bg-white/5">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <button className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/40 hover:text-red-400 transition-colors">
                      <Heart className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <div className="p-2.5">
                    <p className="text-[10px] text-muted-foreground truncate">{(product.vendor as { name?: string } | null)?.name ?? "—"}</p>
                    <p className="text-xs text-white font-medium mt-0.5 line-clamp-2 leading-tight">{product.name}</p>
                    {product.rating != null && (
                      <p className="flex items-center gap-1 text-[10px] text-yellow-400 mt-1">
                        <Star className="w-2.5 h-2.5 fill-current" /> {product.rating.toFixed(1)}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-1.5">
                      <div>
                        <p className="text-xs text-white font-bold">{formatCFA(product.price)}</p>
                        {product.original_price != null && product.original_price > product.price && (
                          <p className="text-[10px] text-muted-foreground line-through">{formatCFA(product.original_price)}</p>
                        )}
                      </div>
                      <button className="p-1 rounded-lg bg-quickgo-blue/20 text-quickgo-blue hover:bg-quickgo-blue/30 transition-colors">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Special Offers */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Offres spéciales</h3>
              <Link href="/marketplace/offers" className="text-quickgo-blue text-xs">Tout voir</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { title: "LIVRAISON EXPRESS", sub: "-50%", desc: "Sur votre première commande", gradient: "from-orange-600 to-red-600", expires: new Date(Date.now() + 2.5 * 3600000) },
                { title: "COURSES DU JOUR", sub: "Jusqu'à -30%", desc: "De réduction", gradient: "from-green-600 to-emerald-600", expires: new Date(Date.now() + 5.2 * 3600000) },
                { title: "RESTAURANTS", sub: "-20%", desc: "Sur les plats sélectionnés", gradient: "from-quickgo-blue to-quickgo-cyan", expires: new Date(Date.now() + 3.4 * 3600000) },
              ].map((offer, i) => (
                <OfferCard key={i} {...offer} />
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ── Right Sidebar ── */}
      <aside className="hidden xl:flex w-[300px] flex-col border-l border-border/30 bg-card/30 sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Wallet */}
          <div className="bg-card/50 rounded-2xl border border-border/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-semibold text-sm">Mon Wallet</span>
              <Link href="/wallet" className="text-quickgo-blue text-xs">Voir tout</Link>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] text-muted-foreground">Solde disponible</p>
                {loading ? (
                  <div className="h-7 w-32 bg-white/10 animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-white">{formatCFA(profile?.wallet_balance ?? 0)}</p>
                )}
              </div>
              <Link href="/wallet" className="w-8 h-8 rounded-full bg-quickgo-lime/20 border border-quickgo-lime/30 flex items-center justify-center">
                <Plus className="w-4 h-4 text-quickgo-lime" />
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Orange Money", color: "bg-orange-500/20 text-orange-400", icon: "🟠" },
                { label: "MTN MoMo",     color: "bg-yellow-500/20 text-yellow-400", icon: "🟡" },
                { label: "Historique",   color: "bg-white/5 text-muted-foreground",  icon: <History className="w-4 h-4" /> },
                { label: "Coupons",      color: "bg-white/5 text-muted-foreground",  icon: <TicketPercent className="w-4 h-4" /> },
              ].map((item, i) => (
                <button key={i} className={`flex flex-col items-center gap-1 p-2 rounded-xl ${item.color} transition-colors hover:opacity-80`}>
                  <span className="text-base">{typeof item.icon === "string" ? item.icon : item.icon}</span>
                  <span className="text-[9px] leading-tight text-center">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Orders */}
          <div className="bg-card/50 rounded-2xl border border-border/30 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-semibold text-sm">Mes commandes</span>
              <Link href="/marketplace/orders" className="text-quickgo-blue text-xs">Voir tout</Link>
            </div>
            {/* Tabs */}
            <div className="flex gap-1 mb-3 bg-white/5 rounded-xl p-1">
              {[
                { key: "active",    label: "En cours",  count: activeOrders.length },
                { key: "done",      label: "Terminées", count: doneOrders.length },
                { key: "cancelled", label: "Annulées",  count: cancelledOrders.length },
              ].map((t) => (
                <button key={t.key}
                  onClick={() => setOrderTab(t.key as typeof orderTab)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    orderTab === t.key ? "bg-quickgo-blue text-white" : "text-muted-foreground hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {/* Order list */}
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />)}
              </div>
            ) : tabOrders.length === 0 ? (
              <div className="text-center py-6">
                <Package className="w-8 h-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">Aucune commande</p>
              </div>
            ) : tabOrders.map((order) => {
              const cfg = ORDER_STATUS[order.status]
              return (
                <div key={order.id} className="mb-2 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white text-xs font-medium">Commande #{order.order_number}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{(order.vendor as { name?: string } | null)?.name ?? "—"}</p>
                      {(order.items as { product_name?: string; quantity?: number }[])?.[0] && (
                        <p className="text-[10px] text-muted-foreground">
                          {order.items[0].product_name}{order.items.length > 1 ? ` +${order.items.length - 1}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-[10px] font-medium ${cfg?.color ?? "text-muted-foreground"}`}>{cfg?.label ?? order.status}</p>
                      <p className="text-xs text-white font-bold mt-1">{formatCFA(order.total_amount)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Live Tracking */}
          {liveOrder && (
            <div className="bg-card/50 rounded-2xl border border-border/30 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-semibold text-sm">Suivi en direct</span>
                <Link href="/tracking" className="text-quickgo-blue text-xs">Voir sur la carte</Link>
              </div>
              {/* Route visual */}
              <div className="relative flex items-center justify-between px-2 mb-4">
                {["Confirmée", "Préparation", "En route", "Livrée"].map((step, i) => {
                  const currentStep = ORDER_STATUS[liveOrder.status]?.step ?? 0
                  const done = i <= Math.min(currentStep, 4) - 1
                  const active = i === Math.min(currentStep, 4) - 1
                  return (
                    <div key={step} className="flex flex-col items-center gap-1 relative z-10">
                      <div className={`w-2.5 h-2.5 rounded-full border-2 transition-colors ${
                        active ? "border-quickgo-blue bg-quickgo-blue" :
                        done ? "border-green-500 bg-green-500" : "border-white/20 bg-transparent"
                      }`} />
                      <span className="text-[8px] text-muted-foreground">{step}</span>
                    </div>
                  )
                })}
                <div className="absolute top-[5px] left-4 right-4 h-0.5 bg-white/10" />
              </div>
              {/* Driver */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {((liveOrder.driver_rel as { user?: { full_name?: string } | null } | null)?.user?.full_name ?? "D")
                    .split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">
                    {(liveOrder.driver_rel as { user?: { full_name?: string } | null } | null)?.user?.full_name ?? "Livreur"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Votre commande arrive dans</p>
                  <p className="text-quickgo-blue text-xs font-bold">{formatETA(liveOrder.estimated_delivery_time)}</p>
                </div>
                {(liveOrder.driver_rel as { user?: { phone?: string } | null } | null)?.user?.phone && (
                  <a href={`tel:${(liveOrder.driver_rel as { user?: { phone?: string } | null } | null)?.user?.phone}`}
                    className="w-9 h-9 rounded-xl bg-quickgo-blue/20 flex items-center justify-center shrink-0 hover:bg-quickgo-blue/30 transition-colors"
                  >
                    <PhoneIcon className="w-4 h-4 text-quickgo-blue" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Help */}
          <div className="bg-card/50 rounded-2xl border border-border/30 p-4">
            <p className="text-white font-semibold text-sm mb-1">Besoin d&apos;aide ?</p>
            <p className="text-xs text-muted-foreground mb-3">Notre équipe est là pour vous.</p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/support" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <MessageSquare className="w-4 h-4 text-quickgo-blue" />
                <span className="text-xs text-white">Chat en direct</span>
              </Link>
              <a href="https://wa.me/237600000000" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 transition-colors"
              >
                <span className="text-sm">💬</span>
                <span className="text-xs text-green-400">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

// ─── Offer Card with countdown ─────────────────────────────────────────────────

function OfferCard({ title, sub, desc, gradient, expires }: {
  title: string; sub: string; desc: string; gradient: string; expires: Date
}) {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    function update() {
      const diff = Math.max(0, expires.getTime() - Date.now())
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [expires])

  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradient} p-4 relative overflow-hidden`}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10">
        <p className="text-white/70 text-[10px] font-semibold tracking-widest">{title}</p>
        <p className="text-3xl font-black text-white mt-1">{sub}</p>
        <p className="text-white/80 text-xs mt-0.5">{desc}</p>
        <div className="flex items-center gap-2 mt-3">
          <div className="bg-black/30 rounded-lg px-2 py-1">
            <p className="text-[9px] text-white/60">Expire dans</p>
            <p className="text-white font-mono text-xs font-bold">{timeLeft}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

