"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Banknote, AlertTriangle, CheckCircle2, Clock, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CashEvent {
  id: string; order_id: string | null; type: string; amount: number
  status: string; method: string | null; note: string | null; created_at: string
}
interface CashData {
  cash_on_hand: number; cap: number; pending_remittance: number
  blocked: boolean; events: CashEvent[]
}

const formatCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA"

const METHODS = [
  { id: "cash_deposit", label: "Dépôt espèces (agence)" },
  { id: "orange_money", label: "Orange Money" },
  { id: "mtn_momo",     label: "MTN MoMo" },
]

// Carte « Cash en main » du livreur : solde d'espèces collectées à la
// livraison, plafond, déclaration de remise et journal.
export function DriverCashCard() {
  const [data, setData] = useState<CashData | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState("cash_deposit")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch("/api/driver/cash")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setData(d) })
      .catch(() => {})
  }, [])

  useEffect(() => { load() }, [load])

  const declareRemittance = async () => {
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) { setError("Montant invalide"); return }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/driver/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, method }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setError(body.error ?? "Erreur lors de la déclaration."); return }
      setSuccess("Remise déclarée — en attente de validation par la plateforme.")
      setShowForm(false)
      setAmount("")
      load()
    } finally {
      setSubmitting(false)
    }
  }

  if (!data) return null

  const declarable = Math.max(0, data.cash_on_hand - data.pending_remittance)
  const pct = data.cap > 0 ? Math.min(100, (data.cash_on_hand / data.cap) * 100) : 0

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 space-y-4 ${
        data.blocked
          ? "bg-red-500/10 border-red-500/30"
          : "bg-card/50 border-border/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${data.blocked ? "bg-red-500/20" : "bg-[#a3e635]/15"}`}>
            <Banknote className={`w-5 h-5 ${data.blocked ? "text-red-400" : "text-[#a3e635]"}`} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cash en main (à remettre)</p>
            <p className="text-2xl font-black text-white">{formatCFA(data.cash_on_hand)}</p>
          </div>
        </div>
        {declarable > 0 && !showForm && (
          <Button size="sm" className="rounded-full" onClick={() => { setShowForm(true); setSuccess(null); setAmount(String(declarable)) }}>
            Remettre
          </Button>
        )}
      </div>

      {/* Jauge plafond */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Plafond d&apos;espèces</span>
          <span>{formatCFA(data.cash_on_hand)} / {formatCFA(data.cap)}</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-red-500" : pct >= 75 ? "bg-yellow-500" : "bg-[#a3e635]"}`}
            style={{ width: `${pct}%` }} />
        </div>
      </div>

      {data.blocked && (
        <p className="flex items-start gap-2 text-xs text-red-400 bg-red-500/10 rounded-xl px-3 py-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          Plafond atteint : vous ne pouvez plus accepter de commandes payées en espèces.
          Remettez votre cash pour débloquer.
        </p>
      )}
      {data.pending_remittance > 0 && (
        <p className="flex items-center gap-2 text-xs text-yellow-400">
          <Clock className="w-3.5 h-3.5" />
          {formatCFA(data.pending_remittance)} déclarés, en attente de validation.
        </p>
      )}
      {success && (
        <p className="flex items-center gap-2 text-xs text-green-400">
          <CheckCircle2 className="w-3.5 h-3.5" /> {success}
        </p>
      )}

      {/* Formulaire de remise */}
      {showForm && (
        <div className="space-y-3 p-3 rounded-xl bg-white/5">
          <p className="text-sm font-medium text-white">Déclarer une remise</p>
          <input
            type="number" min={1} max={declarable} value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Montant (max ${declarable})`}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border/50 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#a3e635]/40"
          />
          <select value={method} onChange={(e) => setMethod(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-background border border-border/50 text-sm text-white focus:outline-none">
            {METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button size="sm" className="flex-1 rounded-full" onClick={declareRemittance} disabled={submitting}>
              {submitting ? "Envoi…" : "Déclarer la remise"}
            </Button>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => { setShowForm(false); setError(null) }}>
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Journal compact */}
      {data.events.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Derniers mouvements</p>
          {data.events.slice(0, 5).map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-xs py-1">
              {e.type === "collection"
                ? <ArrowDownLeft className="w-3.5 h-3.5 text-[#a3e635] shrink-0" />
                : <ArrowUpRight className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
              <span className="text-white/70 flex-1 truncate">
                {e.type === "collection" ? "Encaissement" : "Remise"}
                {e.note ? ` — ${e.note}` : ""}
              </span>
              {e.status === "pending" && <span className="text-yellow-400">en attente</span>}
              {e.status === "rejected" && <span className="text-red-400">rejetée</span>}
              <span className={`font-semibold ${e.type === "collection" ? "text-[#a3e635]" : "text-blue-400"}`}>
                {e.type === "collection" ? "+" : "−"}{formatCFA(Number(e.amount))}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
