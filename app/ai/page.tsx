"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Bot,
  MessageSquare,
  Sparkles,
  Search,
  ShoppingCart,
  MapPin,
  HelpCircle,
  Zap,
  ArrowRight,
  Send,
  Mic,
} from "lucide-react"

const suggestions = [
  { icon: Search, text: "Trouver un produit", color: "primary" },
  { icon: MapPin, text: "Suivre ma commande", color: "secondary" },
  { icon: ShoppingCart, text: "Meilleures offres", color: "accent" },
  { icon: HelpCircle, text: "Aide & support", color: "primary" },
]

const chatMessages = [
  {
    role: "assistant",
    content: "Bonjour ! Comment puis-je vous aider aujourd'hui ?",
    time: "14:32",
  },
  {
    role: "user",
    content: "Je cherche un téléphone à moins de 100 000 CFA",
    time: "14:33",
  },
  {
    role: "assistant",
    content: "Voici quelques téléphones disponibles à ce prix :",
    time: "14:33",
    products: [
      { name: "Infinix Hot 40i", price: "68 000 CFA", image: "/products/infinix.jpg" },
      { name: "Samsung A14", price: "85 000 CFA", image: "/products/samsung.jpg" },
      { name: "Tecno Spark 20", price: "72 000 CFA", image: "/products/tecno.jpg" },
    ],
  },
]

const capabilities = [
  {
    icon: Search,
    title: "Recherche intelligente",
    description: "Trouvez exactement ce que vous cherchez en langage naturel",
  },
  {
    icon: MapPin,
    title: "Suivi de commande",
    description: "Obtenez des mises à jour en temps réel sur vos livraisons",
  },
  {
    icon: Sparkles,
    title: "Recommandations",
    description: "Recevez des suggestions personnalisées basées sur vos préférences",
  },
  {
    icon: HelpCircle,
    title: "Support 24/7",
    description: "Obtenez de l'aide instantanée à tout moment",
  },
]

export default function AIPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-24 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
            <div className="absolute inset-0 bg-grid opacity-30" />
            
            {/* Glow Effects */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: "2s" }} />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    QUICKGO AI
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold">
                    Nouveau
                  </span>
                </div>
                
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-6">
                  Votre assistant{" "}
                  <span className="text-gradient-blue">intelligent</span>
                </h1>
                
                <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                  Posez vos questions, trouvez des produits, suivez vos commandes.
                  QuickGo AI est là pour vous aider 24h/24.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 glow-blue">
                    Démarrer une conversation
                    <MessageSquare className="ml-2 h-5 w-5" />
                  </Button>
                </div>
                
                {/* Quick Suggestions */}
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Suggestions rapides
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        key={suggestion.text}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border/50 hover:border-primary/30 transition-colors"
                      >
                        <suggestion.icon className="h-4 w-4 text-primary" />
                        <span className="text-sm text-foreground">{suggestion.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
              
              {/* Right - Chat Preview */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="relative max-w-md mx-auto">
                  {/* Chat Window */}
                  <div className="rounded-3xl bg-card border border-border/50 overflow-hidden shadow-2xl shadow-primary/10">
                    {/* Header */}
                    <div className="p-4 border-b border-border/50 bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                            <Bot className="h-5 w-5 text-white" />
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-secondary rounded-full border-2 border-card" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">QuickGo AI</p>
                          <p className="text-xs text-muted-foreground">Assistant intelligent</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Messages */}
                    <div className="p-4 space-y-4 h-[400px] overflow-y-auto">
                      {chatMessages.map((message, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.2 }}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[80%] ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md"
                              : "bg-muted rounded-2xl rounded-bl-md"
                          } p-3`}>
                            <p className="text-sm">{message.content}</p>
                            
                            {message.products && (
                              <div className="mt-3 space-y-2">
                                {message.products.map((product, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center gap-3 p-2 rounded-xl bg-background/50"
                                  >
                                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                                      <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-foreground">{product.name}</p>
                                      <p className="text-xs text-secondary font-semibold">{product.price}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            <p className={`text-[10px] mt-1 ${
                              message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}>
                              {message.time}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    
                    {/* Input */}
                    <div className="p-4 border-t border-border/50 bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            placeholder="Demander à l'AI..."
                            className="w-full h-12 pl-4 pr-12 rounded-xl bg-background border border-border/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-muted transition-colors">
                            <Mic className="h-5 w-5 text-muted-foreground" />
                          </button>
                        </div>
                        <button className="p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                          <Send className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Que peut faire QuickGo AI ?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Un assistant puissant pour simplifier votre expérience shopping
              </p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {capabilities.map((capability, index) => (
                <motion.div
                  key={capability.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="p-3 rounded-xl bg-primary/10 w-fit mb-4">
                    <capability.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {capability.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {capability.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24 bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Prêt à essayer QuickGo AI ?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Commencez une conversation et découvrez la puissance de l&apos;IA
              </p>
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8">
                Démarrer maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </section>
      </div>
      
      <Footer />
    </main>
  )
}
