"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Wallet,
  CreditCard,
  Clock,
  Zap,
  BarChart3,
  Star,
  Inbox,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DriverCashCard } from "@/components/driver/CashCard"

// Toutes les données affichées proviennent de /api/driver/earnings, calculées
// depuis les livraisons réelles — aucun montant, pourcentage ou historique
// fabriqué.
interface EarningsData {
  summary: {
    today: { earnings: number; deliveries: number }
    week: { earnings: number; deliveries: number }
    month: { earnings: number; deliveries: number }
  }
  chart: { day: string; earnings: number; trips: number; current: boolean }[]
  hours: { hour: string; percentage: number }[]
  recent: { id: number; description: string; amount: number; kind: "order" | "express"; at: string }[]
  completion_rate: number | null
  rating: number | null
  wallet_balance: number
  all_time: { total_earnings: number; total_deliveries: number }
}

function fmtCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n))
}
function fmtK(n: number) {
  if (n >= 1000) return `${Math.round(n / 1000)}K`
  return String(n)
}
function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Il y a ${hrs}h`
  return `Il y a ${Math.floor(hrs / 24)} j`
}

export default function DriverEarningsPage() {
  const [data, setData] = useState<EarningsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/driver/earnings")
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d && !d.error) setData(d) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const chart = data?.chart ?? []
  const maxEarning = Math.max(...chart.map(d => d.earnings), 1)
  const weekTrips = chart.reduce((s, d) => s + d.trips, 0)
  const weekTotal = data?.summary.week.earnings ?? 0
  const activeDays = chart.filter(d => d.trips > 0).length
  const bestHours = (data?.hours ?? [])
    .filter(h => h.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 2)

  const summaryCards = [
    { label: "Aujourd'hui", stats: data?.summary.today, icon: Clock, color: "quickgo-blue" },
    { label: "7 derniers jours", stats: data?.summary.week, icon: BarChart3, color: "quickgo-cyan" },
    { label: "30 derniers jours", stats: data?.summary.month, icon: TrendingUp, color: "quickgo-lime" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href="/driver/dashboard">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Gains & Analyses</h1>
              <p className="text-sm text-muted-foreground">Vue détaillée de vos revenus</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-6 space-y-6">
        {/* Cash en main — réconciliation paiement à la livraison */}
        <DriverCashCard />

        {/* Main Earnings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {summaryCards.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden rounded-3xl p-6 border border-border/30 bg-gradient-to-br ${
                index === 0 ? "from-quickgo-blue/20 to-quickgo-blue/5" :
                index === 1 ? "from-quickgo-cyan/20 to-quickgo-cyan/5" :
                "from-quickgo-lime/20 to-quickgo-lime/5"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${
                  index === 0 ? "bg-quickgo-blue/20" :
                  index === 1 ? "bg-quickgo-cyan/20" :
                  "bg-quickgo-lime/20"
                }`}>
                  <card.icon className={`w-6 h-6 ${
                    index === 0 ? "text-quickgo-blue" :
                    index === 1 ? "text-quickgo-cyan" :
                    "text-quickgo-lime"
                  }`} />
                </div>
                {card.stats && card.stats.deliveries > 0 && (
                  <span className="text-xs text-muted-foreground bg-white/5 px-2 py-1 rounded-full">
                    {card.stats.deliveries} course{card.stats.deliveries > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-white">
                {loading ? "—" : fmtCFA(card.stats?.earnings ?? 0)}{" "}
                <span className="text-lg text-muted-foreground">CFA</span>
              </p>

              <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-30 ${
                index === 0 ? "bg-quickgo-blue" :
                index === 1 ? "bg-quickgo-cyan" :
                "bg-quickgo-lime"
              }`} />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weekly Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
          >
            <h2 className="text-lg font-semibold text-white mb-6">Revenus des 7 derniers jours</h2>

            {chart.length > 0 && chart.some(d => d.earnings > 0) ? (
              <>
                <div className="relative h-64">
                  <div className="absolute inset-0 flex items-end justify-between gap-2 pb-8 pl-10">
                    {chart.map((d, index) => (
                      <div key={`${d.day}-${index}`} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max((d.earnings / maxEarning) * 100, d.earnings > 0 ? 4 : 1)}%` }}
                          transition={{ delay: index * 0.08, duration: 0.5 }}
                          title={`${fmtCFA(d.earnings)} CFA · ${d.trips} course${d.trips > 1 ? "s" : ""}`}
                          className={`w-full rounded-t-xl relative overflow-hidden ${
                            d.current ? "bg-quickgo-blue/40 border border-quickgo-blue/50" : "bg-gradient-to-t from-quickgo-blue to-quickgo-cyan"
                          }`}
                        />
                        <span className={`text-xs ${d.current ? "text-quickgo-blue font-medium" : "text-muted-foreground"}`}>
                          {d.day}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Y-axis derived from the real maximum */}
                  <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-xs text-muted-foreground pr-2 pb-8">
                    {[1, 0.75, 0.5, 0.25, 0].map(f => (
                      <span key={f}>{fmtK(Math.round(maxEarning * f))}</span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border/30 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">Total 7 jours</p>
                    <p className="text-xl font-bold text-white">{fmtCFA(weekTotal)} CFA</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Courses</p>
                    <p className="text-xl font-bold text-white">{weekTrips}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Moyenne/jour actif</p>
                    <p className="text-xl font-bold text-white">
                      {activeDays > 0 ? fmtCFA(weekTotal / activeDays) : "0"} CFA
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center">
                <BarChart3 className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">
                  {loading ? "Chargement…" : "Aucune livraison sur les 7 derniers jours"}
                </p>
                {!loading && (
                  <Link href="/driver/missions">
                    <Button variant="outline" size="sm" className="rounded-full">
                      Voir les missions disponibles
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </motion.div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Performance — real metrics only */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Performance</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Note moyenne</span>
                  <span className="text-white font-semibold flex items-center gap-1">
                    {data?.rating != null ? Number(data.rating).toFixed(1) : "—"}
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Taux de complétion (30 j)</span>
                  <span className="text-white font-semibold">
                    {data?.completion_rate != null ? `${data.completion_rate}%` : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Livraisons (30 j)</span>
                  <span className="text-white font-semibold">{data?.summary.month.deliveries ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Livraisons totales</span>
                  <span className="text-white font-semibold">{data?.all_time.total_deliveries ?? "—"}</span>
                </div>
              </div>
            </motion.div>

            {/* Hourly Breakdown — share of real earnings per slot, last 7 days */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Heures rentables (7 j)</h2>
              {(data?.hours ?? []).some(h => h.percentage > 0) ? (
                <>
                  <div className="space-y-3">
                    {(data?.hours ?? []).map(slot => (
                      <div key={slot.hour}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">{slot.hour}</span>
                          <span className="text-xs text-quickgo-lime">{slot.percentage}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${slot.percentage}%` }}
                            transition={{ delay: 0.5, duration: 0.5 }}
                            className="bg-gradient-to-r from-quickgo-blue to-quickgo-lime h-2 rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  {bestHours.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      Vos meilleures heures :{" "}
                      {bestHours.map((h, i) => (
                        <span key={h.hour} className="text-quickgo-lime">
                          {h.hour}{i < bestHours.length - 1 ? " et " : ""}
                        </span>
                      ))}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  {loading ? "Chargement…" : "Pas encore assez de données cette semaine"}
                </p>
              )}
            </motion.div>
          </div>
        </div>

        {/* Recent Transactions — real deliveries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
        >
          <h2 className="text-lg font-semibold text-white mb-6">Dernières livraisons payées</h2>

          {(data?.recent ?? []).length > 0 ? (
            <div className="space-y-3">
              {(data?.recent ?? []).map((tx, index) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.08 }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      tx.kind === "express" ? "bg-yellow-500/20" : "bg-quickgo-blue/20"
                    }`}>
                      {tx.kind === "express" ? (
                        <Zap className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <DollarSign className="w-5 h-5 text-quickgo-blue" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(tx.at)}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-white">+{fmtCFA(tx.amount)} CFA</span>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Inbox className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {loading ? "Chargement…" : "Aucune livraison payée sur les 30 derniers jours"}
              </p>
            </div>
          )}
        </motion.div>

        {/* Wallet CTA — real balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-quickgo-blue/30 via-quickgo-cyan/20 to-quickgo-lime/30 rounded-3xl p-6 border border-quickgo-blue/30"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-quickgo-blue/30 flex items-center justify-center">
                <Wallet className="w-8 h-8 text-quickgo-blue" />
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Solde portefeuille</p>
                <p className="text-3xl font-bold text-white">
                  {loading ? "—" : fmtCFA(data?.wallet_balance ?? 0)}{" "}
                  <span className="text-lg text-muted-foreground">CFA</span>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/wallet">
                <Button variant="outline" className="rounded-full">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Historique
                </Button>
              </Link>
              <Link href="/wallet">
                <Button className="rounded-full bg-quickgo-lime text-background hover:bg-quickgo-lime/90">
                  Retirer mes gains
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
