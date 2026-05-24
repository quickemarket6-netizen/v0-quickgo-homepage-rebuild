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
  Filter,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  UserPlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", href: "/admin" },
  { icon: Package, label: "Commandes", href: "/admin/orders" },
  { icon: Truck, label: "Livreurs", href: "/admin/drivers" },
  { icon: Users, label: "Clients", href: "/admin/users", active: true },
  { icon: BarChart3, label: "Analyses", href: "/admin/analytics" },
  { icon: Settings, label: "Paramètres", href: "/admin/settings" },
]

const users = [
  {
    id: 1,
    name: "Marie Claire Ngo",
    email: "marie.claire@email.com",
    phone: "+237 690 123 456",
    location: "Bastos, Yaoundé",
    orders: 47,
    spent: "245 000 CFA",
    status: "active",
    joined: "12 Jan 2024",
    avatar: "MC"
  },
  {
    id: 2,
    name: "Emmanuel Kamga",
    email: "emmanuel.k@email.com",
    phone: "+237 677 234 567",
    location: "Mvog-Ada, Yaoundé",
    orders: 32,
    spent: "156 000 CFA",
    status: "active",
    joined: "28 Feb 2024",
    avatar: "EK"
  },
  {
    id: 3,
    name: "Patricia Ndam",
    email: "patricia.n@email.com",
    phone: "+237 655 345 678",
    location: "Douala, Bonapriso",
    orders: 89,
    spent: "478 000 CFA",
    status: "vip",
    joined: "05 Nov 2023",
    avatar: "PN"
  },
  {
    id: 4,
    name: "Samuel Djomou",
    email: "samuel.d@email.com",
    phone: "+237 699 456 789",
    location: "Essos, Yaoundé",
    orders: 12,
    spent: "67 000 CFA",
    status: "inactive",
    joined: "18 Mar 2024",
    avatar: "SD"
  },
  {
    id: 5,
    name: "Celine Mbarga",
    email: "celine.m@email.com",
    phone: "+237 670 567 890",
    location: "Akwa, Douala",
    orders: 56,
    spent: "289 000 CFA",
    status: "active",
    joined: "22 Dec 2023",
    avatar: "CM"
  },
  {
    id: 6,
    name: "Jean Pierre Fouda",
    email: "jp.fouda@email.com",
    phone: "+237 691 678 901",
    location: "Nlongkak, Yaoundé",
    orders: 3,
    spent: "18 000 CFA",
    status: "suspended",
    joined: "01 Apr 2024",
    avatar: "JF"
  },
]

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = selectedStatus === "all" || user.status === selectedStatus
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
                  Gestion des Clients
                </h1>
                <p className="text-muted-foreground">
                  {users.length} clients enregistres
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

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col sm:flex-row gap-4 mb-6"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un client..."
                  className="pl-10 bg-card border-border/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                {["all", "active", "vip", "inactive", "suspended"].map((status) => (
                  <Button
                    key={status}
                    variant={selectedStatus === status ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedStatus(status)}
                    className="capitalize"
                  >
                    {status === "all" ? "Tous" : status}
                  </Button>
                ))}
              </div>
            </motion.div>

            {/* Stats Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
            >
              <div className="p-4 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/20">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">12 458</p>
                    <p className="text-xs text-muted-foreground">Total clients</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-green-500/20">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">10 234</p>
                    <p className="text-xs text-muted-foreground">Actifs</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-yellow-500/20">
                    <Users className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">856</p>
                    <p className="text-xs text-muted-foreground">VIP</p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-red-500/20">
                    <Ban className="h-5 w-5 text-red-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">45</p>
                    <p className="text-xs text-muted-foreground">Suspendus</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Users Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-card border border-border/50 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Client</th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Contact</th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Commandes</th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Depenses</th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Statut</th>
                      <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Inscription</th>
                      <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
                              {user.avatar}
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{user.name}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {user.location}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {user.email}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-medium text-foreground">{user.orders}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm font-medium text-foreground">{user.spent}</p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.status === "active" 
                              ? "bg-green-500/20 text-green-400"
                              : user.status === "vip"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : user.status === "inactive"
                              ? "bg-gray-500/20 text-gray-400"
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {user.status === "active" ? "Actif" : 
                             user.status === "vip" ? "VIP" :
                             user.status === "inactive" ? "Inactif" : "Suspendu"}
                          </span>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {user.joined}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between p-4 border-t border-border/50">
                <p className="text-sm text-muted-foreground">
                  Affichage 1-6 sur 12 458 clients
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 min-w-8">1</Button>
                  <Button variant="ghost" size="sm" className="h-8 min-w-8">2</Button>
                  <Button variant="ghost" size="sm" className="h-8 min-w-8">3</Button>
                  <span className="text-muted-foreground">...</span>
                  <Button variant="ghost" size="sm" className="h-8 min-w-8">2076</Button>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  )
}
