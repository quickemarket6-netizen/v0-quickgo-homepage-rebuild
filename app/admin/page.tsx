"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, Users, Truck, Store, BarChart3,
  Settings, Bell, ChevronDown, TrendingUp, DollarSign,
  MapPin, RefreshCw, Eye, Activity, ShieldCheck, Wallet, Search,
  MessageCircle, Shield, FileText, ShoppingBag,
  Tag, CreditCard, AlertTriangle, CheckCircle, XCircle,
  Zap, UserPlus, LogOut, ChevronRight, ArrowUpRight,
  ArrowDownRight, Clock, Globe, X, User, ExternalLink,
  Navigation, Layers, Lock, Plug, Database, Headphones } from "lucide-react"
import {
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid } from "recharts"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"
import { createClient } from "@/lib/supabase/client"

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrateur",
}
function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "AD"
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase()
}
async function adminSignOut() {
  try {
    const supabase = createClient()
    await supabase.auth.signOut()
  } finally {
    window.location.href = "/auth/login"
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────
function fmtCFA(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K"
  return String(Math.round(n))
}
function fmtCFAFull(n: number) { return fmtCFA(n) + " CFA" }
function fmtTime(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return "À l'instant"
  if (diff < 60) return `Il y a ${diff}min`
  if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`
  return `Il y a ${Math.floor(diff / 1440)}j`
}
function pctArrow(val: number) {
  if (val > 0) return { sign: "+", color: "text-green-400", Icon: ArrowUpRight }
  if (val < 0) return { sign: "", color: "text-red-400", Icon: ArrowDownRight }
  return { sign: "", color: "text-gray-400", Icon: ArrowUpRight }
}

// ── types ─────────────────────────────────────────────────────────────────────
interface AdminDashData {
  kpi: {
    today_revenue: number; yesterday_revenue: number
    today_orders: number; yesterday_orders: number
    active_deliveries: number; yesterday_deliveries: number
    active_vendors: number; yesterday_vendors: number
    online_drivers: number; yesterday_drivers: number
  }
  chart_24h: { hour: string; revenue: number; orders: number }[]
  financial: {
    total: number; vendor_payouts: number; quickgo_commission: number
    delivery_fees: number; refunds: number; net_profit: number
    net_profit_change: number; wallet_livraison: number
    pending_payouts_count: number; pending_payouts_amount: number
    failed_transactions_count: number; failed_transactions_amount: number
  }
  city_stats: { city: string; orders: number; revenue: number; pct: number }[]
  pending_payouts: { id: string; vendor_name: string; vendor_logo: string | null; amount: number; method: string }[]
  activities: { id: string; type: string; title: string; subtitle: string; status?: string; timestamp: string }[]
  ai_alerts: { id: string; title: string; description: string; severity: "high" | "medium" | "low"; count: number; timestamp: string }[]
  system_status: Record<string, string>
  top_categories: { name: string; pct: number }[]
  performance: { availability: number; response_time: number; uptime: number }
  badges: { vendors: number; drivers: number; orders: number; deliveries: number; payouts: number; crm_support: number; notifications: number }
}

// ── sidebar items ─────────────────────────────────────────────────────────────
type NavItem = { icon: typeof Package; label: string; href: string; badgeKey: string | null; active?: boolean; arrow?: boolean }
const NAV: NavItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord",     href: "/admin",               badgeKey: null,            active: true  },
  { icon: DollarSign,      label: "Finances",             href: "/admin/finances",      badgeKey: null,            arrow: true   },
  { icon: Store,           label: "Vendeurs",             href: "/admin/vendors",       badgeKey: "vendors"                      },
  { icon: Truck,           label: "Chauffeurs",           href: "/admin/drivers",       badgeKey: "drivers"                      },
  { icon: Package,         label: "Commandes",            href: "/admin/orders",        badgeKey: "orders"                       },
  { icon: Navigation,      label: "Livraisons",           href: "/admin/deliveries",    badgeKey: "deliveries"                   },
  { icon: Wallet,          label: "Wallets",              href: "/admin/wallets",       badgeKey: null                           },
  { icon: CreditCard,      label: "Payouts",              href: "/admin/payouts",       badgeKey: "payouts"                      },
  { icon: FileText,        label: "Transactions",         href: "/admin/transactions",  badgeKey: null                           },
  { icon: Activity,        label: "Analytics IA",         href: "/admin/analytics",     badgeKey: null                           },
  { icon: ShieldCheck,     label: "Sécurité",             href: "/admin/security",      badgeKey: null                           },
  { icon: MessageCircle,   label: "CRM & Support",        href: "/admin/support",       badgeKey: "crm_support"                  },
  { icon: Bell,            label: "Notifications",        href: "/admin/notifications", badgeKey: "notifications"                },
  { icon: MapPin,          label: "Gestion des villes",   href: "/admin/zones",         badgeKey: null                           },
  { icon: Settings,        label: "Paramètres",           href: "/admin/settings",      badgeKey: null                           },
  { icon: Layers,          label: "CMS & Pages",          href: "/admin/cms",           badgeKey: null                           },
  { icon: Globe,           label: "SEO Center",           href: "/admin/seo",           badgeKey: null                           },
  { icon: Users,           label: "Utilisateurs",         href: "/admin/users",         badgeKey: null                           },
  { icon: Lock,            label: "Permissions & Rôles",  href: "/admin/permissions",   badgeKey: null                           },
  { icon: FileText,        label: "Logs système",         href: "/admin/logs",          badgeKey: null                           },
  { icon: Plug,            label: "API & Intégrations",   href: "/admin/api",           badgeKey: null                           },
  { icon: Database,        label: "Sauvegardes",          href: "/admin/backups",       badgeKey: null                           },
  { icon: Headphones,      label: "Support technique",    href: "/admin/support-tech",  badgeKey: null                           },
]

const DONUT_COLORS = ["#3b82f6", "#22d3ee", "#a3e635", "#f59e0b", "#f43f5e"]
const CAT_COLORS   = ["#3b82f6", "#22d3ee", "#a3e635", "#f59e0b", "#f43f5e", "#8b5cf6"]
const SEV_CFG: Record<string, { label: string; cls: string; dot: string; leftBorder: string; badge: string; color: string; pulse: boolean }> = {
  high:   { label: "Critique", cls: "border-red-500/40 bg-red-500/[0.07]",    dot: "bg-red-400",    leftBorder: "border-l-red-500",    badge: "bg-red-500/20 text-red-300 border border-red-500/30",    color: "#ef4444", pulse: true  },
  medium: { label: "Moyen",    cls: "border-orange-500/30 bg-orange-500/[0.06]", dot: "bg-orange-400", leftBorder: "border-l-orange-500", badge: "bg-orange-500/20 text-orange-300 border border-orange-500/30", color: "#f97316", pulse: false },
  low:    { label: "Faible",   cls: "border-yellow-500/25 bg-yellow-500/[0.05]", dot: "bg-yellow-400", leftBorder: "border-l-yellow-500", badge: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30", color: "#eab308", pulse: false },
}
const ACT_CFG: Record<string, { color: string; iconBg: string; label: string; dot: string; Icon: typeof Package }> = {
  order:    { color: "text-blue-400",   iconBg: "bg-blue-500/15",   dot: "bg-blue-500",   label: "Commande", Icon: Package },
  vendor:   { color: "text-green-400",  iconBg: "bg-green-500/15",  dot: "bg-green-500",  label: "Vendeur",  Icon: Store },
  driver:   { color: "text-purple-400", iconBg: "bg-purple-500/15", dot: "bg-purple-500", label: "Livreur",  Icon: Truck },
  security: { color: "text-red-400",    iconBg: "bg-red-500/15",    dot: "bg-red-500",    label: "Sécurité", Icon: Shield },
}
const ACT_FILTER_LABELS: Record<string, string> = { all: "Tout", order: "Commandes", vendor: "Vendeurs", driver: "Livreurs", security: "Sécurité" }
const STATUS_PILL: Record<string, string> = {
  pending:    "bg-yellow-500/15 text-yellow-300 border border-yellow-500/25",
  confirmed:  "bg-blue-500/15 text-blue-300 border border-blue-500/25",
  preparing:  "bg-violet-500/15 text-violet-300 border border-violet-500/25",
  ready:      "bg-cyan-500/15 text-cyan-300 border border-cyan-500/25",
  delivering: "bg-sky-500/15 text-sky-300 border border-sky-500/25",
  delivered:  "bg-green-500/15 text-green-300 border border-green-500/25",
  cancelled:  "bg-red-500/15 text-red-300 border border-red-500/25",
  high:       "bg-red-500/15 text-red-300 border border-red-500/25",
  medium:     "bg-orange-500/15 text-orange-300 border border-orange-500/25",
  low:        "bg-yellow-500/15 text-yellow-300 border border-yellow-500/25",
}
const SYS_ICONS: Record<string, typeof Package> = {
  api_quickgo: Zap, api_cinetpay: CreditCard, database: FileText, storage: ShoppingBag, notifications: Bell,
}
const SYS_LABELS: Record<string, string> = {
  api_quickgo: "API QuickGo", api_cinetpay: "API CinetPay", database: "Base de données", storage: "Stockage", notifications: "Notifications",
}
const SYS_DETAIL: Record<string, { uptime: number; latency: number }> = {
  api_quickgo:   { uptime: 99.9, latency: 12 },
  api_cinetpay:  { uptime: 99.8, latency: 48 },
  database:      { uptime: 99.9, latency: 4  },
  storage:       { uptime: 100,  latency: 22 },
  notifications: { uptime: 100,  latency: 7  },
}
const CAT_EMOJIS: Record<string, string> = {
  "Restauration":"🍽️","Épicerie":"🛒","Pharmacie":"💊","Électronique":"📱",
  "Mode":"👗","Boissons":"🥤","Boulangerie":"🍞","Beauté":"💄",
  "Sport":"⚽","Maison":"🏠","Autres":"📦",
}

const METHOD_CFG: Record<string, { color: string; bg: string; border: string }> = {
  "Orange Money": { color: "text-orange-300", bg: "bg-orange-500/15", border: "border-orange-500/25" },
  "Wave":         { color: "text-blue-300",   bg: "bg-blue-500/15",   border: "border-blue-500/25"   },
  "MTN Money":    { color: "text-yellow-300", bg: "bg-yellow-500/15", border: "border-yellow-500/25" },
  "CinetPay":     { color: "text-green-300",  bg: "bg-green-500/15",  border: "border-green-500/25"  },
  "PayPal":       { color: "text-indigo-300", bg: "bg-indigo-500/15", border: "border-indigo-500/25" },
  "Virement":     { color: "text-purple-300", bg: "bg-purple-500/15", border: "border-purple-500/25" },
}
const METHOD_DEFAULT = { color: "text-[#6b6b8a]", bg: "bg-[#1e1e2e]", border: "border-[#2a2a3e]" }

// ── sparkline ────────────────────────────────────────────────────────────────
function Spark({ data, color, id }: { data: number[]; color: string; id: string }) {
  const pts = data.map((v, i) => ({ v, i }))
  const gradId = `spark-${id}`
  return (
    <ResponsiveContainer width="100%" height={52}>
      <AreaChart data={pts} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{ background: "#16161f", border: "1px solid #2a2a3e", borderRadius: 6, fontSize: 10, padding: "2px 8px" }}
          itemStyle={{ color: "#fff" }}
          labelStyle={{ display: "none" }}
          formatter={(v: number) => [v, ""]}
          cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: "3 3" }}
        />
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2}
          fill={`url(#${gradId})`} dot={false}
          activeDot={{ r: 3, fill: color, stroke: "#16161f", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── count-up value ─────────────────────────────────────────────────────────
function CountUp({ target, format }: { target: number; format: (n: number) => string }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) { setVal(0); return }
    const duration = 900
    const steps = 40
    const step = target / steps
    let current = 0
    let frame = 0
    const id = setInterval(() => {
      frame++
      current = Math.min(current + step, target)
      setVal(current)
      if (frame >= steps) clearInterval(id)
    }, duration / steps)
    return () => clearInterval(id)
  }, [target])
  return <>{format(val)}</>
}

// ── SVG circular gauge ───────────────────────────────────────────────────────
function CircleGauge({ value, max = 100, label, unit, color, invert = false }: {
  value: number; max?: number; label: string; unit: string; color: string; invert?: boolean
}) {
  const pct   = Math.min(Math.max(invert ? 1 - value / max : value / max, 0), 1)
  const r     = 26
  const circ  = 2 * Math.PI * r
  const dash  = circ * pct
  const quality = pct >= 0.97 ? "Excellent" : pct >= 0.85 ? "Bon" : pct >= 0.65 ? "Dégradé" : "Critique"
  const qColor  = pct >= 0.97 ? "#22c55e" : pct >= 0.85 ? "#3b82f6" : pct >= 0.65 ? "#f59e0b" : "#ef4444"

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-14 h-14 shrink-0">
        <svg viewBox="0 0 64 64" className="w-full h-full" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="32" cy="32" r={r} fill="none" stroke="#1e1e2e" strokeWidth="5" />
          <motion.circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${dash} ${circ - dash}` }}
            transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-white font-extrabold text-xs leading-none tabular-nums">{value}{unit}</span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-white text-xs font-semibold leading-none">{label}</p>
        <p className="text-[10px] mt-0.5 font-medium" style={{ color: qColor }}>{quality}</p>
      </div>
    </div>
  )
}

// ── Cameroon SVG map ─────────────────────────────────────────────────────────
const CITY_COORDS: Record<string, [number, number]> = {
  "Douala":      [44,  173],
  "Yaoundé":     [90,  164],
  "Bafoussam":   [47,  143],
  "Garoua":      [112,  85],
  "Bamenda":     [34,  127],
  "Buea":        [32,  180],
  "Limbe":       [25,  186],
  "Maroua":      [124,  43],
  "Ngaoundéré":  [103, 118],
  "Bertoua":     [133, 152],
}
const CAMEROON_PATH =
  "M78,4 L83,13 L89,19 L96,13 L106,19 L116,13 L138,30 L147,52 " +
  "L141,79 L149,102 L147,130 L139,153 L129,173 L113,191 " +
  "L93,199 L72,197 L51,191 L34,179 L20,161 L15,139 " +
  "L19,115 L13,91 L19,67 L27,49 L40,34 L53,22 L65,10 Z"

function CameroonMap({
  cities, colors, metric, hoveredCity, onHover,
}: {
  cities: { city: string; orders: number; revenue: number; pct: number }[]
  colors: string[]
  metric: "orders" | "revenue"
  hoveredCity: string | null
  onHover: (c: string | null) => void
}) {
  const maxVal = Math.max(...cities.map(c => metric === "orders" ? c.orders : c.revenue), 1)

  return (
    <svg viewBox="0 0 160 204" className="w-full" style={{ maxHeight: 148 }}>
      {/* subtle grid */}
      <defs>
        <pattern id="mapgrid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#ffffff06" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="160" height="204" fill="url(#mapgrid)" />

      {/* Cameroon outline */}
      <path d={CAMEROON_PATH} fill="#1a1a26" stroke="#2a2a3e" strokeWidth="1.5" strokeLinejoin="round" />

      {/* city pins */}
      {cities.slice(0, 8).map((c, i) => {
        const [cx, cy] = CITY_COORDS[c.city] ?? [80, 120]
        const val = metric === "orders" ? c.orders : c.revenue
        const r = 3 + (val / maxVal) * 9
        const color = colors[i % colors.length]
        const active = hoveredCity === c.city
        const isTop  = i === 0

        // label anchor: push right for left-side cities, left for right-side
        const labelX = cx < 80 ? cx + r + 3 : cx - r - 3
        const anchor  = cx < 80 ? "start" : "end"

        return (
          <g key={c.city} style={{ cursor: "pointer" }}
            onMouseEnter={() => onHover(c.city)}
            onMouseLeave={() => onHover(null)}
          >
            {/* outer glow ring */}
            <circle cx={cx} cy={cy} r={r + 5} fill={color}
              opacity={active ? 0.18 : 0} style={{ transition: "opacity .15s" }} />
            {/* halo */}
            <circle cx={cx} cy={cy} r={r + 2} fill={color} opacity={active ? 0.25 : 0.12} />
            {/* main pin */}
            <circle cx={cx} cy={cy} r={r} fill={color} opacity={active ? 1 : 0.75} />
            {/* white center dot */}
            <circle cx={cx} cy={cy} r={Math.max(1.5, r * 0.3)} fill="#fff" opacity={0.8} />
            {/* label */}
            {(active || isTop) && (
              <text x={labelX} y={cy + 1} textAnchor={anchor} fill={active ? "#fff" : "#9ca3af"}
                fontSize="7" fontWeight={active ? "700" : "400"} style={{ pointerEvents: "none" }}>
                {c.city}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Chart24 custom tooltip ────────────────────────────────────────────────────
interface TooltipPayloadItem { value: number; name: string; color: string }
function Chart24Tooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#111118] border border-[#2a2a3e] rounded-xl px-3 py-2.5 shadow-2xl">
      <p className="text-[#6b6b8a] text-[10px] font-semibold mb-2 uppercase tracking-wider">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 text-xs py-0.5">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-[#6b6b8a]">{p.name === "revenue" ? "Revenus" : "Commandes"}</span>
          <span className="text-white font-bold ml-2 tabular-nums">
            {p.name === "revenue" ? fmtCFAFull(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [data,       setData]       = useState<AdminDashData | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [search,     setSearch]     = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const [city,       setCity]       = useState("Toutes")
  const [notifOpen,  setNotifOpen]  = useState(false)
  const [userOpen,   setUserOpen]   = useState(false)
  const [me,         setMe]         = useState<{ name: string; roleLabel: string; initials: string } | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const notifRef  = useRef<HTMLDivElement>(null)
  const userRef   = useRef<HTMLDivElement>(null)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard")
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? (res.status === 403 ? "Accès refusé — session admin requise" : `Erreur ${res.status}`))
      }
      setData(await res.json())
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement du tableau de bord")
    } finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Real admin identity for the header (name, role, initials).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: prof } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single()
        if (cancelled) return
        const name = prof?.full_name || user.email?.split("@")[0] || "Administrateur"
        setMe({ name, roleLabel: ROLE_LABELS[prof?.role ?? ""] ?? "Compte admin", initials: initialsFrom(name) })
      } catch { /* keep neutral fallback */ }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchRef.current?.focus(), 50)
      }
      if (e.key === "Escape") setSearchOpen(false)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (userRef.current  && !userRef.current.contains(e.target as Node))  setUserOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [])

  function badge(key: string | null) {
    if (!key || !data?.badges) return 0
    return (data.badges as Record<string, number>)[key] ?? 0
  }

  const kpi = data?.kpi
  const fin = data?.financial
  const chart24 = data?.chart_24h ?? []

  const kpiCards = [
    {
      id:    "revenue",
      label: "Revenus aujourd'hui",
      cur:   kpi?.today_revenue    ?? 0,
      prev:  kpi?.yesterday_revenue ?? 0,
      spark: chart24.map(h => h.revenue),
      fmt:   fmtCFAFull,
      color: "#3b82f6",
      icon:  DollarSign,
      href:  "/admin/finances",
      isMoney: true,
    },
    {
      id:    "orders",
      label: "Commandes actives",
      cur:   kpi?.today_orders    ?? 0,
      prev:  kpi?.yesterday_orders ?? 0,
      spark: chart24.map(h => h.orders),
      fmt:   (n: number) => String(Math.round(n)),
      color: "#22d3ee",
      icon:  Package,
      href:  "/admin/orders",
      isMoney: false,
    },
    {
      id:    "deliveries",
      label: "Livraisons en cours",
      cur:   kpi?.active_deliveries    ?? 0,
      prev:  kpi?.yesterday_deliveries ?? 0,
      spark: chart24.map(h => Math.round(h.orders * 0.4)),
      fmt:   (n: number) => String(Math.round(n)),
      color: "#a3e635",
      icon:  Truck,
      href:  "/admin/orders",
      isMoney: false,
    },
    {
      id:    "vendors",
      label: "Vendeurs actifs",
      cur:   kpi?.active_vendors    ?? 0,
      prev:  kpi?.yesterday_vendors ?? 0,
      spark: Array.from({ length: 24 }, (_, h) => h <= new Date().getHours() ? kpi?.active_vendors ?? 0 : 0),
      fmt:   (n: number) => String(Math.round(n)),
      color: "#f59e0b",
      icon:  Store,
      href:  "/admin/vendors",
      isMoney: false,
    },
    {
      id:    "drivers",
      label: "Livreurs en ligne",
      cur:   kpi?.online_drivers    ?? 0,
      prev:  kpi?.yesterday_drivers ?? 0,
      spark: Array.from({ length: 24 }, (_, h) => h <= new Date().getHours() ? kpi?.online_drivers ?? 0 : 0),
      fmt:   (n: number) => String(Math.round(n)),
      color: "#8b5cf6",
      icon:  Users,
      href:  "/admin/drivers",
      isMoney: false,
    },
  ]

  const [hoveredSeg,   setHoveredSeg]   = useState<number | null>(null)
  const [chartSeries,  setChartSeries]  = useState<"both" | "revenue" | "orders">("both")
  const [cityView,       setCityView]       = useState<"orders" | "revenue">("orders")
  const [hoveredCity,    setHoveredCity]    = useState<string | null>(null)
  const [actFilter,      setActFilter]      = useState<"all"|"order"|"vendor"|"driver"|"security">("all")
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set())
  const [expandedAlert,   setExpandedAlert]   = useState<string | null>(null)
  const [selectedPays,   setSelectedPays]   = useState<Set<string>>(new Set())
  const [payingId,       setPayingId]       = useState<string | null>(null)
  const [paidIds,        setPaidIds]        = useState<Set<string>>(new Set())
  const [confirmPayout,  setConfirmPayout]  = useState<{ id: string; vendor_name: string; amount: number; method: string } | null>(null)

  // financial donut
  const donutData = fin ? [
    { name: "Payouts vendeurs",   value: fin.vendor_payouts,      sub: "Reversé aux boutiques" },
    { name: "Commission QuickGo", value: fin.quickgo_commission,  sub: "Revenus plateforme" },
    { name: "Frais de livraison", value: fin.delivery_fees,       sub: "Coûts logistiques" },
    { name: "Remboursements",     value: fin.refunds,             sub: "Montants remboursés" },
    { name: "Autres",             value: Math.max(0, fin.total - fin.vendor_payouts - fin.quickgo_commission - fin.delivery_fees - fin.refunds), sub: "Divers" },
  ].filter(d => d.value > 0) : []

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* ── SIDEBAR ────────────────────────────────────────────────────────── */}
      <AdminSidebar />

      {/* ── MAIN ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-auto">

        {/* Error banner — surfaces failed loads instead of showing silent zeros */}
        {!loading && error && (
          <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <p className="flex-1 text-sm text-red-300">{error}</p>
            <button
              onClick={() => { setRefreshing(true); fetchData() }}
              className="shrink-0 text-sm font-medium text-red-200 hover:text-white px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <header className="sticky top-0 z-40 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-[#1e1e2e]">
          <div className="flex items-center gap-3 px-6 py-3">

            {/* Title + live */}
            <div className="shrink-0 hidden md:block">
              <div className="flex items-center gap-2">
                <h1 className="text-white font-bold text-base leading-none">Centre de Contrôle</h1>
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/15 border border-green-500/20 text-green-400 text-[10px] font-semibold">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                  </span>
                  Live
                </span>
              </div>
              <p className="text-[#4a4a6a] text-[10px] mt-0.5 leading-none capitalize">
                {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            {/* Search bar */}
            <div className="flex-1 max-w-md mx-auto">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#16161f] border border-[#2a2a3e] hover:border-blue-500/40 focus-within:border-blue-500/60 transition-colors cursor-text"
                onClick={() => searchRef.current?.focus()}
              >
                <Search className="w-4 h-4 text-[#4a4a6a] shrink-0" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                  placeholder="Rechercher commandes, vendeurs, livreurs…"
                  className="flex-1 bg-transparent text-white placeholder-[#4a4a6a] text-sm outline-none min-w-0"
                />
                {search.length > 0 ? (
                  <button onClick={() => setSearch("")} aria-label="Effacer la recherche" className="p-0.5 hover:bg-white/10 rounded shrink-0">
                    <X className="w-3 h-3 text-[#6b6b8a]" />
                  </button>
                ) : (
                  <kbd className="text-[10px] text-[#4a4a6a] bg-[#1e1e2e] border border-[#2a2a3e] px-1.5 py-0.5 rounded shrink-0 hidden sm:block">⌘K</kbd>
                )}
              </div>
            </div>

            {/* City selector */}
            <div className="shrink-0 hidden lg:block">
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-[#4a4a6a] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="pl-7 pr-7 py-2 bg-[#16161f] border border-[#2a2a3e] rounded-xl text-white text-xs appearance-none outline-none hover:border-blue-500/40 focus:border-blue-500/60 transition-colors cursor-pointer"
                >
                  <option value="Toutes">Toutes les villes</option>
                  <option value="Douala">Douala</option>
                  <option value="Yaoundé">Yaoundé</option>
                  <option value="Bafoussam">Bafoussam</option>
                  <option value="Garoua">Garoua</option>
                  <option value="Buea">Buea</option>
                  <option value="Limbe">Limbe</option>
                  <option value="Bamenda">Bamenda</option>
                </select>
                <ChevronDown className="w-3 h-3 text-[#4a4a6a] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Refresh */}
            <button
              onClick={() => { setRefreshing(true); fetchData() }}
              title="Actualiser"
              aria-label="Actualiser"
              className="shrink-0 p-2 rounded-xl bg-[#16161f] border border-[#2a2a3e] hover:border-blue-500/40 hover:bg-[#1e1e2e] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-[#6b6b8a] ${refreshing ? "animate-spin" : ""}`} />
            </button>

            {/* Notifications */}
            <div className="relative shrink-0" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(v => !v); setUserOpen(false) }}
                aria-label="Notifications"
                className={`p-2 rounded-xl border transition-colors relative ${notifOpen ? "bg-[#1e1e2e] border-[#2a2a3e]" : "bg-[#16161f] border-[#2a2a3e] hover:border-blue-500/40 hover:bg-[#1e1e2e]"}`}
              >
                <Bell className="w-4 h-4 text-[#6b6b8a]" />
                {badge("notifications") > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-1 rounded-full bg-red-500 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                    {badge("notifications") > 9 ? "9+" : badge("notifications")}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-[#111118] border border-[#2a2a3e] rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e2e]">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-white" />
                        <span className="text-white font-semibold text-sm">Notifications</span>
                        {badge("notifications") > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold">
                            {badge("notifications")}
                          </span>
                        )}
                      </div>
                      <button className="text-[10px] text-blue-400 hover:underline">Tout marquer lu</button>
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                      {(data?.activities ?? []).length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <Bell className="w-6 h-6 text-[#4a4a6a] mx-auto mb-2" />
                          <p className="text-[#6b6b8a] text-xs">Aucune notification</p>
                        </div>
                      ) : (
                        (data?.activities ?? []).slice(0, 5).map(act => {
                          const cfg = ACT_CFG[act.type] ?? ACT_CFG.order
                          return (
                            <div key={act.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 border-b border-[#1e1e2e] last:border-0 transition-colors cursor-pointer">
                              <div className={`w-7 h-7 rounded-full bg-[#1e1e2e] flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                                <cfg.Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium leading-snug">{act.title}</p>
                                <p className="text-[#6b6b8a] text-[10px] truncate">{act.subtitle}</p>
                                <p className="text-[#4a4a6a] text-[10px] mt-0.5">{fmtTime(act.timestamp)}</p>
                              </div>
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
                            </div>
                          )
                        })
                      )}
                    </div>

                    <div className="px-4 py-2.5 border-t border-[#1e1e2e]">
                      <Link href="/admin/notifications"
                        className="flex items-center justify-center gap-1.5 text-blue-400 text-xs font-medium hover:underline"
                        onClick={() => setNotifOpen(false)}
                      >
                        Voir toutes les notifications <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Messages / Support */}
            <div className="relative shrink-0">
              <Link href="/admin/support" title="Support CRM" aria-label="Support CRM"
                className="p-2 rounded-xl bg-[#16161f] border border-[#2a2a3e] hover:border-blue-500/40 hover:bg-[#1e1e2e] transition-colors flex items-center justify-center"
              >
                <MessageCircle className="w-4 h-4 text-[#6b6b8a]" />
                {badge("crm_support") > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-1 rounded-full bg-orange-500 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                    {badge("crm_support") > 9 ? "9+" : badge("crm_support")}
                  </span>
                )}
              </Link>
            </div>

            {/* User dropdown */}
            <div className="relative shrink-0 pl-2 border-l border-[#1e1e2e]" ref={userRef}>
              <button
                onClick={() => { setUserOpen(v => !v); setNotifOpen(false) }}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0 ring-2 ring-transparent hover:ring-orange-500/40 transition-all">
                  <span className="text-white font-bold text-xs">{me?.initials ?? "AD"}</span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-white text-xs font-semibold leading-none truncate max-w-[120px]">{me?.name ?? "Administrateur"}</p>
                  <p className="text-[10px] text-red-400 leading-none mt-0.5">{me?.roleLabel ?? "Compte admin"}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-[#6b6b8a] transition-transform ${userOpen ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {userOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-[#111118] border border-[#2a2a3e] rounded-2xl shadow-2xl overflow-hidden z-50"
                  >
                    {/* Profile header */}
                    <div className="px-4 py-3 border-b border-[#1e1e2e]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0">
                          <span className="text-white font-bold text-sm">{me?.initials ?? "AD"}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-white text-sm font-semibold truncate">{me?.name ?? "Administrateur"}</p>
                          <p className="text-red-400 text-[10px]">{me?.roleLabel ?? "Compte admin"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1.5">
                      {[
                        { icon: User,       label: "Mon profil",      href: "/admin/settings" },
                        { icon: Settings,   label: "Paramètres",      href: "/admin/settings" },
                        { icon: BarChart3,  label: "Mes statistiques", href: "/admin/analytics" },
                      ].map(item => (
                        <Link key={item.href} href={item.href}
                          onClick={() => setUserOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors"
                        >
                          <item.icon className="w-4 h-4 text-[#6b6b8a]" />
                          <span className="text-white text-sm">{item.label}</span>
                        </Link>
                      ))}
                    </div>

                    <div className="border-t border-[#1e1e2e] py-1.5">
                      <button
                        className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-red-500/10 transition-colors text-left"
                        onClick={() => { setUserOpen(false); adminSignOut() }}
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 text-sm font-medium">Se déconnecter</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* Search spotlight overlay */}
        <AnimatePresence>
          {searchOpen && search.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
              onClick={() => { setSearchOpen(false); setSearch("") }}
            >
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.15 }}
                className="bg-[#111118] border border-[#2a2a3e] rounded-2xl w-full max-w-xl mx-4 overflow-hidden shadow-2xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1e1e2e]">
                  <Search className="w-4 h-4 text-[#6b6b8a] shrink-0" />
                  <span className="text-white text-sm flex-1">Résultats pour <strong>"{search}"</strong></span>
                  <button onClick={() => { setSearchOpen(false); setSearch("") }}>
                    <kbd className="text-[10px] text-[#6b6b8a] bg-[#1e1e2e] border border-[#2a2a3e] px-1.5 py-0.5 rounded cursor-pointer hover:border-white/20">Esc</kbd>
                  </button>
                </div>
                {[
                  { section: "Commandes", href: "/admin/orders",  Icon: Package,  items: [`Commande #${search}`, `Commande liée à "${search}"`] },
                  { section: "Vendeurs",  href: "/admin/vendors", Icon: Store,    items: [`Vendeur "${search}"`] },
                  { section: "Livreurs",  href: "/admin/drivers", Icon: Truck,    items: [`Livreur "${search}"`] },
                ].map(grp => (
                  <div key={grp.section}>
                    <div className="px-4 py-1.5 bg-[#0a0a0f]">
                      <p className="text-[10px] text-[#4a4a6a] font-semibold uppercase tracking-widest">{grp.section}</p>
                    </div>
                    {grp.items.map(item => (
                      <Link key={item} href={grp.href}
                        onClick={() => { setSearchOpen(false); setSearch("") }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-[#1e1e2e] last:border-0"
                      >
                        <grp.Icon className="w-4 h-4 text-[#6b6b8a] shrink-0" />
                        <span className="text-white text-sm">{item}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#4a4a6a] ml-auto" />
                      </Link>
                    ))}
                  </div>
                ))}
                <div className="px-4 py-2.5 bg-[#0a0a0f] flex items-center gap-2 text-[10px] text-[#4a4a6a]">
                  <kbd className="bg-[#1e1e2e] border border-[#2a2a3e] px-1 py-0.5 rounded">↵</kbd> Ouvrir
                  <span className="mx-1">·</span>
                  <kbd className="bg-[#1e1e2e] border border-[#2a2a3e] px-1 py-0.5 rounded">↑↓</kbd> Naviguer
                  <span className="mx-1">·</span>
                  <kbd className="bg-[#1e1e2e] border border-[#2a2a3e] px-1 py-0.5 rounded">Esc</kbd> Fermer
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-6 space-y-6">

          {/* ── KPI STRIP ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {kpiCards.map((card, i) => {
              const diff   = card.prev > 0 ? Math.round(((card.cur - card.prev) / card.prev) * 1000) / 10 : 0
              const delta  = card.cur - card.prev
              const { sign, color: arrowColor, Icon: ArrowIcon } = pctArrow(diff)
              const ratio  = card.prev > 0 ? Math.min(card.cur / card.prev, 2) : 1
              const barPct = Math.round(Math.min(ratio, 1) * 100)

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.07, 0.4), duration: 0.4, ease: "easeOut" }}
                  whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  className="group relative bg-[#16161f] border rounded-2xl overflow-hidden cursor-pointer"
                  style={{ borderColor: "#1e1e2e" }}
                >
                  {/* top accent glow */}
                  <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${card.color}55, transparent)` }} />
                  {/* corner glow */}
                  <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-10 blur-xl pointer-events-none" style={{ background: card.color }} />

                  <Link href={card.href} className="block p-4">
                    {/* row 1: icon + badge */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: card.color + "1a" }}>
                        <card.icon className="w-4 h-4" style={{ color: card.color }} />
                      </div>

                      {loading ? (
                        <div className="h-5 w-14 bg-white/10 animate-pulse rounded-full" />
                      ) : (
                        <span className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          diff > 0  ? "bg-green-500/15 text-green-400" :
                          diff < 0  ? "bg-red-500/15 text-red-400" :
                                      "bg-white/5 text-[#6b6b8a]"
                        }`}>
                          <ArrowIcon className="w-3 h-3" />
                          {sign}{Math.abs(diff)}%
                        </span>
                      )}
                    </div>

                    {/* row 2: main value */}
                    {loading ? (
                      <>
                        <div className="h-8 w-28 bg-white/10 animate-pulse rounded-lg mb-1.5" />
                        <div className="h-3 w-20 bg-white/5 animate-pulse rounded mb-3" />
                      </>
                    ) : (
                      <>
                        <p className="text-white font-extrabold text-[22px] leading-none mb-1 tracking-tight">
                          <CountUp target={card.cur} format={card.fmt} />
                        </p>
                        <p className="text-[#6b6b8a] text-xs font-medium mb-3">{card.label}</p>
                      </>
                    )}

                    {/* row 3: sparkline */}
                    <div className="-mx-1 mb-3">
                      <Spark data={card.spark} color={card.color} id={card.id} />
                    </div>

                    {/* row 4: vs hier */}
                    {loading ? (
                      <div className="h-3 w-32 bg-white/5 animate-pulse rounded" />
                    ) : (
                      <div className="space-y-1.5">
                        {/* progress bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${barPct}%` }}
                              transition={{ delay: 0.4 + i * 0.07, duration: 0.7, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ background: card.color }}
                            />
                          </div>
                          <span className="text-[10px] text-[#4a4a6a] shrink-0">{barPct}%</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-[#4a4a6a]">
                            Hier : <span className="text-[#6b6b8a] font-medium">{card.fmt(card.prev)}</span>
                          </span>
                          {delta !== 0 && (
                            <span className={`text-[10px] font-semibold ${arrowColor}`}>
                              {delta > 0 ? "+" : ""}{card.isMoney ? fmtCFAFull(Math.abs(delta)) : Math.abs(delta)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </Link>
                </motion.div>
              )
            })}
          </div>

          {/* ── ROW 1: Financial + 24H Chart + City Stats ──────────────── */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* ── Aperçu financier global ──────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-4"
            >
              {/* header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-bold text-sm leading-none">Aperçu financier global</h2>
                  <p className="text-[#4a4a6a] text-[10px] mt-0.5">Répartition du chiffre d'affaires</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#6b6b8a] bg-[#1e1e2e] px-2.5 py-1 rounded-full border border-[#2a2a3e]">Ce mois</span>
                  <Link href="/admin/finances" aria-label="Ouvrir les finances" className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5 text-[#4a4a6a] hover:text-white transition-colors" />
                  </Link>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-44 h-44 rounded-full border-8 border-[#1e1e2e] border-t-blue-500 animate-spin" />
                  <div className="w-full space-y-2">
                    {[...Array(4)].map((_, i) => <div key={i} className="h-6 bg-white/5 animate-pulse rounded-lg" />)}
                  </div>
                </div>
              ) : (
                <>
                  {/* donut */}
                  <div className="flex items-center justify-center">
                    <div className="relative w-44 h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={donutData}
                            cx="50%" cy="50%"
                            innerRadius={54} outerRadius={78}
                            dataKey="value"
                            paddingAngle={3}
                            stroke="none"
                            isAnimationActive
                            animationBegin={100}
                            animationDuration={900}
                            onMouseEnter={(_, idx) => setHoveredSeg(idx)}
                            onMouseLeave={() => setHoveredSeg(null)}
                          >
                            {donutData.map((_, i) => (
                              <Cell
                                key={i}
                                fill={DONUT_COLORS[i % DONUT_COLORS.length]}
                                opacity={hoveredSeg === null || hoveredSeg === i ? 1 : 0.3}
                                style={{ cursor: "pointer", transition: "opacity 0.15s" }}
                              />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>

                      {/* center callout */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                        <AnimatePresence mode="wait">
                          {hoveredSeg !== null ? (
                            <motion.div key={`seg-${hoveredSeg}`}
                              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.12 }}
                              className="flex flex-col items-center text-center px-2"
                            >
                              <span className="w-2 h-2 rounded-full mb-1" style={{ background: DONUT_COLORS[hoveredSeg % DONUT_COLORS.length] }} />
                              <p className="text-white font-extrabold text-base leading-none">
                                {fmtCFA(donutData[hoveredSeg].value)}
                              </p>
                              <p className="text-[#6b6b8a] text-[9px] leading-tight mt-1 max-w-[64px]">
                                {donutData[hoveredSeg].name}
                              </p>
                              <p className="text-[#4a4a6a] text-[9px] mt-0.5">
                                {fin?.total ? Math.round(donutData[hoveredSeg].value / fin.total * 100) : 0}%
                              </p>
                            </motion.div>
                          ) : (
                            <motion.div key="total"
                              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.12 }}
                              className="flex flex-col items-center"
                            >
                              <p className="text-[#4a4a6a] text-[9px] uppercase tracking-widest font-semibold mb-1">Total</p>
                              <p className="text-white font-extrabold text-xl leading-none">{fmtCFA(fin?.total ?? 0)}</p>
                              <p className="text-[#6b6b8a] text-[10px] mt-0.5">CFA</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* legend with bars */}
                  <div className="space-y-1">
                    {donutData.map((d, i) => {
                      const pct = fin?.total ? Math.round(d.value / fin.total * 100) : 0
                      const active = hoveredSeg === i
                      return (
                        <div
                          key={d.name}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all duration-150 ${active ? "bg-white/5" : "hover:bg-white/[0.03]"}`}
                          onMouseEnter={() => setHoveredSeg(i)}
                          onMouseLeave={() => setHoveredSeg(null)}
                        >
                          <span className="w-2 h-2 rounded-full shrink-0 transition-transform duration-150"
                            style={{ background: DONUT_COLORS[i % DONUT_COLORS.length], transform: active ? "scale(1.3)" : "scale(1)" }}
                          />
                          <span className={`text-xs flex-1 truncate transition-colors duration-150 ${active ? "text-white font-medium" : "text-[#6b6b8a]"}`}>
                            {d.name}
                          </span>
                          {/* mini bar */}
                          <div className="w-16 h-1 bg-[#1e1e2e] rounded-full overflow-hidden shrink-0">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }}
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ delay: 0.5 + i * 0.07, duration: 0.6, ease: "easeOut" }}
                            />
                          </div>
                          <span className={`text-[10px] w-7 text-right shrink-0 tabular-nums transition-colors ${active ? "text-white" : "text-[#4a4a6a]"}`}>
                            {pct}%
                          </span>
                          <span className="text-white text-xs font-semibold w-16 text-right shrink-0 tabular-nums">
                            {fmtCFA(d.value)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* stats footer */}
              <div className="pt-3 border-t border-[#1e1e2e] grid grid-cols-3 gap-2">
                {/* Net profit */}
                <div className="bg-[#1e1e2e] rounded-xl p-3">
                  <p className="text-[#4a4a6a] text-[9px] uppercase tracking-wider font-semibold mb-1">Bénéfice net</p>
                  {loading ? <div className="h-4 w-12 bg-white/10 animate-pulse rounded" /> : (
                    <p className="text-white font-bold text-sm leading-none">{fmtCFA(fin?.net_profit ?? 0)}</p>
                  )}
                  {!loading && (fin?.net_profit_change ?? 0) !== 0 && (
                    <p className={`text-[9px] mt-1 flex items-center gap-0.5 ${fin!.net_profit_change > 0 ? "text-green-400" : "text-red-400"}`}>
                      {fin!.net_profit_change > 0 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                      {Math.abs(fin!.net_profit_change)}%
                    </p>
                  )}
                </div>

                {/* Commission rate */}
                <div className="bg-[#1e1e2e] rounded-xl p-3">
                  <p className="text-[#4a4a6a] text-[9px] uppercase tracking-wider font-semibold mb-1">Commission</p>
                  {loading ? <div className="h-4 w-12 bg-white/10 animate-pulse rounded" /> : (
                    <p className="text-white font-bold text-sm leading-none">{fmtCFA(fin?.quickgo_commission ?? 0)}</p>
                  )}
                  <p className="text-[#4a4a6a] text-[9px] mt-1">Ce mois</p>
                </div>

                {/* Wallet */}
                <div className="bg-[#1e1e2e] rounded-xl p-3">
                  <p className="text-[#4a4a6a] text-[9px] uppercase tracking-wider font-semibold mb-1">Wallets</p>
                  {loading ? <div className="h-4 w-12 bg-white/10 animate-pulse rounded" /> : (
                    <p className="text-white font-bold text-sm leading-none">{fmtCFA(fin?.wallet_livraison ?? 0)}</p>
                  )}
                  <p className="text-[#4a4a6a] text-[9px] mt-1">Solde total</p>
                </div>
              </div>

              {/* pending payouts banner */}
              {!loading && (fin?.pending_payouts_count ?? 0) > 0 && (
                <Link href="/admin/payouts"
                  className="flex items-center gap-3 px-3 py-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl hover:bg-orange-500/15 transition-colors group"
                >
                  <div className="w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-orange-300 text-xs font-semibold leading-none">
                      {fin!.pending_payouts_count} payout{fin!.pending_payouts_count > 1 ? "s" : ""} en attente
                    </p>
                    <p className="text-[#6b6b8a] text-[10px] mt-0.5">{fmtCFAFull(fin!.pending_payouts_amount)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-orange-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}

              {!loading && (fin?.failed_transactions_count ?? 0) > 0 && (
                <Link href="/admin/transactions"
                  className="flex items-center gap-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/15 transition-colors group"
                >
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-red-300 text-xs font-semibold leading-none">
                      {fin!.failed_transactions_count} paiement{fin!.failed_transactions_count > 1 ? "s" : ""} échoué{fin!.failed_transactions_count > 1 ? "s" : ""}
                    </p>
                    <p className="text-[#6b6b8a] text-[10px] mt-0.5">{fmtCFAFull(fin!.failed_transactions_amount)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-400 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
            </motion.div>

            {/* ── Graphique ventes 24H ─────────────────────────────────── */}
            {(() => {
              const currentHour = new Date().getHours()
              const refHourLabel = `${String(currentHour).padStart(2, "0")}h`
              const totalRev    = chart24.reduce((s, h) => s + h.revenue, 0)
              const totalOrders = chart24.reduce((s, h) => s + h.orders, 0)
              const peakRev     = chart24.reduce((best, h) => h.revenue > best.revenue ? h : best, chart24[0] ?? { hour: "--", revenue: 0, orders: 0 })
              const peakOrd     = chart24.reduce((best, h) => h.orders  > best.orders  ? h : best, chart24[0] ?? { hour: "--", revenue: 0, orders: 0 })
              const convRate    = totalRev > 0 ? (totalOrders / (totalRev / 10000)).toFixed(1) : "0"

              const seriesBtns: { key: "both"|"revenue"|"orders"; label: string }[] = [
                { key: "both",    label: "Les deux" },
                { key: "revenue", label: "Revenus" },
                { key: "orders",  label: "Commandes" },
              ]

              return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                  className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-4"
                >
                  {/* header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-white font-bold text-sm leading-none">Ventes aujourd'hui</h2>
                      <p className="text-[#4a4a6a] text-[10px] mt-0.5">Évolution heure par heure · 24H</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="flex items-center gap-1 mr-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        Live
                      </span>
                      {seriesBtns.map(b => (
                        <button key={b.key} onClick={() => setChartSeries(b.key)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                            chartSeries === b.key
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : "text-[#4a4a6a] hover:text-[#6b6b8a] hover:bg-white/5"
                          }`}
                        >{b.label}</button>
                      ))}
                    </div>
                  </div>

                  {/* summary stat chips */}
                  {loading ? (
                    <div className="grid grid-cols-4 gap-2">
                      {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl" />)}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: "Revenus total",   value: fmtCFAFull(totalRev),   color: "#3b82f6", sub: "aujourd'hui" },
                        { label: "Pic horaire",      value: fmtCFAFull(peakRev.revenue), color: "#a3e635", sub: `à ${peakRev.hour}` },
                        { label: "Commandes total",  value: String(totalOrders),    color: "#22d3ee", sub: "aujourd'hui" },
                        { label: "Meilleures cmd",   value: String(peakOrd.orders), color: "#f59e0b", sub: `à ${peakOrd.hour}` },
                      ].map(s => (
                        <div key={s.label} className="bg-[#1e1e2e] rounded-xl px-3 py-2.5 border border-[#2a2a3e]">
                          <p className="text-[#4a4a6a] text-[9px] uppercase tracking-wider font-semibold truncate">{s.label}</p>
                          <p className="text-white font-extrabold text-sm leading-none mt-1 tabular-nums">{s.value}</p>
                          <p className="text-[10px] mt-0.5 tabular-nums" style={{ color: s.color }}>{s.sub}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* chart */}
                  {loading ? (
                    <div className="h-52 bg-white/5 animate-pulse rounded-xl" />
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chart24} margin={{ top: 6, right: chartSeries !== "revenue" ? 36 : 0, bottom: 0, left: -10 }}>
                        <defs>
                          <linearGradient id="c24rev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#3b82f6" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="c24ord" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#22d3ee" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                          </linearGradient>
                        </defs>

                        <CartesianGrid vertical={false} stroke="#1e1e2e" strokeDasharray="0" />

                        <XAxis dataKey="hour" tick={{ fill: "#4a4a6a", fontSize: 9 }} tickLine={false} axisLine={false} interval={3} />

                        <YAxis
                          yAxisId="left"
                          tick={{ fill: "#4a4a6a", fontSize: 9 }}
                          tickLine={false} axisLine={false}
                          tickFormatter={v => fmtCFA(v)}
                          hide={chartSeries === "orders"}
                          width={chartSeries === "orders" ? 0 : 44}
                        />

                        {chartSeries !== "revenue" && (
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            tick={{ fill: "#4a4a6a", fontSize: 9 }}
                            tickLine={false} axisLine={false}
                            width={28}
                          />
                        )}

                        <Tooltip content={<Chart24Tooltip />} cursor={{ stroke: "#2a2a3e", strokeWidth: 1 }} />

                        <ReferenceLine
                          yAxisId="left"
                          x={refHourLabel}
                          stroke="#4a4a6a"
                          strokeDasharray="4 3"
                          strokeWidth={1}
                          label={{ value: "↑ maintenant", fill: "#4a4a6a", fontSize: 8, position: "insideTopRight", offset: 4 }}
                        />

                        {(chartSeries === "revenue" || chartSeries === "both") && (
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="revenue"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            fill="url(#c24rev)"
                            dot={false}
                            activeDot={{ r: 4, fill: "#3b82f6", stroke: "#16161f", strokeWidth: 2 }}
                            isAnimationActive
                            animationDuration={900}
                          />
                        )}

                        {(chartSeries === "orders" || chartSeries === "both") && (
                          <Area
                            yAxisId={chartSeries === "both" ? "right" : "left"}
                            type="monotone"
                            dataKey="orders"
                            stroke="#22d3ee"
                            strokeWidth={1.5}
                            fill="url(#c24ord)"
                            dot={false}
                            activeDot={{ r: 4, fill: "#22d3ee", stroke: "#16161f", strokeWidth: 2 }}
                            isAnimationActive
                            animationDuration={900}
                            animationBegin={120}
                          />
                        )}
                      </AreaChart>
                    </ResponsiveContainer>
                  )}

                  {/* legend */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#1e1e2e]">
                    <div className="flex items-center gap-4">
                      {(chartSeries === "revenue" || chartSeries === "both") && (
                        <button onClick={() => setChartSeries(chartSeries === "both" ? "orders" : "both")}
                          className="flex items-center gap-2 group"
                        >
                          <span className="w-7 h-0.5 rounded-full bg-blue-500 group-hover:opacity-60 transition-opacity" />
                          <span className="text-[#6b6b8a] text-xs group-hover:text-white transition-colors">Revenus</span>
                          <span className="text-blue-400 text-xs font-bold tabular-nums">{fmtCFAFull(totalRev)}</span>
                        </button>
                      )}
                      {(chartSeries === "orders" || chartSeries === "both") && (
                        <button onClick={() => setChartSeries(chartSeries === "both" ? "revenue" : "both")}
                          className="flex items-center gap-2 group"
                        >
                          <span className="w-7 h-0.5 rounded-full bg-cyan-400 group-hover:opacity-60 transition-opacity" />
                          <span className="text-[#6b6b8a] text-xs group-hover:text-white transition-colors">Commandes</span>
                          <span className="text-cyan-400 text-xs font-bold tabular-nums">{totalOrders}</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[#4a4a6a] text-[10px]">
                      Heure actuelle : <span className="text-[#6b6b8a] font-medium">{refHourLabel}</span>
                    </p>
                  </div>
                </motion.div>
              )
            })()}

            {/* ── Commandes par ville ──────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-4"
            >
              {/* header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-bold text-sm leading-none">Commandes par ville</h2>
                  <p className="text-[#4a4a6a] text-[10px] mt-0.5">Distribution géographique · Cameroun</p>
                </div>
                <div className="flex items-center gap-1">
                  {(["orders", "revenue"] as const).map(v => (
                    <button key={v} onClick={() => setCityView(v)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                        cityView === v
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : "text-[#4a4a6a] hover:text-[#6b6b8a] hover:bg-white/5"
                      }`}
                    >{v === "orders" ? "Commandes" : "Revenus"}</button>
                  ))}
                </div>
              </div>

              {loading ? (
                <>
                  <div className="h-36 bg-white/5 animate-pulse rounded-xl" />
                  <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-6 bg-white/5 animate-pulse rounded-lg" />)}</div>
                </>
              ) : (data?.city_stats ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
                  <MapPin className="w-8 h-8 text-[#2a2a3e]" />
                  <p className="text-[#6b6b8a] text-sm">Aucune donnée aujourd'hui</p>
                </div>
              ) : (
                <>
                  {/* SVG map + hover tooltip */}
                  <div className="relative rounded-xl overflow-hidden bg-[#111118] border border-[#1e1e2e] px-2 py-2">
                    <CameroonMap
                      cities={data!.city_stats}
                      colors={DONUT_COLORS}
                      metric={cityView}
                      hoveredCity={hoveredCity}
                      onHover={setHoveredCity}
                    />

                    {/* hover info badge */}
                    <AnimatePresence>
                      {hoveredCity && (() => {
                        const idx = data!.city_stats.findIndex(c => c.city === hoveredCity)
                        const c   = data!.city_stats[idx]
                        if (!c) return null
                        return (
                          <motion.div
                            key={hoveredCity}
                            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.12 }}
                            className="absolute top-2 right-2 bg-[#16161f]/95 border border-[#2a2a3e] rounded-xl px-3 py-2 pointer-events-none"
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="w-2 h-2 rounded-full" style={{ background: DONUT_COLORS[idx % DONUT_COLORS.length] }} />
                              <p className="text-white text-xs font-bold">{c.city}</p>
                            </div>
                            <p className="text-[#6b6b8a] text-[10px]">
                              <span className="text-white font-semibold">{c.orders}</span> commandes
                            </p>
                            <p className="text-[#6b6b8a] text-[10px]">
                              <span className="text-white font-semibold">{fmtCFAFull(c.revenue)}</span>
                            </p>
                            <p className="text-[#4a4a6a] text-[10px]">{c.pct}% du total</p>
                          </motion.div>
                        )
                      })()}
                    </AnimatePresence>
                  </div>

                  {/* ranked list */}
                  <div className="space-y-1.5">
                    {data!.city_stats.slice(0, 5).map((c, i) => {
                      const val    = cityView === "orders" ? c.orders : c.revenue
                      const maxVal = cityView === "orders"
                        ? Math.max(...data!.city_stats.map(x => x.orders), 1)
                        : Math.max(...data!.city_stats.map(x => x.revenue), 1)
                      const barPct = Math.round((val / maxVal) * 100)
                      const active = hoveredCity === c.city
                      const color  = DONUT_COLORS[i % DONUT_COLORS.length]

                      return (
                        <div
                          key={c.city}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors duration-150 ${active ? "bg-white/5" : "hover:bg-white/[0.03]"}`}
                          onMouseEnter={() => setHoveredCity(c.city)}
                          onMouseLeave={() => setHoveredCity(null)}
                        >
                          {/* rank */}
                          <span className="text-[10px] text-[#4a4a6a] w-4 text-center shrink-0 font-bold tabular-nums">{i + 1}</span>

                          {/* dot */}
                          <span className="w-2 h-2 rounded-full shrink-0 transition-transform duration-150"
                            style={{ background: color, transform: active ? "scale(1.4)" : "scale(1)" }} />

                          {/* name */}
                          <span className={`text-xs font-medium flex-1 min-w-0 truncate transition-colors ${active ? "text-white" : "text-[#9ca3af]"}`}>
                            {c.city}
                          </span>

                          {/* bar */}
                          <div className="w-20 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden shrink-0">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ background: color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${barPct}%` }}
                              transition={{ delay: 0.4 + i * 0.07, duration: 0.55, ease: "easeOut" }}
                            />
                          </div>

                          {/* pct */}
                          <span className={`text-[10px] w-7 text-right tabular-nums shrink-0 ${active ? "text-white" : "text-[#4a4a6a]"}`}>
                            {c.pct}%
                          </span>

                          {/* value */}
                          <span className="text-white text-xs font-bold w-16 text-right tabular-nums shrink-0">
                            {cityView === "orders" ? `${c.orders} cmd` : fmtCFA(c.revenue)}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* totals footer */}
                  <div className="pt-2 border-t border-[#1e1e2e] flex items-center justify-between text-[10px]">
                    <span className="text-[#4a4a6a]">
                      {data!.city_stats.length} ville{data!.city_stats.length > 1 ? "s" : ""} actives
                    </span>
                    <span className="text-[#6b6b8a]">
                      Total : <span className="text-white font-bold">
                        {cityView === "orders"
                          ? `${data!.city_stats.reduce((s, c) => s + c.orders, 0)} commandes`
                          : fmtCFAFull(data!.city_stats.reduce((s, c) => s + c.revenue, 0))
                        }
                      </span>
                    </span>
                  </div>
                </>
              )}
            </motion.div>
          </div>

          {/* ── ROW 2: Payouts + Activities + AI Alerts ────────────────── */}
          <div className="grid lg:grid-cols-3 gap-6">

            {/* ── Payouts en attente ───────────────────────────────────── */}
            {(() => {
              const rows    = data?.pending_payouts ?? []
              const unpaid  = rows.filter(p => !paidIds.has(p.id))
              const allSel  = unpaid.length > 0 && unpaid.every(p => selectedPays.has(p.id))
              const selAmt  = rows.filter(p => selectedPays.has(p.id) && !paidIds.has(p.id)).reduce((s, p) => s + p.amount, 0)
              const selCount = [...selectedPays].filter(id => !paidIds.has(id)).length

              function toggleAll() {
                if (allSel) setSelectedPays(new Set())
                else setSelectedPays(new Set(unpaid.map(p => p.id)))
              }
              function toggleRow(id: string) {
                setSelectedPays(prev => {
                  const next = new Set(prev)
                  next.has(id) ? next.delete(id) : next.add(id)
                  return next
                })
              }
              function handlePay(p: typeof rows[0]) {
                setConfirmPayout({ id: p.id, vendor_name: p.vendor_name, amount: p.amount, method: p.method })
              }
              function handleBatchPay() {
                const toConfirm = rows.filter(p => selectedPays.has(p.id) && !paidIds.has(p.id))
                if (toConfirm.length === 1) handlePay(toConfirm[0])
                else if (toConfirm.length > 1)
                  setConfirmPayout({ id: "__batch__", vendor_name: `${toConfirm.length} vendeurs`, amount: selAmt, method: "Paiement groupé" })
              }
              function confirmAndPay() {
                if (!confirmPayout) return
                const id = confirmPayout.id
                setConfirmPayout(null)
                setPayingId(id)
                setTimeout(() => {
                  setPaidIds(prev => {
                    const next = new Set(prev)
                    if (id === "__batch__") {
                      rows.filter(p => selectedPays.has(p.id)).forEach(p => next.add(p.id))
                    } else {
                      next.add(id)
                    }
                    return next
                  })
                  setSelectedPays(prev => {
                    const next = new Set(prev)
                    if (id === "__batch__") rows.filter(p => selectedPays.has(p.id)).forEach(p => next.delete(p.id))
                    else next.delete(id)
                    return next
                  })
                  setPayingId(null)
                }, 1600)
              }

              return (
                <>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
                  >
                    {/* header */}
                    <div className="flex items-start justify-between px-5 pt-5 pb-3">
                      <div>
                        <h2 className="text-white font-bold text-sm leading-none">Payouts en attente</h2>
                        <p className="text-[#4a4a6a] text-[10px] mt-0.5">
                          {loading ? "…" : `${unpaid.length} demande${unpaid.length !== 1 ? "s" : ""} · ${fmtCFAFull(fin?.pending_payouts_amount ?? 0)}`}
                        </p>
                      </div>
                      <Link href="/admin/payouts" className="flex items-center gap-1 text-blue-400 text-[10px] hover:underline mt-0.5">
                        Voir tout <ChevronRight className="w-3 h-3" />
                      </Link>
                    </div>

                    {/* table */}
                    {loading ? (
                      <div className="px-5 pb-5 space-y-2">
                        {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-white/5 animate-pulse rounded-xl" />)}
                      </div>
                    ) : unpaid.length === 0 && paidIds.size === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        </div>
                        <p className="text-[#6b6b8a] text-sm">Tous les payouts sont traités</p>
                      </div>
                    ) : (
                      <>
                        {/* col headers */}
                        <div className="flex items-center gap-2 px-5 pb-1 border-b border-[#1e1e2e]">
                          <button onClick={toggleAll} aria-label="Tout sélectionner"
                            className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                              allSel ? "bg-blue-500 border-blue-500" : "border-[#2a2a3e] hover:border-blue-500/50"
                            }`}
                          >
                            {allSel && <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none">
                              <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>}
                          </button>
                          <span className="text-[#4a4a6a] text-[9px] uppercase tracking-wider font-semibold flex-1">Vendeur</span>
                          <span className="text-[#4a4a6a] text-[9px] uppercase tracking-wider font-semibold w-20 text-right hidden sm:block">Méthode</span>
                          <span className="text-[#4a4a6a] text-[9px] uppercase tracking-wider font-semibold w-16 text-right">Montant</span>
                          <span className="w-16 shrink-0" />
                        </div>

                        {/* rows */}
                        <div className="flex-1 overflow-y-auto max-h-72">
                          <AnimatePresence initial={false}>
                            {rows.map(p => {
                              const isPaid  = paidIds.has(p.id)
                              const isSel   = selectedPays.has(p.id)
                              const isPaying = payingId === p.id || (payingId === "__batch__" && selectedPays.has(p.id))
                              const mcfg    = METHOD_CFG[p.method] ?? METHOD_DEFAULT

                              return (
                                <motion.div
                                  key={p.id}
                                  layout
                                  initial={{ opacity: 1 }}
                                  animate={{ opacity: isPaid ? 0.4 : 1 }}
                                  className={`flex items-center gap-2 px-5 py-2.5 border-b border-[#1e1e2e] last:border-0 transition-colors ${
                                    isSel && !isPaid ? "bg-blue-500/5" : "hover:bg-white/[0.02]"
                                  }`}
                                >
                                  {/* checkbox */}
                                  <button
                                    disabled={isPaid}
                                    onClick={() => toggleRow(p.id)}
                                    aria-label="Sélectionner ce payout"
                                    className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                                      isPaid   ? "border-[#2a2a3e] opacity-30 cursor-not-allowed" :
                                      isSel    ? "bg-blue-500 border-blue-500" :
                                               "border-[#2a2a3e] hover:border-blue-500/50"
                                    }`}
                                  >
                                    {isSel && !isPaid && <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none">
                                      <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>}
                                  </button>

                                  {/* vendor */}
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    {p.vendor_logo ? (
                                      <Image src={p.vendor_logo} alt={p.vendor_name} width={28} height={28}
                                        className="w-7 h-7 rounded-lg object-cover shrink-0" />
                                    ) : (
                                      <div className="w-7 h-7 rounded-lg bg-[#2a2a3e] flex items-center justify-center shrink-0">
                                        <Store className="w-3.5 h-3.5 text-[#6b6b8a]" />
                                      </div>
                                    )}
                                    <span className={`text-xs font-medium truncate ${isPaid ? "line-through text-[#4a4a6a]" : "text-white"}`}>
                                      {p.vendor_name}
                                    </span>
                                  </div>

                                  {/* method badge */}
                                  <span className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md border text-[9px] font-semibold w-20 justify-center shrink-0 ${mcfg.bg} ${mcfg.color} ${mcfg.border}`}>
                                    {p.method.length > 9 ? p.method.split(" ")[0] : p.method}
                                  </span>

                                  {/* amount */}
                                  <span className={`text-xs font-bold w-16 text-right tabular-nums shrink-0 ${isPaid ? "text-green-400" : "text-white"}`}>
                                    {isPaid ? "✓ Payé" : fmtCFA(p.amount)}
                                  </span>

                                  {/* action */}
                                  <div className="w-16 shrink-0 flex justify-end">
                                    {isPaid ? (
                                      <span className="text-green-400 text-[10px] font-semibold">OK</span>
                                    ) : isPaying ? (
                                      <span className="flex items-center gap-1 text-blue-400 text-[10px]">
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                        <span>...</span>
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => handlePay(p)}
                                        disabled={!!payingId}
                                        className="px-2 py-1 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-300 text-[10px] font-semibold hover:bg-orange-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                      >
                                        Payer
                                      </button>
                                    )}
                                  </div>
                                </motion.div>
                              )
                            })}
                          </AnimatePresence>
                        </div>

                        {/* footer: batch action */}
                        <div className="px-5 py-3 border-t border-[#1e1e2e] flex items-center justify-between gap-3">
                          <span className="text-[#4a4a6a] text-[10px]">
                            {selCount > 0
                              ? <><span className="text-blue-400 font-semibold">{selCount}</span> sélectionné{selCount > 1 ? "s" : ""}</>
                              : `${unpaid.length} en attente`
                            }
                          </span>
                          {selCount > 0 ? (
                            <button
                              onClick={handleBatchPay}
                              disabled={!!payingId}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-[11px] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Wallet className="w-3 h-3" />
                              Payer · {fmtCFAFull(selAmt)}
                            </button>
                          ) : (
                            <Link href="/admin/payouts"
                              className="flex items-center gap-1 text-[#6b6b8a] text-[10px] hover:text-white transition-colors"
                            >
                              Gérer tout <ChevronRight className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </>
                    )}
                  </motion.div>

                  {/* confirm modal */}
                  <AnimatePresence>
                    {confirmPayout && (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                        onClick={() => setConfirmPayout(null)}
                      >
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 8 }}
                          transition={{ duration: 0.15 }}
                          className="bg-[#111118] border border-[#2a2a3e] rounded-2xl p-6 w-full max-w-sm shadow-2xl"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center shrink-0">
                              <Wallet className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                              <p className="text-white font-bold text-sm">Confirmer le paiement</p>
                              <p className="text-[#4a4a6a] text-[10px]">Cette action est irréversible</p>
                            </div>
                          </div>

                          <div className="bg-[#1e1e2e] rounded-xl p-4 mb-4 space-y-2">
                            <div className="flex justify-between text-xs">
                              <span className="text-[#6b6b8a]">Bénéficiaire</span>
                              <span className="text-white font-semibold">{confirmPayout.vendor_name}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-[#6b6b8a]">Méthode</span>
                              <span className={`font-semibold ${(METHOD_CFG[confirmPayout.method] ?? METHOD_DEFAULT).color}`}>
                                {confirmPayout.method}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs border-t border-[#2a2a3e] pt-2">
                              <span className="text-[#6b6b8a]">Montant</span>
                              <span className="text-white font-extrabold text-sm">{fmtCFAFull(confirmPayout.amount)}</span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => setConfirmPayout(null)}
                              className="flex-1 py-2.5 rounded-xl bg-[#1e1e2e] border border-[#2a2a3e] text-[#6b6b8a] text-sm font-medium hover:text-white hover:border-[#3a3a4e] transition-colors"
                            >
                              Annuler
                            </button>
                            <button
                              onClick={confirmAndPay}
                              className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-colors"
                            >
                              Confirmer
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )
            })()}

            {/* ── Activités récentes ───────────────────────────────────── */}
            {(() => {
              const allActs    = data?.activities ?? []
              const now        = Date.now()
              const filtered   = actFilter === "all" ? allActs : allActs.filter(a => a.type === actFilter)
              const typeCounts = (["order","vendor","driver","security"] as const).reduce<Record<string,number>>(
                (acc, t) => ({ ...acc, [t]: allActs.filter(a => a.type === t).length }), {}
              )

              return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                  className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
                >
                  {/* header */}
                  <div className="px-5 pt-5 pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h2 className="text-white font-bold text-sm leading-none">Activités récentes</h2>
                        <p className="text-[#4a4a6a] text-[10px] mt-0.5">Fil en temps réel · {allActs.length} entrée{allActs.length !== 1 ? "s" : ""}</p>
                      </div>
                      <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#1e1e2e] border border-[#2a2a3e]">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                        <span className="text-[#6b6b8a] text-[10px]">Live</span>
                      </span>
                    </div>

                    {/* filter tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                      {(["all","order","vendor","driver","security"] as const).map(f => {
                        const cnt = f === "all" ? allActs.length : (typeCounts[f] ?? 0)
                        const cfg = f !== "all" ? ACT_CFG[f] : null
                        return (
                          <button key={f} onClick={() => setActFilter(f)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all shrink-0 ${
                              actFilter === f
                                ? "bg-[#2a2a3e] text-white border border-[#3a3a5e]"
                                : "text-[#4a4a6a] hover:text-[#6b6b8a] hover:bg-white/5"
                            }`}
                          >
                            {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />}
                            {ACT_FILTER_LABELS[f]}
                            {cnt > 0 && (
                              <span className={`ml-0.5 px-1 rounded-full text-[9px] ${actFilter === f ? "bg-white/10 text-white" : "bg-[#1e1e2e] text-[#4a4a6a]"}`}>
                                {cnt}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* timeline */}
                  <div className="flex-1 overflow-y-auto max-h-96 px-5 pb-4">
                    {loading ? (
                      <div className="space-y-5 pt-1">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse shrink-0" />
                            <div className="flex-1 space-y-1.5 pt-1">
                              <div className="h-3 w-32 bg-white/5 animate-pulse rounded" />
                              <div className="h-2.5 w-24 bg-white/5 animate-pulse rounded" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : filtered.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <Activity className="w-7 h-7 text-[#2a2a3e]" />
                        <p className="text-[#6b6b8a] text-sm">Aucune activité {actFilter !== "all" ? `de type "${ACT_FILTER_LABELS[actFilter]}"` : "récente"}</p>
                      </div>
                    ) : (
                      <div className="relative pt-1">
                        {/* connecting gradient line */}
                        <div className="absolute left-[15px] top-0 bottom-6 w-px"
                          style={{ background: "linear-gradient(to bottom, #2a2a3e 0%, #2a2a3e 80%, transparent 100%)" }} />

                        <div className="space-y-0">
                          <AnimatePresence initial={false}>
                            {filtered.map((act, i) => {
                              const cfg      = ACT_CFG[act.type] ?? ACT_CFG.order
                              const isNew    = (now - new Date(act.timestamp).getTime()) < 5 * 60 * 1000
                              const statusCls = act.status ? (STATUS_PILL[act.status] ?? "bg-[#1e1e2e] text-[#6b6b8a] border border-[#2a2a3e]") : ""
                              const statusLabel = act.status
                                ? ({ pending:"En attente", confirmed:"Confirmé", preparing:"Préparation", ready:"Prêt",
                                     delivering:"En livraison", delivered:"Livré", cancelled:"Annulé",
                                     high:"Critique", medium:"Moyen", low:"Faible" } as Record<string,string>)[act.status] ?? act.status
                                : null

                              return (
                                <motion.div
                                  key={act.id}
                                  initial={{ opacity: 0, x: -8 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: 8 }}
                                  transition={{ delay: Math.min(i * 0.06, 0.4), duration: 0.25 }}
                                  className="flex gap-3 relative group py-3"
                                >
                                  {/* icon bubble */}
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ring-2 ring-[#16161f] ${cfg.iconBg} ${cfg.color}`}>
                                    <cfg.Icon className="w-3.5 h-3.5" />
                                    {isNew && (
                                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-[#16161f]">
                                        <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75" />
                                      </span>
                                    )}
                                  </div>

                                  {/* content */}
                                  <div className={`flex-1 min-w-0 pl-1 pr-1 py-1.5 rounded-r-xl transition-colors group-hover:bg-white/[0.02] border-l-2 border-transparent group-hover:border-l-2`}
                                    style={{ borderLeftColor: "transparent" }}
                                  >
                                    <div className="flex items-start justify-between gap-2 mb-0.5">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span className={`text-[9px] font-bold uppercase tracking-wider shrink-0 ${cfg.color}`}>
                                          {cfg.label}
                                        </span>
                                        {isNew && (
                                          <span className="text-[8px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold shrink-0">NEW</span>
                                        )}
                                      </div>
                                      <span className="text-[#4a4a6a] text-[10px] shrink-0 tabular-nums">{fmtTime(act.timestamp)}</span>
                                    </div>

                                    <p className="text-white text-xs font-semibold leading-snug truncate">{act.title}</p>
                                    <p className="text-[#6b6b8a] text-[10px] truncate mt-0.5">{act.subtitle}</p>

                                    {statusLabel && (
                                      <span className={`inline-flex items-center mt-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${statusCls}`}>
                                        {statusLabel}
                                      </span>
                                    )}
                                  </div>
                                </motion.div>
                              )
                            })}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* footer */}
                  <div className="px-5 py-3 border-t border-[#1e1e2e] flex items-center justify-between">
                    <span className="text-[#4a4a6a] text-[10px]">
                      {filtered.length} activité{filtered.length !== 1 ? "s" : ""}
                      {actFilter !== "all" && <> · <button onClick={() => setActFilter("all")} className="text-blue-400 hover:underline">Tout afficher</button></>}
                    </span>
                    <Link href="/admin/logs" className="flex items-center gap-1 text-[#6b6b8a] text-[10px] hover:text-white transition-colors">
                      Voir les logs <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>
                </motion.div>
              )
            })()}

            {/* ── Détection IA ─────────────────────────────────────────── */}
            {(() => {
              const alerts  = (data?.ai_alerts ?? []).filter(a => !dismissedAlerts.has(a.id))
              const visible = alerts.length
              const high    = alerts.filter(a => a.severity === "high").length
              const medium  = alerts.filter(a => a.severity === "medium").length
              const low     = alerts.filter(a => a.severity === "low").length
              const allClear = !loading && visible === 0

              return (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                  className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
                >
                  {/* header */}
                  <div className="px-5 pt-5 pb-3">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-white font-bold text-sm leading-none">Détection IA</h2>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/25">
                            IA
                          </span>
                        </div>
                        <p className="text-[#4a4a6a] text-[10px] mt-0.5">Surveillance sécurité en temps réel</p>
                      </div>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${allClear ? "bg-green-500/15" : "bg-purple-500/15"}`}>
                        {allClear
                          ? <ShieldCheck className="w-4.5 h-4.5 text-green-400" />
                          : <Shield className="w-4.5 h-4.5 text-purple-400" />
                        }
                      </div>
                    </div>

                    {/* scan bar */}
                    <div className="relative h-1 bg-[#1e1e2e] rounded-full overflow-hidden mb-3">
                      {!allClear && (
                        <motion.div
                          className="absolute inset-y-0 w-1/3 rounded-full"
                          style={{ background: "linear-gradient(90deg, transparent, #a855f7, transparent)" }}
                          animate={{ x: ["-100%", "400%"] }}
                          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                        />
                      )}
                      {allClear && <div className="absolute inset-0 bg-green-500/40 rounded-full" />}
                    </div>

                    {/* severity summary */}
                    {!loading && (
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Critique", count: high,   color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20"    },
                          { label: "Moyen",    count: medium, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
                          { label: "Faible",   count: low,    color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
                        ].map(s => (
                          <div key={s.label} className={`rounded-lg px-2 py-1.5 border ${s.bg} ${s.border} text-center`}>
                            <p className={`text-base font-extrabold leading-none ${s.count > 0 ? s.color : "text-[#2a2a3e]"}`}>{s.count}</p>
                            <p className={`text-[9px] mt-0.5 font-medium ${s.count > 0 ? "text-[#6b6b8a]" : "text-[#2a2a3e]"}`}>{s.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* alerts list */}
                  <div className="flex-1 overflow-y-auto max-h-80 px-5 pb-2">
                    {loading ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />)}
                      </div>
                    ) : allClear ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-8 text-center gap-3"
                      >
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center"
                        >
                          <ShieldCheck className="w-7 h-7 text-green-400" />
                        </motion.div>
                        <div>
                          <p className="text-green-400 font-bold text-sm">Système protégé</p>
                          <p className="text-[#6b6b8a] text-xs mt-0.5">Aucune menace détectée</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#4a4a6a]">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          Analyse active · {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </motion.div>
                    ) : (
                      <AnimatePresence initial={false}>
                        {alerts.map((alert, i) => {
                          const sev      = SEV_CFG[alert.severity] ?? SEV_CFG.medium
                          const expanded = expandedAlert === alert.id

                          return (
                            <motion.div
                              key={alert.id}
                              layout
                              initial={{ opacity: 0, x: 12, height: 0 }}
                              animate={{ opacity: 1, x: 0, height: "auto" }}
                              exit={{ opacity: 0, x: 12, height: 0 }}
                              transition={{ delay: Math.min(i * 0.05, 0.4), duration: 0.2 }}
                              className="mb-2 overflow-hidden"
                            >
                              <div
                                className={`border border-l-4 rounded-xl cursor-pointer transition-all duration-150 ${sev.cls} ${sev.leftBorder}`}
                                onClick={() => setExpandedAlert(expanded ? null : alert.id)}
                              >
                                {/* collapsed header */}
                                <div className="flex items-start gap-2.5 p-3">
                                  {/* pulse dot */}
                                  <div className="relative mt-0.5 shrink-0">
                                    <span className={`block w-2.5 h-2.5 rounded-full ${sev.dot}`} />
                                    {sev.pulse && (
                                      <span className={`absolute inset-0 rounded-full ${sev.dot} animate-ping opacity-60`} />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-white text-xs font-bold leading-snug truncate">{alert.title}</p>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${sev.badge}`}>
                                          {sev.label}
                                        </span>
                                        <ChevronDown className={`w-3 h-3 text-[#6b6b8a] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                                      </div>
                                    </div>
                                    <p className={`text-[#6b6b8a] text-[10px] mt-0.5 ${expanded ? "" : "line-clamp-1"}`}>
                                      {alert.description}
                                    </p>
                                    <p className="text-[#4a4a6a] text-[10px] mt-1">{fmtTime(alert.timestamp)}</p>
                                  </div>
                                </div>

                                {/* expanded detail */}
                                <AnimatePresence>
                                  {expanded && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.18 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="px-3 pb-3 pt-0 border-t border-white/5 mt-0">
                                        {/* metadata chips */}
                                        <div className="flex flex-wrap gap-1.5 mt-2 mb-3">
                                          {alert.count > 1 && (
                                            <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-[#6b6b8a] font-semibold">
                                              <AlertTriangle className="w-2.5 h-2.5" />×{alert.count} occurrences
                                            </span>
                                          )}
                                          <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-[#6b6b8a] font-semibold">
                                            <Clock className="w-2.5 h-2.5" />{new Date(alert.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                          </span>
                                          <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 font-semibold border border-purple-500/20">
                                            <Shield className="w-2.5 h-2.5" />Détecté par IA
                                          </span>
                                        </div>

                                        {/* actions */}
                                        <div className="flex gap-2">
                                          <button
                                            onClick={e => { e.stopPropagation(); setDismissedAlerts(prev => new Set([...prev, alert.id])); setExpandedAlert(null) }}
                                            className="flex-1 py-1.5 rounded-lg bg-[#1e1e2e] text-[#6b6b8a] text-[10px] font-semibold hover:text-white hover:bg-[#2a2a3e] transition-colors"
                                          >
                                            Ignorer
                                          </button>
                                          <Link
                                            href="/admin/security"
                                            onClick={e => e.stopPropagation()}
                                            className="flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center transition-colors flex items-center justify-center gap-1"
                                            style={{ background: sev.color + "25", color: sev.color, border: `1px solid ${sev.color}40` }}
                                          >
                                            Investiguer <ChevronRight className="w-3 h-3" />
                                          </Link>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </motion.div>
                          )
                        })}
                      </AnimatePresence>
                    )}
                  </div>

                  {/* footer */}
                  <div className="px-5 py-3 border-t border-[#1e1e2e] flex items-center justify-between">
                    {dismissedAlerts.size > 0 && (
                      <button onClick={() => setDismissedAlerts(new Set())}
                        className="text-[#4a4a6a] text-[10px] hover:text-[#6b6b8a] transition-colors"
                      >
                        Restaurer ({dismissedAlerts.size})
                      </button>
                    )}
                    {dismissedAlerts.size === 0 && (
                      <span className="text-[#4a4a6a] text-[10px]">{visible} alerte{visible !== 1 ? "s" : ""} active{visible !== 1 ? "s" : ""}</span>
                    )}
                    <Link href="/admin/security"
                      className="flex items-center gap-1 text-[#6b6b8a] text-[10px] hover:text-white transition-colors"
                    >
                      <Eye className="w-3 h-3" />Voir les logs
                    </Link>
                  </div>
                </motion.div>
              )
            })()}
          </div>

          {/* ── ROW 3: System + Categories + Performance + Shortcuts ───── */}
          <div className="grid lg:grid-cols-4 gap-6">

            {/* ── Statut systèmes ──────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="px-5 pt-5 pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-white font-bold text-sm leading-none">Statut systèmes</h2>
                    <p className="text-[#4a4a6a] text-[10px] mt-0.5">Infrastructure QuickGo</p>
                  </div>
                  {!loading && (() => {
                    const total = Object.keys(data?.system_status ?? {}).length
                    const ok    = Object.values(data?.system_status ?? {}).filter(s => s === "operational").length
                    const all   = ok === total
                    return (
                      <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full border ${all ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${all ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                        {all ? `${ok}/${total} OK` : `${total - ok} incident`}
                      </span>
                    )
                  })()}
                </div>

                {/* global health bar */}
                {!loading && (() => {
                  const total = Object.keys(data?.system_status ?? {}).length || 1
                  const ok    = Object.values(data?.system_status ?? {}).filter(s => s === "operational").length
                  const pct   = Math.round(ok / total * 100)
                  return (
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[#4a4a6a] text-[9px] uppercase tracking-wider font-semibold">Santé globale</span>
                        <span className="text-green-400 text-[10px] font-bold">{pct}%</span>
                      </div>
                      <div className="h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full bg-green-500"
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                        />
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div className="flex-1 px-5 pb-4 space-y-1.5">
                {loading ? (
                  [...Array(5)].map((_, i) => <div key={i} className="h-11 bg-white/5 animate-pulse rounded-xl" />)
                ) : (
                  Object.entries(data?.system_status ?? {}).map(([key, status]) => {
                    const Ico     = SYS_ICONS[key] ?? Zap
                    const ok      = status === "operational"
                    const detail  = SYS_DETAIL[key]
                    const latCls  = detail?.latency <= 10 ? "text-green-400" : detail?.latency <= 30 ? "text-[#6b6b8a]" : "text-orange-400"
                    return (
                      <div key={key} className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-colors ${ok ? "bg-[#16161f] border-[#1e1e2e] hover:bg-[#1e1e2e]" : "bg-red-500/5 border-red-500/20"}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${ok ? "bg-green-500/10" : "bg-red-500/15"}`}>
                          <Ico className={`w-3.5 h-3.5 ${ok ? "text-green-400" : "text-red-400"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-[11px] font-semibold truncate leading-none">{SYS_LABELS[key] ?? key}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className={`text-[9px] font-medium ${ok ? "text-green-400" : "text-red-400"}`}>
                              {ok ? "Opérationnel" : "Incident"}
                            </p>
                            {detail && (
                              <span className={`text-[9px] font-mono ${latCls}`}>{detail.latency}ms</span>
                            )}
                          </div>
                        </div>
                        {detail && (
                          <div className="text-right shrink-0">
                            <p className="text-[#6b6b8a] text-[9px] tabular-nums">{detail.uptime}%</p>
                            <p className="text-[#4a4a6a] text-[8px]">uptime</p>
                          </div>
                        )}
                        <div className="relative shrink-0">
                          <span className={`block w-2 h-2 rounded-full ${ok ? "bg-green-400" : "bg-red-400"}`} />
                          {ok && <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-40" />}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              <div className="px-5 py-2.5 border-t border-[#1e1e2e] flex items-center justify-between">
                <span className="text-[#4a4a6a] text-[9px]">
                  Vérif. : <span className="text-[#6b6b8a]">{new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                </span>
                <Link href="/admin/settings" className="text-[#4a4a6a] text-[9px] hover:text-white transition-colors">Configurer →</Link>
              </div>
            </motion.div>

            {/* ── Top catégories ───────────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="px-5 pt-5 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-white font-bold text-sm leading-none">Top catégories</h2>
                    <p className="text-[#4a4a6a] text-[10px] mt-0.5">
                      {loading ? "…" : `${data?.top_categories.length ?? 0} catégories actives`}
                    </p>
                  </div>
                  <Link href="/admin/categories" aria-label="Ouvrir les catégories" className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                    <ExternalLink className="w-3.5 h-3.5 text-[#4a4a6a] hover:text-white transition-colors" />
                  </Link>
                </div>
              </div>

              <div className="flex-1 px-5 pb-4 space-y-2">
                {loading ? (
                  [...Array(5)].map((_, i) => <div key={i} className="h-10 bg-white/5 animate-pulse rounded-lg" />)
                ) : (data?.top_categories ?? []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10">
                    <Tag className="w-7 h-7 text-[#2a2a3e] mb-2" />
                    <p className="text-[#6b6b8a] text-sm">Aucune donnée</p>
                  </div>
                ) : (
                  data!.top_categories.map((cat, i) => {
                    const color  = CAT_COLORS[i % CAT_COLORS.length]
                    const emoji  = CAT_EMOJIS[cat.name] ?? "📦"
                    const medals = ["🥇","🥈","🥉"]
                    return (
                      <motion.div key={cat.name}
                        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.07 }}
                        className="group flex items-center gap-2.5 p-2 rounded-xl hover:bg-white/[0.03] transition-colors cursor-default"
                      >
                        {/* rank / emoji */}
                        <div className="w-7 h-7 rounded-lg bg-[#1e1e2e] flex items-center justify-center text-sm shrink-0">
                          {i < 3 ? medals[i] : <span className="text-[#4a4a6a] text-xs font-bold">{i + 1}</span>}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-semibold transition-colors group-hover:text-white ${i === 0 ? "text-white" : "text-[#9ca3af]"}`}>
                              {emoji} {cat.name}
                            </span>
                            <span className="text-[10px] font-bold tabular-nums" style={{ color }}>{cat.pct}%</span>
                          </div>
                          <div className="h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
                            <motion.div className="h-full rounded-full"
                              style={{ background: color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${cat.pct}%` }}
                              transition={{ delay: 0.55 + i * 0.08, duration: 0.65, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>

              <div className="px-5 py-2.5 border-t border-[#1e1e2e] flex items-center justify-between">
                <span className="text-[#4a4a6a] text-[9px]">Basé sur les produits disponibles</span>
                <Link href="/admin/categories" className="text-[#4a4a6a] text-[9px] hover:text-white transition-colors">Gérer →</Link>
              </div>
            </motion.div>

            {/* ── Performance plateforme ───────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="px-5 pt-5 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-white font-bold text-sm leading-none">Performance</h2>
                    <p className="text-[#4a4a6a] text-[10px] mt-0.5">Métriques plateforme</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-[#4a4a6a]" />
                </div>
              </div>

              <div className="flex-1 px-5 pb-4">
                {loading ? (
                  <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-white/5 animate-pulse rounded-xl" />)}</div>
                ) : (
                  <div className="space-y-4">
                    <CircleGauge
                      value={data?.performance.availability ?? 0}
                      label="Disponibilité"
                      unit="%" color="#3b82f6"
                    />
                    <div className="h-px bg-[#1e1e2e]" />
                    <CircleGauge
                      value={data?.performance.response_time ?? 0}
                      max={5} label="Temps de réponse" unit="s"
                      color="#22d3ee" invert
                    />
                    <div className="h-px bg-[#1e1e2e]" />
                    <CircleGauge
                      value={data?.performance.uptime ?? 0}
                      label="Uptime 30j" unit="%"
                      color="#a3e635"
                    />
                  </div>
                )}
              </div>

              <div className="px-5 py-2.5 border-t border-[#1e1e2e] flex items-center justify-between">
                <span className="text-[#4a4a6a] text-[9px]">Mis à jour en temps réel</span>
                <Link href="/admin/analytics" className="text-[#4a4a6a] text-[9px] hover:text-white transition-colors">Détails →</Link>
              </div>
            </motion.div>

            {/* ── Raccourcis rapides ───────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
            >
              <div className="px-5 pt-5 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-white font-bold text-sm leading-none">Raccourcis</h2>
                    <p className="text-[#4a4a6a] text-[10px] mt-0.5">Actions fréquentes</p>
                  </div>
                  <Zap className="w-4 h-4 text-[#a3e635]" />
                </div>
              </div>

              <div className="flex-1 px-4 pb-4 space-y-2">
                {/* primary actions */}
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { icon: UserPlus,   label: "Ajouter vendeur",  href: "/admin/vendors", color: "#3b82f6", kbd: null },
                    { icon: Package,    label: "Voir commandes",   href: "/admin/orders",      color: "#22d3ee", kbd: null },
                    { icon: Wallet,     label: "Lancer payout",    href: "/admin/payouts",     color: "#f59e0b", kbd: null },
                    { icon: Truck,      label: "Gérer livreurs",   href: "/admin/drivers",     color: "#a3e635", kbd: null },
                  ].map(sc => (
                    <Link key={sc.label} href={sc.href}
                      className="flex items-center gap-2 p-2.5 rounded-xl border border-[#1e1e2e] hover:border-[#2a2a3e] hover:bg-[#1e1e2e] transition-all group"
                    >
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                        style={{ background: sc.color + "20" }}>
                        <sc.icon className="w-3.5 h-3.5" style={{ color: sc.color }} />
                      </div>
                      <span className="text-[#6b6b8a] text-[10px] font-medium group-hover:text-white transition-colors leading-tight">{sc.label}</span>
                    </Link>
                  ))}
                </div>

                {/* secondary actions */}
                <div className="space-y-1">
                  {[
                    { icon: BarChart3,     label: "Analyses & rapports",  href: "/admin/analytics",     color: "#8b5cf6" },
                    { icon: MessageCircle, label: "Support CRM",           href: "/admin/support",       color: "#f43f5e" },
                    { icon: Settings,      label: "Paramètres système",    href: "/admin/settings",      color: "#6b6b8a" },
                  ].map(sc => (
                    <Link key={sc.label} href={sc.href}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-[#1e1e2e] transition-colors group"
                    >
                      <sc.icon className="w-3.5 h-3.5 shrink-0" style={{ color: sc.color }} />
                      <span className="text-[#6b6b8a] text-xs group-hover:text-white transition-colors flex-1">{sc.label}</span>
                      <ChevronRight className="w-3 h-3 text-[#2a2a3e] group-hover:text-[#4a4a6a] transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="px-5 py-2.5 border-t border-[#1e1e2e]">
                <div className="flex items-center gap-2 bg-gradient-to-r from-blue-500/8 to-purple-500/8 border border-blue-500/15 rounded-xl px-3 py-2">
                  <Search className="w-3 h-3 text-blue-400 shrink-0" />
                  <span className="text-[#6b6b8a] text-[10px] flex-1">Recherche globale</span>
                  <div className="flex items-center gap-0.5">
                    <kbd className="text-[9px] text-[#4a4a6a] bg-[#1e1e2e] border border-[#2a2a3e] px-1.5 py-0.5 rounded font-mono">⌘</kbd>
                    <kbd className="text-[9px] text-[#4a4a6a] bg-[#1e1e2e] border border-[#2a2a3e] px-1.5 py-0.5 rounded font-mono">K</kbd>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>

        </div>
      </main>
    </div>
  )
}
