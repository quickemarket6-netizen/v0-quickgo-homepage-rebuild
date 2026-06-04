"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  MapPin, ArrowLeft, RefreshCw, Plus, Search,
  ChevronRight, ChevronDown, Truck, Store, Package,
  TrendingUp, Circle, CheckCircle2, Clock, AlertTriangle,
  DollarSign, Map, Layers, Globe,
} from "lucide-react"
import Link from "next/link"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell,
} from "recharts"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"

// ─── types ───────────────────────────────────────────────────────────────────
interface Zone { id: string; name: string; status: string; drivers: number; orders_today: number }
interface City {
  id: string; name: string; region: string; status: string; lat: number; lng: number
  drivers_active: number; vendors_active: number; orders_today: number; revenue_today: number
  coverage_pct: number; avg_delivery_min: number; population: number
  zones: Zone[]; added_at: string
}
interface CityBar { name: string; full_name: string; revenue: number; orders: number }
interface GrowthDay { month: string; cities: number; drivers: number; orders: number }
interface Kpi { cities_active: number; cities_limited: number; cities_pending: number; total_drivers: number; orders_today: number; revenue_today: number; coverage_cities: number }
interface PageData { kpi: Kpi; cities: City[]; revenue_by_city: CityBar[]; growth_trend: GrowthDay[] }

// ─── configs ─────────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; dot: string; pulse: boolean }> = {
  active:  { label:"Active",   color:"text-green-300",  bg:"bg-green-500/15",  border:"border-green-500/30",  dot:"bg-green-400",  pulse:false },
  limited: { label:"Limitée",  color:"text-amber-300",  bg:"bg-amber-500/15",  border:"border-amber-500/30",  dot:"bg-amber-400",  pulse:true  },
  pending: { label:"En attente",color:"text-blue-300",  bg:"bg-blue-500/15",   border:"border-blue-500/30",   dot:"bg-blue-400",   pulse:true  },
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function fmtCFA(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M FCFA"
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k FCFA"
  return n + " FCFA"
}
function fmtNum(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M"
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k"
  return String(n)
}

function CountUp({ target, decimals = 0 }: { target: number; decimals?: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const steps = 40; let i = 0
    const iv = setInterval(() => {
      i++; setVal(Math.round((target * i / steps) * 10 ** decimals) / 10 ** decimals)
      if (i >= steps) clearInterval(iv)
    }, 800 / steps)
    return () => clearInterval(iv)
  }, [target, decimals])
  return <>{val}</>
}

// ─── Cameroon SVG map ─────────────────────────────────────────────────────────
const CAMEROON_PATH = "M 185 20 L 230 25 L 255 18 L 270 30 L 290 28 L 310 45 L 320 65 L 315 85 L 300 95 L 295 115 L 280 125 L 275 145 L 260 155 L 250 175 L 240 190 L 225 200 L 210 215 L 200 235 L 190 255 L 180 270 L 170 290 L 160 310 L 150 330 L 145 355 L 140 375 L 135 400 L 130 420 L 128 450 L 125 470 L 120 490 L 100 505 L 85 510 L 70 505 L 55 495 L 45 480 L 42 460 L 50 440 L 55 420 L 48 400 L 40 380 L 42 360 L 50 345 L 60 330 L 58 310 L 52 295 L 60 280 L 75 270 L 80 255 L 75 235 L 65 220 L 70 205 L 85 195 L 95 178 L 90 160 L 82 145 L 88 130 L 100 118 L 108 100 L 115 82 L 118 62 L 128 48 L 145 38 L 165 28 Z"

const CITY_COORDS: Record<string, [number, number]> = {
  "Yaoundé":    [180, 270],
  "Douala":     [105, 285],
  "Bafoussam":  [130, 230],
  "Garoua":     [215, 125],
  "Maroua":     [235, 80],
  "Bamenda":    [110, 195],
  "Ngaoundéré": [205, 185],
  "Bertoua":    [250, 290],
}

function CityMap({ cities, selectedCity, onSelect }:
  { cities: City[]; selectedCity: string | null; onSelect: (id: string) => void }) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="relative w-full" style={{ paddingBottom: "130%" }}>
      <svg viewBox="0 0 380 550" className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {/* map background */}
        <path d={CAMEROON_PATH} fill="#1e1e2e" stroke="#2a2a3e" strokeWidth={2} />

        {/* city markers */}
        {cities.map(city => {
          const [cx, cy] = CITY_COORDS[city.name] ?? [0, 0]
          if (!cx) return null
          const isSelected = selectedCity === city.id
          const isHovered  = hovered === city.id
          const cfg = STATUS_CFG[city.status] ?? STATUS_CFG.active
          const color = city.status === "active" ? "#22c55e" : city.status === "limited" ? "#f59e0b" : "#3b82f6"

          return (
            <g key={city.id} style={{ cursor: "pointer" }}
              onMouseEnter={() => setHovered(city.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(city.id)}
            >
              {(isSelected || isHovered) && (
                <circle cx={cx} cy={cy} r={20} fill={color} fillOpacity={0.15} />
              )}
              {city.status !== "pending" && (
                <>
                  <circle cx={cx} cy={cy} r={14} fill={color} fillOpacity={0.1} />
                  <circle cx={cx} cy={cy} r={8} fill={color} fillOpacity={0.4}>
                    {city.status === "limited" && (
                      <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                    )}
                  </circle>
                </>
              )}
              <circle cx={cx} cy={cy} r={isSelected ? 6 : 4} fill={color} />
              {(isSelected || isHovered) && (
                <text x={cx + 12} y={cy + 4} fill="white" fontSize="11" fontWeight="600">{city.name}</text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, subUp, icon: Icon, iconColor, delay, prefix = "", suffix = "" }:
  { label: string; value: number; sub?: string; subUp?: boolean; icon: typeof MapPin; iconColor: string; delay: number; prefix?: string; suffix?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-[#6b6b8a] uppercase tracking-wider font-medium">{label}</span>
          <span className="text-2xl font-bold text-white leading-none">{prefix}<CountUp target={value} />{suffix}</span>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}20` }}>
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
      </div>
      {sub && (
        <div className={`flex items-center gap-1 text-[12px] font-medium ${subUp ? "text-green-400" : "text-[#6b6b8a]"}`}>
          {subUp && <TrendingUp className="w-3.5 h-3.5" />}
          {sub}
        </div>
      )}
    </motion.div>
  )
}

// ─── main page ───────────────────────────────────────────────────────────────
export default function ZonesPage() {
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [expandedCity, setExpandedCity] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true)
    const res = await fetch("/api/admin/zones")
    const json: PageData = await res.json()
    setData(json)
    setLastUpdated(new Date())
    if (isRefresh) setTimeout(() => setRefreshing(false), 600)
    else setLoading(false)
  }
  useEffect(() => { load() }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}>
        <MapPin className="w-10 h-10 text-green-400" />
      </motion.div>
    </div>
  )

  const kpi = data!.kpi
  const cities = data!.cities

  const filtered = cities.filter(c => {
    const matchStatus = statusFilter === "all" || c.status === statusFilter
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.region.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const filterKey = `${statusFilter}-${search}`
  const selectedCityData = selectedCity ? cities.find(c => c.id === selectedCity) : null

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <AdminSidebar />
      <div className="flex-1 overflow-auto text-white">
      {/* header */}
      <div className="sticky top-0 z-30 bg-[#0a0a0f]/90 backdrop-blur border-b border-[#1e1e2e] px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="p-2 rounded-xl hover:bg-[#1e1e2e] transition-colors">
            <ArrowLeft className="w-4 h-4 text-[#6b6b8a]" />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-white leading-none">Gestion des villes</h1>
              <p className="text-[11px] text-[#6b6b8a] mt-0.5">
                Mis à jour {lastUpdated.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={() => load(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#16161f] border border-[#1e1e2e] text-[#6b6b8a] hover:text-white transition-colors text-[12px]">
              <motion.div animate={refreshing ? { rotate: 360 } : {}} transition={refreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : {}}>
                <RefreshCw className="w-3.5 h-3.5" />
              </motion.div>
              Actualiser
            </motion.button>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-[12px] font-medium transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Ajouter ville
            </motion.button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Villes actives"   value={kpi.cities_active}   sub="Opérationnelles"    subUp icon={CheckCircle2} iconColor="#22c55e" delay={0}    />
          <KpiCard label="Limitées"          value={kpi.cities_limited}  sub="Couverture partielle"     icon={AlertTriangle}  iconColor="#f59e0b" delay={0.07} />
          <KpiCard label="En attente"        value={kpi.cities_pending}  sub="Lancement prochain"       icon={Clock}          iconColor="#3b82f6" delay={0.14} />
          <KpiCard label="Livreurs actifs"   value={kpi.total_drivers}   sub="Sur le terrain"     subUp icon={Truck}         iconColor="#8b5cf6" delay={0.21} />
          <KpiCard label="Commandes / jour"  value={kpi.orders_today}    sub="Toutes villes"      subUp icon={Package}       iconColor="#3b82f6" delay={0.28} />
          <KpiCard label="Revenus / jour"    value={Math.round(kpi.revenue_today / 1000)} sub="En milliers FCFA" subUp icon={DollarSign} iconColor="#22c55e" delay={0.35} suffix="k" />
        </div>

        {/* main grid */}
        <div className="grid grid-cols-5 gap-6">
          {/* city list – 3/5 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="col-span-3 bg-[#16161f] border border-[#1e1e2e] rounded-2xl overflow-hidden flex flex-col"
          >
            {/* filters */}
            <div className="p-4 border-b border-[#1e1e2e] space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6b6b8a]" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher ville ou région..."
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl pl-9 pr-4 py-2.5 text-[13px] text-white placeholder-[#6b6b8a] outline-none focus:border-green-500/50" />
                </div>
                {["all","active","limited","pending"].map(s => (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`shrink-0 px-3 py-2 rounded-xl text-[12px] font-medium transition-all ${statusFilter === s ? "bg-green-600 text-white" : "text-[#6b6b8a] hover:text-white hover:bg-[#1e1e2e]"}`}>
                    {s === "all" ? "Toutes" : STATUS_CFG[s]?.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto" style={{ maxHeight: 580 }}>
              <AnimatePresence mode="wait">
                <motion.div key={filterKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  {filtered.map((city, i) => {
                    const cfg = STATUS_CFG[city.status] ?? STATUS_CFG.active
                    const isExpanded = expandedCity === city.id
                    const isSelected = selectedCity === city.id
                    return (
                      <div key={city.id} className="border-b border-[#1e1e2e] last:border-0">
                        <motion.div
                          initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: i * 0.05 }}
                          className={`px-4 py-4 hover:bg-[#1e1e2e]/50 cursor-pointer transition-colors ${isSelected ? "bg-green-500/5 border-l-2 border-green-500" : ""}`}
                          onClick={() => {
                            setSelectedCity(isSelected ? null : city.id)
                            setExpandedCity(isExpanded ? null : city.id)
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg} border ${cfg.border}`}>
                              <MapPin className={`w-5 h-5 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[14px] font-bold text-white">{city.name}</span>
                                <span className="text-[11px] text-[#6b6b8a]">— {city.region}</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${cfg.pulse ? "animate-pulse" : ""}`} />
                                  {cfg.label}
                                </span>
                              </div>
                              <div className="grid grid-cols-4 gap-2 mt-2">
                                <div className="text-center">
                                  <p className="text-[13px] font-bold text-white">{city.drivers_active}</p>
                                  <p className="text-[10px] text-[#6b6b8a]">Livreurs</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[13px] font-bold text-white">{city.vendors_active}</p>
                                  <p className="text-[10px] text-[#6b6b8a]">Vendeurs</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[13px] font-bold text-white">{city.orders_today}</p>
                                  <p className="text-[10px] text-[#6b6b8a]">Commandes</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[13px] font-bold text-white">{city.coverage_pct}%</p>
                                  <p className="text-[10px] text-[#6b6b8a]">Couverture</p>
                                </div>
                              </div>
                              {city.coverage_pct > 0 && (
                                <div className="mt-2 h-1.5 bg-[#1e1e2e] rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${city.coverage_pct}%` }}
                                    transition={{ duration: 0.7, delay: 0.4 + i * 0.05 }}
                                    className={`h-full rounded-full ${city.coverage_pct >= 80 ? "bg-green-500" : city.coverage_pct >= 50 ? "bg-amber-500" : "bg-blue-500"}`} />
                                </div>
                              )}
                            </div>
                            <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.2 }}>
                              <ChevronRight className="w-4 h-4 text-[#6b6b8a] shrink-0" />
                            </motion.div>
                          </div>
                        </motion.div>

                        {/* expanded zones */}
                        <AnimatePresence>
                          {isExpanded && city.zones.length > 0 && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 ml-13 space-y-2">
                                <p className="text-[11px] text-[#6b6b8a] font-medium mb-2 pl-1">
                                  <Layers className="inline w-3 h-3 mr-1" />{city.zones.length} zone{city.zones.length > 1 ? "s" : ""}
                                </p>
                                {city.zones.map((zone, zi) => (
                                  <motion.div key={zone.id}
                                    initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: zi * 0.05 }}
                                    className="flex items-center justify-between p-2.5 bg-[#0a0a0f] rounded-xl"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className={`w-2 h-2 rounded-full ${zone.status === "active" ? "bg-green-400" : "bg-amber-400"}`} />
                                      <span className="text-[12px] text-white font-medium">{zone.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[11px] text-[#6b6b8a]">
                                      <span className="flex items-center gap-1"><Truck className="w-3 h-3" />{zone.drivers}</span>
                                      <span className="flex items-center gap-1"><Package className="w-3 h-3" />{zone.orders_today}</span>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* right panel – 2/5 */}
          <div className="col-span-2 flex flex-col gap-4">
            {/* Cameroon map */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.49, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-green-400" />
                Carte du Cameroun
              </h3>
              <div className="flex items-center gap-4 mb-2 flex-wrap">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400" /><span className="text-[10px] text-[#6b6b8a]">Active</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /><span className="text-[10px] text-[#6b6b8a]">Limitée</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-400" /><span className="text-[10px] text-[#6b6b8a]">En attente</span></div>
              </div>
              <CityMap cities={cities} selectedCity={selectedCity} onSelect={id => {
                setSelectedCity(id === selectedCity ? null : id)
                setExpandedCity(id === selectedCity ? null : id)
              }} />
              {selectedCityData && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-3 p-3 bg-[#0a0a0f] rounded-xl border border-[#1e1e2e]">
                  <p className="text-[13px] font-bold text-white">{selectedCityData.name}</p>
                  <p className="text-[11px] text-[#6b6b8a]">{selectedCityData.region} · Pop. {fmtNum(selectedCityData.population)}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px]">
                    <span className="text-white">{selectedCityData.avg_delivery_min}min moy.</span>
                    <span className="text-green-400">{fmtCFA(selectedCityData.revenue_today)}</span>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* revenue bar chart */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.56, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                Revenus par ville (FCFA)
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data!.revenue_by_city} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false}
                    tickFormatter={v => v >= 1_000_000 ? (v/1_000_000).toFixed(1)+"M" : v >= 1_000 ? (v/1_000)+"k" : String(v)} />
                  <Tooltip
                    contentStyle={{ background: "#16161f", border: "1px solid #1e1e2e", borderRadius: 12, fontSize: 12 }}
                    formatter={(val: number) => [fmtCFA(val), "Revenus"]}
                    labelFormatter={(label: string) => data!.revenue_by_city.find(c => c.name === label)?.full_name ?? label}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                    {data!.revenue_by_city.map((_, i) => (
                      <Cell key={i} fill={i === 0 ? "#22c55e" : i === 1 ? "#3b82f6" : "#6b6b8a"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* growth trend */}
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.63, ease: [0.22, 1, 0.36, 1] }}
              className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-5"
            >
              <h3 className="text-[13px] font-semibold text-white mb-1 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                Croissance réseau
              </h3>
              <p className="text-[11px] text-[#6b6b8a] mb-3">Commandes & livreurs sur 6 mois</p>
              <ResponsiveContainer width="100%" height={90}>
                <AreaChart data={data!.growth_trend} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#6b6b8a", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#16161f", border: "1px solid #1e1e2e", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="orders" stroke="#22c55e" strokeWidth={2} fill="url(#gOrders)" name="Commandes" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
