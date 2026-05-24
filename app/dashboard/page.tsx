"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import {
  Package,
  Clock,
  MapPin,
  CreditCard,
  Heart,
  Settings,
  ChevronRight,
  ShoppingBag,
  Star,
  TrendingUp,
} from "lucide-react"

const stats = [
  { label: "Commandes", value: "12", icon: Package },
  { label: "En cours", value: "2", icon: Clock },
  { label: "Favoris", value: "8", icon: Heart },
  { label: "Points", value: "1 250", icon: Star },
]

const recentOrders = [
  {
    id: "#QG12345",
    status: "En route",
    statusColor: "text-secondary",
    items: "Restaurant Le Gourmet",
    total: "15 500 CFA",
    date: "Aujourd'hui, 12:45",
  },
  {
    id: "#QG12344",
    status: "Livré",
    statusColor: "text-primary",
    items: "Pharmacie du Centre",
    total: "8 200 CFA",
    date: "Hier, 18:30",
  },
  {
    id: "#QG12343",
    status: "Livré",
    statusColor: "text-primary",
    items: "Supermarché Express",
    total: "45 000 CFA",
    date: "22 Mai, 10:15",
  },
]

const quickActions = [
  { icon: ShoppingBag, label: "Commander", href: "/marketplace" },
  { icon: MapPin, label: "Suivre", href: "/tracking" },
  { icon: CreditCard, label: "Wallet", href: "/wallet" },
  { icon: Settings, label: "Paramètres", href: "/dashboard/settings" },
]

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 lg:pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Bonjour, Samuel 👋
            </h1>
            <p className="text-muted-foreground">
              Bienvenue sur votre tableau de bord QuickGo
            </p>
          </motion.div>
          
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="p-6 rounded-2xl bg-card border border-border/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-secondary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
          
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-xl font-bold text-foreground mb-4">
              Actions rapides
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link key={action.label} href={action.href}>
                  <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <action.icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="font-medium text-foreground">{action.label}</p>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
          
          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                Commandes récentes
              </h2>
              <Button variant="ghost" className="text-primary">
                Voir tout
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/tracking?order=${order.id}`}>
                  <div className="p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-foreground">{order.id}</p>
                            <span className={`text-sm font-medium ${order.statusColor}`}>
                              {order.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{order.items}</p>
                          <p className="text-xs text-muted-foreground">{order.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{order.total}</p>
                        <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
