"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Gift, Copy, Check, Share2, Users, Wallet } from "lucide-react"

interface ReferralData {
  code: string
  link: string
  total_referrals: number
  rewarded_count: number
  pending_count: number
  total_earned: number
}

const formatCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA"

// Carte « Parrainez vos proches » : code + lien de partage + statistiques.
// Le parrain touche le bonus quand son filleul reçoit sa première commande.
export function ReferralCard() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch("/api/referral")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.code) setData(d) })
      .catch(() => {})
  }, [])

  if (!data) return null

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(data.link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard indisponible */ }
  }

  const share = async () => {
    const text = `Rejoins-moi sur QuickGo avec mon code ${data.code} — tout ce dont tu as besoin, livré rapidement ! ${data.link}`
    if (navigator.share) {
      try { await navigator.share({ title: "QuickGo", text, url: data.link }) } catch { /* partage annulé */ }
    } else {
      copyLink()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-quickgo-lime/25 bg-gradient-to-br from-quickgo-lime/10 to-quickgo-blue/5 p-5 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-quickgo-lime/15 flex items-center justify-center shrink-0">
          <Gift className="w-5 h-5 text-quickgo-lime" />
        </div>
        <div>
          <p className="font-bold text-foreground">Parrainez vos proches</p>
          <p className="text-xs text-muted-foreground">
            1 000 FCFA sur votre portefeuille dès la première commande livrée de votre filleul.
          </p>
        </div>
      </div>

      {/* Code + actions */}
      <div className="flex items-center gap-2">
        <div className="flex-1 px-4 py-2.5 rounded-xl bg-background/60 border border-border/50 font-mono font-bold text-lg text-foreground tracking-widest text-center select-all">
          {data.code}
        </div>
        <button onClick={copyLink} aria-label="Copier le lien"
          className="p-2.5 rounded-xl bg-background/60 border border-border/50 hover:border-quickgo-lime/50 transition-colors">
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
        </button>
        <button onClick={share} aria-label="Partager"
          className="p-2.5 rounded-xl bg-quickgo-lime text-black hover:bg-quickgo-lime/90 transition-colors">
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-xl bg-background/40">
          <Users className="w-3.5 h-3.5 mx-auto text-quickgo-blue mb-1" />
          <p className="text-lg font-black text-foreground leading-none">{data.total_referrals}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Filleul{data.total_referrals > 1 ? "s" : ""}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-background/40">
          <Gift className="w-3.5 h-3.5 mx-auto text-quickgo-lime mb-1" />
          <p className="text-lg font-black text-foreground leading-none">{data.rewarded_count}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Récompensé{data.rewarded_count > 1 ? "s" : ""}</p>
        </div>
        <div className="p-2.5 rounded-xl bg-background/40">
          <Wallet className="w-3.5 h-3.5 mx-auto text-quickgo-cyan mb-1" />
          <p className="text-lg font-black text-foreground leading-none">{formatCFA(data.total_earned)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Gagnés</p>
        </div>
      </div>
    </motion.div>
  )
}
