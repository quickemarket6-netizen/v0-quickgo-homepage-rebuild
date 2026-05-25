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
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Download,
  ShieldCheck,
  RefreshCw,
  ChevronRight,
  CreditCard,
  Banknote,
  Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", href: "/admin" },
  { icon: Package, label: "Commandes", href: "/admin/orders", badge: 48 },
  { icon: Truck, label: "Livreurs", href: "/admin/drivers", badge: 12 },
  { icon: Users, label: "Clients", href: "/admin/users" },
  { icon: Store, label: "Vendeurs", href: "/admin/vendors" },
  { icon: BarChart3, label: "Analyses", href: "/admin/analytics" },
  { icon: Wallet, label: "Finances", href: "/admin/finances", active: true },
  { icon: Settings, label: "Paramètres", href: "/admin/settings" },
]

const stats = [
  {
    label: "Revenus totaux",
    value: "45.8M CFA",
    change: "+23.4%",
    trend: "up",
    icon: DollarSign,
    color: "from-green-500 to-emerald-500",
    sub: "Ce mois",
  },
  {
    label: "Commissions",
    value: "3.2M CFA",
    change: "+18.2%",
    trend: "up",
    icon: TrendingUp,
    color: "from-quickgo-blue to-quickgo-cyan",
    sub: "7% moyen",
  },
  {
    label: "Paiements vendeurs",
    value: "38.6M CFA",
    change: "+21.1%",
    trend: "up",
    icon: ArrowUpRight,
    color: "from-purple-500 to-pink-500",
    sub: "Payés ce mois",
  },
  {
    label: "En attente",
    value: "4.0M CFA",
    change: "-5.3%",
    trend: "down",
    icon: ArrowDownLeft,
    color: "from-orange-500 to-red-500",
    sub: "À traiter",
  },
]

const transactions = [
  {
    id: "TXN-001",
    type: "commission",
    vendor: "Apple Store Cameroun",
    amount: "+125 000 CFA",
    method: "Orange Money",
    status: "completed",
    date: "25 Mai 2026",
  },
  {
    id: "TXN-002",
    type: "payout",
    vendor: "Mode Africaine",
    amount: "-850 000 CFA",
    method: "MTN Mobile Money",
    status: "completed",
    date: "25 Mai 2026",
  },
  {
    id: "TXN-003",
    type: "commission",
    vendor: "Pharmacie Plus",
    amount: "+45 000 CFA",
    method: "Orange Money",
    status: "completed",
    date: "24 Mai 2026",
  },
  {
    id: "TXN-004",
    type: "payout",
    vendor: "Tech Galaxy",
    amount: "-220 000 CFA",
    method: "Virement bancaire",
    status: "pending",
    date: "24 Mai 2026",
  },
  {
    id: "TXN-005",
    type: "refund",
    vendor: "SuperMarché Central",
    amount: "-15 000 CFA",
    method: "Orange Money",
    status: "processing",
    date: "23 Mai 2026",
  },
]

const paymentChannels = [
  { name: "Orange Money", amount: "18.5M CFA", share: 40, color: "bg-orange-500", icon: Smartphone },
  { name: "MTN Mobile Money", amount: "16.2M CFA", share: 35, color: "bg-yellow-500", icon: Smartphone },
  { name: "Carte bancaire", amount: "7.4M CFA", share: 16, color: "bg-blue-500", icon: CreditCard },
  { name: "QuickGo Pay", amount: "3.7M CFA", share: 9, color: "bg-quickgo-lime", icon: Wallet },
]

const statusConfig: Record<string, { label: string; className: string }> = {
  completed: { label: "Complété", className: "bg-green-500/20 text-green-400" },
  pending: { label: "En attente", className: "bg-yellow-500/20 text-yellow-400" },
  processing: { label: "En cours", className: "bg-quickgo-blue/20 text-quickgo-blue" },
  failed: { label: "Échoué", className: "bg-red-500/20 text-red-400" },
}

export default function AdminFinancesPage() {
  const [period, setPeriod] = useState("Ce mois")

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
              <h1 className="text-xl font-bold text-white">Finances & Paiements</h1>
              <p className="text-sm text-muted-foreground">Gestion des revenus, commissions et paiements vendeurs</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-card/50 rounded-full p-1">
                {["Ce mois", "3 mois", "6 mois", "Tout"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      period === p ? "bg-quickgo-blue text-white" : "text-muted-foreground hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" className="rounded-full">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <button className="relative p-2 hover:bg-white/5 rounded-full">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </button>
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                <span className="text-white font-bold text-xs">AD</span>
              </div>
            </div>
          </div>
        </header>

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
                    {stat.trend === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {stat.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">{stat.sub}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            {/* Revenue Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Revenus mensuels</h3>
                <Button variant="outline" size="sm" className="rounded-full">
                  <Filter className="w-4 h-4 mr-2" />
                  Filtrer
                </Button>
              </div>
              <div className="h-48 flex items-end gap-2">
                {[35, 55, 42, 68, 52, 75, 88, 72, 92, 78, 95, 85].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-gradient-to-t from-quickgo-blue to-quickgo-cyan rounded-t transition-all hover:from-quickgo-lime hover:to-quickgo-lime cursor-pointer"
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][i]}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Payment Channels */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
            >
              <h3 className="text-lg font-bold text-white mb-6">Canaux de paiement</h3>
              <div className="space-y-4">
                {paymentChannels.map((channel) => (
                  <div key={channel.name}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <channel.icon className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-white">{channel.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-white font-medium">{channel.amount}</span>
                        <span className="text-xs text-muted-foreground ml-2">{channel.share}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${channel.color} rounded-full transition-all`}
                        style={{ width: `${channel.share}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total traité</span>
                  <span className="text-quickgo-lime font-bold">45.8M CFA</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Pending Payouts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mb-6 p-6 rounded-3xl bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Paiements en attente</h3>
                <p className="text-sm text-muted-foreground">3 vendeurs attendent leur paiement · Total: 4.0M CFA</p>
              </div>
              <Button className="rounded-full bg-quickgo-blue hover:bg-quickgo-blue/90">
                <Banknote className="w-4 h-4 mr-2" />
                Traiter les paiements
              </Button>
            </div>
          </motion.div>

          {/* Transactions Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card/50 backdrop-blur-xl rounded-3xl border border-border/30 overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-border/30">
              <h3 className="text-lg font-bold text-white">Dernières transactions</h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="rounded-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
                <Link href="/admin/analytics">
                  <Button size="sm" className="rounded-full bg-quickgo-blue hover:bg-quickgo-blue/90">
                    Voir tout
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/20">
                    <th className="text-left text-xs text-muted-foreground font-medium py-3 px-6">Transaction</th>
                    <th className="text-left text-xs text-muted-foreground font-medium py-3 px-4">Vendeur</th>
                    <th className="text-left text-xs text-muted-foreground font-medium py-3 px-4">Méthode</th>
                    <th className="text-left text-xs text-muted-foreground font-medium py-3 px-4">Montant</th>
                    <th className="text-left text-xs text-muted-foreground font-medium py-3 px-4">Statut</th>
                    <th className="text-left text-xs text-muted-foreground font-medium py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, i) => (
                    <tr key={tx.id} className="border-b border-border/20 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${
                            tx.type === "commission" ? "bg-green-500/20" :
                            tx.type === "payout" ? "bg-quickgo-blue/20" : "bg-orange-500/20"
                          }`}>
                            {tx.type === "commission" ? (
                              <ArrowDownLeft className={`w-4 h-4 text-green-400`} />
                            ) : tx.type === "payout" ? (
                              <ArrowUpRight className="w-4 h-4 text-quickgo-blue" />
                            ) : (
                              <RefreshCw className="w-4 h-4 text-orange-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-white text-sm font-mono">{tx.id}</p>
                            <p className="text-xs text-muted-foreground capitalize">{tx.type}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-white">{tx.vendor}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-muted-foreground">{tx.method}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`text-sm font-bold ${
                          tx.amount.startsWith("+") ? "text-green-400" : "text-red-400"
                        }`}>
                          {tx.amount}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[tx.status]?.className}`}>
                          {statusConfig[tx.status]?.label}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-muted-foreground">{tx.date}</span>
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
