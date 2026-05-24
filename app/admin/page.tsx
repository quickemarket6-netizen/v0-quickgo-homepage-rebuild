"use client"

import { motion } from "framer-motion"
import Image from "next/image"
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
  Clock,
  MapPin,
  AlertCircle,
} from "lucide-react"

const stats = [
  { 
    label: "Commandes en cours", 
    value: "1 248", 
    change: "+12%", 
    trend: "up",
    icon: Package 
  },
  { 
    label: "Livreurs actifs", 
    value: "356", 
    change: "+18%", 
    trend: "up",
    icon: Truck 
  },
  { 
    label: "Livraisons aujourd'hui", 
    value: "2 890", 
    change: "-5%", 
    trend: "down",
    icon: MapPin 
  },
  { 
    label: "Temps moyen livraison", 
    value: "27 min", 
    change: "-8%", 
    trend: "up",
    icon: Clock 
  },
]

const recentOrders = [
  { id: "#QG-4567", customer: "Marie Claire", status: "En attente", location: "Bastos, Yaoundé", time: "Il y a 2 min" },
  { id: "#QG-4568", customer: "Emmanuel K.", status: "En cours", location: "Mvog-Ada, Yaoundé", time: "Il y a 5 min" },
  { id: "#QG-4569", customer: "Samuel D.", status: "En cours", location: "Essos, Yaoundé", time: "Il y a 8 min" },
  { id: "#QG-4570", customer: "Patricia N.", status: "Livré", location: "Nlongkak, Yaoundé", time: "Il y a 12 min" },
]

const sidebarItems = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", active: true },
  { icon: Package, label: "Commandes" },
  { icon: Truck, label: "Livreurs" },
  { icon: Users, label: "Clients" },
  { icon: BarChart3, label: "Analyses" },
  { icon: Settings, label: "Paramètres" },
]

export default function AdminPage() {
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
                <button
                  key={item.label}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    item.active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
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
                  Tableau de bord
                </h1>
                <p className="text-muted-foreground">
                  Vue d&apos;ensemble en temps réel
                </p>
              </div>
              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/20 text-secondary text-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                  </span>
                  En ligne
                </span>
              </div>
            </motion.div>
            
            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
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
                    <span className={`flex items-center gap-1 text-sm font-medium ${
                      stat.trend === "up" ? "text-secondary" : "text-destructive"
                    }`}>
                      {stat.trend === "up" ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-foreground mb-1">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </motion.div>
            
            {/* Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Recent Orders */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2"
              >
                <div className="p-6 rounded-2xl bg-card border border-border/50">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-foreground">
                      Commandes récentes
                    </h2>
                    <Button variant="ghost" size="sm" className="text-primary">
                      Voir tout
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-muted/30"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                            {order.customer.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{order.id}</p>
                            <p className="text-sm text-muted-foreground">{order.customer}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === "En attente" 
                              ? "bg-yellow-500/20 text-yellow-500"
                              : order.status === "En cours"
                              ? "bg-primary/20 text-primary"
                              : "bg-secondary/20 text-secondary"
                          }`}>
                            {order.status}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">{order.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
              
              {/* Live Map Preview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="p-6 rounded-2xl bg-card border border-border/50">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-foreground">
                      Carte en direct
                    </h2>
                    <span className="flex items-center gap-1 text-xs text-secondary">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                      </span>
                      Live
                    </span>
                  </div>
                  
                  {/* Map Placeholder */}
                  <div className="aspect-square rounded-xl bg-gradient-to-br from-primary/20 via-background to-accent/20 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 text-primary mx-auto mb-2 animate-bounce" />
                      <p className="text-sm text-muted-foreground">
                        356 livreurs actifs
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-xl bg-muted/30 text-center">
                      <p className="text-lg font-bold text-foreground">98%</p>
                      <p className="text-xs text-muted-foreground">Taux complétion</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 text-center">
                      <p className="text-lg font-bold text-foreground">4.9</p>
                      <p className="text-xs text-muted-foreground">Note moyenne</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
