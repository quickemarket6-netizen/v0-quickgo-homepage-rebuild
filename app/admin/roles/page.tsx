"use client"

import { useState, useEffect } from "react"
import type { ElementType } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  CheckCircle2,
  XCircle,
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

const allRoles = ["super_admin", "admin", "vendor", "driver", "user"]

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

type ToastType = "success" | "error" | null

export default function AdminRolesPage() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([])
  // FIX #3: selectedUser now holds a local draft copy, separate from users state
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [roleFilter, setRoleFilter] = useState("all")
  // FIX #4: Toast feedback state
  const [toast, setToast] = useState<{ type: ToastType; message: string }>({
    type: null,
    message: "",
  })

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

    // FIX #10: If the selected user is no longer in filtered list, deselect them
    if (selectedUser && !filtered.find((u) => u.id === selectedUser.id)) {
      setSelectedUser(null)
    }
  }, [users, searchTerm, roleFilter])

  function showToast(type: ToastType, message: string) {
    setToast({ type, message })
    setTimeout(() => setToast({ type: null, message: "" }), 3000)
  }

  async function loadUsers() {
    try {
      const supabase = createClient()

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id,email,full_name,avatar_url,role")

      if (profilesError) throw profilesError

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("user_id,role,permissions")

      // FIX #6: Guard against null profiles
      const usersWithRoles: UserWithRole[] = (profiles as Profile[] ?? []).map(
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
      showToast("error", "Impossible de charger les utilisateurs.")
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

      // FIX #3: Update both users list AND selectedUser so they stay in sync
      const updatedUser = { ...selectedUser!, role: newRole, permissions }
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? updatedUser : u))
      )
      setSelectedUser(updatedUser)

      showToast("success", "Rôle et permissions mis à jour avec succès.")
    } catch (error) {
      console.error(error)
      showToast("error", "Erreur lors de la sauvegarde. Réessayez.")
    } finally {
      setSaving(false)
    }
  }

  function togglePermission(permission: string) {
    if (!selectedUser) return

    const updated = selectedUser.permissions.includes(permission)
      ? selectedUser.permissions.filter((p) => p !== permission)
      : [...selectedUser.permissions, permission]

    setSelectedUser({ ...selectedUser, permissions: updated })
  }

  // FIX #2: Handler to change the role of the selected user (draft only, saved on submit)
  function changeSelectedRole(newRole: string) {
    if (!selectedUser) return
    setSelectedUser({ ...selectedUser, role: newRole })
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="flex pt-20">
        {/* FIX #5: Sidebar now actually rendered */}
        <aside className="w-64 min-h-screen border-r px-4 py-6 flex flex-col gap-1 shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
            Administration
          </p>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                item.active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </aside>

        <main className="flex-1 px-8 py-8 max-w-5xl">
          <h1 className="text-3xl font-bold mb-2">Gestion des rôles</h1>
          <p className="text-muted-foreground mb-8">
            Attribuez des rôles et des permissions aux utilisateurs.
          </p>

          {/* FIX #1: Search bar and role filter now rendered */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Rechercher par nom ou email…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border rounded-md px-3 py-2 text-sm bg-background text-foreground"
            >
              <option value="all">Tous les rôles</option>
              {allRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin h-8 w-8 text-muted-foreground" />
            </div>
          ) : filteredUsers.length === 0 ? (
            // FIX #8: AlertCircle now has an explanatory message
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm">Aucun utilisateur trouvé.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredUsers.map((user) => {
                const RoleIcon = roleIcons[user.role] || User
                const isSelected = selectedUser?.id === user.id

                return (
                  <motion.div
                    key={user.id}
                    layout
                    onClick={() =>
                      setSelectedUser(isSelected ? null : { ...user })
                    }
                    className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full border flex gap-2 items-center text-sm ${roleColors[user.role] || roleColors.user}`}
                      >
                        <RoleIcon className="h-4 w-4" />
                        {user.role}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Edit panel */}
          <AnimatePresence>
            {selectedUser && (
              <motion.div
                key={selectedUser.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.2 }}
                className="mt-8 border rounded-xl p-6"
              >
                <h2 className="font-bold text-lg mb-1">
                  {selectedUser.full_name}
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  {selectedUser.email}
                </p>

                {/* FIX #2: Role selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">
                    Rôle
                  </label>
                  <select
                    value={selectedUser.role}
                    onChange={(e) => changeSelectedRole(e.target.value)}
                    className="border rounded-md px-3 py-2 text-sm bg-background text-foreground w-full max-w-xs"
                  >
                    {allRoles.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Permissions */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">
                    Permissions
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {allPermissions.map((perm) => (
                      <label
                        key={perm}
                        className="flex items-center gap-2 text-sm cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          className="rounded"
                          checked={selectedUser.permissions.includes(perm)}
                          onChange={() => togglePermission(perm)}
                        />
                        {perm}
                      </label>
                    ))}
                  </div>
                </div>

                <Button
                  disabled={saving}
                  onClick={() =>
                    updateUserRole(
                      selectedUser.id,
                      selectedUser.role,
                      selectedUser.permissions
                    )
                  }
                >
                  {saving ? (
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* FIX #4: Toast notification */}
      <AnimatePresence>
        {toast.type && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              toast.type === "success"
                ? "bg-green-950 border-green-700 text-green-300"
                : "bg-red-950 border-red-700 text-red-300"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 shrink-0" />
            )}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
