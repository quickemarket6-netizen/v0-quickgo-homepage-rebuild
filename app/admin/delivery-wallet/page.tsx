"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, Users, Truck, Store, BarChart3,
  Settings, Wallet, RefreshCw, CheckCircle2, Clock, X,
  Phone, DollarSign, AlertTriangle, TrendingDown,
  TrendingUp, Banknote, Filter, Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

// ─── Types ───────────────────────────────────────────────────────
interface DeliveryWallet {
  total_collected: number
  total_paid_to_drivers: number
  available_balance: number
  updated_at: string
}

interface OrderDelivery {
  id: string
  delivery_fee: number
  delivery_type: string
  driver_status: string
  driver_paid: boolean
  driver_paid_at: string | null
  driver_payment_method: string | null
  driver_payment_reference: string | null
  created_at: string
  order: {
    id: string
    order_number: string
    total: number
    created_at: string
    status: string
    customer: { full_name: string; phone: string } | null
    vendor: { name: string } | null
  } | null
  driver: { id: string; full_name: string; phone: string; avatar_url: string | null } | null
  delivery_rate: { name: string; amount: number } | null
}

interface WalletData {
  wallet: DeliveryWallet
  deliveries: OrderDelivery[]
  pending_payment: number
}

// ─── Sidebar ────────────────────────────────────────────────────
const sidebarItems = [
  { icon: LayoutDashboard, label: "Vue d'ensemble",  href: "/admin" },
  { icon: Package,         label: "Commandes",        href: "/admin/orders" },
  { icon: Truck,           label: "Livreurs",         href: "/admin/drivers", active: true },
  { icon: Users,           label: "Clients",          href: "/admin/users" },
  { icon: Store,           label: "Vendeurs",         href: "/admin/vendors" },
  { icon: BarChart3,       label: "Analyses",         href: "/admin/analytics" },
  { icon: Wallet,          label: "Finances",         href: "/admin/finances" },
  { icon: Settings,        label: "Paramètres",       href: "/admin/settings" },
]

// ─── Helpers ────────────────────────────────────────────────────
function formatCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F"
}
function formatDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  })
}

const METHOD_LABELS: Record<string, string> = {
  orange_money: "Orange Money",
  mtn_momo:     "MTN MoMo",
  cash:         "Espèces",
}
const METHOD_EMOJI: Record<string, string> = {
  orange_money: "🟠",
  mtn_momo:     "💛",
  cash:         "💵",
}

// ─── Pay Driver Modal ────────────────────────────────────────────
function PayDriverModal({
  delivery,
  walletBalance,
  onClose,
  onPaid,
}: {
  delivery: OrderDelivery
  walletBalance: number
  onClose: () => void
  onPaid: () => void
}) {
  const [method, setMethod] = useState<"orange_money" | "mtn_momo" | "cash">("orange_money")
  const [reference, setReference] = useState("")
  const [loading, setLoading] = useState(false)
  const amount = delivery.delivery_fee

  async function handlePay() {
    if (!delivery.driver) { toast.error("Aucun chauffeur assigné"); return }
    if (walletBalance < amount) { toast.error("Solde livraison insuffisant"); return }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/delivery-wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_delivery_id: delivery.id,
          driver_id:         delivery.driver.id,
          amount,
          payment_method:    method,
          payment_reference: reference || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur")
      toast.success(`${formatCFA(amount)} versés à ${delivery.driver.full_name}`)
      onPaid()
      onClose()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur serveur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="p-6 bg-green-50 border-b border-green-100 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-green-600" size={24} />
            <h2 className="text-lg font-bold text-gray-900">Rémunérer le chauffeur</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-white/60">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Driver + order info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Chauffeur</span>
              <span className="font-semibold text-gray-900">{delivery.driver?.full_name ?? "—"}</span>
            </div>
            {delivery.driver?.phone && (
              <div className="flex justify-between">
                <span className="text-gray-500">Téléphone</span>
                <a href={`tel:${delivery.driver.phone}`} className="text-quickgo-blue font-medium flex items-center gap-1">
                  <Phone size={12} />
                  {delivery.driver.phone}
                </a>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-500">Commande</span>
              <span className="text-gray-700">#{delivery.order?.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Type</span>
              <span className="text-gray-700 capitalize">{delivery.delivery_type}</span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-bold">
              <span className="text-gray-700">Montant à verser</span>
              <span className="text-xl text-green-700">{formatCFA(amount)}</span>
            </div>
          </div>

          {/* Wallet balance check */}
          {walletBalance < amount && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex gap-2">
              <AlertTriangle className="text-red-600 shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-red-700">
                Solde insuffisant — disponible : <b>{formatCFA(walletBalance)}</b>
              </p>
            </div>
          )}

          {/* Payment method */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Méthode de paiement</label>
            <div className="grid grid-cols-3 gap-2">
              {(["orange_money", "mtn_momo", "cash"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-sm ${
                    method === m
                      ? "border-quickgo-blue bg-blue-50 text-quickgo-blue font-semibold"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <span className="text-xl">{METHOD_EMOJI[m]}</span>
                  <span className="text-xs text-center leading-tight">{METHOD_LABELS[m]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Reference (optional) */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">
              Référence de transaction <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex: TXN-20260526-001"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-quickgo-blue/20"
            />
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
          <Button
            onClick={handlePay}
            disabled={loading || walletBalance < amount}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-2"
          >
            {loading
              ? <RefreshCw size={15} className="animate-spin" />
              : <CheckCircle2 size={15} />}
            Confirmer le paiement
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────
export default function AdminDeliveryWalletPage() {
  const [data, setData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"unpaid" | "paid" | "all">("unpaid")
  const [search, setSearch] = useState("")
  const [selectedDelivery, setSelectedDelivery] = useState<OrderDelivery | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/delivery-wallet?filter=${filter}`)
      if (res.ok) setData(await res.json())
      else toast.error("Erreur de chargement")
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchData() }, [fetchData])

  const wallet = data?.wallet
  const filtered = (data?.deliveries ?? []).filter((d) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      d.driver?.full_name?.toLowerCase().includes(q) ||
      d.order?.order_number?.toLowerCase().includes(q) ||
      d.order?.vendor?.name?.toLowerCase().includes(q)
    )
  })

  const unpaidCount = (data?.deliveries ?? []).filter((d) => !d.driver_paid && d.driver_status === "delivered").length

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full z-20 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-quickgo-blue to-quickgo-cyan rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-quickgo-blue to-quickgo-cyan bg-clip-text text-transparent">QuickGo</span>
          </Link>
          <span className="text-xs text-gray-500 mt-1 block">Administration</span>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                item.active
                  ? "bg-gradient-to-r from-quickgo-blue/10 to-quickgo-cyan/10 text-quickgo-blue font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon size={18} />
              <span className="text-sm flex-1">{item.label}</span>
            </Link>
          ))}
        </nav>
        {/* Quick links */}
        <div className="p-4 border-t border-gray-100 space-y-1">
          <Link href="/admin/delivery-rates" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <Truck size={15} />
            Grille tarifaire
          </Link>
          <Link href="/admin/finances" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <Wallet size={15} />
            Finances vendeurs
          </Link>
        </div>
      </div>

      <div className="ml-64 flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Compte livraison — Rémunération chauffeurs</h1>
            <p className="text-sm text-gray-500">Gestion du wallet livraison séparé</p>
          </div>
          <div className="flex items-center gap-3">
            {unpaidCount > 0 && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <AlertTriangle size={15} className="text-amber-600" />
                <span className="text-sm font-medium text-amber-800">
                  {unpaidCount} chauffeur{unpaidCount > 1 ? "s" : ""} à payer
                </span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={fetchData} className="gap-2">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Actualiser
            </Button>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-6">

          {/* Wallet balance cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                label: "Total collecté",
                value: wallet?.total_collected ?? 0,
                icon: TrendingUp,
                gradient: "from-green-500 to-emerald-600",
                sub: "Frais de livraison reçus",
              },
              {
                label: "Versé aux chauffeurs",
                value: wallet?.total_paid_to_drivers ?? 0,
                icon: TrendingDown,
                gradient: "from-blue-500 to-cyan-600",
                sub: "Total rémunérations",
              },
              {
                label: "Solde disponible",
                value: wallet?.available_balance ?? 0,
                icon: Banknote,
                gradient: (wallet?.available_balance ?? 0) > 0 ? "from-quickgo-blue to-quickgo-cyan" : "from-gray-400 to-gray-500",
                sub: "Prêt à distribuer",
                highlight: true,
              },
            ].map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden ${c.highlight ? "ring-2 ring-quickgo-blue/20" : ""}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.gradient} flex items-center justify-center shadow-sm`}>
                    <c.icon className="text-white" size={18} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                <p className="text-2xl font-bold text-gray-900">{formatCFA(c.value)}</p>
                <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
              </motion.div>
            ))}
          </div>

          {/* Pending payment alert */}
          {(data?.pending_payment ?? 0) > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4">
              <AlertTriangle className="text-amber-600 shrink-0" size={22} />
              <div>
                <p className="font-semibold text-amber-900">
                  {formatCFA(data!.pending_payment)} de rémunérations en attente
                </p>
                <p className="text-sm text-amber-700">
                  Des livraisons ont été effectuées mais les chauffeurs n&apos;ont pas encore été payés.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setFilter("unpaid")}
                className="ml-auto bg-amber-600 hover:bg-amber-700 text-white shrink-0"
              >
                Traiter maintenant
              </Button>
            </div>
          )}

          {/* Deliveries table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <Truck size={18} className="text-quickgo-blue" />
              <h2 className="font-semibold text-gray-900 flex-1">Livraisons</h2>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Chauffeur, commande, vendeur..."
                  className="pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-quickgo-blue/20 w-52"
                />
              </div>

              {/* Filter tabs */}
              <div className="flex gap-1">
                {(["unpaid", "paid", "all"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      filter === f
                        ? "bg-quickgo-blue text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {f === "unpaid" ? "À payer" : f === "paid" ? "Payés" : "Tous"}
                  </button>
                ))}
              </div>
            </div>

            {/* List */}
            {loading ? (
              <div className="p-12 flex items-center justify-center">
                <RefreshCw className="animate-spin text-quickgo-blue" size={28} />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <Truck className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500 font-medium">
                  {filter === "unpaid" ? "Aucune rémunération en attente" : "Aucune livraison trouvée"}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {filter === "unpaid" ? "Tous les chauffeurs sont à jour ✓" : "Modifiez les filtres"}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {filtered.map((delivery, i) => (
                  <motion.div
                    key={delivery.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Driver avatar */}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-quickgo-blue/20 to-quickgo-cyan/20 flex items-center justify-center text-quickgo-blue font-bold text-sm shrink-0">
                      {delivery.driver?.full_name?.charAt(0) ?? "?"}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">
                          {delivery.driver?.full_name ?? "Chauffeur non assigné"}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          delivery.driver_paid
                            ? "bg-green-100 text-green-700"
                            : delivery.driver_status === "delivered"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {delivery.driver_paid
                            ? "✓ Payé"
                            : delivery.driver_status === "delivered"
                            ? "En attente"
                            : delivery.driver_status}
                        </span>
                        {delivery.delivery_type === "express" && (
                          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full">Express</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>Cmd #{delivery.order?.order_number ?? "—"}</span>
                        {delivery.order?.vendor?.name && <span>· {delivery.order.vendor.name}</span>}
                        <span>· {formatDate(delivery.created_at)}</span>
                        {delivery.driver?.phone && (
                          <a href={`tel:${delivery.driver.phone}`} className="flex items-center gap-0.5 text-quickgo-blue hover:underline">
                            <Phone size={11} />
                            {delivery.driver.phone}
                          </a>
                        )}
                      </div>
                      {delivery.driver_paid && delivery.driver_payment_method && (
                        <p className="text-xs text-green-600 mt-1">
                          {METHOD_EMOJI[delivery.driver_payment_method]} {METHOD_LABELS[delivery.driver_payment_method]}
                          {delivery.driver_payment_reference && ` · ${delivery.driver_payment_reference}`}
                          {delivery.driver_paid_at && ` · ${formatDate(delivery.driver_paid_at)}`}
                        </p>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900 text-lg">{formatCFA(delivery.delivery_fee)}</p>
                      {delivery.delivery_rate?.name && (
                        <p className="text-xs text-gray-400 mt-0.5">{delivery.delivery_rate.name}</p>
                      )}
                    </div>

                    {/* Action */}
                    {!delivery.driver_paid && delivery.driver_status === "delivered" && delivery.driver && (
                      <Button
                        size="sm"
                        onClick={() => setSelectedDelivery(delivery)}
                        className="ml-2 bg-green-600 hover:bg-green-700 text-white gap-1.5 shrink-0"
                      >
                        <DollarSign size={14} />
                        Payer
                      </Button>
                    )}
                    {delivery.driver_paid && (
                      <CheckCircle2 size={20} className="text-green-500 ml-2 shrink-0" />
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Pay modal */}
      <AnimatePresence>
        {selectedDelivery && (
          <PayDriverModal
            delivery={selectedDelivery}
            walletBalance={wallet?.available_balance ?? 0}
            onClose={() => setSelectedDelivery(null)}
            onPaid={fetchData}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
