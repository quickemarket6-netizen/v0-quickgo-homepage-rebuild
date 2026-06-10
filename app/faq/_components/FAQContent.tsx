"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ChevronDown, ChevronUp, MessageSquare, Mail } from "lucide-react"

interface FaqItem {
  id: string
  category: string
  question: string
  answer: string
  sort_order: number
}
interface FaqCategory {
  id: string
  label: string
  items: FaqItem[]
}

export default function FAQContent({ categories }: { categories: FaqCategory[] }) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "general")
  const [openQuestion, setOpenQuestion]     = useState<string | null>(null)
  const [searchQuery, setSearchQuery]       = useState("")

  const currentItems = searchQuery.trim()
    ? categories.flatMap(c => c.items).filter(
        f => f.question.toLowerCase().includes(searchQuery.toLowerCase())
          || f.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories.find(c => c.id === activeCategory)?.items ?? []

  return (
    <section className="pt-24 lg:pt-32 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            FAQ
          </span>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Questions Fréquentes
          </h1>
          <p className="text-lg text-muted-foreground">
            Trouvez rapidement des réponses à vos questions
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative mb-8"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher une question..."
            className="h-14 pl-12 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </motion.div>

        {/* Categories */}
        {!searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap gap-2 mb-8"
          >
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                onClick={() => { setActiveCategory(cat.id); setOpenQuestion(null) }}
              >
                {cat.label}
              </Button>
            ))}
          </motion.div>
        )}

        {/* FAQ List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {currentItems.map((faq) => (
            <div
              key={faq.id}
              className="rounded-2xl bg-card border border-border/50 overflow-hidden"
            >
              <button
                onClick={() => setOpenQuestion(openQuestion === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-semibold text-foreground pr-4">{faq.question}</span>
                {openQuestion === faq.id ? (
                  <ChevronUp className="h-5 w-5 text-primary flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
              </button>
              {openQuestion === faq.id && (
                <div className="px-6 pb-6">
                  <p className="text-muted-foreground">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}

          {currentItems.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Aucun résultat pour &quot;{searchQuery}&quot;
            </p>
          )}
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 border border-primary/30 text-center"
        >
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Vous n&apos;avez pas trouvé votre réponse ?
          </h2>
          <p className="text-muted-foreground mb-6">
            Notre équipe support est là pour vous aider
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="gap-2" asChild>
              <Link href="/support">
                <MessageSquare className="h-4 w-4" />
                Chat en direct
              </Link>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/contact">
                <Mail className="h-4 w-4" />
                Nous contacter
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
