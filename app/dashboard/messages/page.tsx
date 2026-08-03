"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ArrowLeft, Search, Send, Headphones, Bell } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type Notif = {
  id: string
  title: string
  message: string
  type: string
  is_read: boolean
  data: Record<string, string> | null
  created_at: string
}

type Thread = {
  key: string
  name: string
  avatar: string
  type: string
  notifications: Notif[]
  unread: number
  lastTime: string
}

type LocalMsg = {
  id: string
  from: "user" | "system"
  text: string
  time: string
}

const THREAD_META: Record<string, { name: string; avatar: string }> = {
  promo:   { name: "Promotions & Offres",  avatar: "🎁" },
  system:  { name: "Support QuickGo",      avatar: "💬" },
  default: { name: "Notifications",        avatar: "🔔" },
}

function groupThreads(notifications: Notif[]): Thread[] {
  const map = new Map<string, Thread>()

  for (const n of notifications) {
    const orderId = n.data?.order_id ?? n.data?.order_number
    let key: string
    let name: string
    let avatar: string

    if (n.type === "order" && orderId) {
      key    = `order:${orderId}`
      name   = `Commande ${n.data?.order_number ?? "#" + orderId.slice(0, 8)}`
      avatar = "📦"
    } else if (n.type === "promo") {
      key    = "promo"
      name   = THREAD_META.promo.name
      avatar = THREAD_META.promo.avatar
    } else {
      key    = "system"
      name   = THREAD_META.system.name
      avatar = THREAD_META.system.avatar
    }

    if (!map.has(key)) {
      map.set(key, { key, name, avatar, type: n.type, notifications: [], unread: 0, lastTime: n.created_at })
    }
    const thread = map.get(key)!
    thread.notifications.push(n)
    if (!n.is_read) thread.unread++
    if (n.created_at > thread.lastTime) thread.lastTime = n.created_at
  }

  return Array.from(map.values()).sort((a, b) => b.lastTime.localeCompare(a.lastTime))
}

function relTime(d: string) {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000)
  if (mins < 1) return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const h = Math.floor(mins / 60)
  if (h < 24) return `Il y a ${h}h`
  const days = Math.floor(h / 24)
  return days === 1 ? "Hier" : `Il y a ${days}j`
}

export default function MessagesPage() {
  const [threads, setThreads]       = useState<Thread[]>([])
  const [selected, setSelected]     = useState<Thread | null>(null)
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState("")
  const [localMsgs, setLocalMsgs]   = useState<Map<string, LocalMsg[]>>(new Map())
  const [input, setInput]           = useState("")
  const bottomRef                   = useRef<HTMLDivElement>(null)

  async function loadNotifs() {
    const res = await fetch("/api/notifications")
    if (!res.ok) return
    const data: Notif[] = await res.json()
    const grouped = groupThreads(data)
    setThreads(grouped)
    if (!selected && grouped.length > 0) setSelected(grouped[0])
    setLoading(false)
  }

  useEffect(() => { loadNotifs() }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selected, localMsgs])

  async function markRead(thread: Thread) {
    const unreadIds = thread.notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    for (const id of unreadIds) {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_read: true }),
      })
    }
    setThreads(prev => prev.map(t =>
      t.key === thread.key
        ? { ...t, unread: 0, notifications: t.notifications.map(n => ({ ...n, is_read: true })) }
        : t
    ))
  }

  function selectThread(thread: Thread) {
    setSelected(thread)
    markRead(thread)
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !selected) return
    const msg: LocalMsg = {
      id: Date.now().toString(),
      from: "user",
      text: input.trim(),
      time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    }
    setLocalMsgs(prev => {
      const next = new Map(prev)
      next.set(selected.key, [...(next.get(selected.key) ?? []), msg])
      return next
    })
    setInput("")
  }

  const filtered = threads.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase())
  )

  const totalUnread = threads.reduce((s, t) => s + t.unread, 0)

  const threadMsgs: Array<{ id: string; from: string; text: string; time: string }> = selected
    ? [
        ...selected.notifications.map(n => ({
          id: n.id,
          from: "system",
          text: n.message,
          time: relTime(n.created_at),
        })),
        ...(localMsgs.get(selected.key) ?? []),
      ]
    : []

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex overflow-hidden pt-16 max-h-screen">

        {/* ── Sidebar ──────────────────────────────────────────── */}
        <div className="w-full sm:w-80 border-r border-border/30 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-border/30">
            <div className="flex items-center gap-3 mb-4">
              <Link href="/dashboard" className="text-muted-foreground hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-lg font-bold text-white">Messages</h1>
              <AnimatePresence>
                {totalUnread > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 14 }}
                    className="ml-auto bg-[#3b82f6] text-white text-xs px-2 py-0.5 rounded-full"
                  >
                    {totalUnread}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="pl-10 h-10 bg-card/50 border-border/30"
              />
            </div>
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-card animate-pulse" style={{ opacity: 1 - i * 0.2 }} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-sm text-muted-foreground">Aucune conversation</p>
              </div>
            ) : (
              filtered.map((thread, i) => (
                <motion.button
                  key={thread.key}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 120, damping: 18 }}
                  whileHover={{ x: 4 }}
                  onClick={() => selectThread(thread)}
                  className={`w-full flex items-center gap-3 p-4 border-b border-border/20 text-left transition-colors ${
                    selected?.key === thread.key ? "bg-[#3b82f6]/10" : "hover:bg-card/50"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-2xl bg-card flex items-center justify-center text-2xl">
                      {thread.avatar}
                    </div>
                    {/* Ping dot for unread */}
                    {thread.unread > 0 && (
                      <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3b82f6] opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#3b82f6] border-2 border-background" />
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-white font-medium text-sm truncate">{thread.name}</span>
                      <span className="text-muted-foreground text-xs shrink-0">{relTime(thread.lastTime)}</span>
                    </div>
                    <p className="text-muted-foreground text-xs truncate">
                      {thread.notifications[0]?.message ?? ""}
                    </p>
                  </div>

                  {thread.unread > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 14, delay: i * 0.05 + 0.1 }}
                      className="bg-[#3b82f6] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    >
                      {thread.unread}
                    </motion.span>
                  )}
                </motion.button>
              ))
            )}
          </div>

          {/* Support link */}
          <div className="p-4 border-t border-border/30">
            <Link href="/support">
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 hover:bg-[#3b82f6]/15 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/20 flex items-center justify-center shrink-0">
                  <Headphones className="w-4 h-4 text-[#3b82f6]" />
                </div>
                <div>
                  <p className="text-white text-xs font-semibold">Contacter le support</p>
                  <p className="text-muted-foreground text-[10px]">Disponible 24h/24</p>
                </div>
              </motion.div>
            </Link>
          </div>
        </div>

        {/* ── Chat area ────────────────────────────────────────── */}
        <div className="hidden sm:flex flex-1 flex-col">
          {!selected ? (
            /* Empty state */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block mb-4"
                >
                  <Bell className="w-16 h-16 text-white/10 mx-auto" />
                </motion.div>
                <p className="text-white/40 font-semibold">Sélectionnez une conversation</p>
                <p className="text-white/20 text-sm mt-1">Vos messages apparaissent ici</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-border/30 flex items-center gap-3 bg-card/20">
                <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center text-xl">
                  {selected.avatar}
                </div>
                <div>
                  <p className="text-white font-medium">{selected.name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <p className="text-xs text-green-400">En ligne</p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence initial={false}>
                  {threadMsgs.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${
                        msg.from === "user"
                          ? "bg-[#3b82f6] text-white rounded-br-sm"
                          : "bg-card border border-border/30 text-white rounded-bl-sm"
                      }`}>
                        <p>{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.from === "user" ? "text-white/60" : "text-muted-foreground"}`}>
                          {msg.time}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-4 border-t border-border/30 flex gap-3">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Écrivez un message..."
                  className="flex-1 h-12 bg-card/50 border-border/30"
                />
                <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
                  <Button
                    type="submit"
                    disabled={!input.trim()}
                    className="h-12 w-12 p-0 rounded-xl bg-[#3b82f6] hover:bg-[#3b82f6]/90"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </motion.div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
