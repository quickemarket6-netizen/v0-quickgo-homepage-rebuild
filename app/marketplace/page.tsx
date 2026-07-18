"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import {
  Home, Compass, Package, MapPin, Heart, Wallet, MessageSquare,
  Tag, HelpCircle, Settings, Bell, ShoppingCart, ChevronRight,
  ChevronLeft, Star, Plus, Bike, Car, Zap, UtensilsCrossed,
  ShoppingBag, Phone as PhoneIcon, Crown, Truck,
  History, TicketPercent, ArrowRight, X,
} from "lucide-react"
import { GlobalSearch } from "@/components/marketplace/GlobalSearch"
import { EmptyState } from "@/components/marketplace/EmptyState"
import { LanguageSwitcher } from "@/components/ui/language-switcher"
import { useT } from "@/lib/i18n/context"

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
interface OfferRow {
  id: string; title: string | null; description: string | null
  discount_type: string; discount_value: number; valid_until: string | null
}
interface HomeData {
  profile: Profile | null; recentOrders: OrderRow[]; products: ProductRow[]
  categories: CategoryRow[]; unreadCount: number; cartCount: number
}

// ─── constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { icon: Home,          label: "Accueil",       href: "/marketplace",           active: true },
  { icon: Compass,       label: "Explorer",      href: "/marketplace/shops" },
  { icon: Package,       label: "Commandes",     href: "/marketplace/orders" },
  { icon: MapPin,        label: "Live Tracking", href: "/tracking" },
  { icon: Heart,         label: "Favoris",       href: "/marketplace/favorites" },
  { icon: Wallet,        label: "Wallet",        href: "/wallet" },
  { icon: MessageSquare, label: "Messages",      href: "/dashboard/messages", badge: true },
  { icon: Tag,           label: "Promotions",    href: "/marketplace/offers" },
  { icon: HelpCircle,    label: "Support",       href: "/support" },
  { icon: Settings,      label: "Paramètres",    href: "/dashboard/settings" },
]

const QUICK_ACTIONS = [
  { label: "Courses",     icon: ShoppingBag,    href: "/marketplace/shops?cat=supermarche", color: "text-[#22c55e]",  bg: "bg-[#22c55e]/15" },
  { label: "Restaurants", icon: UtensilsCrossed, href: "/marketplace/shops?cat=restaurant",  color: "text-[#f97316]",  bg: "bg-[#f97316]/15" },
  { label: "Pharmacie",   icon: Plus,            href: "/marketplace/shops?cat=pharmacie",   color: "text-[#3b82f6]",  bg: "bg-[#3b82f6]/15" },
  { label: "Livraison",   icon: Bike,            href: "/delivery",                           color: "text-[#8b5cf6]",  bg: "bg-[#8b5cf6]/15" },
  { label: "Chauffeur",   icon: Car,             href: "/delivery",                           color: "text-[#eab308]",  bg: "bg-[#eab308]/15" },
  { label: "Recharger",   icon: Zap,             href: "/wallet",                             color: "text-[#06b6d4]",  bg: "bg-[#06b6d4]/15" },
  { label: "Plus",        icon: ShoppingCart,    href: "/marketplace/shops",                  color: "text-white/40",   bg: "bg-white/5" },
]

const HERO_SLIDES = [
  { title: "Everything Local.", accent: "Delivered Fast.", desc: "Produits, repas, courses, pharmacie et plus…\nLivrés chez vous en un clic.", cta: "Commandez maintenant", href: "/marketplace/products", from: "#3b82f6", to: "#06b6d4" },
  { title: "Livraison Express", accent: "en 30 min.", desc: "Nos livreurs partenaires sont prêts à vous servir\n24h/24, 7j/7.", cta: "Voir les boutiques", href: "/marketplace/shops", from: "#8b5cf6", to: "#3b82f6" },
  { title: "Parrainez vos proches", accent: "— 1 000 F offerts.", desc: "Votre filleul commande, vous êtes crédité\nsur votre portefeuille QuickGo Pay.", cta: "Obtenir mon code", href: "/wallet/rewards", from: "#a3e635", to: "#22c55e" },
]

const ORDER_STATUS: Record<string, { label: string; color: string; step: number }> = {
  pending:    { label: "En attente",      color: "text-[#eab308]",  step: 0 },
  confirmed:  { label: "Confirmé",        color: "text-[#3b82f6]",  step: 1 },
  preparing:  { label: "En préparation",  color: "text-[#8b5cf6]",  step: 2 },
  ready:      { label: "Prêt",            color: "text-[#06b6d4]",  step: 3 },
  delivering: { label: "En livraison",    color: "text-[#3b82f6]",  step: 4 },
  delivered:  { label: "Livré",           color: "text-[#22c55e]",  step: 5 },
  cancelled:  { label: "Annulé",          color: "text-[#ef4444]",  step: -1 },
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

const OFFER_PALETTES = [
  { from: "#ea580c", to: "#dc2626" },
  { from: "#16a34a", to: "#059669" },
  { from: "#3b82f6", to: "#06b6d4" },
]

function offerDiscountLabel(o: OfferRow) {
  if (o.discount_type === "delivery") return "Livraison 0 F"
  if (o.discount_type === "percentage" || o.discount_type === "percent") return `-${o.discount_value}%`
  return `-${new Intl.NumberFormat("fr-FR").format(o.discount_value)} F`
}
function formatETA(iso: string | null) {
  if (!iso) return "—"
  const diff = Math.round((new Date(iso).getTime() - Date.now()) / 60000)
  if (diff <= 0) return "Imminent"
  if (diff < 60) return `${diff} min`
  return `${Math.floor(diff / 60)}h${diff % 60 > 0 ? diff % 60 + "m" : ""}`
}

// ─── component ────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const { t } = useT()
  const [data, setData] = useState<HomeData | null>(null)
  const [offers, setOffers] = useState<OfferRow[]>([])
  const [loading, setLoading] = useState(true)
  // Visiteur non connecté : le catalogue public remplace les données perso
  const [guest, setGuest] = useState(false)
  const [guestProducts, setGuestProducts] = useState<ProductRow[]>([])
  const [heroIdx, setHeroIdx] = useState(0)
  const [orderTab, setOrderTab] = useState<"active" | "done" | "cancelled">("active")
  const heroTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch("/api/marketplace/home")
      .then((r) => {
        if (r.status === 401) {
          // Invité : montrer le catalogue au lieu d'une coquille vide —
          // le funnel homepage → marketplace ne doit jamais mourir ici
          setGuest(true)
          fetch("/api/products?limit=12")
            .then((pr) => (pr.ok ? pr.json() : null))
            .then((pd) => {
              const rows = (pd?.data ?? []) as Array<{
                id: string; name: string; price: number; original_price: number | null
                image_url: string | null; rating: number | null
                vendor: { name: string; slug: string } | null
                category: { name: string } | null
              }>
              setGuestProducts(rows)
            })
            .catch(() => {})
          return null
        }
        return r.ok ? r.json() : null
      })
      .then((d) => { if (d) setData(d) })
      .finally(() => setLoading(false))
    fetch("/api/marketplace/offers")
      .then((r) => r.ok ? r.json() : [])
      .then((d) => { if (Array.isArray(d)) setOffers(d) })
      .catch(() => {})

    // Active le code de parrainage mémorisé à l'inscription (?ref=CODE).
    // Nettoyé après tentative : le serveur refuse de toute façon les
    // rattachements tardifs ou invalides.
    try {
      const ref = localStorage.getItem("quickgo-ref")
      if (ref) {
        fetch("/api/referral", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: ref }),
        })
          .then((r) => { if (r.status !== 401) localStorage.removeItem("quickgo-ref") })
          .catch(() => {})
      }
    } catch { /* stockage indisponible */ }
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
  const xpPercent = Math.min(100, lvl.max > 0 ? (lvl.current / lvl.max) * 100 : 0)

  const tabOrders = orderTab === "active" ? activeOrders : orderTab === "done" ? doneOrders : cancelledOrders
  const displayProducts = guest ? guestProducts : (data?.products ?? [])

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* ── Left Sidebar ── */}
      <aside className="hidden lg:flex w-60 flex-col bg-[#111118] border-r border-[#1e1e2e] sticky top-0 h-screen">
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
          {NAV_ITEMS.map((item, idx) => (
            <motion.div key={item.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}>
              <Link href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all ${
                  item.active
                    ? "bg-[#a3e635]/10 border-l-2 border-[#a3e635] text-[#a3e635] rounded-r-xl ml-0 pl-[10px]"
                    : "rounded-xl text-white/40 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.badge && (data?.unreadCount ?? 0) > 0 && (
                  <span className="ml-auto bg-[#ef4444] text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {data!.unreadCount}
                  </span>
                )}
              </Link>
            </motion.div>
          ))}
        </nav>

        {/* Parrainage — 1 000 F par filleul, crédités au wallet */}
        <div className="mx-3 mb-3 p-4 rounded-2xl bg-gradient-to-br from-[#a3e635]/20 to-[#22c55e]/10 border border-[#a3e635]/20">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-[#a3e635]" />
            <span className="text-white font-semibold text-sm">Parrainez, gagnez</span>
          </div>
          <p className="text-xs text-white/40 mb-3">1 000 F sur votre wallet à la première commande de chaque filleul</p>
          <Link href="/wallet/rewards"
            className="block text-center w-full py-1.5 rounded-xl bg-[#a3e635] text-black text-xs font-bold hover:bg-[#a3e635]/90 transition-colors">
            Obtenir mon code
          </Link>
        </div>

        {/* User Profile + XP */}
        {loading ? (
          <div className="mx-3 mb-3 p-3 rounded-2xl bg-[#16161f] h-24 animate-pulse" />
        ) : guest ? (
          <div className="mx-3 mb-3 p-4 rounded-2xl bg-[#16161f] border border-[#1e1e2e] space-y-2">
            <p className="text-white font-semibold text-sm">{t("app.mkt.welcome")}</p>
            <p className="text-xs text-white/40">Connectez-vous pour commander et suivre vos livraisons.</p>
            <Link href="/auth/login?next=/marketplace"
              className="block text-center py-2 rounded-xl bg-[#3b82f6] text-white text-xs font-bold hover:bg-[#3b82f6]/90 transition-colors">
              Se connecter
            </Link>
            <Link href="/auth/register"
              className="block text-center py-2 rounded-xl bg-white/5 text-white/70 text-xs font-semibold hover:bg-white/10 transition-colors">
              Créer un compte
            </Link>
          </div>
        ) : profile ? (
          <div className="mx-3 mb-3 p-3 rounded-2xl bg-[#16161f] border border-[#1e1e2e]">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center text-white font-bold text-sm shrink-0">
                {profile.full_name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"}
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-sm truncate">{profile.full_name ?? "Utilisateur"}</p>
                <p className="text-xs text-[#eab308] flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current" /> {profile.rating?.toFixed(1) ?? "—"}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/30 ml-auto shrink-0" />
            </div>
            <div className="flex items-center justify-between text-xs text-white/30 mb-1">
              <span>Niveau {lvl.level}</span>
              <span>{profile.points} XP</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#a3e635]"
                initial={{ width: 0 }}
                animate={{ width: `${xpPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        ) : null}

      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 min-w-0 overflow-auto">
        {/* Sticky Header */}
        <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-[#1e1e2e] px-5 py-3">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1.5 text-white text-sm font-medium hover:bg-white/5 px-2 py-1 rounded-lg shrink-0 transition-colors">
              <MapPin className="w-4 h-4 text-[#3b82f6]" />
              {profile?.city ?? "Yaoundé"}
              <ChevronLeft className="w-3 h-3 rotate-[-90deg]" />
            </button>
            <GlobalSearch className="flex-1" />
            <div className="flex items-center gap-1 shrink-0">
              <LanguageSwitcher className="hidden sm:inline-flex" />
              <Link href="/notifications" className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
                <Bell className="w-5 h-5 text-white/40" />
                {(data?.unreadCount ?? 0) > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#ef4444]" />
                )}
              </Link>
              <Link href="/marketplace/cart" className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
                <ShoppingCart className="w-5 h-5 text-white/40" />
                {(data?.cartCount ?? 0) > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 rounded-full bg-[#3b82f6] text-white text-[9px] flex items-center justify-center px-0.5">
                    {data!.cartCount}
                  </span>
                )}
              </Link>
              <Link href="/dashboard/settings" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center">
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
          <div className="relative rounded-2xl overflow-hidden h-48 bg-[#16161f]">
            <AnimatePresence mode="wait">
              <motion.div key={heroIdx}
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 flex items-center px-8"
                style={{ background: `linear-gradient(135deg, ${HERO_SLIDES[heroIdx].from}99 0%, ${HERO_SLIDES[heroIdx].to}40 60%, transparent 100%)` }}
              >
                <div className="max-w-xs">
                  <h2 className="text-2xl font-bold text-white leading-tight">
                    {HERO_SLIDES[heroIdx].title}
                    <br /><span className="text-[#a3e635]">{HERO_SLIDES[heroIdx].accent}</span>
                  </h2>
                  <p className="text-sm text-white/70 mt-2 whitespace-pre-line">{HERO_SLIDES[heroIdx].desc}</p>
                  <Link href={HERO_SLIDES[heroIdx].href}
                    className="mt-4 inline-flex px-5 py-2 rounded-full bg-white text-black font-semibold text-sm items-center gap-2 hover:bg-white/90 transition-colors">
                    {HERO_SLIDES[heroIdx].cta} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
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
              <h3 className="text-white font-semibold text-sm">{t("app.mkt.quickActions")}</h3>
              <Link href="/marketplace/shops" className="text-[#3b82f6] text-xs hover:text-[#3b82f6]/80 transition-colors">{t("app.mkt.seeAll")}</Link>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {QUICK_ACTIONS.map((a) => (
                <Link key={a.label} href={a.href} className="flex flex-col items-center gap-2 group">
                  <motion.div whileHover={{ y: -2, scale: 1.05 }} transition={{ duration: 0.15 }}
                    className={`w-12 h-12 rounded-2xl ${a.bg} flex items-center justify-center`}>
                    <a.icon className={`w-5 h-5 ${a.color}`} />
                  </motion.div>
                  <span className="text-[10px] text-white/40 text-center leading-none">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Recommended Products */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">{guest ? t("app.mkt.popular") : t("app.mkt.recommended")}</h3>
              <Link href="/marketplace/products" className="text-[#3b82f6] text-xs hover:text-[#3b82f6]/80 transition-colors">{t("app.mkt.seeAll")}</Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="w-36 shrink-0 rounded-2xl h-52 bg-[#16161f] animate-pulse" />
                ))
              ) : displayProducts.length === 0 ? (
                <EmptyState
                  icon={ShoppingBag}
                  title={t("app.mkt.empty.title")}
                  description={t("app.mkt.empty.desc")}
                  ctaLabel={t("app.mkt.empty.cta")}
                  ctaHref="/marketplace/products"
                />
              ) : displayProducts.map((product) => (
                <motion.div key={product.id} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
                  <Link href={`/marketplace/product/${product.id}`}
                    className="block w-36 rounded-2xl bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] overflow-hidden
                      hover:border-[#3b82f6]/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.08)] transition-all duration-300"
                  >
                    <div className="relative aspect-square bg-white/5">
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ShoppingBag className="w-8 h-8 text-white/10" />
                        </div>
                      )}
                      <button className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/40 hover:text-[#ef4444] transition-colors">
                        <Heart className="w-3 h-3 text-white" />
                      </button>
                    </div>
                    <div className="p-2.5">
                      <p className="text-[10px] text-white/30 truncate">{(product.vendor as { name?: string } | null)?.name ?? "—"}</p>
                      <p className="text-xs text-white font-medium mt-0.5 line-clamp-2 leading-tight">{product.name}</p>
                      {product.rating != null && (
                        <p className="flex items-center gap-1 text-[10px] text-[#eab308] mt-1">
                          <Star className="w-2.5 h-2.5 fill-current" /> {product.rating.toFixed(1)}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        <div>
                          <p className="text-xs text-white font-bold">{formatCFA(product.price)}</p>
                          {product.original_price != null && product.original_price > product.price && (
                            <p className="text-[10px] text-white/30 line-through">{formatCFA(product.original_price)}</p>
                          )}
                        </div>
                        <button className="p-1 rounded-lg bg-[#3b82f6]/20 text-[#3b82f6] hover:bg-[#3b82f6]/30 transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Special Offers — vraies promos de la base, vraies échéances */}
          {offers.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-sm">{t("app.mkt.specialOffers")}</h3>
                <Link href="/marketplace/offers" className="text-[#3b82f6] text-xs hover:text-[#3b82f6]/80 transition-colors">{t("app.mkt.seeAll")}</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {offers.slice(0, 3).map((offer, i) => {
                  const palette = OFFER_PALETTES[i % OFFER_PALETTES.length]
                  return (
                    <OfferCard
                      key={offer.id}
                      title={(offer.title ?? "Offre spéciale").toUpperCase()}
                      sub={offerDiscountLabel(offer)}
                      desc={offer.description ?? ""}
                      from={palette.from}
                      to={palette.to}
                      expires={offer.valid_until ? new Date(offer.valid_until) : null}
                    />
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Right Sidebar ── */}
      <aside className="hidden xl:flex w-[300px] flex-col bg-[#111118] border-l border-[#1e1e2e] sticky top-0 h-screen overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Invité : CTA compte au lieu des widgets personnels */}
          {guest && (
            <div className="bg-gradient-to-br from-[#3b82f6]/15 to-[#a3e635]/10 rounded-2xl border border-[#3b82f6]/25 p-5 space-y-3">
              <p className="text-white font-bold">Tout le Cameroun, livré chez vous</p>
              <ul className="space-y-1.5 text-xs text-white/50">
                <li>🛵 Livraison express à Yaoundé & Douala</li>
                <li>💳 Orange Money, MTN MoMo, cash à la livraison</li>
                <li>🎁 1 000 F offerts par filleul parrainé</li>
              </ul>
              <Link href="/auth/register"
                className="block text-center py-2.5 rounded-xl bg-[#a3e635] text-black text-sm font-bold hover:bg-[#a3e635]/90 transition-colors">
                Créer mon compte gratuitement
              </Link>
              <Link href="/marketplace/products"
                className="block text-center py-2.5 rounded-xl bg-white/5 text-white/70 text-sm font-semibold hover:bg-white/10 transition-colors">
                Explorer le catalogue
              </Link>
            </div>
          )}

          {!guest && (<>
          {/* Wallet */}
          <div className="bg-[#16161f]/80 backdrop-blur-xl rounded-2xl border border-[#1e1e2e] p-4
            hover:border-[#3b82f6]/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.06)] transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-semibold text-sm">Mon Wallet</span>
              <Link href="/wallet" className="text-[#3b82f6] text-xs hover:text-[#3b82f6]/80 transition-colors">Voir tout</Link>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] text-white/30">Solde disponible</p>
                {loading ? (
                  <div className="h-7 w-32 bg-white/10 animate-pulse rounded mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-white">{formatCFA(profile?.wallet_balance ?? 0)}</p>
                )}
              </div>
              <Link href="/wallet" className="w-8 h-8 rounded-full bg-[#a3e635]/20 border border-[#a3e635]/30 flex items-center justify-center">
                <Plus className="w-4 h-4 text-[#a3e635]" />
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "Recharger",  href: "/wallet",              color: "bg-[#f97316]/15 text-[#f97316]", icon: "🟠" },
                { label: "Envoyer",    href: "/wallet/transfer",     color: "bg-[#eab308]/15 text-[#eab308]", icon: "🟡" },
                { label: "Historique", href: "/wallet",              color: "bg-white/5 text-white/40",        icon: <History className="w-4 h-4" /> },
                { label: "Promos",     href: "/marketplace/offers",  color: "bg-white/5 text-white/40",        icon: <TicketPercent className="w-4 h-4" /> },
              ].map((item, i) => (
                <Link key={i} href={item.href}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl ${item.color} transition-colors hover:opacity-80`}>
                  <span className="text-base">{typeof item.icon === "string" ? item.icon : item.icon}</span>
                  <span className="text-[9px] leading-tight text-center">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Orders */}
          <div className="bg-[#16161f]/80 backdrop-blur-xl rounded-2xl border border-[#1e1e2e] p-4
            hover:border-[#3b82f6]/30 transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-semibold text-sm">{t("app.mkt.myOrders")}</span>
              <Link href="/marketplace/orders" className="text-[#3b82f6] text-xs hover:text-[#3b82f6]/80 transition-colors">Voir tout</Link>
            </div>
            <div className="flex gap-1 mb-3 bg-white/5 rounded-xl p-1">
              {[
                { key: "active",    label: "En cours",  count: activeOrders.length },
                { key: "done",      label: "Terminées", count: doneOrders.length },
                { key: "cancelled", label: "Annulées",  count: cancelledOrders.length },
              ].map((t) => (
                <button key={t.key}
                  onClick={() => setOrderTab(t.key as typeof orderTab)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                    orderTab === t.key ? "bg-[#3b82f6] text-white" : "text-white/40 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />)}
              </div>
            ) : tabOrders.length === 0 ? (
              <div className="text-center py-6">
                <Package className="w-8 h-8 mx-auto text-white/10 mb-2" />
                <p className="text-xs text-white/30 mb-3">{t("app.mkt.orders.none")}</p>
                <Link href="/marketplace/products"
                  className="text-xs text-[#3b82f6] hover:text-[#3b82f6]/80 transition-colors font-medium">
                  {t("app.mkt.orders.first")}
                </Link>
              </div>
            ) : tabOrders.map((order) => {
              const cfg = ORDER_STATUS[order.status]
              return (
                <div key={order.id} className="mb-2 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors cursor-pointer border border-transparent hover:border-[#1e1e2e]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white text-xs font-medium">Commande #{order.order_number}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{(order.vendor as { name?: string } | null)?.name ?? "—"}</p>
                      {(order.items as { product_name?: string; quantity?: number }[])?.[0] && (
                        <p className="text-[10px] text-white/30">
                          {order.items[0].product_name}{order.items.length > 1 ? ` +${order.items.length - 1}` : ""}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`text-[10px] font-medium ${cfg?.color ?? "text-white/30"}`}>{cfg?.label ?? order.status}</p>
                      <p className="text-xs text-white font-bold mt-1">{formatCFA(order.total_amount)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          </>)}

          {/* Live Tracking */}
          {liveOrder && (
            <div className="bg-[#16161f]/80 backdrop-blur-xl rounded-2xl border border-[#3b82f6]/20 p-4
              shadow-[0_0_20px_rgba(59,130,246,0.06)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-semibold text-sm">Suivi en direct</span>
                <Link href="/tracking" className="text-[#3b82f6] text-xs hover:text-[#3b82f6]/80 transition-colors">Voir sur la carte</Link>
              </div>
              <div className="relative flex items-center justify-between px-2 mb-4">
                {["Confirmée", "Préparation", "En route", "Livrée"].map((step, i) => {
                  const currentStep = ORDER_STATUS[liveOrder.status]?.step ?? 0
                  const done = i <= Math.min(currentStep, 4) - 1
                  const active = i === Math.min(currentStep, 4) - 1
                  return (
                    <div key={step} className="flex flex-col items-center gap-1 relative z-10">
                      <div className={`w-2.5 h-2.5 rounded-full border-2 transition-colors ${
                        active ? "border-[#3b82f6] bg-[#3b82f6]" :
                        done ? "border-[#22c55e] bg-[#22c55e]" : "border-white/20 bg-transparent"
                      }`} />
                      <span className="text-[8px] text-white/30">{step}</span>
                    </div>
                  )
                })}
                <div className="absolute top-[5px] left-4 right-4 h-0.5 bg-white/10" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {((liveOrder.driver_rel as { user?: { full_name?: string } | null } | null)?.user?.full_name ?? "D")
                    .split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-medium truncate">
                    {(liveOrder.driver_rel as { user?: { full_name?: string } | null } | null)?.user?.full_name ?? "Livreur"}
                  </p>
                  <p className="text-[10px] text-white/30">Votre commande arrive dans</p>
                  <p className="text-[#3b82f6] text-xs font-bold">{formatETA(liveOrder.estimated_delivery_time)}</p>
                </div>
                {(liveOrder.driver_rel as { user?: { phone?: string } | null } | null)?.user?.phone && (
                  <a href={`tel:${(liveOrder.driver_rel as { user?: { phone?: string } | null } | null)?.user?.phone}`}
                    className="w-9 h-9 rounded-xl bg-[#3b82f6]/20 flex items-center justify-center shrink-0 hover:bg-[#3b82f6]/30 transition-colors"
                  >
                    <PhoneIcon className="w-4 h-4 text-[#3b82f6]" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Help */}
          <div className="bg-[#16161f]/80 backdrop-blur-xl rounded-2xl border border-[#1e1e2e] p-4 hover:border-[#3b82f6]/20 transition-all duration-300">
            <p className="text-white font-semibold text-sm mb-1">{t("app.mkt.needHelp")}</p>
            <p className="text-xs text-white/30 mb-3">Notre équipe est là pour vous.</p>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/support" className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <MessageSquare className="w-4 h-4 text-[#3b82f6]" />
                <span className="text-xs text-white">Chat en direct</span>
              </Link>
              <a href="https://wa.me/237600000000" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#22c55e]/10 hover:bg-[#22c55e]/20 transition-colors"
              >
                <span className="text-sm">💬</span>
                <span className="text-xs text-[#22c55e]">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </aside>
    </div>
  )
}

// ─── Offer Card with countdown ────────────────────────────────────────────────

function OfferCard({ title, sub, desc, from, to, expires }: {
  title: string; sub: string; desc: string; from: string; to: string; expires: Date | null
}) {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    if (!expires) return
    function update() {
      const diff = Math.max(0, expires!.getTime() - Date.now())
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(d > 0
        ? `${d}j ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`
        : `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [expires])

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}
      className="rounded-2xl relative overflow-hidden cursor-pointer"
      style={{ background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)` }}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 p-4">
        <p className="text-white/70 text-[10px] font-semibold tracking-widest">{title}</p>
        <p className="text-3xl font-black text-white mt-1">{sub}</p>
        <p className="text-white/80 text-xs mt-0.5">{desc}</p>
        <div className="flex items-center gap-2 mt-3">
          <div className="bg-black/30 rounded-lg px-2 py-1">
            {expires ? (
              <>
                <p className="text-[9px] text-white/60">Expire dans</p>
                <p className="text-white font-mono text-xs font-bold">{timeLeft}</p>
              </>
            ) : (
              <p className="text-white text-xs font-bold">Offre permanente</p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
