"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  QrCode,
  Shield,
  Zap,
  TrendingUp,
  Gift,
  Smartphone,
  ArrowRight,
  CheckCircle2,
} from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Paiements instantanés",
    description: "Payez en un instant sur QuickGo et chez nos partenaires",
  },
  {
    icon: Shield,
    title: "100% Sécurisé",
    description: "Vos transactions sont protégées par cryptage avancé",
  },
  {
    icon: Gift,
    title: "Cashback & Récompenses",
    description: "Gagnez jusqu'à 5% de cashback sur vos achats",
  },
  {
    icon: Send,
    title: "Transferts gratuits",
    description: "Envoyez de l'argent gratuitement à vos proches",
  },
]

const paymentMethods = [
  { name: "Orange Money", color: "bg-orange-500" },
  { name: "MTN Mobile Money", color: "bg-yellow-500" },
  { name: "Carte bancaire", color: "bg-blue-500" },
  { name: "Visa", color: "bg-indigo-500" },
  { name: "Mastercard", color: "bg-red-500" },
]

const transactions = [
  { type: "received", name: "Commande #QG12345", amount: "+12 500 CFA", time: "Il y a 2 min" },
  { type: "sent", name: "Orange Money", amount: "-50 000 CFA", time: "Il y a 1h" },
  { type: "cashback", name: "Cashback reçu", amount: "+500 CFA", time: "Il y a 3h" },
]

export default function WalletPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-24 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 via-background to-primary/10" />
            <div className="absolute inset-0 bg-grid opacity-30" />
          </div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-6">
                  <Wallet className="h-4 w-4 text-secondary" />
                  <span className="text-sm font-medium text-secondary">
                    QUICKGO PAY
                  </span>
                </div>
                
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground mb-6">
                  Votre portefeuille{" "}
                  <span className="text-gradient-lime">intelligent</span>
                </h1>
                
                <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                  Payez, recevez et gérez votre argent en toute simplicité.
                  Profitez du cashback et des récompenses exclusives.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-14 px-8">
                    Activer QuickGo Pay
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" className="h-14 px-8">
                    En savoir plus
                  </Button>
                </div>
                
                {/* Payment Methods */}
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Ajoutez vos moyens de paiement
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.name}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border/50"
                      >
                        <div className={`w-3 h-3 rounded-full ${method.color}`} />
                        <span className="text-sm font-medium text-foreground">
                          {method.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
              
              {/* Right - Wallet Card Preview */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative"
              >
                <div className="relative max-w-md mx-auto">
                  {/* Wallet Card */}
                  <div className="relative p-6 rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent overflow-hidden">
                    {/* Pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary rounded-full blur-2xl" />
                    </div>
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-6 w-6 text-white" />
                          <span className="font-bold text-white">QuickGo Wallet</span>
                        </div>
                        <span className="text-xs text-white/70">Premium</span>
                      </div>
                      
                      <div className="mb-8">
                        <p className="text-sm text-white/70 mb-1">Solde actuel</p>
                        <p className="text-4xl font-bold text-white">125 500 CFA</p>
                      </div>
                      
                      {/* Quick Actions */}
                      <div className="grid grid-cols-4 gap-4">
                        {[
                          { icon: ArrowUpRight, label: "Ajouter" },
                          { icon: Send, label: "Envoyer" },
                          { icon: ArrowDownLeft, label: "Retirer" },
                          { icon: QrCode, label: "Scanner" },
                        ].map((action) => (
                          <button
                            key={action.label}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                          >
                            <action.icon className="h-5 w-5 text-white" />
                            <span className="text-xs text-white">{action.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Transaction History Preview */}
                  <div className="mt-6 p-4 rounded-2xl bg-card border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground">Historique</h3>
                      <span className="text-xs text-primary">Voir tout</span>
                    </div>
                    
                    <div className="space-y-3">
                      {transactions.map((tx, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-xl bg-muted/30"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              tx.type === "received" ? "bg-secondary/20" :
                              tx.type === "cashback" ? "bg-primary/20" : "bg-muted"
                            }`}>
                              {tx.type === "received" ? (
                                <ArrowDownLeft className="h-4 w-4 text-secondary" />
                              ) : tx.type === "cashback" ? (
                                <Gift className="h-4 w-4 text-primary" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{tx.name}</p>
                              <p className="text-xs text-muted-foreground">{tx.time}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-semibold ${
                            tx.amount.startsWith("+") ? "text-secondary" : "text-foreground"
                          }`}>
                            {tx.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 lg:py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Pourquoi choisir QuickGo Pay ?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Une solution de paiement complète conçue pour simplifier votre quotidien
              </p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-border/50"
                >
                  <div className="p-3 rounded-xl bg-secondary/10 w-fit mb-4">
                    <feature.icon className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24 bg-gradient-to-r from-secondary/20 via-primary/20 to-accent/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Activez votre portefeuille maintenant
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Rejoignez des milliers d&apos;utilisateurs qui font confiance à QuickGo Pay
              </p>
              <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 h-14 px-8">
                Commencer gratuitement
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
