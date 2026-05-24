"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { 
  Calendar,
  ArrowRight,
  Clock,
  User,
  Tag
} from "lucide-react"

const posts = [
  {
    title: "QuickGo leve 5 millions USD pour accelerer son expansion",
    excerpt: "Notre derniere levee de fonds va nous permettre d'etendre nos services a 10 nouvelles villes africaines.",
    category: "Entreprise",
    author: "Marc Essomba",
    date: "15 Mai 2024",
    readTime: "5 min",
    image: "/blog/funding.jpg",
    slug: "quickgo-levee-fonds-5-millions"
  },
  {
    title: "Comment QuickGo Pay revolutionne les paiements au Cameroun",
    excerpt: "Decouvrez comment notre portefeuille electronique simplifie les transactions quotidiennes.",
    category: "Produit",
    author: "Sarah Ngo",
    date: "10 Mai 2024",
    readTime: "4 min",
    image: "/blog/quickgo-pay.jpg",
    slug: "quickgo-pay-paiements-cameroun"
  },
  {
    title: "Nos livreurs: les heros du quotidien",
    excerpt: "Rencontrez les hommes et femmes qui font de QuickGo une realite chaque jour.",
    category: "Communaute",
    author: "Paul Kamga",
    date: "5 Mai 2024",
    readTime: "6 min",
    image: "/blog/drivers.jpg",
    slug: "livreurs-heros-quotidien"
  },
  {
    title: "L'IA au service de la livraison: notre vision",
    excerpt: "Comment l'intelligence artificielle optimise nos operations et ameliore l'experience client.",
    category: "Technologie",
    author: "Paul Kamga",
    date: "28 Avr 2024",
    readTime: "7 min",
    image: "/blog/ai.jpg",
    slug: "ia-livraison-vision"
  },
  {
    title: "Partenariat avec les commercants locaux",
    excerpt: "Notre engagement pour soutenir l'economie locale et les entrepreneurs camerounais.",
    category: "Partenaires",
    author: "Celine Mbarga",
    date: "20 Avr 2024",
    readTime: "4 min",
    image: "/blog/partners.jpg",
    slug: "partenariat-commercants-locaux"
  },
  {
    title: "Lancement de QuickGo a Bafoussam",
    excerpt: "QuickGo est desormais disponible dans la capitale de l'Ouest. Decouvrez nos premieres impressions.",
    category: "Expansion",
    author: "Marc Essomba",
    date: "15 Avr 2024",
    readTime: "3 min",
    image: "/blog/bafoussam.jpg",
    slug: "lancement-quickgo-bafoussam"
  },
]

const categories = ["Tous", "Entreprise", "Produit", "Technologie", "Communaute", "Partenaires"]

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <section className="pt-24 lg:pt-32 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              Blog QuickGo
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Actualites et Insights
            </h1>
            <p className="text-lg text-muted-foreground">
              Decouvrez les dernieres nouvelles de QuickGo, nos innovations 
              et les histoires inspirantes de notre communaute.
            </p>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-2 mb-12"
          >
            {categories.map((cat) => (
              <Button
                key={cat}
                variant={cat === "Tous" ? "default" : "outline"}
                size="sm"
              >
                {cat}
              </Button>
            ))}
          </motion.div>

          {/* Featured Post */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-12"
          >
            <div className="grid lg:grid-cols-2 gap-8 p-6 rounded-3xl bg-card border border-border/50">
              <div className="aspect-video lg:aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 flex items-center justify-center">
                <span className="text-6xl">📰</span>
              </div>
              <div className="flex flex-col justify-center">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium w-fit mb-4">
                  {posts[0].category}
                </span>
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4">
                  {posts[0].title}
                </h2>
                <p className="text-muted-foreground mb-6">{posts[0].excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {posts[0].author}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {posts[0].date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {posts[0].readTime}
                  </span>
                </div>
                <Button className="gap-2 w-fit">
                  Lire l&apos;article
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Posts Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {posts.slice(1).map((post, index) => (
              <div
                key={post.slug}
                className="rounded-2xl bg-card border border-border/50 overflow-hidden hover:border-primary/30 transition-all group"
              >
                <div className="aspect-video bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 flex items-center justify-center">
                  <span className="text-4xl">📄</span>
                </div>
                <div className="p-6">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                    {post.category}
                  </span>
                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{post.date}</span>
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Load More */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mt-12"
          >
            <Button variant="outline" size="lg">
              Charger plus d&apos;articles
            </Button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
