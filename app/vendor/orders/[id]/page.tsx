"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft, Package, Clock, CheckCircle2, Truck, XCircle,
  Phone, MapPin, RefreshCw, AlertCircle, ChevronRight,
  LayoutDashboard, ShoppingBag, Users, Wallet, Settings,
  BarChart3, PrinterIcon, User, CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface OrderItem {
  id: string
  product_id: string
  quantity: number
  unit_price: number
  total_price: number
  product: { id: string; name: string; images: string[] } | null
}

interface ReplacementProduct {
  id: string
  name: string
  price: number
  is_available: boolean
  stock_quantity: number | null
}

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  payment_method: string
  subtotal: number
  delivery_fee: number
  discount: number
  total: number
  notes: string | null
  substitution_preference?: string | null
  delivery_address: { address?: string; city?: string; phone?: string } | null
  created_at: string
  updated_at: string
  delivered_at: string | null
  estimated_delivery_at: string | null
  items: OrderItem[]
  customer: { full_name: string; phone: string; avatar_url: string | null } | null
  driver: { full_name: string; phone: string } | null
}

const navItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendor/dashboard" },
  { icon: Package, label: "Produits", href: "/vendor/products" },
  { icon: ShoppingBag, label: "Commandes", href: "/vendor/orders", active: true },
  { icon: Users, label: "Clients CRM", href: "/vendor/crm" },
  { icon: Wallet, label: "Finances", href: "/vendor/finances" },
  { icon: BarChart3, label: "Analytics", href: "/vendor/analytics" },
  { icon: Settings, label: "Paramètres", href: "/vendor/settings" },
]

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; cls: string; bg: string }> = {
  pending:    { label: "En attente",    icon: Clock,         cls: "text-amber-700",  bg: "bg-amber-100"  },
  confirmed:  { label: "Confirmée",     icon: CheckCircle2,  cls: "text-blue-700",   bg: "bg-blue-100"   },
  preparing:  { label: "En préparation",icon: Package,       cls: "text-purple-700", bg: "bg-purple-100" },
  ready:      { label: "Prête",         icon: CheckCircle2,  cls: "text-indigo-700", bg: "bg-indigo-100" },
  picked_up:  { label: "Récupérée",     icon: Truck,         cls: "text-cyan-700",   bg: "bg-cyan-100"   },
  delivering: { label: "En livraison",  icon: Truck,         cls: "text-blue-700",   bg: "bg-blue-100"   },
  delivered:  { label: "Livrée",        icon: CheckCircle2,  cls: "text-green-700",  bg: "bg-green-100"  },
  cancelled:  { label: "Annulée",       icon: XCircle,       cls: "text-red-700",    bg: "bg-red-100"    },
}

const VENDOR_TRANSITIONS: Record<string, string | null> = {
  pending:    "confirmed",
  confirmed:  "preparing",
  preparing:  "ready",
  ready:      null,
  picked_up:  null,
  delivering: null,
  delivered:  null,
  cancelled:  null,
}

const TRANSITION_LABELS: Record<string, string> = {
  confirmed:  "Confirmer la commande",
  preparing:  "Commencer la préparation",
  ready:      "Marquer comme prête",
}

function formatCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F"
}

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export default function VendorOrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Substitution d'un article en rupture
  const [substitutingItemId, setSubstitutingItemId] = useState<string | null>(null)
  const [replacements, setReplacements] = useState<ReplacementProduct[]>([])
  const [replacementId, setReplacementId] = useState("")
  const [subBusy, setSubBusy] = useState(false)

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/vendor/orders/${orderId}`)
      if (!res.ok) {
        if (res.status === 404) { router.push("/vendor/orders"); return }
        throw new Error("Erreur de chargement")
      }
      setOrder(await res.json())
    } catch {
      toast.error("Impossible de charger la commande")
    } finally {
      setLoading(false)
    }
  }, [orderId, router])

  useEffect(() => { fetchOrder() }, [fetchOrder])

  async function advanceStatus() {
    if (!order) return
    const nextStatus = VENDOR_TRANSITIONS[order.status]
    if (!nextStatus) return

    setUpdating(true)
    try {
      const res = await fetch(`/api/vendor/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur")
      setOrder((prev) => prev ? { ...prev, status: nextStatus } : prev)
      toast.success(`Commande ${STATUS_CONFIG[nextStatus]?.label.toLowerCase()}`)
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur serveur")
    } finally {
      setUpdating(false)
    }
  }

  async function cancelOrder() {
    if (!order || !confirm("Annuler cette commande ?")) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/vendor/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur")
      setOrder((prev) => prev ? { ...prev, status: "cancelled" } : prev)
      toast.success("Commande annulée")
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur serveur")
    } finally {
      setUpdating(false)
    }
  }

  // Ouvre le panneau de substitution : charge le catalogue de la boutique
  // (uniquement les produits disponibles à prix ≤ ligne d'origine)
  async function openSubstitution(item: OrderItem) {
    setSubstitutingItemId(item.id)
    setReplacementId("")
    try {
      const res = await fetch("/api/vendor/products")
      if (res.ok) {
        const all: ReplacementProduct[] = await res.json()
        setReplacements(
          all.filter((p) =>
            p.is_available
            && p.id !== item.product_id
            && p.price * item.quantity <= item.total_price
            && (p.stock_quantity == null || p.stock_quantity >= item.quantity),
          ),
        )
      }
    } catch { setReplacements([]) }
  }

  async function applySubstitution(item: OrderItem, action: "remove" | "substitute") {
    if (action === "substitute" && !replacementId) {
      toast.error("Choisissez un produit de remplacement")
      return
    }
    setSubBusy(true)
    try {
      const res = await fetch(`/api/vendor/orders/${orderId}/substitute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_item_id: item.id,
          action,
          ...(action === "substitute" ? { replacement_product_id: replacementId } : {}),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { toast.error(data.error ?? "Erreur serveur"); return }
      toast.success(data.summary ?? "Commande mise à jour — client notifié")
      setSubstitutingItemId(null)
      await fetchOrder()
    } finally {
      setSubBusy(false)
    }
  }

  const statusCfg = order ? (STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending) : null
  const nextStatus = order ? VENDOR_TRANSITIONS[order.status] : null
  const canEditItems = order ? ["pending", "confirmed", "preparing"].includes(order.status) : false

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
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                item.active
                  ? "bg-gradient-to-r from-quickgo-blue/10 to-quickgo-cyan/10 text-quickgo-blue font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
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
            <Link href="/vendor/orders" className="p-2 rounded-xl hover:bg-gray-50 transition-colors">
              <ArrowLeft size={18} className="text-gray-600" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900">
                  {order ? `Commande #${order.order_number}` : "Chargement..."}
                </h1>
                {statusCfg && (
                  <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusCfg.bg} ${statusCfg.cls}`}>
                    <statusCfg.icon size={12} />
                    {statusCfg.label}
                  </span>
                )}
              </div>
              {order && (
                <p className="text-sm text-gray-500">Passée le {formatDate(order.created_at)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchOrder} className="gap-2">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Actualiser
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
              <PrinterIcon size={14} />
              Imprimer
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="animate-spin text-quickgo-blue" size={32} />
            </div>
          ) : !order ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <AlertCircle className="text-gray-300" size={48} />
              <p className="text-gray-500">Commande introuvable</p>
              <Link href="/vendor/orders">
                <Button variant="outline">Retour aux commandes</Button>
              </Link>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-6"
            >
              {/* Left column — items + totals */}
              <div className="col-span-2 space-y-6">

                {/* Order items */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                    <Package size={18} className="text-quickgo-blue" />
                    <h2 className="font-semibold text-gray-900">Articles commandés</h2>
                    <span className="ml-auto text-sm text-gray-500">{order.items.length} article{order.items.length > 1 ? "s" : ""}</span>
                  </div>
                  {canEditItems && order.substitution_preference && (
                    <div className="px-5 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-800">
                      En cas de rupture, le client préfère :{" "}
                      <span className="font-semibold">
                        {order.substitution_preference === "substitute" ? "un remplacement par un article similaire"
                          : order.substitution_preference === "refund" ? "le retrait et le remboursement de l'article"
                          : "être contacté avant toute modification"}
                      </span>
                      {order.substitution_preference === "contact" && order.customer?.phone && (
                        <> — <a href={`tel:${order.customer.phone}`} className="underline font-semibold">{order.customer.phone}</a></>
                      )}
                    </div>
                  )}
                  <div className="divide-y divide-gray-50">
                    {order.items.map((item) => (
                      <div key={item.id}>
                        <div className="flex items-center gap-4 px-5 py-4">
                          {item.product?.images?.[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-14 h-14 rounded-xl object-cover bg-gray-100"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
                              <Package size={20} className="text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.product?.name ?? "Produit supprimé"}</p>
                            <p className="text-sm text-gray-500">Qté : {item.quantity} × {formatCFA(item.unit_price)}</p>
                          </div>
                          <p className="font-bold text-gray-900">{formatCFA(item.total_price)}</p>
                          {canEditItems && substitutingItemId !== item.id && (
                            <button
                              onClick={() => openSubstitution(item)}
                              className="text-xs font-medium text-amber-600 hover:text-amber-700 border border-amber-200 hover:bg-amber-50 rounded-full px-3 py-1.5 transition-colors shrink-0"
                            >
                              Rupture ?
                            </button>
                          )}
                        </div>

                        {/* Panneau substitution / retrait */}
                        {substitutingItemId === item.id && (
                          <div className="mx-5 mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                            <p className="text-sm font-semibold text-amber-900">
                              « {item.product?.name ?? "Article"} » est en rupture ?
                            </p>
                            <p className="text-xs text-amber-700">
                              Remplacez-le par un produit équivalent (prix égal ou inférieur — la différence est
                              remboursée au client) ou retirez-le de la commande. Le client sera notifié.
                            </p>
                            {replacements.length > 0 ? (
                              <select
                                value={replacementId}
                                onChange={(e) => setReplacementId(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                              >
                                <option value="">— Choisir un remplacement —</option>
                                {replacements.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} · {formatCFA(p.price)} ({formatCFA(p.price * item.quantity)} × {item.quantity})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-xs text-amber-600">
                                Aucun produit de remplacement à prix égal ou inférieur disponible.
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {replacements.length > 0 && (
                                <Button size="sm" disabled={subBusy || !replacementId}
                                  className="rounded-full bg-amber-600 hover:bg-amber-600/90 text-white gap-1"
                                  onClick={() => applySubstitution(item, "substitute")}>
                                  <RefreshCw size={13} className={subBusy ? "animate-spin" : ""} />
                                  Remplacer
                                </Button>
                              )}
                              <Button size="sm" variant="outline" disabled={subBusy}
                                className="rounded-full border-red-200 text-red-600 hover:bg-red-50 gap-1"
                                onClick={() => applySubstitution(item, "remove")}>
                                <XCircle size={13} />
                                Retirer et rembourser
                              </Button>
                              <Button size="sm" variant="ghost" disabled={subBusy}
                                className="rounded-full text-gray-500"
                                onClick={() => setSubstitutingItemId(null)}>
                                Fermer
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CreditCard size={18} className="text-quickgo-blue" />
                    Récapitulatif financier
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Sous-total produits</span>
                      <span>{formatCFA(order.subtotal)}</span>
                    </div>
                    {order.delivery_fee > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Frais de livraison</span>
                        <span>{formatCFA(order.delivery_fee)}</span>
                      </div>
                    )}
                    {order.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Réduction</span>
                        <span>-{formatCFA(order.discount)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                      <span>Total payé par le client</span>
                      <span className="text-lg">{formatCFA(order.total)}</span>
                    </div>
                    {/* Décomposition alignée sur le moteur financier (wallet-engine) :
                        commission 7% sur le sous-total produits, frais de paiement
                        2% sur le total — la livraison revient au livreur. */}
                    {(() => {
                      const commission = Math.round(order.subtotal * 0.07)
                      const paymentFees = Math.round(order.total * 0.02)
                      const net = Math.max(0, order.total - (order.delivery_fee ?? 0) - commission - paymentFees)
                      return (
                        <div className="bg-blue-50 rounded-xl p-3 space-y-1.5">
                          <div className="flex justify-between text-xs text-blue-700/70">
                            <span>Commission QuickGo (7% du sous-total)</span>
                            <span>-{formatCFA(commission)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-blue-700/70">
                            <span>Frais de paiement (2%)</span>
                            <span>-{formatCFA(paymentFees)}</span>
                          </div>
                          {(order.delivery_fee ?? 0) > 0 && (
                            <div className="flex justify-between text-xs text-blue-700/70">
                              <span>Livraison (reversée au livreur)</span>
                              <span>-{formatCFA(order.delivery_fee)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-blue-800 font-semibold pt-1 border-t border-blue-100">
                            <span>Votre revenu net</span>
                            <span>{formatCFA(net)}</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                    <CreditCard size={12} />
                    Paiement : {order.payment_method ?? "CinetPay"} ·
                    <span className={order.payment_status === "paid" ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>
                      {order.payment_status === "paid" ? "Payé" : "En attente"}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                    <p className="text-sm font-medium text-amber-800 mb-1">Note du client</p>
                    <p className="text-sm text-amber-700">{order.notes}</p>
                  </div>
                )}
              </div>

              {/* Right column — actions + customer + delivery */}
              <div className="space-y-6">

                {/* Actions */}
                {order.status !== "cancelled" && order.status !== "delivered" && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
                    <h2 className="font-semibold text-gray-900">Actions</h2>
                    {nextStatus && (
                      <Button
                        onClick={advanceStatus}
                        disabled={updating}
                        className="w-full bg-gradient-to-r from-quickgo-blue to-quickgo-cyan text-white border-0 gap-2"
                      >
                        {updating
                          ? <RefreshCw size={15} className="animate-spin" />
                          : <CheckCircle2 size={15} />}
                        {TRANSITION_LABELS[nextStatus] ?? `Passer à : ${STATUS_CONFIG[nextStatus]?.label}`}
                      </Button>
                    )}
                    {["pending", "confirmed", "preparing"].includes(order.status) && (
                      <Button
                        variant="outline"
                        onClick={cancelOrder}
                        disabled={updating}
                        className="w-full border-red-200 text-red-600 hover:bg-red-50 gap-2"
                      >
                        <XCircle size={15} />
                        Annuler la commande
                      </Button>
                    )}
                    {!nextStatus && order.status !== "cancelled" && order.status !== "delivered" && (
                      <p className="text-xs text-gray-500 text-center">
                        En attente du livreur
                      </p>
                    )}
                  </div>
                )}

                {/* Customer info */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <User size={16} className="text-quickgo-blue" />
                    Client
                  </h2>
                  {order.customer ? (
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900">{order.customer.full_name}</p>
                      <a
                        href={`tel:${order.customer.phone}`}
                        className="flex items-center gap-2 text-sm text-quickgo-blue hover:underline"
                      >
                        <Phone size={13} />
                        {order.customer.phone}
                      </a>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Informations non disponibles</p>
                  )}
                </div>

                {/* Delivery address */}
                {order.delivery_address && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MapPin size={16} className="text-quickgo-blue" />
                      Adresse de livraison
                    </h2>
                    <p className="text-sm text-gray-700">{order.delivery_address.address}</p>
                    {order.delivery_address.city && (
                      <p className="text-sm text-gray-500 mt-1">{order.delivery_address.city}</p>
                    )}
                    {order.delivery_address.phone && (
                      <a
                        href={`tel:${order.delivery_address.phone}`}
                        className="flex items-center gap-2 text-sm text-quickgo-blue hover:underline mt-2"
                      >
                        <Phone size={13} />
                        {order.delivery_address.phone}
                      </a>
                    )}
                  </div>
                )}

                {/* Driver info */}
                {order.driver && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                    <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Truck size={16} className="text-quickgo-blue" />
                      Livreur assigné
                    </h2>
                    <p className="font-medium text-gray-900">{order.driver.full_name}</p>
                    <a
                      href={`tel:${order.driver.phone}`}
                      className="flex items-center gap-2 text-sm text-quickgo-blue hover:underline mt-1"
                    >
                      <Phone size={13} />
                      {order.driver.phone}
                    </a>
                  </div>
                )}

                {/* Timeline */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-quickgo-blue" />
                    Chronologie
                  </h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-quickgo-blue mt-1.5 shrink-0" />
                      <div>
                        <p className="font-medium text-gray-900">Commande passée</p>
                        <p className="text-gray-500 text-xs">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    {order.estimated_delivery_at && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Livraison estimée</p>
                          <p className="text-gray-500 text-xs">{formatDate(order.estimated_delivery_at)}</p>
                        </div>
                      </div>
                    )}
                    {order.delivered_at && (
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Livrée</p>
                          <p className="text-gray-500 text-xs">{formatDate(order.delivered_at)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}
