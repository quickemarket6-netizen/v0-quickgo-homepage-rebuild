"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  BarChart3,
  Settings,
  Shield,
  Search,
  CheckCircle,
  XCircle,
  Crown,
  UserCog,
  Store,
  Bike,
  User,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react"

const menuItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/admin" },
  { icon: Package, label: "Produits", href: "/admin/products" },
  { icon: Users, label: "Utilisateurs", href: "/admin/users" },
  { icon: Truck, label: "Livraisons", href: "/admin/deliveries" },
  { icon: Store, label: "Vendeurs", href: "/admin/vendors" },
  { icon: BarChart3, label: "Analytiques", href: "/admin/analytics" },
  { icon: Shield, label: "Roles", href: "/admin/roles", active: true },
  { icon: Settings, label: "Parametres", href: "/admin/settings" },
]

const roleIcons: Record<string, React.ElementType> = {
  super_admin: Crown,
  admin: UserCog,
  vendor: Store,
  driver: Bike,
  user: User,
}

const roleColors: Record<string, string> = {
  super_admin: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  admin: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  vendor: "text-green-400 bg-green-400/10 border-green-400/30",
  driver: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  user: "text-gray-400 bg-gray-400/10 border-gray-400/30",
}

const allPermissions = [
  { key: "manage_users", label: "Gerer les utilisateurs", category: "users" },
  { key: "manage_roles", label: "Attribuer des roles", category: "users" },
  { key: "manage_settings", label: "Modifier les parametres", category: "settings" },
  { key: "manage_vendors", label: "Gerer les vendeurs", category: "vendors" },
  { key: "manage_drivers", label: "Gerer les livreurs", category: "drivers" },
  { key: "view_analytics", label: "Voir les analyses", category: "analytics" },
  { key: "manage_orders", label: "Gerer les commandes", category: "orders" },
  { key: "manage_payments", label: "Gerer les paiements", category: "payments" },
  { key: "manage_products", label: "Gerer les produits", category: "products" },
  { key: "view_orders", label: "Voir les commandes", category: "orders" },
  { key: "accept_deliveries", label: "Accepter les livraisons", category: "deliveries" },
  { key: "update_delivery_status", label: "Mettre a jour les statuts", category: "deliveries" },
  { key: "view_earnings", label: "Voir les gains", category: "earnings" },
  { key: "place_orders", label: "Passer des commandes", category: "orders" },
  { key: "track_orders", label: "Suivre les commandes", category: "orders" },
  { key: "manage_profile", label: "Gerer son profil", category: "profile" },
]

interface UserWithRole {
  id: string
  email: string
  full_name: string
  role: string
  permissions: string[]
  avatar_url?: string
}

export default function AdminRolesPage() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([])
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [roleFilter, setRoleFilter] = useState("all")

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    let filtered = users
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (roleFilter !== "all") {
      filtered = filtered.filter(u => u.role === roleFilter)
    }
    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter])

  async function loadUsers() {
    try {
      const supabase = createClient()
      
      // Get all profiles with their roles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, role")
        .order("created_at", { ascending: false })

      // Get role permissions
      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id, role, permissions")

      const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
        const roleData = userRoles?.find(r => r.user_id === profile.id)
        return {
          id: profile.id,
          email: profile.email || "",
          full_name: profile.full_name || "Utilisateur",
          role: roleData?.role || profile.role || "user",
          permissions: roleData?.permissions || [],
          avatar_url: profile.avatar_url
        }
      })

      setUsers(usersWithRoles)
      setFilteredUsers(usersWithRoles)
    } catch (error) {
      console.error("Error loading users:", error)
    } finally {
      setLoading(false)
    }
  }

  async function updateUserRole(userId: string, newRole: string, permissions: string[]) {
    setSaving(true)
    try {
      const supabase = createClient()
      
      // Update user_roles table
      const { error } = await supabase
        .from("user_roles")
        .upsert({
          user_id: userId,
          role: newRole,
          permissions: permissions,
          updated_at: new Date().toISOString()
        }, { onConflict: "user_id" })

      if (error) throw error

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, role: newRole, permissions } : u
      ))
      
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, role: newRole, permissions })
      }

    } catch (error) {
      console.error("Error updating role:", error)
    } finally {
      setSaving(false)
    }
  }

  function togglePermission(permission: string) {
    if (!selectedUser) return
    
    const newPermissions = selectedUser.permissions.includes(permission)
      ? selectedUser.permissions.filter(p => p !== permission)
      : [...selectedUser.permissions, permission]
    
    setSelectedUser({ ...selectedUser, permissions: newPermissions })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex pt-16">
        {/* Sidebar */}
        <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-card border-r border-border overflow-y-auto hidden lg:block">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">Gestion Roles</h2>
                <p className="text-xs text-muted-foreground">Super Admin</p>
              </div>
            </div>

            <nav className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    item.active 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-6">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gestion des Roles</h1>
                <p className="text-muted-foreground">Attribuez et gerez les permissions des utilisateurs</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Users List */}
              <div className="lg:col-span-2 space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un utilisateur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-background border border-border text-foreground"
                  >
                    <option value="all">Tous les roles</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="vendor">Vendeur</option>
                    <option value="driver">Livreur</option>
                    <option value="user">Utilisateur</option>
                  </select>
                </div>

                {/* Users Grid */}
                <div className="grid gap-3">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucun utilisateur trouve</p>
                    </div>
                  ) : (
                    filteredUsers.map((user) => {
                      const RoleIcon = roleIcons[user.role] || User
                      return (
                        <motion.div
                          key={user.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`p-4 rounded-xl border cursor-pointer transition-all ${
                            selectedUser?.id === user.id 
                              ? "bg-primary/10 border-primary" 
                              : "bg-card border-border hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <User className="h-5 w-5 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{user.full_name}</p>
                              <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${roleColors[user.role]}`}>
                              <RoleIcon className="h-4 w-4" />
                              <span className="text-xs font-medium capitalize">{user.role.replace("_", " ")}</span>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Permissions Panel */}
              <div className="lg:col-span-1">
                {selectedUser ? (
                  <div className="sticky top-20 p-6 rounded-2xl bg-card border border-border">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{selectedUser.full_name}</p>
                        <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                      </div>
                    </div>

                    {/* Role Selector */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-foreground mb-2">
                        Role
                      </label>
                      <select
                        value={selectedUser.role}
                        onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground"
                      >
                        <option value="user">Utilisateur</option>
                        <option value="vendor">Vendeur</option>
                        <option value="driver">Livreur</option>
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>

                    {/* Permissions */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-foreground mb-3">
                        Permissions
                      </label>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {allPermissions.map((perm) => (
                          <label
                            key={perm.key}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedUser.permissions.includes(perm.key)}
                              onChange={() => togglePermission(perm.key)}
                              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-foreground">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Save Button */}
                    <Button
                      onClick={() => updateUserRole(selectedUser.id, selectedUser.role, selectedUser.permissions)}
                      disabled={saving}
                      className="w-full gap-2"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Sauvegarder
                    </Button>
                  </div>
                ) : (
                  <div className="sticky top-20 p-6 rounded-2xl bg-card border border-border text-center">
                    <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      Selectionnez un utilisateur pour gerer ses permissions
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
