"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  Trophy,
  Medal,
  Crown,
  Star,
  Flame,
  Target,
  Gift,
  ChevronRight,
  TrendingUp,
  Zap,
  Award,
  Shield,
  Clock,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const leaderboard = [
  { rank: 1, name: "Marc D.", avatar: null, earnings: 1250000, trips: 485, rating: 4.98, streak: 45, city: "Yaoundé" },
  { rank: 2, name: "Jean P.", avatar: null, earnings: 1180000, trips: 462, rating: 4.95, streak: 38, city: "Yaoundé" },
  { rank: 3, name: "Alain K.", avatar: null, earnings: 1095000, trips: 421, rating: 4.93, streak: 32, city: "Douala" },
  { rank: 4, name: "Christian B.", avatar: null, earnings: 980000, trips: 398, rating: 4.91, streak: 28, city: "Yaoundé" },
  { rank: 5, name: "Steve M.", avatar: null, earnings: 925000, trips: 376, rating: 4.89, streak: 25, city: "Bafoussam" },
  { rank: 6, name: "Samuel K.", avatar: null, earnings: 870000, trips: 352, rating: 4.87, streak: 22, city: "Yaoundé" },
  { rank: 7, name: "Emmanuel O.", avatar: null, earnings: 815000, trips: 328, rating: 4.85, streak: 19, city: "Douala" },
]

const badges = [
  { id: 1, name: "Premier Voyage", icon: MapPin, description: "Complétez votre première livraison", unlocked: true, color: "quickgo-blue" },
  { id: 2, name: "Étoile Montante", icon: Star, description: "Atteignez une note de 4.5+", unlocked: true, color: "yellow-500" },
  { id: 3, name: "Endurance", icon: Clock, description: "10h en ligne en une journée", unlocked: true, color: "quickgo-cyan" },
  { id: 4, name: "Série de Feu", icon: Flame, description: "7 jours consécutifs actifs", unlocked: true, color: "orange-500" },
  { id: 5, name: "Champion", icon: Trophy, description: "Top 10 de votre ville", unlocked: false, color: "quickgo-lime" },
  { id: 6, name: "Légende", icon: Crown, description: "Top 3 national", unlocked: false, color: "purple-500" },
]

const rewards = [
  { level: "Bronze", minTrips: 0, benefits: ["Accès missions standard", "Support basique"] },
  { level: "Argent", minTrips: 100, benefits: ["Bonus +5%", "Missions prioritaires", "Support 24/7"] },
  { level: "Or", minTrips: 250, benefits: ["Bonus +10%", "Accès VIP", "Assurance premium"], current: true },
  { level: "Platine", minTrips: 500, benefits: ["Bonus +15%", "Missions exclusives", "Programme fidélité"] },
  { level: "Diamant", minTrips: 1000, benefits: ["Bonus +20%", "Événements privés", "Cadeaux exclusifs"] },
]

const currentDriver = {
  name: "Emmanuel",
  rank: 12,
  totalRank: 2890,
  earnings: 487500,
  trips: 187,
  rating: 4.9,
  streak: 4,
  level: "Or",
  xp: 680,
  xpMax: 1000,
  nextReward: "25 000 CFA",
}

export default function DriverRankingPage() {
  const [view, setView] = useState<"city" | "national">("city")
  const [apiLeaderboard, setApiLeaderboard] = useState<typeof leaderboard | null>(null)
  const [apiMe, setApiMe]                   = useState<typeof currentDriver | null>(null)
  const [loading, setLoading]               = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/driver/ranking?scope=${view}&limit=20`)
      .then(r => r.json())
      .then(d => {
        if (d.leaderboard?.length) {
          setApiLeaderboard(d.leaderboard.map((r: {
            rank: number; name: string; earnings: number; trips: number; rating: number; city: string; streak?: number
          }) => ({
            rank: r.rank, name: r.name, avatar: null,
            earnings: r.earnings, trips: r.trips, rating: r.rating, streak: r.streak ?? 0, city: r.city,
          })))
        }
        if (d.me) {
          setApiMe({
            name: "Vous", rank: d.my_rank, totalRank: d.total_drivers,
            earnings: d.me.earnings, trips: d.me.trips, rating: d.me.rating,
            streak: d.me.streak, level: d.me.level, xp: d.me.xp, xpMax: d.me.xp_max,
            nextReward: "25 000 CFA",
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [view])

  const displayLeaderboard = apiLeaderboard ?? leaderboard
  const displayMe          = apiMe          ?? currentDriver

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
                <h1 className="text-xl font-bold text-white">Classement & Récompenses</h1>
                <p className="text-sm text-muted-foreground">Votre progression et vos badges</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-6 space-y-6">
        {/* Current Position Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 border border-yellow-500/30"
        >
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-yellow-500">
                <Image
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0024-U4s2UDpvENxwAdPCezTrWL95wI71B4.jpg"
                  alt={displayMe.name}
                  width={96}
                  height={96}
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
            </div>

            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-white mb-1">{displayMe.name}</h2>
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-semibold flex items-center gap-1">
                  <Crown className="w-4 h-4" />
                  Niveau {displayMe.level}
                </span>
                <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 text-sm flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  {displayMe.streak} jours
                </span>
              </div>

              {/* Progress Bar */}
              <div className="max-w-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progression niveau</span>
                  <span className="text-sm text-white">{displayMe.xp} / {displayMe.xpMax} XP</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(displayMe.xp / displayMe.xpMax) * 100}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                    className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 h-3 rounded-full"
                  />
                </div>
                <p className="text-xs text-quickgo-lime mt-2 flex items-center gap-1">
                  <Gift className="w-4 h-4" />
                  Prochaine récompense: {displayMe.nextReward}
                </p>
              </div>
            </div>

            <div className="text-center lg:text-right">
              <p className="text-sm text-muted-foreground mb-1">Classement ville</p>
              <p className="text-5xl font-bold text-white">#{displayMe.rank}</p>
              <p className="text-sm text-muted-foreground">sur {displayMe.totalRank} livreurs</p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{displayMe.earnings.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">CFA ce mois</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{displayMe.trips}</p>
              <p className="text-xs text-muted-foreground">Courses totales</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white flex items-center justify-center gap-1">
                {displayMe.rating}
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </p>
              <p className="text-xs text-muted-foreground">Note moyenne</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-quickgo-lime">Top 15%</p>
              <p className="text-xs text-muted-foreground">De votre ville</p>
            </div>
          </div>

          {/* Decorative */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-500/20 rounded-full blur-3xl" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Classement</h2>
              <div className="flex items-center gap-2">
                {["city", "national"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v as typeof view)}
                    className={`px-4 py-2 rounded-full text-sm transition-all ${
                      view === v
                        ? "bg-quickgo-blue text-white"
                        : "bg-white/5 text-muted-foreground hover:bg-white/10"
                    }`}
                  >
                    {v === "city" ? "Yaoundé" : "National"}
                  </button>
                ))}
              </div>
            </div>

            {/* Top 3 Podium */}
            <div className="flex items-end justify-center gap-4 mb-8">
              {displayLeaderboard.length >= 3 && [displayLeaderboard[1], displayLeaderboard[0], displayLeaderboard[2]].map((driver, index) => {
                const positions = [2, 1, 3]
                const position = positions[index]
                const heights = ["h-24", "h-32", "h-20"]
                const colors = [
                  "from-gray-400 to-gray-500",
                  "from-yellow-400 to-orange-500",
                  "from-orange-600 to-orange-700"
                ]
                const icons = [Medal, Crown, Award]
                const Icon = icons[index]

                return (
                  <motion.div
                    key={driver.rank}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative mb-2">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colors[index]} flex items-center justify-center`}>
                        <span className="text-white font-bold text-xl">{driver.name.charAt(0)}</span>
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-background flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${position === 1 ? "text-yellow-400" : position === 2 ? "text-gray-400" : "text-orange-600"}`} />
                      </div>
                    </div>
                    <p className="text-white font-medium text-sm mb-1">{driver.name}</p>
                    <p className="text-xs text-muted-foreground mb-2">{driver.earnings.toLocaleString()} CFA</p>
                    <div className={`${heights[index]} w-20 rounded-t-xl bg-gradient-to-b ${colors[index]} flex items-center justify-center`}>
                      <span className="text-2xl font-bold text-white">#{position}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Full List */}
            <div className="space-y-2">
              {displayLeaderboard.slice(3).map((driver, index) => (
                <motion.div
                  key={driver.rank}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-8 text-center text-muted-foreground font-semibold">#{driver.rank}</span>
                    <div className="w-10 h-10 rounded-full bg-quickgo-blue/20 flex items-center justify-center">
                      <span className="text-quickgo-blue font-semibold">{driver.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{driver.name}</p>
                      <p className="text-xs text-muted-foreground">{driver.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                      <p className="text-white font-semibold">{driver.earnings.toLocaleString()} CFA</p>
                      <p className="text-xs text-muted-foreground">{driver.trips} courses</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white">{driver.rating}</span>
                    </div>
                    <div className="flex items-center gap-1 text-orange-400">
                      <Flame className="w-4 h-4" />
                      <span className="text-sm">{driver.streak}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Badges & Rewards */}
          <div className="space-y-6">
            {/* Badges */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Badges</h2>
                <span className="text-sm text-muted-foreground">4/6</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {badges.map((badge) => (
                  <motion.div
                    key={badge.id}
                    whileHover={{ scale: 1.05 }}
                    className={`relative p-3 rounded-xl text-center transition-all ${
                      badge.unlocked
                        ? `bg-${badge.color}/20 border border-${badge.color}/30`
                        : "bg-white/5 border border-white/10 opacity-50"
                    }`}
                  >
                    <div className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      badge.unlocked ? `bg-${badge.color}/30` : "bg-white/10"
                    }`}>
                      <badge.icon className={`w-5 h-5 ${badge.unlocked ? `text-${badge.color}` : "text-muted-foreground"}`} />
                    </div>
                    <p className="text-xs text-white font-medium line-clamp-1">{badge.name}</p>
                    {!badge.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
                        <Shield className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Rewards Levels */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
            >
              <h2 className="text-lg font-semibold text-white mb-4">Niveaux & Avantages</h2>

              <div className="space-y-3">
                {rewards.map((reward, index) => (
                  <div
                    key={reward.level}
                    className={`p-3 rounded-xl transition-all ${
                      reward.current
                        ? "bg-quickgo-lime/20 border border-quickgo-lime/30"
                        : "bg-white/5"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-semibold ${reward.current ? "text-quickgo-lime" : "text-white"}`}>
                        {reward.level}
                      </span>
                      <span className="text-xs text-muted-foreground">{reward.minTrips}+ courses</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {reward.benefits.map((benefit, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-muted-foreground">
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Bonus CTA */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-quickgo-lime/20 to-quickgo-cyan/20 rounded-3xl p-6 border border-quickgo-lime/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-quickgo-lime/30 flex items-center justify-center">
                  <Gift className="w-6 h-6 text-quickgo-lime" />
                </div>
                <div>
                  <p className="text-white font-semibold">Bonus disponible</p>
                  <p className="text-2xl font-bold text-quickgo-lime">25 000 CFA</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Complétez encore 3 courses pour débloquer votre bonus !
              </p>
              <Button className="w-full bg-quickgo-lime text-background hover:bg-quickgo-lime/90 rounded-full">
                Voir les missions
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}
