"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useT } from "@/lib/i18n/context"
import Image from "next/image"
import { ArrowRight } from "lucide-react"

const categories = [
  {
    id: "market",
    title: "Market",
    subtitle: "Des milliers de produits",
    href: "/marketplace/products",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2024%20mai%202026%2C%2022_19_44-8xw5FhUr3Zk36b2rwl2ByAS0vBUOkM.png",
  },
  {
    id: "restaurants",
    title: "Restaurants",
    subtitle: "Vos plats preferes",
    href: "/marketplace/shops?cat=restaurant",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2024%20mai%202026%2C%2022_19_55-etCIVo6QXySXKqsDKzppsqOu5DNr8t.png",
  },
  {
    id: "pharmacie",
    title: "Pharmacie",
    subtitle: "Sante & bien-etre",
    href: "/marketplace/shops?cat=pharmacie",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2024%20mai%202026%2C%2022_20_05-yCuWqeCloq9kLRXlz0LcMlghdIIVNX.png",
  },
  {
    id: "mode",
    title: "Mode",
    subtitle: "Tendances & styles",
    href: "/marketplace/shops?cat=mode",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2024%20mai%202026%2C%2022_20_15-QR3f8WiJyJZ0ew7DHFMBSRRolUehLi.png",
  },
  {
    id: "supermarche",
    title: "Supermarche",
    subtitle: "Tout le quotidien",
    href: "/marketplace/shops?cat=supermarche",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2024%20mai%202026%2C%2022_20_23-gcEQzMu6FJHi6qJ0yKrX5EZE8MKpA8.png",
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    subtitle: "Votre assistant intelligent",
    href: "/ai",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2024%20mai%202026%2C%2022_22_18-MJbF5ZuTXc8ldqWNTJC2uMXkxI10oy.png",
  },
]

const serviceCards = [
  {
    id: "livraison",
    title: "Transport & Livraison",
    subtitle: "Suivre ma livraison",
    href: "/tracking",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2024%20mai%202026%2C%2022_24_04-wWFeAWw1cjayTmbGPbHtYRUykcLHVz.png",
  },
  {
    id: "checkout",
    title: "Panier & Checkout",
    subtitle: "Valider ma commande",
    href: "/marketplace/cart",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2024%20mai%202026%2C%2022_25_43-V6yuZSgan4UZfkfe95ik51ddRIG5gg.png",
  },
  {
    id: "tracking",
    title: "Suivez votre livraison",
    subtitle: "En temps reel",
    href: "/tracking",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ChatGPT%20Image%2024%20mai%202026%2C%2022_26_38-EaywNcPnEgBNDjijrvRnNf451sYjlP.png",
  },
]

export function CategoriesSection() {
  const { t } = useT()
  return (
    <section className="py-16 lg:py-24 bg-background relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-quickgo-blue/5 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
{t("cat.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
{t("cat.subtitle")}
          </p>
        </motion.div>

        {/* Categories Grid - Using Premium Mockup Images */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-5 mb-12">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={category.href}>
                <div className="group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border border-border/30 hover:border-quickgo-blue/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-quickgo-blue/20">
                  {/* Image */}
                  <Image
                    src={category.image}
                    alt={category.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  />
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Hover Arrow */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                    <div className="w-8 h-8 rounded-full bg-quickgo-blue/90 flex items-center justify-center">
                      <ArrowRight className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  {/* Title on hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <h3 className="text-sm font-bold text-white">{category.title}</h3>
                    <p className="text-xs text-white/70">{category.subtitle}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Service Cards - Large Premium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {serviceCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              <Link href={card.href}>
                <div className="group relative h-[280px] lg:h-[320px] rounded-3xl overflow-hidden cursor-pointer border border-border/30 hover:border-quickgo-blue/50 transition-all duration-300 hover:shadow-2xl hover:shadow-quickgo-blue/20">
                  {/* Image */}
                  <Image
                    src={card.image}
                    alt={card.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-bold text-white mb-1">{card.title}</h3>
                    <div className="flex items-center gap-2 text-quickgo-blue group-hover:gap-3 transition-all">
                      <span className="text-sm font-medium">{card.subtitle}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                  
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div className="absolute inset-0 bg-quickgo-blue/10" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-quickgo-blue/20 blur-3xl" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
