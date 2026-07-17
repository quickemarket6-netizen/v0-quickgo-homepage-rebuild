"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  MapPin,
  Phone,
  Mail,
  Clock,
  Shield,
  Zap,
  Headphones,
  Star,
  Package
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { InstallAppButton } from "@/components/pwa/InstallAppButton"
import { NewsletterForm } from "@/components/footer/NewsletterForm"
import { useT } from "@/lib/i18n/context"

const footerLinks = {
  company: {
    title: "QuickGo",
    links: [
      { label: "À propos", href: "/about" },
      { label: "Carrières", href: "/careers" },
      { label: "Presse", href: "/press" },
      { label: "Blog", href: "/blog" },
    ],
  },
  services: {
    title: "Services",
    links: [
      { label: "Marketplace", href: "/marketplace" },
      { label: "Livraison Express", href: "/delivery" },
      { label: "QuickGo Pay", href: "/wallet" },
      { label: "AI Assistant", href: "/ai" },
    ],
  },
  partners: {
    title: "Partenaires",
    links: [
      { label: "Devenir livreur", href: "/driver" },
      { label: "Devenir vendeur", href: "/vendors" },
      { label: "Programme affiliation", href: "/affiliate" },
      { label: "API & Intégrations", href: "/developers" },
    ],
  },
  support: {
    title: "Support",
    links: [
      { label: "Centre d'aide", href: "/support" },
      { label: "Contact", href: "/contact" },
      { label: "FAQ", href: "/faq" },
      { label: "Conditions d'utilisation", href: "/terms" },
    ],
  },
}

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com/quickgo", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com/quickgo", label: "Twitter" },
  { icon: Instagram, href: "https://instagram.com/quickgo", label: "Instagram" },
  { icon: Linkedin, href: "https://linkedin.com/company/quickgo", label: "LinkedIn" },
  { icon: Youtube, href: "https://youtube.com/quickgo", label: "YouTube" },
]

const trustBadges = [
  { icon: Zap, label: "Livraison ultra rapide", sublabel: "en moins de 30 minutes" },
  { icon: Shield, label: "Paiement 100% sécurisé", sublabel: "Vos transactions sont protégées" },
  { icon: Headphones, label: "Support 24/7", sublabel: "Nous sommes là pour vous" },
  { icon: Star, label: "Produits de qualité", sublabel: "Sélection rigoureuse" },
  { icon: Package, label: "Retours faciles", sublabel: "Satisfait ou remboursé" },
]

export function Footer() {
  const { t } = useT()
  return (
    <footer className="bg-card border-t border-border">
      {/* Trust Badges */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {trustBadges.map((badge, index) => (
              <motion.div
                key={badge.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="p-2 rounded-xl bg-primary/10">
                  <badge.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {badge.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {badge.sublabel}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="inline-block mb-6">
              <Image
                src="/quickgo-logo.jpg"
                alt="QuickGo"
                width={140}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              {t("footer.tagline")}
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Bastos, Yaoundé, Cameroun</span>
              </div>
              <a href="tel:+237694341586" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Phone className="h-4 w-4 text-primary" />
                <span>+237 694 341 586</span>
              </a>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 text-primary" />
                <span>contact@quickgo.cm</span>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
          
          {/* Links */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-foreground mb-4">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">
                {t("footer.newsletter.title")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("footer.newsletter.desc")}
              </p>
            </div>
            <NewsletterForm />
          </div>
        </div>

        {/* Installation de l'application (PWA) — pas de badges de stores
            pour une app qui n'y est pas */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">
                {t("footer.app.title")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("footer.app.desc")}
              </p>
            </div>
            <InstallAppButton />
          </div>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 QuickGo. {t("footer.rights")}
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Confidentialité
              </Link>
              <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Conditions
              </Link>
              <Link href="/cookies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
