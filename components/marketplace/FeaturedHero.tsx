"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  ChevronLeft, ChevronRight, Star, Tag, Store, Sparkles, ArrowRight, Bike,
} from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────
type SlideKind = "promo" | "vendor" | "product"

interface Slide {
  kind: SlideKind
  id: string
  title: string
  subtitle: string
  image: string | null
  href: string
  badge: string
  cta: string
  accent: string     // hex accent for this slide
  gradient: [string, string]
  meta?: { rating?: number | null; deliveryTime?: number | null; price?: number; oldPrice?: number | null; discount?: number | null }
}

const formatCFA = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA"

const PROMO_GRADIENTS: [string, string][] = [
  ["#7c3aed", "#4c1d95"],
  ["#0891b2", "#155e75"],
  ["#db2777", "#831843"],
]

export function FeaturedHero() {
  const [slides, setSlides] = useState<Slide[]>([])
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const startTimer = useCallback((count: number) => {
    if (timer.current) clearInterval(timer.current)
    if (count <= 1) return
    timer.current = setInterval(() => setIdx((i) => (i + 1) % count), 5000)
  }, [])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetch("/api/marketplace/offers").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/vendors?featured=true").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      fetch("/api/products?featured=true&limit=6").then((r) => (r.ok ? r.json() : { data: [] })).catch(() => ({ data: [] })),
    ]).then(([offers, vendors, productsRes]) => {
      if (cancelled) return
      const built: Slide[] = []

      // Promos first — the most eye-catching
      ;(Array.isArray(offers) ? offers : []).slice(0, 3).forEach((o: {
        id: string; code: string; title?: string; description?: string
        discount_type: string; discount_value: number
      }, i: number) => {
        const disc = o.discount_type === "percent" ? `-${o.discount_value}%` : `-${formatCFA(o.discount_value)}`
        built.push({
          kind: "promo",
          id: o.id,
          title: o.title || `Offre ${disc}`,
          subtitle: o.description || `Code ${o.code} · profitez-en maintenant`,
          image: null,
          href: "/marketplace/offers",
          badge: "Offre spéciale",
          cta: "Voir l'offre",
          accent: "#ffffff",
          gradient: PROMO_GRADIENTS[i % PROMO_GRADIENTS.length],
          meta: { discount: o.discount_value },
        })
      })

      // Featured vendors
      ;(Array.isArray(vendors) ? vendors : []).slice(0, 3).forEach((v: {
        id: string; name: string; description?: string | null; cover_url?: string | null
        logo_url?: string | null; rating?: number | null; delivery_time_min?: number | null
      }) => {
        built.push({
          kind: "vendor",
          id: v.id,
          title: v.name,
          subtitle: v.description || "Boutique recommandée par QuickGo",
          image: v.cover_url || v.logo_url || null,
          href: `/marketplace/shops/${v.id}`,
          badge: "Boutique en vedette",
          cta: "Visiter la boutique",
          accent: "#a3e635",
          gradient: ["#0f766e", "#065f46"],
          meta: { rating: v.rating, deliveryTime: v.delivery_time_min },
        })
      })

      // Featured products
      const products = Array.isArray(productsRes?.data) ? productsRes.data : []
      products.slice(0, 3).forEach((p: {
        id: string; name: string; price: number; compare_price?: number | null
        original_price?: number | null; images?: string[] | null; image_url?: string | null
        rating?: number | null; vendor?: { name?: string } | null
      }) => {
        const old = p.compare_price ?? p.original_price ?? null
        const discount = old && old > p.price ? Math.round((1 - p.price / old) * 100) : null
        built.push({
          kind: "product",
          id: p.id,
          title: p.name,
          subtitle: p.vendor?.name ? `Vendu par ${p.vendor.name}` : "Produit populaire",
          image: p.images?.[0] ?? p.image_url ?? null,
          href: `/marketplace/product/${p.id}`,
          badge: "Coup de cœur",
          cta: "Découvrir",
          accent: "#3b82f6",
          gradient: ["#1e3a8a", "#0c4a6e"],
          meta: { price: p.price, oldPrice: old, discount, rating: p.rating },
        })
      })

      setSlides(built)
      setLoading(false)
      startTimer(built.length)
    })
    return () => { cancelled = true; if (timer.current) clearInterval(timer.current) }
  }, [startTimer])

  const go = (dir: 1 | -1) => {
    setIdx((i) => (i + dir + slides.length) % slides.length)
    startTimer(slides.length)
  }

  if (loading) {
    return <div className="h-[260px] md:h-[360px] rounded-3xl bg-white/[0.04] border border-white/10 animate-pulse" />
  }
  if (slides.length === 0) return null

  const s = slides[idx]
  const KindIcon = s.kind === "promo" ? Tag : s.kind === "vendor" ? Store : Sparkles

  return (
    <div className="relative h-[260px] md:h-[360px] rounded-3xl overflow-hidden group select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={s.id}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
          style={{ background: `linear-gradient(120deg, ${s.gradient[0]}, ${s.gradient[1]})` }}
        >
          {/* Background image */}
          {s.image && (
            <>
              <Image src={s.image} alt={s.title} fill priority className="object-cover" sizes="100vw" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
            </>
          )}
          {/* Decorative glow */}
          <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full blur-3xl opacity-30"
            style={{ background: s.accent }} />

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-12 max-w-2xl">
            <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 mb-3">
              <KindIcon className="w-3.5 h-3.5" style={{ color: s.accent }} />
              <span className="text-xs font-semibold text-white tracking-wide uppercase">{s.badge}</span>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-2xl md:text-4xl font-black text-white leading-tight line-clamp-2 drop-shadow"
            >
              {s.title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
              className="text-sm md:text-base text-white/75 mt-2 line-clamp-2 max-w-lg"
            >
              {s.subtitle}
            </motion.p>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              {s.meta?.price != null && (
                <span className="text-xl md:text-2xl font-black" style={{ color: s.accent }}>
                  {formatCFA(s.meta.price)}
                </span>
              )}
              {s.meta?.oldPrice != null && (
                <span className="text-sm text-white/40 line-through">{formatCFA(s.meta.oldPrice)}</span>
              )}
              {s.meta?.discount != null && s.kind !== "promo" && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#ef4444] text-white">-{s.meta.discount}%</span>
              )}
              {s.meta?.rating != null && (
                <span className="inline-flex items-center gap-1 text-sm text-white/90">
                  <Star className="w-4 h-4 text-[#eab308] fill-current" /> {s.meta.rating.toFixed(1)}
                </span>
              )}
              {s.meta?.deliveryTime != null && (
                <span className="inline-flex items-center gap-1 text-sm text-white/70">
                  <Bike className="w-4 h-4" /> {s.meta.deliveryTime} min
                </span>
              )}
            </div>

            <Link href={s.href} className="mt-5 self-start">
              <span
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm text-black shadow-lg hover:brightness-110 transition-all"
                style={{ background: s.accent === "#ffffff" ? "#ffffff" : s.accent }}
              >
                {s.cta} <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Arrows */}
      {slides.length > 1 && (
        <>
          <button onClick={() => go(-1)} aria-label="Précédent"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button onClick={() => go(1)} aria-label="Suivant"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/60">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-6 md:left-12 z-20 flex gap-1.5">
          {slides.map((_, i) => (
            <button key={i} aria-label={`Aller au slide ${i + 1}`}
              onClick={() => { setIdx(i); startTimer(slides.length) }}
              className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/70"}`} />
          ))}
        </div>
      )}
    </div>
  )
}
