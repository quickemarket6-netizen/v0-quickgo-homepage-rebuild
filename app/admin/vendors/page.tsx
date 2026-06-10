"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  LayoutDashboard, Package, Users, Truck, Store, BarChart3,
  Settings, Search, CheckCircle, XCircle, Clock, Eye, Edit2,
  ChevronLeft, ChevronRight, Plus, ShieldCheck, Wallet,
  UserCheck, UserX, Ban,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active:    { label: "Actif",       className: "bg-green-500/20 text-green-400" },
  pending:   { label: "En attente",  className: "bg-yellow-500/20 text-yellow-400" },
  suspended: { label: "Suspendu",    className: "bg-red-500/20 text-red-400" },
}

function formatCFA(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M F"
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K F"
  return n + " F"
}

interface VendorRow {
  id: string
  name: string
  category: string | null
  city: string | null
  status: string
  is_verified: boolean
  commission_rate: number | null
  created_at: string
  total_orders: number
  owner: { full_name: string; phone: string; email: string } | null
  wallet: { available_balance: number; total_earned: number } | null
}

const PAGE_SIZE = 20

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<VendorRow[]>([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchVendors = useCallback(async (q: string, status: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search: q, status, page: String(p), limit: String(PAGE_SIZE) })
      const res = await fetch(`/api/admin/vendors?${params}`)
      if (res.ok) {
        const data = await res.json()
        setVendors(data.vendors)
        setTotal(data.total)
        setSummary(data.summary ?? {})
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchVendors(search, statusFilter, page) }, [statusFilter, page, fetchVendors])

  const handleSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(1); fetchVendors(val, statusFilter, 1) }, 350)
  }

  const patchVendor = async (id: string, updates: Record<string, unknown>) => {
    const res = await fetch("/api/admin/vendors", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    })
    if (res.ok) fetchVendors(search, statusFilter, page)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const statsCards = [
    { key: "active",    label: "Actifs",      icon: Store,       color: "from-quickgo-blue to-quickgo-cyan" },
    { key: "pending",   label: "En attente",  icon: Clock,       color: "from-yellow-500 to-orange-500" },
    { key: "suspended", label: "Suspendus",   icon: XCircle,     color: "from-red-500 to-pink-500" },
    { key: "verified",  label: "Vérifiés",    icon: ShieldCheck, color: "from-green-500 to-emerald-500" },
  ]

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Gestion des Vendeurs</h1>
              <p className="text-sm text-muted-foreground">{total.toLocaleString()} vendeurs enregistrés</p>
            </div>
            <div className="flex items-center gap-3">
              <Button size="sm" className="rounded-full bg-quickgo-blue hover:bg-quickgo-blue/90 gap-2">
                <Plus className="w-4 h-4" /> Ajouter un vendeur
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statsCards.map(({ key, label, icon: Icon, color }, i) => (
              <motion.div key={key}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card/50 rounded-2xl p-5 border border-border/30"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{loading ? "—" : (summary[key] ?? 0)}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher un vendeur..." value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-card/50 border-border/30" />
            </div>
            <div className="flex items-center gap-2">
              {["all", "active", "pending", "suspended"].map((s) => (
                <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"}
                  onClick={() => { setStatusFilter(s); setPage(1) }} className="rounded-full">
                  {s === "all" ? "Tous" : STATUS_CONFIG[s]?.label ?? s}
                </Button>
              ))}
            </div>
          </div>

          {/* Table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border/30 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    {["Vendeur", "Catégorie", "Ville", "Commandes", "Solde wallet", "Commission", "Statut", "Actions"].map((h) => (
                      <th key={h} className="text-left text-xs text-muted-foreground font-medium py-4 px-4 first:px-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={8} className="px-6 py-3">
                          <div className="h-10 bg-white/5 animate-pulse rounded-xl" />
                        </td>
                      </tr>
                    ))
                  ) : vendors.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-muted-foreground">
                        <Store className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        Aucun vendeur trouvé
                      </td>
                    </tr>
                  ) : vendors.map((vendor) => {
                    const ownerName = (vendor.owner as { full_name?: string } | null)?.full_name ?? "—"
                    const balance = (vendor.wallet as { available_balance?: number } | null)?.available_balance ?? 0
                    return (
                      <tr key={vendor.id} className="border-b border-border/20 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-quickgo-blue/20 flex items-center justify-center shrink-0">
                              <Store className="w-5 h-5 text-quickgo-blue" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-white font-medium text-sm">{vendor.name}</p>
                                {vendor.is_verified && <CheckCircle className="w-3.5 h-3.5 text-quickgo-blue" />}
                              </div>
                              <p className="text-xs text-muted-foreground">{ownerName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-muted-foreground">{vendor.category ?? "—"}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-white">{vendor.city ?? "—"}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-white font-medium">{vendor.total_orders.toLocaleString()}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-quickgo-lime font-semibold">{formatCFA(balance)}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-sm text-muted-foreground">
                            {vendor.commission_rate != null ? `${vendor.commission_rate}%` : "—"}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[vendor.status]?.className ?? ""}`}>
                            {STATUS_CONFIG[vendor.status]?.label ?? vendor.status}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1">
                            {vendor.status === "pending" && (
                              <button
                                title="Approuver"
                                onClick={() => patchVendor(vendor.id, { status: "active", is_verified: true })}
                                className="p-1.5 hover:bg-green-500/20 rounded-lg transition-colors"
                              >
                                <UserCheck className="w-4 h-4 text-green-400" />
                              </button>
                            )}
                            {vendor.status === "pending" && (
                              <button
                                title="Rejeter"
                                onClick={() => patchVendor(vendor.id, { status: "suspended" })}
                                className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                              >
                                <UserX className="w-4 h-4 text-red-400" />
                              </button>
                            )}
                            {vendor.status === "active" && (
                              <button
                                title="Suspendre"
                                onClick={() => patchVendor(vendor.id, { status: "suspended" })}
                                className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                              >
                                <Ban className="w-4 h-4 text-red-400" />
                              </button>
                            )}
                            {vendor.status === "suspended" && (
                              <button
                                title="Réactiver"
                                onClick={() => patchVendor(vendor.id, { status: "active" })}
                                className="p-1.5 hover:bg-green-500/20 rounded-lg transition-colors"
                              >
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              </button>
                            )}
                            <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border/30">
                <p className="text-sm text-muted-foreground">
                  {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} sur {total.toLocaleString()} vendeurs
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {[...Array(Math.min(3, totalPages))].map((_, i) => {
                    const p = page <= 2 ? i + 1 : page - 1 + i
                    if (p > totalPages) return null
                    return <Button key={p} variant={p === page ? "default" : "outline"} size="sm" className="h-8 min-w-8" onClick={() => setPage(p)}>{p}</Button>
                  })}
                  {totalPages > 3 && <span className="text-muted-foreground">...</span>}
                  {totalPages > 3 && (
                    <Button variant="ghost" size="sm" className="h-8 min-w-8" onClick={() => setPage(totalPages)}>{totalPages}</Button>
                  )}
                  <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
