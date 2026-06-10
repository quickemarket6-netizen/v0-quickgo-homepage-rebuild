"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  MapPin,
  Car,
  DollarSign,
  Wallet,
  TrendingUp,
  MessageSquare,
  Gift,
  HelpCircle,
  Settings,
  Bell,
  ChevronDown,
  Star,
  CheckCircle,
  Clock,
  Navigation,
  Zap,
  Battery,
  Fuel,
  Wrench,
  Phone,
  User,
  Trophy,
  Target,
  Flame,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/driver/dashboard", active: true },
  { icon: MapPin, label: "Missions disponibles", href: "/driver/missions", badge: 6 },
  { icon: Car, label: "Mes courses", href: "/driver/navigation" },
  { icon: DollarSign, label: "Revenus", href: "/driver/earnings" },
  { icon: Wallet, label: "Portefeuille", href: "/wallet" },
  { icon: TrendingUp, label: "Performance", href: "/driver/ranking" },
  { icon: MessageSquare, label: "Messages", href: "/driver/messages", badge: 2 },
  { icon: Gift, label: "Incitations", href: "/driver/ranking" },
  { icon: HelpCircle, label: "Assistance", href: "/support" },
  { icon: Settings, label: "Paramètres", href: "/driver/settings" },
]

const activeZones = [
  { name: "Bastos", status: "Très actif", color: "text-red-500" },
  { name: "Mvog-Adda", status: "Actif", color: "text-yellow-500" },
  { name: "Omnisports", status: "Moyen", color: "text-green-500" },
  { name: "Ahala", status: "Moyen", color: "text-green-500" },
]

const weekDays = [
  { day: "Lun", completed: true },
  { day: "Mar", completed: true },
  { day: "Mer", completed: true },
  { day: "Jeu", completed: true },
  { day: "Ven", completed: false },
  { day: "Sam", completed: false },
  { day: "Dim", completed: false },
]

export default function DriverDashboardPage() {
  const [isOnline, setIsOnline] = useState(true)
  const [driverName, setDriverName]           = useState<string | null>(null)
  const [todayEarnings, setTodayEarnings]     = useState<number | null>(null)
  const [todayDeliveries, setTodayDeliveries] = useState<number | null>(null)
  const [driverRating, setDriverRating]       = useState<number | null>(null)
  const [activeMissions, setActiveMissions]   = useState<number>(0)

  useState(() => {
    fetch("/api/driver")
      .then(r => r.json())
      .then(data => {
        if (data.user?.full_name) setDriverName(data.user.full_name)
        if (typeof data.today_earnings  === "number") setTodayEarnings(data.today_earnings)
        if (typeof data.today_deliveries === "number") setTodayDeliveries(data.today_deliveries)
        if (typeof data.rating           === "number") setDriverRating(data.rating)
        if (Array.isArray(data.active_missions))        setActiveMissions(data.active_missions.length)
      })
      .catch(() => {})
  })

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
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Driver</p>
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

        {/* Driver Level */}
        <div className="p-4 border-t border-border/30">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">Niveau Or</p>
                <p className="text-xs text-muted-foreground">Niveau 4</p>
              </div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-quickgo-blue to-quickgo-cyan h-2 rounded-full" style={{ width: "68%" }} />
            </div>
            <p className="text-xs text-muted-foreground">680 / 1000 XP</p>
            <p className="text-xs text-quickgo-lime mt-2">Prochaine récompense</p>
            <p className="text-sm font-semibold text-white flex items-center gap-2">
              Bonus 25 000 CFA <Gift className="w-4 h-4 text-quickgo-lime" />
            </p>
          </div>

          {/* Help Center */}
          <div className="mt-4 bg-quickgo-blue/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-quickgo-blue/30 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-quickgo-blue" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">Centre d&apos;aide</p>
              <p className="text-xs text-muted-foreground">Besoin d&apos;assistance ?</p>
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
              <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-full">
                <MapPin className="w-4 h-4 text-quickgo-blue" />
                <span className="text-white text-sm">Yaoundé</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Online Toggle */}
              <div className="flex items-center gap-3">
                <span className={`text-sm ${isOnline ? "text-quickgo-lime" : "text-muted-foreground"}`}>
                  {isOnline ? "En ligne" : "Hors ligne"}
                </span>
                <button
                  onClick={() => setIsOnline(!isOnline)}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    isOnline ? "bg-quickgo-lime" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      isOnline ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>

              <button className="relative p-2 hover:bg-white/5 rounded-full">
                <Bell className="w-5 h-5 text-muted-foreground" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-quickgo-blue rounded-full" />
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-border/30">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-quickgo-lime">
                  <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0024-U4s2UDpvENxwAdPCezTrWL95wI71B4.jpg"
                    alt="Driver"
                    width={40}
                    height={40}
                    className="object-cover"
                  />
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
              {/* Driver Profile Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Profile */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden">
                        <Image
                          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0024-U4s2UDpvENxwAdPCezTrWL95wI71B4.jpg"
                          alt="Emmanuel"
                          width={96}
                          height={96}
                          className="object-cover w-full h-full"
                        />
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-quickgo-blue rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        Bonjour, Emmanuel <span>👋</span>
                      </h2>
                      <p className="text-sm text-muted-foreground">Livreur partenaire depuis 8 mois</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-white font-semibold">4.9</span>
                          <span className="text-xs text-muted-foreground">(256 avis)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4 text-quickgo-lime" />
                          <span className="text-white font-semibold">100%</span>
                          <span className="text-xs text-muted-foreground">Taux d&apos;acceptation</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-yellow-400" />
                          <span className="text-white font-semibold">Top 15%</span>
                          <span className="text-xs text-muted-foreground">Dans votre ville</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Today's Earnings Chart */}
                  <div className="flex-1 bg-card/30 rounded-2xl p-4 ml-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Gains aujourd&apos;hui</span>
                      <span className="text-quickgo-lime text-xs">+12%</span>
                    </div>
                    <p className="text-2xl font-bold text-white">18 750 CFA</p>
                    <p className="text-xs text-muted-foreground">7 courses terminées</p>
                    {/* Mini Chart */}
                    <div className="mt-3 flex items-end gap-1 h-12">
                      {[20, 35, 45, 30, 55, 40, 60, 75, 50, 65, 80, 70].map((h, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-quickgo-blue to-quickgo-cyan rounded-t"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>00h</span>
                      <span>06h</span>
                      <span>12h</span>
                      <span>18h</span>
                      <span>24h</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button variant="outline" className="rounded-full">
                    Voir mon profil
                  </Button>
                  <Button className="rounded-full bg-quickgo-blue hover:bg-quickgo-blue/90">
                    Statut en ligne
                  </Button>
                </div>
              </motion.div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: "Courses terminées", value: "07", sub: "Aujourd'hui", change: "+2 vs hier", icon: Car },
                  { label: "Temps en ligne", value: "06h 45m", sub: "Aujourd'hui", change: "+45m", icon: Clock },
                  { label: "Taux d'acceptation", value: "100%", sub: "Excellent", icon: CheckCircle },
                  { label: "Note moyenne", value: "4.9", sub: "Excellent", icon: Star, star: true },
                  { label: "Bonus actif", value: "5 000 CFA", sub: "Encore 3 courses", icon: Gift },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card/50 backdrop-blur-xl rounded-2xl p-4 border border-border/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                      <stat.icon className={`w-4 h-4 ${stat.star ? "text-yellow-400" : "text-quickgo-blue"}`} />
                    </div>
                    <p className="text-xl font-bold text-white flex items-center gap-1">
                      {stat.value}
                      {stat.star && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.sub}</p>
                    {stat.change && (
                      <p className="text-xs text-quickgo-lime mt-1">{stat.change}</p>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Active Zones Map */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Zones actives</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Map Placeholder */}
                  <div className="relative h-64 bg-gradient-to-br from-quickgo-blue/10 to-quickgo-cyan/10 rounded-2xl overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-quickgo-blue/20 flex items-center justify-center">
                          <MapPin className="w-10 h-10 text-quickgo-blue" />
                        </div>
                        <p className="text-white font-semibold">Yaoundé</p>
                      </div>
                    </div>
                    {/* Zone indicators */}
                    {activeZones.map((zone, i) => (
                      <div
                        key={zone.name}
                        className="absolute"
                        style={{
                          top: `${20 + i * 20}%`,
                          left: `${15 + i * 18}%`,
                        }}
                      >
                        <div className={`w-16 h-16 rounded-full border-2 ${zone.color} bg-current/10 flex items-center justify-center animate-pulse`}>
                          <span className="text-xs text-white font-medium">{zone.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Zone Stats */}
                  <div className="space-y-3">
                    {activeZones.map((zone) => (
                      <div key={zone.name} className="flex items-center justify-between p-3 bg-card/30 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${zone.color.replace("text-", "bg-")}`} />
                          <span className="text-white font-medium">{zone.name}</span>
                        </div>
                        <span className={`text-sm ${zone.color}`}>{zone.status}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-3 border-t border-border/30">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-gray-500 rounded-full" />
                        <span className="text-xs text-muted-foreground">Activité faible</span>
                      </div>
                      <div className="w-20 h-2 rounded-full bg-gradient-to-r from-gray-500 via-yellow-500 to-red-500" />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Activité élevée</span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full rounded-xl">
                      Voir plus de zones
                    </Button>
                  </div>
                </div>
              </motion.div>

              {/* Control Center Quick Access */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="bg-gradient-to-br from-red-500/20 via-orange-500/20 to-yellow-500/20 rounded-3xl p-6 border border-red-500/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-red-500/30 flex items-center justify-center">
                        <Target className="w-7 h-7 text-red-400" />
                      </div>
                      <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Centre de contrôle</h3>
                      <p className="text-sm text-muted-foreground">Vue temps réel des opérations</p>
                    </div>
                  </div>
                  <Link href="/driver/control-center">
                    <Button className="rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30">
                      Ouvrir
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* QuickGo Pay Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-quickgo-blue/20 to-quickgo-cyan/20 rounded-3xl p-6 border border-quickgo-blue/30"
              >
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-quickgo-blue/30 flex items-center justify-center">
                      <Wallet className="w-8 h-8 text-quickgo-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">QuickGo Pay</h3>
                      <p className="text-sm text-muted-foreground">
                        Encaissez, retirez et gérez vos revenus en toute sécurité.
                      </p>
                      <Button variant="link" className="p-0 h-auto text-quickgo-blue">
                        Accéder au portefeuille
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-end gap-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Solde portefeuille</p>
                      <p className="text-2xl font-bold text-white">125 600 CFA</p>
                      <Button variant="outline" size="sm" className="mt-2 rounded-full">
                        Retirer
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Next Delivery */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Prochaine livraison</h3>
                  <span className="text-quickgo-blue text-sm">Dans 15 min</span>
                </div>

                {/* Route Preview */}
                <div className="relative h-32 bg-gradient-to-br from-quickgo-blue/10 to-quickgo-cyan/10 rounded-xl mb-4 overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Navigation className="w-8 h-8 text-quickgo-blue" />
                  </div>
                  <div className="absolute top-2 left-2 bg-card/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                    Pharmacie du Centre
                  </div>
                  <div className="absolute bottom-2 right-2 bg-card/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                    Rue 2005, Bastos
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Client</p>
                      <p className="text-white font-medium">Marie Claire</p>
                      <p className="text-xs text-muted-foreground">Elig-Essono, Yaoundé</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Challenges & Incentives */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Défis & incitations</h3>
                  <Link href="#" className="text-quickgo-blue text-sm">Voir tout</Link>
                </div>

                {/* Daily Objective */}
                <div className="bg-card/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-quickgo-blue" />
                      <span className="text-white font-medium">Objectif du jour</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-quickgo-lime" />
                      <span className="text-quickgo-lime text-sm">Bonus 15 000 CFA</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">Terminez 10 courses</p>
                  <div className="w-full bg-white/10 rounded-full h-2 mb-1">
                    <div className="bg-quickgo-lime h-2 rounded-full" style={{ width: "70%" }} />
                  </div>
                  <p className="text-xs text-muted-foreground text-right">7 / 10</p>
                </div>

                {/* Streak */}
                <div className="bg-card/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-white font-medium">Série en cours</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="w-6 h-6 text-orange-500" />
                    <span className="text-2xl font-bold text-white">4 jours</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">continuez comme ça !</p>
                  <div className="flex justify-between">
                    {weekDays.map((day) => (
                      <div key={day.day} className="flex flex-col items-center gap-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          day.completed ? "bg-quickgo-lime" : "bg-white/10"
                        }`}>
                          {day.completed && <CheckCircle className="w-4 h-4 text-background" />}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{day.day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Vehicle Status */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">État du véhicule</h3>
                  <Link href="#" className="text-quickgo-blue text-sm">Voir détails</Link>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Battery className="w-4 h-4 text-quickgo-lime" />
                        <span className="text-sm text-muted-foreground">Batterie</span>
                      </div>
                      <span className="text-white font-medium">85%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-quickgo-lime h-2 rounded-full" style={{ width: "85%" }} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Fuel className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm text-muted-foreground">Essence</span>
                      </div>
                      <span className="text-white font-medium">70%</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: "70%" }} />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-quickgo-blue" />
                        <span className="text-sm text-muted-foreground">Entretien</span>
                      </div>
                      <span className="text-quickgo-lime font-medium">Bon état</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="relative w-full h-32">
                      <Image
                        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0022-3YpqZaS4R3zM06zR8StGq3zcBoxjDO.jpg"
                        alt="Honda PCX 125"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Active Mission */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Mission active</h3>
                  <span className="text-xs text-quickgo-lime bg-quickgo-lime/20 px-2 py-1 rounded-full">En cours</span>
                </div>

                <div className="flex items-center gap-3 mb-4 p-3 bg-card/30 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-quickgo-blue/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-quickgo-blue" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Restaurant Le Gourmet</p>
                    <p className="text-xs text-muted-foreground">Rue des Saveurs, Bastos</p>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Client:</span>
                    <span className="text-white">Jean Paul N.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Elig-Essono, Yaoundé</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div className="bg-card/30 rounded-xl p-2">
                    <p className="text-xs text-muted-foreground">Distance</p>
                    <p className="text-white font-semibold">2.8 km</p>
                  </div>
                  <div className="bg-card/30 rounded-xl p-2">
                    <p className="text-xs text-muted-foreground">Gain estimé</p>
                    <p className="text-white font-semibold">2 300 CFA</p>
                  </div>
                  <div className="bg-card/30 rounded-xl p-2">
                    <p className="text-xs text-muted-foreground">Arrivée estimée</p>
                    <p className="text-white font-semibold">12:45</p>
                  </div>
                </div>

                <Button className="w-full bg-quickgo-blue hover:bg-quickgo-blue/90 rounded-xl">
                  Démarrer la livraison
                </Button>
                <Link href="#" className="block text-center text-quickgo-blue text-sm mt-2">
                  Voir les détails
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
