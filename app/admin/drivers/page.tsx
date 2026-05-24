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
  Star,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Ban,
  ChevronLeft,
  ChevronRight,
  Download,
  UserPlus,
  Bike,
  Car,
  Zap,
} from "lucide-react"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", href: "/admin" },
  { icon: Package, label: "Commandes", href: "/admin/orders" },
  { icon: Truck, label: "Livreurs", href: "/admin/drivers", active: true },
  { icon: Users, label: "Clients", href: "/admin/users" },
  { icon: BarChart3, label: "Analyses", href: "/admin/analytics" },
  { icon: Settings, label: "Paramètres", href: "/admin/settings" },
]

const drivers = [
  {
    id: 1,
    name: "Emmanuel Kamga",
    email: "emmanuel.k@quickgo.cm",
    phone: "+237 677 234 567",
    location: "Yaoundé Centre",
    deliveries: 1247,
    rating: 4.9,
    earnings: "485 000 CFA",
    status: "online",
    vehicle: "moto",
    level: "Gold",
    joined: "15 Mar 2023"
  },
  {
    id: 2,
    name: "Jean Paul Nkodo",
    email: "jp.nkodo@quickgo.cm",
    phone: "+237 690 345 678",
    location: "Yaoundé Nord",
    deliveries: 892,
    rating: 4.8,
    earnings: "356 000 CFA",
    status: "online",
    vehicle: "moto",
    level: "Silver",
    joined: "22 Jun 2023"
  },
  {
    id: 3,
    name: "Christian Bella",
    email: "c.bella@quickgo.cm",
    phone: "+237 655 456 789",
    location: "Douala Akwa",
    deliveries: 2156,
    rating: 4.95,
    earnings: "892 000 CFA",
    status: "delivering",
    vehicle: "voiture",
    level: "Platinum",
    joined: "08 Jan 2023"
  },
  {
    id: 4,
    name: "Steve Mbarga",
    email: "s.mbarga@quickgo.cm",
    phone: "+237 699 567 890",
    location: "Yaoundé Est",
    deliveries: 456,
    rating: 4.6,
    earnings: "178 000 CFA",
    status: "offline",
    vehicle: "moto",
    level: "Bronze",
    joined: "10 Dec 2023"
  },
  {
    id: 5,
    name: "Samuel Ekwe",
    email: "s.ekwe@quickgo.cm",
    phone: "+237 670 678 901",
    location: "Douala Bonaberi",
    deliveries: 78,
    rating: 4.2,
    earnings: "34 000 CFA",
    status: "suspended",
    vehicle: "velo",
    level: "Bronze",
    joined: "01 Feb 2024"
  },
]

const vehicleIcons = {
  moto: Bike,
  voiture: Car,
  velo: Zap,
}

export default function AdminDriversPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         driver.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === "all" || driver.status === selectedStatus
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
                  Gestion des Livreurs
                </h1>
                <p className="text-muted-foreground">
                  {drivers.length} livreurs enregistres
                </p>
              </div>
              <div className="flex items-center gap-3 mt-4 sm:mt-0">
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Exporter
                </Button>
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <UserPlus className="h-4 w-4" />
                  Ajouter
                </Button>
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
            >
              <div className="p-4 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-500/20">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">356</p>
                    <p className="text-xs text-muted-foreground">En ligne</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/20">
                    <Truck className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">124</p>
                    <p className="text-xs text-muted-foreground">En course</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gray-500/20">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">892</p>
                    <p className="text-xs text-muted-foreground">Hors ligne</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-500/20">
                    <Ban className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">12</p>
                    <p className="text-xs text-muted-foreground">Suspendus</p>
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
                  placeholder="Rechercher un livreur..."
                  className="pl-10 bg-card border-border/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {["all", "online", "delivering", "offline", "suspended"].map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus(status)}
                  >
                    {status === "all" ? "Tous" : 
                     status === "online" ? "En ligne" :
                     status === "delivering" ? "En course" :
                     status === "offline" ? "Hors ligne" : "Suspendus"}
                  </Button>
                ))}
              </div>
            </motion.div>

            {/* Drivers Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid md:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              {filteredDrivers.map((driver) => {
                const VehicleIcon = vehicleIcons[driver.vehicle as keyof typeof vehicleIcons] || Bike
                return (
                  <div
                    key={driver.id}
                    className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-lg">
                            {driver.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${
                            driver.status === "online" ? "bg-green-500" :
                            driver.status === "delivering" ? "bg-blue-500" :
                            driver.status === "offline" ? "bg-gray-500" : "bg-red-500"
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-bold text-foreground">{driver.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              driver.level === "Platinum" ? "bg-purple-500/20 text-purple-400" :
                              driver.level === "Gold" ? "bg-yellow-500/20 text-yellow-400" :
                              driver.level === "Silver" ? "bg-gray-400/20 text-gray-300" :
                              "bg-orange-500/20 text-orange-400"
                            }`}>
                              {driver.level}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <VehicleIcon className="h-3 w-3" />
                              {driver.vehicle}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-yellow-400">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm font-bold">{driver.rating}</span>
                      </div>
                    </div>

                    {/* Contact */}
                    <div className="space-y-2 mb-4 text-sm">
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        {driver.email}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {driver.phone}
                      </p>
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {driver.location}
                      </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="p-3 rounded-xl bg-muted/30 text-center">
                        <p className="text-lg font-bold text-foreground">{driver.deliveries}</p>
                        <p className="text-xs text-muted-foreground">Livraisons</p>
                      </div>
                      <div className="p-3 rounded-xl bg-muted/30 text-center">
                        <p className="text-lg font-bold text-green-400">{driver.earnings}</p>
                        <p className="text-xs text-muted-foreground">Revenus</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-1">
                        <Eye className="h-3.5 w-3.5" />
                        Voir
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-1">
                        <Edit className="h-3.5 w-3.5" />
                        Modifier
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300">
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
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
                Affichage 1-5 sur 1 384 livreurs
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="h-8 min-w-8">1</Button>
                <Button variant="ghost" size="sm" className="h-8 min-w-8">2</Button>
                <Button variant="ghost" size="sm" className="h-8 min-w-8">3</Button>
                <span className="text-muted-foreground">...</span>
                <Button variant="ghost" size="sm" className="h-8 min-w-8">277</Button>
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
