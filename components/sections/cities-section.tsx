"use client"

import { motion } from "framer-motion"
import { useT } from "@/lib/i18n/context"
import Link from "next/link"
import Image from "next/image"
import { MapPin, ArrowRight, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

const cities = [
  {
    id: "yaounde",
    name: "Yaoundé",
    subtitle: "Livraison rapide",
    available: true,
    image: "https://images.unsplash.com/photo-1595826952763-9a0e0e54bcde?w=600&h=400&fit=crop",
  },
  {
    id: "douala",
    name: "Douala",
    subtitle: "Livraison rapide",
    available: true,
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=600&h=400&fit=crop",
  },
  {
    id: "bafoussam",
    name: "Bafoussam",
    subtitle: "Livraison rapide",
    available: false,
    image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&h=400&fit=crop",
  },
  {
    id: "bamenda",
    name: "Bamenda",
    subtitle: "Livraison rapide",
    available: false,
    image: "https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=600&h=400&fit=crop",
  },
  {
    id: "autres",
    name: "Autres villes",
    subtitle: "Bientôt disponible",
    available: false,
    isComingSoon: true,
  },
]

export function CitiesSection() {
  const { t } = useT()
  return (
    <section className="py-16 lg:py-24 bg-muted/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid opacity-30" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12"
        >
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
              {t("cities.title")}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t("cities.subtitle")}
            </p>
          </div>
          <Button variant="ghost" className="hidden sm:flex items-center gap-2 text-primary mt-4 sm:mt-0">
            {t("cities.seeAll")}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
        
        {/* Cities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          {cities.map((city, index) => (
            <motion.div
              key={city.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={city.available ? `/livraison/${city.id}` : "#"}>
                <div className={`group relative h-[200px] lg:h-[240px] rounded-2xl overflow-hidden cursor-pointer ${!city.available && "opacity-70"}`}>
                  {/* Background */}
                  {city.isComingSoon ? (
                    <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ChevronRight className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Image
                        src={city.image!}
                        alt={city.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    </>
                  )}
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-5 flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className={`h-4 w-4 ${city.available ? "text-secondary" : "text-muted-foreground"}`} />
                      {city.available && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-1">
                      {city.name}
                    </h3>
                    <p className={`text-sm ${city.available ? "text-white/70" : "text-muted-foreground"}`}>
                      {city.subtitle}
                    </p>
                  </div>
                  
                  {/* Hover Effect */}
                  {city.available && (
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-secondary/50 rounded-2xl transition-colors duration-300" />
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
