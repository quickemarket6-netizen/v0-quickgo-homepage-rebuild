"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  QrCode,
  Gift,
  ArrowRight,
} from "lucide-react"

const features = [
  {
    image: "/images/premium/paiement-instantane.jpg",
    title: "Paiements instantanes",
    description: "Payez en un instant sur QuickGo et chez nos partenaires",
    href: "/marketplace/checkout",
  },
  {
    image: "/images/premium/securise.jpg",
    title: "100% Securise",
    description: "Vos transactions sont protegees par cryptage avance",
    href: "/wallet/security",
  },
  {
    image: "/images/premium/cashback-recompenses.jpg",
    title: "Cashback & Recompenses",
    description: "Gagnez jusqu a 5% de cashback sur vos achats",
    href: "/wallet/rewards",
  },
  {
    image: "/images/premium/transfert-intelligent.jpg",
    title: "Transferts gratuits",
    description: "Envoyez de l argent gratuitement a vos proches",
    href: "/wallet/transfer",
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
  { type: "cashback", name: "Cashback recu", amount: "+500 CFA", time: "Il y a 3h" },
]

const quickActions = [
  { icon: ArrowUpRight, label: "Ajouter" },
  { icon: Send, label: "Envoyer" },
  { icon: ArrowDownLeft, label: "Retirer" },
  { icon: QrCode, label: "Scanner" },
]

export default function WalletPage() {
  return (
    <main className="min-h-screen bg-black">
      <Navbar />

      <div className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-24 overflow-hidden">
          {/* Background glow orbs — hero-section pattern */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute w-[500px] h-[500px] rounded-full bg-lime-500/20 blur-[120px] -left-[150px] top-[50px]"
            />
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
              className="absolute w-[400px] h-[400px] rounded-full bg-blue-500/20 blur-[100px] right-[0px] bottom-[0px]"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.25, 0.1] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 3 }}
              className="absolute w-[300px] h-[300px] rounded-full bg-cyan-500/15 blur-[80px] right-[30%] top-[10%]"
            />
          </div>

          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-lime-500/5 via-black to-lime-500/5" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content — staggered entrance */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 18 }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 120 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-500/10 border border-lime-500/30 mb-6"
                >
                  {/* Ping live dot */}
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500" />
                  </span>
                  <Wallet className="h-4 w-4 text-lime-500" />
                  <span className="text-sm font-medium text-lime-500">QUICKGO PAY</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 120 }}
                  className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6"
                >
                  Votre portefeuille{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-cyan-400">
                    intelligent
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, type: "spring", stiffness: 120 }}
                  className="text-lg text-zinc-400 mb-8 max-w-lg"
                >
                  Payez, recevez et gerez votre argent en toute simplicite.
                  Profitez du cashback et des recompenses exclusives.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, type: "spring", stiffness: 120 }}
                  className="flex flex-col sm:flex-row gap-4 mb-8"
                >
                  <motion.div whileHover={{ scale: 1.03, y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Button size="lg" className="bg-lime-500 text-black hover:bg-lime-400 h-14 px-8 font-bold w-full">
                      Activer QuickGo Pay
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.03, y: -2 }} transition={{ type: "spring", stiffness: 300 }}>
                    <Button size="lg" variant="outline" className="h-14 px-8 border-lime-500/30 text-lime-500 hover:bg-lime-500/10 w-full">
                      En savoir plus
                    </Button>
                  </motion.div>
                </motion.div>

                {/* Payment Methods — staggered entrance */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, type: "spring", stiffness: 120 }}
                >
                  <p className="text-sm text-zinc-500 mb-3">Ajoutez vos moyens de paiement</p>
                  <div className="flex flex-wrap gap-2">
                    {paymentMethods.map((method, i) => (
                      <motion.div
                        key={method.name}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.07, type: "spring", stiffness: 200, damping: 14 }}
                        whileHover={{ y: -2, scale: 1.04 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900 border border-lime-500/20"
                      >
                        <div className={`w-3 h-3 rounded-full ${method.color}`} />
                        <span className="text-sm font-medium text-white">{method.name}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>

              {/* Right - Wallet Card Preview */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.2 }}
                className="relative"
              >
                <div className="relative max-w-md mx-auto">
                  {/* Wallet Card — bob + glow orbs inside */}
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    whileHover={{ y: -3, scale: 1.02 }}
                    className="relative p-6 rounded-3xl bg-gradient-to-br from-lime-500 via-lime-600 to-lime-700 overflow-hidden border border-lime-400/30"
                  >
                    {/* Animated glow orb — blue */}
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-blue-400/40 blur-3xl pointer-events-none"
                    />
                    {/* Animated glow orb — cyan */}
                    <motion.div
                      animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.5, 0.2] }}
                      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      className="absolute -bottom-5 -left-5 w-36 h-36 rounded-full bg-cyan-400/30 blur-2xl pointer-events-none"
                    />

                    {/* Pattern */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-lime-300 rounded-full blur-2xl" />
                    </div>

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-6 w-6 text-black" />
                          <span className="font-bold text-black">QuickGo Wallet</span>
                        </div>
                        <span className="text-xs text-black/70 px-2 py-1 bg-black/10 rounded-full">Premium</span>
                      </div>

                      <div className="mb-8">
                        <p className="text-sm text-black/70 mb-1">Solde actuel</p>
                        {/* Balance number spring entrance */}
                        <motion.p
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.5 }}
                          className="text-4xl font-bold text-black"
                        >
                          125 500 CFA
                        </motion.p>
                      </div>

                      {/* Quick Actions — staggered entrance + enhanced hover */}
                      <div className="grid grid-cols-4 gap-4">
                        {quickActions.map((action, i) => (
                          <motion.button
                            key={action.label}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + i * 0.05, type: "spring", stiffness: 200 }}
                            whileHover={{ y: -4, scale: 1.05 }}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-black/10 hover:bg-black/20 transition-colors"
                          >
                            <action.icon className="h-5 w-5 text-black" />
                            <span className="text-xs text-black font-medium">{action.label}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Transaction History Preview */}
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55, type: "spring", stiffness: 100, damping: 18 }}
                    className="mt-6 p-4 rounded-2xl bg-zinc-900 border border-lime-500/20"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white">Historique</h3>
                      <span className="text-xs text-lime-500">Voir tout</span>
                    </div>

                    <div className="space-y-3">
                      {transactions.map((tx, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 + index * 0.04, type: "spring", stiffness: 150 }}
                          className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${
                              tx.type === "received" ? "bg-lime-500/20" :
                              tx.type === "cashback" ? "bg-lime-500/20" : "bg-zinc-700"
                            }`}>
                              {tx.type === "received" ? (
                                <ArrowDownLeft className="h-4 w-4 text-lime-500" />
                              ) : tx.type === "cashback" ? (
                                <Gift className="h-4 w-4 text-lime-500" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4 text-zinc-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{tx.name}</p>
                              <p className="text-xs text-zinc-500">{tx.time}</p>
                            </div>
                          </div>
                          <span className={`text-sm font-semibold ${
                            tx.amount.startsWith("+") ? "text-lime-500" : "text-white"
                          }`}>
                            {tx.amount}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Premium Features with Images */}
        <section className="py-16 lg:py-24 bg-zinc-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Pourquoi choisir{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-cyan-400">
                  QuickGo Pay
                </span>{" "}
                ?
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Une solution de paiement complete concue pour simplifier votre quotidien
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 100, damping: 18 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                >
                  <Link href={feature.href} className="block group">
                    <div className="relative h-72 lg:h-80 rounded-2xl overflow-hidden border border-lime-500/20 hover:border-lime-500/60 transition-all duration-500 hover:shadow-[0_0_40px_rgba(132,204,22,0.2)] hover:scale-[1.02]">
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-70 group-hover:opacity-50 transition-opacity duration-500" />

                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-lime-500 to-transparent" />
                      </div>

                      <div className="absolute bottom-0 left-0 right-0 p-5">
                        <h3 className="text-lg font-bold text-white mb-1 group-hover:text-lime-400 transition-colors duration-300">
                          {feature.title}
                        </h3>
                        <p className="text-sm text-zinc-400 group-hover:text-zinc-300 transition-colors duration-300 mb-3">
                          {feature.description}
                        </p>

                        <span className="inline-flex items-center gap-2 text-sm font-medium text-lime-500 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          Decouvrir
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>

                      <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-lime-500/30 to-transparent transform rotate-45 translate-x-12 -translate-y-12 group-hover:from-lime-500/50 transition-colors duration-500" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 lg:py-24 bg-gradient-to-r from-lime-500/10 via-black to-lime-500/10 border-t border-lime-500/20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                Activez votre portefeuille{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-cyan-400">
                  maintenant
                </span>
              </h2>
              <p className="text-lg text-zinc-400 mb-8">
                Rejoignez des milliers d&apos;utilisateurs qui font confiance a QuickGo Pay
              </p>
              <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                <Button size="lg" className="bg-lime-500 text-black hover:bg-lime-400 h-14 px-8 font-bold">
                  Commencer gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
