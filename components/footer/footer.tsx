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
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0007-ezKXkl63WOFNwwQlwNLqPoMzyaOKo5.jpg"
                alt="QuickGo"
                width={140}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              La super application de livraison au Cameroun. Courses, restaurants, pharmacies, et bien plus encore.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Bastos, Yaoundé, Cameroun</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 text-primary" />
                <span>+237 6 95 55 55 55</span>
              </div>
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
        
        {/* App Download */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">
                Téléchargez l&apos;application
              </p>
              <p className="text-sm text-muted-foreground">
                Disponible sur iOS et Android
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="#" className="inline-block">
                <div className="h-12 px-4 rounded-xl bg-foreground flex items-center gap-2">
                  <svg className="h-6 w-6 text-background" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-[10px] text-background/70">Télécharger sur</p>
                    <p className="text-sm font-semibold text-background">App Store</p>
                  </div>
                </div>
              </Link>
              <Link href="#" className="inline-block">
                <div className="h-12 px-4 rounded-xl bg-foreground flex items-center gap-2">
                  <svg className="h-6 w-6 text-background" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
                  </svg>
                  <div className="text-left">
                    <p className="text-[10px] text-background/70">Disponible sur</p>
                    <p className="text-sm font-semibold text-background">Google Play</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Copyright */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 QuickGo. Tous droits réservés.
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
