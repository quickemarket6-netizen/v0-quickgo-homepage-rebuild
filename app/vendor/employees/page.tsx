"use client"

import React, { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  Users2,
  UserCog,
  Crown,
  Briefcase,
  TrendingUp,
  Headphones,
  Truck,
  Calculator,
  UserPlus,
  MoreVertical,
  Pencil,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  Star,
  MessageSquare,
  Bell,
  BarChart3,
  Users,
  Tag,
  Ticket,
  Truck as TruckIcon,
  HelpCircle,
  Settings,
  CreditCard,
  X,
  Check,
  Shield,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// ─── Types ────────────────────────────────────────────────────────────────────
type MemberStatus = "active" | "invited" | "inactive"
type MemberRole   = "owner" | "manager" | "sales" | "support" | "logistics" | "accountant"
type FilterTab    = "all" | "active" | "invited" | "inactive"

interface Member {
  id: string; vendor_id: string; name: string; email: string
  phone: string | null; role: MemberRole; status: MemberStatus
  avatar_url: string | null; last_active: string | null; created_at: string
}

interface KPI { total: number; active: number; invited: number; inactive: number }

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLE_CFG: Record<MemberRole, {
  label: string; color: string
  Icon: React.FC<{ className?: string; style?: React.CSSProperties }>
}> = {
  owner:      { label: "Propriétaire", color: "#f43f5e", Icon: Crown       },
  manager:    { label: "Gérant",       color: "#8b5cf6", Icon: Briefcase   },
  sales:      { label: "Commercial",   color: "#3b82f6", Icon: TrendingUp  },
  support:    { label: "Support",      color: "#06b6d4", Icon: Headphones  },
  logistics:  { label: "Logistique",   color: "#22c55e", Icon: Truck       },
  accountant: { label: "Comptable",    color: "#f59e0b", Icon: Calculator  },
}

const ROLE_OPTIONS = (Object.keys(ROLE_CFG) as MemberRole[])

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG: Record<MemberStatus, {
  label: string; color: string; bg: string
  Icon: React.FC<{ className?: string; style?: React.CSSProperties }>
}> = {
  active:   { label: "Actif",     color: "#22c55e", bg: "bg-[#22c55e]/10",  Icon: CheckCircle2 },
  invited:  { label: "Invité",    color: "#3b82f6", bg: "bg-[#3b82f6]/10",  Icon: Clock        },
  inactive: { label: "Inactif",   color: "#6b7280", bg: "bg-[#6b7280]/10",  Icon: XCircle      },
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Tableau de bord",  href: "/vendor/dashboard"     },
  { icon: Package,          label: "Produits",         href: "/vendor/products"      },
  { icon: ShoppingCart,     label: "Commandes",        href: "/vendor/orders"        },
  { icon: TruckIcon,        label: "Livraisons",       href: "/vendor/deliveries"    },
  { icon: Wallet,           label: "Portefeuille",     href: "/vendor/wallet"        },
  { icon: CreditCard,       label: "Paiements",        href: "/vendor/payouts"       },
  { icon: Star,             label: "Avis",             href: "/vendor/reviews"       },
  { icon: MessageSquare,    label: "Messages",         href: "/vendor/messages"      },
  { icon: Bell,             label: "Notifications",    href: "/vendor/notifications" },
  { icon: Tag,              label: "Promotions",       href: "/vendor/promotions"    },
  { icon: Ticket,           label: "Coupons",          href: "/vendor/coupons"       },
  { icon: Users,            label: "Clients CRM",      href: "/vendor/crm"           },
  { icon: UserCog,          label: "Employés",         href: "/vendor/employees",    active: true },
  { icon: BarChart3,        label: "Analyses",         href: "/vendor/analytics"     },
  { icon: Package,          label: "Stocks",           href: "/vendor/stocks"        },
  { icon: HelpCircle,       label: "Support",          href: "/vendor/help"          },
  { icon: Settings,         label: "Paramètres",       href: "/vendor/settings"      },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map(w => w[0] ?? "").slice(0, 2).join("").toUpperCase() || "?"
}

function timeAgo(iso: string | null): string {
  if (!iso) return "Jamais"
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)   return "À l'instant"
  if (m < 60)  return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24)  return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  return `Il y a ${d}j`
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function MemberAvatar({ member, size = 40 }: { member: Member; size?: number }) {
  const cfg = ROLE_CFG[member.role]
  if (member.avatar_url) {
    return (
      <Image src={member.avatar_url} alt={member.name} width={size} height={size}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover" }} />
    )
  }
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${cfg.color}22`,
      border: `2px solid ${cfg.color}55`, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color: cfg.color,
      flexShrink: 0 }}>
      {initials(member.name)}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, color, icon: Icon, sub }: {
  label: string; value: number; color: string; sub?: string
  icon: React.FC<{ className?: string; style?: React.CSSProperties }>
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl bg-[#111118] border border-[#1e1e2e] p-5">
      <div className="absolute inset-0 opacity-5"
        style={{ background: `radial-gradient(circle at 70% 50%, ${color}, transparent 70%)` }} />
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-[#6b7280] font-medium uppercase tracking-wider">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
          <Icon style={{ color, width: 16, height: 16 }} />
        </div>
      </div>
      <div className="text-3xl font-bold" style={{ color }}>{value}</div>
      {sub && <div className="text-xs text-[#4b5563] mt-1">{sub}</div>}
    </motion.div>
  )
}

// ─── Employee Card ────────────────────────────────────────────────────────────
function EmployeeCard({ member, onUpdate, onDelete }: {
  member: Member
  onUpdate: (id: string, patch: { role?: MemberRole; status?: MemberStatus }) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const role   = ROLE_CFG[member.role]
  const status = STATUS_CFG[member.status]
  const [editing, setEditing]     = useState(false)
  const [editRole, setEditRole]   = useState<MemberRole>(member.role)
  const [confirmDel, setConfirmDel] = useState(false)
  const [menuOpen, setMenuOpen]   = useState(false)
  const [saving, setSaving]       = useState(false)

  async function saveRole() {
    if (editRole === member.role) { setEditing(false); return }
    setSaving(true)
    await onUpdate(member.id, { role: editRole })
    setSaving(false)
    setEditing(false)
  }

  async function toggleStatus() {
    const next: MemberStatus = member.status === "active" ? "inactive" : "active"
    await onUpdate(member.id, { status: next })
  }

  return (
    <motion.div layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="relative bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden
        hover:border-[#2e2e3e] transition-colors">
      {/* left accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ background: role.color }} />

      <div className="pl-5 pr-4 py-4">
        {/* top row */}
        <div className="flex items-start gap-3">
          <MemberAvatar member={member} size={44} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white text-sm">{member.name}</span>
              {/* status badge */}
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${status.bg}`}
                style={{ color: status.color }}>
                {member.status === "active" && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ background: status.color }} />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5"
                      style={{ background: status.color }} />
                  </span>
                )}
                {status.label}
              </span>
            </div>
            <div className="text-xs text-[#6b7280] mt-0.5 truncate">{member.email}</div>
          </div>

          {/* menu */}
          <div className="relative">
            <button onClick={() => setMenuOpen(o => !o)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6b7280]
                hover:bg-[#1e1e2e] hover:text-white transition-colors">
              <MoreVertical size={14} />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="absolute right-0 top-8 z-20 min-w-[150px] bg-[#1a1a2e] border
                    border-[#2e2e4e] rounded-xl shadow-2xl overflow-hidden py-1">
                  <button onClick={() => { setEditing(true); setMenuOpen(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#e2e8f0]
                      hover:bg-[#2e2e4e] transition-colors">
                    <Pencil size={12} /> Modifier le rôle
                  </button>
                  <button onClick={() => { toggleStatus(); setMenuOpen(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#e2e8f0]
                      hover:bg-[#2e2e4e] transition-colors">
                    {member.status === "active"
                      ? <><XCircle size={12} /> Désactiver</>
                      : <><CheckCircle2 size={12} /> Activer</>}
                  </button>
                  <div className="border-t border-[#2e2e4e] my-1" />
                  <button onClick={() => { setConfirmDel(true); setMenuOpen(false) }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[#f87171]
                      hover:bg-[#f87171]/10 transition-colors">
                    <Trash2 size={12} /> Retirer de l'équipe
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* role row */}
        <div className="mt-3">
          <AnimatePresence mode="wait">
            {editing ? (
              <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2">
                <select value={editRole} onChange={e => setEditRole(e.target.value as MemberRole)}
                  className="flex-1 bg-[#0d0d14] border border-[#2e2e4e] rounded-lg text-xs
                    text-white px-3 py-1.5 focus:outline-none focus:border-[#f43f5e]">
                  {ROLE_OPTIONS.map(r => (
                    <option key={r} value={r}>{ROLE_CFG[r].label}</option>
                  ))}
                </select>
                <button onClick={saveRole} disabled={saving}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#f43f5e]/20
                    text-[#f43f5e] hover:bg-[#f43f5e]/30 transition-colors">
                  {saving ? <div className="w-3 h-3 border-2 border-[#f43f5e] border-t-transparent rounded-full animate-spin" />
                    : <Check size={12} />}
                </button>
                <button onClick={() => setEditing(false)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center bg-[#1e1e2e]
                    text-[#6b7280] hover:text-white transition-colors">
                  <X size={12} />
                </button>
              </motion.div>
            ) : (
              <motion.div key="show" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                  style={{ background: `${role.color}18`, color: role.color, border: `1px solid ${role.color}30` }}>
                  <role.Icon style={{ width: 11, height: 11, color: role.color }} />
                  {role.label}
                </div>
                {member.phone && (
                  <span className="text-xs text-[#4b5563]">{member.phone}</span>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* last active */}
        <div className="mt-2 text-[10px] text-[#374151]">
          Dernière activité · {timeAgo(member.last_active)}
        </div>
      </div>

      {/* confirm delete overlay */}
      <AnimatePresence>
        {confirmDel && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#0a0a0f]/90 flex flex-col items-center justify-center gap-3 p-4 z-10">
            <div className="w-10 h-10 rounded-full bg-[#f43f5e]/20 flex items-center justify-center">
              <Trash2 size={18} className="text-[#f43f5e]" />
            </div>
            <div className="text-center">
              <div className="text-white text-sm font-semibold">Retirer {member.name} ?</div>
              <div className="text-[#6b7280] text-xs mt-0.5">Cette action est irréversible.</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDel(false)}
                className="px-4 py-1.5 rounded-lg bg-[#1e1e2e] text-[#9ca3af] text-xs
                  hover:bg-[#2e2e4e] transition-colors">
                Annuler
              </button>
              <button onClick={() => { onDelete(member.id); setConfirmDel(false) }}
                className="px-4 py-1.5 rounded-lg bg-[#f43f5e] text-white text-xs
                  hover:bg-[#e11d48] transition-colors font-medium">
                Retirer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Add Modal ────────────────────────────────────────────────────────────────
function AddModal({ onClose, onAdd }: {
  onClose: () => void
  onAdd: (data: { name: string; email: string; phone: string; role: MemberRole }) => Promise<string | null>
}) {
  const [name,  setName]  = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [role,  setRole]  = useState<MemberRole>("sales")
  const [saving, setSaving] = useState(false)
  const [err,   setErr]   = useState("")

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim())  { setErr("Nom requis"); return }
    if (!email.trim()) { setErr("Email requis"); return }
    setSaving(true); setErr("")
    const error = await onAdd({ name, email, phone, role })
    setSaving(false)
    if (error) setErr(error)
    else onClose()
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        className="w-full max-w-md bg-[#111118] border border-[#2e2e3e] rounded-2xl overflow-hidden shadow-2xl">
        {/* header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e1e2e]">
          <div>
            <h3 className="text-white font-bold">Ajouter un employé</h3>
            <p className="text-[#6b7280] text-xs mt-0.5">Une invitation sera envoyée par email</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b7280]
              hover:bg-[#1e1e2e] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* name + email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Nom complet *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Jean Dupont"
                className="w-full bg-[#0d0d14] border border-[#2e2e4e] rounded-xl text-sm text-white
                  px-3 py-2.5 focus:outline-none focus:border-[#f43f5e] placeholder:text-[#374151]" />
            </div>
            <div>
              <label className="text-xs text-[#9ca3af] mb-1 block">Téléphone</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+229 …"
                className="w-full bg-[#0d0d14] border border-[#2e2e4e] rounded-xl text-sm text-white
                  px-3 py-2.5 focus:outline-none focus:border-[#f43f5e] placeholder:text-[#374151]" />
            </div>
          </div>

          <div>
            <label className="text-xs text-[#9ca3af] mb-1 block">Email *</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email"
              placeholder="jean@exemple.com"
              className="w-full bg-[#0d0d14] border border-[#2e2e4e] rounded-xl text-sm text-white
                px-3 py-2.5 focus:outline-none focus:border-[#f43f5e] placeholder:text-[#374151]" />
          </div>

          {/* role grid */}
          <div>
            <label className="text-xs text-[#9ca3af] mb-2 block">Rôle</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_OPTIONS.map(r => {
                const cfg = ROLE_CFG[r]
                const active = role === r
                return (
                  <button key={r} type="button" onClick={() => setRole(r)}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl text-center
                      transition-all border"
                    style={{
                      background:   active ? `${cfg.color}18` : "#0d0d14",
                      borderColor:  active ? `${cfg.color}60` : "#2e2e4e",
                      color:        active ? cfg.color : "#6b7280",
                    }}>
                    <cfg.Icon style={{ width: 18, height: 18, color: active ? cfg.color : "#6b7280" }} />
                    <span className="text-[10px] font-medium leading-tight">{cfg.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {err && (
            <div className="flex items-center gap-2 text-xs text-[#f87171] bg-[#f87171]/10
              border border-[#f87171]/20 rounded-lg px-3 py-2">
              <XCircle size={13} /> {err}
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full py-2.5 rounded-xl font-semibold text-sm text-white flex items-center
              justify-center gap-2 transition-all"
            style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)" }}>
            {saving
              ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><UserPlus size={16} /> Envoyer l'invitation</>}
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EmployeesPage() {
  const supabase = createClient()
  const [vendorName, setVendorName] = useState("Ma Boutique")
  const [members,    setMembers]    = useState<Member[]>([])
  const [kpi,        setKpi]        = useState<KPI>({ total: 0, active: 0, invited: 0, inactive: 0 })
  const [filter,     setFilter]     = useState<FilterTab>("all")
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // vendor name
  useEffect(() => {
    supabase.auth.getUser().then((res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const user = res.data.user
      if (!user) return
      supabase.from("vendors").select("name").eq("user_id", user.id).single()
        .then((r: { data: { name: string } | null }) => { if (r.data) setVendorName(r.data.name) })
    })
  }, [])

  const load = useCallback(async (f: FilterTab = filter) => {
    const res  = await fetch(`/api/vendor/employees?filter=${f}`)
    const json = await res.json() as { members: Member[]; kpi: KPI }
    setMembers(json.members ?? [])
    setKpi(json.kpi ?? { total: 0, active: 0, invited: 0, inactive: 0 })
    setLoading(false)
  }, [filter])

  useEffect(() => { load() }, [filter])

  async function handleAdd(data: { name: string; email: string; phone: string; role: MemberRole }) {
    const res  = await fetch("/api/vendor/employees", { method: "POST",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
    const json = await res.json() as { error?: string }
    if (json.error) return json.error
    await load(filter)
    return null
  }

  async function handleUpdate(id: string, patch: { role?: MemberRole; status?: MemberStatus }) {
    await fetch("/api/vendor/employees", { method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: id, ...patch }) })
    await load(filter)
  }

  async function handleDelete(id: string) {
    await fetch("/api/vendor/employees", { method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: id }) })
    await load(filter)
  }

  const FILTER_TABS: { key: FilterTab; label: string; count: number }[] = [
    { key: "all",      label: "Tous",     count: kpi.total    },
    { key: "active",   label: "Actifs",   count: kpi.active   },
    { key: "invited",  label: "Invités",  count: kpi.invited  },
    { key: "inactive", label: "Inactifs", count: kpi.inactive },
  ]

  const anyChildActive = (item: typeof SIDEBAR_ITEMS[number]) =>
    "children" in item
      ? (item as { children: { label: string; href: string; active?: boolean }[] })
          .children.some((c: { label: string; href: string; active?: boolean }) => c.active)
      : false

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* bg orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {[
          { w: 600, h: 600, x: "10%",  y: "-10%", c: "#f43f5e" },
          { w: 500, h: 500, x: "60%",  y: "40%",  c: "#8b5cf6" },
          { w: 400, h: 400, x: "-5%",  y: "60%",  c: "#3b82f6" },
        ].map((o, i) => (
          <motion.div key={i} className="absolute rounded-full blur-3xl"
            style={{ width: o.w, height: o.h, left: o.x, top: o.y,
              background: `radial-gradient(circle, ${o.c}33, transparent 70%)` }}
            animate={{ opacity: [0.15, 0.3, 0.15], scale: [1, 1.1, 1] }}
            transition={{ duration: 6 + i * 2, repeat: Infinity, ease: "easeInOut" }} />
        ))}
      </div>

      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-[#111118] border-r
        border-[#1e1e2e] relative z-10">
        {/* logo */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-[#1e1e2e]">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black
            bg-gradient-to-br from-blue-500 to-cyan-400 text-white shadow-lg">Q</div>
          <div>
            <div className="text-xs font-bold text-white">QUICKGO</div>
            <div className="text-[9px] text-[#4b5563] font-medium tracking-widest">Vendeur</div>
          </div>
        </div>

        {/* nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {SIDEBAR_ITEMS.map(item => {
            const isActive = item.active || anyChildActive(item)
            return (
              <a key={item.href} href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium
                  transition-all cursor-pointer group
                  ${isActive
                    ? "bg-[#f43f5e]/10 text-[#f43f5e] border border-[#f43f5e]/20"
                    : "text-[#6b7280] hover:bg-[#1e1e2e] hover:text-white border border-transparent"}`}>
                <item.icon size={14} className={isActive ? "text-[#f43f5e]" : "text-[#4b5563] group-hover:text-white"} />
                {item.label}
              </a>
            )
          })}
        </nav>

        {/* bottom banner */}
        <div className="p-3 border-t border-[#1e1e2e]">
          <div className="rounded-xl p-3 text-center space-y-1.5"
            style={{ background: "linear-gradient(135deg, #f43f5e18, #8b5cf618)" }}>
            <div className="flex items-center justify-center gap-1.5">
              <Users2 size={13} className="text-[#f43f5e]" />
              <span className="text-[10px] text-white font-semibold">Votre équipe</span>
              {kpi.active > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#f43f5e]/20 text-[#f43f5e]">
                  {kpi.active}
                </span>
              )}
            </div>
            <p className="text-[9px] text-[#6b7280] leading-tight">
              {kpi.invited > 0 ? `${kpi.invited} invitation${kpi.invited > 1 ? "s" : ""} en attente` : "Gérez vos collaborateurs"}
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Header */}
        <header className="relative overflow-hidden bg-[#111118] border-b border-[#1e1e2e] h-28 shrink-0">
          <div className="absolute inset-0 opacity-25">
            <div className="w-full h-full"
              style={{ background: "linear-gradient(135deg, #f43f5e22, #8b5cf622, transparent)" }} />
          </div>
          <div className="absolute inset-0 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              {/* mobile menu */}
              <button onClick={() => setSidebarOpen(o => !o)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl
                  bg-[#1e1e2e] text-[#9ca3af]">
                <Users2 size={18} />
              </button>
              <motion.div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)" }}
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                <Users2 size={22} className="text-white" />
              </motion.div>
              <div>
                <h1 className="text-2xl font-black bg-gradient-to-r from-[#f43f5e] to-[#fb7185]
                  bg-clip-text text-transparent">
                  Équipe
                </h1>
                <p className="text-xs text-[#6b7280]">Gestion des collaborateurs · {vendorName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button onClick={() => load(filter)}
                whileTap={{ rotate: 360 }} transition={{ duration: 0.5 }}
                className="w-9 h-9 rounded-xl bg-[#1e1e2e] border border-[#2e2e3e] flex items-center
                  justify-center text-[#9ca3af] hover:text-white hover:border-[#f43f5e]/40
                  transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                </svg>
              </motion.button>
              <button onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                  text-white shadow-lg transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)" }}>
                <UserPlus size={15} /> Ajouter
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* KPI */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total équipe"     value={kpi.total}    color="#f43f5e" icon={Users2}       sub="membres actifs + invités" />
            <KpiCard label="Actifs"           value={kpi.active}   color="#22c55e" icon={CheckCircle2} sub="connectés récemment" />
            <KpiCard label="Invitations"      value={kpi.invited}  color="#f59e0b" icon={Clock}        sub="en attente d'acceptation" />
            <KpiCard label="Inactifs"         value={kpi.inactive} color="#6b7280" icon={XCircle}      sub="accès désactivés" />
          </div>

          {/* filter tabs */}
          <div className="flex items-center gap-2 flex-wrap">
            {FILTER_TABS.map(tab => (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium
                  transition-all border ${filter === tab.key
                    ? "bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/30"
                    : "bg-[#111118] text-[#6b7280] border-[#1e1e2e] hover:border-[#2e2e3e] hover:text-white"}`}>
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold
                  ${filter === tab.key ? "bg-[#f43f5e]/20 text-[#f43f5e]" : "bg-[#1e1e2e] text-[#4b5563]"}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-[160px] rounded-xl bg-[#111118] border border-[#1e1e2e]
                  animate-pulse" />
              ))}
            </div>
          ) : members.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "#f43f5e18", border: "1px solid #f43f5e30" }}>
                <Users2 size={28} className="text-[#f43f5e]" />
              </div>
              <p className="text-[#4b5563] font-medium">
                {filter === "all" ? "Aucun employé dans l'équipe" : "Aucun résultat pour ce filtre"}
              </p>
              {filter === "all" && (
                <button onClick={() => setShowModal(true)}
                  className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                    text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #f43f5e, #e11d48)" }}>
                  <UserPlus size={15} /> Ajouter le premier employé
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {members.map(m => (
                  <EmployeeCard key={m.id} member={m}
                    onUpdate={handleUpdate} onDelete={handleDelete} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}

          {/* security note */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-3 p-4 rounded-xl border"
            style={{ background: "#f43f5e08", borderColor: "#f43f5e20" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "#f43f5e18" }}>
              <Shield size={15} className="text-[#f43f5e]" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Gestion des accès</div>
              <div className="text-xs text-[#6b7280] mt-0.5 leading-relaxed">
                Les employés invités reçoivent un email pour créer leur compte. Ils n'ont accès
                qu'aux fonctionnalités correspondant à leur rôle. Le propriétaire peut modifier
                ou révoquer les accès à tout moment.
              </div>
            </div>
          </motion.div>
        </main>
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {showModal && (
          <AddModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
        )}
      </AnimatePresence>
    </div>
  )
}
