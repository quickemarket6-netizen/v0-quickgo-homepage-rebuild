"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
  ArrowLeft, MessageSquare, Search, Send, Bell,
  Package, Truck, Store, Headphones, RefreshCw, Check, CheckCheck,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  is_read: boolean
  created_at: string
  data: Record<string, unknown> | null
}

interface Thread {
  key: string
  label: string
  icon: string
  type: "order" | "vendor" | "driver" | "system"
  notifications: Notification[]
  unread: number
  last_at: string
}

const TYPE_ICON: Record<string, string> = {
  order_confirmed: "📦",
  order_preparing: "🍳",
  order_ready: "✅",
  order_delivering: "🛵",
  order_delivered: "🎉",
  order_cancelled: "❌",
  payment_success: "💰",
  promo: "🎁",
  system: "🔔",
}

function getThreadIcon(n: Notification): string {
  return TYPE_ICON[n.type] ?? "💬"
}

function groupIntoThreads(notifs: Notification[]): Thread[] {
  const map = new Map<string, { label: string; icon: string; type: Thread["type"]; notifs: Notification[] }>()

  for (const n of notifs) {
    const orderId = n.data?.order_id as string | undefined
    let key: string
    let label: string
    let icon: string
    let type: Thread["type"]

    if (orderId) {
      key = `order:${orderId}`
      const num = (n.data?.order_number as string | undefined) ?? orderId.slice(0, 8)
      label = `Commande #${num}`
      icon = "📦"
      type = "order"
    } else if (n.type === "promo") {
      key = "promo"
      label = "Offres & Promos"
      icon = "🎁"
      type = "vendor"
    } else {
      key = "system"
      label = "Support QuickGo"
      icon = "💬"
      type = "system"
    }

    if (!map.has(key)) map.set(key, { label, icon, type, notifs: [] })
    map.get(key)!.notifs.push(n)
  }

  return Array.from(map.entries())
    .map(([key, v]) => {
      const sorted = [...v.notifs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      return {
        key,
        label: v.label,
        icon: v.icon,
        type: v.type,
        notifications: sorted,
        unread: sorted.filter((n) => !n.is_read).length,
        last_at: sorted[0]?.created_at ?? "",
      }
    })
    .sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime())
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return "À l'instant"
  if (m < 60) return `Il y a ${m} min`
  const h = Math.floor(m / 60)
  if (h < 24) return `Il y a ${h}h`
  const d = Math.floor(h / 24)
  if (d === 1) return "Hier"
  return `Il y a ${d} jours`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
}

export default function MessagesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [newMessage, setNewMessage] = useState("")
  const [localMessages, setLocalMessages] = useState<{ id: string; text: string; time: string; from: "user" }[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const r = await fetch("/api/notifications")
      if (r.ok) {
        const data: Notification[] = await r.json()
        setNotifications(data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [selectedKey, localMessages])

  const threads = groupIntoThreads(notifications)
  const filtered = threads.filter((t) =>
    t.label.toLowerCase().includes(search.toLowerCase())
  )
  const totalUnread = threads.reduce((s, t) => s + t.unread, 0)

  const selectedThread = threads.find((t) => t.key === selectedKey) ?? null

  const markRead = async (threadKey: string) => {
    const thread = threads.find((t) => t.key === threadKey)
    if (!thread) return
    const ids = thread.notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (ids.length === 0) return
    await Promise.all(
      ids.map((id) =>
        fetch(`/api/notifications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_read: true }) }).catch(() => {})
      )
    )
    setNotifications((prev) =>
      prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
    )
  }

  const handleSelectThread = (key: string) => {
    setSelectedKey(key)
    setLocalMessages([])
    markRead(key)
  }

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return
    setLocalMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: newMessage, time: new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }), from: "user" },
    ])
    setNewMessage("")
  }

  const THREAD_ICON_COMPONENT: Record<Thread["type"], typeof MessageSquare> = {
    order:  Package,
    vendor: Store,
    driver: Truck,
    system: Headphones,
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      <div className="flex flex-1 overflow-hidden max-h-screen">

        {/* Left: thread list */}
        <div className={`w-full sm:w-80 flex flex-col border-r border-[#1e1e2e] ${selectedKey ? "hidden sm:flex" : "flex"}`}>
          {/* Header */}
          <div className="p-4 border-b border-[#1e1e2e] bg-[#0a0a0f]">
            <div className="flex items-center gap-3 mb-3">
              <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <ArrowLeft className="w-4 h-4 text-white/40" />
              </Link>
              <h1 className="text-white font-bold text-lg flex-1">Messages</h1>
              <div className="flex items-center gap-2">
                {totalUnread > 0 && (
                  <span className="bg-[#3b82f6] text-white text-xs px-2 py-0.5 rounded-full font-semibold">{totalUnread}</span>
                )}
                <button onClick={fetchNotifications} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <RefreshCw className={`w-4 h-4 text-white/30 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="pl-10 h-10 bg-[#16161f] border-[#1e1e2e] text-white placeholder:text-white/20 rounded-xl" />
            </div>
          </div>

          {/* Thread list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#16161f] animate-pulse shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-32 bg-[#16161f] animate-pulse rounded" />
                      <div className="h-2.5 w-48 bg-[#16161f] animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="w-10 h-10 mx-auto text-white/10 mb-3" />
                <p className="text-white/30 text-sm">Aucun message</p>
              </div>
            ) : (
              filtered.map((thread) => {
                const IconComp = THREAD_ICON_COMPONENT[thread.type]
                const latest = thread.notifications[0]
                return (
                  <button key={thread.key} onClick={() => handleSelectThread(thread.key)}
                    className={`w-full flex items-center gap-3 p-4 border-b border-[#1e1e2e]/60 text-left transition-colors ${
                      selectedKey === thread.key ? "bg-[#3b82f6]/10 border-l-2 border-l-[#3b82f6]" : "hover:bg-[#16161f]/50"
                    }`}>
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl bg-[#16161f] flex items-center justify-center text-xl border border-[#1e1e2e]">
                        {thread.icon}
                      </div>
                      {thread.unread > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#3b82f6] rounded-full flex items-center justify-center text-[9px] text-white font-bold">
                          {thread.unread > 9 ? "9+" : thread.unread}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-sm truncate font-medium ${thread.unread > 0 ? "text-white" : "text-white/70"}`}>{thread.label}</span>
                        <span className="text-white/30 text-[10px] shrink-0 ml-2">{formatRelative(thread.last_at)}</span>
                      </div>
                      <p className={`text-xs truncate ${thread.unread > 0 ? "text-white/60" : "text-white/30"}`}>
                        {latest?.title ?? "Aucun message"}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Support button */}
          <div className="p-4 border-t border-[#1e1e2e]">
            <Link href="/support"
              className="flex items-center gap-3 p-3 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/20 hover:bg-[#3b82f6]/15 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-[#3b82f6]/20 flex items-center justify-center shrink-0">
                <Headphones className="w-4 h-4 text-[#3b82f6]" />
              </div>
              <div>
                <p className="text-white text-xs font-semibold">Contacter le support</p>
                <p className="text-white/30 text-[10px]">Disponible 24h/24</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Right: chat pane */}
        <div className={`flex-1 flex flex-col ${selectedKey ? "flex" : "hidden sm:flex"}`}>
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Bell className="w-16 h-16 mx-auto text-white/10 mb-4" />
                <p className="text-white/40 font-semibold">Sélectionnez une conversation</p>
                <p className="text-white/20 text-sm mt-1">Vos notifications et messages apparaissent ici</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-[#1e1e2e] bg-[#0a0a0f] flex items-center gap-3">
                <button onClick={() => setSelectedKey(null)} className="sm:hidden p-2 hover:bg-white/5 rounded-full transition-colors">
                  <ArrowLeft className="w-4 h-4 text-white/40" />
                </button>
                <div className="w-10 h-10 rounded-xl bg-[#16161f] flex items-center justify-center text-lg border border-[#1e1e2e]">
                  {selectedThread.icon}
                </div>
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{selectedThread.label}</p>
                  <p className="text-[#22c55e] text-xs">En ligne</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0a0a0f]">
                <AnimatePresence initial={false}>
                  {selectedThread.notifications.slice().reverse().map((n) => (
                    <motion.div key={n.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start">
                      <div className="max-w-xs lg:max-w-md">
                        <div className="flex items-start gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#16161f] border border-[#1e1e2e] flex items-center justify-center text-sm shrink-0 mt-0.5">
                            {getThreadIcon(n)}
                          </div>
                          <div className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl rounded-tl-sm px-4 py-2.5">
                            <p className="text-white text-xs font-semibold mb-0.5">{n.title}</p>
                            {n.body && <p className="text-white/60 text-xs">{n.body}</p>}
                            <div className="flex items-center gap-1 mt-1.5">
                              <p className="text-white/25 text-[10px]">{formatTime(n.created_at)}</p>
                              {n.is_read
                                ? <CheckCheck className="w-3 h-3 text-[#3b82f6]" />
                                : <Check className="w-3 h-3 text-white/20" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {localMessages.map((msg) => (
                    <motion.div key={msg.id}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="flex justify-end">
                      <div className="max-w-xs lg:max-w-md bg-[#3b82f6] rounded-2xl rounded-br-sm px-4 py-2.5">
                        <p className="text-white text-xs">{msg.text}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <p className="text-white/60 text-[10px]">{msg.time}</p>
                          <CheckCheck className="w-3 h-3 text-white/60" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend}
                className="p-4 border-t border-[#1e1e2e] flex gap-3 bg-[#0a0a0f]">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez un message..."
                  className="flex-1 h-12 bg-[#16161f] border-[#1e1e2e] text-white placeholder:text-white/20 rounded-xl focus:border-[#3b82f6]/50" />
                <Button type="submit" disabled={!newMessage.trim()}
                  className="h-12 w-12 p-0 rounded-xl bg-[#3b82f6] hover:bg-[#3b82f6]/90 shrink-0">
                  <Send className="w-5 h-5" />
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
