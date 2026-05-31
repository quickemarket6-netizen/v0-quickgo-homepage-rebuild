"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, ShoppingBag, TrendingUp, Wallet, Users, BarChart3,
  Tag, Star, Settings, HelpCircle, Bell, ChevronDown, ChevronRight,
  LogOut, User, Truck, Boxes, Ticket, Percent, RefreshCw, Plus, X, Copy,
  Check, CircleCheck, Clock, Ban, Shuffle, Trash2, ToggleLeft, ToggleRight,
  Gift, Layers, MessageSquare,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Types ────────────────────────────────────────────────────────────────────
type CouponType = "percentage" | "fixed" | "free_shipping" | "gift"
type CouponStatus = "active" | "scheduled" | "expired" | "exhausted" | "inactive"

interface Coupon {
  id: string; name: string; code: string; type: CouponType
  value: number | null; min_order_amount: number | null
  max_uses: number | null; current_uses: number; is_single_use: boolean
  starts_at: string | null; ends_at: string | null
  is_active: boolean; created_at: string; status: CouponStatus
}
interface KPI { total: number; active: number; total_uses: number; exhausted: number }
interface Counts { all: number; active: number; scheduled: number; exhausted: number; expired: number }

// ─── Constants ────────────────────────────────────────────────────────────────
const BACKGROUND_VIDEOS = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background%20videos%20E-market%20hero-tiwMHaJdezDuLsRvu9dKGD6duCx1gr.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/video%20market%20place%20background%20hero-ukKWRfEszbAZsD07cLFE1nT4OaJHBS.mp4",
]

const STATUS_CFG: Record<CouponStatus, { label: string; color: string; Icon: React.FC<{ className?: string; style?: React.CSSProperties }>; pulse: boolean }> = {
  active:    { label: "Actif",      color: "#22c55e", Icon: CircleCheck, pulse: true  },
  scheduled: { label: "Planifié",   color: "#3b82f6", Icon: Clock,       pulse: false },
  expired:   { label: "Expiré",     color: "#6b7280", Icon: Ban,         pulse: false },
  exhausted: { label: "Épuisé",     color: "#f97316", Icon: Ban,         pulse: false },
  inactive:  { label: "Inactif",    color: "#6b7280", Icon: Ban,         pulse: false },
}

const TYPE_CFG: Record<CouponType, { label: string; color: string; Icon: React.FC<{ className?: string; size?: number; style?: React.CSSProperties }>; desc: string }> = {
  percentage:    { label: "Pourcentage",      color: "#06b6d4", Icon: Percent, desc: "X% de réduction" },
  fixed:         { label: "Montant fixe",     color: "#8b5cf6", Icon: Tag,     desc: "X F CFA de réduction" },
  free_shipping: { label: "Livraison offerte",color: "#22c55e", Icon: Truck,   desc: "Frais de port offerts" },
  gift:          { label: "Cadeau",           color: "#f97316", Icon: Gift,    desc: "Cadeau offert à l'achat" },
}

const FILTER_TABS = [
  { key: "all",       label: "Tous" },
  { key: "active",    label: "Actifs" },
  { key: "scheduled", label: "Planifiés" },
  { key: "exhausted", label: "Épuisés" },
  { key: "expired",   label: "Expirés" },
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
  { icon: Ticket,     label: "Coupons",     href: "/vendor/coupons", active: true },
  { icon: Star,         label: "Avis",     href: "/vendor/reviews" },
  { icon: MessageSquare,label: "Messages", href: "/vendor/messages" },
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

function genCode(len = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
}

function fmtDate(s: string | null) {
  if (!s) return null
  return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
}

function fmtValue(c: Coupon) {
  if (c.type === "percentage") return `${c.value}%`
  if (c.type === "fixed") return `${c.value?.toLocaleString("fr-FR")} F`
  return null
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
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20" style={{ background: color }} />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center relative z-10" style={{ background: `${color}20` }}>
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

// ─── Coupon Card ──────────────────────────────────────────────────────────────
function CouponCard({ coupon, onToggle, onDelete }: {
  coupon: Coupon
  onToggle: (id: string, active: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [copied, setCopied]     = useState(false)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const statusCfg = STATUS_CFG[coupon.status]
  const StatusIcon = statusCfg.Icon
  const typeCfg    = TYPE_CFG[coupon.type]
  const TypeIcon   = typeCfg.Icon
  const usagePct   = coupon.max_uses ? Math.min((coupon.current_uses / coupon.max_uses) * 100, 100) : null
  const displayVal = fmtValue(coupon)

  const copyCode = () => {
    navigator.clipboard.writeText(coupon.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleToggle = async () => { setToggling(true); await onToggle(coupon.id, !coupon.is_active); setToggling(false) }
  const handleDelete = async () => { setDeleting(true); await onDelete(coupon.id); setDeleting(false) }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ borderColor: "#2a2a3e" }}
      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 space-y-4 transition-colors relative overflow-hidden"
    >
      {/* Type color accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: typeCfg.color }} />

      {/* Corner glow */}
      <div className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-10"
        style={{ background: typeCfg.color }} />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 relative z-10 pl-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: typeCfg.color + "20" }}>
            <TypeIcon className="w-5 h-5" style={{ color: typeCfg.color } as React.CSSProperties} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-white font-bold text-sm">{coupon.name}</p>
              {coupon.is_single_use && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#06b6d4]/15 text-[#06b6d4] font-medium">
                  1 usage
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs font-medium px-1.5 py-0.5 rounded-md"
                style={{ background: typeCfg.color + "15", color: typeCfg.color }}>
                {typeCfg.label}
              </span>
              {displayVal && (
                <span className="text-xs text-white/50">— {displayVal} off</span>
              )}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
          style={{ background: statusCfg.color + "22", color: statusCfg.color }}>
          {statusCfg.pulse && (
            <span className="relative flex w-1.5 h-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: statusCfg.color }} />
              <span className="relative inline-flex rounded-full w-1.5 h-1.5" style={{ background: statusCfg.color }} />
            </span>
          )}
          <StatusIcon className="w-3 h-3" />
          {statusCfg.label}
        </div>
      </div>

      {/* Code row */}
      <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5 relative z-10 pl-4">
        <code className="flex-1 font-mono text-sm tracking-[0.15em] text-white/90">{coupon.code}</code>
        <button onClick={copyCode}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-[#06b6d4] transition-colors shrink-0">
          {copied ? <Check size={14} className="text-[#22c55e]" /> : <Copy size={14} />}
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>

      {/* Details chips */}
      <div className="flex flex-wrap gap-2 text-xs text-white/40 relative z-10 pl-2">
        {coupon.min_order_amount && (
          <span className="bg-white/5 px-2.5 py-1 rounded-lg">Min {coupon.min_order_amount.toLocaleString("fr-FR")} F</span>
        )}
        {coupon.starts_at && <span className="bg-white/5 px-2.5 py-1 rounded-lg">Dès {fmtDate(coupon.starts_at)}</span>}
        {coupon.ends_at && <span className="bg-white/5 px-2.5 py-1 rounded-lg">Jusqu'au {fmtDate(coupon.ends_at)}</span>}
        <span className="bg-white/5 px-2.5 py-1 rounded-lg">
          {coupon.current_uses} utilisation{coupon.current_uses !== 1 ? "s" : ""}
          {coupon.max_uses ? ` / ${coupon.max_uses}` : ""}
        </span>
      </div>

      {/* Usage bar */}
      {usagePct !== null && (
        <div className="space-y-1 relative z-10 pl-2">
          <div className="flex justify-between text-xs text-white/30">
            <span>Utilisation</span>
            <span>{Math.round(usagePct)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ background: usagePct >= 90 ? "#ef4444" : usagePct >= 60 ? "#f97316" : typeCfg.color }}
              initial={{ width: 0 }} animate={{ width: `${usagePct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between relative z-10 pt-1 border-t border-white/5 pl-2">
        <p className="text-xs text-white/20">Créé le {fmtDate(coupon.created_at)}</p>
        <div className="flex items-center gap-2">
          <button onClick={handleToggle} disabled={toggling}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors disabled:opacity-40">
            {toggling
              ? <RefreshCw size={14} className="animate-spin" />
              : coupon.is_active
                ? <ToggleRight size={18} className="text-[#22c55e]" />
                : <ToggleLeft size={18} />}
            {coupon.is_active ? "Désactiver" : "Activer"}
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40">
            {deleting ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={13} />}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Create Modal ─────────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [mode, setMode]       = useState<"single" | "bulk">("single")
  const [bulkCount, setBulkCount] = useState("10")
  const [form, setForm]       = useState({
    name: "", code: "", type: "percentage" as CouponType,
    value: "", min_order_amount: "", max_uses: "",
    is_single_use: false, starts_at: "", ends_at: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState("")
  const [success, setSuccess]       = useState<{ count: number } | null>(null)

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm(f => ({ ...f, [k]: v }))
  const needsValue = form.type === "percentage" || form.type === "fixed"

  const handleSubmit = async () => {
    setError("")
    if (!form.name.trim()) { setError("Le nom est requis."); return }
    if (needsValue && !form.value) { setError("La valeur de réduction est requise."); return }
    if (mode === "single" && !form.code.trim()) { setError("Le code est requis en mode unitaire."); return }

    setSubmitting(true)
    try {
      const body = {
        name:             form.name.trim(),
        code:             mode === "single" ? form.code.trim().toUpperCase() : undefined,
        type:             form.type,
        value:            needsValue ? parseFloat(form.value) : null,
        min_order_amount: form.min_order_amount ? parseFloat(form.min_order_amount) : null,
        max_uses:         form.is_single_use ? 1 : (form.max_uses ? parseInt(form.max_uses) : null),
        is_single_use:    form.is_single_use,
        starts_at:        form.starts_at || null,
        ends_at:          form.ends_at || null,
        ...(mode === "bulk" ? { bulk: parseInt(bulkCount) || 10 } : {}),
      }
      const res = await fetch("/api/vendor/coupons", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error ?? "Erreur lors de la création."); setSubmitting(false); return }
      setSuccess({ count: d.count ?? 1 })
      setTimeout(() => { onClose(); onCreated() }, 2000)
    } catch { setError("Erreur réseau.") }
    setSubmitting(false)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">

        {success ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
              <CircleCheck size={56} className="text-[#06b6d4]" />
            </motion.div>
            <p className="text-white font-bold text-lg">
              {success.count > 1 ? `${success.count} coupons créés !` : "Coupon créé !"}
            </p>
            <p className="text-white/40 text-sm text-center">
              {success.count > 1 ? `${success.count} codes uniques ont été générés.` : "Votre coupon est maintenant actif."}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold text-lg flex items-center gap-2">
                <Ticket size={18} className="text-[#06b6d4]" />
                Créer un coupon
              </h2>
              <button onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
                <X size={14} className="text-white/40" />
              </button>
            </div>

            {/* Mode toggle */}
            <div className="flex rounded-xl overflow-hidden border border-[#1e1e2e] p-1 gap-1 bg-[#0a0a0f]">
              {(["single", "bulk"] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === m ? "bg-[#06b6d4]/20 text-[#06b6d4]" : "text-white/40 hover:text-white/70"
                  }`}>
                  {m === "single" ? <><Ticket size={14} /> Unitaire</> : <><Layers size={14} /> En masse</>}
                </button>
              ))}
            </div>

            {/* Nom */}
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 font-medium uppercase tracking-wide">Nom de la campagne</label>
              <input value={form.name} onChange={e => set("name", e.target.value)}
                placeholder="Ex: Bienvenue, Fidélité VIP, Anniversaire…"
                className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#06b6d4]/50 placeholder-white/20" />
            </div>

            {/* Type */}
            <div className="space-y-1.5">
              <label className="text-xs text-white/50 font-medium uppercase tracking-wide">Type de coupon</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(TYPE_CFG) as [CouponType, typeof TYPE_CFG[CouponType]][]).map(([t, cfg]) => {
                  const TIcon = cfg.Icon
                  return (
                    <button key={t} onClick={() => set("type", t)}
                      className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                        form.type === t ? "border-opacity-100 text-white" : "border-[#1e1e2e] text-white/50 hover:text-white/80 hover:border-[#2a2a3e]"
                      }`}
                      style={{ borderColor: form.type === t ? cfg.color + "60" : undefined, background: form.type === t ? cfg.color + "10" : undefined }}>
                      <TIcon size={16} style={{ color: cfg.color }} />
                      <div>
                        <p className="text-xs font-semibold leading-tight">{cfg.label}</p>
                        <p className="text-[10px] text-white/30 leading-tight">{cfg.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Value (only for % and fixed) */}
            <AnimatePresence>
              {needsValue && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-1.5">
                  <label className="text-xs text-white/50 font-medium uppercase tracking-wide block">
                    Valeur {form.type === "percentage" ? "(%)" : "(F CFA)"}
                  </label>
                  <input type="number" min="1" max={form.type === "percentage" ? "100" : undefined}
                    value={form.value} onChange={e => set("value", e.target.value)}
                    placeholder={form.type === "percentage" ? "15" : "2000"}
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#06b6d4]/50 placeholder-white/20" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Code (single) or bulk count */}
            {mode === "single" ? (
              <div className="space-y-1.5">
                <label className="text-xs text-white/50 font-medium uppercase tracking-wide">Code coupon</label>
                <div className="flex gap-2">
                  <input value={form.code} onChange={e => set("code", e.target.value.toUpperCase())}
                    placeholder="Ex: WELCOME10"
                    className="flex-1 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-white font-mono tracking-widest text-sm focus:outline-none focus:border-[#06b6d4]/50 placeholder-white/20" />
                  <button onClick={() => set("code", genCode())}
                    className="px-3 py-2.5 rounded-xl bg-[#06b6d4]/10 border border-[#06b6d4]/20 text-[#06b6d4] hover:bg-[#06b6d4]/20 transition-all text-xs flex items-center gap-1.5">
                    <Shuffle size={13} /> Auto
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs text-white/50 font-medium uppercase tracking-wide">Nombre de codes à générer</label>
                <div className="flex gap-2">
                  <input type="number" min="2" max="50" value={bulkCount}
                    onChange={e => setBulkCount(e.target.value)}
                    className="w-32 bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#06b6d4]/50" />
                  <p className="flex-1 flex items-center text-xs text-white/40 pl-1">
                    codes alphanumériques uniques de 10 caractères seront générés automatiquement (max 50)
                  </p>
                </div>
              </div>
            )}

            {/* Options row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-white/50 font-medium uppercase tracking-wide">Montant min. (F CFA)</label>
                <input type="number" min="0" value={form.min_order_amount}
                  onChange={e => set("min_order_amount", e.target.value)} placeholder="Optionnel"
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#06b6d4]/50 placeholder-white/20" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/50 font-medium uppercase tracking-wide">Utilisations max.</label>
                <input type="number" min="1" value={form.max_uses} disabled={form.is_single_use}
                  onChange={e => set("max_uses", e.target.value)} placeholder={form.is_single_use ? "1 (usage unique)" : "Illimité"}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#06b6d4]/50 placeholder-white/20 disabled:opacity-40" />
              </div>
            </div>

            {/* Single use toggle */}
            <button onClick={() => set("is_single_use", !form.is_single_use)}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-[#1e1e2e] hover:border-[#2a2a3e] transition-colors text-left">
              {form.is_single_use
                ? <ToggleRight size={20} className="text-[#06b6d4] shrink-0" />
                : <ToggleLeft size={20} className="text-white/30 shrink-0" />}
              <div>
                <p className="text-sm text-white font-medium">Usage unique par coupon</p>
                <p className="text-xs text-white/40">Chaque coupon ne peut être utilisé qu'une seule fois</p>
              </div>
            </button>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs text-white/50 font-medium uppercase tracking-wide">Date de début</label>
                <input type="date" value={form.starts_at} onChange={e => set("starts_at", e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#06b6d4]/50 [color-scheme:dark]" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-white/50 font-medium uppercase tracking-wide">Date de fin</label>
                <input type="date" value={form.ends_at} onChange={e => set("ends_at", e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-[#06b6d4]/50 [color-scheme:dark]" />
              </div>
            </div>

            {error && <p className="text-sm text-[#ef4444]">{error}</p>}

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSubmit} disabled={submitting}
              className="w-full py-3 rounded-xl bg-[#06b6d4]/20 border border-[#06b6d4]/40 text-[#06b6d4]
                hover:bg-[#06b6d4]/30 transition-all font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? "Création en cours…"
                : mode === "bulk" ? `Générer ${parseInt(bulkCount) || 10} codes` : "Créer le coupon"}
            </motion.button>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CouponsPage() {
  const supabase = useRef(createClient())
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoIdx, setVideoIdx] = useState(0)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ Produits: false, Portefeuille: false })
  const [vendorName, setVendorName]   = useState("")
  const [vendorInits, setVendorInits] = useState("")

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [kpi, setKpi]         = useState<KPI>({ total: 0, active: 0, total_uses: 0, exhausted: 0 })
  const [counts, setCounts]   = useState<Counts>({ all: 0, active: 0, scheduled: 0, exhausted: 0, expired: 0 })
  const [filter, setFilter]   = useState("all")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal, setShowModal]   = useState(false)

  const animTotal    = useCountUp(kpi.total)
  const animActive   = useCountUp(kpi.active)
  const animUses     = useCountUp(kpi.total_uses)
  const animExhausted = useCountUp(kpi.exhausted)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.src = BACKGROUND_VIDEOS[videoIdx % BACKGROUND_VIDEOS.length]
    video.load()
    const onCanPlay = () => video.play().catch(() => {})
    video.addEventListener("canplay", onCanPlay, { once: true })
    return () => video.removeEventListener("canplay", onCanPlay)
  }, [videoIdx])

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
    if (!quiet) setLoading(true); else setRefreshing(true)
    try {
      const res = await fetch(`/api/vendor/coupons?filter=${filter}`)
      if (res.ok) {
        const d = await res.json()
        setCoupons(d.coupons ?? [])
        setKpi(d.kpi ?? kpi)
        setCounts(d.counts ?? counts)
      }
    } finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { void fetchData() }, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = async (id: string, active: boolean) => {
    await fetch("/api/vendor/coupons", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ coupon_id: id, is_active: active }) })
    void fetchData(true)
  }
  const handleDelete = async (id: string) => {
    await fetch("/api/vendor/coupons", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ coupon_id: id }) })
    void fetchData(true)
  }

  const handleSignOut = async () => { await supabase.current.auth.signOut(); window.location.href = "/auth/login" }
  const toggleSection = (label: string) => setExpandedSections(s => ({ ...s, [label]: !s[label] }))
  const filterCount   = (key: string) => key === "all" ? counts.all : (counts[key as keyof Counts] ?? 0)

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">

      {/* Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {[
          { color: "#06b6d4", x: "top-1/4 left-1/4",  size: "w-96 h-96", dur: 9,  d: 0 },
          { color: "#3b82f6", x: "bottom-1/3 right-1/4", size: "w-80 h-80", dur: 11, d: 3 },
          { color: "#0d9488", x: "top-2/3 left-1/2",  size: "w-72 h-72", dur: 13, d: 6 },
        ].map((o, i) => (
          <motion.div key={i}
            animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: o.dur, repeat: Infinity, ease: "easeInOut", delay: o.d }}
            className={`absolute ${o.x} ${o.size} rounded-full blur-[130px]`}
            style={{ background: o.color }} />
        ))}
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
                        ? "bg-[#a3e635]/10 text-[#a3e635] border border-[#a3e635]/20"
                        : "text-white/50 hover:text-white hover:bg-[#1e1e2e]/60"
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                    {!!("active" in item && item.active) && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#a3e635]" />}
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
            className="bg-gradient-to-br from-[#06b6d4]/20 to-[#3b82f6]/20 border border-[#06b6d4]/20 rounded-2xl p-4">
            <p className="text-white text-xs font-bold mb-1">Fidélisez vos clients</p>
            <p className="text-white/40 text-[10px] mb-3">Distribuez des coupons exclusifs à vos acheteurs</p>
            <button onClick={() => setShowModal(true)}
              className="w-full py-1.5 rounded-lg bg-[#06b6d4] text-white text-xs font-bold flex items-center justify-center gap-1.5">
              <Plus className="w-3 h-3" /> Créer un coupon
            </button>
          </motion.div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">

        {/* Header */}
        <div className="relative overflow-hidden bg-[#111118]">
          <video ref={videoRef} muted loop playsInline onEnded={() => setVideoIdx(i => i + 1)}
            className="absolute inset-0 w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-transparent to-[#0a0a0f]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111118] via-transparent to-[#111118]" />
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-0 left-1/4 w-40 h-20 rounded-full bg-[#06b6d4] blur-3xl opacity-30" />
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 8, repeat: Infinity, delay: 2 }}
            className="absolute top-0 right-1/3 w-32 h-16 rounded-full bg-[#3b82f6] blur-3xl opacity-20" />

          <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <motion.div animate={{ y: [0, -5, 0], rotate: [-5, 5, -5] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-2xl bg-[#06b6d4]/20 border border-[#06b6d4]/30 flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-[#06b6d4]" />
                </motion.div>
                <h1 className="text-2xl font-black text-white">
                  Gestion des{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#06b6d4] to-[#3b82f6]">
                    Coupons
                  </span>
                </h1>
              </div>
              <p className="text-white/40 text-sm">Créez et distribuez des codes de réduction personnalisés</p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#06b6d4]/20 border border-[#06b6d4]/30 text-[#06b6d4] hover:bg-[#06b6d4]/30 transition-all text-sm font-semibold">
                <Plus className="w-4 h-4" /> Nouveau coupon
              </motion.button>
              <motion.button onClick={() => fetchData(true)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
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
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#06b6d4] to-[#3b82f6] border-2 border-[#06b6d4]/60 shadow-[0_0_12px_rgba(6,182,212,0.25)] flex items-center justify-center">
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

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Coupons créés"    value={animTotal}     sub="au total"        color="#3b82f6" Icon={Ticket}     delay={0}    />
            <KpiCard label="Actifs"           value={animActive}    sub="en circulation"  color="#22c55e" Icon={CircleCheck} delay={0.06} />
            <KpiCard label="Utilisations"     value={animUses}      sub="depuis le début" color="#06b6d4" Icon={Percent}    delay={0.12} />
            <KpiCard label="Épuisés"          value={animExhausted} sub="quota atteint"   color="#f97316" Icon={Ban}        delay={0.18} />
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

          {/* Coupons grid */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-52 rounded-2xl bg-[#16161f] animate-pulse" />)}
            </div>
          ) : coupons.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 gap-4">
              <motion.div animate={{ y: [0, -6, 0], rotate: [-8, 8, -8] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                <Ticket size={48} className="text-white/20" />
              </motion.div>
              <p className="text-white/40 text-center">Aucun coupon{filter !== "all" ? " dans cette catégorie" : ""}</p>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06b6d4]/20 border border-[#06b6d4]/30 text-[#06b6d4] hover:bg-[#06b6d4]/30 transition-all text-sm font-medium">
                <Plus size={15} /> Créer mon premier coupon
              </motion.button>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {coupons.map(c => (
                  <CouponCard key={c.id} coupon={c} onToggle={handleToggle} onDelete={handleDelete} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </main>

      <AnimatePresence>
        {showModal && <CreateModal onClose={() => setShowModal(false)} onCreated={() => fetchData(true)} />}
      </AnimatePresence>
    </div>
  )
}
