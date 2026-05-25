"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Gift, Star, Zap, TrendingUp, Trophy, ChevronRight } from "lucide-react"

const rewards = [
  { icon: "🛵", title: "Livraison gratuite", points: 500, description: "1 livraison offerte, valable 7 jours" },
  { icon: "💰", title: "Remise 10%", points: 1000, description: "10% de réduction sur votre prochain achat" },
  { icon: "🎁", title: "Bon d'achat 5 000 CFA", points: 2500, description: "Utilisable sur toute la marketplace" },
  { icon: "⭐", title: "Statut Gold", points: 5000, description: "Livraisons prioritaires + 8% cashback" },
]

const history = [
  { action: "Commande #QG12345", points: "+50", date: "Aujourd'hui" },
  { action: "Parrainage ami", points: "+200", date: "Hier" },
  { action: "Avis laissé", points: "+10", date: "Il y a 3 jours" },
  { action: "Récompense échangée", points: "-500", date: "Il y a 5 jours" },
]

export default function RewardsPage() {
  const userPoints = 1340

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/wallet" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour au portefeuille
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold text-white mb-1">Cashback & Récompenses</h1>
            <p className="text-muted-foreground mb-8">Gagnez des points à chaque achat et échangez-les</p>

            {/* Points Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-quickgo-blue to-quickgo-cyan mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <p className="text-white/70 text-sm mb-1">Vos QuickPoints</p>
                <p className="text-5xl font-black text-white mb-2">{userPoints.toLocaleString("fr-FR")}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-quickgo-lime rounded-full" style={{ width: `${(userPoints / 5000) * 100}%` }} />
                  </div>
                  <span className="text-white/70 text-xs">5 000 pts pour Gold</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Niveau", value: "Silver", icon: Trophy },
                { label: "Cashback", value: "5%", icon: TrendingUp },
                { label: "Ce mois", value: "+340 pts", icon: Zap },
              ].map((s) => (
                <div key={s.label} className="p-4 rounded-2xl bg-card/50 border border-border/30 text-center">
                  <s.icon className="w-5 h-5 text-quickgo-blue mx-auto mb-2" />
                  <p className="text-lg font-bold text-white">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Rewards Catalog */}
              <div>
                <h2 className="text-lg font-bold text-white mb-4">Catalogue de récompenses</h2>
                <div className="space-y-3">
                  {rewards.map((r) => (
                    <motion.div key={r.title} whileHover={{ scale: 1.01 }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-card/50 border border-border/30 hover:border-quickgo-lime/50 transition-all">
                      <div className="text-3xl">{r.icon}</div>
                      <div className="flex-1">
                        <p className="text-white font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{r.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-quickgo-lime font-bold text-sm">{r.points} pts</p>
                        <Button size="sm" variant="outline" disabled={userPoints < r.points}
                          className="mt-1 rounded-full text-xs h-7 px-3">
                          {userPoints >= r.points ? "Échanger" : "Insuffisant"}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* History */}
              <div>
                <h2 className="text-lg font-bold text-white mb-4">Historique des points</h2>
                <div className="space-y-3">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-card/50 border border-border/30">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${h.points.startsWith("+") ? "bg-green-500/20" : "bg-red-500/20"}`}>
                          <Star className={`w-4 h-4 ${h.points.startsWith("+") ? "text-green-400" : "text-red-400"}`} />
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{h.action}</p>
                          <p className="text-xs text-muted-foreground">{h.date}</p>
                        </div>
                      </div>
                      <span className={`font-bold ${h.points.startsWith("+") ? "text-green-400" : "text-red-400"}`}>
                        {h.points} pts
                      </span>
                    </div>
                  ))}
                </div>

                {/* Referral */}
                <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-quickgo-lime/20 to-quickgo-cyan/10 border border-quickgo-lime/30">
                  <div className="flex items-start gap-3">
                    <Gift className="w-6 h-6 text-quickgo-lime shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-semibold">Parrainez vos amis</p>
                      <p className="text-sm text-muted-foreground mt-1">Gagnez 200 pts par ami parrainé qui passe sa 1ère commande</p>
                      <Button size="sm" className="mt-3 rounded-full bg-quickgo-lime text-black hover:bg-quickgo-lime/90">
                        Partager mon code
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
