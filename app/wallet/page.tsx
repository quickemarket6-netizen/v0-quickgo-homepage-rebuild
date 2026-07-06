"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  QrCode,
  Gift,
  ArrowRight,
  Plus,
  X,
  Loader2,
} from "lucide-react"

type Tx = {
  id: string
  type: "credit" | "debit" | "cashback" | "refund" | "withdrawal"
  amount: number
  balance_after: number
  description: string | null
  created_at: string
}

const TX_CFG: Record<string, { icon: React.ElementType; color: string; bg: string; sign: string }> = {
  credit:     { icon: ArrowDownLeft, color: "#a3e635", bg: "rgba(163,230,53,0.15)",  sign: "+" },
  refund:     { icon: ArrowDownLeft, color: "#22c55e", bg: "rgba(34,197,94,0.15)",   sign: "+" },
  cashback:   { icon: Gift,          color: "#06b6d4", bg: "rgba(6,182,212,0.15)",   sign: "+" },
  debit:      { icon: ArrowUpRight,  color: "#94a3b8", bg: "rgba(148,163,184,0.1)",  sign: "-" },
  withdrawal: { icon: ArrowUpRight,  color: "#f97316", bg: "rgba(249,115,22,0.15)",  sign: "-" },
}

const PAYMENT_METHODS = [
  { name: "Orange Money",    color: "bg-orange-500" },
  { name: "MTN Mobile Money", color: "bg-yellow-500" },
  { name: "Carte bancaire",  color: "bg-blue-500" },
  { name: "Visa",            color: "bg-indigo-500" },
  { name: "Mastercard",      color: "bg-red-500" },
]

// Chaque action mène à un flux réel : recharge CinetPay, transfert entre
// utilisateurs, récompenses/parrainage, code PIN.
const QUICK_ACTIONS = [
  { icon: Plus,   label: "Recharger",   action: "recharge" as const },
  { icon: Send,   label: "Envoyer",     href: "/wallet/transfer" },
  { icon: Gift,   label: "Récompenses", href: "/wallet/rewards" },
  { icon: QrCode, label: "Sécurité",    href: "/wallet/security" },
]

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " CFA"
}

function timeAgo(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const h = Math.floor(mins / 60)
  if (h < 24) return `Il y a ${h}h`
  return `Il y a ${Math.floor(h / 24)}j`
}

export default function WalletPage() {
  const [balance, setBalance]         = useState<number | null>(null)
  const [points, setPoints]           = useState(0)
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [loading, setLoading]         = useState(true)
  const [showRecharge, setShowRecharge] = useState(false)
  const [rechargeAmt, setRechargeAmt]  = useState("")
  const [recharging, setRecharging]    = useState(false)
  const [rechargeError, setRechargeError] = useState<string | null>(null)

  async function loadWallet() {
    const res = await fetch("/api/wallet")
    if (!res.ok) return
    const data = await res.json()
    setBalance(data.balance ?? 0)
    setPoints(data.points ?? 0)
    setTransactions(data.transactions ?? [])
    setLoading(false)
  }

  useEffect(() => { loadWallet() }, [])

  // Recharge réelle via CinetPay (Orange Money / MTN MoMo) : le wallet n'est
  // crédité qu'au retour du webhook, après vérification du paiement.
  async function handleRecharge(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseInt(rechargeAmt)
    if (!amount || amount < 500) {
      setRechargeError("Montant minimum : 500 FCFA")
      return
    }
    setRecharging(true)
    setRechargeError(null)
    try {
      const res = await fetch("/api/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.payment_url) {
        setRechargeError(data.error ?? "Impossible d'initier la recharge. Réessayez.")
        return
      }
      window.location.href = data.payment_url
    } catch {
      setRechargeError("Erreur réseau. Réessayez.")
    } finally {
      setRecharging(false)
    }
  }

  return (
    <main className="min-h-screen bg-black">
      <Navbar />

      <div className="pt-20 lg:pt-24">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative py-16 lg:py-24 overflow-hidden">
          {/* Background orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-[500px] h-[500px] rounded-full bg-lime-500/20 blur-[120px] -left-[150px] top-[50px]"
            />
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute w-[400px] h-[400px] rounded-full bg-blue-500/20 blur-[100px] right-0 bottom-0"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.25, 0.1] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 3 }}
              className="absolute w-[300px] h-[300px] rounded-full bg-cyan-500/15 blur-[80px] right-[30%] top-[10%]"
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">

              {/* Left – text + actions */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 18 }}
              >
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-500/10 border border-lime-500/30 mb-6"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500" />
                  </span>
                  <Wallet className="h-4 w-4 text-lime-500" />
                  <span className="text-sm font-medium text-lime-500">QUICKGO PAY</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 120 }}
                  className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6"
                >
                  Votre portefeuille{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-cyan-400">
                    intelligent
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, type: "spring", stiffness: 120 }}
                  className="text-lg text-zinc-400 mb-8 max-w-lg"
                >
                  Payez, recevez et gérez votre argent en toute simplicité.
                  Profitez du cashback et des récompenses exclusives.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, type: "spring", stiffness: 120 }}
                  className="flex flex-col sm:flex-row gap-4 mb-8"
                >
                  <motion.div whileHover={{ scale: 1.03, y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Button
                      size="lg"
                      className="bg-lime-500 text-black hover:bg-lime-400 h-14 px-8 font-bold w-full"
                      onClick={() => setShowRecharge(true)}
                    >
                      Recharger le wallet
                      <Plus className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03, y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Button
                      size="lg"
                      variant="outline"
                      className="h-14 px-8 border-lime-500/30 text-lime-500 hover:bg-lime-500/10 w-full"
                    >
                      Historique complet
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Points */}
                <AnimatePresence>
                  {points > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ type: "spring", stiffness: 120 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-6"
                    >
                      <Gift className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-400">{points} points de fidélité</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Payment methods */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, type: "spring", stiffness: 120 }}
                >
                  <p className="text-sm text-zinc-500 mb-3">Moyens de paiement acceptés</p>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_METHODS.map((m, i) => (
                      <motion.div
                        key={m.name}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.07, type: "spring", stiffness: 200, damping: 14 }}
                        whileHover={{ y: -2, scale: 1.04 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-lime-500/20"
                      >
                        <div className={`w-3 h-3 rounded-full ${m.color}`} />
                        <span className="text-sm font-medium text-white">{m.name}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>

              {/* Right – card + history */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.2 }}
                className="relative"
              >
                <div className="relative max-w-md mx-auto">
                  {/* Wallet card */}
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    className="relative p-6 rounded-3xl bg-gradient-to-br from-lime-500 via-lime-600 to-lime-700 overflow-hidden border border-lime-400/30"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-blue-400/40 blur-3xl pointer-events-none"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      className="absolute -bottom-5 -left-5 w-36 h-36 rounded-full bg-cyan-400/30 blur-2xl pointer-events-none"
                    />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-6 w-6 text-black" />
                          <span className="font-bold text-black">QuickGo Pay</span>
                        </div>
                        <span className="text-xs text-black/70 px-2 py-1 bg-black/10 rounded-full">Actif</span>
                      </div>

                      <div className="mb-8">
                        <p className="text-sm text-black/70 mb-1">Solde disponible</p>
                        {loading ? (
                          <div className="h-10 w-44 rounded-lg bg-black/20 animate-pulse" />
                        ) : (
                          <motion.p
                            key={balance}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 120, damping: 14 }}
                            className="text-4xl font-bold text-black"
                          >
                            {fmt(balance ?? 0)}
                          </motion.p>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-4">
                        {QUICK_ACTIONS.map((a, i) => (
                          <motion.button
                            key={a.label}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + i * 0.05, type: "spring", stiffness: 200 }}
                            whileHover={{ y: -4, scale: 1.05 }}
                            onClick={() => {
                              if ("action" in a && a.action === "recharge") setShowRecharge(true)
                              else if ("href" in a && a.href) window.location.href = a.href
                            }}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-black/10 hover:bg-black/20 transition-colors"
                          >
                            <a.icon className="h-5 w-5 text-black" />
                            <span className="text-xs text-black font-medium">{a.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Transactions */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55, type: "spring", stiffness: 100, damping: 18 }}
                    className="mt-6 p-4 rounded-2xl bg-zinc-900 border border-lime-500/20"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">Dernières transactions</h3>
                      <span className="text-xs text-lime-500">Voir tout</span>
                    </div>

                    {loading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-14 rounded-xl bg-zinc-800 animate-pulse" style={{ opacity: 1 - i * 0.2 }} />
                        ))}
                      </div>
                    ) : transactions.length === 0 ? (
                      <p className="text-sm text-zinc-500 text-center py-6">Aucune transaction pour l&apos;instant</p>
                    ) : (
                      <div className="space-y-3">
                        {transactions.slice(0, 5).map((tx, i) => {
                          const cfg = TX_CFG[tx.type] ?? TX_CFG.debit
                          const Icon = cfg.icon
                          return (
                            <motion.div
                              key={tx.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.7 + i * 0.04, type: "spring", stiffness: 150 }}
                              className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50"
                            >
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg" style={{ background: cfg.bg }}>
                                  <Icon className="h-4 w-4" style={{ color: cfg.color }} />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">{tx.description ?? tx.type}</p>
                                  <p className="text-xs text-zinc-500">{timeAgo(tx.created_at)}</p>
                                </div>
                              </div>
                              <span className="text-sm font-semibold" style={{ color: cfg.color }}>
                                {cfg.sign}{fmt(tx.amount)}
                              </span>
                            </motion.div>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24 bg-gradient-to-r from-lime-500/10 via-black to-lime-500/10 border-t border-lime-500/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Votre wallet,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-cyan-400">
                  toujours disponible
                </span>
              </h2>
              <p className="text-lg text-zinc-400 mb-8">
                Rechargez, payez et suivez vos transactions en temps réel
              </p>
              <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                <Button
                  size="lg"
                  className="bg-lime-500 text-black hover:bg-lime-400 h-14 px-8 font-bold"
                  onClick={() => setShowRecharge(true)}
                >
                  Recharger maintenant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>

      <Footer />

      {/* ── Recharge modal ───────────────────────────────────── */}
      <AnimatePresence>
        {showRecharge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowRecharge(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative w-full max-w-md rounded-2xl p-6 border border-lime-500/30"
              style={{ background: "#111118" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowRecharge(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold text-white mb-1">Recharger le wallet</h2>
              <p className="text-sm text-zinc-400 mb-6">
                Solde actuel :{" "}
                <span className="text-lime-400 font-semibold">{fmt(balance ?? 0)}</span>
              </p>
              <form onSubmit={handleRecharge} className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-2 block">Montant (CFA)</label>
                  <Input
                    type="number"
                    min="500"
                    step="100"
                    placeholder="Ex: 5 000"
                    value={rechargeAmt}
                    onChange={(e) => { setRechargeAmt(e.target.value); setRechargeError(null) }}
                    className="h-12 bg-zinc-900 border-lime-500/30 text-white"
                  />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {[1000, 5000, 10000, 25000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRechargeAmt(String(amt))}
                      className="px-3 py-1.5 rounded-lg bg-lime-500/10 border border-lime-500/30 text-lime-400 text-sm hover:bg-lime-500/20 transition-colors"
                    >
                      {fmt(amt)}
                    </button>
                  ))}
                </div>
                {rechargeError && (
                  <p className="text-sm text-red-400 bg-red-500/10 rounded-xl px-3 py-2">{rechargeError}</p>
                )}
                <Button
                  type="submit"
                  disabled={recharging || !rechargeAmt}
                  className="w-full h-12 bg-lime-500 text-black hover:bg-lime-400 font-bold"
                >
                  {recharging ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Payer avec Orange Money / MTN MoMo"
                  )}
                </Button>
                <p className="text-xs text-zinc-500 text-center">
                  Vous serez redirigé vers la page de paiement sécurisée CinetPay.
                  Le solde est crédité dès confirmation du paiement.
                </p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
