"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fadeUp, transition } from "@/lib/motion"

// État vide standard du marketplace : icône, message, action de repli.
// Un vide sans issue est un cul-de-sac — chaque état vide doit proposer
// la prochaine étape (pattern Jumia/Amazon).
export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  compact = false,
}: {
  icon: LucideIcon
  title: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
  compact?: boolean
}) {
  return (
    <motion.div
      {...fadeUp()}
      transition={transition("slow")}
      className={`w-full flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-[#1e1e2e] bg-[#111118]/60 ${
        compact ? "py-8 px-4" : "py-14 px-6"
      }`}
    >
      <div className={`rounded-2xl bg-white/5 flex items-center justify-center mb-4 ${compact ? "w-12 h-12" : "w-16 h-16"}`}>
        <Icon className={`text-white/25 ${compact ? "w-6 h-6" : "w-8 h-8"}`} />
      </div>
      <p className={`text-white font-semibold ${compact ? "text-sm" : "text-base"}`}>{title}</p>
      {description && (
        <p className="text-sm text-white/40 mt-1 max-w-sm">{description}</p>
      )}
      {ctaLabel && ctaHref && (
        <Link href={ctaHref} className="mt-4">
          <Button size="sm" variant="outline" className="rounded-full border-[#2a2a3e] text-white hover:bg-white/5">
            {ctaLabel}
          </Button>
        </Link>
      )}
    </motion.div>
  )
}
