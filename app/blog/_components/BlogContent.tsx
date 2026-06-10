"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight, Clock, User } from "lucide-react"

interface Post {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  author_name: string
  category: string
  image_url?: string | null
  read_time?: string | null
  published_at?: string | null
  views?: number
}

const STATIC_POSTS: Post[] = [
  { id:"1", title:"QuickGo lève 5 millions USD pour accélérer son expansion", slug:"quickgo-levee-fonds-5-millions", excerpt:"Notre dernière levée de fonds va nous permettre d'étendre nos services à 10 nouvelles villes africaines.", category:"Entreprise", author_name:"Marc Essomba", read_time:"5 min", published_at:"2024-05-15T00:00:00Z" },
  { id:"2", title:"Comment QuickGo Pay révolutionne les paiements au Cameroun", slug:"quickgo-pay-paiements-cameroun", excerpt:"Découvrez comment notre portefeuille électronique simplifie les transactions quotidiennes.", category:"Produit", author_name:"Sarah Ngo", read_time:"4 min", published_at:"2024-05-10T00:00:00Z" },
  { id:"3", title:"Nos livreurs : les héros du quotidien", slug:"livreurs-heros-quotidien", excerpt:"Rencontrez les hommes et femmes qui font de QuickGo une réalité chaque jour.", category:"Communauté", author_name:"Paul Kamga", read_time:"6 min", published_at:"2024-05-05T00:00:00Z" },
  { id:"4", title:"L'IA au service de la livraison : notre vision", slug:"ia-livraison-vision", excerpt:"Comment l'intelligence artificielle optimise nos opérations et améliore l'expérience client.", category:"Technologie", author_name:"Paul Kamga", read_time:"7 min", published_at:"2024-04-28T00:00:00Z" },
  { id:"5", title:"Partenariat avec les commerçants locaux", slug:"partenariat-commercants-locaux", excerpt:"Notre engagement pour soutenir l'économie locale et les entrepreneurs camerounais.", category:"Partenaires", author_name:"Céline Mbarga", read_time:"4 min", published_at:"2024-04-20T00:00:00Z" },
  { id:"6", title:"Lancement de QuickGo à Bafoussam", slug:"lancement-quickgo-bafoussam", excerpt:"QuickGo est désormais disponible dans la capitale de l'Ouest.", category:"Expansion", author_name:"Marc Essomba", read_time:"3 min", published_at:"2024-04-15T00:00:00Z" },
]

function formatDate(iso?: string | null) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
}

export default function BlogContent({ initialPosts }: { initialPosts: Post[] }) {
  const posts = initialPosts.length > 0 ? initialPosts : STATIC_POSTS

  const allCategories = ["Tous", ...Array.from(new Set(posts.map(p => p.category)))]
  const [activeCategory, setActiveCategory] = useState("Tous")

  const filtered = activeCategory === "Tous" ? posts : posts.filter(p => p.category === activeCategory)
  const featured  = filtered[0]
  const rest      = filtered.slice(1)

  return (
    <section className="pt-24 lg:pt-32 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            Blog QuickGo
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Actualités et Insights
          </h1>
          <p className="text-lg text-muted-foreground">
            Découvrez les dernières nouvelles de QuickGo, nos innovations
            et les histoires inspirantes de notre communauté.
          </p>
        </motion.div>

        {/* Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap justify-center gap-2 mb-12"
        >
          {allCategories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </Button>
          ))}
        </motion.div>

        {/* Featured Post */}
        {featured && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-12"
          >
            <Link href={`/blog/${featured.slug}`} className="block group">
              <div className="grid lg:grid-cols-2 gap-8 p-6 rounded-3xl bg-card border border-border/50 hover:border-primary/30 transition-all">
                <div className="aspect-video lg:aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 flex items-center justify-center">
                  <span className="text-6xl">📰</span>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium w-fit mb-4">
                    {featured.category}
                  </span>
                  <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                    {featured.title}
                  </h2>
                  {featured.excerpt && (
                    <p className="text-muted-foreground mb-6">{featured.excerpt}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />{featured.author_name}
                    </span>
                    {featured.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />{formatDate(featured.published_at)}
                      </span>
                    )}
                    {featured.read_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />{featured.read_time}
                      </span>
                    )}
                  </div>
                  <Button className="gap-2 w-fit" asChild>
                    <span>
                      Lire l&apos;article
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </Button>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Posts Grid */}
        {rest.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="rounded-2xl bg-card border border-border/50 overflow-hidden hover:border-primary/30 transition-all group block"
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
                  {post.excerpt && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{post.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{formatDate(post.published_at)}</span>
                    <span>{post.read_time}</span>
                  </div>
                </div>
              </Link>
            ))}
          </motion.div>
        )}

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-16">Aucun article dans cette catégorie.</p>
        )}
      </div>
    </section>
  )
}
