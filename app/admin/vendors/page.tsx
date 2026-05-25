"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  Store,
  BarChart3,
  Settings,
  Bell,
  ChevronDown,
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  TrendingUp,
  ShieldCheck,
  MoreVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", href: "/admin" },
  { icon: Package, label: "Commandes", href: "/admin/orders", badge: 48 },
  { icon: Truck, label: "Livreurs", href: "/admin/drivers", badge: 12 },
  { icon: Users, label: "Clients", href: "/admin/users" },
  { icon: Store, label: "Vendeurs", href: "/admin/vendors", active: true },
  { icon: BarChart3, label: "Analyses", href: "/admin/analytics" },
  { icon: Wallet, label: "Finances", href: "/admin/finances" },
  { icon: Settings, label: "Paramètres", href: "/admin/settings" },
]

const vendors = [
  {
    id: "1",
    name: "Apple Store Cameroun",
    category: "Électronique",
    owner: "John Mbarga",
    email: "john@applecm.com",
    phone: "+237 6 95 00 11 22",
    status: "active",
    verified: true,
    rating: 4.8,
    totalOrders: 1240,
    totalRevenue: "45 200 000 CFA",
    commission: "8%",
    joinDate: "Jan 2025",
    city: "Yaoundé",
  },
  {
    id: "2",
    name: "Mode Africaine",
    category: "Mode & Beauté",
    owner: "Aïcha Ndjomo",
    email: "aicha@modeafricaine.cm",
    phone: "+237 6 77 22 33 44",
    status: "active",
    verified: true,
    rating: 4.6,
    totalOrders: 856,
    totalRevenue: "12 800 000 CFA",
    commission: "10%",
    joinDate: "Fév 2025",
    city: "Douala",
  },
  {
    id: "3",
    name: "Pharmacie Plus",
    category: "Pharmacie",
    owner: "Dr. Paul Essama",
    email: "paul@pharmacieplus.cm",
    phone: "+237 6 55 66 77 88",
    status: "active",
    verified: true,
    rating: 4.9,
    totalOrders: 2100,
    totalRevenue: "28 500 000 CFA",
    commission: "5%",
    joinDate: "Nov 2024",
    city: "Yaoundé",
  },
  {
    id: "4",
    name: "SuperMarché Central",
    category: "Supermarché",
    owner: "Marie Atangana",
    email: "marie@supercentral.cm",
    phone: "+237 6 33 44 55 66",
    status: "pending",
    verified: false,
    rating: 0,
    totalOrders: 0,
    totalRevenue: "0 CFA",
    commission: "7%",
    joinDate: "Mai 2025",
    city: "Bafoussam",
  },
  {
    id: "5",
    name: "Tech Galaxy",
    category: "Électronique",
    owner: "Samuel Fotso",
    email: "samuel@techgalaxy.cm",
    phone: "+237 6 11 22 33 44",
    status: "suspended",
    verified: true,
    rating: 3.2,
    totalOrders: 156,
    totalRevenue: "2 100 000 CFA",
    commission: "8%",
    joinDate: "Mar 2025",
    city: "Douala",
  },
]

const statusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Actif", className: "bg-green-500/20 text-green-400" },
  pending: { label: "En attente", className: "bg-yellow-500/20 text-yellow-400" },
  suspended: { label: "Suspendu", className: "bg-red-500/20 text-red-400" },
}

export default function AdminVendorsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = vendors.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.owner.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || v.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const stats = [
    { label: "Vendeurs actifs", value: vendors.filter((v) => v.status === "active").length.toString(), icon: Store, color: "from-quickgo-blue to-quickgo-cyan" },
    { label: "En attente", value: vendors.filter((v) => v.status === "pending").length.toString(), icon: Clock, color: "from-yellow-500 to-orange-500" },
    { label: "Suspendus", value: vendors.filter((v) => v.status === "suspended").length.toString(), icon: XCircle, color: "from-red-500 to-pink-500" },
    { label: "Vérifiés", value: vendors.filter((v) => v.verified).length.toString(), icon: ShieldCheck, color: "from-green-500 to-emerald-500" },
  ]

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/30 bg-card/30">
        <div className="p-6 border-b border-border/30">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <div>
              <span className="text-xl font-bold text-white">QUICK</span>
              <span className="text-xl font-bold text-quickgo-lime">GO</span>
              <p className="text-[10px] text-red-400 uppercase tracking-wider font-semibold">Admin</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active
                  ? "bg-quickgo-blue/20 text-quickgo-blue"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-border/30">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-white font-semibold text-sm">Système OK</p>
                <p className="text-xs text-green-400">Tous services actifs</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Gestion des Vendeurs</h1>
              <p className="text-sm text-muted-foreground">{vendors.length} vendeurs enregistrés</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full">
                <Filter className="w-4 h-4 mr-2" />
                Filtrer
              </Button>
              <Button size="sm" className="rounded-full bg-quickgo-blue hover:bg-quickgo-blue/90">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un vendeur
              </Button>
              <button className="relative p-2 hover:bg-white/5 rounded-full">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="flex items-center gap-2 pl-4 border-l border-border/30">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">AD</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card/50 rounded-2xl p-5 border border-border/30"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un vendeur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-card/50 border-border/30"
              />
            </div>
            <div className="flex items-center gap-2">
              {["all", "active", "pending", "suspended"].map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                  className="rounded-full"
                >
                  {s === "all" ? "Tous" : statusConfig[s]?.label || s}
                </Button>
              ))}
            </div>
          </div>

          {/* Vendors Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border/30 overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left text-xs text-muted-foreground font-medium py-4 px-6">Vendeur</th>
                    <th className="text-left text-xs text-muted-foreground font-medium py-4 px-4">Catégorie</th>
                    <th className="text-left text-xs text-muted-foreground font-medium py-4 px-4">Ville</th>
                    <th className="text-left text-xs text-muted-foreground font-medium py-4 px-4">Commandes</th>
                    <th className="text-left text-xs text-muted-foreground font-medium py-4 px-4">Revenus</th>
                    <th className="text-left text-xs text-muted-foreground font-medium py-4 px-4">Note</th>
                    <th className="text-left text-xs text-muted-foreground font-medium py-4 px-4">Statut</th>
                    <th className="text-left text-xs text-muted-foreground font-medium py-4 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((vendor, i) => (
                    <motion.tr
                      key={vendor.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-border/20 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-quickgo-blue/20 flex items-center justify-center">
                            <Store className="w-5 h-5 text-quickgo-blue" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white font-medium text-sm">{vendor.name}</p>
                              {vendor.verified && (
                                <CheckCircle className="w-4 h-4 text-quickgo-blue" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{vendor.owner}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-muted-foreground">{vendor.category}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-white">{vendor.city}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-white font-medium">{vendor.totalOrders.toLocaleString()}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-quickgo-lime font-semibold">{vendor.totalRevenue}</span>
                      </td>
                      <td className="py-4 px-4">
                        {vendor.rating > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm text-white">{vendor.rating}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[vendor.status]?.className}`}>
                          {statusConfig[vendor.status]?.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                            <MoreVertical className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-12">
                <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun vendeur trouvé</p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}
