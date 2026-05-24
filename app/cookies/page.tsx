"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Cookie, Shield, BarChart3, Target, Settings, Info } from "lucide-react"

const cookieTypes = [
  {
    id: "essential",
    icon: Shield,
    title: "Cookies Essentiels",
    description: "Ces cookies sont necessaires au fonctionnement de base du site. Ils permettent la navigation, la securite et l'acces aux zones protegees.",
    required: true,
    examples: ["Session utilisateur", "Panier d'achat", "Securite", "Preferences de langue"]
  },
  {
    id: "analytics",
    icon: BarChart3,
    title: "Cookies Analytiques",
    description: "Ces cookies nous aident a comprendre comment vous utilisez notre site, quelles pages sont les plus visitees et a ameliorer votre experience.",
    required: false,
    examples: ["Google Analytics", "Statistiques de pages", "Comportement utilisateur", "Performance"]
  },
  {
    id: "functional",
    icon: Settings,
    title: "Cookies Fonctionnels",
    description: "Ces cookies permettent des fonctionnalites ameliorees et une personnalisation, comme les recommandations de produits et les preferences memorisees.",
    required: false,
    examples: ["Recommandations", "Historique de recherche", "Preferences d'affichage", "Chat support"]
  },
  {
    id: "marketing",
    icon: Target,
    title: "Cookies Marketing",
    description: "Ces cookies sont utilises pour vous montrer des publicites pertinentes sur d'autres sites et mesurer l'efficacite de nos campagnes.",
    required: false,
    examples: ["Publicites ciblees", "Retargeting", "Reseaux sociaux", "Attribution"]
  },
]

export default function CookiesPage() {
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    functional: true,
    marketing: false,
  })

  const handleToggle = (id: string) => {
    if (id === "essential") return // Cannot disable essential cookies
    setPreferences(prev => ({
      ...prev,
      [id]: !prev[id as keyof typeof prev]
    }))
  }

  const handleSaveAll = () => {
    setPreferences({
      essential: true,
      analytics: true,
      functional: true,
      marketing: true,
    })
  }

  const handleSaveEssential = () => {
    setPreferences({
      essential: true,
      analytics: false,
      functional: false,
      marketing: false,
    })
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 lg:pt-24">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-24 overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-accent/10" />
            <div className="absolute inset-0 bg-grid opacity-30" />
          </div>
          
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                <Cookie className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">Gerez vos preferences</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
                Politique des Cookies
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                Nous utilisons des cookies pour ameliorer votre experience sur QuickGo. 
                Vous pouvez personnaliser vos preferences ci-dessous.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Cookie Preferences */}
        <section className="py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-wrap gap-4 justify-center mb-12"
            >
              <Button onClick={handleSaveAll} className="rounded-full">
                Accepter tous les cookies
              </Button>
              <Button onClick={handleSaveEssential} variant="outline" className="rounded-full">
                Essentiels uniquement
              </Button>
            </motion.div>

            {/* Cookie Types */}
            <div className="space-y-6">
              {cookieTypes.map((type, index) => (
                <motion.div
                  key={type.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 rounded-2xl bg-card border border-border/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                        <type.icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-bold text-foreground">{type.title}</h3>
                          {type.required && (
                            <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                              Requis
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">
                          {type.description}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {type.examples.map((example) => (
                            <span
                              key={example}
                              className="px-2 py-1 text-xs bg-muted rounded-lg text-muted-foreground"
                            >
                              {example}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={preferences[type.id as keyof typeof preferences]}
                      onCheckedChange={() => handleToggle(type.id)}
                      disabled={type.required}
                    />
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-8 flex justify-center"
            >
              <Button size="lg" className="rounded-full px-8">
                Enregistrer mes preferences
              </Button>
            </motion.div>

            {/* Info Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-16 p-6 rounded-2xl bg-muted/30 border border-border/50"
            >
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-primary shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-foreground mb-2">Qu&apos;est-ce qu&apos;un cookie ?</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Un cookie est un petit fichier texte stocke sur votre appareil lorsque vous visitez un site web. 
                    Il permet au site de se souvenir de vos actions et preferences (comme la connexion, la langue, 
                    la taille de police et d&apos;autres preferences d&apos;affichage) pendant une periode determinee, 
                    afin que vous n&apos;ayez pas a les saisir a nouveau chaque fois que vous consultez le site ou naviguez 
                    d&apos;une page a l&apos;autre.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
      
      <Footer />
    </main>
  )
}
