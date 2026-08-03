"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  Globe,
  LogOut,
  ChevronRight,
  Camera,
  Save,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

const sections = [
  { id: "profile", label: "Profil", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Sécurité", icon: Shield },
  { id: "language", label: "Langue & Région", icon: Globe },
]

export default function DashboardSettingsPage() {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("profile")
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [notifications, setNotifications] = useState({
    orders: true,
    promotions: true,
    delivery: true,
    newsletter: false,
  })

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }: { data: { user: import("@supabase/supabase-js").User | null } }) => {
      if (!data.user) { router.push("/auth/login"); return }
      setUser(data.user)
      setFullName(data.user.user_metadata?.full_name || "")
      setPhone(data.user.user_metadata?.phone || "")
      const savedNotifs = data.user.user_metadata?.notifications
      if (savedNotifs && typeof savedNotifs === "object") {
        setNotifications((prev) => ({ ...prev, ...savedNotifs }))
      }
      const { data: prof } = await supabase
        .from("profiles").select("avatar_url").eq("id", data.user.id).single()
      if (prof?.avatar_url) setAvatarUrl(prof.avatar_url)
    })
  }, [router])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const body = new FormData()
      body.append("file", file)
      const res = await fetch("/api/profile/avatar", { method: "POST", body })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Échec de l'envoi")
      setAvatarUrl(data.url)
      toast.success("Photo de profil mise à jour")
    } catch (err) {
      toast.error("Erreur", { description: err instanceof Error ? err.message : "Échec de l'envoi" })
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSaveProfile = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, phone },
    })
    setIsLoading(false)
    if (error) {
      toast.error("Erreur", { description: error.message })
    } else {
      toast.success("Profil mis à jour")
    }
  }

  const handleSaveNotifications = async () => {
    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      data: { notifications },
    })
    setIsLoading(false)
    if (error) {
      toast.error("Erreur", { description: error.message })
    } else {
      toast.success("Préférences sauvegardées")
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 pt-20 pb-20">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </Link>

        <h1 className="text-2xl font-bold text-white mb-8">Paramètres</h1>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="space-y-1">
            {sections.map((s) => (
              <button key={s.id} onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  activeSection === s.id ? "bg-quickgo-blue/20 text-quickgo-blue" : "text-muted-foreground hover:bg-card/50 hover:text-white"
                }`}>
                <s.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{s.label}</span>
              </button>
            ))}
            <button onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-left">
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Se déconnecter</span>
            </button>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <motion.div key={activeSection} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              className="bg-card/50 rounded-3xl border border-border/30 p-6">

              {activeSection === "profile" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-white">Informations personnelles</h2>

                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center text-white text-2xl font-bold">
                        {avatarUrl ? (
                          <Image src={avatarUrl} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" />
                        ) : (
                          fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "?"
                        )}
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-quickgo-blue text-white disabled:opacity-60"
                        aria-label="Changer la photo de profil"
                      >
                        {uploadingAvatar ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                      </button>
                    </div>
                    <div>
                      <p className="text-white font-semibold">{fullName || "Votre nom"}</p>
                      <p className="text-muted-foreground text-sm">{user?.email}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Nom complet</label>
                      <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Votre nom complet" className="h-12 bg-background/50 border-border/50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Email</label>
                      <Input value={user?.email || ""} disabled className="h-12 bg-background/50 border-border/50 opacity-60" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Téléphone</label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+237 6XX XX XX XX" className="h-12 bg-background/50 border-border/50" />
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={isLoading} className="rounded-xl h-12 bg-quickgo-blue hover:bg-quickgo-blue/90">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Sauvegarder
                  </Button>
                </div>
              )}

              {activeSection === "notifications" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-white">Préférences de notifications</h2>
                  <div className="space-y-4">
                    {[
                      { key: "orders", label: "Mises à jour commandes", desc: "Statut de livraison en temps réel" },
                      { key: "promotions", label: "Offres et promotions", desc: "Deals exclusifs et remises" },
                      { key: "delivery", label: "Alertes livraison", desc: "Livreur en route, arrivée imminente" },
                      { key: "newsletter", label: "Newsletter mensuelle", desc: "Nouveautés et actualités QuickGo" },
                    ].map((n) => (
                      <div key={n.key} className="flex items-center justify-between p-4 rounded-2xl bg-background/30 border border-border/20">
                        <div>
                          <p className="text-white font-medium text-sm">{n.label}</p>
                          <p className="text-xs text-muted-foreground">{n.desc}</p>
                        </div>
                        <button onClick={() => setNotifications((prev) => ({ ...prev, [n.key]: !prev[n.key as keyof typeof prev] }))}
                          className={`relative w-12 h-6 rounded-full transition-all ${notifications[n.key as keyof typeof notifications] ? "bg-quickgo-blue" : "bg-muted"}`}>
                          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${notifications[n.key as keyof typeof notifications] ? "left-7" : "left-1"}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleSaveNotifications} disabled={isLoading} className="rounded-xl h-12 bg-quickgo-blue hover:bg-quickgo-blue/90">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Sauvegarder
                  </Button>
                </div>
              )}

              {activeSection === "security" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-white">Sécurité du compte</h2>
                  {[
                    { label: "Changer le mot de passe", desc: "Recevez un lien de réinitialisation par email", href: "/auth/forgot-password" },
                    { label: "Sécurité du portefeuille", desc: "Code PIN et appareils autorisés", href: "/wallet/security" },
                  ].map((item) => (
                    <Link key={item.label} href={item.href}
                      className="flex items-center justify-between p-4 rounded-2xl bg-background/30 border border-border/20 hover:border-quickgo-blue/50 transition-all">
                      <div>
                        <p className="text-white font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </Link>
                  ))}
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 font-medium text-sm mb-1">Zone de danger</p>
                    <p className="text-muted-foreground text-xs mb-3">La suppression de votre compte est irréversible.</p>
                    <Button variant="outline" size="sm" className="text-red-400 border-red-500/30 hover:bg-red-500/10">
                      Supprimer mon compte
                    </Button>
                  </div>
                </div>
              )}

              {activeSection === "language" && (
                <div className="space-y-6">
                  <h2 className="text-lg font-bold text-white">Langue & Région</h2>
                  {[
                    { label: "Langue", value: "Français" },
                    { label: "Pays", value: "Cameroun 🇨🇲" },
                    { label: "Devise", value: "Franc CFA (FCFA)" },
                    { label: "Fuseau horaire", value: "WAT (UTC+1)" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-4 rounded-2xl bg-background/30 border border-border/20">
                      <p className="text-muted-foreground text-sm">{item.label}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium text-sm">{item.value}</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
