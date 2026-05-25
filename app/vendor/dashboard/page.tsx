"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Settings,
  Bell,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  ArrowUpRight,
  Search,
  Filter,
  MoreVertical,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendor/dashboard", active: true },
  { icon: Package, label: "Produits", href: "/vendor/products" },
  { icon: ShoppingBag, label: "Commandes", href: "/vendor/orders" },
  { icon: DollarSign, label: "Revenus", href: "/vendor/analytics" },
  { icon: BarChart3, label: "Analyses", href: "/vendor/analytics" },
  { icon: Users, label: "Clients", href: "/vendor/customers" },
  { icon: Settings, label: "Paramètres", href: "/vendor/settings" },
]

const recentOrders = [
  { id: "#QG13456", product: "iPhone 15 Pro Max", customer: "Marie C.", amount: "500 000 CFA", status: "Livrée" },
  { id: "#QG13455", product: "Samsung Galaxy S24", customer: "Jean P.", amount: "450 000 CFA", status: "En cours" },
  { id: "#QG13454", product: "AirPods Pro 2", customer: "Paul N.", amount: "120 000 CFA", status: "En préparation" },
  { id: "#QG13453", product: "MacBook Air M2", customer: "Claire M.", amount: "850 000 CFA", status: "Livrée" },
]

const topProducts = [
  { name: "Écouteurs Bluetooth", sales: 1243, image: "🎧" },
  { name: "iPhone 15 Pro Max", sales: 856, image: "📱" },
  { name: "Parfum Dior Sauvage", sales: 542, image: "🧴" },
]

export default function VendorDashboardPage() {
  const [period, setPeriod] = useState("7 jours")

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
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Vendor</p>
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
            </Link>
          ))}
        </nav>

        {/* Store Status */}
        <div className="p-4 border-t border-border/30">
          <div className="bg-quickgo-lime/20 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium text-sm">Boutique active</span>
              <span className="w-2 h-2 bg-quickgo-lime rounded-full animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground">QuickGo Official Store</p>
            <p className="text-xs text-muted-foreground mt-1">98% avis positifs • 12 560 ventes</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white">Bonjour, Samuel <span>👋</span></h1>
              <p className="text-sm text-muted-foreground">Que puis-je faire pour vous aujourd&apos;hui ?</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  className="pl-10 w-64 bg-card/50 border-border/30"
                />
              </div>

              <button className="relative p-2 hover:bg-white/5 rounded-full">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-border/30">
                <div className="w-10 h-10 rounded-full bg-quickgo-blue flex items-center justify-center">
                  <span className="text-white font-semibold">S</span>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          {/* Period Selector */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Tableau de bord</h2>
            <div className="flex items-center gap-2">
              <Button
                variant={period === "7 jours" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod("7 jours")}
                className="rounded-full"
              >
                7 jours
              </Button>
              <Button
                variant={period === "30 jours" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod("30 jours")}
                className="rounded-full"
              >
                30 jours
              </Button>
              <Button
                variant={period === "Tout" ? "default" : "outline"}
                size="sm"
                onClick={() => setPeriod("Tout")}
                className="rounded-full"
              >
                Tout
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Revenus totales", value: "2 450 000 CFA", change: "+12%", trend: "up", icon: DollarSign },
              { label: "Commandes", value: "320", change: "+8%", trend: "up", icon: ShoppingBag },
              { label: "Produits", value: "45", change: "+2%", trend: "up", icon: Package },
              { label: "Clients", value: "980", change: "+15%", trend: "up", icon: Users },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card/50 backdrop-blur-xl rounded-2xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-quickgo-blue/20 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-quickgo-blue" />
                  </div>
                  <span className={`text-xs flex items-center gap-1 ${
                    stat.trend === "up" ? "text-quickgo-lime" : "text-red-500"
                  }`}>
                    {stat.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-2 bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Évolution des ventes</h3>
                <Button variant="outline" size="sm" className="rounded-full">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrer
                </Button>
              </div>

              {/* Chart Placeholder */}
              <div className="h-64 flex items-end gap-2">
                {[40, 65, 45, 80, 55, 70, 90, 75, 85, 60, 95, 80].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gradient-to-t from-quickgo-blue to-quickgo-cyan rounded-t transition-all hover:from-quickgo-lime hover:to-quickgo-lime"
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Top Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Produits populaires</h3>
                <Link href="#" className="text-quickgo-blue text-sm">Voir tout</Link>
              </div>

              <div className="space-y-4">
                {topProducts.map((product, i) => (
                  <div key={product.name} className="flex items-center gap-4 p-3 bg-card/30 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-quickgo-blue/10 flex items-center justify-center text-2xl">
                      {product.image}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sales} ventes</p>
                    </div>
                    <div className="text-right">
                      <span className="text-quickgo-lime text-xs">#{i + 1}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sales Distribution */}
              <div className="mt-6 pt-6 border-t border-border/30">
                <h4 className="text-sm font-medium text-white mb-4">Répartition des ventes</h4>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 relative">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-white/10" />
                      <circle cx="48" cy="48" r="40" stroke="url(#gradient)" strokeWidth="8" fill="none" strokeDasharray="251.2" strokeDashoffset="50" />
                      <defs>
                        <linearGradient id="gradient">
                          <stop offset="0%" stopColor="#00D1FF" />
                          <stop offset="100%" stopColor="#BFFF00" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-quickgo-blue rounded-full" />
                      <span className="text-muted-foreground">Électronique</span>
                      <span className="text-white ml-auto">45%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-quickgo-lime rounded-full" />
                      <span className="text-muted-foreground">Mode</span>
                      <span className="text-white ml-auto">30%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                      <span className="text-muted-foreground">Autres</span>
                      <span className="text-white ml-auto">25%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Commandes récentes</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-full">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrer
                </Button>
                <Button size="sm" className="rounded-full bg-quickgo-blue hover:bg-quickgo-blue/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle commande
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-muted-foreground border-b border-border/30">
                    <th className="pb-4 font-medium">Commande</th>
                    <th className="pb-4 font-medium">Produit</th>
                    <th className="pb-4 font-medium">Client</th>
                    <th className="pb-4 font-medium">Montant</th>
                    <th className="pb-4 font-medium">Statut</th>
                    <th className="pb-4 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border/30 last:border-0">
                      <td className="py-4">
                        <span className="text-white font-medium">{order.id}</span>
                      </td>
                      <td className="py-4">
                        <span className="text-white">{order.product}</span>
                      </td>
                      <td className="py-4">
                        <span className="text-muted-foreground">{order.customer}</span>
                      </td>
                      <td className="py-4">
                        <span className="text-white font-medium">{order.amount}</span>
                      </td>
                      <td className="py-4">
                        <span className={`text-xs px-3 py-1 rounded-full ${
                          order.status === "Livrée"
                            ? "bg-quickgo-lime/20 text-quickgo-lime"
                            : order.status === "En cours"
                            ? "bg-quickgo-blue/20 text-quickgo-blue"
                            : "bg-yellow-500/20 text-yellow-500"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4">
                        <button className="p-2 hover:bg-white/5 rounded-full">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
