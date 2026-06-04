"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Package, ShoppingBag, TrendingUp, Wallet, Users, UserCog, BarChart3,
  Tag, Star, Settings, HelpCircle, Bell, ChevronDown, ChevronRight,
  LogOut, User, Truck, Boxes, Ticket, RefreshCw, Send, MessageSquare,
  Search, Archive, ArchiveRestore,
} from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Conversation {
  id: string; customer_id: string; customer_name: string; customer_avatar: string | null
  order_id: string | null; subject: string; status: "open" | "archived"
  last_message: string; last_message_at: string; last_sender: "vendor" | "customer" | null
  unread_count: number; created_at: string; updated_at: string
}
interface Message {
  id: string; conversation_id: string; sender_type: "vendor" | "customer"
  sender_id: string; content: string; created_at: string; read_at: string | null
}
interface KPI  { total: number; unread: number; archived: number }
interface Counts { all: number; unread: number; archived: number }

// ─── Constants ────────────────────────────────────────────────────────────────
const BACKGROUND_VIDEOS = [
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/background%20videos%20E-market%20hero-tiwMHaJdezDuLsRvu9dKGD6duCx1gr.mp4",
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/video%20market%20place%20background%20hero-ukKWRfEszbAZsD07cLFE1nT4OaJHBS.mp4",
]

const FILTER_TABS = [
  { key: "all",      label: "Tous" },
  { key: "unread",   label: "Non lus" },
  { key: "archived", label: "Archivés" },
] as const

const AVATAR_COLORS = ["#8b5cf6", "#06b6d4", "#22c55e", "#f97316", "#3b82f6", "#eab308", "#ec4899"]

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
  { icon: Boxes,        label: "Stocks",       href: "/vendor/stocks" },
  { icon: Truck,        label: "Livraisons",   href: "/vendor/deliveries" },
  { icon: TrendingUp,   label: "Revenus",      href: "/vendor/analytics" },
  {
    icon: Wallet, label: "Portefeuille", href: "/vendor/wallet", expandable: true,
    children: [
      { label: "Solde & Retrait", href: "/vendor/wallet" },
      { label: "Retraits",        href: "/vendor/payouts" },
      { label: "Historique",      href: "/vendor/wallet/history" },
    ],
  },
  { icon: Users,        label: "Clients CRM", href: "/vendor/crm" },
  { icon: UserCog,          label: "Employés",         href: "/vendor/employees"     },
  { icon: BarChart3,    label: "Analyses",    href: "/vendor/analytics" },
  { icon: Tag,          label: "Promotions",  href: "/vendor/promotions" },
  { icon: Ticket,       label: "Coupons",     href: "/vendor/coupons" },
  { icon: Star,         label: "Avis",        href: "/vendor/reviews" },
  { icon: MessageSquare,label: "Messages",    href: "/vendor/messages", active: true },
  { icon: Settings,     label: "Paramètres",  href: "/vendor/settings" },
  { icon: HelpCircle,   label: "Aide",        href: "/vendor/help" },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (target === 0) { setVal(0); return }
    const start = performance.now()
    const raf = (now: number) => {
      const p = Math.min((now - start) / duration, 1)
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [target, duration])
  return val
}

function avatarColor(name: string) {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

function fmtTime(s: string) {
  const d = new Date(s), now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  if (diffDays < 7) return d.toLocaleDateString("fr-FR", { weekday: "short" })
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
}

function fmtDay(s: string) {
  const d = new Date(s), now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return "Hier"
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
}

function fmtFull(s: string) {
  return new Date(s).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const color = avatarColor(name)
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 font-bold text-white select-none"
      style={{ width: size, height: size, background: color + "30", border: `1.5px solid ${color}50`, color, fontSize: size * 0.38 }}>
      {initials(name)}
    </div>
  )
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color, Icon, delay }: {
  label: string; value: number; sub: string; color: string
  Icon: React.FC<{ className?: string; style?: React.CSSProperties }>; delay: number
}) {
  const animated = useCountUp(value)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 120, damping: 18 }}
      whileHover={{ y: -3, boxShadow: `0 0 30px ${color}20` }}
      className="bg-[#16161f]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl p-5 flex flex-col gap-3
        hover:border-opacity-60 transition-all duration-300 relative overflow-hidden"
    >
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-20" style={{ background: color }} />
      <div className="w-10 h-10 rounded-xl flex items-center justify-center relative z-10" style={{ background: `${color}20` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="relative z-10">
        <p className="text-2xl font-black text-white leading-tight">{animated}</p>
        <p className="text-xs text-white/40 mt-0.5">{sub}</p>
        <p className="text-xs text-white/25 mt-1">{label}</p>
      </div>
    </motion.div>
  )
}

// ─── Conversation Item ────────────────────────────────────────────────────────
function ConversationItem({ conv, selected, onClick }: {
  conv: Conversation; selected: boolean; onClick: () => void
}) {
  return (
    <button onClick={onClick} className={`w-full text-left px-3 py-3 rounded-xl transition-all flex items-start gap-3 ${
      selected ? "bg-[#8b5cf6]/15 border border-[#8b5cf6]/30" : "hover:bg-white/[0.03] border border-transparent"
    }`}>
      <Avatar name={conv.customer_name} size={38} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <p className={`text-sm font-semibold truncate ${selected ? "text-white" : "text-white/80"}`}>
            {conv.customer_name}
          </p>
          <span className="text-[10px] text-white/30 shrink-0">{fmtTime(conv.last_message_at)}</span>
        </div>
        {conv.subject && (
          <p className="text-[10px] text-white/30 truncate mb-0.5">{conv.subject}</p>
        )}
        <div className="flex items-center gap-1.5">
          {conv.last_sender === "vendor" && <span className="text-[10px] text-white/25">Vous :</span>}
          <p className={`text-xs truncate flex-1 ${conv.unread_count > 0 && conv.last_sender !== "vendor" ? "text-white/70 font-medium" : "text-white/35"}`}>
            {conv.last_message || "Aucun message"}
          </p>
          {conv.unread_count > 0 && (
            <span className="shrink-0 w-4 h-4 rounded-full bg-[#8b5cf6] text-white text-[9px] font-bold flex items-center justify-center">
              {conv.unread_count > 9 ? "9+" : conv.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, convName }: { msg: Message; convName: string }) {
  const isVendor = msg.sender_type === "vendor"
  return (
    <div className={`flex gap-2.5 ${isVendor ? "flex-row-reverse" : "flex-row"}`}>
      {!isVendor && <Avatar name={convName} size={28} />}
      <div className={`max-w-[70%] space-y-1 ${isVendor ? "items-end" : "items-start"} flex flex-col`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isVendor
            ? "bg-[#8b5cf6] text-white rounded-br-sm"
            : "bg-[#1e1e2e] text-white/90 rounded-bl-sm"
        }`}>
          {msg.content}
        </div>
        <span className="text-[10px] text-white/25 px-1">{fmtFull(msg.created_at)}</span>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const supabase = useRef(createClient()).current
  const videoRef  = useRef<HTMLVideoElement>(null)
  const [videoIdx, setVideoIdx] = useState(0)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [vendorName, setVendorName]  = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollRef        = useRef<ReturnType<typeof setInterval> | null>(null)
  const textareaRef    = useRef<HTMLTextAreaElement>(null)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedId,    setSelectedId]    = useState<string | null>(null)
  const [messages,      setMessages]      = useState<Message[]>([])
  const [filter,        setFilter]        = useState("all")
  const [search,        setSearch]        = useState("")
  const [kpi,           setKpi]           = useState<KPI>({ total: 0, unread: 0, archived: 0 })
  const [counts,        setCounts]        = useState<Counts>({ all: 0, unread: 0, archived: 0 })
  const [loading,       setLoading]       = useState(true)
  const [loadingMsgs,   setLoadingMsgs]   = useState(false)
  const [msgText,       setMsgText]       = useState("")
  const [sending,       setSending]       = useState(false)

  // Vendor info
  useEffect(() => {
    supabase.auth.getUser().then((res: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      const user = res.data.user
      if (!user) return
      supabase.from("vendors").select("name").eq("owner_id", user.id).single()
        .then((r: { data: { name: string } | null }) => { if (r.data) setVendorName(r.data.name) })
    })
  }, [supabase])

  // Video cycling
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.src = BACKGROUND_VIDEOS[videoIdx % BACKGROUND_VIDEOS.length]
    video.load()
    const onCanPlay = () => video.play().catch(() => {})
    video.addEventListener("canplay", onCanPlay)
    return () => video.removeEventListener("canplay", onCanPlay)
  }, [videoIdx])

  const toggleSection = (label: string) =>
    setExpandedSections(prev => ({ ...prev, [label]: !prev[label] }))

  // Load conversations
  const loadConversations = useCallback(async () => {
    const res = await fetch(`/api/vendor/messages?filter=${filter}`)
    if (!res.ok) { setLoading(false); return }
    const d = await res.json()
    setConversations(d.conversations ?? [])
    setKpi(d.kpi ?? { total: 0, unread: 0, archived: 0 })
    setCounts(d.counts ?? { all: 0, unread: 0, archived: 0 })
    setLoading(false)
  }, [filter])

  useEffect(() => { loadConversations() }, [loadConversations])

  // Load messages
  const loadMessages = useCallback(async (convId: string, quiet = false) => {
    if (!quiet) setLoadingMsgs(true)
    const res = await fetch(`/api/vendor/messages?conversation_id=${convId}`)
    if (!res.ok) { setLoadingMsgs(false); return }
    const d = await res.json()
    setMessages(d.messages ?? [])
    if (!quiet) setLoadingMsgs(false)
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c))
  }, [])

  const selectConversation = useCallback((conv: Conversation) => {
    setSelectedId(conv.id)
    loadMessages(conv.id)
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(() => loadMessages(conv.id, true), 6000)
  }, [loadMessages])

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Send message
  const sendMessage = async () => {
    if (!msgText.trim() || !selectedId || sending) return
    const content = msgText.trim()
    setMsgText("")
    setSending(true)
    const tempId = `temp-${Date.now()}`
    const tempMsg: Message = {
      id: tempId, conversation_id: selectedId, sender_type: "vendor",
      sender_id: "", content, created_at: new Date().toISOString(), read_at: null,
    }
    setMessages(prev => [...prev, tempMsg])

    const res = await fetch("/api/vendor/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: selectedId, content }),
    })
    const d = await res.json()
    if (d.message) setMessages(prev => prev.map(m => m.id === tempId ? d.message : m))
    setSending(false)
    loadConversations()
  }

  // Archive
  const archiveConv = async (id: string, action: "archive" | "unarchive") => {
    await fetch("/api/vendor/messages", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: id, action }),
    })
    if (selectedId === id) { setSelectedId(null); setMessages([]) }
    loadConversations()
  }

  // Filter messages by date group
  function groupMessages(msgs: Message[]) {
    const groups: { day: string; items: Message[] }[] = []
    for (const m of msgs) {
      const day = fmtDay(m.created_at)
      const last = groups[groups.length - 1]
      if (last && last.day === day) last.items.push(m)
      else groups.push({ day, items: [m] })
    }
    return groups
  }

  const selectedConv = conversations.find(c => c.id === selectedId) ?? null
  const filtered = conversations.filter(c =>
    !search ||
    c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    c.last_message.toLowerCase().includes(search.toLowerCase()) ||
    c.subject.toLowerCase().includes(search.toLowerCase())
  )
  const messageGroups = groupMessages(messages)

  const tabCount = (key: string) => {
    if (key === "all")      return counts.all
    if (key === "unread")   return counts.unread
    if (key === "archived") return counts.archived
    return 0
  }

  return (
    <div className="h-screen bg-[#0a0a0f] flex overflow-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#8b5cf6] blur-[120px]" />
        <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#6366f1] blur-[120px]" />
        <motion.div animate={{ scale: [1, 1.25, 1], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full bg-[#a78bfa] blur-[120px]" />
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
              ("children" in item) && Array.isArray(item.children) &&
              item.children.some((c: { label: string; href: string; active?: boolean }) => c.active)
            return (
              <div key={item.label}>
                {("expandable" in item && item.expandable) ? (
                  <button onClick={() => toggleSection(item.label)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm ${
                      anyChildActive ? "text-[#a3e635] bg-[#a3e635]/10" : "text-white/50 hover:text-white hover:bg-[#1e1e2e]/60"
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </button>
                ) : (
                  <Link href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      ("active" in item && item.active)
                        ? "bg-[#8b5cf6]/10 text-[#8b5cf6] border border-[#8b5cf6]/20"
                        : "text-white/50 hover:text-white hover:bg-[#1e1e2e]/60"
                    }`}>
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {!!("active" in item && item.active) && <span className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]" />}
                  </Link>
                )}
                <AnimatePresence>
                  {("expandable" in item && item.expandable) && isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden ml-7 mt-0.5 space-y-0.5">
                      {("children" in item && Array.isArray(item.children) ? item.children : []).map((child: { href: string; label: string }) => (
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
            className="bg-gradient-to-br from-[#8b5cf6]/20 to-[#6366f1]/20 border border-[#8b5cf6]/20 rounded-2xl p-4">
            <p className="text-white text-xs font-bold mb-1">Restez disponible</p>
            <p className="text-white/40 text-[10px] mb-3">Répondez rapidement pour fidéliser vos clients</p>
            <div className="flex items-center gap-1.5">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22c55e] opacity-75" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-[#22c55e]" />
              </span>
              <span className="text-[10px] text-[#22c55e] font-medium">En ligne</span>
            </div>
          </motion.div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden">

        {/* Header */}
        <div className="relative overflow-hidden bg-[#111118] shrink-0">
          <video ref={videoRef} muted loop playsInline onEnded={() => setVideoIdx(i => i + 1)}
            className="absolute inset-0 w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f]/60 via-transparent to-[#0a0a0f]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111118] via-transparent to-[#111118]" />
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-0 left-1/4 w-40 h-20 rounded-full bg-[#8b5cf6] blur-3xl opacity-30" />
          <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.5, 0.2] }} transition={{ duration: 8, repeat: Infinity, delay: 2 }}
            className="absolute top-0 right-1/3 w-32 h-16 rounded-full bg-[#6366f1] blur-3xl opacity-20" />

          <div className="relative z-10 px-6 py-5 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-2xl bg-[#8b5cf6]/20 border border-[#8b5cf6]/30 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-[#8b5cf6]" />
                </motion.div>
                <h1 className="text-2xl font-black text-white">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8b5cf6] to-[#a78bfa]">
                    Messagerie
                  </span>
                </h1>
              </div>
              <p className="text-white/40 text-sm">Gérez vos échanges avec vos clients</p>
            </div>

            <div className="flex items-center gap-3">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={loadConversations}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors">
                <RefreshCw className="w-4 h-4 text-white/50" />
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors relative">
                <Bell className="w-4 h-4 text-white/50" />
                {kpi.unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#8b5cf6] text-white text-[8px] flex items-center justify-center font-bold">
                    {kpi.unread > 9 ? "9+" : kpi.unread}
                  </span>
                )}
              </motion.button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-sm text-white/70 max-w-[100px] truncate">{vendorName || "Vendeur"}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-white/30" />
                  </motion.button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#111118] border-[#1e1e2e] text-white min-w-[160px]">
                  <DropdownMenuItem className="hover:bg-white/5 cursor-pointer gap-2">
                    <User className="w-4 h-4" /> Mon profil
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-white/5 cursor-pointer gap-2">
                    <Settings className="w-4 h-4" /> Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-[#1e1e2e]" />
                  <DropdownMenuItem className="hover:bg-red-500/10 text-red-400 cursor-pointer gap-2"
                    onClick={() => supabase.auth.signOut().then(() => window.location.href = "/auth/login")}>
                    <LogOut className="w-4 h-4" /> Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 flex flex-col p-6 gap-5">

          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-4 shrink-0">
            <KpiCard label="Conversations"  value={kpi.total}    sub="au total"   color="#8b5cf6" Icon={MessageSquare} delay={0}   />
            <KpiCard label="Non lus"        value={kpi.unread}   sub="en attente" color="#f97316" Icon={Bell}          delay={0.1} />
            <KpiCard label="Archivées"      value={kpi.archived} sub="archivées"  color="#6b7280" Icon={Archive}       delay={0.2} />
          </div>

          {/* Split panel */}
          <div className="flex-1 min-h-0 flex gap-5">

            {/* Left: conversation list */}
            <div className="w-72 shrink-0 flex flex-col bg-[#111118]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl overflow-hidden">

              {/* Search */}
              <div className="p-3 border-b border-[#1e1e2e] shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Rechercher…"
                    className="w-full bg-white/[0.04] border border-[#1e1e2e] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-[#8b5cf6]/40" />
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex border-b border-[#1e1e2e] shrink-0">
                {FILTER_TABS.map(tab => {
                  const count = tabCount(tab.key)
                  return (
                    <button key={tab.key} onClick={() => setFilter(tab.key)}
                      className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${
                        filter === tab.key ? "text-[#8b5cf6]" : "text-white/30 hover:text-white/60"
                      }`}>
                      {tab.label}
                      {count > 0 && <span className="ml-1 text-[9px] opacity-60">({count})</span>}
                      {filter === tab.key && (
                        <motion.div layoutId="conv-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8b5cf6]" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Conversation list */}
              <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <RefreshCw className="w-5 h-5 text-white/20 animate-spin" />
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                    <MessageSquare className="w-10 h-10 text-white/10" />
                    <p className="text-xs text-white/25 text-center">Aucune conversation</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {filtered.map((conv, i) => (
                      <motion.div key={conv.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}>
                        <ConversationItem
                          conv={conv}
                          selected={selectedId === conv.id}
                          onClick={() => selectConversation(conv)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Right: chat view */}
            <div className="flex-1 min-w-0 flex flex-col bg-[#111118]/80 backdrop-blur-xl border border-[#1e1e2e] rounded-2xl overflow-hidden">
              {!selectedConv ? (
                /* No conversation selected */
                <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
                  <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
                    className="w-20 h-20 rounded-3xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 flex items-center justify-center">
                    <MessageSquare className="w-9 h-9 text-[#8b5cf6]/40" />
                  </motion.div>
                  <div>
                    <p className="text-white/50 font-semibold text-sm">Sélectionnez une conversation</p>
                    <p className="text-white/25 text-xs mt-1">Choisissez un échange dans la liste à gauche</p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Conv header */}
                  <div className="shrink-0 px-5 py-3.5 border-b border-[#1e1e2e] flex items-center gap-3">
                    <Avatar name={selectedConv.customer_name} size={36} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold text-sm">{selectedConv.customer_name}</p>
                      {selectedConv.subject && (
                        <p className="text-xs text-white/35 truncate">{selectedConv.subject}</p>
                      )}
                    </div>
                    {selectedConv.order_id && (
                      <span className="text-[10px] px-2 py-1 rounded-lg bg-[#8b5cf6]/10 text-[#8b5cf6] font-mono">
                        #{selectedConv.order_id.slice(0, 8)}
                      </span>
                    )}
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => archiveConv(selectedConv.id, selectedConv.status === "archived" ? "unarchive" : "archive")}
                      className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
                      title={selectedConv.status === "archived" ? "Désarchiver" : "Archiver"}>
                      {selectedConv.status === "archived"
                        ? <ArchiveRestore className="w-4 h-4 text-white/40" />
                        : <Archive className="w-4 h-4 text-white/40" />}
                    </motion.button>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {loadingMsgs ? (
                      <div className="flex items-center justify-center h-full">
                        <RefreshCw className="w-5 h-5 text-white/20 animate-spin" />
                      </div>
                    ) : messageGroups.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full gap-3">
                        <MessageSquare className="w-8 h-8 text-white/10" />
                        <p className="text-xs text-white/25">Aucun message dans cette conversation</p>
                      </div>
                    ) : (
                      messageGroups.map(group => (
                        <div key={group.day} className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-white/5" />
                            <span className="text-[10px] text-white/25 shrink-0">{group.day}</span>
                            <div className="flex-1 h-px bg-white/5" />
                          </div>
                          {group.items.map(msg => (
                            <MessageBubble key={msg.id} msg={msg} convName={selectedConv.customer_name} />
                          ))}
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="shrink-0 p-4 border-t border-[#1e1e2e]">
                    <div className="flex items-end gap-3 bg-white/[0.03] border border-[#1e1e2e] rounded-2xl px-4 py-3 focus-within:border-[#8b5cf6]/40 transition-colors">
                      <textarea ref={textareaRef}
                        value={msgText}
                        onChange={e => setMsgText(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                        placeholder="Écrivez votre message… (Entrée pour envoyer)"
                        rows={1}
                        className="flex-1 bg-transparent text-sm text-white placeholder-white/20 focus:outline-none resize-none leading-relaxed max-h-32 overflow-y-auto"
                        style={{ scrollbarWidth: "none" }}
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={sendMessage}
                        disabled={!msgText.trim() || sending}
                        className="w-9 h-9 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] flex items-center justify-center transition-colors disabled:opacity-40 shrink-0">
                        {sending
                          ? <RefreshCw className="w-4 h-4 text-white animate-spin" />
                          : <Send className="w-4 h-4 text-white" />}
                      </motion.button>
                    </div>
                    <p className="text-[10px] text-white/20 mt-1.5 text-right">Shift+Entrée pour nouvelle ligne</p>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
