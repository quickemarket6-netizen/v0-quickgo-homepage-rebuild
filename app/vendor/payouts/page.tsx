"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft, ArrowUpRight, Clock, CheckCircle2, XCircle,
  RefreshCw, Filter, Download, Search, Wallet, ChevronRight,
  AlertCircle, LayoutDashboard, Package, ShoppingBag,
  Users, Settings, BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Payout {
  id: string
  amount: number
  payout_method: string
  payout_phone: string
  status: string
  created_at: string
  completed_at?: string
  rejection_reason?: string
  cinetpay_reference?: string
  failure_reason?: string
}

const navItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendor/analytics" },
  { icon: Package, label: "Produits", href: "/vendor/products" },
  { icon: ShoppingBag, label: "Commandes", href: "/vendor/orders" },
  { icon: Users, label: "Clients CRM", href: "/vendor/crmdashboard" },
  { icon: Wallet, label: "Finances", href: "/vendor/finances", active: true },
  { icon: Settings, label: "Paramètres", href: "/dashboard/settings" },
]

function formatCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F"
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
}
function payoutMethodIcon(m: string) {
  return m === "orange_money" ? "🟠" : m === "mtn_momo" ? "💛" : "🏦"
}
function payoutMethodLabel(m: string) {
  return m === "orange_money" ? "Orange Money" : m === "mtn_momo" ? "MTN MoMo" : "Banque"
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; cls: string; label: string }> = {
  pending: { icon: Clock, cls: "bg-amber-100 text-amber-700", label: "En attente" },
  approved: { icon: CheckCircle2, cls: "bg-blue-100 text-blue-700", label: "Approuvé" },
  processing: { icon: RefreshCw, cls: "bg-purple-100 text-purple-700", label: "En cours" },
  completed: { icon: CheckCircle2, cls: "bg-green-100 text-green-700", label: "Complété" },
  rejected: { icon: XCircle, cls: "bg-red-100 text-red-700", label: "Refusé" },
  failed: { icon: AlertCircle, cls: "bg-gray-100 text-gray-600", label: "Échoué" },
}

export default function VendorPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")

  const fetchPayouts = useCallback(async () => {
    try {
      const profileRes = await fetch("/api/profile")
      if (!profileRes.ok) return
      const vendorRes = await fetch("/api/vendors?my=true")
      if (!vendorRes.ok) return
      const vendors = await vendorRes.json()
      const vid = Array.isArray(vendors) ? vendors[0]?.id : vendors?.id
      if (!vid) return
      setVendorId(vid)

      const res = await fetch(`/api/vendor/wallet?vendor_id=${vid}`)
      if (res.ok) {
        const data = await res.json()
        setPayouts(data.payouts ?? [])
      }
    } catch {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPayouts() }, [fetchPayouts])

  const filtered = payouts.filter((p) => {
    const matchFilter = filter === "all" || p.status === filter
    const matchSearch = !search || p.payout_phone.includes(search) || p.id.includes(search)
    return matchFilter && matchSearch
  })

  const totalCompleted = payouts.filter((p) => p.status === "completed").reduce((s, p) => s + p.amount, 0)
  const totalPending = payouts.filter((p) => ["pending", "approved", "processing"].includes(p.status)).reduce((s, p) => s + p.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-60 bg-white border-r border-gray-100 flex flex-col fixed h-full z-20 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-quickgo-blue to-quickgo-cyan rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-bold bg-gradient-to-r from-quickgo-blue to-quickgo-cyan bg-clip-text text-transparent">QuickGo</span>
          </Link>
          <span className="text-xs text-gray-500 mt-0.5 block">Espace Vendeur</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${item.active
                ? "bg-gradient-to-r from-quickgo-blue/10 to-quickgo-cyan/10 text-quickgo-blue font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              <item.icon size={17} />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="ml-60 flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/vendor/finances" className="p-2 rounded-xl hover:bg-gray-50 transition-colors">
              <ArrowLeft size={18} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Historique des retraits</h1>
              <p className="text-sm text-gray-500">{payouts.length} retrait{payouts.length > 1 ? "s" : ""} au total</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchPayouts} className="gap-2">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Actualiser
            </Button>
            <Link href="/vendor/finances">
              <Button size="sm" className="gap-2 bg-gradient-to-r from-quickgo-blue to-quickgo-cyan text-white border-0">
                <ArrowUpRight size={14} />
                Nouveau retrait
              </Button>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total reçu", value: formatCFA(totalCompleted), icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
              { label: "En cours de traitement", value: formatCFA(totalPending), icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
              { label: "Retraits effectués", value: `${payouts.filter((p) => p.status === "completed").length}`, icon: ArrowUpRight, color: "text-quickgo-blue", bg: "bg-blue-100" },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                  <s.icon size={20} className={s.color} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Chercher par téléphone ou ID..."
                  className="pl-8 pr-4 py-2 text-sm border border-gray-200 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-quickgo-blue/20"
                />
              </div>
              <div className="flex gap-1">
                {["all", "pending", "processing", "completed", "rejected", "failed"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${filter === f ? "bg-quickgo-blue text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                  >
                    {f === "all" ? "Tous" : STATUS_CONFIG[f]?.label ?? f}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            <div className="divide-y divide-gray-50">
              {loading ? (
                <div className="p-12 flex items-center justify-center">
                  <RefreshCw className="animate-spin text-quickgo-blue" size={24} />
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center">
                  <Wallet className="mx-auto text-gray-300 mb-3" size={36} />
                  <p className="text-gray-500 font-medium">Aucun retrait trouvé</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {filter !== "all" ? "Essayez un autre filtre" : "Vos retraits apparaîtront ici"}
                  </p>
                </div>
              ) : (
                filtered.map((p, i) => {
                  const config = STATUS_CONFIG[p.status] ?? { icon: AlertCircle, cls: "bg-gray-100 text-gray-600", label: p.status }
                  const Icon = config.icon
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors"
                    >
                      <span className="text-3xl">{payoutMethodIcon(p.payout_method)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">{payoutMethodLabel(p.payout_method)}</p>
                          <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.cls}`}>
                            <Icon size={11} className={p.status === "processing" ? "animate-spin" : ""} />
                            {config.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{p.payout_phone}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                          <span>Demandé: {formatDate(p.created_at)}</span>
                          {p.completed_at && <span>Complété: {formatDate(p.completed_at)}</span>}
                          {p.cinetpay_reference && <span>Ref: {p.cinetpay_reference}</span>}
                        </div>
                        {p.rejection_reason && (
                          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                            <XCircle size={11} />
                            {p.rejection_reason}
                          </p>
                        )}
                        {p.failure_reason && (
                          <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                            <AlertCircle size={11} />
                            {p.failure_reason}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-gray-900 text-lg">{formatCFA(p.amount)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{p.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
