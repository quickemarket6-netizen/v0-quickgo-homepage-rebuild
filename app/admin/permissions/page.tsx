"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Lock, ArrowLeft, RefreshCw, Plus, Search,
  ShieldCheck, Shield, User, Users, CheckCircle2,
  AlertCircle, ChevronRight, Clock, Star, Eye, Edit3,
  TrendingUp, KeyRound,
} from "lucide-react"
import Link from "next/link"

// ─── types ───────────────────────────────────────────────────────────────────
interface Role { id: string; name: string; slug: string; color: string; users_count: number; description: string; permissions: string[]; created_at: string }
interface AdminUser { id: string; name: string; email: string; role: string; status: string; last_active: string; avatar: string; two_fa: boolean }
interface Permission { key: string; label: string; module: string }
interface Kpi { total_users: number; active_users: number; total_roles: number; two_fa_enabled: number; two_fa_rate: number; admin_count: number }
interface PageData { kpi: Kpi; roles: Role[]; users: AdminUser[]; permissions: Permission[] }

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtRelative(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (m < 1) return "en ligne"
  if (m < 60) return `il y a ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `il y a ${h}h`
  return `il y a ${Math.floor(h / 24)}j`
}

function CountUp({ target }: { target: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const steps = 40; let i = 0
    const iv = setInterval(() => {
      i++; setVal(Math.round(target * i / steps))
      if (i >= steps) clearInterval(iv)
    }, 800 / steps)
    return () => clearInterval(iv)
  }, [target])
  return <>{val}</>
}

function KpiCard({ label, value, sub, subUp, icon: Icon, iconColor, delay, suffix = "" }:
  { label: string; value: number; sub?: string; subUp?: boolean; icon: typeof Lock; iconColor: string; delay: number; suffix?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-[#6b6b8a] uppercase tracking-wider font-medium">{label}</span>
          <span className="text-2xl font-bold text-white leading-none"><CountUp target={value} />{suffix}</span>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}20` }}>
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
      </div>
      {sub && (
        <div className={`flex items-center gap-1 text-[12px] font-medium ${subUp ? "text-green-400" : "text-[#6b6b8a]"}`}>
          {subUp && <TrendingUp className="w-3.5 h-3.5" />}
          {sub}
        </div>
      )}
    </motion.div>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────
export default function PermissionsPage() {
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<"roles" | "users" | "matrix">("roles")
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [lastUpdated, setLastUpdated] = useState(new Date())

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    const res = await fetch("/api/admin/permissions")
    const json: PageData = await res.json()
    setData(json)
    setLastUpdated(new Date())
    if (isRefresh) setTimeout(() => setRefreshing(false), 600)
    else setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
        <Lock className="w-10 h-10 text-purple-400" />
      </motion.div>
    </div>
  )

  const kpi = data!.kpi
  const roles = data!.roles
  const users = data!.users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))

  const filterKey = `${activeTab}-${selectedRole}-${search}`

  const roleMap = Object.fromEntries(roles.map(r => [r.slug, r]))

  // Permission matrix: group by module
  const modules = [...new Set(data!.permissions.map(p => p.module))]

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur border-b border-[#1e1e2e] px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-xl hover:bg-[#1e1e2e] transition-colors">
            <ArrowLeft className="w-4 h-4 text-[#6b6b8a]" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white leading-none">Permissions & Rôles</h1>
              <p className="text-[11px] text-[#6b6b8a] mt-0.5">
                Mis à jour {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => load(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#16161f] border border-[#1e1e2e] text-[#6b6b8a] hover:text-white transition-colors text-[12px]">
              <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}>
                <RefreshCw className="w-3.5 h-3.5" />
              </motion.div>
              Actualiser
            </motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[12px] font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Nouveau rôle
            </motion.button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Utilisateurs"     value={kpi.total_users}    sub="Comptes admin"         icon={Users}       iconColor="#3b82f6" delay={0}    />
          <KpiCard label="Actifs"           value={kpi.active_users}   sub="Connectés récemment"   icon={User}        iconColor="#22c55e" delay={0.07} />
          <KpiCard label="Rôles définis"    value={kpi.total_roles}    sub="Niveaux d'accès"       icon={Shield}      iconColor="#8b5cf6" delay={0.14} />
          <KpiCard label="2FA activé"       value={kpi.two_fa_enabled} sub="Sécurité renforcée"    icon={ShieldCheck} iconColor="#22c55e" delay={0.21} />
          <KpiCard label="Taux 2FA"         value={kpi.two_fa_rate}    sub="Des comptes"     subUp icon={KeyRound}   iconColor="#f97316" delay={0.28} suffix="%" />
          <KpiCard label="Admins"           value={kpi.admin_count}    sub="Avec accès étendu"     icon={Star}        iconColor="#ef4444" delay={0.35} />
        </div>

        {/* main content */}
        <div className="grid grid-cols-5 gap-6">
          {/* left panel – 3/5 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="col-span-3 bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
          >
            {/* tabs */}
            <div className="p-4 border-b border-[#1e1e2e] space-y-3">
              <div className="flex items-center gap-2">
                {(["roles","users","matrix"] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${activeTab === tab ? "bg-purple-600 text-white" : "text-[#6b6b8a] hover:text-white hover:bg-[#1e1e2e]"}`}>
                    {tab === "roles" ? "Rôles" : tab === "users" ? "Utilisateurs" : "Matrice"}
                  </button>
                ))}
              </div>
              {activeTab === "users" && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b6b8a]" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher un utilisateur..."
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white placeholder-[#6b6b8a] outline-none focus:border-purple-500/50" />
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 520 }}>
              <AnimatePresence mode="wait">
                <motion.div key={filterKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>

                  {activeTab === "roles" && (
                    <div className="divide-y divide-[#1e1e2e]">
                      {roles.map((role, i) => (
                        <motion.div key={role.id}
                          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.06 }}
                          className={`px-4 py-4 cursor-pointer hover:bg-[#1e1e2e]/50 transition-colors ${selectedRole === role.id ? "bg-purple-500/5 border-l-2 border-purple-500" : ""}`}
                          onClick={() => setSelectedRole(selectedRole === role.id ? null : role.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${role.color}20` }}>
                              <Shield className="w-5 h-5" style={{ color: role.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[14px] font-bold text-white">{role.name}</span>
                                <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold" style={{ background: `${role.color}20`, color: role.color }}>
                                  {role.users_count} utilisateur{role.users_count > 1 ? "s" : ""}
                                </span>
                              </div>
                              <p className="text-[12px] text-[#6b6b8a] mt-0.5">{role.description}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {role.permissions.slice(0, 5).map(p => (
                                  <span key={p} className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#1e1e2e] text-[#6b6b8a] font-mono">{p === "*" ? "Tous droits" : p}</span>
                                ))}
                                {role.permissions.length > 5 && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#1e1e2e] text-[#4a4a6a]">+{role.permissions.length - 5}</span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className={`w-4 h-4 text-[#6b6b8a] shrink-0 mt-1 transition-transform ${selectedRole === role.id ? "rotate-90" : ""}`} />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {activeTab === "users" && (
                    <div className="divide-y divide-[#1e1e2e]">
                      {users.map((user, i) => {
                        const role = roleMap[user.role]
                        return (
                          <motion.div key={user.id}
                            initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[#1e1e2e]/40 transition-colors"
                          >
                            <div className="relative shrink-0">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-600/30 border border-[#1e1e2e] flex items-center justify-center">
                                <span className="text-[11px] font-bold text-white">{user.avatar}</span>
                              </div>
                              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#16161f] ${user.status === "active" ? "bg-green-400" : "bg-[#6b6b8a]"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[13px] font-semibold text-white">{user.name}</span>
                                {user.two_fa && <ShieldCheck className="w-3.5 h-3.5 text-green-400" />}
                                {!user.two_fa && <AlertCircle className="w-3.5 h-3.5 text-amber-400" />}
                              </div>
                              <p className="text-[11px] text-[#6b6b8a]">{user.email}</p>
                              <p className="text-[10px] text-[#4a4a6a]">Actif {fmtRelative(user.last_active)}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: role ? `${role.color}20` : "#1e1e2e", color: role?.color ?? "#6b6b8a" }}>
                                {role?.name ?? user.role}
                              </span>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}

                  {activeTab === "matrix" && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="border-b border-[#1e1e2e]">
                            <th className="text-left text-[#6b6b8a] font-medium px-4 py-3 sticky left-0 bg-[#16161f]">Permission</th>
                            {roles.map(r => (
                              <th key={r.id} className="text-center px-2 py-3 min-w-[72px]">
                                <span className="text-[10px] font-semibold" style={{ color: r.color }}>{r.name.split(" ")[0]}</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {modules.map(mod => (
                            <>
                              <tr key={`mod-${mod}`} className="border-t border-[#1e1e2e]">
                                <td colSpan={roles.length + 1} className="px-4 py-2 bg-[#0a0a0f]">
                                  <span className="text-[10px] font-bold text-[#4a4a6a] uppercase tracking-wider">{mod}</span>
                                </td>
                              </tr>
                              {data!.permissions.filter(p => p.module === mod).map((perm, pi) => (
                                <motion.tr key={perm.key}
                                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                  transition={{ duration: 0.2, delay: pi * 0.02 }}
                                  className="border-b border-[#1e1e2e]/50 last:border-0 hover:bg-[#1e1e2e]/30 transition-colors"
                                >
                                  <td className="px-4 py-2.5 sticky left-0 bg-[#16161f]">
                                    <span className="text-[#aaaacc]">{perm.label}</span>
                                  </td>
                                  {roles.map(role => {
                                    const has = role.permissions.includes("*") || role.permissions.includes(perm.key)
                                    return (
                                      <td key={role.id} className="text-center px-2 py-2.5">
                                        {has
                                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 mx-auto" />
                                          : <span className="w-3.5 h-3.5 block mx-auto rounded-full bg-[#1e1e2e]" />}
                                      </td>
                                    )
                                  })}
                                </motion.tr>
                              ))}
                            </>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* right panel – 2/5 */}
          <div className="col-span-2 flex flex-col gap-4">
            {/* roles summary */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.49, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                Répartition des rôles
              </h3>
              <div className="space-y-3">
                {roles.map((role, i) => (
                  <motion.div key={role.id}
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.52 + i * 0.07 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-[#6b6b8a] flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: role.color }} />
                        {role.name}
                      </span>
                      <span className="text-[12px] font-semibold text-white">{role.users_count}</span>
                    </div>
                    <div className="h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(role.users_count / kpi.total_users) * 100}%` }}
                        transition={{ duration: 0.7, delay: 0.55 + i * 0.08 }}
                        className="h-full rounded-full" style={{ background: role.color }} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* security status */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.56, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-400" />
                Statut sécurité
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#0a0a0f] rounded-xl">
                  <span className="text-[12px] text-[#6b6b8a]">2FA activé</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${kpi.two_fa_rate}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full bg-green-500" />
                    </div>
                    <span className="text-[12px] font-bold text-green-400">{kpi.two_fa_rate}%</span>
                  </div>
                </div>
                {data!.users.filter(u => !u.two_fa && u.status === "active").map((u, i) => (
                  <motion.div key={u.id}
                    initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.6 + i * 0.07 }}
                    className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-white">{u.name}</p>
                      <p className="text-[10px] text-[#6b6b8a]">2FA non activé</p>
                    </div>
                    <span className="text-[10px] text-amber-400">Risque</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* recent users */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.63, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                Récemment actifs
              </h3>
              <div className="space-y-2.5">
                {data!.users.sort((a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime()).slice(0, 6).map((u, i) => {
                  const role = roleMap[u.role]
                  return (
                    <motion.div key={u.id}
                      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.65 + i * 0.06 }}
                      className="flex items-center gap-2"
                    >
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-600/20 border border-[#1e1e2e] flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">{u.avatar}</span>
                        </div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-[#16161f] ${u.status === "active" ? "bg-green-400" : "bg-[#6b6b8a]"}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-white truncate">{u.name}</p>
                        <p className="text-[10px] text-[#4a4a6a]">{fmtRelative(u.last_active)}</p>
                      </div>
                      <span className="text-[10px] shrink-0" style={{ color: role?.color ?? "#6b6b8a" }}>
                        {role?.name.split(" ")[0] ?? u.role}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
