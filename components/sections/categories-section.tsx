"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, ShoppingBag, Utensils, Pill, Shirt, ShoppingCart, Bot, Sparkles } from "lucide-react"

const categories = [
  {
    id: "market",
    title: "Market",
    subtitle: "Des milliers de produits",
    icon: ShoppingBag,
    href: "/marketplace",
    gradient: "from-orange-500 to-red-500",
    bgColor: "bg-gradient-to-br from-orange-500/20 to-red-500/20",
    products: ["🛍️", "📦", "🎁"],
  },
  {
    id: "restaurants",
    title: "Restaurants",
    subtitle: "Vos plats préférés",
    icon: Utensils,
    href: "/marketplace?category=restaurants",
    gradient: "from-amber-500 to-orange-500",
    bgColor: "bg-gradient-to-br from-amber-500/20 to-orange-500/20",
    products: ["🍔", "🍕", "🍜"],
  },
  {
    id: "pharmacie",
    title: "Pharmacie",
    subtitle: "Santé & bien-être",
    icon: Pill,
    href: "/marketplace?category=pharmacy",
    gradient: "from-emerald-500 to-teal-500",
    bgColor: "bg-gradient-to-br from-emerald-500/20 to-teal-500/20",
    products: ["💊", "🩹", "💉"],
  },
  {
    id: "mode",
    title: "Mode",
    subtitle: "Tendances & styles",
    icon: Shirt,
    href: "/marketplace?category=fashion",
    gradient: "from-pink-500 to-rose-500",
    bgColor: "bg-gradient-to-br from-pink-500/20 to-rose-500/20",
    products: ["👕", "👗", "👟"],
  },
  {
    id: "supermarche",
    title: "Supermarché",
    subtitle: "Tout le quotidien",
    icon: ShoppingCart,
    href: "/marketplace?category=supermarket",
    gradient: "from-blue-500 to-cyan-500",
    bgColor: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20",
    products: ["🥬", "🥛", "🧃"],
  },
  {
    id: "ai-assistant",
    title: "AI Assistant",
    subtitle: "Votre assistant intelligent",
    icon: Bot,
    href: "/ai",
    gradient: "from-quickgo-blue to-quickgo-cyan",
    bgColor: "bg-gradient-to-br from-quickgo-blue/20 to-quickgo-cyan/20",
    isAI: true,
  },
]

export function CategoriesSection() {
  return (
    <section className="py-16 lg:py-24 bg-background relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-quickgo-blue/5 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Categories Grid - Matching mockup design */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-5">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={category.href}>
                <div className={`group relative h-[160px] lg:h-[180px] rounded-2xl overflow-hidden cursor-pointer ${category.bgColor} border border-border/30 hover:border-quickgo-blue/50 transition-all duration-300`}>
                  {/* Gradient Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-10 group-hover:opacity-20 transition-opacity`} />
                  
                  {/* Products Preview (for non-AI categories) */}
                  {!category.isAI && category.products && (
                    <div className="absolute top-4 right-4 flex flex-col gap-1">
                      {category.products.map((emoji, i) => (
                        <span key={i} className="text-2xl opacity-60 group-hover:opacity-100 transition-opacity" style={{ transitionDelay: `${i * 50}ms` }}>
                          {emoji}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* AI Sparkle Effect */}
                  {category.isAI && (
                    <div className="absolute top-4 right-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-8 h-8 text-quickgo-cyan opacity-60" />
                      </motion.div>
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="absolute inset-0 p-4 flex flex-col justify-end">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center mb-3 shadow-lg`}>
                      <category.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-0.5">
                      {category.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {category.subtitle}
                    </p>
                    
                    {category.isAI && (
                      <div className="mt-3">
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-quickgo-blue/20 border border-quickgo-blue/30 text-xs font-medium text-quickgo-blue">
                          Demander à l&apos;AI
                          <ArrowRight className="h-3 w-3" />
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Hover Arrow */}
                  <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-5 h-5 text-white" />
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
