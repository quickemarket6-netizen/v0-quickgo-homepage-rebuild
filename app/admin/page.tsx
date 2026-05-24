"use client"

import { useState } from "react"
import Image from "next/image"
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  MapPin,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  MoreVertical,
  Activity,
  Zap,
  Target,
  Globe,
  ShieldCheck,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", href: "/admin", active: true },
  { icon: Package, label: "Commandes", href: "/admin/orders", badge: 48 },
  { icon: Truck, label: "Livreurs", href: "/admin/drivers", badge: 12 },
  { icon: Users, label: "Clients", href: "/admin/users" },
  { icon: Store, label: "Vendeurs", href: "/admin/vendors" },
  { icon: BarChart3, label: "Analyses", href: "/admin/analytics" },
  { icon: Wallet, label: "Finances", href: "/admin/finances" },
  { icon: Settings, label: "Parametres", href: "/admin/settings" },
]

const stats = [
  { 
    label: "Chiffre d'affaires", 
    value: "12.5M CFA", 
    change: "+23%", 
    trend: "up",
    icon: DollarSign,
    color: "from-green-500 to-emerald-500"
  },
  { 
    label: "Commandes actives", 
    value: "1 248", 
    change: "+12%", 
    trend: "up",
    icon: Package,
    color: "from-quickgo-blue to-quickgo-cyan"
  },
  { 
    label: "Livreurs en ligne", 
    value: "356", 
    change: "+18%", 
    trend: "up",
    icon: Truck,
    color: "from-purple-500 to-pink-500"
  },
  { 
    label: "Temps moyen", 
    value: "27 min", 
    change: "-8%", 
    trend: "up",
    icon: Clock,
    color: "from-orange-500 to-red-500"
  },
]

const liveOrders = [
  { id: "#QG-4567", customer: "Marie Claire", driver: "Emmanuel K.", status: "En attente", location: "Bastos", time: "2 min", amount: "15 500 CFA" },
  { id: "#QG-4568", customer: "Samuel D.", driver: "Pierre M.", status: "En route", location: "Mvog-Ada", time: "5 min", amount: "8 200 CFA" },
  { id: "#QG-4569", customer: "Patricia N.", driver: "Jean P.", status: "En route", location: "Essos", time: "8 min", amount: "22 000 CFA" },
  { id: "#QG-4570", customer: "David K.", driver: "Marc A.", status: "Livraison", location: "Nlongkak", time: "12 min", amount: "45 000 CFA" },
  { id: "#QG-4571", customer: "Sophie M.", driver: "Andre L.", status: "Complete", location: "Messa", time: "15 min", amount: "12 500 CFA" },
]

const topDrivers = [
  { name: "Emmanuel K.", deliveries: 47, rating: 4.9, earnings: "285 000 CFA", avatar: "EK" },
  { name: "Pierre M.", deliveries: 42, rating: 4.8, earnings: "252 000 CFA", avatar: "PM" },
  { name: "Jean Paul N.", deliveries: 38, rating: 4.9, earnings: "228 000 CFA", avatar: "JP" },
]

const cityStats = [
  { city: "Yaounde", orders: 856, drivers: 245, revenue: "8.2M CFA" },
  { city: "Douala", orders: 624, drivers: 189, revenue: "5.8M CFA" },
  { city: "Bafoussam", orders: 156, drivers: 45, revenue: "1.2M CFA" },
]

export default function AdminDashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/30 bg-card/30">
        {/* Logo */}
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

        {/* Navigation */}
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

        {/* System Status */}
        <div className="p-4 border-t border-border/30">
          <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Systeme OK</p>
                <p className="text-xs text-green-400">Tous services actifs</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-white">99.9%</p>
                <p className="text-[10px] text-muted-foreground">Uptime</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">45ms</p>
                <p className="text-[10px] text-muted-foreground">Latence</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white">0</p>
                <p className="text-[10px] text-muted-foreground">Erreurs</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-white">Centre de Controle</h1>
              <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                Live
              </span>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-full"
                onClick={handleRefresh}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Actualiser
              </Button>

              <button className="relative p-2 hover:bg-white/5 rounded-full">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  5
                </span>
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-border/30">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AD</span>
                </div>
                <div className="hidden md:block">
                  <p className="text-white text-sm font-medium">Admin</p>
                  <p className="text-xs text-red-400">Super Admin</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card/50 backdrop-blur-xl rounded-2xl p-5 border border-border/30 relative overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`} />
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color}`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className={`flex items-center gap-1 text-sm font-medium ${
                    stat.trend === "up" ? "text-green-400" : "text-red-400"
                  }`}>
                    {stat.trend === "up" ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Live Orders Table - 2 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-white">Commandes en direct</h2>
                  <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs">
                    <Activity className="w-3 h-3" />
                    48 actives
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-full">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtrer
                  </Button>
                  <Link href="/admin/orders">
                    <Button size="sm" className="rounded-full bg-quickgo-blue hover:bg-quickgo-blue/90">
                      Voir tout
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left text-xs text-muted-foreground font-medium py-3 px-2">ID</th>
                      <th className="text-left text-xs text-muted-foreground font-medium py-3 px-2">Client</th>
                      <th className="text-left text-xs text-muted-foreground font-medium py-3 px-2">Livreur</th>
                      <th className="text-left text-xs text-muted-foreground font-medium py-3 px-2">Statut</th>
                      <th className="text-left text-xs text-muted-foreground font-medium py-3 px-2">Montant</th>
                      <th className="text-left text-xs text-muted-foreground font-medium py-3 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveOrders.map((order) => (
                      <tr key={order.id} className="border-b border-border/20 hover:bg-white/5 transition-colors">
                        <td className="py-3 px-2">
                          <span className="text-white font-mono text-sm">{order.id}</span>
                        </td>
                        <td className="py-3 px-2">
                          <div>
                            <p className="text-white text-sm">{order.customer}</p>
                            <p className="text-xs text-muted-foreground">{order.location}</p>
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-white text-sm">{order.driver}</span>
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === "En attente" 
                              ? "bg-yellow-500/20 text-yellow-400"
                              : order.status === "En route"
                              ? "bg-quickgo-blue/20 text-quickgo-blue"
                              : order.status === "Livraison"
                              ? "bg-purple-500/20 text-purple-400"
                              : "bg-green-500/20 text-green-400"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-white font-semibold text-sm">{order.amount}</span>
                        </td>
                        <td className="py-3 px-2">
                          <button className="p-1 hover:bg-white/10 rounded">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Live Map Preview */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Carte live</h3>
                  <Link href="/driver/control-center" className="text-quickgo-blue text-sm">
                    Ouvrir
                  </Link>
                </div>
                
                <div className="aspect-video rounded-xl bg-gradient-to-br from-quickgo-blue/20 via-background to-quickgo-cyan/20 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0">
                    {/* Animated dots representing drivers */}
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-3 h-3 bg-quickgo-lime rounded-full animate-pulse"
                        style={{
                          top: `${20 + Math.random() * 60}%`,
                          left: `${10 + Math.random() * 80}%`,
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                  <div className="text-center z-10">
                    <Globe className="h-10 w-10 text-quickgo-blue mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">356 livreurs actifs</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-card/30 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-white">98.5%</p>
                    <p className="text-[10px] text-muted-foreground">Taux de succes</p>
                  </div>
                  <div className="bg-card/30 rounded-xl p-3 text-center">
                    <p className="text-xl font-bold text-white">4.8</p>
                    <p className="text-[10px] text-muted-foreground">Note moyenne</p>
                  </div>
                </div>
              </motion.div>

              {/* Top Drivers */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Top livreurs</h3>
                  <Link href="/admin/drivers" className="text-quickgo-blue text-sm">Voir tout</Link>
                </div>

                <div className="space-y-3">
                  {topDrivers.map((driver, i) => (
                    <div key={driver.name} className="flex items-center gap-3 p-3 bg-card/30 rounded-xl">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                        i === 0 ? "bg-yellow-500" : i === 1 ? "bg-gray-400" : "bg-orange-600"
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{driver.name}</p>
                        <p className="text-xs text-muted-foreground">{driver.deliveries} livraisons</p>
                      </div>
                      <div className="text-right">
                        <p className="text-quickgo-lime text-sm font-semibold">{driver.earnings}</p>
                        <p className="text-xs text-yellow-400">★ {driver.rating}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* City Stats */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Par ville</h3>
                </div>

                <div className="space-y-3">
                  {cityStats.map((city) => (
                    <div key={city.city} className="p-3 bg-card/30 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-quickgo-blue" />
                          <span className="text-white font-medium">{city.city}</span>
                        </div>
                        <span className="text-quickgo-lime font-semibold text-sm">{city.revenue}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{city.orders} commandes</span>
                        <span>{city.drivers} livreurs</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
