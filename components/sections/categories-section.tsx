"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ShoppingBag, Utensils, Pill, Shirt, ShoppingCart, Bot } from "lucide-react"

const categories = [
  {
    id: "market",
    title: "Market",
    subtitle: "Des milliers de produits",
    icon: ShoppingBag,
    href: "/marketplace",
    gradient: "from-orange-500 to-red-500",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop",
  },
  {
    id: "restaurants",
    title: "Restaurants",
    subtitle: "Vos plats préférés",
    icon: Utensils,
    href: "/marketplace/restaurants",
    gradient: "from-amber-500 to-orange-500",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop",
  },
  {
    id: "pharmacie",
    title: "Pharmacie",
    subtitle: "Santé & bien-être",
    icon: Pill,
    href: "/marketplace/pharmacy",
    gradient: "from-emerald-500 to-teal-500",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=300&fit=crop",
  },
  {
    id: "mode",
    title: "Mode",
    subtitle: "Tendances & styles",
    icon: Shirt,
    href: "/marketplace/fashion",
    gradient: "from-pink-500 to-rose-500",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop",
  },
  {
    id: "supermarche",
    title: "Supermarché",
    subtitle: "Tout le quotidien",
    icon: ShoppingCart,
    href: "/marketplace/supermarket",
    gradient: "from-blue-500 to-cyan-500",
    image: "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=400&h=300&fit=crop",
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    subtitle: "Votre assistant intelligent",
    icon: Bot,
    href: "/ai",
    gradient: "from-primary to-accent",
    isAI: true,
  },
]

export function CategoriesSection() {
  return (
    <section className="py-16 lg:py-24 bg-background relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Explorez nos catégories
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Trouvez tout ce dont vous avez besoin dans nos différentes catégories
          </p>
        </motion.div>
        
        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={category.href}>
                <div className="group relative h-[180px] lg:h-[200px] rounded-2xl overflow-hidden cursor-pointer">
                  {/* Background */}
                  {category.isAI ? (
                    <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient}`}>
                      <div className="absolute inset-0 bg-grid opacity-20" />
                    </div>
                  ) : (
                    <>
                      <Image
                        src={category.image!}
                        alt={category.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20`} />
                    </>
                  )}
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <div className={`w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3`}>
                      <category.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {category.title}
                    </h3>
                    <p className="text-sm text-white/70">
                      {category.subtitle}
                    </p>
                    
                    {category.isAI && (
                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-xs font-medium text-white">
                          Demander à l&apos;AI
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Hover Effect */}
                  <div className="absolute inset-0 border-2 border-transparent group-hover:border-secondary/50 rounded-2xl transition-colors duration-300" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
