"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ArrowLeft, ArrowUpRight, ArrowDownLeft, Plus, Send,
  Clock, CheckCircle, Wallet, QrCode,
  CreditCard, RefreshCw, Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface WalletData {
  balance: number
  points: number
  transactions: Transaction[]
}

interface Transaction {
  id: string
  type: "credit" | "debit" | "cashback" | "refund" | "withdrawal"
  amount: number
  balance_after: number
  description: string | null
  created_at: string
}

const formatCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA"
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })

const TX_CONFIG: Record<string, { label: string; icon: typeof ArrowUpRight; color: string; bg: string; sign: string }> = {
  credit:     { label: "Crédit",           icon: ArrowDownLeft, color: "text-[#22c55e]", bg: "bg-[#22c55e]/15", sign: "+" },
  cashback:   { label: "Cashback",         icon: ArrowDownLeft, color: "text-[#22c55e]", bg: "bg-[#22c55e]/15", sign: "+" },
  refund:     { label: "Remboursement",    icon: ArrowDownLeft, color: "text-[#06b6d4]", bg: "bg-[#06b6d4]/15", sign: "+" },
  debit:      { label: "Paiement",         icon: ArrowUpRight,  color: "text-[#f97316]", bg: "bg-[#f97316]/15", sign: "-" },
  withdrawal: { label: "Retrait",          icon: ArrowUpRight,  color: "text-[#ef4444]", bg: "bg-[#ef4444]/15", sign: "-" },
}

const PAYMENT_METHODS = [
  { id: "orange", label: "Orange Money", emoji: "🟠", desc: "+237 6XX XX XX XX" },
  { id: "mtn",    label: "MTN MoMo",     emoji: "🟡", desc: "+237 6XX XX XX XX" },
]

export default function WalletPage() {
  const [data, setData] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<"all" | "in" | "out">("all")
  const [rechargeModal, setRechargeModal] = useState(false)
  const [rechargeAmount, setRechargeAmount] = useState("")
  const [rechargeMethod, setRechargeMethod] = useState("orange")
  const [recharging, setRecharging] = useState(false)
  const [rechargeSuccess, setRechargeSuccess] = useState(false)

  const fetchWallet = async () => {
    setLoading(true)
    try {
      const r = await fetch("/api/wallet")
      if (r.ok) setData(await r.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchWallet() }, [])

  const handleRecharge = async () => {
    const amount = parseInt(rechargeAmount)
    if (!amount || amount < 100) return
    setRecharging(true)
    try {
      const r = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "credit", amount, description: `Recharge ${rechargeMethod === "orange" ? "Orange Money" : "MTN MoMo"}` }),
      })
      if (r.ok) {
        setRechargeSuccess(true)
        setTimeout(() => {
          setRechargeModal(false)
          setRechargeSuccess(false)
          setRechargeAmount("")
          fetchWallet()
        }, 1500)
      }
    } finally {
      setRecharging(false)
    }
  }

  const transactions = data?.transactions ?? []
  const filtered = transactions.filter((t) => {
    if (tab === "in")  return ["credit","cashback","refund"].includes(t.type)
    if (tab === "out") return ["debit","withdrawal"].includes(t.type)
    return true
  })

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-[#1e1e2e] px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/40" />
          </Link>
          <div className="flex-1">
            <h1 className="text-white font-bold text-lg">Mon Wallet</h1>
            <p className="text-xs text-white/30">QuickGo Pay — Paiements sécurisés</p>
          </div>
          <button onClick={fetchWallet} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <RefreshCw className={`w-4 h-4 text-white/30 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-5">

        {/* Balance card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden p-6"
          style={{ background: "linear-gradient(135deg, #1a237e, #0d47a1, #01579b)" }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 -translate-y-1/2 translate-x-1/4"
            style={{ background: "#3b82f6" }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-white/60" />
              <span className="text-white/60 text-sm">Solde disponible</span>
            </div>
            {loading ? (
              <div className="h-10 w-48 bg-white/10 rounded animate-pulse mb-2" />
            ) : (
              <p className="text-4xl font-black text-white mb-2">{formatCFA(data?.balance ?? 0)}</p>
            )}
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-yellow-300">⭐</span>
                <span className="text-white font-semibold">{(data?.points ?? 0).toLocaleString("fr-FR")}</span>
                <span className="text-white/50">points</span>
              </div>
              <Shield className="w-4 h-4 text-white/30 ml-auto" />
              <span className="text-white/30 text-xs">Sécurisé</span>
            </div>
          </div>
        </motion.div>

        {/* Quick actions */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Recharger",  icon: Plus,       action: () => setRechargeModal(true), color: "#22c55e" },
            { label: "Transférer", icon: Send,        href: "/wallet/transfer",             color: "#3b82f6" },
            { label: "QR Code",    icon: QrCode,      href: "/wallet",                      color: "#8b5cf6" },
            { label: "Coupons",    icon: CreditCard,  href: "/wallet/rewards",              color: "#eab308" },
          ].map(({ label, icon: Icon, action, href, color }) => (
            <motion.div key={label} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
              {action ? (
                <button onClick={action} className="w-full flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-[#1e1e2e]"
                    style={{ background: `${color}20` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <span className="text-[11px] text-white/40 font-medium">{label}</span>
                </button>
              ) : (
                <Link href={href!} className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center border border-[#1e1e2e]"
                    style={{ background: `${color}20` }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <span className="text-[11px] text-white/40 font-medium">{label}</span>
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        {/* Payment methods */}
        <div className="bg-[#16161f] border border-[#1e1e2e] rounded-3xl p-5">
          <h3 className="text-white font-semibold mb-4 text-sm">Méthodes de paiement liées</h3>
          <div className="space-y-3">
            {PAYMENT_METHODS.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 bg-[#1c1c28] rounded-xl">
                <span className="text-2xl">{m.emoji}</span>
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{m.label}</p>
                  <p className="text-white/30 text-xs">{m.desc}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22c55e]/15 text-[#22c55e] font-medium">Lié</span>
              </div>
            ))}
            <button className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-[#1e1e2e] text-white/30 hover:text-white/60 hover:border-[#3b82f6]/30 transition-colors">
              <Plus className="w-4 h-4" />
              <span className="text-sm">Ajouter une méthode</span>
            </button>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-[#16161f] border border-[#1e1e2e] rounded-3xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Historique</h3>
            <div className="flex gap-1 bg-[#0a0a0f] rounded-xl p-1">
              {(["all","in","out"] as const).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${tab === t ? "bg-[#1e1e2e] text-white" : "text-white/30 hover:text-white/60"}`}>
                  {t === "all" ? "Tout" : t === "in" ? "Entrants" : "Sortants"}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({length:4}).map((_,i)=><div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-8 h-8 mx-auto text-white/10 mb-2" />
              <p className="text-white/30 text-sm">Aucune transaction</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((tx) => {
                const cfg = TX_CONFIG[tx.type] ?? TX_CONFIG["debit"]
                const Icon = cfg.icon
                return (
                  <div key={tx.id} className="flex items-center gap-3 p-3 hover:bg-white/3 rounded-xl transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cfg.bg}`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{tx.description ?? cfg.label}</p>
                      <p className="text-white/30 text-xs">{formatDate(tx.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-bold text-sm ${cfg.color}`}>{cfg.sign}{formatCFA(tx.amount)}</p>
                      <p className="text-white/20 text-[10px]">Solde: {formatCFA(tx.balance_after)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recharge modal */}
      {rechargeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setRechargeModal(false)}>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm bg-[#16161f] border border-[#1e1e2e] rounded-3xl p-6"
            onClick={(e) => e.stopPropagation()}>
            {rechargeSuccess ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-[#22c55e] mx-auto mb-3" />
                <p className="text-white font-bold text-lg">Rechargé avec succès !</p>
              </div>
            ) : (
              <>
                <h2 className="text-white font-bold text-lg mb-4">Recharger mon wallet</h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {PAYMENT_METHODS.map((m) => (
                    <button key={m.id} onClick={() => setRechargeMethod(m.id)}
                      className={`p-3 rounded-xl border-2 transition-colors text-left ${rechargeMethod === m.id ? "border-[#3b82f6] bg-[#3b82f6]/10" : "border-[#1e1e2e]"}`}>
                      <span className="text-xl block mb-1">{m.emoji}</span>
                      <p className="text-white text-xs font-medium">{m.label}</p>
                    </button>
                  ))}
                </div>
                <div className="mb-4">
                  <p className="text-white/40 text-xs mb-2">Montant (FCFA)</p>
                  <input value={rechargeAmount} onChange={(e) => setRechargeAmount(e.target.value.replace(/\D/g,""))}
                    placeholder="Ex: 5000"
                    className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-[#3b82f6]/50 placeholder:text-white/10" />
                  <div className="flex gap-2 mt-2">
                    {[1000,2000,5000,10000].map((v) => (
                      <button key={v} onClick={() => setRechargeAmount(String(v))}
                        className="flex-1 py-1.5 rounded-lg bg-[#1c1c28] text-white/50 hover:text-white text-xs font-medium transition-colors">
                        {v >= 1000 ? `${v/1000}k` : v}
                      </button>
                    ))}
                  </div>
                </div>
                <Button className="w-full h-12 rounded-xl bg-[#22c55e] hover:bg-[#22c55e]/90 text-black font-bold"
                  disabled={recharging || !rechargeAmount} onClick={handleRecharge}>
                  {recharging ? "Traitement…" : `Recharger ${rechargeAmount ? formatCFA(parseInt(rechargeAmount)||0) : ""}`}
                </Button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
