"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Gift, Star, Zap, TrendingUp, Trophy, ChevronRight, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Reward = {
  id: string
  icon: string
  title: string
  description: string
  points_cost: number
}

type HistoryEntry = {
  id: string
  type: string
  amount: number
  description: string
  created_at: string
}

export default function RewardsPage() {
  const [userPoints, setUserPoints] = useState(0)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/wallet/rewards")
      .then((r) => r.json())
      .then((data) => {
        if (data.points !== undefined) setUserPoints(data.points)
        if (Array.isArray(data.rewards)) setRewards(data.rewards)
        if (Array.isArray(data.history)) setHistory(data.history)
      })
      .catch(() => toast.error("Impossible de charger les récompenses"))
      .finally(() => setLoading(false))
  }, [])

  const handleRedeem = async (reward: Reward) => {
    if (userPoints < reward.points_cost) return
    setRedeeming(reward.id)
    try {
      const res = await fetch("/api/wallet/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reward_id: reward.id }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setUserPoints(data.new_points ?? userPoints - reward.points_cost)
        toast.success(`"${reward.title}" échangé avec succès !`)
      } else {
        toast.error(data.error ?? "Erreur lors de l'échange")
      }
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setRedeeming(null)
    }
  }

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    } catch { return iso }
  }

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
            <h1 className="text-2xl font-bold text-white mb-1">Cashback &amp; Récompenses</h1>
            <p className="text-muted-foreground mb-8">Gagnez des points à chaque achat et échangez-les</p>

            {/* Points Card */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-quickgo-blue to-quickgo-cyan mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10">
                <p className="text-white/70 text-sm mb-1">Vos QuickPoints</p>
                {loading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-white my-2" />
                ) : (
                  <p className="text-5xl font-black text-white mb-2">{userPoints.toLocaleString("fr-FR")}</p>
                )}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-quickgo-lime rounded-full" style={{ width: `${Math.min((userPoints / 5000) * 100, 100)}%` }} />
                  </div>
                  <span className="text-white/70 text-xs">5 000 pts pour Gold</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: "Niveau", value: userPoints >= 5000 ? "Gold" : userPoints >= 2500 ? "Silver" : "Bronze", icon: Trophy },
                { label: "Cashback", value: userPoints >= 5000 ? "8%" : userPoints >= 2500 ? "5%" : "2%", icon: TrendingUp },
                { label: "Ce mois", value: history.filter(h => h.type !== "redemption" && new Date(h.created_at) > new Date(Date.now() - 30 * 86400000)).reduce((s, h) => s + h.amount, 0) + " pts", icon: Zap },
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
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                ) : (
                  <div className="space-y-3">
                    {rewards.map((r) => (
                      <motion.div key={r.id} whileHover={{ scale: 1.01 }}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-card/50 border border-border/30 hover:border-quickgo-lime/50 transition-all">
                        <div className="text-3xl">{r.icon}</div>
                        <div className="flex-1">
                          <p className="text-white font-medium">{r.title}</p>
                          <p className="text-xs text-muted-foreground">{r.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-quickgo-lime font-bold text-sm">{r.points_cost} pts</p>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={userPoints < r.points_cost || redeeming === r.id}
                            onClick={() => handleRedeem(r)}
                            className="mt-1 rounded-full text-xs h-7 px-3"
                          >
                            {redeeming === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : userPoints >= r.points_cost ? "Échanger" : "Insuffisant"}
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* History */}
              <div>
                <h2 className="text-lg font-bold text-white mb-4">Historique des points</h2>
                <div className="space-y-3">
                  {loading ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
                  ) : history.length === 0 ? (
                    <p className="text-muted-foreground text-sm py-4 text-center">Aucune activité pour le moment</p>
                  ) : (
                    history.map((h) => {
                      const isPositive = h.type !== "redemption"
                      const label = isPositive ? `+${h.amount}` : `-${h.amount}`
                      return (
                        <div key={h.id} className="flex items-center justify-between p-4 rounded-2xl bg-card/50 border border-border/30">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${isPositive ? "bg-green-500/20" : "bg-red-500/20"}`}>
                              <Star className={`w-4 h-4 ${isPositive ? "text-green-400" : "text-red-400"}`} />
                            </div>
                            <div>
                              <p className="text-white text-sm font-medium">{h.description}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(h.created_at)}</p>
                            </div>
                          </div>
                          <span className={`font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                            {label} pts
                          </span>
                        </div>
                      )
                    })
                  )}
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
