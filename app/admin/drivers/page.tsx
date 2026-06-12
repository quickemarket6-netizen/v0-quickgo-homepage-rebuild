"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import {
  Truck, Search, Star, Phone, CheckCircle, Clock, Ban,
  Eye, ChevronLeft, ChevronRight, Download, UserPlus, Bike, Car,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"
import { toast } from "sonner"

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  online:     { label: "En ligne",   dot: "bg-green-500" },
  delivering: { label: "En course",  dot: "bg-blue-500" },
  offline:    { label: "Hors ligne", dot: "bg-gray-500" },
  suspended:  { label: "Suspendu",   dot: "bg-red-500" },
}

function formatCFA(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M F"
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K F"
  return n + " F"
}

interface DriverRow {
  id: string
  status: string
  vehicle_type: string | null
  rating: number | null
  total_deliveries: number
  total_earnings: number
  city: string | null
  created_at: string
  user: { id: string; full_name: string; phone: string; email: string; avatar_url: string | null } | null
}

const PAGE_SIZE = 20

export default function AdminDriversPage() {
  const [drivers, setDrivers] = useState<DriverRow[]>([])
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchDrivers = useCallback(async (q: string, status: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search: q, status, page: String(p), limit: String(PAGE_SIZE) })
      const res = await fetch(`/api/admin/drivers?${params}`)
      if (res.ok) {
        const data = await res.json()
        setDrivers(data.drivers)
        setTotal(data.total)
        setSummary(data.summary ?? {})
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchDrivers(search, statusFilter, page) }, [statusFilter, page, fetchDrivers])

  const handleSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(1); fetchDrivers(val, statusFilter, 1) }, 350)
  }

  const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const handleExport = () => {
    if (drivers.length === 0) { toast.error("Aucune donnée à exporter"); return }
    const header = ["Nom", "Email", "Téléphone", "Statut", "Véhicule", "Note", "Livraisons", "Gains", "Ville", "Inscription"]
    const rows = drivers.map((d) => [
      d.user?.full_name ?? "", d.user?.email ?? "", d.user?.phone ?? "",
      STATUS_CONFIG[d.status]?.label ?? d.status, d.vehicle_type ?? "",
      d.rating != null ? String(d.rating) : "", String(d.total_deliveries),
      String(d.total_earnings), d.city ?? "",
      new Date(d.created_at).toLocaleDateString("fr-FR"),
    ])
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
      .join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `livreurs-quickgo-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({ email: "", vehicle_type: "moto", city: "" })
  const [adding, setAdding] = useState(false)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    try {
      const res = await fetch("/api/admin/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success("Livreur ajouté avec succès")
        setShowAddModal(false)
        setAddForm({ email: "", vehicle_type: "moto", city: "" })
        fetchDrivers(search, statusFilter, page)
      } else {
        toast.error(data.error ?? "Erreur lors de l'ajout")
      }
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setAdding(false)
    }
  }

  const summaryCards = [
    { key: "online",     label: "En ligne",   icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/20" },
    { key: "delivering", label: "En course",  icon: Truck,       color: "text-blue-400",  bg: "bg-blue-500/20" },
    { key: "offline",    label: "Hors ligne", icon: Clock,       color: "text-gray-400",  bg: "bg-gray-500/20" },
    { key: "suspended",  label: "Suspendus",  icon: Ban,         color: "text-red-400",   bg: "bg-red-500/20" },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#1e1e2e] px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Gestion des Livreurs</h1>
              <p className="text-sm text-muted-foreground">{total.toLocaleString()} livreurs enregistrés</p>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={handleExport} variant="outline" size="sm" className="rounded-full gap-2">
                <Download className="w-4 h-4" /> Exporter
              </Button>
              <Button onClick={() => setShowAddModal(true)} size="sm" className="rounded-full bg-quickgo-blue hover:bg-quickgo-blue/90 gap-2">
                <UserPlus className="w-4 h-4" /> Ajouter
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {summaryCards.map(({ key, label, icon: Icon, color, bg }) => (
              <button key={key} onClick={() => { setStatusFilter(key); setPage(1) }}
                className={`p-4 rounded-2xl border transition-all text-left ${
                  statusFilter === key ? "border-quickgo-blue bg-quickgo-blue/10" : "bg-card/50 border-border/30 hover:border-border/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${bg}`}>
                    <Icon className={`h-5 w-5 ${color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{loading ? "—" : (summary[key] ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Rechercher un livreur..." value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 bg-card/50 border-border/30" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", ...Object.keys(STATUS_CONFIG)].map((s) => (
                <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"}
                  onClick={() => { setStatusFilter(s); setPage(1) }} className="rounded-full">
                  {s === "all" ? "Tous" : STATUS_CONFIG[s]?.label ?? s}
                </Button>
              ))}
            </div>
          </div>

          {/* Drivers Grid */}
          {loading ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-card/30 animate-pulse" />
              ))}
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-16">
              <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun livreur trouvé</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="grid md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {drivers.map((driver) => {
                const name = (driver.user as { full_name?: string } | null)?.full_name ?? "—"
                const phone = (driver.user as { phone?: string } | null)?.phone ?? "—"
                const email = (driver.user as { email?: string } | null)?.email ?? "—"
                const statusDot = STATUS_CONFIG[driver.status]?.dot ?? "bg-gray-500"
                const VehicleIcon = driver.vehicle_type === "voiture" ? Car : Bike
                return (
                  <div key={driver.id}
                    className="p-6 rounded-2xl bg-card/50 border border-border/30 hover:border-quickgo-blue/30 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center text-white font-bold text-lg">
                            {initials(name)}
                          </div>
                          <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${statusDot}`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm">{name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-quickgo-blue/20 text-quickgo-blue flex items-center gap-1">
                              <VehicleIcon className="h-3 w-3" />
                              {driver.vehicle_type ?? "—"}
                            </span>
                          </div>
                        </div>
                      </div>
                      {driver.rating != null && (
                        <div className="flex items-center gap-1 text-yellow-400">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm font-bold">{driver.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    {/* Contact */}
                    <div className="space-y-1.5 mb-4 text-sm">
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {phone}
                      </p>
                      {driver.city && (
                        <p className="text-xs text-muted-foreground">{driver.city}</p>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-white/5 text-center">
                        <p className="text-lg font-bold text-white">{driver.total_deliveries.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Livraisons</p>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 text-center">
                        <p className="text-lg font-bold text-quickgo-lime">{formatCFA(driver.total_earnings)}</p>
                        <p className="text-xs text-muted-foreground">Revenus</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1">
                        <Eye className="h-3.5 w-3.5" /> Voir
                      </Button>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                        driver.status === "online" ? "bg-green-500/20 text-green-400" :
                        driver.status === "delivering" ? "bg-blue-500/20 text-blue-400" :
                        driver.status === "suspended" ? "bg-red-500/20 text-red-400" :
                        "bg-gray-500/20 text-gray-400"
                      }`}>
                        {STATUS_CONFIG[driver.status]?.label ?? driver.status}
                      </span>
                    </div>
                  </div>
                )
              })}
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} sur {total.toLocaleString()} livreurs
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
        </div>
      </main>

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-[#16161f] border border-[#1e1e2e] rounded-3xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-1">Nouveau livreur</h3>
            <p className="text-sm text-muted-foreground mb-4">
              L&apos;utilisateur doit déjà avoir un compte QuickGo.
            </p>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Email du compte *</label>
                <Input type="email" value={addForm.email} required
                  onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="livreur@email.com" className="bg-[#0a0a0f] border-[#1e1e2e]" />
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Type de véhicule</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "moto", label: "Moto", icon: Bike },
                    { id: "voiture", label: "Voiture", icon: Car },
                  ].map((v) => (
                    <button key={v.id} type="button"
                      onClick={() => setAddForm((f) => ({ ...f, vehicle_type: v.id }))}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl border transition-colors ${
                        addForm.vehicle_type === v.id
                          ? "border-quickgo-blue bg-quickgo-blue/10 text-quickgo-blue"
                          : "border-[#1e1e2e] text-muted-foreground hover:border-quickgo-blue/40"
                      }`}>
                      <v.icon className="w-4 h-4" /> {v.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Ville</label>
                <Input value={addForm.city}
                  onChange={(e) => setAddForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="Yaoundé" className="bg-[#0a0a0f] border-[#1e1e2e]" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={adding} className="flex-1 bg-quickgo-blue hover:bg-quickgo-blue/90">
                  {adding ? "Ajout…" : "Ajouter"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
