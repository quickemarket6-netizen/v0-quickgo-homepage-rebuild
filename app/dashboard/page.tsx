"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  Package,
  Clock,
  Heart,
  CreditCard,
  Settings,
  Bell,
  ChevronDown,
  ChevronRight,
  Star,
  MapPin,
  Truck,
  ShoppingBag,
  Gift,
  TrendingUp,
  Wallet,
  MessageSquare,
  HelpCircle,
  Search,
  Sparkles,
  Zap,
  Timer,
  CheckCircle,
  Bot,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/dashboard", active: true },
  { icon: ShoppingBag, label: "Commander", href: "/marketplace" },
  { icon: Package, label: "Mes commandes", href: "/marketplace/orders", badge: 2 },
  { icon: Clock, label: "En cours", href: "/tracking" },
  { icon: Heart, label: "Favoris", href: "/marketplace/favorites" },
  { icon: Wallet, label: "Portefeuille", href: "/wallet" },
  { icon: Gift, label: "Recompenses", href: "/marketplace/offers" },
  { icon: MessageSquare, label: "Messages", href: "/dashboard/messages", badge: 3 },
  { icon: HelpCircle, label: "Support", href: "/support" },
  { icon: Settings, label: "Parametres", href: "/dashboard/settings" },
]

const recentOrders = [
  {
    id: "#QG-12345",
    vendor: "Restaurant Le Gourmet",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0024-U4s2UDpvENxwAdPCezTrWL95wI71B4.jpg",
    status: "En route",
    statusColor: "bg-quickgo-blue",
    total: "15 500 CFA",
    eta: "12 min",
    progress: 65,
  },
  {
    id: "#QG-12344",
    vendor: "Pharmacie du Centre",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0022-3YpqZaS4R3zM06zR8StGq3zcBoxjDO.jpg",
    status: "Livre",
    statusColor: "bg-quickgo-lime",
    total: "8 200 CFA",
    eta: "Complete",
    progress: 100,
  },
]

const quickCategories = [
  { icon: "🍔", label: "Restaurants", count: "250+", href: "/marketplace?cat=restaurants" },
  { icon: "💊", label: "Pharmacies", count: "45+", href: "/marketplace?cat=pharmacies" },
  { icon: "🛒", label: "Supermarches", count: "120+", href: "/marketplace?cat=supermarches" },
  { icon: "👗", label: "Mode", count: "80+", href: "/marketplace?cat=mode" },
]

const promotions = [
  { title: "Livraison Gratuite", desc: "Sur votre prochaine commande", code: "FREE2024", color: "from-quickgo-blue to-quickgo-cyan" },
  { title: "-30% Restaurants", desc: "Ce weekend seulement", code: "WEEKEND30", color: "from-orange-500 to-red-500" },
]

export default function ClientDashboardPage() {
  const [isNotifOpen, setIsNotifOpen] = useState(false)

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
                <span className="ml-auto bg-quickgo-blue text-white text-xs px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* AI Assistant Card */}
        <div className="p-4 border-t border-border/30">
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="relative w-12 h-12">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2024%20mai%202026%2C%2021_18_12-1TgU6hLRFeK5CWWB3UFIPnTcKRO9YR.png"
                  alt="AI Assistant"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Assistant IA</p>
                <p className="text-xs text-muted-foreground">Besoin d&apos;aide ?</p>
              </div>
            </div>
            <Link href="/ai">
              <Button size="sm" className="w-full rounded-xl bg-purple-500/30 hover:bg-purple-500/40 text-purple-300">
                <Sparkles className="w-4 h-4 mr-2" />
                Demander
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-full">
                <MapPin className="w-4 h-4 text-quickgo-blue" />
                <span className="text-white text-sm">Yaounde, Bastos</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher produits, restaurants..."
                  className="w-full bg-card/50 border border-border/30 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-quickgo-blue/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="relative p-2 hover:bg-white/5 rounded-full"
              >
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-border/30">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-quickgo-lime">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0024-U4s2UDpvENxwAdPCezTrWL95wI71B4.jpg"
                    alt="User"
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                </div>
                <div className="hidden md:block">
                  <p className="text-white text-sm font-medium">Samuel D.</p>
                  <p className="text-xs text-muted-foreground">Client Premium</p>
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - 2 cols */}
            <div className="lg:col-span-2 space-y-6">
              {/* Welcome Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-quickgo-blue/20 via-quickgo-cyan/10 to-quickgo-lime/10 rounded-3xl p-6 border border-quickgo-blue/30"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white mb-1">
                      Bonjour, Samuel <span>👋</span>
                    </h1>
                    <p className="text-muted-foreground">
                      Que souhaitez-vous commander aujourd&apos;hui ?
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-white font-semibold">1 250</span>
                        <span className="text-xs text-muted-foreground">points</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="w-4 h-4 text-quickgo-blue" />
                        <span className="text-white font-semibold">47</span>
                        <span className="text-xs text-muted-foreground">commandes</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Link href="/marketplace">
                      <Button className="rounded-full bg-quickgo-blue hover:bg-quickgo-blue/90">
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Commander
                      </Button>
                    </Link>
                    <Link href="/delivery/create">
                      <Button variant="outline" className="rounded-full">
                        <Truck className="w-4 h-4 mr-2" />
                        Livraison
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Commandes", value: "47", icon: Package, color: "text-quickgo-blue" },
                  { label: "En cours", value: "2", icon: Clock, color: "text-orange-500" },
                  { label: "Favoris", value: "12", icon: Heart, color: "text-red-500" },
                  { label: "Economise", value: "45K", icon: TrendingUp, color: "text-quickgo-lime" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card/50 backdrop-blur-xl rounded-2xl p-4 border border-border/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Quick Categories */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Categories</h3>
                  <Link href="/marketplace" className="text-quickgo-blue text-sm">Voir tout</Link>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickCategories.map((cat) => (
                    <Link key={cat.label} href={cat.href}>
                      <div className="bg-card/30 hover:bg-card/50 rounded-2xl p-4 text-center transition-all hover:scale-105">
                        <span className="text-3xl mb-2 block">{cat.icon}</span>
                        <p className="text-white font-medium text-sm">{cat.label}</p>
                        <p className="text-xs text-muted-foreground">{cat.count}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </motion.div>

              {/* Promotions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Offres speciales</h3>
                  <Link href="/marketplace/offers" className="text-quickgo-blue text-sm">Voir tout</Link>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {promotions.map((promo) => (
                    <div
                      key={promo.code}
                      className={`bg-gradient-to-br ${promo.color} rounded-2xl p-5 relative overflow-hidden`}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <Gift className="w-8 h-8 text-white/80 mb-3" />
                      <h4 className="text-white font-bold text-lg">{promo.title}</h4>
                      <p className="text-white/80 text-sm mb-3">{promo.desc}</p>
                      <div className="flex items-center justify-between">
                        <code className="bg-white/20 px-3 py-1 rounded-full text-white text-sm font-mono">
                          {promo.code}
                        </code>
                        <Button size="sm" variant="secondary" className="rounded-full">
                          Utiliser
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Active Order Tracking */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Commande en cours</h3>
                  <span className="flex items-center gap-1 text-xs text-quickgo-lime">
                    <span className="w-2 h-2 bg-quickgo-lime rounded-full animate-pulse" />
                    Live
                  </span>
                </div>

                <div className="bg-card/30 rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-quickgo-blue/20 flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-quickgo-blue" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">Restaurant Le Gourmet</p>
                      <p className="text-xs text-muted-foreground">#QG-12345</p>
                    </div>
                    <div className="text-right">
                      <p className="text-quickgo-lime font-bold">12 min</p>
                      <p className="text-xs text-muted-foreground">ETA</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative mb-3">
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-quickgo-blue to-quickgo-lime h-2 rounded-full transition-all"
                        style={{ width: "65%" }}
                      />
                    </div>
                    <div className="flex justify-between mt-2">
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-quickgo-lime flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-background" />
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1">Confirme</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-quickgo-lime flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-background" />
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1">Prepare</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-quickgo-blue flex items-center justify-center animate-pulse">
                          <Truck className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[10px] text-quickgo-blue mt-1">En route</span>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="text-[10px] text-muted-foreground mt-1">Livre</span>
                      </div>
                    </div>
                  </div>

                  <Link href="/tracking">
                    <Button className="w-full rounded-xl bg-quickgo-blue hover:bg-quickgo-blue/90">
                      Suivre ma commande
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* Recent Orders */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Historique</h3>
                  <Link href="/marketplace/orders" className="text-quickgo-blue text-sm">Voir tout</Link>
                </div>

                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-3 p-3 bg-card/30 rounded-xl">
                      <div className="w-10 h-10 rounded-xl bg-quickgo-blue/20 flex items-center justify-center">
                        <Package className="w-5 h-5 text-quickgo-blue" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">{order.vendor}</p>
                        <p className="text-xs text-muted-foreground">{order.id}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${order.statusColor} text-white`}>
                          {order.status}
                        </span>
                        <p className="text-xs text-muted-foreground mt-1">{order.total}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Wallet Card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-quickgo-blue/30 to-quickgo-cyan/20 rounded-3xl p-6 border border-quickgo-blue/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-quickgo-blue/30 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-quickgo-blue" />
                    </div>
                    <span className="text-white font-semibold">QuickGo Pay</span>
                  </div>
                </div>
                <p className="text-3xl font-bold text-white mb-1">25 600 CFA</p>
                <p className="text-xs text-muted-foreground mb-4">Solde disponible</p>
                <div className="flex gap-2">
                  <Link href="/wallet" className="flex-1">
                    <Button className="w-full rounded-xl" size="sm">
                      Recharger
                    </Button>
                  </Link>
                  <Button variant="outline" className="rounded-xl" size="sm">
                    Historique
                  </Button>
                </div>
              </motion.div>

              {/* Rewards */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Mes points</h3>
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold text-white">1 250</p>
                  <p className="text-sm text-muted-foreground">points accumules</p>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2 mb-2">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full" style={{ width: "62%" }} />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Encore 750 points pour le niveau Gold
                </p>
                <Link href="/marketplace/offers">
                  <Button variant="outline" className="w-full mt-4 rounded-xl">
                    Echanger mes points
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
