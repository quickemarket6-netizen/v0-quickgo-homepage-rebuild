"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Shield, Lock, Smartphone, Eye, Bell, CheckCircle, AlertTriangle, Loader2, LogOut, X } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

const securityFeatures = [
  { icon: Lock, title: "Chiffrement AES-256", desc: "Toutes vos données sont chiffrées de bout en bout", enabled: true },
  { icon: Smartphone, title: "Authentification 2FA", desc: "Vérification en deux étapes pour chaque connexion", enabled: true },
  { icon: Bell, title: "Alertes de transaction", desc: "Notification instantanée pour chaque paiement", enabled: true },
  { icon: Eye, title: "Masquage du solde", desc: "Cachez votre solde sur l'écran d'accueil", enabled: false },
]

export default function WalletSecurityPage() {
  const [features, setFeatures] = useState(securityFeatures)
  const [showPinModal, setShowPinModal] = useState(false)
  const [showDevicesModal, setShowDevicesModal] = useState(false)
  const [hasPin, setHasPin] = useState(false)
  const [currentPin, setCurrentPin] = useState("")
  const [newPin, setNewPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [pinSubmitting, setPinSubmitting] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState("")

  useEffect(() => {
    fetch("/api/wallet/security/pin")
      .then((r) => r.json())
      .then((data) => setHasPin(Boolean(data.has_pin)))
      .catch(() => {})
    setDeviceInfo(typeof navigator !== "undefined" ? navigator.userAgent : "")
  }, [])

  const toggle = (i: number) => {
    setFeatures((f) => f.map((item, idx) => idx === i ? { ...item, enabled: !item.enabled } : item))
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^\d{4,6}$/.test(newPin)) {
      toast.error("Le PIN doit contenir 4 à 6 chiffres")
      return
    }
    if (newPin !== confirmPin) {
      toast.error("Les deux PIN ne correspondent pas")
      return
    }
    setPinSubmitting(true)
    try {
      const res = await fetch("/api/wallet/security/pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: newPin, current_pin: hasPin ? currentPin : undefined }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(hasPin ? "Code PIN modifié" : "Code PIN défini")
        setHasPin(true)
        setShowPinModal(false)
        setCurrentPin(""); setNewPin(""); setConfirmPin("")
      } else {
        toast.error(data.error ?? "Erreur lors de la mise à jour du PIN")
      }
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setPinSubmitting(false)
    }
  }

  const handleSignOutOthers = async () => {
    setSigningOut(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut({ scope: "others" })
      if (error) toast.error("Erreur lors de la déconnexion des autres appareils")
      else toast.success("Tous les autres appareils ont été déconnectés")
    } catch {
      toast.error("Erreur inattendue")
    } finally {
      setSigningOut(false)
    }
  }

  // Compact human label for the current device from the user agent
  const deviceLabel = (() => {
    if (/Android/i.test(deviceInfo)) return "Android"
    if (/iPhone|iPad/i.test(deviceInfo)) return "iOS"
    if (/Windows/i.test(deviceInfo)) return "Windows"
    if (/Mac/i.test(deviceInfo)) return "macOS"
    if (/Linux/i.test(deviceInfo)) return "Linux"
    return "Appareil inconnu"
  })()

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24 pb-20">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <Link href="/wallet" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour au portefeuille
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-white mb-1">Sécurité du portefeuille</h1>
            <p className="text-muted-foreground mb-8">Votre argent est protégé par plusieurs niveaux de sécurité</p>

            {/* Security Score */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-500/30 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <p className="text-green-400 text-sm font-medium">Score de sécurité</p>
                  <p className="text-3xl font-black text-white">{hasPin ? "92/100" : "78/100"}</p>
                  <p className="text-muted-foreground text-xs">
                    {hasPin ? "Excellent — votre compte est bien protégé" : "Définissez un code PIN pour renforcer la protection"}
                  </p>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3 mb-6">
              {features.map((f, i) => (
                <motion.div key={f.title} whileHover={{ scale: 1.01 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-card/50 border border-border/30">
                  <div className={`p-2.5 rounded-xl ${f.enabled ? "bg-green-500/20" : "bg-muted/50"}`}>
                    <f.icon className={`w-5 h-5 ${f.enabled ? "text-green-400" : "text-muted-foreground"}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                  <button onClick={() => toggle(i)}
                    className={`relative w-12 h-6 rounded-full transition-all ${f.enabled ? "bg-green-500" : "bg-muted"}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${f.enabled ? "left-7" : "left-1"}`} />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="p-5 rounded-2xl bg-card/50 border border-border/30 mb-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Activité récente
              </h3>
              {[
                { action: "Connexion depuis Yaoundé", time: "Il y a 2 min", ok: true },
                { action: "Paiement Orange Money 50 000 CFA", time: "Il y a 1h", ok: true },
                { action: "Tentative de connexion inconnue", time: "Il y a 3 jours", ok: false },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                  <div className={`w-2 h-2 rounded-full ${a.ok ? "bg-green-400" : "bg-red-400"}`} />
                  <div className="flex-1">
                    <p className="text-white text-sm">{a.action}</p>
                    <p className="text-xs text-muted-foreground">{a.time}</p>
                  </div>
                  {!a.ok && <AlertTriangle className="w-4 h-4 text-red-400" />}
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <Button onClick={() => setShowPinModal(true)} className="w-full h-12 rounded-xl bg-quickgo-blue hover:bg-quickgo-blue/90">
                <Lock className="w-4 h-4 mr-2" />
                {hasPin ? "Changer le code PIN" : "Définir un code PIN"}
              </Button>
              <Button onClick={() => setShowDevicesModal(true)} variant="outline" className="w-full h-12 rounded-xl">
                <Smartphone className="w-4 h-4 mr-2" />
                Gérer les appareils autorisés
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border/50 rounded-3xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{hasPin ? "Changer le code PIN" : "Définir un code PIN"}</h3>
              <button onClick={() => setShowPinModal(false)} className="p-1 rounded-full hover:bg-white/10">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <form onSubmit={handlePinSubmit} className="space-y-4">
              {hasPin && (
                <div>
                  <label className="block text-sm text-white mb-2">PIN actuel</label>
                  <Input type="password" inputMode="numeric" maxLength={6} value={currentPin}
                    onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))}
                    required placeholder="••••" className="h-12 bg-background border-border/50 text-center text-xl tracking-[0.5em]" />
                </div>
              )}
              <div>
                <label className="block text-sm text-white mb-2">Nouveau PIN (4-6 chiffres)</label>
                <Input type="password" inputMode="numeric" maxLength={6} value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))}
                  required placeholder="••••" className="h-12 bg-background border-border/50 text-center text-xl tracking-[0.5em]" />
              </div>
              <div>
                <label className="block text-sm text-white mb-2">Confirmer le PIN</label>
                <Input type="password" inputMode="numeric" maxLength={6} value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                  required placeholder="••••" className="h-12 bg-background border-border/50 text-center text-xl tracking-[0.5em]" />
              </div>
              <Button type="submit" disabled={pinSubmitting} className="w-full h-12 rounded-xl bg-quickgo-blue hover:bg-quickgo-blue/90">
                {pinSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enregistrer"}
              </Button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Devices Modal */}
      {showDevicesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border/50 rounded-3xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Appareils autorisés</h3>
              <button onClick={() => setShowDevicesModal(false)} className="p-1 rounded-full hover:bg-white/10">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-background border border-green-500/30 mb-4">
              <div className="p-2.5 rounded-xl bg-green-500/20">
                <Smartphone className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium">{deviceLabel} — cet appareil</p>
                <p className="text-xs text-muted-foreground truncate">{deviceInfo.slice(0, 60)}…</p>
              </div>
              <span className="text-xs text-green-400 shrink-0">Actif</span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Si vous pensez que votre compte est utilisé sur un appareil que vous ne reconnaissez pas,
              déconnectez toutes les autres sessions.
            </p>
            <Button onClick={handleSignOutOthers} disabled={signingOut} variant="outline"
              className="w-full h-12 rounded-xl border-red-500/40 text-red-400 hover:bg-red-500/10">
              {signingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogOut className="w-4 h-4 mr-2" />Déconnecter les autres appareils</>}
            </Button>
          </motion.div>
        </div>
      )}

      <Footer />
    </main>
  )
}
