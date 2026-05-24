"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { 
  Newspaper,
  Download,
  Mail,
  Calendar,
  ArrowRight,
  FileText,
  Image as ImageIcon
} from "lucide-react"

const pressReleases = [
  {
    title: "QuickGo annonce une levee de fonds de 5 millions USD",
    date: "15 Mai 2024",
    excerpt: "Cette nouvelle levee de fonds permettra a QuickGo d'accelerer son expansion dans 10 nouvelles villes africaines."
  },
  {
    title: "Lancement de QuickGo Pay, le portefeuille electronique",
    date: "1 Mars 2024",
    excerpt: "QuickGo lance son propre service de paiement mobile pour simplifier les transactions."
  },
  {
    title: "QuickGo depasse les 500 000 utilisateurs",
    date: "15 Janvier 2024",
    excerpt: "Un cap symbolique qui confirme la position de leader de QuickGo sur le marche camerounais."
  },
  {
    title: "Partenariat strategique avec MTN Cameroun",
    date: "1 Decembre 2023",
    excerpt: "QuickGo et MTN s'associent pour proposer des solutions de paiement innovantes."
  },
]

const mediaKit = [
  { name: "Logo QuickGo (PNG)", size: "2.5 MB", type: "Image" },
  { name: "Logo QuickGo (SVG)", size: "45 KB", type: "Image" },
  { name: "Photos equipe dirigeante", size: "15 MB", type: "Archive" },
  { name: "Captures d'ecran application", size: "8 MB", type: "Archive" },
  { name: "Dossier de presse 2024", size: "5 MB", type: "PDF" },
  { name: "Charte graphique", size: "12 MB", type: "PDF" },
]

export default function PressPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-24 lg:pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              Espace Presse
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Actualites et Ressources Media
            </h1>
            <p className="text-lg text-muted-foreground">
              Retrouvez nos communiques de presse, nos ressources media 
              et contactez notre equipe de relations publiques.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Press Releases */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-2"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Newspaper className="h-6 w-6 text-primary" />
                Communiques de Presse
              </h2>
              <div className="space-y-4">
                {pressReleases.map((release, index) => (
                  <div
                    key={index}
                    className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                          <Calendar className="h-4 w-4" />
                          {release.date}
                        </p>
                        <h3 className="text-lg font-bold text-foreground mb-2">{release.title}</h3>
                        <p className="text-sm text-muted-foreground">{release.excerpt}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="mt-6 gap-2">
                Voir tous les communiques
                <ArrowRight className="h-4 w-4" />
              </Button>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-8"
            >
              {/* Media Kit */}
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Kit Media
                </h2>
                <div className="space-y-3">
                  {mediaKit.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.size}</p>
                        </div>
                      </div>
                      <Download className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4 gap-2">
                  <Download className="h-4 w-4" />
                  Telecharger tout
                </Button>
              </div>

              {/* Contact */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 border border-primary/30">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Contact Presse
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Pour toute demande d&apos;interview, partenariat media ou information complementaire.
                </p>
                <div className="space-y-3 mb-6">
                  <p className="text-sm text-foreground font-medium">Celine Mbarga</p>
                  <p className="text-sm text-muted-foreground">Directrice Communication</p>
                  <a href="mailto:presse@quickgo.cm" className="text-sm text-primary flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    presse@quickgo.cm
                  </a>
                </div>
                <Button variant="outline" className="w-full gap-2">
                  <Mail className="h-4 w-4" />
                  Contacter
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
