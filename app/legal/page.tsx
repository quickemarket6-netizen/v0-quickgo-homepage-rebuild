"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Building2, FileCheck, MapPin, Phone, Mail, Globe, CreditCard, Shield } from "lucide-react"

const legalInfo = [
  {
    icon: Building2,
    label: "Raison sociale",
    value: "DL Solutions SARL"
  },
  {
    icon: FileCheck,
    label: "Forme juridique",
    value: "Societe a Responsabilite Limitee (SARL)"
  },
  {
    icon: MapPin,
    label: "Siege social",
    value: "Bastos, Yaounde, Cameroun"
  },
  {
    icon: CreditCard,
    label: "Capital social",
    value: "10 000 000 FCFA"
  },
  {
    icon: FileCheck,
    label: "RCCM",
    value: "RC/YDE/2024/B/1234"
  },
  {
    icon: FileCheck,
    label: "NIU",
    value: "M012400012345A"
  },
]

const contacts = [
  {
    icon: Phone,
    label: "Telephone",
    value: "+237 6 95 55 55 55",
    href: "tel:+237695555555"
  },
  {
    icon: Mail,
    label: "Email general",
    value: "contact@quickgo.cm",
    href: "mailto:contact@quickgo.cm"
  },
  {
    icon: Mail,
    label: "Support client",
    value: "support@quickgo.cm",
    href: "mailto:support@quickgo.cm"
  },
  {
    icon: Globe,
    label: "Site web",
    value: "www.quickgo.cm",
    href: "https://quickgo.cm"
  },
]

const directors = [
  {
    name: "Samuel OBAM",
    role: "Directeur General",
    email: "obamsamuel8@gmail.com"
  },
]

export default function LegalPage() {
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
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">Informations legales</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 text-balance">
                Mentions Legales
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                Conformement a la loi, voici les informations legales concernant l&apos;editeur 
                et l&apos;hebergeur de la plateforme QuickGo.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Legal Information */}
        <section className="py-16 lg:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Company Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">Editeur du site</h2>
              <div className="p-8 rounded-2xl bg-card border border-border/50">
                <div className="grid sm:grid-cols-2 gap-6">
                  {legalInfo.map((info) => (
                    <div key={info.label} className="flex items-start gap-4">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <info.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{info.label}</p>
                        <p className="font-semibold text-foreground">{info.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Directors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">Direction</h2>
              <div className="p-8 rounded-2xl bg-card border border-border/50">
                {directors.map((director) => (
                  <div key={director.name} className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {director.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-foreground text-lg">{director.name}</p>
                      <p className="text-muted-foreground">{director.role}</p>
                      <a href={`mailto:${director.email}`} className="text-sm text-primary hover:underline">
                        {director.email}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">Contact</h2>
              <div className="p-8 rounded-2xl bg-card border border-border/50">
                <div className="grid sm:grid-cols-2 gap-6">
                  {contacts.map((contact) => (
                    <a
                      key={contact.label}
                      href={contact.href}
                      className="flex items-start gap-4 p-4 rounded-xl hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <contact.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{contact.label}</p>
                        <p className="font-semibold text-foreground hover:text-primary transition-colors">
                          {contact.value}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Hosting */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">Hebergement</h2>
              <div className="p-8 rounded-2xl bg-card border border-border/50">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                    <Globe className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-lg mb-2">Vercel Inc.</p>
                    <p className="text-muted-foreground mb-1">340 S Lemon Ave #4133</p>
                    <p className="text-muted-foreground mb-1">Walnut, CA 91789, USA</p>
                    <a href="https://vercel.com" className="text-primary hover:underline">
                      www.vercel.com
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">Propriete intellectuelle</h2>
              <div className="p-8 rounded-2xl bg-card border border-border/50">
                <p className="text-muted-foreground leading-relaxed">
                  L&apos;ensemble du contenu du site QuickGo (logos, textes, elements graphiques, videos, etc.) 
                  est la propriete exclusive de DL Solutions SARL ou de ses partenaires. Toute reproduction, 
                  representation, modification, publication, transmission, denaturation, totale ou partielle 
                  du site ou de son contenu, par quelque procede que ce soit, et sur quelque support que ce soit 
                  est interdite sans l&apos;autorisation ecrite prealable de DL Solutions SARL.
                </p>
                <p className="text-muted-foreground leading-relaxed mt-4">
                  QuickGo est une marque deposee de DL Solutions SARL. Toute utilisation non autorisee 
                  de cette marque est strictement interdite.
                </p>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
      
      <Footer />
    </main>
  )
}
