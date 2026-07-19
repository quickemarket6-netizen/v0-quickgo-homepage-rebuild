"use client"

import { motion } from "framer-motion"
import { DUR, EASE } from "@/lib/motion"

// Transition de page : un fondu d'opacité à chaque navigation.
// template.tsx (≠ layout.tsx) est remonté à chaque changement de route, ce qui
// déclenche l'animation d'entrée. `reducedMotion="user"` (MotionProvider) la
// neutralise pour les utilisateurs sensibles.
//
// Opacité SEULE, volontairement : un `transform` sur ce wrapper créerait un
// bloc conteneur pour les descendants `position: fixed` (sidebars vendeur/admin,
// bottom nav, modales), qui sauteraient pendant l'animation. L'opacité n'a pas
// cet effet de bord. Durée courte (0.2 s) pour rester perçu comme instantané.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: DUR.base, ease: EASE.out }}
    >
      {children}
    </motion.div>
  )
}
