"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  BarChart3,
  Settings,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Clock,
  MapPin,
  Calendar,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", href: "/admin" },
  { icon: Package, label: "Commandes", href: "/admin/orders" },
  { icon: Truck, label: "Livreurs", href: "/admin/drivers" },
  { icon: Users, label: "Clients", href: "/admin/users" },
  { icon: BarChart3, label: "Analyses", href: "/admin/analytics", active: true },
  { icon: Settings, label: "Paramètres", href: "/admin/settings" },
]

const kpiCards = [
  { 
    label: "Chiffre d'affaires", 
    value: "45.8M CFA", 
    change: "+23%", 
    trend: "up",
    icon: DollarSign,
    color: "from-green-500/20 to-emerald-500/20",
    iconColor: "text-green-400"
  },
  { 
    label: "Commandes totales", 
    value: "12 458", 
    change: "+18%", 
    trend: "up",
    icon: ShoppingCart,
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-400"
  },
  { 
    label: "Temps moyen livraison", 
    value: "24 min", 
    change: "-12%", 
    trend: "up",
    icon: Clock,
    color: "from-purple-500/20 to-pink-500/20",
    iconColor: "text-purple-400"
  },
  { 
    label: "Taux de satisfaction", 
    value: "4.8/5", 
    change: "+0.2", 
    trend: "up",
    icon: TrendingUp,
    color: "from-yellow-500/20 to-orange-500/20",
    iconColor: "text-yellow-400"
  },
]

const weeklyData = [
  { day: "Lun", orders: 1240, revenue: 6.2 },
  { day: "Mar", orders: 1580, revenue: 7.9 },
  { day: "Mer", orders: 1890, revenue: 9.4 },
  { day: "Jeu", orders: 1650, revenue: 8.2 },
  { day: "Ven", orders: 2100, revenue: 10.5 },
  { day: "Sam", orders: 2450, revenue: 12.2 },
  { day: "Dim", orders: 1980, revenue: 9.9 },
]

const topCities = [
  { name: "Yaounde", orders: 5420, percentage: 43 },
  { name: "Douala", orders: 4890, percentage: 39 },
  { name: "Bafoussam", orders: 1240, percentage: 10 },
  { name: "Bamenda", orders: 650, percentage: 5 },
  { name: "Autres", orders: 258, percentage: 3 },
]

const topCategories = [
  { name: "Restaurants", orders: 4520, revenue: "18.2M CFA", growth: "+28%" },
  { name: "Supermarches", orders: 3210, revenue: "14.8M CFA", growth: "+15%" },
  { name: "Pharmacies", orders: 2180, revenue: "6.5M CFA", growth: "+32%" },
  { name: "Mode", orders: 1540, revenue: "4.2M CFA", growth: "+8%" },
  { name: "Electronique", orders: 1008, revenue: "2.1M CFA", growth: "-3%" },
]

const maxOrders = Math.max(...weeklyData.map(d => d.orders))

export default function AdminAnalyticsPage() {
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
                  Analyses et Statistiques
                </h1>
                <p className="text-muted-foreground">
                  Donnees en temps reel - Mai 2024
                </p>
              </div>
              <div className="flex items-center gap-3 mt-4 sm:mt-0">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card border border-border/50">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">30 derniers jours</span>
                </div>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Rapport
                </Button>
              </div>
            </motion.div>

            {/* KPI Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              {kpiCards.map((kpi) => (
                <div
                  key={kpi.label}
                  className={`p-6 rounded-2xl bg-gradient-to-br ${kpi.color} border border-border/50`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-background/50 ${kpi.iconColor}`}>
                      <kpi.icon className="h-6 w-6" />
                    </div>
                    <span className={`flex items-center gap-1 text-sm font-medium ${
                      kpi.trend === "up" ? "text-green-400" : "text-red-400"
                    }`}>
                      {kpi.trend === "up" ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      {kpi.change}
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-foreground mb-1">
                    {kpi.value}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {kpi.label}
                  </p>
                </div>
              ))}
            </motion.div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-3 gap-6 mb-8">
              {/* Weekly Chart */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border/50"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Commandes hebdomadaires</h3>
                    <p className="text-sm text-muted-foreground">Cette semaine vs semaine precedente</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-primary" />
                      <span className="text-xs text-muted-foreground">Commandes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-xs text-muted-foreground">Revenus</span>
                    </div>
                  </div>
                </div>
                
                {/* Bar Chart */}
                <div className="flex items-end justify-between gap-2 h-48">
                  {weeklyData.map((data, index) => (
                    <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex flex-col items-center gap-1">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(data.orders / maxOrders) * 100}%` }}
                          transition={{ delay: 0.2 + index * 0.05, duration: 0.5 }}
                          className="w-full max-w-[40px] bg-gradient-to-t from-primary to-primary/50 rounded-t-lg"
                          style={{ minHeight: 20 }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{data.day}</span>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-border/50">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">12 890</p>
                    <p className="text-xs text-muted-foreground">Total commandes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-400">64.3M CFA</p>
                    <p className="text-xs text-muted-foreground">Revenus totaux</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">1 841</p>
                    <p className="text-xs text-muted-foreground">Moyenne/jour</p>
                  </div>
                </div>
              </motion.div>

              {/* Top Cities */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-6 rounded-2xl bg-card border border-border/50"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-foreground">Top Villes</h3>
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <div className="space-y-4">
                  {topCities.map((city, index) => (
                    <div key={city.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{city.name}</span>
                        <span className="text-sm text-muted-foreground">{city.orders} cmd</span>
                      </div>
                      <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${city.percentage}%` }}
                          transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                          className={`h-full rounded-full ${
                            index === 0 ? "bg-primary" :
                            index === 1 ? "bg-blue-500" :
                            index === 2 ? "bg-green-500" :
                            index === 3 ? "bg-yellow-500" : "bg-gray-500"
                          }`}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{city.percentage}%</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Categories Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="p-6 rounded-2xl bg-card border border-border/50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-foreground">Performance par Categorie</h3>
                <Button variant="ghost" size="sm" className="text-primary">
                  Voir tout
                </Button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Categorie</th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Commandes</th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Revenus</th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Croissance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {topCategories.map((cat) => (
                      <tr key={cat.name} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <span className="font-medium text-foreground">{cat.name}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-foreground">{cat.orders.toLocaleString()}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-foreground">{cat.revenue}</span>
                        </td>
                        <td className="p-4">
                          <span className={`flex items-center gap-1 text-sm font-medium ${
                            cat.growth.startsWith("+") ? "text-green-400" : "text-red-400"
                          }`}>
                            {cat.growth.startsWith("+") ? (
                              <TrendingUp className="h-4 w-4" />
                            ) : (
                              <TrendingDown className="h-4 w-4" />
                            )}
                            {cat.growth}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  )
}
