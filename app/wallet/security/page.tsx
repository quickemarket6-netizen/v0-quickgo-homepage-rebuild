"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield, Lock, Smartphone, Eye, EyeOff, Bell, ChevronRight, CheckCircle, AlertTriangle } from "lucide-react"

const securityFeatures = [
  { icon: Lock, title: "Chiffrement AES-256", desc: "Toutes vos données sont chiffrées de bout en bout", enabled: true },
  { icon: Smartphone, title: "Authentification 2FA", desc: "Vérification en deux étapes pour chaque connexion", enabled: true },
  { icon: Bell, title: "Alertes de transaction", desc: "Notification instantanée pour chaque paiement", enabled: true },
  { icon: Eye, title: "Masquage du solde", desc: "Cachez votre solde sur l'écran d'accueil", enabled: false },
]

export default function WalletSecurityPage() {
  const [features, setFeatures] = useState(securityFeatures)

  const toggle = (i: number) => {
    setFeatures((f) => f.map((item, idx) => idx === i ? { ...item, enabled: !item.enabled } : item))
  }

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
                  <p className="text-3xl font-black text-white">92/100</p>
                  <p className="text-muted-foreground text-xs">Excellent — votre compte est bien protégé</p>
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
              <Button className="w-full h-12 rounded-xl bg-quickgo-blue hover:bg-quickgo-blue/90">
                <Lock className="w-4 h-4 mr-2" />
                Changer le code PIN
              </Button>
              <Button variant="outline" className="w-full h-12 rounded-xl">
                <Smartphone className="w-4 h-4 mr-2" />
                Gérer les appareils autorisés
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
