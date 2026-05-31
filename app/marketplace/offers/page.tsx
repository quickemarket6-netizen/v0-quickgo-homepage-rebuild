"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Tag, Copy, CheckCircle, Truck, Percent, Gift, Zap, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PromoCode {
  id: string; code: string; title: string | null; description: string | null
  discount_type: "percentage" | "fixed" | "delivery"
  discount_value: number; valid_until: string | null
  min_order_amount: number | null; max_uses: number | null; current_uses: number | null
}

const GRADIENTS = [
  "from-quickgo-blue to-quickgo-cyan",
  "from-orange-500 to-red-500",
  "from-quickgo-lime/80 to-green-600",
  "from-purple-600 to-pink-600",
  "from-yellow-500 to-orange-600",
  "from-teal-500 to-cyan-600",
]

function typeIcon(type: string) {
  if (type === "delivery") return Truck
  if (type === "percentage") return Percent
  return Gift
}

function discountLabel(code: PromoCode) {
  if (code.discount_type === "delivery") return "Livraison gratuite"
  if (code.discount_type === "percentage") return `-${code.discount_value}%`
  return `-${new Intl.NumberFormat("fr-FR").format(code.discount_value)} F`
}

function CountdownTimer({ until }: { until: string | null }) {
  const [left, setLeft] = useState("")
  useEffect(() => {
    if (!until) { setLeft("Permanent"); return }
    const update = () => {
      const diff = Math.max(0, new Date(until).getTime() - Date.now())
      if (diff === 0) { setLeft("Expiré"); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setLeft(d > 0 ? `${d}j ${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m` :
              `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`)
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [until])
  return <span className="font-mono font-bold">{left}</span>
}

export default function MarketplaceOffersPage() {
  const [offers, setOffers] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  const fetchOffers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/marketplace/offers")
      if (res.ok) setOffers(await res.json())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchOffers() }, [fetchOffers])

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border/30 px-4 py-3 flex items-center gap-3">
        <Link href="/marketplace" className="p-2 hover:bg-white/5 rounded-full">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div className="flex-1">
          <h1 className="text-white font-bold">Offres &amp; Promotions</h1>
          <p className="text-xs text-muted-foreground">{offers.length} offre{offers.length !== 1 ? "s" : ""} disponible{offers.length !== 1 ? "s" : ""}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchOffers}>
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-2xl bg-card/30 animate-pulse" />
            ))}
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune offre disponible pour le moment</p>
            <p className="text-xs text-muted-foreground mt-2">Revenez bientôt pour de nouvelles promotions !</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {offers.map((offer, i) => {
              const gradient = GRADIENTS[i % GRADIENTS.length]
              const Icon = typeIcon(offer.discount_type)
              const isCopied = copied === offer.code
              return (
                <motion.div key={offer.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`relative rounded-2xl bg-gradient-to-br ${gradient} p-5 overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      {offer.valid_until && (
                        <div className="bg-black/30 rounded-lg px-2 py-1 text-right">
                          <p className="text-[9px] text-white/60">Expire dans</p>
                          <p className="text-white text-xs"><CountdownTimer until={offer.valid_until} /></p>
                        </div>
                      )}
                      {!offer.valid_until && (
                        <span className="bg-black/30 rounded-lg px-2 py-1 text-[10px] text-white/80 flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Permanent
                        </span>
                      )}
                    </div>
                    <p className="text-3xl font-black text-white">{discountLabel(offer)}</p>
                    <p className="text-white font-semibold text-sm mt-1">{offer.title ?? "Offre spéciale"}</p>
                    {offer.description && (
                      <p className="text-white/70 text-xs mt-1">{offer.description}</p>
                    )}
                    {offer.min_order_amount != null && offer.min_order_amount > 0 && (
                      <p className="text-white/60 text-[10px] mt-1">
                        Commande min. {new Intl.NumberFormat("fr-FR").format(offer.min_order_amount)} F
                      </p>
                    )}
                    <button
                      onClick={() => handleCopy(offer.code)}
                      className={`mt-4 w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                        isCopied ? "bg-white/30 border-white/50" : "bg-black/30 border-white/20 hover:bg-black/40"
                      }`}
                    >
                      <span className="font-mono font-bold text-white text-sm">{offer.code}</span>
                      {isCopied ? (
                        <CheckCircle className="w-4 h-4 text-white" />
                      ) : (
                        <Copy className="w-4 h-4 text-white/70" />
                      )}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Static fallback if DB is empty */}
        {!loading && offers.length === 0 && (
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">Essayez le code <span className="font-mono text-quickgo-blue font-bold">BIENVENUE</span> pour -10% sur votre première commande</p>
          </div>
        )}
      </div>
    </div>
  )
}
