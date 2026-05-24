"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { 
  Code2, 
  Webhook, 
  Key, 
  FileJson, 
  Terminal, 
  Zap,
  Shield,
  Globe,
  ArrowRight,
  Copy,
  CheckCircle2,
  Book,
  MessageSquare,
  Github
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer/footer"
import { useState } from "react"

const features = [
  {
    icon: Webhook,
    title: "API RESTful",
    description: "API complete et bien documentee pour integrer QuickGo a vos applications."
  },
  {
    icon: Zap,
    title: "Webhooks temps reel",
    description: "Recevez des notifications instantanees sur les evenements de livraison."
  },
  {
    icon: Shield,
    title: "Securise",
    description: "Authentification OAuth 2.0 et chiffrement de bout en bout."
  },
  {
    icon: Globe,
    title: "SDKs multiplateformes",
    description: "SDKs disponibles pour JavaScript, Python, PHP, et plus encore."
  }
]

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/deliveries",
    description: "Liste toutes les livraisons"
  },
  {
    method: "POST",
    path: "/api/v1/deliveries",
    description: "Creer une nouvelle livraison"
  },
  {
    method: "GET",
    path: "/api/v1/deliveries/:id",
    description: "Details d'une livraison"
  },
  {
    method: "GET",
    path: "/api/v1/tracking/:id",
    description: "Suivi en temps reel"
  },
  {
    method: "POST",
    path: "/api/v1/quotes",
    description: "Obtenir un devis"
  },
  {
    method: "GET",
    path: "/api/v1/drivers/nearby",
    description: "Livreurs a proximite"
  }
]

const codeExample = `// Installation
npm install @quickgo/sdk

// Initialisation
import { QuickGo } from '@quickgo/sdk';

const quickgo = new QuickGo({
  apiKey: 'votre_cle_api',
  environment: 'production'
});

// Créer une livraison
const delivery = await quickgo.deliveries.create({
  pickup: {
    address: "Bastos, Yaoundé",
    contact: "+237 6XX XXX XXX"
  },
  dropoff: {
    address: "Bonapriso, Douala",
    contact: "+237 6XX XXX XXX"
  },
  package: {
    type: "document",
    weight: 0.5
  }
});

console.log(delivery.tracking_id);`

const useCases = [
  {
    title: "E-commerce",
    description: "Integrez la livraison express directement dans votre boutique en ligne.",
    icon: "🛒"
  },
  {
    title: "Restaurants",
    description: "Connectez votre systeme de commande a notre flotte de livreurs.",
    icon: "🍕"
  },
  {
    title: "Pharmacies",
    description: "Livraison urgente de medicaments avec suivi en temps reel.",
    icon: "💊"
  },
  {
    title: "Entreprises",
    description: "Automatisez vos envois de documents et colis inter-bureaux.",
    icon: "🏢"
  }
]

export default function DevelopersPage() {
  const [copied, setCopied] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(codeExample)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-20">
        {/* Hero */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-quickgo-blue/20 via-transparent to-purple-500/10" />
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-quickgo-blue/20 rounded-full blur-3xl" />
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-quickgo-blue/20 text-quickgo-blue text-sm font-medium mb-6"
                >
                  <Code2 className="w-4 h-4" />
                  API & Integrations
                </motion.div>
                
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-4xl md:text-5xl font-bold text-foreground mb-6"
                >
                  Construisez avec{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-quickgo-blue to-quickgo-lime">
                    l&apos;API QuickGo
                  </span>
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-lg text-muted-foreground mb-8"
                >
                  Integrez la puissance de QuickGo dans vos applications. API RESTful, webhooks temps reel, et SDKs pour toutes les plateformes.
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-4"
                >
                  <Link href="/auth/register?type=developer">
                    <Button size="lg" className="bg-quickgo-lime text-black hover:bg-quickgo-lime/90 font-semibold h-12 px-6 rounded-xl">
                      Obtenir une cle API
                      <Key className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Button size="lg" variant="outline" className="h-12 px-6 rounded-xl">
                    <Book className="w-4 h-4 mr-2" />
                    Documentation
                  </Button>
                </motion.div>
              </div>
              
              {/* Code Preview */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="relative"
              >
                <div className="rounded-2xl bg-[#1a1a2e] border border-white/10 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-sm text-muted-foreground">quickstart.js</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyCode}
                      className="text-muted-foreground hover:text-white"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                  <pre className="p-4 text-sm overflow-x-auto">
                    <code className="text-gray-300">{codeExample}</code>
                  </pre>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-card/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-border hover:border-quickgo-blue/50 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-quickgo-blue/20 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-quickgo-blue" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Endpoints */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Endpoints populaires
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Decouvrez les principales fonctionnalites de notre API
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-4">
              {endpoints.map((endpoint, index) => (
                <motion.div
                  key={endpoint.path}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-quickgo-blue/50 transition-all"
                >
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    endpoint.method === "GET" 
                      ? "bg-green-500/20 text-green-400" 
                      : "bg-blue-500/20 text-blue-400"
                  }`}>
                    {endpoint.method}
                  </span>
                  <code className="flex-1 text-sm font-mono text-foreground">{endpoint.path}</code>
                  <span className="text-sm text-muted-foreground hidden sm:block">{endpoint.description}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-20 bg-card/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Cas d&apos;utilisation
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Decouvrez comment les entreprises utilisent notre API
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {useCases.map((useCase, index) => (
                <motion.div
                  key={useCase.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-border text-center"
                >
                  <div className="text-4xl mb-4">{useCase.icon}</div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{useCase.title}</h3>
                  <p className="text-sm text-muted-foreground">{useCase.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-12 rounded-3xl bg-gradient-to-br from-quickgo-blue/20 to-purple-500/20 border border-quickgo-blue/30 text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Pret a integrer QuickGo ?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Obtenez votre cle API gratuitement et commencez a construire des lors aujourd&apos;hui.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="/auth/register?type=developer">
                  <Button size="lg" className="bg-quickgo-lime text-black hover:bg-quickgo-lime/90 font-semibold h-12 px-6 rounded-xl">
                    Commencer gratuitement
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="h-12 px-6 rounded-xl">
                  <Github className="w-4 h-4 mr-2" />
                  Voir sur GitHub
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}
