"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { 
  Camera, 
  Palette, 
  TrendingUp, 
  Users, 
  Star, 
  CheckCircle, 
  ArrowRight,
  MessageCircle,
  Sparkles,
  BarChart3,
  Megaphone,
  PenTool,
  Video,
  Globe
} from "lucide-react"

const services = [
  {
    id: "photo",
    icon: Camera,
    title: "Photographie Professionnelle",
    description: "Photos haute qualite de vos produits et commerce pour une presentation optimale sur QuickGo.",
    features: [
      "Seance photo en boutique",
      "Retouche professionnelle",
      "Photos produits detourees",
      "Ambiance et mise en scene"
    ],
    price: "A partir de 50 000 FCFA",
    popular: true
  },
  {
    id: "branding",
    icon: Palette,
    title: "Identite Visuelle",
    description: "Creation de logo, charte graphique et elements visuels pour votre marque.",
    features: [
      "Creation de logo",
      "Charte graphique complete",
      "Templates reseaux sociaux",
      "Kit marketing digital"
    ],
    price: "A partir de 100 000 FCFA",
    popular: false
  },
  {
    id: "social",
    icon: Megaphone,
    title: "Gestion Reseaux Sociaux",
    description: "Publication reguliere, interaction avec votre communaute et croissance de votre audience.",
    features: [
      "Calendrier editorial",
      "Creation de contenu",
      "Community management",
      "Rapports mensuels"
    ],
    price: "A partir de 75 000 FCFA/mois",
    popular: true
  },
  {
    id: "video",
    icon: Video,
    title: "Production Video",
    description: "Videos promotionnelles, tutoriels et contenus engageants pour vos produits.",
    features: [
      "Video promotionnelle",
      "Montage professionnel",
      "Animation et effets",
      "Format reseaux sociaux"
    ],
    price: "A partir de 150 000 FCFA",
    popular: false
  },
  {
    id: "marketing",
    icon: TrendingUp,
    title: "Marketing Digital",
    description: "Strategies de croissance, publicite en ligne et optimisation de vos ventes.",
    features: [
      "Strategie marketing",
      "Campagnes publicitaires",
      "SEO et visibilite",
      "Analyse des performances"
    ],
    price: "A partir de 100 000 FCFA/mois",
    popular: false
  },
  {
    id: "consulting",
    icon: Users,
    title: "Accompagnement Client",
    description: "Formation et conseils pour ameliorer votre experience client et fidelisation.",
    features: [
      "Audit experience client",
      "Formation equipe",
      "Processus optimises",
      "Suivi personnalise"
    ],
    price: "Sur devis",
    popular: false
  }
]

const testimonials = [
  {
    name: "Marie Kouam",
    business: "Boutique Mode Elegance",
    text: "Grace a DL Solutions, mes ventes ont augmente de 200% en 3 mois!",
    rating: 5
  },
  {
    name: "Jean-Paul Mbarga",
    business: "Restaurant Le Gourmet",
    text: "Les photos professionnelles ont transforme mon profil QuickGo.",
    rating: 5
  },
  {
    name: "Aminata Diallo",
    business: "Cosmetiques Naturels",
    text: "Un accompagnement de qualite, je recommande vivement!",
    rating: 5
  }
]

export default function DLServicesPage() {
  const [selectedService, setSelectedService] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-lime-500/10 via-background to-blue-500/10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-lime-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-lime-500/10 border border-lime-500/30 mb-6">
              <Sparkles className="w-4 h-4 text-lime-400" />
              <span className="text-lime-400 text-sm font-medium">Services Premium</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-foreground">Boostez votre </span>
              <span className="bg-gradient-to-r from-lime-400 to-green-500 bg-clip-text text-transparent">
                visibilite
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              DL Solutions SARL accompagne les partenaires QuickGo avec des services de 
              communication digitale et creation de contenu professionnels.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2 bg-lime-500 hover:bg-lime-600 text-black">
                <MessageCircle className="w-5 h-5" />
                Demander un devis
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                <Globe className="w-5 h-5" />
                Voir nos realisations
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Nos Services</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Des solutions adaptees a chaque besoin pour developper votre presence sur QuickGo
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-6 rounded-2xl border transition-all cursor-pointer ${
                  selectedService === service.id
                    ? "bg-lime-500/10 border-lime-500/50"
                    : "bg-card border-border hover:border-lime-500/30"
                }`}
                onClick={() => setSelectedService(service.id === selectedService ? null : service.id)}
              >
                {service.popular && (
                  <div className="absolute -top-3 right-4 px-3 py-1 rounded-full bg-lime-500 text-black text-xs font-bold">
                    Populaire
                  </div>
                )}

                <div className="w-12 h-12 rounded-xl bg-lime-500/10 flex items-center justify-center mb-4">
                  <service.icon className="w-6 h-6 text-lime-400" />
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{service.description}</p>

                <ul className="space-y-2 mb-4">
                  {service.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle className="w-4 h-4 text-lime-400" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-lime-400 font-bold">{service.price}</span>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "500+", label: "Clients accompagnes" },
              { value: "95%", label: "Satisfaction client" },
              { value: "3x", label: "Croissance moyenne" },
              { value: "24/7", label: "Support disponible" },
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-lime-400 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Ils nous font confiance</h2>
            <p className="text-muted-foreground">Decouvrez les temoignages de nos clients satisfaits</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-foreground mb-4">&ldquo;{testimonial.text}&rdquo;</p>
                <div>
                  <p className="font-bold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.business}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-lime-500/20 to-green-500/20 border border-lime-500/30 text-center overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
            
            <div className="relative">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Pret a booster votre business?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Contactez-nous pour une consultation gratuite et decouvrez comment 
                nous pouvons vous aider a atteindre vos objectifs.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a 
                  href="https://wa.me/237690773615?text=Bonjour DL Solutions! Je suis interesse par vos services d'accompagnement pour mon commerce sur QuickGo."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" className="gap-2 bg-green-500 hover:bg-green-600 text-white w-full sm:w-auto">
                    <MessageCircle className="w-5 h-5" />
                    WhatsApp: +237 690 773 615
                  </Button>
                </a>
                <Link href="/vendors/register">
                  <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto">
                    Devenir partenaire QuickGo
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
