"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Banknote, Check, X, RefreshCw, HandCoins } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Remittance {
  id: string; amount: number; status: string; method: string | null
  note: string | null; created_at: string
  driver: { id: string; cash_on_hand: number; user: { full_name: string | null; phone: string | null } | null } | null
}
interface DriverCash {
  id: string; cash_on_hand: number
  user: { full_name: string | null; phone: string | null } | null
}

const formatCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA"
const METHOD_LABELS: Record<string, string> = {
  cash_deposit: "Dépôt espèces",
  orange_money: "Orange Money",
  mtn_momo: "MTN MoMo",
}

// Panneau admin : validation des remises de cash déclarées par les livreurs
// + vue des espèces encore en circulation (dette livreur).
export function CashRemittancesPanel() {
  const [remittances, setRemittances] = useState<Remittance[]>([])
  const [driversWithCash, setDriversWithCash] = useState<DriverCash[]>([])
  const [loading, setLoading] = useState(true)
  const [actingId, setActingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/admin/cash-remittances")
      if (r.ok) {
        const d = await r.json()
        setRemittances(d.remittances ?? [])
        setDriversWithCash(d.drivers_with_cash ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const act = async (id: string, action: "confirm" | "reject") => {
    setActingId(id)
    setError(null)
    try {
      const r = await fetch("/api/admin/cash-remittances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      })
      const body = await r.json().catch(() => ({}))
      if (!r.ok) { setError(body.error ?? "Action impossible."); return }
      await load()
    } finally {
      setActingId(null)
    }
  }

  const pending = remittances.filter((r) => r.status === "pending")
  const totalInCirculation = driversWithCash.reduce((s, d) => s + Number(d.cash_on_hand), 0)

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="bg-[#16161f] rounded-2xl border border-[#1e1e2e] overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-[#1e1e2e] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <HandCoins className="text-white" size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Réconciliation cash livreurs</h2>
            <p className="text-xs text-[#6b6b8a]">
              {formatCFA(totalInCirculation)} d&apos;espèces en circulation
              {pending.length > 0 && ` · ${pending.length} remise${pending.length > 1 ? "s" : ""} à valider`}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={load}
          className="gap-2 border-[#1e1e2e] bg-transparent text-white hover:bg-[#1e1e2e]">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
        </Button>
      </div>

      {error && <p className="px-5 py-2 text-xs text-red-400 bg-red-500/10">{error}</p>}

      <div className="p-5 space-y-5">
        {/* Remises en attente */}
        <div>
          <p className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">Remises à valider</p>
          {pending.length === 0 ? (
            <p className="text-sm text-[#6b6b8a] py-3">Aucune remise en attente.</p>
          ) : pending.map((r) => (
            <div key={r.id} className="flex items-center gap-3 py-2.5 border-b border-[#1e1e2e] last:border-0">
              <Banknote className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">
                  {r.driver?.user?.full_name ?? "Livreur"} — {formatCFA(Number(r.amount))}
                </p>
                <p className="text-xs text-[#6b6b8a]">
                  {METHOD_LABELS[r.method ?? ""] ?? r.method ?? "—"} · {new Date(r.created_at).toLocaleString("fr-FR")}
                  {r.driver ? ` · cash en main : ${formatCFA(Number(r.driver.cash_on_hand))}` : ""}
                </p>
              </div>
              <Button size="sm" disabled={actingId === r.id}
                className="rounded-full gap-1 bg-green-600 hover:bg-green-600/90 text-white h-8"
                onClick={() => act(r.id, "confirm")}>
                <Check className="w-3.5 h-3.5" /> Confirmer
              </Button>
              <Button size="sm" variant="outline" disabled={actingId === r.id}
                className="rounded-full gap-1 border-red-500/30 text-red-400 hover:bg-red-500/10 h-8"
                onClick={() => act(r.id, "reject")}>
                <X className="w-3.5 h-3.5" /> Rejeter
              </Button>
            </div>
          ))}
        </div>

        {/* Espèces en circulation */}
        {driversWithCash.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#6b6b8a] uppercase tracking-wider mb-2">Espèces en main par livreur</p>
            <div className="space-y-1">
              {driversWithCash.map((d) => (
                <div key={d.id} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-white/80">{d.user?.full_name ?? "Livreur"}
                    {d.user?.phone && <span className="text-[#6b6b8a] text-xs ml-2">{d.user.phone}</span>}
                  </span>
                  <span className="font-semibold text-amber-400">{formatCFA(Number(d.cash_on_hand))}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
