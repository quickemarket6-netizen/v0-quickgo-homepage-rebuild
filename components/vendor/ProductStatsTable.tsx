"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Eye, ShoppingCart, TrendingUp, Package } from "lucide-react"

interface ProductStat {
  id: string; name: string; image_url: string | null; price: number
  is_available: boolean; stock_quantity: number | null
  views: number; units_sold: number; revenue: number
  order_count: number; conversion: number | null
}

const formatCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F"

// Performance produits 30 j : vues, ventes, CA, taux de conversion.
// Les vues sont collectées par la fiche produit publique (product_views).
export function ProductStatsTable() {
  const [stats, setStats] = useState<ProductStat[] | null>(null)
  const [totalViews, setTotalViews] = useState(0)

  useEffect(() => {
    fetch("/api/vendor/products/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.products) { setStats(d.products); setTotalViews(d.total_views ?? 0) }
        else setStats([])
      })
      .catch(() => setStats([]))
  }, [])

  if (stats === null) {
    return <div className="h-48 rounded-2xl bg-[#16161f]/80 border border-[#1e1e2e] animate-pulse" />
  }
  if (stats.length === 0) return null

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-[#1e1e2e] flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#a3e635]" /> Performance produits
          </h2>
          <p className="text-xs text-white/30 mt-0.5">
            30 derniers jours · {new Intl.NumberFormat("fr-FR").format(totalViews)} vue{totalViews > 1 ? "s" : ""} de fiches
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-white/30 border-b border-[#1e1e2e]">
              <th className="px-5 py-3 font-medium">Produit</th>
              <th className="px-4 py-3 font-medium text-right"><span className="inline-flex items-center gap-1"><Eye className="w-3 h-3" /> Vues</span></th>
              <th className="px-4 py-3 font-medium text-right"><span className="inline-flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> Ventes</span></th>
              <th className="px-4 py-3 font-medium text-right">CA</th>
              <th className="px-5 py-3 font-medium text-right">Conversion</th>
            </tr>
          </thead>
          <tbody>
            {stats.slice(0, 10).map((p) => (
              <tr key={p.id} className="border-b border-[#1e1e2e]/50 last:border-0 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-9 h-9 rounded-lg bg-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                      {p.image_url
                        ? <Image src={p.image_url} alt={p.name} fill className="object-cover" sizes="36px" />
                        : <Package className="w-4 h-4 text-white/20" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium truncate max-w-[220px]">{p.name}</p>
                      <p className="text-[11px] text-white/30">{formatCFA(p.price)}{!p.is_available && " · inactif"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-white/70 tabular-nums">{p.views}</td>
                <td className="px-4 py-3 text-right text-white/70 tabular-nums">{p.units_sold}</td>
                <td className="px-4 py-3 text-right text-[#a3e635] font-semibold tabular-nums">{formatCFA(p.revenue)}</td>
                <td className="px-5 py-3 text-right">
                  {p.conversion == null ? (
                    <span className="text-white/20 text-xs">—</span>
                  ) : (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      p.conversion >= 5 ? "bg-[#a3e635]/15 text-[#a3e635]"
                      : p.conversion >= 1 ? "bg-amber-500/15 text-amber-400"
                      : "bg-white/5 text-white/40"
                    }`}>
                      {p.conversion.toLocaleString("fr-FR")} %
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="px-5 py-3 text-[11px] text-white/25 border-t border-[#1e1e2e]">
        Conversion = commandes contenant le produit ÷ vues de sa fiche. Les vues sont comptées depuis l&apos;activation de la migration.
      </p>
    </motion.div>
  )
}
