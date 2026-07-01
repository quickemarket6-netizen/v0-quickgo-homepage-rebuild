"use client"

import { MotionConfig } from "framer-motion"

/**
 * App-wide Framer Motion config. `reducedMotion="user"` makes every motion
 * component honour the OS "reduce motion" setting automatically — transform /
 * layout animations are dropped (opacity is kept) for users who ask for it,
 * without touching each component. Pairs with the CSS reduced-motion rule in
 * globals.css that covers non-Framer CSS animations (spin/ping/pulse).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>
}
