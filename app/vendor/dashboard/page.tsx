"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard, ShoppingBag, Package, TrendingUp, Wallet, Users, UserCog, BarChart3,
  Tag, Star, Settings, HelpCircle, Bell, BellRing, Search, ChevronDown, RefreshCw,
  TrendingDown, AlertTriangle, Clock, CheckCircle, XCircle, Truck,
  ArrowUpRight, Zap, Download, ChevronRight, LogOut, User, Boxes, Ticket,
  MessageSquare, Rocket, Calendar, CreditCard,
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, AreaChart, Area,
} from "recharts"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useT } from "@/lib/i18n/context"
import { toast } from "sonner"

// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem { product_name: string; quantity: number; unit_price: number; total_price: number }
interface RecentOrder {
  id: string; order_number: string; status: string
  total_amount: number | null; total: number | null
  created_at: string; estimated_delivery_time: string | null
  customer: { full_name: string; phone: string; avatar_url: string | null } | null
  items: OrderItem[]
}
interface DashboardData {
  vendor: { id: string; name: string; logo_url: string | null; is_verified: boolean; rating: number | null; status: string; commission_rate: number | null; category: string | null }
  kpi: {
    today_sales: number; today_orders: number; month_revenue: number; active_products: number; rating: number
    yesterday_sales: number; yesterday_orders: number; prev_month_revenue: number; reviews_count: number; month_growth_pct: number
  }
  chart: { date: string; sales: number; orders: number }[]
  recent_orders: RecentOrder[]
  top_products: { name: string; sold: number; revenue: number; image_url: string | null }[]
  sales_by_category: { name: string; revenue: number }[]
  wallet: { available_balance: number; pending_balance: number; total_earned: number; total_withdrawn: number; next_payout_date: string | null; next_payout_amount: number | null } | null
  commission: { yesterday: { gross_amount: number; quickgo_commission: number; vendor_net_amount: number; commission_rate: number } | null; month_total: number; rate: number }
  notifications: { id: string; title: string; message: string; is_read: boolean; created_at: string }[]
  unread_notifications: number
  low_stock: { id: string; name: string; stock_quantity: number; images: string[] | null }[]
  badges: { orders: number; deliveries: number; messages: number; notifications: number }
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, labelKey: "snav.dashboard", href: "/vendor/dashboard", active: true },
  { icon: ShoppingBag,     labelKey: "snav.orders",        href: "/vendor/orders",       badgeKey: "orders" as const },
  { icon: Boxes,           labelKey: "snav.stocks",            href: "/vendor/stocks" },
  { icon: Truck,           labelKey: "snav.deliveries",        href: "/vendor/deliveries",   badgeKey: "deliveries" as const },
  {
    icon: Package, labelKey: "snav.products", href: "/vendor/products", expandable: true,
    children: [
      { labelKey: "vnav.allProducts", href: "/vendor/products" },
      { labelKey: "vnav.addProduct", href: "/vendor/products/new" },
      { labelKey: "snav.categories",         href: "/vendor/products/categories" },
    ],
  },
  { icon: TrendingUp,    labelKey: "snav.revenue",        href: "/vendor/analytics" },
  {
    icon: Wallet, labelKey: "snav.wallet", href: "/vendor/wallet", expandable: true,
    children: [
      { labelKey: "vnav.balanceWithdraw", href: "/vendor/wallet" },
      { labelKey: "vnav.withdrawals",        href: "/vendor/payouts" },
      { labelKey: "vnav.history",      href: "/vendor/wallet/history" },
    ],
  },
  { icon: Users,         labelKey: "snav.crm",    href: "/vendor/crm" },
  { icon: UserCog,       labelKey: "snav.employees",        href: "/vendor/employees" },
  { icon: BarChart3,     labelKey: "vnav.analytics",        href: "/vendor/analytics" },
  { icon: Tag,           labelKey: "snav.promotions",      href: "/vendor/promotions" },
  { icon: Ticket,        labelKey: "snav.coupons",         href: "/vendor/coupons" },
  { icon: Star,          labelKey: "snav.reviews",            href: "/vendor/reviews",      badgeKey: "rating" as const },
  { icon: MessageSquare, labelKey: "snav.messages",        href: "/vendor/messages",     badgeKey: "messages" as const },
  { icon: Bell,          labelKey: "snav.notifications",   href: "/vendor/notifications",badgeKey: "notifications" as const },
  { icon: Settings,      labelKey: "snav.settings",      href: "/vendor/settings" },
  { icon: HelpCircle,    labelKey: "snav.help",            href: "/vendor/help" },
]

const ORDER_STATUS: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending:    { label: "app.status.pending",   color: "text-[#eab308]", bg: "bg-[#eab308]/15", icon: Clock },
  confirmed:  { label: "app.status.confirmed",     color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/15", icon: CheckCircle },
  preparing:  { label: "app.status.preparing",     color: "text-[#8b5cf6]", bg: "bg-[#8b5cf6]/15", icon: Package },
  ready:      { label: "app.status.ready",         color: "text-[#06b6d4]", bg: "bg-[#06b6d4]/15", icon: CheckCircle },
  delivering: { label: "app.status.delivering",     color: "text-[#3b82f6]", bg: "bg-[#3b82f6]/15", icon: Truck },
  delivered:  { label: "app.status.delivered",        color: "text-[#22c55e]", bg: "bg-[#22c55e]/15", icon: CheckCircle },
  cancelled:  { label: "app.status.cancelled",      color: "text-[#ef4444]", bg: "bg-[#ef4444]/15", icon: XCircle },
}

const DONUT_COLORS = ["#22c55e", "#f97316", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4"]

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtCFA(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M FCFA`
  if (n >= 1_000) return `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} FCFA`
  return `${Math.round(n)} FCFA`
}
function orderTotal(o: { total_amount?: number | null; total?: number | null }) {
  return o.total_amount ?? o.total ?? 0
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "À l'instant"
  if (m < 60) return `il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}
function getNotifStyle(n: { title: string; message: string }) {
  const t = (n.title + " " + n.message).toLowerCase()
  if (t.includes("commande"))                                          return { color: "#8b5cf6", Icon: ShoppingBag  }
  if (t.includes("paiement") || t.includes("payé"))                   return { color: "#22c55e", Icon: CheckCircle  }
  if (t.includes("payout") || t.includes("retrait") || t.includes("envoyé")) return { color: "#3b82f6", Icon: CreditCard }
  if (t.includes("avis")   || t.includes("note"))                     return { color: "#f59e0b", Icon: Star         }
  if (t.includes("stock")  || t.includes("produit"))                  return { color: "#f97316", Icon: Package      }
  return { color: "#6b7280", Icon: Bell }
}
function initials(name: string) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
}
function fmtDelivery(order: RecentOrder) {
  if (order.status === "cancelled") return "–"
  if (order.estimated_delivery_time) return order.estimated_delivery_time
  return "–"
}
function diffColor(diff: number) {
  return diff >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
}
function diffLabel(diff: number) {
  return diff >= 0 ? `+${fmtCFA(diff)}` : fmtCFA(diff)
}

// ─── Count-up ─────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let start: number | null = null
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setValue(Math.round(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target, duration])
  return value
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────
function SalesTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#16161f] border border-[#1e1e2e] rounded-xl p-3 text-xs shadow-xl">
      <p className="text-white/50 mb-2 font-medium">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/60">{p.name}:</span>
          <span className="text-white font-bold">{p.name === "Ventes" ? fmtCFA(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, displayValue, comparison, compLabel, color, icon: Icon, sparkData, delay,
}: {
  label: string; value: number; displayValue: string
  comparison?: number; compLabel?: string
  color: string; icon: typeof TrendingUp; sparkData: number[]; delay: number
}) {
  useCountUp(value, 700)
  const diffVal = comparison !== undefined ? value - comparison : undefined
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      whileHover={{ y: -2 }}
      className="relative bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-4
        hover:border-[#3b82f6]/30 hover:shadow-[0_0_24px_rgba(59,130,246,0.07)] transition-all duration-300 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ background: `radial-gradient(circle at 80% 20%, ${color}, transparent 60%)` }} />
      <div className="flex items-center justify-between mb-2">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
        {diffVal !== undefined && (
          <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${diffColor(diffVal)}`}>
            {diffVal >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {diffVal >= 0 ? "+" : ""}{typeof diffVal === "number" && Math.abs(diffVal) >= 1000 ? fmtCFA(Math.abs(diffVal)).replace(" FCFA", "") : Math.abs(diffVal)}
          </span>
        )}
      </div>
      <p className="text-xl font-black text-white leading-tight">{displayValue}</p>
      <p className="text-[11px] text-white/40 mt-0.5">{label}</p>
      {comparison !== undefined && compLabel && (
        <p className={`text-[10px] mt-1 font-medium ${diffColor((diffVal ?? 0))}`}>
          {diffLabel(diffVal ?? 0)} · {compLabel}
        </p>
      )}
      <div className="mt-3 h-9">
        <ResponsiveContainer width="100%" height={36}>
          <AreaChart data={sparkData.map((v) => ({ v }))}>
            <Area type="monotone" dataKey="v" stroke={color} fill={`${color}18`} strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}

// ─── Glass Card ───────────────────────────────────────────────────────────────
function GlassCard({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className={`bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5
        hover:border-[#3b82f6]/20 transition-colors duration-300 ${className}`}
    >
      {children}
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function VendorDashboardPage() {
  const { t } = useT()
  const router = useRouter()
  const [data, setData]       = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod]   = useState(7)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ Produits: false, Portefeuille: false })
  const searchRef = useRef<HTMLInputElement>(null)
  const supabase  = useRef(createClient())

  const fetchDashboard = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/vendor/dashboard?period=${p}`)
      // Rôle "vendor" posé mais aucune ligne `vendors` (onboarding jamais
      // complété) : plutôt que des erreurs "Vendeur introuvable" partout,
      // on renvoie directement vers l'assistant d'inscription.
      if (res.status === 403) { router.replace("/vendor/onboarding"); return }
      if (res.ok) setData(await res.json())
    } finally { setLoading(false) }
  }, [router])

  useEffect(() => { fetchDashboard(7) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Carillon « nouvelle commande » — WebAudio, aucun fichier à charger.
  // Style Uber Eats Merchant : deux notes montantes bien audibles.
  const playOrderChime = useCallback(() => {
    try {
      type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext }
      const Ctx = window.AudioContext ?? (window as AudioWindow).webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      const note = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = "sine"
        osc.frequency.value = freq
        gain.gain.setValueAtTime(0.001, ctx.currentTime + start)
        gain.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur)
        osc.connect(gain).connect(ctx.destination)
        osc.start(ctx.currentTime + start)
        osc.stop(ctx.currentTime + start + dur)
      }
      note(880, 0, 0.35)
      note(1174.66, 0.18, 0.5)
      setTimeout(() => ctx.close().catch(() => {}), 1500)
    } catch { /* audio bloqué par le navigateur */ }
  }, [])

  // Real-time orders — rafraîchit les chiffres + alerte sonore/visuelle
  useEffect(() => {
    if (!data?.vendor.id) return
    const sb = supabase.current
    const channel = sb.channel(`vendor-${data.vendor.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders", filter: `vendor_id=eq.${data.vendor.id}` },
        (payload: { new?: { id?: string; order_number?: string } }) => {
          playOrderChime()
          const row = payload.new
          toast.success("Nouvelle commande reçue ! 🛎️", {
            description: row?.order_number ? `Commande ${row.order_number}` : undefined,
            duration: 10_000,
            action: row?.id
              ? { label: "Voir", onClick: () => { window.location.href = `/vendor/orders/${row.id}` } }
              : undefined,
          })
          fetchDashboard(period)
        })
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [data?.vendor.id, fetchDashboard, period, playOrderChime])

  // Ctrl+K search focus
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const handlePeriod = (p: number) => { setPeriod(p); fetchDashboard(p) }
  const toggleSection = (label: string) => setExpanded((s) => ({ ...s, [label]: !s[label] }))

  const kpi        = data?.kpi
  const chartData  = data?.chart ?? []
  const sparkSales = chartData.map((d) => d.sales)
  const sparkOrders = chartData.map((d) => d.orders)
  const catData    = data?.sales_by_category ?? []
  const catTotal   = catData.reduce((s, c) => s + c.revenue, 0)
  const badges     = data?.badges ?? { orders: 0, deliveries: 0, messages: 0, notifications: 0 }

  function getSidebarBadge(item: typeof SIDEBAR_ITEMS[number]) {
    if (!("badgeKey" in item) || !item.badgeKey) return null
    if (item.badgeKey === "rating") {
      const r = data?.vendor.rating
      return r ? r.toFixed(1) : null
    }
    const count = badges[item.badgeKey as keyof typeof badges]
    return count > 0 ? String(count) : null
  }

  const today = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-[#111118] border-r border-[#1e1e2e]">
        <div className="px-5 py-4 border-b border-[#1e1e2e]">
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
          {SIDEBAR_ITEMS.map((item, idx) => {
            const badge      = getSidebarBadge(item)
            const isExpanded = expanded[item.labelKey]
            const isRating   = "badgeKey" in item && item.badgeKey === "rating"
            return (
              <motion.div key={item.href} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.04 }}>
                {"expandable" in item && item.expandable ? (
                  <>
                    <button onClick={() => toggleSection(item.labelKey)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                        transition-all text-white/40 hover:bg-white/5 hover:text-white">
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{t(item.labelKey)}</span>
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
                    </button>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }} className="overflow-hidden pl-7 mt-0.5 space-y-0.5">
                          {"children" in item && item.children?.map((child) => (
                            <Link key={t(child.labelKey)} href={child.href}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-white/40 hover:bg-white/5 hover:text-white transition-all">
                              <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                              {t(child.labelKey)}
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all
                      ${"active" in item && item.active
                        ? "bg-[#a3e635]/10 border-l-2 border-[#a3e635] text-[#a3e635] rounded-r-xl pl-[10px]"
                        : "rounded-xl text-white/40 hover:bg-white/5 hover:text-white"}`}>
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{t(item.labelKey)}</span>
                    {badge && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                        ${isRating ? "bg-[#f59e0b]/20 text-[#f59e0b]" : "bg-[#3b82f6]/20 text-[#3b82f6]"}`}>
                        {isRating ? `★ ${badge}` : badge}
                      </span>
                    )}
                  </Link>
                )}
              </motion.div>
            )
          })}
        </nav>

        {/* CTA */}
        <div className="p-3 border-t border-[#1e1e2e]">
          <div className="bg-gradient-to-br from-[#a3e635]/15 to-[#3b82f6]/10 border border-[#a3e635]/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Rocket className="w-4 h-4 text-[#a3e635]" />
              <span className="text-white text-sm font-bold">Développez votre activité</span>
            </div>
            <p className="text-white/40 text-[11px] mb-3 leading-snug">Boostez vos ventes avec les publicités QuickGo.</p>
            <Button size="sm" className="w-full h-8 bg-[#a3e635] hover:bg-[#a3e635]/90 text-black font-bold text-xs rounded-lg gap-1.5">
              <Rocket className="w-3 h-3" /> Booster maintenant
            </Button>
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">

        {/* Sticky header */}
        <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-[#1e1e2e] px-5 py-2.5 flex items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
            <input ref={searchRef}
              placeholder="Rechercher une commande, un produit, un client..."
              className="w-full pl-9 pr-14 h-9 bg-[#16161f] border border-[#1e1e2e] rounded-xl text-xs text-white
                placeholder:text-white/20 focus:outline-none focus:border-[#3b82f6]/50 transition-colors" />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-0.5
              text-[9px] text-white/20 bg-[#1e1e2e] px-1.5 py-0.5 rounded font-mono pointer-events-none">
              Ctrl K
            </kbd>
          </div>

          <div className="flex items-center gap-1 ml-auto">
            {/* Messages */}
            <Link href="/vendor/messages"
              className="relative p-2 hover:bg-white/5 rounded-xl transition-colors">
              <MessageSquare className="w-5 h-5 text-white/40" />
              {badges.messages > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#22c55e] rounded-full
                  flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                  {badges.messages}
                </span>
              )}
            </Link>

            {/* Notifications */}
            <Link href="/vendor/notifications"
              className="relative p-2 hover:bg-white/5 rounded-xl transition-colors">
              {badges.notifications > 0
                ? <BellRing className="w-5 h-5 text-[#f59e0b]" />
                : <Bell className="w-5 h-5 text-white/40" />}
              {badges.notifications > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-[#ef4444] rounded-full
                  flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                  {badges.notifications}
                </span>
              )}
            </Link>

            {/* Refresh */}
            <button onClick={() => fetchDashboard(period)}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <RefreshCw className={`w-4 h-4 text-white/40 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-3 border-l border-[#1e1e2e] hover:opacity-90 transition-opacity focus:outline-none ml-1">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center border-2 border-[#a3e635]/50 shrink-0">
                    <span className="text-white font-bold text-xs">{data ? initials(data.vendor.name) : "?"}</span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-white text-xs font-semibold leading-tight max-w-[100px] truncate">{data?.vendor.name ?? "…"}</p>
                    <p className="text-white/30 text-[10px] capitalize">{data?.vendor.category ?? "Vendeur"}</p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-[#16161f] border-[#1e1e2e]">
                <div className="px-3 py-2 border-b border-[#1e1e2e]">
                  <p className="text-white text-sm font-semibold truncate">{data?.vendor.name ?? "Vendeur"}</p>
                  <span className={`text-xs ${data?.vendor.status === "active" ? "text-[#22c55e]" : "text-[#f97316]"}`}>
                    {data?.vendor.status === "active" ? "● Actif" : "● Inactif"}
                  </span>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/vendor/settings" className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer">
                    <User className="h-4 w-4" /> Mon profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/vendor/settings" className="flex items-center gap-2 text-white/70 hover:text-white cursor-pointer">
                    <Settings className="h-4 w-4" /> Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#1e1e2e]" />
                <DropdownMenuItem
                  onClick={async () => { await supabase.current.auth.signOut(); window.location.href = "/" }}
                  className="flex items-center gap-2 text-red-400 hover:text-red-300 cursor-pointer focus:text-red-300">
                  <LogOut className="h-4 w-4" /> Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Welcome + date */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-black text-white">
                {t("vdash.welcome")}, {data?.vendor.name?.split(" ")[0] ?? "…"} 👋
              </h1>
              <p className="text-sm text-white/30 mt-0.5">Voici un aperçu de votre activité aujourd&apos;hui.</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#16161f] border border-[#1e1e2e] rounded-xl">
              <Calendar className="w-4 h-4 text-[#3b82f6]" />
              <span className="text-xs text-white/60 capitalize">{today}</span>
            </div>
          </motion.div>

          {/* KPI strip */}
          {loading && !data ? (
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-36 rounded-2xl bg-[#16161f] animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
              <KpiCard label={t("vdash.kpi.todaySales")} value={kpi?.today_sales ?? 0}
                displayValue={fmtCFA(kpi?.today_sales ?? 0)}
                comparison={kpi?.yesterday_sales} compLabel="vs hier"
                color="#22c55e" icon={TrendingUp} sparkData={sparkSales} delay={0} />
              <KpiCard label={t("vdash.kpi.todayOrders")} value={kpi?.today_orders ?? 0}
                displayValue={String(kpi?.today_orders ?? 0)}
                comparison={kpi?.yesterday_orders} compLabel="vs hier"
                color="#3b82f6" icon={ShoppingBag} sparkData={sparkOrders} delay={0.05} />
              <KpiCard label={t("vdash.kpi.monthRevenue")} value={kpi?.month_revenue ?? 0}
                displayValue={fmtCFA(kpi?.month_revenue ?? 0)}
                comparison={kpi?.prev_month_revenue} compLabel="vs mois dernier"
                color="#a3e635" icon={BarChart3} sparkData={sparkSales} delay={0.1} />
              <KpiCard label={t("vdash.kpi.activeProducts")} value={kpi?.active_products ?? 0}
                displayValue={String(kpi?.active_products ?? 0)}
                color="#8b5cf6" icon={Package} sparkData={sparkOrders} delay={0.15} />
              <KpiCard label={t("vdash.kpi.rating")} value={kpi?.rating ?? 0}
                displayValue={`${(kpi?.rating ?? 0).toFixed(1)}/5`}
                compLabel={kpi?.reviews_count ? `Basé sur ${kpi.reviews_count} avis` : undefined}
                color="#f97316" icon={Star} sparkData={sparkOrders} delay={0.2} />
            </div>
          )}

          {/* Charts row */}
          <div className="grid xl:grid-cols-3 gap-4">
            {/* Line chart */}
            <GlassCard className="xl:col-span-2" delay={0.25}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-sm">{t("vdash.salesOverview")}</h3>
                  <p className="text-xs text-white/30 mt-0.5">Ventes &amp; commandes</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-lg p-0.5">
                    {[{ v: 7, l: "7j" }, { v: 30, l: "30j" }, { v: 90, l: "90j" }].map(({ v, l }) => (
                      <button key={v} onClick={() => handlePeriod(v)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all
                          ${period === v ? "bg-[#a3e635] text-black font-bold" : "text-white/40 hover:text-white"}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <button className="flex items-center gap-1 text-[11px] text-white/30 hover:text-white transition-colors">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {loading && !data ? (
                <div className="h-52 rounded-xl bg-white/5 animate-pulse" />
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                    <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis yAxisId="left" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<SalesTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11, color: "#888", paddingTop: 8 }} />
                    <Line yAxisId="left"  type="monotone" dataKey="sales"  name="Ventes"     stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#22c55e" }} />
                    <Line yAxisId="right" type="monotone" dataKey="orders" name="Commandes"  stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "#3b82f6" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </GlassCard>

            {/* Category donut */}
            <GlassCard delay={0.3}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-bold text-sm">{t("vdash.salesBreakdown")}</h3>
                  <p className="text-xs text-white/30 mt-0.5">Par catégorie</p>
                </div>
                <span className="text-[10px] text-white/30 bg-[#1e1e2e] px-2 py-1 rounded-lg">
                  {period === 7 ? t("vdash.thisWeek") : period === 30 ? t("vdash.thisMonth") : t("vdash.thisQuarter")}
                </span>
              </div>
              {loading && !data ? (
                <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
              ) : catData.length > 0 ? (
                <div className="flex flex-col gap-3">
                  <div className="relative flex justify-center">
                    <ResponsiveContainer width={150} height={150}>
                      <PieChart>
                        <Pie data={catData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} dataKey="revenue" strokeWidth={0}>
                          {catData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v: number) => fmtCFA(v)} wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[9px] text-white/30">Total</p>
                      <p className="text-xs font-black text-white">{fmtCFA(catTotal)}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {catData.map((cat, i) => {
                      const pct = catTotal > 0 ? Math.round((cat.revenue / catTotal) * 100) : 0
                      return (
                        <div key={cat.name} className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                          <span className="text-white/50 text-xs flex-1 truncate">{cat.name}</span>
                          <span className="text-white text-xs font-medium">{fmtCFA(cat.revenue)}</span>
                          <span className="text-white/25 text-[10px] w-8 text-right">{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-white/30 text-xs text-center py-8">Pas encore de données</p>
              )}
            </GlassCard>
          </div>

          {/* Orders + Top products */}
          <div className="grid lg:grid-cols-5 gap-4">
            {/* Recent orders */}
            <GlassCard className="lg:col-span-3" delay={0.35}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-sm">{t("vdash.recentOrders")}</h3>
                <Link href="/vendor/orders" className="text-xs text-[#3b82f6] hover:text-[#3b82f6]/80 flex items-center gap-1 transition-colors">
                  {t("vdash.seeAll")} <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              {loading && !data ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}</div>
              ) : (data?.recent_orders ?? []).length === 0 ? (
                <p className="text-white/30 text-sm text-center py-8">{t("vdash.noOrders")}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px]">
                    <thead>
                      <tr className="text-[10px] text-white/30 border-b border-[#1e1e2e]">
                        <th className="pb-2.5 text-left font-medium">Commande</th>
                        <th className="pb-2.5 text-left font-medium">Client</th>
                        <th className="pb-2.5 text-left font-medium">Statut</th>
                        <th className="pb-2.5 text-right font-medium">Montant</th>
                        <th className="pb-2.5 text-right font-medium">Livraison</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e1e2e]">
                      {(data?.recent_orders ?? []).map((order) => {
                        const cfg          = ORDER_STATUS[order.status]
                        const StatusIcon   = cfg?.icon ?? Clock
                        const customerName = (order.customer as { full_name?: string } | null)?.full_name ?? "Client"
                        return (
                          <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3">
                              <p className="text-white/60 text-xs font-mono">#{order.order_number}</p>
                              <p className="text-white/25 text-[10px]">{(order.items?.length ?? 0)} article{(order.items?.length ?? 0) > 1 ? "s" : ""}</p>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center shrink-0">
                                  <span className="text-white font-bold text-[9px]">{initials(customerName)}</span>
                                </div>
                                <div>
                                  <p className="text-white text-xs font-medium leading-tight">{customerName}</p>
                                  <p className="text-white/25 text-[10px]">{(order.customer as { phone?: string } | null)?.phone ?? "—"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg?.bg ?? ""} ${cfg?.color ?? ""}`}>
                                <StatusIcon className="w-2.5 h-2.5" />
                                {cfg ? t(cfg.label) : order.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <span className="text-white font-semibold text-xs">{fmtCFA(orderTotal(order))}</span>
                            </td>
                            <td className="py-3 text-right">
                              <span className="text-white/40 text-xs">{fmtDelivery(order)}</span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </GlassCard>

            {/* Top products */}
            <GlassCard className="lg:col-span-2" delay={0.4}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold text-sm">{t("vdash.topProducts")}</h3>
                <Link href="/vendor/products" className="text-xs text-[#3b82f6] hover:text-[#3b82f6]/80 flex items-center gap-1 transition-colors">
                  {t("vdash.seeAll")} <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              {loading && !data ? (
                <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}</div>
              ) : (data?.top_products ?? []).length === 0 ? (
                <p className="text-white/30 text-xs text-center py-8">Pas encore de données</p>
              ) : (
                <div className="space-y-3">
                  {(data?.top_products ?? []).map((p, i) => (
                    <motion.div key={p.name} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.06 }}
                      className="flex items-center gap-3">
                      {/* thumbnail */}
                      <div className="w-10 h-10 rounded-xl shrink-0 overflow-hidden"
                        style={{ background: `${DONUT_COLORS[i % DONUT_COLORS.length]}22`, border: `1px solid ${DONUT_COLORS[i % DONUT_COLORS.length]}33` }}>
                        {p.image_url
                          ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-4 h-4" style={{ color: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                            </div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-medium truncate">{p.name}</p>
                        <p className="text-white/30 text-[10px]">{p.sold} vendus</p>
                      </div>
                      <span className="text-white text-xs font-semibold shrink-0">{fmtCFA(p.revenue)}</span>
                    </motion.div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Growth banner */}
          <AnimatePresence>
            {(kpi?.month_growth_pct ?? 0) > 0 && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
                transition={{ delay: 0.5 }}
                className="relative overflow-hidden rounded-2xl border border-[#22c55e]/20 p-5 flex items-center gap-5"
                style={{ background: "linear-gradient(135deg, #22c55e12, #a3e63508)" }}>
                <motion.div
                  animate={{ rotate: [0, -10, 10, -5, 5, 0], y: [0, -4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="w-12 h-12 rounded-2xl bg-[#22c55e]/15 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6 text-[#22c55e]" />
                </motion.div>
                <div className="flex-1">
                  <p className="text-white font-bold">Vos ventes augmentent !</p>
                  <p className="text-white/50 text-sm mt-0.5">
                    Félicitations ! Vos ventes ont augmenté de{" "}
                    <span className="text-[#22c55e] font-semibold">{kpi?.month_growth_pct}%</span>{" "}
                    ce mois-ci.
                  </p>
                </div>
                <Link href="/vendor/analytics"
                  className="shrink-0 px-4 py-2 rounded-xl border border-[#22c55e]/40 text-[#22c55e] text-xs font-semibold
                    hover:bg-[#22c55e]/10 transition-colors hidden sm:block">
                  Voir les statistiques détaillées
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>

      {/* ── Right sidebar ─────────────────────────────────────────────────────── */}
      <aside className="hidden xl:flex w-72 shrink-0 flex-col bg-[#111118] border-l border-[#1e1e2e] overflow-y-auto">

        {/* Mon Wallet header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1e1e2e]">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-[#3b82f6]" />
            <h3 className="text-white font-bold text-sm">{t("vdash.myWallet")}</h3>
          </div>
          <Link href="/vendor/wallet" className="text-xs text-[#3b82f6] hover:text-[#3b82f6]/80 transition-colors flex items-center gap-1">
            {t("vdash.seeAll")} <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-4 space-y-3 border-b border-[#1e1e2e]">
          {loading && !data ? (
            <div className="h-24 rounded-xl bg-white/5 animate-pulse" />
          ) : (
            <>
              <div className="rounded-xl p-4" style={{ background: "linear-gradient(135deg, #3b82f620, #06b6d410)", border: "1px solid #3b82f630" }}>
                <p className="text-white/40 text-xs mb-1">Solde disponible</p>
                <motion.p key={data?.wallet?.available_balance}
                  initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                  className="text-2xl font-black text-white">
                  {fmtCFA(data?.wallet?.available_balance ?? 0)}
                </motion.p>
                <Button className="w-full mt-3 h-8 bg-[#22c55e] hover:bg-[#22c55e]/90 text-white font-bold text-xs rounded-xl gap-1.5">
                  <Download className="w-3 h-3" /> Demander un retrait
                </Button>
              </div>

              <div className="space-y-2">
                <div className="bg-[#16161f] border border-[#1e1e2e] rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-xs">En attente</p>
                    <p className="text-[#f59e0b] text-lg font-black mt-0.5 leading-tight">
                      {fmtCFA(data?.wallet?.pending_balance ?? 0)}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-[#f59e0b]/15 flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4 text-[#f59e0b]" />
                  </div>
                </div>
                <div className="bg-[#16161f] border border-[#1e1e2e] rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-white/40 text-xs">Total retiré</p>
                    <p className="text-white text-lg font-black mt-0.5 leading-tight">
                      {fmtCFA(data?.wallet?.total_withdrawn ?? 0)}
                    </p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-[#3b82f6]/15 flex items-center justify-center shrink-0">
                    <CreditCard className="w-4 h-4 text-[#3b82f6]" />
                  </div>
                </div>
              </div>

              {data?.wallet?.next_payout_date && (
                <div className="bg-[#16161f] border border-[#1e1e2e] rounded-xl px-4 py-3">
                  <p className="text-white/40 text-xs font-medium mb-2">Prochain payout</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-white/30 text-[10px] mb-0.5">Date estimée</p>
                      <p className="text-white text-xs font-semibold">
                        {new Date(data.wallet.next_payout_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                    {data.wallet.next_payout_amount && (
                      <div>
                        <p className="text-white/30 text-[10px] mb-0.5">Montant estimé</p>
                        <p className="text-[#3b82f6] text-xs font-semibold">{fmtCFA(data.wallet.next_payout_amount)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Link href="/vendor/payouts"
                className="flex items-center justify-between text-xs text-[#3b82f6] hover:text-[#3b82f6]/80 transition-colors py-1 px-1">
                <span>Voir l&apos;historique des payouts</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Stock faible */}
        <div className="p-4 border-b border-[#1e1e2e]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-[#f97316]" />
              <h4 className="text-white text-xs font-bold">{t("vdash.lowStock")}</h4>
            </div>
            <Link href="/vendor/stocks" className="text-[10px] text-[#3b82f6] hover:opacity-80">{t("vdash.seeAll")}</Link>
          </div>
          {loading && !data ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-10 rounded-xl bg-white/5 animate-pulse" />)}
            </div>
          ) : (data?.low_stock ?? []).length === 0 ? (
            <p className="text-white/20 text-xs text-center py-3">Tous les stocks sont OK ✓</p>
          ) : (
            <div className="space-y-2.5">
              {(data?.low_stock ?? []).map((p) => {
                const isCritical = p.stock_quantity <= 5
                return (
                  <div key={p.id} className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0"
                      style={{ background: isCritical ? "#ef444420" : "#f9741620", border: `1px solid ${isCritical ? "#ef444440" : "#f9741640"}` }}>
                      {p.images?.[0]
                        ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-4 h-4" style={{ color: isCritical ? "#ef4444" : "#f97316" }} />
                          </div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{p.name}</p>
                      <p className="text-white/30 text-[10px]">Stock restant : {p.stock_quantity}</p>
                    </div>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0
                      ${isCritical ? "bg-[#ef4444]/15 text-[#ef4444]" : "bg-[#f97316]/15 text-[#f97316]"}`}>
                      {isCritical ? "Critique" : "Faible"}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Notifications récentes */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-white/40" />
              <h4 className="text-white text-xs font-bold">{t("vdash.recentNotifs")}</h4>
              {(data?.unread_notifications ?? 0) > 0 && (
                <span className="text-[9px] bg-[#ef4444] text-white px-1.5 py-0.5 rounded-full font-bold">
                  {data?.unread_notifications}
                </span>
              )}
            </div>
            <Link href="/vendor/notifications" className="text-[10px] text-[#3b82f6] hover:opacity-80">{t("vdash.seeAll")}</Link>
          </div>
          {loading && !data ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-12 rounded-xl bg-white/5 animate-pulse" />)}
            </div>
          ) : (data?.notifications ?? []).length === 0 ? (
            <p className="text-white/20 text-xs text-center py-3">{t("vdash.noNotifs")}</p>
          ) : (
            <div className="space-y-2">
              {(data?.notifications ?? []).slice(0, 3).map((n) => {
                const { color, Icon } = getNotifStyle(n)
                return (
                  <motion.div key={n.id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2.5 rounded-xl p-2.5 border-l-2"
                    style={{ background: `${color}08`, borderLeftColor: color }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: `${color}20` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[11px] font-medium leading-tight">{n.title}</p>
                      <p className="text-white/40 text-[10px] mt-0.5 truncate">{n.message}</p>
                    </div>
                    <p className="text-white/25 text-[9px] shrink-0 mt-0.5 whitespace-nowrap">{timeAgo(n.created_at)}</p>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>

      </aside>
    </div>
  )
}
