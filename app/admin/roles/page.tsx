"use client"

import { useState, useEffect } from "react"
import type { ElementType } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import {
  Search, Crown, UserCog, Store, Bike, User,
  Save, Loader2, AlertCircle, CheckCircle2, XCircle,
} from "lucide-react"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"

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
  admin:       "text-blue-400   bg-blue-400/10   border-blue-400/30",
  vendor:      "text-green-400  bg-green-400/10  border-green-400/30",
  driver:      "text-orange-400 bg-orange-400/10 border-orange-400/30",
  user:        "text-[#6b6b8a]  bg-[#16161f]     border-[#1e1e2e]",
}

const allRoles = ["super_admin", "admin", "vendor", "driver", "user"]

const allPermissions = [
  "manage_users",         "manage_roles",          "manage_settings",
  "manage_vendors",       "manage_drivers",        "view_analytics",
  "manage_orders",        "manage_payments",       "manage_products",
  "view_orders",          "accept_deliveries",     "update_delivery_status",
  "view_earnings",        "place_orders",          "track_orders",
  "manage_profile",
]

type ToastType = "success" | "error" | null

export default function AdminRolesPage() {
  const [users, setUsers] = useState<UserWithRole[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserWithRole[]>([])
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [roleFilter, setRoleFilter] = useState("all")
  const [toast, setToast] = useState<{ type: ToastType; message: string }>({ type: null, message: "" })

  useEffect(() => { loadUsers() }, [])

  useEffect(() => {
    let filtered = users
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (roleFilter !== "all") filtered = filtered.filter(u => u.role === roleFilter)
    setFilteredUsers(filtered)
    if (selectedUser && !filtered.find(u => u.id === selectedUser.id)) setSelectedUser(null)
  }, [users, searchTerm, roleFilter])

  function showToast(type: ToastType, message: string) {
    setToast({ type, message })
    setTimeout(() => setToast({ type: null, message: "" }), 3000)
  }

  async function loadUsers() {
    try {
      const supabase = createClient()
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles").select("id,email,full_name,avatar_url,role")
      if (profilesError) throw profilesError

      const { data: userRoles } = await supabase
        .from("user_roles").select("user_id,role,permissions")

      const usersWithRoles: UserWithRole[] = ((profiles as Profile[]) ?? []).map(profile => {
        const roleData = (userRoles as UserRole[])?.find(r => r.user_id === profile.id)
        return {
          id:         profile.id,
          email:      profile.email      || "",
          full_name:  profile.full_name  || "Utilisateur",
          role:       roleData?.role     || profile.role || "user",
          permissions: roleData?.permissions || [],
          avatar_url: profile.avatar_url,
        }
      })

      setUsers(usersWithRoles)
      setFilteredUsers(usersWithRoles)
    } catch (error) {
      console.error(error)
      showToast("error", "Impossible de charger les utilisateurs.")
    } finally {
      setLoading(false)
    }
  }

  async function updateUserRole(userId: string, newRole: string, permissions: string[]) {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("user_roles").upsert(
        { user_id: userId, role: newRole, permissions, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      )
      if (error) throw error
      const updatedUser = { ...selectedUser!, role: newRole, permissions }
      setUsers(prev => prev.map(u => (u.id === userId ? updatedUser : u)))
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
      ? selectedUser.permissions.filter(p => p !== permission)
      : [...selectedUser.permissions, permission]
    setSelectedUser({ ...selectedUser, permissions: updated })
  }

  function changeSelectedRole(newRole: string) {
    if (!selectedUser) return
    setSelectedUser({ ...selectedUser, role: newRole })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <AdminSidebar />

      <main className="flex-1 overflow-auto px-8 py-8 text-white">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}>
          <h1 className="text-3xl font-bold mb-2 text-white">Gestion des rôles</h1>
          <p className="text-[#6b6b8a] mb-8">Attribuez des rôles et des permissions aux utilisateurs.</p>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6b6b8a]" />
            <Input
              className="pl-9 bg-[#16161f] border-[#1e1e2e] text-white placeholder:text-[#6b6b8a] focus:border-blue-500"
              placeholder="Rechercher par nom ou email…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="border border-[#1e1e2e] rounded-md px-3 py-2 text-sm bg-[#16161f] text-white"
          >
            <option value="all">Tous les rôles</option>
            {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </motion.div>

        {/* User list */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin h-8 w-8 text-[#6b6b8a]" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center py-20 gap-3 text-[#6b6b8a]">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">Aucun utilisateur trouvé.</p>
          </motion.div>
        ) : (
          <div className="grid gap-3">
            {filteredUsers.map((user, i) => {
              const RoleIcon = roleIcons[user.role] || User
              const isSelected = selectedUser?.id === user.id
              return (
                <motion.div
                  key={user.id}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.4), ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setSelectedUser(isSelected ? null : { ...user })}
                  className={`p-4 border rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "border-blue-500/30 bg-blue-600/10"
                      : "border-[#1e1e2e] bg-[#16161f] hover:bg-[#1e1e2e]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{user.full_name}</p>
                      <p className="text-sm text-[#6b6b8a]">{user.email}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full border flex gap-2 items-center text-sm ${roleColors[user.role] || roleColors.user}`}>
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
              className="mt-8 border border-[#1e1e2e] rounded-xl p-6 bg-[#16161f]"
            >
              <h2 className="font-bold text-lg mb-1 text-white">{selectedUser.full_name}</h2>
              <p className="text-sm text-[#6b6b8a] mb-6">{selectedUser.email}</p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-2">Rôle</label>
                <select
                  value={selectedUser.role}
                  onChange={e => changeSelectedRole(e.target.value)}
                  className="border border-[#1e1e2e] rounded-md px-3 py-2 text-sm bg-[#0a0a0f] text-white w-full max-w-xs"
                >
                  {allRoles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-white mb-3">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {allPermissions.map(perm => (
                    <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer select-none text-[#6b6b8a] hover:text-white transition-colors">
                      <input
                        type="checkbox"
                        className="rounded border-[#1e1e2e] bg-[#0a0a0f] accent-blue-500"
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
                onClick={() => updateUserRole(selectedUser.id, selectedUser.role, selectedUser.permissions)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving
                  ? <Loader2 className="animate-spin h-4 w-4 mr-2" />
                  : <Save className="h-4 w-4 mr-2" />}
                Sauvegarder
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Toast */}
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
            {toast.type === "success"
              ? <CheckCircle2 className="h-4 w-4 shrink-0" />
              : <XCircle className="h-4 w-4 shrink-0" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
