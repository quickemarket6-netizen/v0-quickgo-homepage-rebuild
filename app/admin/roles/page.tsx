"use client"

import { useState, useEffect } from "react"
import type { ElementType } from "react"
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
  { icon: Shield, label: "Rôles", href: "/admin/roles", active: true },
  { icon: Settings, label: "Paramètres", href: "/admin/settings" },
]

interface UserWithRole {
  id: string
  email: string
  full_name: string
  role: string
  permissions: string[]
  avatar_url?: string
}

interface Profile {
  id: string
  email?: string
  full_name?: string
  role?: string
  avatar_url?: string
}

interface UserRole {
  user_id: string
  role: string
  permissions: string[]
}

const roleIcons: Record<string, ElementType> = {
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
  "manage_users",
  "manage_roles",
  "manage_settings",
  "manage_vendors",
  "manage_drivers",
  "view_analytics",
  "manage_orders",
  "manage_payments",
  "manage_products",
  "view_orders",
  "accept_deliveries",
  "update_delivery_status",
  "view_earnings",
  "place_orders",
  "track_orders",
  "manage_profile",
]

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
      filtered = filtered.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, roleFilter])

  async function loadUsers() {
    try {
      const supabase = createClient()

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,email,full_name,avatar_url,role")

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id,role,permissions")

      const usersWithRoles: UserWithRole[] = (profiles as Profile[]).map(
        (profile: Profile) => {
          const roleData = (userRoles as UserRole[])?.find(
            (r) => r.user_id === profile.id
          )

          return {
            id: profile.id,
            email: profile.email || "",
            full_name: profile.full_name || "Utilisateur",
            role: roleData?.role || profile.role || "user",
            permissions: roleData?.permissions || [],
            avatar_url: profile.avatar_url,
          }
        }
      )

      setUsers(usersWithRoles)
      setFilteredUsers(usersWithRoles)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function updateUserRole(
    userId: string,
    newRole: string,
    permissions: string[]
  ) {
    setSaving(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("user_roles").upsert(
        {
          user_id: userId,
          role: newRole,
          permissions,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )

      if (error) throw error

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: newRole, permissions } : u
        )
      )
    } catch (error) {
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  function togglePermission(permission: string) {
    if (!selectedUser) return

    const updated = selectedUser.permissions.includes(permission)
      ? selectedUser.permissions.filter((p) => p !== permission)
      : [...selectedUser.permissions, permission]

    setSelectedUser({
      ...selectedUser,
      permissions: updated,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 px-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Gestion des rôles</h1>

        {loading ? (
          <Loader2 className="animate-spin" />
        ) : filteredUsers.length === 0 ? (
          <AlertCircle />
        ) : (
          filteredUsers.map((user) => {
            const RoleIcon = roleIcons[user.role] || User

            return (
              <motion.div
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className="p-4 border rounded-xl mb-4 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p>{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>

                  <div
                    className={`px-3 py-1 rounded-full border flex gap-2 items-center ${roleColors[user.role]}`}
                  >
                    <RoleIcon className="h-4 w-4" />
                    {user.role}
                  </div>
                </div>
              </motion.div>
            )
          })
        )}

        {selectedUser && (
          <div className="mt-8 border rounded-xl p-6">
            <h2 className="font-bold mb-4">{selectedUser.full_name}</h2>

            <div className="space-y-2">
              {allPermissions.map((perm) => (
                <label key={perm} className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={selectedUser.permissions.includes(perm)}
                    onChange={() => togglePermission(perm)}
                  />
                  {perm}
                </label>
              ))}
            </div>

            <Button
              className="mt-6"
              disabled={saving}
              onClick={() =>
                updateUserRole(
                  selectedUser.id,
                  selectedUser.role,
                  selectedUser.permissions
                )
              }
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              Sauvegarder
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}