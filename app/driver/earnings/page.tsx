"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ChevronDown,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Gift,
  CreditCard,
  Clock,
  Target,
  Zap,
  BarChart3,
  PieChart,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const earningsData = {
  today: 18750,
  week: 125600,
  month: 487500,
  todayChange: 12,
  weekChange: 8,
  monthChange: 15,
}

const weeklyChart = [
  { day: "Lun", earnings: 18500, trips: 8 },
  { day: "Mar", earnings: 22300, trips: 10 },
  { day: "Mer", earnings: 19800, trips: 9 },
  { day: "Jeu", earnings: 25100, trips: 12 },
  { day: "Ven", earnings: 28500, trips: 14 },
  { day: "Sam", earnings: 32400, trips: 16 },
  { day: "Dim", earnings: 0, trips: 0, current: true },
]

const hourlyBreakdown = [
  { hour: "06-09", percentage: 15 },
  { hour: "09-12", percentage: 25 },
  { hour: "12-15", percentage: 35 },
  { hour: "15-18", percentage: 20 },
  { hour: "18-21", percentage: 40 },
  { hour: "21-00", percentage: 30 },
]

const recentTransactions = [
  { id: 1, type: "earning", description: "Course #1234", amount: 2500, time: "Il y a 15 min" },
  { id: 2, type: "bonus", description: "Bonus rush hour", amount: 1000, time: "Il y a 1h" },
  { id: 3, type: "earning", description: "Course #1233", amount: 3200, time: "Il y a 2h" },
  { id: 4, type: "tip", description: "Pourboire Jean P.", amount: 500, time: "Il y a 2h" },
  { id: 5, type: "earning", description: "Course #1232", amount: 1800, time: "Il y a 3h" },
]

const performanceMetrics = [
  { label: "Taux d'acceptation", value: "98%", change: "+2%", positive: true },
  { label: "Note moyenne", value: "4.9", change: "+0.1", positive: true },
  { label: "Courses/heure", value: "2.8", change: "-0.2", positive: false },
  { label: "Km parcourus", value: "45.2", change: "+5.3", positive: true },
]

export default function DriverEarningsPage() {
  const [period, setPeriod] = useState<"day" | "week" | "month">("week")
  
  const maxEarning = Math.max(...weeklyChart.map(d => d.earnings))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
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

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full">
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button variant="outline" size="sm" className="rounded-full">
                <Calendar className="w-4 h-4 mr-2" />
                Cette semaine
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-6 space-y-6">
        {/* Main Earnings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { 
              label: "Aujourd'hui", 
              value: earningsData.today, 
              change: earningsData.todayChange,
              icon: Clock,
              color: "quickgo-blue"
            },
            { 
              label: "Cette semaine", 
              value: earningsData.week, 
              change: earningsData.weekChange,
              icon: BarChart3,
              color: "quickgo-cyan"
            },
            { 
              label: "Ce mois", 
              value: earningsData.month, 
              change: earningsData.monthChange,
              icon: TrendingUp,
              color: "quickgo-lime"
            },
          ].map((card, index) => (
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
                <div className="flex items-center gap-1 bg-quickgo-lime/20 px-2 py-1 rounded-full">
                  <ArrowUpRight className="w-3 h-3 text-quickgo-lime" />
                  <span className="text-xs text-quickgo-lime font-medium">+{card.change}%</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-white">{card.value.toLocaleString()} <span className="text-lg text-muted-foreground">CFA</span></p>
              
              {/* Decorative Element */}
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Revenus hebdomadaires</h2>
              <div className="flex items-center gap-2">
                {["day", "week", "month"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p as typeof period)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      period === p 
                        ? "bg-quickgo-blue text-white" 
                        : "bg-white/5 text-muted-foreground hover:bg-white/10"
                    }`}
                  >
                    {p === "day" ? "Jour" : p === "week" ? "Semaine" : "Mois"}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="relative h-64">
              <div className="absolute inset-0 flex items-end justify-between gap-2 pb-8">
                {weeklyChart.map((data, index) => (
                  <div key={data.day} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(data.earnings / maxEarning) * 100}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className={`w-full rounded-t-xl relative overflow-hidden ${
                        data.current ? "bg-quickgo-blue/30" : "bg-gradient-to-t from-quickgo-blue to-quickgo-cyan"
                      }`}
                    >
                      {!data.current && (
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/10" />
                      )}
                    </motion.div>
                    <span className={`text-xs ${data.current ? "text-quickgo-blue font-medium" : "text-muted-foreground"}`}>
                      {data.day}
                    </span>
                  </div>
                ))}
              </div>
              
              {/* Y-axis labels */}
              <div className="absolute left-0 inset-y-0 flex flex-col justify-between text-xs text-muted-foreground pr-2">
                <span>35K</span>
                <span>25K</span>
                <span>15K</span>
                <span>5K</span>
                <span>0</span>
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-border/30 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Total semaine</p>
                <p className="text-xl font-bold text-white">146 600 CFA</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Courses totales</p>
                <p className="text-xl font-bold text-white">69</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Moyenne/jour</p>
                <p className="text-xl font-bold text-white">20 943 CFA</p>
              </div>
            </div>
          </motion.div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Performance Metrics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Performance</h2>
              <div className="space-y-4">
                {performanceMetrics.map((metric) => (
                  <div key={metric.label} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{metric.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{metric.value}</span>
                      <span className={`text-xs flex items-center gap-0.5 ${
                        metric.positive ? "text-quickgo-lime" : "text-red-400"
                      }`}>
                        {metric.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {metric.change}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Hourly Breakdown */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Heures rentables</h2>
              <div className="space-y-3">
                {hourlyBreakdown.map((slot) => (
                  <div key={slot.hour}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{slot.hour}h</span>
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
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Heures de pointe : <span className="text-quickgo-lime">12h-15h</span> et <span className="text-quickgo-lime">18h-21h</span>
              </p>
            </motion.div>
          </div>
        </div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Transactions récentes</h2>
            <Button variant="outline" size="sm" className="rounded-full">
              Voir tout
            </Button>
          </div>

          <div className="space-y-3">
            {recentTransactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    tx.type === "earning" ? "bg-quickgo-blue/20" :
                    tx.type === "bonus" ? "bg-quickgo-lime/20" :
                    "bg-yellow-500/20"
                  }`}>
                    {tx.type === "earning" ? (
                      <DollarSign className="w-5 h-5 text-quickgo-blue" />
                    ) : tx.type === "bonus" ? (
                      <Gift className="w-5 h-5 text-quickgo-lime" />
                    ) : (
                      <Zap className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.time}</p>
                  </div>
                </div>
                <span className={`font-semibold ${
                  tx.type === "bonus" || tx.type === "tip" ? "text-quickgo-lime" : "text-white"
                }`}>
                  +{tx.amount.toLocaleString()} CFA
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Wallet CTA */}
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
                <p className="text-white font-semibold text-lg">Solde disponible</p>
                <p className="text-3xl font-bold text-white">125 600 <span className="text-lg text-muted-foreground">CFA</span></p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-full">
                <CreditCard className="w-4 h-4 mr-2" />
                Historique
              </Button>
              <Button className="rounded-full bg-quickgo-lime text-background hover:bg-quickgo-lime/90">
                Retirer mes gains
              </Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
