"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart,
  Clock, MapPin, Calendar, Download, ArrowUpRight, ArrowDownRight, Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"

type AnalyticsData = {
  period_days: number
  kpi: {
    revenue: number
    revenue_change: number
    orders: number
    orders_change: number
    avg_delivery_min: number | null
    delivery_change: number
    satisfaction: number | null
    satisfaction_change: number
  }
  weekly: { day: string; date: string; orders: number; revenue: number }[]
  summary: { total_orders: number; total_revenue: number; avg_per_day: number }
  top_cities: { name: string; orders: number; percentage: number }[]
  top_categories: { name: string; orders: number; revenue: number; growth: number }[]
}

function formatCFA(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M CFA`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K CFA`
  return `${Math.round(n).toLocaleString("fr-FR")} CFA`
}

function signedPct(n: number) {
  return `${n >= 0 ? "+" : ""}${n}%`
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch("/api/admin/analytics")
        if (!res.ok) throw new Error()
        const json = await res.json()
        if (!cancelled) setData(json)
      } catch {
        if (!cancelled) toast.error("Erreur de chargement des analyses")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const kpi = data?.kpi
  const kpiCards = [
    {
      label: "Chiffre d'affaires",
      value: kpi ? formatCFA(kpi.revenue) : "—",
      change: signedPct(kpi?.revenue_change ?? 0),
      trend: (kpi?.revenue_change ?? 0) >= 0 ? "up" : "down",
      icon: DollarSign,
      color: "from-green-500/20 to-emerald-500/20",
      iconColor: "text-green-400",
    },
    {
      label: "Commandes totales",
      value: kpi ? kpi.orders.toLocaleString("fr-FR") : "—",
      change: signedPct(kpi?.orders_change ?? 0),
      trend: (kpi?.orders_change ?? 0) >= 0 ? "up" : "down",
      icon: ShoppingCart,
      color: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-400",
    },
    {
      label: "Temps moyen livraison",
      value: kpi?.avg_delivery_min != null ? `${kpi.avg_delivery_min} min` : "—",
      change: signedPct(kpi?.delivery_change ?? 0),
      // A shorter delivery time (negative change) is an improvement
      trend: (kpi?.delivery_change ?? 0) <= 0 ? "up" : "down",
      icon: Clock,
      color: "from-purple-500/20 to-pink-500/20",
      iconColor: "text-purple-400",
    },
    {
      label: "Taux de satisfaction",
      value: kpi?.satisfaction != null ? `${kpi.satisfaction}/5` : "—",
      change: `${(kpi?.satisfaction_change ?? 0) >= 0 ? "+" : ""}${kpi?.satisfaction_change ?? 0}`,
      trend: (kpi?.satisfaction_change ?? 0) >= 0 ? "up" : "down",
      icon: TrendingUp,
      color: "from-yellow-500/20 to-orange-500/20",
      iconColor: "text-yellow-400",
    },
  ]

  const weeklyData = data?.weekly ?? []
  const topCities = data?.top_cities ?? []
  const topCategories = data?.top_categories ?? []
  const maxOrders = Math.max(1, ...weeklyData.map(d => d.orders))
  const currentMonth = new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" })

  const exportCsv = () => {
    if (topCities.length === 0 && topCategories.length === 0) {
      toast.info("Aucune donnée à exporter")
      return
    }
    const rows: (string | number)[][] = []
    rows.push(["Top villes"])
    rows.push(["Ville", "Commandes", "Pourcentage"])
    topCities.forEach((c) => rows.push([c.name, c.orders, `${c.percentage}%`]))
    rows.push([])
    rows.push(["Performance par catégorie"])
    rows.push(["Catégorie", "Commandes", "Revenus (CFA)", "Croissance"])
    topCategories.forEach((cat) => rows.push([cat.name, cat.orders, Math.round(cat.revenue), signedPct(cat.growth)]))
    const csv = rows
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
      .join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `analytics-quickgo-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success("Rapport exporté")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center text-white">
          <Loader2 className="h-6 w-6 animate-spin text-[#6b6b8a]" />
          <span className="ml-3 text-[#6b6b8a]">Chargement des analyses…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <AdminSidebar />

      <div className="flex-1 overflow-auto p-6 lg:p-8 text-white">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">
              Analyses et Statistiques
            </h1>
            <p className="text-[#6b6b8a]">Données en temps réel · {currentMonth}</p>
          </div>
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#16161f] border border-[#1e1e2e]">
              <Calendar className="h-4 w-4 text-[#6b6b8a]" />
              <span className="text-sm text-white">{data?.period_days ?? 30} derniers jours</span>
            </div>
            <Button onClick={exportCsv} variant="outline" className="gap-2 border-[#1e1e2e] bg-[#16161f] text-white hover:bg-[#1e1e2e]">
              <Download className="h-4 w-4" />
              Rapport
            </Button>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {kpiCards.map((kpiCard) => (
            <div
              key={kpiCard.label}
              className={`p-6 rounded-2xl bg-gradient-to-br ${kpiCard.color} border border-[#1e1e2e]`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-[#0a0a0f]/50 ${kpiCard.iconColor}`}>
                  <kpiCard.icon className="h-6 w-6" />
                </div>
                <span className={`flex items-center gap-1 text-sm font-medium ${
                  kpiCard.trend === "up" ? "text-green-400" : "text-red-400"
                }`}>
                  {kpiCard.trend === "up"
                    ? <ArrowUpRight className="h-4 w-4" />
                    : <ArrowDownRight className="h-4 w-4" />}
                  {kpiCard.change}
                </span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">{kpiCard.value}</p>
              <p className="text-sm text-[#6b6b8a]">{kpiCard.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Weekly Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="lg:col-span-2 p-6 rounded-2xl bg-[#16161f] border border-[#1e1e2e]"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Commandes hebdomadaires</h3>
                <p className="text-sm text-[#6b6b8a]">7 derniers jours</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-xs text-[#6b6b8a]">Commandes</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-xs text-[#6b6b8a]">Revenus</span>
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="flex items-end justify-between gap-2 h-48">
              {weeklyData.map((data, index) => (
                <div key={data.date} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col items-center gap-1">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(data.orders / maxOrders) * 100}%` }}
                      transition={{ delay: 0.2 + index * 0.05, duration: 0.5 }}
                      className="w-full max-w-[40px] bg-gradient-to-t from-blue-500 to-blue-500/50 rounded-t-lg"
                      style={{ minHeight: 20 }}
                      title={`${data.orders} commandes · ${formatCFA(data.revenue)}`}
                    />
                  </div>
                  <span className="text-xs text-[#6b6b8a]">{data.day}</span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-[#1e1e2e]">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {(data?.summary.total_orders ?? 0).toLocaleString("fr-FR")}
                </p>
                <p className="text-xs text-[#6b6b8a]">Total commandes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {formatCFA(data?.summary.total_revenue ?? 0)}
                </p>
                <p className="text-xs text-[#6b6b8a]">Revenus totaux</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  {(data?.summary.avg_per_day ?? 0).toLocaleString("fr-FR")}
                </p>
                <p className="text-xs text-[#6b6b8a]">Moyenne/jour</p>
              </div>
            </div>
          </motion.div>

          {/* Top Cities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-2xl bg-[#16161f] border border-[#1e1e2e]"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white">Top Villes</h3>
              <MapPin className="h-5 w-5 text-[#6b6b8a]" />
            </div>

            {topCities.length === 0 ? (
              <p className="text-sm text-[#6b6b8a]">Aucune donnée sur la période</p>
            ) : (
              <div className="space-y-4">
                {topCities.map((city, index) => (
                  <div key={city.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-white">{city.name}</span>
                      <span className="text-sm text-[#6b6b8a]">{city.orders} cmd</span>
                    </div>
                    <div className="h-2 bg-[#1e1e2e] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${city.percentage}%` }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
                        className={`h-full rounded-full ${
                          index === 0 ? "bg-blue-500" :
                          index === 1 ? "bg-cyan-500" :
                          index === 2 ? "bg-green-500" :
                          index === 3 ? "bg-yellow-500" : "bg-[#6b6b8a]"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-[#6b6b8a] mt-1">{city.percentage}%</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Categories Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="p-6 rounded-2xl bg-[#16161f] border border-[#1e1e2e]"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Performance par Catégorie</h3>
            <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
              Voir tout
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#0a0a0f]">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold text-[#6b6b8a]">Catégorie</th>
                  <th className="text-left p-4 text-sm font-semibold text-[#6b6b8a]">Commandes</th>
                  <th className="text-left p-4 text-sm font-semibold text-[#6b6b8a]">Revenus</th>
                  <th className="text-left p-4 text-sm font-semibold text-[#6b6b8a]">Croissance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1e2e]">
                {topCategories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-sm text-[#6b6b8a]">
                      Aucune donnée sur la période
                    </td>
                  </tr>
                ) : topCategories.map((cat) => (
                  <tr key={cat.name} className="hover:bg-[#0a0a0f]/50 transition-colors">
                    <td className="p-4">
                      <span className="font-medium text-white">{cat.name}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-white">{cat.orders.toLocaleString("fr-FR")}</span>
                    </td>
                    <td className="p-4">
                      <span className="font-medium text-white">{formatCFA(cat.revenue)}</span>
                    </td>
                    <td className="p-4">
                      <span className={`flex items-center gap-1 text-sm font-medium ${
                        cat.growth >= 0 ? "text-green-400" : "text-red-400"
                      }`}>
                        {cat.growth >= 0
                          ? <TrendingUp className="h-4 w-4" />
                          : <TrendingDown className="h-4 w-4" />}
                        {signedPct(cat.growth)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
