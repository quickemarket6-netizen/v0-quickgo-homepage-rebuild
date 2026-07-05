"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { AnimatePresence, motion } from "framer-motion"
import { Search, Star, Store, Package, ArrowRight, Loader2 } from "lucide-react"

interface ProductHit {
  id: string; name: string; price: number; original_price: number | null
  image_url: string | null; rating: number | null
  vendor: { id: string; name: string } | null
}
interface VendorHit {
  id: string; name: string; slug: string; logo_url: string | null
  rating: number | null; review_count: number | null
  delivery_fee: number | null; city: string | null
}

const formatCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F"

// Barre de recherche globale (produits + boutiques) avec suggestions instantanées.
// Entrée → page résultats produits ; clic boutique → fiche boutique.
export function GlobalSearch({ className = "" }: { className?: string }) {
  const router = useRouter()
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<ProductHit[]>([])
  const [vendors, setVendors] = useState<VendorHit[]>([])
  const boxRef = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const runSearch = useCallback(async (query: string) => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: ctrl.signal })
      if (r.ok) {
        const d = await r.json()
        setProducts(d.products ?? [])
        setVendors(d.vendors ?? [])
      }
    } catch { /* requête annulée ou réseau — on garde les résultats précédents */ }
    finally { if (!ctrl.signal.aborted) setLoading(false) }
  }, [])

  const onChange = (val: string) => {
    setQ(val)
    if (timer.current) clearTimeout(timer.current)
    if (val.trim().length < 2) { setProducts([]); setVendors([]); setOpen(val.trim().length > 0); return }
    setOpen(true)
    timer.current = setTimeout(() => runSearch(val.trim()), 300)
  }

  const goToResults = () => {
    const query = q.trim()
    if (!query) return
    setOpen(false)
    router.push(`/marketplace/products?q=${encodeURIComponent(query)}`)
  }

  // Ferme le dropdown au clic extérieur
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClick)
    return () => document.removeEventListener("mousedown", onClick)
  }, [])

  const hasResults = products.length > 0 || vendors.length > 0

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        <input
          value={q}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => { if (q.trim().length >= 2) setOpen(true) }}
          onKeyDown={(e) => { if (e.key === "Enter") goToResults(); if (e.key === "Escape") setOpen(false) }}
          placeholder="Rechercher un produit, une boutique…"
          className="w-full bg-[#16161f] border border-[#1e1e2e] rounded-full pl-10 pr-12 h-9 text-sm text-white
            placeholder:text-white/20 focus:outline-none focus:border-[#3b82f6]/50 transition-colors"
          aria-label="Recherche globale"
        />
        <button
          onClick={goToResults}
          aria-label="Lancer la recherche"
          className="absolute right-1 top-1 h-7 w-7 rounded-full bg-[#3b82f6] flex items-center justify-center
            transition-colors hover:bg-[#3b82f6]/80"
        >
          {loading
            ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
            : <ArrowRight className="w-3.5 h-3.5 text-white" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl bg-[#111118] border border-[#1e1e2e]
              shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] overflow-hidden"
          >
            {q.trim().length < 2 ? (
              <p className="p-4 text-xs text-white/30">Tapez au moins 2 caractères…</p>
            ) : !hasResults && !loading ? (
              <div className="p-6 text-center">
                <Search className="w-6 h-6 mx-auto text-white/10 mb-2" />
                <p className="text-xs text-white/30">Aucun résultat pour « {q.trim()} »</p>
              </div>
            ) : (
              <div className="max-h-[70vh] overflow-y-auto">
                {vendors.length > 0 && (
                  <div className="p-2">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/25">Boutiques</p>
                    {vendors.map((v) => (
                      <Link key={v.id} href={`/marketplace/shops/${v.id}`} onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="relative w-9 h-9 rounded-xl bg-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                          {v.logo_url
                            ? <Image src={v.logo_url} alt={v.name} fill className="object-cover" />
                            : <Store className="w-4 h-4 text-white/20" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white font-medium truncate">{v.name}</p>
                          <p className="text-[11px] text-white/30 truncate">
                            {v.city ?? "—"}{v.delivery_fee === 0 ? " · Livraison gratuite" : ""}
                          </p>
                        </div>
                        {v.rating != null && v.rating > 0 && (
                          <span className="flex items-center gap-0.5 text-[11px] text-[#eab308] shrink-0">
                            <Star className="w-3 h-3 fill-current" />{v.rating.toFixed(1)}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}

                {products.length > 0 && (
                  <div className="p-2 border-t border-[#1e1e2e]">
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/25">Produits</p>
                    {products.map((p) => (
                      <Link key={p.id} href={`/marketplace/product/${p.id}`} onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="relative w-9 h-9 rounded-xl bg-white/5 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.image_url
                            ? <Image src={p.image_url} alt={p.name} fill className="object-cover" />
                            : <Package className="w-4 h-4 text-white/20" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white font-medium truncate">{p.name}</p>
                          <p className="text-[11px] text-white/30 truncate">{p.vendor?.name ?? "QuickGo"}</p>
                        </div>
                        <p className="text-xs font-bold text-[#a3e635] shrink-0">{formatCFA(p.price)}</p>
                      </Link>
                    ))}
                  </div>
                )}

                <button onClick={goToResults}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-t border-[#1e1e2e]
                    text-xs font-semibold text-[#3b82f6] hover:bg-[#3b82f6]/10 transition-colors">
                  Voir tous les résultats pour « {q.trim()} » <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
