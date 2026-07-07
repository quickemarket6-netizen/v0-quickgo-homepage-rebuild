"use client"

import { motion } from "framer-motion"

// Uniquement des intégrations réelles : moyens de paiement et
// infrastructure effectivement branchés dans la plateforme.
const partners = [
  { name: "Orange Money" },
  { name: "MTN MoMo" },
  { name: "CinetPay" },
  { name: "Visa" },
  { name: "Mastercard" },
  { name: "Africa's Talking" },
]

export function PartnersSection() {
  return (
    <section className="py-12 lg:py-16 bg-background border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Paiements &amp; partenaires technologiques
          </p>
        </motion.div>
        
        {/* Partners Logos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-8 lg:gap-12"
        >
          {partners.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 * index }}
              className="relative h-8 w-24 lg:h-10 lg:w-32 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
            >
              {/* Placeholder logo text since we don't have actual logo files */}
              <div className="h-full w-full flex items-center justify-center text-muted-foreground font-bold text-sm lg:text-base tracking-wider">
                {partner.name}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
