"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  ArrowLeft,
  User,
  Car,
  Bell,
  Shield,
  Save,
  CheckCircle,
  Loader2,
  Phone,
  Mail,
} from "lucide-react"

const VEHICLE_TYPES = [
  { value: "moto",      label: "Moto" },
  { value: "voiture",   label: "Voiture" },
  { value: "velo",      label: "Vélo" },
  { value: "tricycle",  label: "Tricycle" },
]

const TABS = [
  { id: "profile",  label: "Profil",     icon: User   },
  { id: "vehicle",  label: "Véhicule",   icon: Car    },
  { id: "notifs",   label: "Alertes",    icon: Bell   },
  { id: "security", label: "Sécurité",   icon: Shield },
]

export default function DriverSettingsPage() {
  const [tab, setTab]           = useState("profile")
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)

  const [profile, setProfile] = useState({
    fullName:  "",
    phone:     "",
    email:     "",
  })
  const [vehicle, setVehicle] = useState({
    vehicleType:  "moto",
    vehicleBrand: "",
    vehicleModel: "",
    licensePlate: "",
  })
  const [notifs, setNotifs] = useState({
    newMissions:     true,
    earnings:        true,
    appUpdates:      false,
    promotions:      false,
  })

  // Load profile on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async (res: { data: { user: { id: string; email?: string } | null } }) => {
      const user = res.data.user
      if (!user) { setLoading(false); return }

      const [{ data: prof }, { data: driver }] = await Promise.all([
        supabase.from("profiles").select("full_name, phone, email").eq("id", user.id).single(),
        supabase.from("drivers").select("vehicle_type, vehicle_brand, vehicle_model, license_plate, notification_prefs").eq("user_id", user.id).single(),
      ])

      if (prof) {
        setProfile({
          fullName: prof.full_name ?? "",
          phone:    prof.phone    ?? "",
          email:    prof.email    ?? user.email ?? "",
        })
      }
      if (driver) {
        setVehicle({
          vehicleType:  driver.vehicle_type  ?? "moto",
          vehicleBrand: driver.vehicle_brand ?? "",
          vehicleModel: driver.vehicle_model ?? "",
          licensePlate: driver.license_plate ?? "",
        })
        const prefs = driver.notification_prefs as Partial<typeof notifs> | null
        if (prefs) {
          setNotifs(n => ({
            newMissions: prefs.newMissions ?? n.newMissions,
            earnings:    prefs.earnings    ?? n.earnings,
            appUpdates:  prefs.appUpdates  ?? n.appUpdates,
            promotions:  prefs.promotions  ?? n.promotions,
          }))
        }
      }
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Non authentifié")

      if (tab === "profile") {
        const { error: pErr } = await supabase
          .from("profiles")
          .update({ full_name: profile.fullName, phone: profile.phone })
          .eq("id", user.id)
        if (pErr) throw pErr
      }

      if (tab === "vehicle") {
        const { error: dErr } = await supabase
          .from("drivers")
          .update({
            vehicle_type:  vehicle.vehicleType,
            vehicle_brand: vehicle.vehicleBrand || null,
            vehicle_model: vehicle.vehicleModel || null,
            license_plate: vehicle.licensePlate || null,
          })
          .eq("user_id", user.id)
        if (dErr) throw dErr
      }

      if (tab === "notifs") {
        const { error: nErr } = await supabase
          .from("drivers")
          .update({ notification_prefs: notifs })
          .eq("user_id", user.id)
        if (nErr) throw nErr
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30 px-4 lg:px-6 py-4">
        <div className="flex items-center gap-4 max-w-3xl mx-auto">
          <Link href="/driver/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-foreground">Paramètres</h1>
          <div className="ml-auto">
            {saved && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 text-green-400 text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Sauvegardé
              </motion.div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Sidebar tabs */}
            <nav className="lg:col-span-1 space-y-1">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    tab === t.id
                      ? "bg-primary/20 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              ))}
            </nav>

            {/* Content */}
            <div className="lg:col-span-3">
              <motion.div
                key={tab}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card rounded-2xl border border-border/50 p-6 space-y-6"
              >
                {/* ── Profile tab ─────────────────────────────── */}
                {tab === "profile" && (
                  <>
                    <h2 className="text-lg font-semibold text-foreground">Informations personnelles</h2>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="fullName">Nom complet</Label>
                        <div className="relative mt-2">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="fullName"
                            value={profile.fullName}
                            onChange={e => setProfile(p => ({ ...p, fullName: e.target.value }))}
                            className="pl-10 h-11"
                            placeholder="Votre nom complet"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="phone">Téléphone</Label>
                        <div className="relative mt-2">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            value={profile.phone}
                            onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                            className="pl-10 h-11"
                            placeholder="+237 6XX XXX XXX"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <div className="relative mt-2">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="email"
                            value={profile.email}
                            readOnly
                            className="pl-10 h-11 opacity-60 cursor-not-allowed"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">L&apos;email ne peut pas être modifié</p>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Vehicle tab ──────────────────────────────── */}
                {tab === "vehicle" && (
                  <>
                    <h2 className="text-lg font-semibold text-foreground">Informations du véhicule</h2>
                    <div className="space-y-4">
                      <div>
                        <Label>Type de véhicule</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {VEHICLE_TYPES.map(v => (
                            <button
                              key={v.value}
                              type="button"
                              onClick={() => setVehicle(p => ({ ...p, vehicleType: v.value }))}
                              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                                vehicle.vehicleType === v.value
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground hover:border-primary/40"
                              }`}
                            >
                              {v.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      {[
                        { key: "vehicleBrand", label: "Marque",    placeholder: "Ex: Honda" },
                        { key: "vehicleModel", label: "Modèle",    placeholder: "Ex: CB125" },
                        { key: "licensePlate", label: "Immatriculation", placeholder: "Ex: LT 001 CM" },
                      ].map(({ key, label, placeholder }) => (
                        <div key={key}>
                          <Label htmlFor={key}>{label}</Label>
                          <Input
                            id={key}
                            value={(vehicle as Record<string, string>)[key]}
                            onChange={e => setVehicle(p => ({ ...p, [key]: e.target.value }))}
                            className="mt-2 h-11"
                            placeholder={placeholder}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ── Notifications tab ────────────────────────── */}
                {tab === "notifs" && (
                  <>
                    <h2 className="text-lg font-semibold text-foreground">Préférences de notification</h2>
                    <div className="space-y-4">
                      {[
                        { key: "newMissions",  label: "Nouvelles missions disponibles", desc: "Recevez une alerte dès qu'une mission est disponible près de vous" },
                        { key: "earnings",     label: "Revenus et paiements",            desc: "Notifications de paiement et bonus" },
                        { key: "appUpdates",   label: "Mises à jour de l'app",          desc: "Nouvelles fonctionnalités et améliorations" },
                        { key: "promotions",   label: "Promotions et offres spéciales", desc: "Bonus saisonniers et récompenses" },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-start justify-between gap-4 p-4 rounded-xl bg-muted/30">
                          <div>
                            <p className="font-medium text-foreground text-sm">{label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                          </div>
                          <button
                            onClick={() => setNotifs(n => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                            className={`w-11 h-6 rounded-full transition-all flex-shrink-0 relative ${
                              notifs[key as keyof typeof notifs] ? "bg-primary" : "bg-muted"
                            }`}
                          >
                            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                              notifs[key as keyof typeof notifs] ? "right-1" : "left-1"
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* ── Security tab ─────────────────────────────── */}
                {tab === "security" && (
                  <>
                    <h2 className="text-lg font-semibold text-foreground">Sécurité du compte</h2>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <p className="font-medium text-foreground text-sm mb-1">Changer le mot de passe</p>
                        <p className="text-xs text-muted-foreground mb-3">Envoyez un lien de réinitialisation à votre email</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            const supabase = createClient()
                            const { data: { user } } = await supabase.auth.getUser()
                            if (user?.email) {
                              await supabase.auth.resetPasswordForEmail(user.email)
                              alert("Email de réinitialisation envoyé !")
                            }
                          }}
                        >
                          Envoyer le lien
                        </Button>
                      </div>
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                        <p className="font-medium text-foreground text-sm mb-1">Déconnexion</p>
                        <p className="text-xs text-muted-foreground mb-3">Se déconnecter de tous les appareils</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                          onClick={async () => {
                            const supabase = createClient()
                            await supabase.auth.signOut()
                            window.location.href = "/auth/login"
                          }}
                        >
                          Se déconnecter
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {/* Error */}
                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                {/* Save */}
                {tab !== "security" && (
                  <div className="pt-2 border-t border-border/50">
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {saving ? "Sauvegarde…" : "Enregistrer les modifications"}
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
