"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  LayoutDashboard, Package, Users, Truck, Store, BarChart3,
  Settings, Search, Mail, Phone, MapPin, Calendar, Ban,
  CheckCircle, Eye, Download, UserPlus, ChevronLeft, ChevronRight, Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"

function formatCFA(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M F"
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K F"
  return n + " F"
}

interface UserRow {
  id: string; full_name: string; phone: string; email: string
  role: string; created_at: string; avatar_url: string | null
  orders_count: number; total_spent: number
}

const PAGE_SIZE = 20

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchUsers = useCallback(async (q: string, p: number) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search: q, page: String(p), limit: String(PAGE_SIZE) })
      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data.users)
        setTotal(data.total)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers(search, page) }, [page, fetchUsers])

  const handleSearch = (val: string) => {
    setSearch(val)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(1); fetchUsers(val, 1) }, 350)
  }

  const initials = (name: string) => name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Gestion des Clients</h1>
              <p className="text-sm text-muted-foreground">{total.toLocaleString()} clients enregistrés</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full gap-2">
                <Download className="w-4 h-4" /> Exporter
              </Button>
              <Button size="sm" className="rounded-full bg-quickgo-blue hover:bg-quickgo-blue/90 gap-2">
                <UserPlus className="w-4 h-4" /> Ajouter
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Search */}
          <div className="relative max-w-md mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Rechercher un client..." value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 bg-card/50 border-border/30" />
          </div>

          {/* Table */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border/30 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    {["Client", "Contact", "Commandes", "Dépenses totales", "Inscription", "Actions"].map((h) => (
                      <th key={h} className="text-left text-xs text-muted-foreground font-medium py-4 px-5">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-5 py-3">
                          <div className="h-10 bg-white/5 animate-pulse rounded-xl" />
                        </td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
                        Aucun client trouvé
                      </td>
                    </tr>
                  ) : users.map((user) => (
                    <tr key={user.id} className="border-b border-border/20 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {initials(user.full_name || user.email || "?")}
                          </div>
                          <div>
                            <p className="text-white font-medium text-sm">{user.full_name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {user.phone || "—"}
                        </p>
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-white font-semibold">{user.orders_count}</p>
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-quickgo-lime font-semibold">{formatCFA(user.total_spent)}</p>
                      </td>
                      <td className="py-4 px-5">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(user.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </td>
                      <td className="py-4 px-5">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-border/30">
                <p className="text-sm text-muted-foreground">
                  {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} sur {total.toLocaleString()} clients
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
