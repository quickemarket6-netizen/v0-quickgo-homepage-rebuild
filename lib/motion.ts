/**
 * Système de motion QuickGo — source de vérité unique des durées, courbes et
 * presets d'animation. Objectif : une seule échelle partagée (comme Airbnb /
 * Shopify) plutôt que 8 paliers de durées choisis au cas par cas, pour que
 * toute l'app donne l'impression d'être « faite d'une seule main ».
 *
 * Usage Framer Motion :
 *   import { DUR, EASE, transition, spring, fadeUp, stagger } from "@/lib/motion"
 *   <motion.div {...fadeUp()} transition={transition("base")} />
 *   <motion.div animate={{ scale: 1 }} transition={spring.snappy} />
 *
 * Les mêmes valeurs existent en CSS (globals.css) : var(--dur-fast|base|slow),
 * var(--ease-out) — pour les transitions/animations non-Framer.
 *
 * Accessibilité : MotionProvider (reducedMotion="user") + la règle
 * prefers-reduced-motion de globals.css neutralisent tout ceci automatiquement.
 */

// ── Durées (secondes) ────────────────────────────────────────────────────────
// fast : micro-interactions (tap, hover, toggle) · base : UI courante,
// transitions de page · slow : entrées et révélations · slower : révélations
// à grande échelle (hero). Les ambiances de fond (orbes 6-13 s) ne sont PAS
// des interactions et restent hors de cette échelle.
export const DUR = {
  fast: 0.15,
  base: 0.25,
  slow: 0.45,
  slower: 0.7,
} as const

export type DurToken = keyof typeof DUR

// ── Courbes ──────────────────────────────────────────────────────────────────
// out    : décélération franche, la courbe par défaut des entrées/UI.
// inOut  : symétrique, pour les boucles d'ambiance.
// linear : rotations continues uniquement.
export const EASE = {
  out: [0.22, 1, 0.36, 1] as [number, number, number, number],
  inOut: "easeInOut" as const,
  linear: "linear" as const,
}

// ── Presets de transition Framer ─────────────────────────────────────────────
import type { Transition } from "framer-motion"

export function transition(dur: DurToken = "base", ease: Transition["ease"] = EASE.out): Transition {
  return { duration: DUR[dur], ease }
}

export const spring = {
  soft:   { type: "spring", stiffness: 120, damping: 18 } as const,
  snappy: { type: "spring", stiffness: 300, damping: 20 } as const,
  bouncy: { type: "spring", stiffness: 500, damping: 15 } as const,
}

// ── Variantes réutilisables ──────────────────────────────────────────────────
export function fadeUp(y = 12) {
  return { initial: { opacity: 0, y }, animate: { opacity: 1, y: 0 } }
}
export const fade = { initial: { opacity: 0 }, animate: { opacity: 1 } }

// Délai d'un item dans une liste échelonnée (borne haute pour éviter les
// cascades interminables sur les longues listes).
export function stagger(index: number, step = 0.05, max = 0.4) {
  return Math.min(index * step, max)
}
