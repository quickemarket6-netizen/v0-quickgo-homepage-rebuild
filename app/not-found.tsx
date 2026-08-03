"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Home, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative w-32 h-32 mx-auto mb-8"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-quickgo-blue/20 to-quickgo-cyan/20 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center">
            <span className="text-white font-bold text-5xl">?</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-4xl font-bold text-white mb-4"
        >
          Page introuvable
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground mb-8"
        >
          Oups ! La page que vous recherchez n&apos;existe pas ou a été déplacée.
          Pas de panique, nous allons vous aider à retrouver votre chemin.
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button asChild className="bg-quickgo-blue hover:bg-quickgo-blue/90 rounded-full">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Retour à l&apos;accueil
            </Link>
          </Button>
          <Button variant="outline" asChild className="rounded-full">
            <Link href="/support">
              <HelpCircle className="w-4 h-4 mr-2" />
              Contacter le support
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 pt-8 border-t border-border/30"
        >
          <p className="text-sm text-muted-foreground mb-4">Pages populaires</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: "Marketplace", href: "/marketplace" },
              { label: "Livraison", href: "/delivery" },
              { label: "Devenir livreur", href: "/driver" },
              { label: "QuickGo Pay", href: "/wallet" },
              { label: "AI Assistant", href: "/ai" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 bg-card/50 hover:bg-card rounded-full text-sm text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
