"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, Users, Truck, Store, BarChart3,
  Settings, Wallet, Plus, Edit2, Trash2, RefreshCw, Save,
  X, CheckCircle2, AlertTriangle, Eye, EyeOff,
  ArrowUpDown, DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"

interface DeliveryRate {
  id: string
  name: string
  amount: number
  conditions: {
    poids_max?: number
    zone?: string
    type_colis?: string
    express?: boolean
  }
  priority: number
  is_active: boolean
  updated_at: string
}

const ZONE_LABELS: Record<string, string> = {
  centre: "Zone centrale",
  ville: "Même ville",
  peripherie: "Périphérie",
  inter_quartier: "Inter-quartier",
  inter_ville: "Inter-ville",
}

const EMPTY_RATE: Omit<DeliveryRate, "id" | "updated_at"> = {
  name: "",
  amount: 1000,
  conditions: { zone: "ville", express: false },
  priority: 50,
  is_active: true,
}

function formatCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F"
}

function RateFormModal({
  rate,
  onClose,
  onSaved,
}: {
  rate: Partial<DeliveryRate> | null
  onClose: () => void
  onSaved: () => void
}) {
  const isNew = !rate?.id
  const [form, setForm] = useState<Omit<DeliveryRate, "id" | "updated_at">>({
    name:       rate?.name ?? EMPTY_RATE.name,
    amount:     rate?.amount ?? EMPTY_RATE.amount,
    conditions: rate?.conditions ?? { ...EMPTY_RATE.conditions },
    priority:   rate?.priority ?? EMPTY_RATE.priority,
    is_active:  rate?.is_active ?? EMPTY_RATE.is_active,
  })
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Le nom est requis"); return }
    if (form.amount < 0)    { toast.error("Le montant doit être positif"); return }

    setLoading(true)
    try {
      const url    = isNew ? "/api/admin/delivery-rates" : `/api/admin/delivery-rates/${rate!.id}`
      const method = isNew ? "POST" : "PATCH"
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur")
      toast.success(isNew ? "Tarif créé" : "Tarif mis à jour")
      onSaved()
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
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {isNew ? "Nouveau tarif de livraison" : "Modifier le tarif"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Nom du tarif <span className="text-red-500">*</span></label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Colis léger - Zone centrale"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-quickgo-blue/20"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">Montant (FCFA) <span className="text-red-500">*</span></label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="number"
                min={0}
                step={500}
                value={form.amount}
                onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-quickgo-blue/20"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">{formatCFA(form.amount)}</p>
          </div>

          {/* Conditions */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Zone</label>
              <select
                value={form.conditions.zone ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, conditions: { ...f.conditions, zone: e.target.value || undefined } }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-quickgo-blue/20 bg-white"
              >
                <option value="">Toutes zones</option>
                {Object.entries(ZONE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Poids max (kg)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={form.conditions.poids_max ?? ""}
                onChange={(e) => setForm((f) => ({
                  ...f,
                  conditions: { ...f.conditions, poids_max: e.target.value ? Number(e.target.value) : undefined },
                }))}
                placeholder="Sans limite"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-quickgo-blue/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">Priorité (ordre d&apos;évaluation)</label>
              <input
                type="number"
                min={1}
                max={100}
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-quickgo-blue/20"
              />
              <p className="text-xs text-gray-400 mt-1">Plus petit = évalué en premier</p>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1.5">Options</label>
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.conditions.express ?? false}
                    onChange={(e) => setForm((f) => ({ ...f, conditions: { ...f.conditions, express: e.target.checked } }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Express</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Actif</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
          <Button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-quickgo-blue to-quickgo-cyan text-white border-0 gap-2"
          >
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            {isNew ? "Créer le tarif" : "Enregistrer"}
          </Button>
        </div>
      </motion.div>
    </div>
  )
}

export default function AdminDeliveryRatesPage() {
  const [rates, setRates] = useState<DeliveryRate[]>([])
  const [loading, setLoading] = useState(true)
  const [editRate, setEditRate] = useState<Partial<DeliveryRate> | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchRates = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/delivery-rates")
      if (res.ok) setRates(await res.json())
      else toast.error("Erreur de chargement")
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRates() }, [fetchRates])

  async function toggleActive(rate: DeliveryRate) {
    try {
      const res = await fetch(`/api/admin/delivery-rates/${rate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !rate.is_active }),
      })
      if (!res.ok) throw new Error()
      setRates((prev) => prev.map((r) => r.id === rate.id ? { ...r, is_active: !r.is_active } : r))
      toast.success(rate.is_active ? "Tarif désactivé" : "Tarif activé")
    } catch {
      toast.error("Erreur de mise à jour")
    }
  }

  async function deleteRate(id: string) {
    if (!confirm("Supprimer ce tarif ?")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/delivery-rates/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setRates((prev) => prev.filter((r) => r.id !== id))
      toast.success("Tarif supprimé")
    } catch {
      toast.error("Erreur de suppression")
    } finally {
      setDeleting(null)
    }
  }

  function openCreate() { setEditRate(null); setShowModal(true) }
  function openEdit(rate: DeliveryRate) { setEditRate(rate); setShowModal(true) }
  function closeModal() { setShowModal(false); setEditRate(null) }

  const activeCount   = rates.filter((r) => r.is_active).length
  const inactiveCount = rates.length - activeCount

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Grille tarifaire livraison</h1>
            <p className="text-sm text-gray-500">
              {rates.length} tarif{rates.length > 1 ? "s" : ""} · {activeCount} actif{activeCount > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchRates} className="gap-2">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Actualiser
            </Button>
            <Button
              size="sm"
              onClick={openCreate}
              className="gap-2 bg-gradient-to-r from-quickgo-blue to-quickgo-cyan text-white border-0"
            >
              <Plus size={14} />
              Nouveau tarif
            </Button>
          </div>
        </header>

        <main className="flex-1 p-8 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Tarifs actifs",   value: activeCount,               color: "text-green-600",  bg: "bg-green-100",  icon: CheckCircle2 },
              { label: "Tarifs inactifs", value: inactiveCount,             color: "text-gray-500",   bg: "bg-gray-100",   icon: EyeOff },
              { label: "Tarif max",       value: formatCFA(Math.max(...rates.map((r) => r.amount), 0)), color: "text-quickgo-blue", bg: "bg-blue-100", icon: ArrowUpDown },
            ].map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                  <c.icon size={20} className={c.color} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">{c.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{c.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Info banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
            <AlertTriangle className="text-blue-600 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-blue-800">
              Les tarifs sont évalués par ordre de priorité (plus petit = prioritaire). Le premier tarif dont les conditions correspondent est appliqué au checkout client.
              Les frais collectés vont dans le <strong>compte livraison séparé</strong> et ne sont jamais reversés aux vendeurs.
            </p>
          </div>

          {/* Rates table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <Truck size={18} className="text-quickgo-blue" />
              <h2 className="font-semibold text-gray-900">Tarifs configurés</h2>
            </div>

            {loading ? (
              <div className="p-12 flex items-center justify-center">
                <RefreshCw className="animate-spin text-quickgo-blue" size={28} />
              </div>
            ) : rates.length === 0 ? (
              <div className="p-12 text-center">
                <Truck className="mx-auto text-gray-300 mb-3" size={40} />
                <p className="text-gray-500 font-medium">Aucun tarif configuré</p>
                <p className="text-sm text-gray-400 mt-1">Créez votre premier tarif de livraison</p>
                <Button onClick={openCreate} className="mt-4 gap-2 bg-gradient-to-r from-quickgo-blue to-quickgo-cyan text-white border-0">
                  <Plus size={14} />
                  Créer un tarif
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {[...rates].sort((a, b) => a.priority - b.priority).map((rate, i) => (
                  <motion.div
                    key={rate.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors ${!rate.is_active ? "opacity-50" : ""}`}
                  >
                    {/* Priority badge */}
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                      {rate.priority}
                    </div>

                    {/* Rate info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 truncate">{rate.name}</p>
                        {rate.conditions.express && (
                          <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full font-medium">Express</span>
                        )}
                        {!rate.is_active && (
                          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">Inactif</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        {rate.conditions.zone && (
                          <span>Zone : <b className="text-gray-700">{ZONE_LABELS[rate.conditions.zone] ?? rate.conditions.zone}</b></span>
                        )}
                        {rate.conditions.poids_max && (
                          <span>Poids max : <b className="text-gray-700">{rate.conditions.poids_max} kg</b></span>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900 text-lg">{formatCFA(rate.amount)}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => toggleActive(rate)}
                        title={rate.is_active ? "Désactiver" : "Activer"}
                        className={`p-2 rounded-lg transition-colors ${rate.is_active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"}`}
                      >
                        {rate.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        onClick={() => openEdit(rate)}
                        className="p-2 rounded-lg text-quickgo-blue hover:bg-blue-50 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteRate(rate.id)}
                        disabled={deleting === rate.id}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deleting === rate.id
                          ? <RefreshCw size={16} className="animate-spin" />
                          : <Trash2 size={16} />}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showModal && (
          <RateFormModal
            rate={editRate}
            onClose={closeModal}
            onSaved={fetchRates}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
