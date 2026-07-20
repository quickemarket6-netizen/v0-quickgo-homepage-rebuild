"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, ShoppingBag, TrendingUp, Wallet, Users, UserCog, BarChart3,
  Tag, Star, Settings, HelpCircle, Bell, ChevronDown, ChevronRight,
  LogOut, User, Truck, Boxes, Ticket, MessageSquare, RefreshCw,
  Search, Phone, Mail, FileText, Send, AlertTriangle, CheckCircle, Clock,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Types ────────────────────────────────────────────────────────────────────
type TicketStatus   = "open" | "in_progress" | "resolved" | "closed"
type TicketPriority = "low" | "medium" | "high" | "urgent"

interface SupportTicket {
  id: string; subject: string; category: string; message: string
  status: TicketStatus; priority: TicketPriority; created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────
const BACKGROUND_VIDEOS = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background%20videos%20E-market%20hero-tiwMHaJdezDuLsRvu9dKGD6duCx1gr.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/video%20market%20place%20background%20hero-ukKWRfEszbAZsD07cLFE1nT4OaJHBS.mp4",
]

const TICKET_STATUS_CFG: Record<TicketStatus, { label: string; color: string; Icon: React.FC<{ className?: string; style?: React.CSSProperties }> }> = {
  open:        { label: "Ouvert",      color: "#3b82f6", Icon: Clock        },
  in_progress: { label: "En cours",   color: "#f59e0b", Icon: RefreshCw    },
  resolved:    { label: "Résolu",     color: "#22c55e", Icon: CheckCircle  },
  closed:      { label: "Fermé",      color: "#6b7280", Icon: CheckCircle  },
}

const TICKET_CATEGORIES = [
  "Commandes", "Paiements", "Livraisons", "Produits", "Compte & Profil", "Technique", "Autre",
]
const TICKET_PRIORITIES: { value: TicketPriority; label: string; color: string }[] = [
  { value: "low",    label: "Faible",  color: "#22c55e" },
  { value: "medium", label: "Normal",  color: "#f59e0b" },
  { value: "high",   label: "Élevée",  color: "#f97316" },
  { value: "urgent", label: "Urgent",  color: "#ef4444" },
]

const FAQS: {
  category: string; color: string
  Icon: React.FC<{ className?: string; style?: React.CSSProperties }>
  items: { q: string; a: string }[]
}[] = [
  {
    category: "Commandes", color: "#3b82f6", Icon: ShoppingBag,
    items: [
      { q: "Comment puis-je modifier une commande ?", a: "Rendez-vous dans Commandes > sélectionnez la commande > Modifier. Vous pouvez ajuster la quantité, l'adresse ou le statut tant que la commande n'est pas encore en livraison." },
      { q: "Que faire si un client annule sa commande ?", a: "Vous êtes notifié immédiatement. Le remboursement est traité automatiquement si le paiement avait été effectué. Vous pouvez recontacter le client via la messagerie." },
      { q: "Comment marquer une commande comme livrée ?", a: "Dans la vue Livraisons, sélectionnez la commande et cliquez sur « Marquer comme livrée ». Le client reçoit une notification et peut laisser un avis." },
    ],
  },
  {
    category: "Paiements", color: "#22c55e", Icon: Wallet,
    items: [
      { q: "Quand vais-je recevoir mes paiements ?", a: "Les paiements sont versés chaque lundi pour les commandes livrées et confirmées de la semaine précédente. Le délai de virement dépend de votre banque (24–72h)." },
      { q: "Comment fonctionne la commission ?", a: "QuickGo prélève 5% sur chaque vente, déduits automatiquement lors de chaque virement à 23h59. Vous consultez le détail dans Portefeuille > Historique." },
      { q: "Puis-je demander un virement immédiat ?", a: "Oui ! Depuis Portefeuille > Demander un retrait, vous initiez un virement immédiat (solde minimum 5 000 F CFA requis)." },
    ],
  },
  {
    category: "Produits", color: "#f97316", Icon: Package,
    items: [
      { q: "Comment ajouter un nouveau produit ?", a: "Depuis Produits > Ajouter un produit, remplissez le formulaire. Les images, le prix et le stock sont requis. Le produit sera visible immédiatement après enregistrement." },
      { q: "Peut-on avoir des produits hors stock ?", a: "Oui. Activez l'option « Hors stock » pour masquer temporairement un produit sans le supprimer. Réactivez-le dès réapprovisionnement." },
    ],
  },
  {
    category: "Compte", color: "#8b5cf6", Icon: User,
    items: [
      { q: "Comment modifier les infos de ma boutique ?", a: "Paramètres > Ma boutique. Nom, description, catégorie et adresse sont modifiables à tout moment. Les changements sont effectifs immédiatement." },
      { q: "Comment contacter le support QuickGo ?", a: "Via ce formulaire de ticket, par email à support@quickgo.cm ou par téléphone. Notre équipe est disponible 7j/7 de 8h à 22h (heure de Yaoundé)." },
    ],
  },
]

const SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendor/dashboard" },
  { icon: ShoppingBag,     label: "Commandes",       href: "/vendor/orders" },
  {
    icon: Package, label: "Produits", href: "/vendor/products", expandable: true,
    children: [
      { label: "Tous les produits",  href: "/vendor/products" },
      { label: "Ajouter un produit", href: "/vendor/products/new" },
      { label: "Catégories",         href: "/vendor/products/categories" },
    ],
  },
  { icon: Boxes,        label: "Stocks",        href: "/vendor/stocks" },
  { icon: Truck,        label: "Livraisons",    href: "/vendor/deliveries" },
  { icon: TrendingUp,   label: "Revenus",       href: "/vendor/analytics" },
  {
    icon: Wallet, label: "Portefeuille", href: "/vendor/wallet", expandable: true,
    children: [
      { label: "Solde & Retrait", href: "/vendor/wallet" },
      { label: "Retraits",        href: "/vendor/payouts" },
      { label: "Historique",      href: "/vendor/wallet/history" },
    ],
  },
  { icon: Users,        label: "Clients CRM",   href: "/vendor/crm" },
  { icon: UserCog,          label: "Employés",         href: "/vendor/employees"     },
  { icon: BarChart3,    label: "Analyses",      href: "/vendor/analytics" },
  { icon: Tag,          label: "Promotions",    href: "/vendor/promotions" },
  { icon: Ticket,       label: "Coupons",       href: "/vendor/coupons" },
  { icon: Star,         label: "Avis",          href: "/vendor/reviews" },
  { icon: MessageSquare,label: "Messages",      href: "/vendor/messages" },
  { icon: Bell,         label: "Notifications", href: "/vendor/notifications" },
  { icon: Settings,     label: "Paramètres",    href: "/vendor/settings" },
  { icon: HelpCircle,   label: "Aide",          href: "/vendor/help", active: true },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(s: string) {
  return new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HelpPage() {
  const supabase = useRef(createClient()).current
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoIdx, setVideoIdx] = useState(0)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [vendorName, setVendorName] = useState("")

  const [search,  setSearch]  = useState("")
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(true)

  const [form, setForm] = useState({
    category: "", subject: "", message: "", priority: "medium" as TicketPriority,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted,  setSubmitted]  = useState(false)
  const [formError,  setFormError]  = useState("")

  // Vendor info
  useEffect(() => {
    supabase.auth.getUser().then((res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      if (!res.data.user) return
      supabase.from("vendors").select("name").eq("user_id", res.data.user.id).single()
        .then((r: { data: { name: string } | null }) => { if (r.data) setVendorName(r.data.name) })
    })
  }, [supabase])

  // Video
  useEffect(() => {
    const video = videoRef.current; if (!video) return
    video.src = BACKGROUND_VIDEOS[videoIdx % BACKGROUND_VIDEOS.length]; video.load()
    const onCanPlay = () => video.play().catch(() => {})
    video.addEventListener("canplay", onCanPlay)
    return () => video.removeEventListener("canplay", onCanPlay)
  }, [videoIdx])

  const toggleSection = (label: string) =>
    setExpandedSections(prev => ({ ...prev, [label]: !prev[label] }))

  // Load tickets
  const loadTickets = useCallback(async () => {
    const res = await fetch("/api/vendor/help")
    if (!res.ok) { setLoadingTickets(false); return }
    const d = await res.json()
    setTickets(d.tickets ?? [])
    setLoadingTickets(false)
  }, [])

  useEffect(() => { loadTickets() }, [loadTickets])

  const submitTicket = async () => {
    setFormError("")
    if (!form.subject.trim() || !form.message.trim()) { setFormError("Sujet et message requis"); return }
    setSubmitting(true)
    const res = await fetch("/api/vendor/help", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const d = await res.json()
    setSubmitting(false)
    if (d.error) { setFormError(d.error); return }
    setSubmitted(true)
    setForm({ category: "", subject: "", message: "", priority: "medium" })
    if (d.ticket) setTickets(prev => [d.ticket, ...prev])
    setTimeout(() => setSubmitted(false), 4000)
  }

  const filteredFaqs = FAQS.map(cat => ({
    ...cat,
    items: search
      ? cat.items.filter(i => i.q.toLowerCase().includes(search.toLowerCase()) || i.a.toLowerCase().includes(search.toLowerCase()))
      : cat.items,
  })).filter(cat => cat.items.length > 0)

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Background orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#10b981] blur-[120px] animate-orb"
          style={{ "--orb-s": "1.2", "--orb-o-min": "0.12", "--orb-o-max": "0.28", "--orb-dur": "8s" } as React.CSSProperties} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#06b6d4] blur-[120px] animate-orb"
          style={{ "--orb-s": "1.15", "--orb-o-min": "0.1", "--orb-o-max": "0.22", "--orb-dur": "10s", "--orb-delay": "3s" } as React.CSSProperties} />
      </div>

      {/* ── Sidebar ── */}
      <aside className="hidden lg:flex w-60 shrink-0 flex-col bg-[#111118] border-r border-[#1e1e2e] relative z-10">
        <div className="p-4 border-b border-[#1e1e2e]">
          <Link href="/vendor/dashboard" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center">
              <span className="text-white font-black text-sm">Q</span>
            </div>
            <div>
              <p className="text-white font-black text-base leading-none">QUICK<span className="text-[#a3e635]">GO</span></p>
              <p className="text-[10px] text-white/30 uppercase tracking-widest">Vendeur</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => {
            const isExpanded     = expandedSections[item.label]
            const Icon           = item.icon
            const anyChildActive = ("expandable" in item && item.expandable) &&
              Array.isArray((item as { children?: { label: string; href: string; active?: boolean }[] }).children) &&
              ((item as { children?: { label: string; href: string; active?: boolean }[] }).children ?? []).some(c => c.active)
            return (
              <div key={item.label}>
                {("expandable" in item && item.expandable) ? (
                  <button onClick={() => toggleSection(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                      anyChildActive ? "text-[#a3e635] bg-[#a3e635]/10" : "text-white/50 hover:text-white hover:bg-[#1e1e2e]/60"
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" /><span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <Link href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      ("active" in item && item.active)
                        ? "bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20"
                        : "text-white/50 hover:text-white hover:bg-[#1e1e2e]/60"
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" /><span className="flex-1">{item.label}</span>
                    {!!("active" in item && item.active) && <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />}
                  </Link>
                )}
                <AnimatePresence>
                  {("expandable" in item && item.expandable) && isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden ml-7 mt-0.5 space-y-0.5">
                      {(("children" in item && Array.isArray(item.children) ? item.children : []) as { href: string; label: string }[]).map(child => (
                        <Link key={child.href} href={child.href}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-white/40 hover:text-white hover:bg-[#1e1e2e]/40 transition-all">
                          <ChevronRight className="w-3 h-3" />{child.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </nav>
        <div className="p-3">
          <motion.div whileHover={{ scale: 1.02 }}
            className="bg-gradient-to-br from-[#10b981]/15 to-[#06b6d4]/15 border border-[#10b981]/20 rounded-2xl p-4">
            <p className="text-white text-xs font-bold mb-1">Besoin d'aide ?</p>
            <p className="text-white/40 text-[10px] mb-2.5">Notre équipe répond 7j/7</p>
            <a href="mailto:support@quickgo.cm"
              className="w-full py-1.5 rounded-lg bg-[#10b981] text-white text-xs font-bold flex items-center justify-center gap-1.5">
              <Mail className="w-3 h-3" /> Nous écrire
            </a>
          </motion.div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">

        {/* Header */}
        <div className="relative overflow-hidden bg-[#111118] shrink-0">
          <video ref={videoRef} muted loop playsInline onEnded={() => setVideoIdx(i => i + 1)}
            className="absolute inset-0 w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-transparent to-[#0a0a0f]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111118] via-transparent to-[#111118]" />
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-0 left-1/4 w-40 h-20 rounded-full bg-[#10b981] blur-3xl opacity-30" />
          <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <motion.div animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-2xl bg-[#10b981]/20 border border-[#10b981]/30 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-[#10b981]" />
                </motion.div>
                <h1 className="text-2xl font-black text-white">
                  Aide &{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#10b981] to-[#06b6d4]">Support</span>
                </h1>
              </div>
              <p className="text-white/40 text-sm">FAQ, tickets de support et contact direct</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#10b981] to-[#06b6d4] flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm text-white/70 max-w-[100px] truncate">{vendorName || "Vendeur"}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                </motion.button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#111118] border-[#1e1e2e] text-white min-w-[160px]">
                <DropdownMenuItem className="hover:bg-white/5 cursor-pointer gap-2"><User className="w-4 h-4" /> Mon profil</DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-white/5 cursor-pointer gap-2"><Settings className="w-4 h-4" /> Paramètres</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#1e1e2e]" />
                <DropdownMenuItem className="hover:bg-red-500/10 text-red-400 cursor-pointer gap-2"
                  onClick={() => supabase.auth.signOut().then(() => window.location.href = "/auth/login")}>
                  <LogOut className="w-4 h-4" /> Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">

          {/* Quick contact cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Chat en direct", sub: "Réponse < 5 min", color: "#10b981", Icon: MessageSquare, action: "Démarrer le chat" },
              { label: "Email Support",  sub: "support@quickgo.cm", color: "#3b82f6", Icon: Mail,          action: "Envoyer un email" },
              { label: "Documentation", sub: "Guides & tutoriels", color: "#8b5cf6", Icon: FileText,       action: "Consulter" },
            ].map((card, i) => {
              const Icon = card.Icon
              return (
                <motion.div key={card.label}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 120, damping: 18 }}
                  whileHover={{ y: -3, boxShadow: `0 0 30px ${card.color}20` }}
                  className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden transition-all cursor-pointer">
                  <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-15" style={{ background: card.color }} />
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center relative z-10" style={{ background: card.color + "20" }}>
                    <Icon className="w-5 h-5" style={{ color: card.color } as React.CSSProperties} />
                  </div>
                  <div className="relative z-10">
                    <p className="text-white font-bold text-sm">{card.label}</p>
                    <p className="text-white/35 text-xs mt-0.5">{card.sub}</p>
                  </div>
                  <button className="relative z-10 flex items-center gap-1.5 text-xs font-semibold mt-auto"
                    style={{ color: card.color }}>
                    {card.action} <ExternalLink size={11} />
                  </button>
                </motion.div>
              )
            })}
          </div>

          {/* Main grid: FAQ + Ticket */}
          <div className="grid grid-cols-5 gap-6">

            {/* FAQ */}
            <div className="col-span-3 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-bold text-sm">Questions fréquentes</h2>
                <span className="text-xs text-white/30">{FAQS.reduce((s, c) => s + c.items.length, 0)} réponses</span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher une question…"
                  className="w-full bg-[#111118]/80 backdrop-blur border border-[#1e1e2e] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#10b981]/40" />
              </div>

              {/* FAQ accordion */}
              <div className="space-y-3">
                {filteredFaqs.length === 0 ? (
                  <div className="text-center py-8 text-white/25 text-sm">Aucun résultat pour « {search} »</div>
                ) : filteredFaqs.map(cat => {
                  const CatIcon = cat.Icon
                  return (
                    <div key={cat.category} className="bg-[#111118]/80 backdrop-blur border border-[#1e1e2e] rounded-2xl overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]">
                        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: cat.color + "20" }}>
                          <CatIcon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                        </div>
                        <span className="text-xs font-bold text-white/70 uppercase tracking-wide">{cat.category}</span>
                        <span className="ml-auto text-[10px] text-white/25">{cat.items.length}</span>
                      </div>
                      {cat.items.map(item => {
                        const key = `${cat.category}-${item.q}`
                        const isOpen = openFaq === key
                        return (
                          <div key={item.q} className="border-b border-white/[0.03] last:border-0">
                            <button onClick={() => setOpenFaq(isOpen ? null : key)}
                              className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors">
                              <p className={`text-xs font-medium leading-snug flex-1 ${isOpen ? "text-white" : "text-white/60"}`}>{item.q}</p>
                              <ChevronDown className={`w-3.5 h-3.5 text-white/30 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                            </button>
                            <AnimatePresence>
                              {isOpen && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                  className="overflow-hidden">
                                  <p className="px-4 pb-4 text-xs text-white/45 leading-relaxed">{item.a}</p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Ticket form */}
            <div className="col-span-2">
              <div className="bg-[#111118]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl overflow-hidden sticky top-0">
                <div className="px-5 py-4 border-b border-[#1e1e2e]" style={{ borderBottom: "1px solid #10b98118" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#10b981]/15 flex items-center justify-center">
                      <Send className="w-3.5 h-3.5 text-[#10b981]" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Créer un ticket</p>
                      <p className="text-white/30 text-xs">Réponse sous 24h</p>
                    </div>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      className="p-6 flex flex-col items-center gap-3 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-[#22c55e]/15 flex items-center justify-center">
                        <CheckCircle className="w-7 h-7 text-[#22c55e]" />
                      </div>
                      <p className="text-white font-bold text-sm">Ticket envoyé !</p>
                      <p className="text-white/40 text-xs">Notre équipe vous répondra dans les plus brefs délais.</p>
                    </motion.div>
                  ) : (
                    <motion.div key="form" className="p-5 space-y-4">
                      {/* Category */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-white/50 font-medium uppercase tracking-wide block">Catégorie</label>
                        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                          className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#10b981]/40 appearance-none">
                          <option value="">— Choisir —</option>
                          {TICKET_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                        </select>
                      </div>

                      {/* Subject */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-white/50 font-medium uppercase tracking-wide block">Sujet</label>
                        <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                          placeholder="Décrivez brièvement votre problème"
                          className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#10b981]/40" />
                      </div>

                      {/* Message */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-white/50 font-medium uppercase tracking-wide block">Message</label>
                        <textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                          rows={4} placeholder="Décrivez votre problème en détail…"
                          className="w-full bg-[#0a0a0f] border border-[#1e1e2e] rounded-xl px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#10b981]/40 resize-none" />
                      </div>

                      {/* Priority */}
                      <div className="space-y-1.5">
                        <label className="text-xs text-white/50 font-medium uppercase tracking-wide block">Priorité</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {TICKET_PRIORITIES.map(p => (
                            <button key={p.value} onClick={() => setForm(f => ({ ...f, priority: p.value }))}
                              className={`py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${
                                form.priority === p.value ? "border-opacity-100" : "border-white/10 text-white/30 hover:text-white/60"
                              }`}
                              style={form.priority === p.value ? { borderColor: p.color + "60", background: p.color + "15", color: p.color } : {}}>
                              {p.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {formError && (
                        <p className="text-xs text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20 rounded-xl px-3 py-2">
                          {formError}
                        </p>
                      )}

                      <motion.button onClick={submitTicket} disabled={submitting}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="w-full py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                        {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                        Envoyer le ticket
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Recent tickets */}
          {tickets.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-white font-bold text-sm">Mes tickets récents</h2>
              <div className="bg-[#111118]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl overflow-hidden divide-y divide-white/[0.04]">
                {loadingTickets ? (
                  <div className="flex items-center justify-center py-6">
                    <RefreshCw className="w-4 h-4 text-white/20 animate-spin" />
                  </div>
                ) : tickets.map(ticket => {
                  const cfg  = TICKET_STATUS_CFG[ticket.status]
                  const Icon = cfg.Icon
                  return (
                    <motion.div key={ticket.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition-colors">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: cfg.color + "18" }}>
                        <Icon className="w-4 h-4" style={{ color: cfg.color } as React.CSSProperties} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 font-medium truncate">{ticket.subject}</p>
                        <p className="text-xs text-white/30 mt-0.5">{ticket.category} · {fmtDate(ticket.created_at)}</p>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
                        style={{ background: cfg.color + "18", color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Phone contact */}
          <div className="bg-[#111118]/60 border border-[#1e1e2e] rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#10b981]/15 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-[#10b981]" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Support téléphonique</p>
                <p className="text-white/40 text-xs">Disponible 7j/7 · 8h – 22h (Yaoundé)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#10b981] font-mono font-bold text-sm">+237 6XX XXX XXX</span>
              <div className="flex items-center gap-1">
                <span className="relative flex w-2 h-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
                  <span className="relative inline-flex rounded-full w-2 h-2 bg-[#22c55e]" />
                </span>
                <span className="text-[10px] text-[#22c55e] font-medium">En ligne</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
