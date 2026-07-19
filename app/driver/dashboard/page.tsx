"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  LayoutDashboard,
  MapPin,
  Car,
  DollarSign,
  Wallet,
  TrendingUp,
  MessageSquare,
  Gift,
  HelpCircle,
  Settings,
  Bell,
  ChevronDown,
  Star,
  CheckCircle,
  Navigation,
  Phone,
  User,
  Trophy,
  Target,
  Flame,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n/context"
import { LanguageSwitcher } from "@/components/ui/language-switcher"

const sidebarItems = [
  { icon: LayoutDashboard, labelKey: "snav.dashboard", href: "/driver/dashboard", active: true },
  { icon: MapPin, labelKey: "snav.missions", href: "/driver/missions" },
  { icon: Car, labelKey: "snav.myRides", href: "/driver/navigation" },
  { icon: DollarSign, labelKey: "snav.revenue", href: "/driver/earnings" },
  { icon: Wallet, labelKey: "snav.wallet", href: "/wallet" },
  { icon: TrendingUp, labelKey: "snav.performance", href: "/driver/ranking" },
  { icon: MessageSquare, labelKey: "snav.messages", href: "/driver/messages" },
  { icon: Gift, labelKey: "snav.incentives", href: "/driver/ranking" },
  { icon: HelpCircle, labelKey: "snav.assistance", href: "/support" },
  { icon: Settings, labelKey: "snav.settings", href: "/driver/settings" },
]

interface MissionInfo {
  title: string
  target_count: number
  reward_amount: number
  mission_type: string
}
interface MissionProgress {
  id: string
  current_count: number
  mission: MissionInfo | null
}
interface DriverData {
  id: string
  rating: number | null
  total_deliveries: number | null
  total_earnings: number | null
  city: string | null
  status: string | null
  vehicle_type: string | null
  vehicle_brand: string | null
  vehicle_model: string | null
  license_plate: string | null
  created_at: string
  today_earnings: number
  today_deliveries: number
  active_missions: MissionProgress[]
  user: { full_name: string | null; avatar_url: string | null; wallet_balance: number | null } | null
}
interface ActiveDelivery {
  type: "order" | "express"
  reference: string
  destination: string
  customer_name: string
  customer_phone: string | null
  earning: number
  order_type: string
}
interface RankingMe {
  earnings: number
  trips: number
  rating: number
  xp: number
  xp_max: number
  level: string
  streak: number
}
interface RankingData {
  my_rank: number
  total_drivers: number
  me: RankingMe | null
}

function fmtCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " CFA"
}
function monthsSince(iso: string) {
  const start = new Date(iso)
  const now = new Date()
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth())
  return Math.max(0, months)
}

export default function DriverDashboardPage() {
  const { t } = useT()
  const [isOnline, setIsOnline] = useState(false)
  const [togglingOnline, setTogglingOnline] = useState(false)
  const [driver, setDriver] = useState<DriverData | null>(null)
  const [activeDelivery, setActiveDelivery] = useState<ActiveDelivery | null>(null)
  const [ranking, setRanking] = useState<RankingData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [driverRes, deliveryRes, rankingRes] = await Promise.all([
          fetch("/api/driver"),
          fetch("/api/driver/active-delivery"),
          fetch("/api/driver/ranking"),
        ])
        if (!cancelled && driverRes.ok) {
          const d: DriverData = await driverRes.json()
          setDriver(d)
          // Sync the toggle from the real DB status (source of truth).
          setIsOnline(d.status === "online" || d.status === "delivering")
        }
        if (!cancelled && deliveryRes.ok) setActiveDelivery(await deliveryRes.json())
        if (!cancelled && rankingRes.ok) setRanking(await rankingRes.json())
      } catch {
        /* keep neutral empty states */
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function toggleOnline() {
    if (togglingOnline) return
    // A courier mid-delivery can't go offline from here.
    if (driver?.status === "delivering") return
    const next = !isOnline
    setIsOnline(next) // optimistic
    setTogglingOnline(true)
    try {
      const res = await fetch("/api/driver", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_online: next }),
      })
      if (!res.ok) throw new Error("update failed")
      const updated = await res.json()
      setDriver((prev) => (prev ? { ...prev, status: updated.status ?? prev.status } : prev))
      setIsOnline(updated.status === "online" || updated.status === "delivering")
    } catch {
      setIsOnline(!next) // revert on failure
    } finally {
      setTogglingOnline(false)
    }
  }

  const firstName = driver?.user?.full_name?.split(" ")[0] ?? "Chauffeur"
  const rating = driver?.rating ?? 0
  const walletBalance = driver?.user?.wallet_balance ?? 0
  const dailyMission = driver?.active_missions?.[0] ?? null
  const topPercent = ranking && ranking.total_drivers > 0
    ? Math.max(1, Math.round((ranking.my_rank / ranking.total_drivers) * 100))
    : null
  const me = ranking?.me ?? null
  const xpPct = me ? Math.min(100, Math.round((me.xp / Math.max(me.xp_max, 1)) * 100)) : 0

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border/30 bg-card/30">
        {/* Logo */}
        <div className="p-6 border-b border-border/30">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <div>
              <span className="text-xl font-bold text-white">QUICK</span>
              <span className="text-xl font-bold text-quickgo-lime">GO</span>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Driver</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.href + item.labelKey}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active
                  ? "bg-quickgo-blue/20 text-quickgo-blue"
                  : "text-muted-foreground hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{t(item.labelKey)}</span>
            </Link>
          ))}
        </nav>

        {/* Driver Level */}
        <div className="p-4 border-t border-border/30">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">{t("ddash.level")} {me?.level ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{ranking ? `${t("ddash.rank")} #${ranking.my_rank}` : "…"}</p>
              </div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 mb-2">
              <div className="bg-gradient-to-r from-quickgo-blue to-quickgo-cyan h-2 rounded-full" style={{ width: `${xpPct}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{me ? `${me.xp} / ${me.xp_max} XP` : "—"}</p>
            {dailyMission?.mission && (
              <>
                <p className="text-xs text-quickgo-lime mt-2">{t("ddash.nextReward")}</p>
                <p className="text-sm font-semibold text-white flex items-center gap-2">
                  {t("ddash.bonus")} {fmtCFA(dailyMission.mission.reward_amount)} <Gift className="w-4 h-4 text-quickgo-lime" />
                </p>
              </>
            )}
          </div>

          {/* Help Center */}
          <Link href="/support" className="mt-4 bg-quickgo-blue/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-quickgo-blue/30 flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-quickgo-blue" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">{t("ddash.helpCenter")}</p>
              <p className="text-xs text-muted-foreground">{t("ddash.needHelp")}</p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/30 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-full">
                <MapPin className="w-4 h-4 text-quickgo-blue" />
                <span className="text-white text-sm">{driver?.city ?? "—"}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <LanguageSwitcher className="hidden sm:inline-flex" />
              {/* Online Toggle */}
              <div className="flex items-center gap-3">
                <span className={`text-sm ${isOnline ? "text-quickgo-lime" : "text-muted-foreground"}`}>
                  {isOnline ? t("ddash.online") : t("ddash.offline")}
                </span>
                <button
                  onClick={toggleOnline}
                  disabled={togglingOnline || driver?.status === "delivering"}
                  title={driver?.status === "delivering" ? t("ddash.deliveringLock") : undefined}
                  className={`w-12 h-6 rounded-full transition-all relative disabled:opacity-60 disabled:cursor-not-allowed ${
                    isOnline ? "bg-quickgo-lime" : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                      isOnline ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>

              <Link href="/driver/messages" className="relative p-2 hover:bg-white/5 rounded-full">
                <Bell className="w-5 h-5 text-muted-foreground" />
              </Link>

              <div className="flex items-center gap-3 pl-4 border-l border-border/30">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-quickgo-lime bg-white/5 flex items-center justify-center">
                  {driver?.user?.avatar_url ? (
                    <Image
                      src={driver.user.avatar_url}
                      alt={firstName}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - 2 cols */}
            <div className="lg:col-span-2 space-y-6">
              {/* Driver Profile Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Profile */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center">
                        {driver?.user?.avatar_url ? (
                          <Image
                            src={driver.user.avatar_url}
                            alt={firstName}
                            width={96}
                            height={96}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <User className="w-10 h-10 text-muted-foreground" />
                        )}
                      </div>
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-quickgo-blue rounded-full flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        {t("ddash.hello")}, {firstName} <span>👋</span>
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {driver ? `${t("ddash.partnerSince")} ${monthsSince(driver.created_at)} ${t("ddash.months")}` : "…"}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-white font-semibold">{rating.toFixed(1)}</span>
                          <span className="text-xs text-muted-foreground">
                            ({driver?.total_deliveries ?? 0} {t("ddash.deliveries")})
                          </span>
                        </div>
                        {topPercent !== null && (
                          <div className="flex items-center gap-1">
                            <Trophy className="w-4 h-4 text-yellow-400" />
                            <span className="text-white font-semibold">Top {topPercent}%</span>
                            <span className="text-xs text-muted-foreground">{t("ddash.topCity")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Today's Earnings */}
                  <div className="flex-1 bg-card/30 rounded-2xl p-4 ml-auto">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{t("ddash.todayEarnings")}</span>
                    </div>
                    <p className="text-2xl font-bold text-white">
                      {loading ? "—" : fmtCFA(driver?.today_earnings ?? 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {driver?.today_deliveries ?? 0} {t("ddash.ridesDone")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <Link href="/driver/settings">
                    <Button variant="outline" className="rounded-full">
                      {t("ddash.viewProfile")}
                    </Button>
                  </Link>
                  <Link href="/driver/earnings">
                    <Button className="rounded-full bg-quickgo-blue hover:bg-quickgo-blue/90">
                      {t("ddash.viewEarnings")}
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: t("ddash.stat.todayRides"), value: String(driver?.today_deliveries ?? 0), sub: t("ddash.stat.today"), icon: Car },
                  { label: t("ddash.stat.totalDeliveries"), value: String(driver?.total_deliveries ?? 0), sub: t("ddash.stat.sinceStart"), icon: CheckCircle },
                  { label: t("ddash.stat.rating"), value: rating.toFixed(1), sub: rating >= 4.5 ? t("ddash.stat.excellent") : rating >= 3.5 ? t("ddash.stat.good") : "—", icon: Star, star: true },
                  {
                    label: t("ddash.stat.dailyChallenge"),
                    value: dailyMission?.mission ? `${dailyMission.current_count}/${dailyMission.mission.target_count}` : "—",
                    sub: dailyMission?.mission ? `${t("ddash.bonus")} ${fmtCFA(dailyMission.mission.reward_amount)}` : t("ddash.noChallenge"),
                    icon: Gift,
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-card/50 backdrop-blur-xl rounded-2xl p-4 border border-border/30"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                      <stat.icon className={`w-4 h-4 ${stat.star ? "text-yellow-400" : "text-quickgo-blue"}`} />
                    </div>
                    <p className="text-xl font-bold text-white flex items-center gap-1">
                      {stat.value}
                      {stat.star && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{stat.sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* Missions quick access — the fleet-wide Control Center is a
                  supervisor tool, so it's no longer surfaced to drivers here. */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-quickgo-blue/20 flex items-center justify-center">
                      <MapPin className="w-7 h-7 text-quickgo-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{t("ddash.missionsNear")}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t("ddash.currentZone")} : {driver?.city ?? "—"} · {t("ddash.findRide")}
                      </p>
                    </div>
                  </div>
                  <Link href="/driver/missions">
                    <Button variant="outline" className="rounded-full">
                      {t("ddash.open")}
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </motion.div>

              {/* QuickGo Pay Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-quickgo-blue/20 to-quickgo-cyan/20 rounded-3xl p-6 border border-quickgo-blue/30"
              >
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-quickgo-blue/30 flex items-center justify-center">
                      <Wallet className="w-8 h-8 text-quickgo-blue" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">QuickGo Pay</h3>
                      <p className="text-sm text-muted-foreground">
                        {t("ddash.payDesc")}
                      </p>
                      <Link href="/wallet">
                        <Button variant="link" className="p-0 h-auto text-quickgo-blue">
                          {t("ddash.goWallet")}
                        </Button>
                      </Link>
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-end gap-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">{t("ddash.walletBalance")}</p>
                      <p className="text-2xl font-bold text-white">{loading ? "—" : fmtCFA(walletBalance)}</p>
                      <Link href="/wallet">
                        <Button variant="outline" size="sm" className="mt-2 rounded-full">
                          {t("ddash.withdraw")}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Active delivery */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{t("ddash.activeDelivery")}</h3>
                  {activeDelivery && (
                    <span className="text-xs text-quickgo-lime bg-quickgo-lime/20 px-2 py-1 rounded-full">
                      {activeDelivery.order_type}
                    </span>
                  )}
                </div>

                {activeDelivery ? (
                  <>
                    <div className="relative h-32 bg-gradient-to-br from-quickgo-blue/10 to-quickgo-cyan/10 rounded-xl mb-4 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Navigation className="w-8 h-8 text-quickgo-blue" />
                      </div>
                      <div className="absolute bottom-2 right-2 bg-card/80 backdrop-blur-sm px-2 py-1 rounded text-xs text-white">
                        {activeDelivery.destination}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">{t("ddash.client")}</p>
                          <p className="text-white font-medium">{activeDelivery.customer_name}</p>
                        </div>
                      </div>
                      {activeDelivery.customer_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-white">{activeDelivery.customer_phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-card/30 rounded-xl p-3 mb-4 text-center">
                      <p className="text-xs text-muted-foreground">{t("ddash.estimatedEarning")}</p>
                      <p className="text-white font-semibold">{fmtCFA(activeDelivery.earning)}</p>
                    </div>

                    <Link href="/driver/navigation">
                      <Button className="w-full bg-quickgo-blue hover:bg-quickgo-blue/90 rounded-xl">
                        {t("ddash.viewDetails")}
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/5 flex items-center justify-center">
                      <Navigation className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{t("ddash.noActiveDelivery")}</p>
                    <Link href="/driver/missions">
                      <Button variant="outline" size="sm" className="rounded-full">
                        {t("ddash.seeMissions")}
                      </Button>
                    </Link>
                  </div>
                )}
              </motion.div>

              {/* Challenges & Incentives */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{t("ddash.challenges")}</h3>
                  <Link href="/driver/missions" className="text-quickgo-blue text-sm">{t("ddash.seeAll")}</Link>
                </div>

                {/* Daily Objective */}
                {dailyMission?.mission ? (
                  <div className="bg-card/30 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-quickgo-blue" />
                        <span className="text-white font-medium">{dailyMission.mission.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-quickgo-lime" />
                        <span className="text-quickgo-lime text-sm">Bonus {fmtCFA(dailyMission.mission.reward_amount)}</span>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2 mb-1">
                      <div
                        className="bg-quickgo-lime h-2 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((dailyMission.current_count / Math.max(dailyMission.mission.target_count, 1)) * 100))}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {dailyMission.current_count} / {dailyMission.mission.target_count}
                    </p>
                  </div>
                ) : (
                  <div className="bg-card/30 rounded-xl p-4 mb-4 text-center">
                    <p className="text-sm text-muted-foreground">{t("ddash.noChallengeNow")}</p>
                  </div>
                )}

                {/* Streak */}
                <div className="bg-card/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-white font-medium">{t("ddash.streak")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flame className="w-6 h-6 text-orange-500" />
                    <span className="text-2xl font-bold text-white">{me?.streak ?? 0} {(me?.streak ?? 0) > 1 ? t("ddash.days") : t("ddash.day")}</span>
                  </div>
                </div>
              </motion.div>

              {/* Vehicle */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card/50 backdrop-blur-xl rounded-3xl p-6 border border-border/30"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{t("ddash.myVehicle")}</h3>
                  <Link href="/driver/settings" className="text-quickgo-blue text-sm">{t("ddash.viewDetails")}</Link>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("ddash.vehType")}</span>
                    <span className="text-white font-medium capitalize">{driver?.vehicle_type ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("ddash.brandModel")}</span>
                    <span className="text-white font-medium">
                      {[driver?.vehicle_brand, driver?.vehicle_model].filter(Boolean).join(" ") || "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("ddash.plate")}</span>
                    <span className="text-white font-medium">{driver?.license_plate ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t("ddash.vehStatus")}</span>
                    <span className="text-quickgo-lime font-medium capitalize">{driver?.status ?? "—"}</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
