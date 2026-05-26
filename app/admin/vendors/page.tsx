"use client"

import { useState } from "react"
import { 
  Store, Search, Filter, MoreVertical, CheckCircle, XCircle, 
  Clock, Star, TrendingUp, Package, Eye, Edit, Trash2, Plus 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const vendors = [
  { id: 1, name: "Super Marche Central", email: "contact@supermarche.cm", status: "active", rating: 4.8, orders: 1234, revenue: 2450000, joined: "2024-01-15" },
  { id: 2, name: "Pharmacie du Soleil", email: "info@pharmasoleil.cm", status: "active", rating: 4.9, orders: 856, revenue: 1890000, joined: "2024-02-20" },
  { id: 3, name: "Restaurant Le Gourmet", email: "legourmet@email.cm", status: "pending", rating: 0, orders: 0, revenue: 0, joined: "2024-05-10" },
  { id: 4, name: "Boutique Mode Africa", email: "mode@africa.cm", status: "active", rating: 4.5, orders: 567, revenue: 980000, joined: "2024-03-05" },
  { id: 5, name: "Tech Store Cameroun", email: "tech@store.cm", status: "suspended", rating: 3.2, orders: 123, revenue: 450000, joined: "2024-01-30" },
]

const stats = [
  { label: "Total Vendeurs", value: "856", icon: Store, color: "text-blue-400", bg: "bg-blue-500/10" },
  { label: "Actifs", value: "743", icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
  { label: "En attente", value: "89", icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  { label: "Suspendus", value: "24", icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
]

export default function AdminVendorsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredVendors = vendors.filter(v => {
    const matchesSearch = v.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || v.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active": return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">Actif</span>
      case "pending": return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400">En attente</span>
      case "suspended": return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">Suspendu</span>
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestion des Vendeurs</h1>
            <p className="text-muted-foreground">Gerez tous les vendeurs de la plateforme</p>
          </div>
          <Button className="bg-quickgo-lime text-black hover:bg-quickgo-lime/90">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un vendeur
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher un vendeur..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Statut: {statusFilter === "all" ? "Tous" : statusFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>Tous</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("active")}>Actifs</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("pending")}>En attente</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("suspended")}>Suspendus</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Vendeur</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Statut</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">Note</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">Commandes</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden xl:table-cell">Revenus</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-muted/30">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-quickgo-blue/20 flex items-center justify-center">
                        <Store className="w-5 h-5 text-quickgo-blue" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{vendor.name}</p>
                        <p className="text-xs text-muted-foreground">{vendor.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">{getStatusBadge(vendor.status)}</td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-foreground">{vendor.rating || "-"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <span className="text-sm text-foreground">{vendor.orders.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-4 hidden xl:table-cell">
                    <span className="text-sm font-medium text-quickgo-lime">{vendor.revenue.toLocaleString()} FCFA</span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Eye className="w-4 h-4 mr-2" /> Voir details</DropdownMenuItem>
                        <DropdownMenuItem><Edit className="w-4 h-4 mr-2" /> Modifier</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400"><Trash2 className="w-4 h-4 mr-2" /> Supprimer</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
