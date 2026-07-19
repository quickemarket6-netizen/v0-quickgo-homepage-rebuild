"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, ShoppingBag, TrendingUp, Wallet, Users, UserCog, BarChart3,
  Tag, Star, Settings, HelpCircle, Bell, ChevronDown, ChevronRight,
  LogOut, User, Truck, Boxes, Ticket, MessageSquare, RefreshCw,
  Shield, Building2, Eye, EyeOff, CheckCircle, Camera,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "profile" | "shop" | "notifications" | "security"
interface NotifPrefs { orders: boolean; reviews: boolean; payments: boolean; system: boolean; marketing: boolean }

// ─── Constants ────────────────────────────────────────────────────────────────
const SETTINGS_TABS: { key: Tab; label: string; sub: string; color: string; Icon: React.FC<{ className?: string; style?: React.CSSProperties }> }[] = [
  { key: "profile",       label: "Mon profil",    sub: "Identité & contact",     color: "#6366f1", Icon: User      },
  { key: "shop",          label: "Ma boutique",   sub: "Infos & configuration",  color: "#06b6d4", Icon: Building2 },
  { key: "notifications", label: "Notifications", sub: "Préférences d'alertes",  color: "#f59e0b", Icon: Bell      },
  { key: "security",      label: "Sécurité",      sub: "Mot de passe & accès",   color: "#ef4444", Icon: Shield    },
]

const SHOP_CATEGORIES = [
  "Alimentation & Boissons", "Mode & Vêtements", "Électronique & High-Tech",
  "Beauté & Cosmétiques", "Maison & Décoration", "Sports & Loisirs",
  "Santé & Bien-être", "Livres & Papeterie", "Auto & Moto", "Services",
]

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
  { icon: Users,        label: "Clients CRM",   href: "/vendor/crm" },
  { icon: UserCog,          label: "Employés",         href: "/vendor/employees"     },
  { icon: BarChart3,    label: "Analyses",      href: "/vendor/analytics" },
  { icon: Tag,          label: "Promotions",    href: "/vendor/promotions" },
  { icon: Ticket,       label: "Coupons",       href: "/vendor/coupons" },
  { icon: Star,         label: "Avis",          href: "/vendor/reviews" },
  { icon: MessageSquare,label: "Messages",      href: "/vendor/messages" },
  { icon: Bell,         label: "Notifications", href: "/vendor/notifications" },
  { icon: Settings,     label: "Paramètres",    href: "/vendor/settings", active: true },
  { icon: HelpCircle,   label: "Aide",          href: "/vendor/help" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(s: string) {
  return s.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase() || "V"
}

function Field({ label, value, onChange, placeholder, type = "text", readOnly = false, rows }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; readOnly?: boolean; rows?: number
}) {
  const base = "w-full bg-[#0a0a0f] border rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none transition-colors"
  const cls  = readOnly
    ? `${base} border-[#1e1e2e] text-white/40 cursor-not-allowed`
    : `${base} border-[#1e1e2e] focus:border-[#6366f1]/50`
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-white/50 font-medium uppercase tracking-wide block">{label}</label>
      {rows ? (
        <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
          className={`${cls} resize-none`} readOnly={readOnly} />
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className={cls} readOnly={readOnly} />
      )}
    </div>
  )
}

function Toggle({ label, sub, checked, onChange }: {
  label: string; sub: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-white/[0.05] last:border-0">
      <div>
        <p className="text-sm text-white font-medium">{label}</p>
        <p className="text-xs text-white/35 mt-0.5">{sub}</p>
      </div>
      <button onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-all shrink-0 ml-4 ${checked ? "bg-[#6366f1]" : "bg-white/10"}`}>
        <motion.div animate={{ x: checked ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-md" />
      </button>
    </div>
  )
}

function SaveBtn({ saving, saved, onClick, color = "#6366f1" }: {
  saving: boolean; saved: boolean; onClick: () => void; color?: string
}) {
  return (
    <motion.button onClick={onClick} disabled={saving}
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
      style={{ background: saved ? "#22c55e" : color }}>
      {saving ? <RefreshCw size={14} className="animate-spin" />
        : saved  ? <><CheckCircle size={14} /> Sauvegardé !</>
        : "Sauvegarder"}
    </motion.button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const supabase = useRef(createClient()).current
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [vendorName, setVendorName] = useState("")

  const [activeTab, setActiveTab] = useState<Tab>("profile")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved,  setSaved]    = useState(false)
  const [error,  setError]    = useState("")

  const [email,       setEmail]       = useState("")
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "" })
  const [shopForm,    setShopForm]    = useState({
    name: "", description: "", category: "", address: "", city: "",
    delivery_radius: "", delivery_fee: "", delivery_time_min: "",
    logo_url: "", cover_url: "",
  })
  const [isOpen, setIsOpen] = useState(true)
  const [togglingOpen, setTogglingOpen] = useState(false)
  const [uploadingImg, setUploadingImg] = useState<"logo" | "cover" | null>(null)
  const [notifPrefs,  setNotifPrefs]  = useState<NotifPrefs>({ orders: true, reviews: true, payments: true, system: true, marketing: false })
  const [pwForm,      setPwForm]      = useState({ new_password: "", confirm: "" })
  const [showPw,      setShowPw]      = useState(false)

  // Vendor info
  useEffect(() => {
    supabase.auth.getUser().then((res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      if (!res.data.user) return
      supabase.from("vendors").select("name").eq("owner_id", res.data.user.id).single()
        .then((r: { data: { name: string } | null }) => { if (r.data) setVendorName(r.data.name) })
    })
  }, [supabase])

  const toggleSection = (label: string) =>
    setExpandedSections(prev => ({ ...prev, [label]: !prev[label] }))

  // Load settings
  const load = useCallback(async () => {
    const res = await fetch("/api/vendor/settings")
    if (!res.ok) { setLoading(false); return }
    const d = await res.json()
    setEmail(d.profile?.email ?? "")
    setProfileForm({ full_name: d.profile?.full_name ?? "", phone: d.profile?.phone ?? "" })
    setShopForm({
      name:              d.vendor?.name            ?? "",
      description:       d.vendor?.description     ?? "",
      category:          d.vendor?.category        ?? "",
      address:           d.vendor?.address         ?? "",
      city:              d.vendor?.city            ?? "",
      delivery_radius:   String(d.vendor?.delivery_radius ?? ""),
      delivery_fee:      String(d.vendor?.delivery_fee ?? ""),
      delivery_time_min: String(d.vendor?.delivery_time_min ?? ""),
      logo_url:          d.vendor?.logo_url        ?? "",
      cover_url:         d.vendor?.cover_url       ?? "",
    })
    setIsOpen(d.vendor?.is_open ?? true)
    setNotifPrefs(d.notification_prefs ?? { orders: true, reviews: true, payments: true, system: true, marketing: false })
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const showSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const save = async () => {
    setError(""); setSaving(true)
    let body: Record<string, unknown> = {}

    if (activeTab === "profile")       body = { section: "profile",       ...profileForm }
    if (activeTab === "shop")          body = {
      section: "shop",
      ...shopForm,
      delivery_radius:   shopForm.delivery_radius   ? Number(shopForm.delivery_radius)   : null,
      delivery_fee:      shopForm.delivery_fee      !== "" ? Number(shopForm.delivery_fee)      : undefined,
      delivery_time_min: shopForm.delivery_time_min !== "" ? Number(shopForm.delivery_time_min) : undefined,
    }
    if (activeTab === "notifications") body = { section: "notifications", prefs: notifPrefs }
    if (activeTab === "security") {
      if (!pwForm.new_password.trim()) { setError("Entrez un nouveau mot de passe"); setSaving(false); return }
      if (pwForm.new_password !== pwForm.confirm) { setError("Les mots de passe ne correspondent pas"); setSaving(false); return }
      body = { section: "security", new_password: pwForm.new_password }
    }

    const res = await fetch("/api/vendor/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const d = await res.json()
    setSaving(false)
    if (d.error) { setError(d.error); return }
    showSaved()
    if (activeTab === "security") setPwForm({ new_password: "", confirm: "" })
    if (activeTab === "shop" && shopForm.name) setVendorName(shopForm.name)
  }

  // Ouvert/Fermé : appliqué immédiatement (pas besoin d'« Enregistrer »)
  const toggleOpen = async (next: boolean) => {
    setTogglingOpen(true)
    const prev = isOpen
    setIsOpen(next)
    try {
      const res = await fetch("/api/vendor/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section: "availability", is_open: next }),
      })
      if (!res.ok) setIsOpen(prev)
    } catch {
      setIsOpen(prev)
    } finally {
      setTogglingOpen(false)
    }
  }

  // Upload logo / couverture (réutilise le bucket public d'images)
  const uploadShopImage = async (kind: "logo" | "cover", file: File) => {
    setUploadingImg(kind)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/vendor/products/upload", { method: "POST", body: form })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.url) {
        setShopForm(f => kind === "logo" ? { ...f, logo_url: data.url } : { ...f, cover_url: data.url })
      } else {
        setError(data.error ?? "Échec de l'envoi de l'image")
      }
    } finally {
      setUploadingImg(null)
    }
  }

  const activeColor = SETTINGS_TABS.find(t => t.key === activeTab)?.color ?? "#6366f1"

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Background orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#6366f1] blur-[120px] animate-orb"
          style={{ "--orb-s": "1.2", "--orb-o-min": "0.12", "--orb-o-max": "0.28", "--orb-dur": "8s" } as React.CSSProperties} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#8b5cf6] blur-[120px] animate-orb"
          style={{ "--orb-s": "1.15", "--orb-o-min": "0.1", "--orb-o-max": "0.22", "--orb-dur": "10s", "--orb-delay": "3s" } as React.CSSProperties} />
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
              Array.isArray((item as { children?: { label: string; href: string; active?: boolean }[] }).children) &&
              ((item as { children?: { label: string; href: string; active?: boolean }[] }).children ?? []).some(c => c.active)
            return (
              <div key={item.label}>
                {("expandable" in item && item.expandable) ? (
                  <button onClick={() => toggleSection(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                      anyChildActive ? "text-[#a3e635] bg-[#a3e635]/10" : "text-white/50 hover:text-white hover:bg-[#1e1e2e]/60"
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" /><span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <Link href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      ("active" in item && item.active)
                        ? "bg-[#6366f1]/10 text-[#6366f1] border border-[#6366f1]/20"
                        : "text-white/50 hover:text-white hover:bg-[#1e1e2e]/60"
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" /><span className="flex-1">{item.label}</span>
                    {!!("active" in item && item.active) && <span className="w-1.5 h-1.5 rounded-full bg-[#6366f1]" />}
                  </Link>
                )}
                <AnimatePresence>
                  {("expandable" in item && item.expandable) && isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden ml-7 mt-0.5 space-y-0.5">
                      {(("children" in item && Array.isArray(item.children) ? item.children : []) as { href: string; label: string }[]).map(child => (
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
            className="bg-gradient-to-br from-[#6366f1]/15 to-[#8b5cf6]/15 border border-[#6366f1]/20 rounded-2xl p-4">
            <p className="text-white text-xs font-bold mb-1">Configuration</p>
            <p className="text-white/40 text-[10px]">Personnalisez votre espace vendeur</p>
          </motion.div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">

        {/* Header */}
        <div className="relative overflow-hidden bg-[#111118] shrink-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-transparent to-[#0a0a0f]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111118] via-transparent to-[#111118]" />
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-0 left-1/4 w-40 h-20 rounded-full bg-[#6366f1] blur-3xl opacity-30" />
          <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="w-10 h-10 rounded-2xl bg-[#6366f1]/20 border border-[#6366f1]/30 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-[#6366f1]" />
                </motion.div>
                <h1 className="text-2xl font-black text-white">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#6366f1] to-[#8b5cf6]">Paramètres</span>
                </h1>
              </div>
              <p className="text-white/40 text-sm">Gérez votre compte et vos préférences</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm text-white/70 max-w-[100px] truncate">{vendorName || "Vendeur"}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#111118] border-[#1e1e2e] text-white min-w-[160px]">
                <DropdownMenuItem className="hover:bg-white/5 cursor-pointer gap-2"><User className="w-4 h-4" /> Mon profil</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-white/5 cursor-pointer gap-2"><Settings className="w-4 h-4" /> Paramètres</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#1e1e2e]" />
                <DropdownMenuItem className="hover:bg-red-500/10 text-red-400 cursor-pointer gap-2"
                  onClick={() => supabase.auth.signOut().then(() => window.location.href = "/auth/login")}>
                  <LogOut className="w-4 h-4" /> Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-white/20 animate-spin" />
          </div>
        ) : (
          <div className="flex-1 p-6 flex gap-6 min-h-0 overflow-y-auto">

            {/* Left: tab nav */}
            <div className="w-52 shrink-0 space-y-1">
              {SETTINGS_TABS.map(tab => {
                const Icon = tab.Icon
                const active = activeTab === tab.key
                return (
                  <motion.button key={tab.key} onClick={() => { setActiveTab(tab.key); setError("") }}
                    whileHover={{ x: 2 }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all relative ${
                      active ? "bg-white/[0.06] border border-white/[0.08]" : "hover:bg-white/[0.03]"
                    }`}>
                    {active && <motion.div layoutId="settings-tab" className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r-full" style={{ background: tab.color }} />}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: active ? tab.color + "20" : "transparent" }}>
                      <Icon className="w-4 h-4" style={{ color: active ? tab.color : "rgba(255,255,255,0.35)" } as React.CSSProperties} />
                    </div>
                    <div>
                      <p className={`text-xs font-semibold ${active ? "text-white" : "text-white/50"}`}>{tab.label}</p>
                      <p className="text-[10px] text-white/25">{tab.sub}</p>
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {/* Right: panel */}
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div key={activeTab}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="bg-[#111118]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl overflow-hidden">

                  {/* Panel header */}
                  <div className="px-6 py-4 border-b border-[#1e1e2e] flex items-center gap-3"
                    style={{ borderBottom: `1px solid ${activeColor}18` }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: activeColor + "18" }}>
                      {(() => { const t = SETTINGS_TABS.find(x => x.key === activeTab); if (!t) return null; const I = t.Icon; return <I className="w-4 h-4" style={{ color: t.color } as React.CSSProperties} /> })()}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{SETTINGS_TABS.find(t => t.key === activeTab)?.label}</p>
                      <p className="text-white/30 text-xs">{SETTINGS_TABS.find(t => t.key === activeTab)?.sub}</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">

                    {/* ── Profile ── */}
                    {activeTab === "profile" && (
                      <>
                        <div className="flex items-center gap-4">
                          <div className="relative group cursor-pointer">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl"
                              style={{ background: "#6366f120", border: "1.5px solid #6366f130", color: "#6366f1" }}>
                              {initials(profileForm.full_name || vendorName)}
                            </div>
                            <div className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{profileForm.full_name || "Votre nom"}</p>
                            <p className="text-white/40 text-xs">{email}</p>
                            <p className="text-[10px] text-white/20 mt-0.5">Cliquez sur l'avatar pour le modifier</p>
                          </div>
                        </div>
                        <Field label="Nom complet" value={profileForm.full_name} onChange={v => setProfileForm(f => ({ ...f, full_name: v }))} placeholder="Votre nom complet" />
                        <Field label="Email" value={email} onChange={() => {}} placeholder="" readOnly />
                        <Field label="Téléphone" value={profileForm.phone} onChange={v => setProfileForm(f => ({ ...f, phone: v }))} placeholder="+237 6XX XXX XXX" />
                      </>
                    )}

                    {/* ── Shop ── */}
                    {activeTab === "shop" && (
                      <>
                        {/* Ouvert/Fermé — pilotage de la pastille publique, effet immédiat */}
                        <div className={`flex items-center justify-between p-4 rounded-xl border ${
                          isOpen ? "bg-[#22c55e]/10 border-[#22c55e]/25" : "bg-[#ef4444]/10 border-[#ef4444]/25"
                        }`}>
                          <div>
                            <p className="text-sm font-bold text-white flex items-center gap-2">
                              <span className={`w-2.5 h-2.5 rounded-full ${isOpen ? "bg-[#22c55e] animate-pulse" : "bg-[#ef4444]"}`} />
                              Boutique {isOpen ? "ouverte" : "fermée"}
                            </p>
                            <p className="text-xs text-white/40 mt-0.5">
                              {isOpen
                                ? "Visible « Ouvert » sur le marketplace — vous recevez des commandes."
                                : "Affichée « Fermé » — mettez en pause quand vous ne pouvez pas préparer."}
                            </p>
                          </div>
                          <button onClick={() => toggleOpen(!isOpen)} disabled={togglingOpen}
                            className={`relative w-12 h-7 rounded-full transition-all shrink-0 ml-4 ${isOpen ? "bg-[#22c55e]" : "bg-white/15"}`}>
                            <motion.div animate={{ x: isOpen ? 22 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
                              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md" />
                          </button>
                        </div>

                        {/* Logo + couverture */}
                        <div className="grid grid-cols-2 gap-3">
                          {(["logo", "cover"] as const).map((kind) => {
                            const url = kind === "logo" ? shopForm.logo_url : shopForm.cover_url
                            return (
                              <div key={kind} className="space-y-1.5">
                                <label className="text-xs text-white/50 font-medium uppercase tracking-wide block">
                                  {kind === "logo" ? "Logo" : "Image de couverture"}
                                </label>
                                <label className={`relative block rounded-xl border border-dashed border-[#1e1e2e] hover:border-[#06b6d4]/50
                                  cursor-pointer overflow-hidden transition-colors ${kind === "logo" ? "aspect-square max-w-[120px]" : "aspect-[3/1]"}`}>
                                  {url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={url} alt={kind} className="absolute inset-0 w-full h-full object-cover" />
                                  ) : null}
                                  <div className={`absolute inset-0 flex flex-col items-center justify-center gap-1 text-white/40
                                    ${url ? "bg-black/50 opacity-0 hover:opacity-100 transition-opacity" : ""}`}>
                                    <Camera className="w-4 h-4" />
                                    <span className="text-[10px]">{uploadingImg === kind ? "Envoi…" : url ? "Changer" : "Ajouter"}</span>
                                  </div>
                                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                                    disabled={uploadingImg !== null}
                                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadShopImage(kind, f); e.target.value = "" }} />
                                </label>
                              </div>
                            )
                          })}
                        </div>

                        <Field label="Nom de la boutique" value={shopForm.name} onChange={v => setShopForm(f => ({ ...f, name: v }))} placeholder="Ma boutique" />
                        <Field label="Description" value={shopForm.description} onChange={v => setShopForm(f => ({ ...f, description: v }))} placeholder="Décrivez votre boutique et vos produits…" rows={3} />
                        <div className="space-y-1.5">
                          <label className="text-xs text-white/50 font-medium uppercase tracking-wide block">Catégorie</label>
                          <select value={shopForm.category} onChange={e => setShopForm(f => ({ ...f, category: e.target.value }))}
                            className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#6366f1]/50 appearance-none">
                            <option value="">— Sélectionner —</option>
                            {SHOP_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <Field label="Adresse" value={shopForm.address} onChange={v => setShopForm(f => ({ ...f, address: v }))} placeholder="Rue, quartier…" rows={2} />
                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Ville" value={shopForm.city} onChange={v => setShopForm(f => ({ ...f, city: v }))} placeholder="Yaoundé" />
                          <Field label="Rayon de livraison (km)" value={shopForm.delivery_radius} onChange={v => setShopForm(f => ({ ...f, delivery_radius: v }))} placeholder="Ex: 25" type="number" />
                          <Field label="Frais de livraison (FCFA)" value={shopForm.delivery_fee} onChange={v => setShopForm(f => ({ ...f, delivery_fee: v }))} placeholder="Ex: 1 000 (0 = gratuite)" type="number" />
                          <Field label="Délai de livraison (min)" value={shopForm.delivery_time_min} onChange={v => setShopForm(f => ({ ...f, delivery_time_min: v }))} placeholder="Ex: 30" type="number" />
                        </div>
                      </>
                    )}

                    {/* ── Notifications ── */}
                    {activeTab === "notifications" && (
                      <div>
                        <Toggle label="Nouvelles commandes"   sub="Alertes pour chaque commande reçue"           checked={notifPrefs.orders}    onChange={v => setNotifPrefs(p => ({ ...p, orders:    v }))} />
                        <Toggle label="Avis clients"           sub="Notification quand un avis est publié"         checked={notifPrefs.reviews}   onChange={v => setNotifPrefs(p => ({ ...p, reviews:   v }))} />
                        <Toggle label="Paiements reçus"       sub="Alertes pour les virements et paiements"       checked={notifPrefs.payments}  onChange={v => setNotifPrefs(p => ({ ...p, payments:  v }))} />
                        <Toggle label="Alertes système"       sub="Mises à jour et maintenance planifiée"         checked={notifPrefs.system}    onChange={v => setNotifPrefs(p => ({ ...p, system:    v }))} />
                        <Toggle label="Marketing & conseils"  sub="Astuces pour booster vos ventes QuickGo"       checked={notifPrefs.marketing} onChange={v => setNotifPrefs(p => ({ ...p, marketing: v }))} />
                      </div>
                    )}

                    {/* ── Security ── */}
                    {activeTab === "security" && (
                      <>
                        <div className="p-3.5 rounded-xl bg-[#ef4444]/08 border border-[#ef4444]/15">
                          <p className="text-xs text-[#ef4444]/80">La modification du mot de passe mettra fin à toutes vos sessions actives.</p>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-white/50 font-medium uppercase tracking-wide block">Nouveau mot de passe</label>
                          <div className="relative">
                            <input type={showPw ? "text" : "password"} value={pwForm.new_password}
                              onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))}
                              placeholder="Minimum 6 caractères"
                              className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-sm text-white pr-10 focus:outline-none focus:border-[#ef4444]/50 placeholder-white/20" />
                            <button onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-white/50 font-medium uppercase tracking-wide block">Confirmer le mot de passe</label>
                          <input type={showPw ? "text" : "password"} value={pwForm.confirm}
                            onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
                            placeholder="Répétez le mot de passe"
                            className={`w-full bg-[#0a0a0f] border rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#ef4444]/50 placeholder-white/20 ${
                              pwForm.confirm && pwForm.new_password !== pwForm.confirm ? "border-[#ef4444]/50" : "border-[#1e1e2e]"
                            }`} />
                        </div>
                        {pwForm.confirm && pwForm.new_password !== pwForm.confirm && (
                          <p className="text-xs text-[#ef4444]">Les mots de passe ne correspondent pas</p>
                        )}
                      </>
                    )}

                    {/* Error */}
                    {error && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-xs text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl px-4 py-2.5">
                        {error}
                      </motion.p>
                    )}

                    {/* Save button */}
                    <div className="flex justify-end pt-2">
                      <SaveBtn saving={saving} saved={saved} onClick={save} color={activeColor} />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
