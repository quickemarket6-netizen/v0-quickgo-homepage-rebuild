"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Package,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  ShoppingCart,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
} from "lucide-react"

const stats = [
  { label: "Chiffre d'affaires", value: "4 250 000 FCFA", change: "+12.5%", up: true, icon: DollarSign },
  { label: "Commandes", value: "156", change: "+8.2%", up: true, icon: ShoppingCart },
  { label: "Vues produits", value: "12 450", change: "+15.3%", up: true, icon: Eye },
  { label: "Taux conversion", value: "3.8%", change: "-0.5%", up: false, icon: TrendingUp },
]

const topProducts = [
  { name: "iPhone 15 Pro Max", sales: 45, revenue: 38250000, change: "+15%" },
  { name: "AirPods Pro 2", sales: 89, revenue: 13350000, change: "+22%" },
  { name: "MacBook Air M2", sales: 23, revenue: 26450000, change: "+8%" },
  { name: "Apple Watch Series 9", sales: 67, revenue: 18760000, change: "+12%" },
  { name: "Sony WH-1000XM5", sales: 34, revenue: 6120000, change: "+5%" },
]

const revenueByDay = [
  { day: "Lun", value: 450000 },
  { day: "Mar", value: 620000 },
  { day: "Mer", value: 580000 },
  { day: "Jeu", value: 890000 },
  { day: "Ven", value: 1200000 },
  { day: "Sam", value: 950000 },
  { day: "Dim", value: 560000 },
]

const trafficSources = [
  { source: "Recherche directe", percentage: 45, color: "bg-primary" },
  { source: "Recommandations", percentage: 28, color: "bg-secondary" },
  { source: "Reseaux sociaux", percentage: 18, color: "bg-accent" },
  { source: "Autres", percentage: 9, color: "bg-muted-foreground" },
]

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA"
}

const maxRevenue = Math.max(...revenueByDay.map(d => d.value))

export default function VendorAnalyticsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border/50 p-6 hidden lg:block">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <span className="text-xl font-bold text-white">Q</span>
          </div>
          <div>
            <span className="font-bold text-foreground">QuickGo</span>
            <span className="text-xs text-muted-foreground block">Espace Vendeur</span>
          </div>
        </Link>

        <nav className="space-y-2">
          {[
            { icon: BarChart3, label: "Tableau de bord", href: "/vendor/dashboard" },
            { icon: Package, label: "Produits", href: "/vendor/products" },
            { icon: TrendingUp, label: "Commandes", href: "/vendor/orders" },
            { icon: BarChart3, label: "Analytics", href: "/vendor/analytics", active: true },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground">Performances de votre boutique</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl">
              <Calendar className="w-4 h-4 mr-2" />
              7 derniers jours
            </Button>
            <Button variant="outline" className="rounded-xl">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border/50"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-xl bg-primary/10">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <span className={`flex items-center gap-1 text-sm font-medium ${stat.up ? "text-secondary" : "text-destructive"}`}>
                  {stat.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Revenue Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border/50"
          >
            <h2 className="text-lg font-bold text-foreground mb-6">Revenus cette semaine</h2>
            <div className="flex items-end gap-2 h-64">
              {revenueByDay.map((day, index) => (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative" style={{ height: "200px" }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.value / maxRevenue) * 100}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className="absolute bottom-0 w-full rounded-t-lg bg-gradient-to-t from-primary to-primary/50"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Total: <span className="font-bold text-foreground">{formatPrice(revenueByDay.reduce((sum, d) => sum + d.value, 0))}</span>
              </p>
            </div>
          </motion.div>

          {/* Traffic Sources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-card border border-border/50"
          >
            <h2 className="text-lg font-bold text-foreground mb-6">Sources de trafic</h2>
            <div className="space-y-4">
              {trafficSources.map((source) => (
                <div key={source.source}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">{source.source}</span>
                    <span className="text-sm font-medium text-foreground">{source.percentage}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${source.percentage}%` }}
                      transition={{ duration: 0.5 }}
                      className={`h-full rounded-full ${source.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Total visiteurs: <span className="font-bold text-foreground">12 450</span>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 p-6 rounded-2xl bg-card border border-border/50"
        >
          <h2 className="text-lg font-bold text-foreground mb-6">Produits les plus vendus</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Produit</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Ventes</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Revenus</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Croissance</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((product, index) => (
                  <tr key={product.name} className="border-b border-border/50 last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        <span className="font-medium text-foreground">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-medium text-foreground">{product.sales}</td>
                    <td className="p-4 font-medium text-foreground">{formatPrice(product.revenue)}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-sm font-medium text-secondary">
                        <ArrowUpRight className="w-4 h-4" />
                        {product.change}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Customer Insights */}
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-2xl bg-card border border-border/50"
          >
            <h2 className="text-lg font-bold text-foreground mb-6">Clients</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-foreground">847</p>
                <p className="text-sm text-muted-foreground">Clients total</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-foreground">124</p>
                <p className="text-sm text-muted-foreground">Nouveaux ce mois</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-foreground">68%</p>
                <p className="text-sm text-muted-foreground">Taux retention</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-foreground">2.3</p>
                <p className="text-sm text-muted-foreground">Commandes/client</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-2xl bg-card border border-border/50"
          >
            <h2 className="text-lg font-bold text-foreground mb-6">Performance livraison</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-secondary">98.5%</p>
                <p className="text-sm text-muted-foreground">Livrees a temps</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-foreground">42 min</p>
                <p className="text-sm text-muted-foreground">Temps moyen</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-foreground">4.8</p>
                <p className="text-sm text-muted-foreground">Note moyenne</p>
              </div>
              <div className="p-4 rounded-xl bg-muted/30">
                <p className="text-2xl font-bold text-destructive">1.2%</p>
                <p className="text-sm text-muted-foreground">Taux retour</p>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
