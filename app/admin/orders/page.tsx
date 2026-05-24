"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  BarChart3,
  Settings,
  Search,
  Filter,
  Eye,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  Phone,
  DollarSign,
} from "lucide-react"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", href: "/admin" },
  { icon: Package, label: "Commandes", href: "/admin/orders", active: true },
  { icon: Truck, label: "Livreurs", href: "/admin/drivers" },
  { icon: Users, label: "Clients", href: "/admin/users" },
  { icon: BarChart3, label: "Analyses", href: "/admin/analytics" },
  { icon: Settings, label: "Paramètres", href: "/admin/settings" },
]

const orders = [
  {
    id: "QG-78542",
    customer: "Marie Claire Ngo",
    phone: "+237 690 123 456",
    pickup: "Restaurant Le Gourmet, Bastos",
    delivery: "Residence Les Palmiers, Nlongkak",
    driver: "Emmanuel K.",
    status: "delivering",
    amount: "15 500 CFA",
    time: "Il y a 5 min",
    eta: "12 min"
  },
  {
    id: "QG-78541",
    customer: "Samuel Djomou",
    phone: "+237 699 456 789",
    pickup: "Pharmacie du Centre",
    delivery: "Quartier Essos, Yaoundé",
    driver: "Jean Paul N.",
    status: "picked",
    amount: "8 200 CFA",
    time: "Il y a 12 min",
    eta: "18 min"
  },
  {
    id: "QG-78540",
    customer: "Patricia Ndam",
    phone: "+237 655 345 678",
    pickup: "Supermarche Santa Lucia",
    delivery: "Bonapriso, Douala",
    driver: "Christian B.",
    status: "pending",
    amount: "45 000 CFA",
    time: "Il y a 15 min",
    eta: "En attente"
  },
  {
    id: "QG-78539",
    customer: "Jean Pierre Fouda",
    phone: "+237 691 678 901",
    pickup: "Boutique Mode Elegance",
    delivery: "Akwa, Douala",
    driver: "Steve M.",
    status: "delivered",
    amount: "22 800 CFA",
    time: "Il y a 25 min",
    eta: "Livre"
  },
  {
    id: "QG-78538",
    customer: "Celine Mbarga",
    phone: "+237 670 567 890",
    pickup: "Restaurant Chez Mama",
    delivery: "Mvog-Ada, Yaoundé",
    driver: "-",
    status: "cancelled",
    amount: "12 000 CFA",
    time: "Il y a 30 min",
    eta: "Annule"
  },
]

const statusConfig = {
  pending: { label: "En attente", color: "bg-yellow-500/20 text-yellow-400", icon: Clock },
  picked: { label: "Recupere", color: "bg-blue-500/20 text-blue-400", icon: Package },
  delivering: { label: "En livraison", color: "bg-primary/20 text-primary", icon: Truck },
  delivered: { label: "Livre", color: "bg-green-500/20 text-green-400", icon: CheckCircle },
  cancelled: { label: "Annule", color: "bg-red-500/20 text-red-400", icon: XCircle },
}

export default function AdminOrdersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 lg:pt-24">
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 min-h-[calc(100vh-6rem)] border-r border-border/50 p-6">
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <LayoutDashboard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Admin Panel</p>
                  <p className="text-xs text-muted-foreground">QuickGo</p>
                </div>
              </div>
            </div>
            
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    item.active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
          
          {/* Main Content */}
          <div className="flex-1 p-6 lg:p-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
            >
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
                  Gestion des Commandes
                </h1>
                <p className="text-muted-foreground">
                  Suivi en temps reel de toutes les commandes
                </p>
              </div>
              <div className="flex items-center gap-3 mt-4 sm:mt-0">
                <Button variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Actualiser
                </Button>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exporter
                </Button>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6"
            >
              <div className="p-4 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-yellow-500/20">
                    <Clock className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">24</p>
                    <p className="text-xs text-muted-foreground">En attente</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/20">
                    <Package className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">18</p>
                    <p className="text-xs text-muted-foreground">Recuperes</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/20">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">156</p>
                    <p className="text-xs text-muted-foreground">En livraison</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-500/20">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">2 847</p>
                    <p className="text-xs text-muted-foreground">Livrees</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-500/20">
                    <XCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground">12</p>
                    <p className="text-xs text-muted-foreground">Annulees</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex flex-col sm:flex-row gap-4 mb-6"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par ID ou client..."
                  className="pl-10 bg-card border-border/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {["all", "pending", "picked", "delivering", "delivered", "cancelled"].map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus(status)}
                  >
                    {status === "all" ? "Tous" : statusConfig[status as keyof typeof statusConfig]?.label}
                  </Button>
                ))}
              </div>
            </motion.div>

            {/* Orders List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {filteredOrders.map((order) => {
                const StatusIcon = statusConfig[order.status as keyof typeof statusConfig]?.icon || AlertCircle
                return (
                  <div
                    key={order.id}
                    className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-lg font-bold text-primary">#{order.id}</span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                            statusConfig[order.status as keyof typeof statusConfig]?.color
                          }`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig[order.status as keyof typeof statusConfig]?.label}
                          </span>
                          <span className="text-xs text-muted-foreground">{order.time}</span>
                        </div>
                        
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Client</p>
                            <p className="font-medium text-foreground">{order.customer}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Phone className="h-3 w-3" />
                              {order.phone}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Livreur</p>
                            <p className="font-medium text-foreground">{order.driver}</p>
                          </div>
                        </div>
                      </div>

                      {/* Route Info */}
                      <div className="flex-1">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Pickup</p>
                              <p className="text-sm text-foreground">{order.pickup}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-muted-foreground">Livraison</p>
                              <p className="text-sm text-foreground">{order.delivery}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Amount & Actions */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{order.amount}</p>
                          <p className="text-xs text-muted-foreground">ETA: {order.eta}</p>
                        </div>
                        <Button variant="outline" size="icon" className="h-10 w-10">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </motion.div>

            {/* Pagination */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex items-center justify-between mt-6"
            >
              <p className="text-sm text-muted-foreground">
                Affichage 1-5 sur 3 057 commandes
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 min-w-8">1</Button>
                <Button variant="ghost" size="sm" className="h-8 min-w-8">2</Button>
                <Button variant="ghost" size="sm" className="h-8 min-w-8">3</Button>
                <span className="text-muted-foreground">...</span>
                <Button variant="ghost" size="sm" className="h-8 min-w-8">612</Button>
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  )
}
