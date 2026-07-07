"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Bell,
  Package,
  Megaphone,
  Gift,
  Search,
  CheckCircle,
  Loader2,
  Inbox,
} from "lucide-react"

// In-app notification feed (public.notifications). This is the operational feed
// drivers actually receive: order assigned, delivery confirmed, cash remittance,
// plus admin broadcasts fanned out here — not the push_notifications delivery log.
interface DriverNotification {
  id: string
  title: string
  body: string
  is_read: boolean
  created_at: string
  data: { type?: string; broadcast_id?: string } | null
}

const TYPE_ICONS: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  order:     { icon: Package,   color: "text-blue-400",   bg: "bg-blue-500/10"   },
  broadcast: { icon: Megaphone, color: "text-purple-400", bg: "bg-purple-500/10" },
  promotion: { icon: Gift,      color: "text-yellow-400", bg: "bg-yellow-500/10" },
  default:   { icon: Bell,      color: "text-primary",    bg: "bg-primary/10"    },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)  return "À l'instant"
  if (mins < 60) return `Il y a ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)  return `Il y a ${hrs}h`
  return `Il y a ${Math.floor(hrs / 24)} j`
}

export default function DriverMessagesPage() {
  const [notifications, setNotifications] = useState<DriverNotification[]>([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState("")
  const [selected, setSelected]           = useState<DriverNotification | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, is_read, created_at, data")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      setNotifications((data as DriverNotification[]) ?? [])
      setLoading(false)
    }

    load()

    // Subscribe to new notifications
    supabase.auth.getUser().then((res: { data: { user: { id: string } | null } }) => {
      const u = res.data.user
      if (!u) return
      supabase
        .channel("driver_notifs")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${u.id}` },
          (payload: { new: unknown }) => {
            setNotifications(prev => [payload.new as DriverNotification, ...prev])
          },
        )
        .subscribe()
    })
  }, [])

  const markRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const filtered = notifications.filter(n =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || (n.body ?? "").toLowerCase().includes(search.toLowerCase())
  )
  const unread = notifications.filter(n => !n.is_read).length

  const handleSelect = (n: DriverNotification) => {
    setSelected(n)
    if (!n.is_read) markRead(n.id)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/30 px-4 lg:px-6 py-4">
        <div className="flex items-center gap-4 max-w-4xl mx-auto">
          <Link href="/driver/dashboard">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">Messages</h1>
            {unread > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-semibold">
                {unread}
              </span>
            )}
          </div>
          {unread > 0 && (
            <Button variant="ghost" size="sm" className="ml-auto text-primary" onClick={markAllRead}>
              <CheckCircle className="w-4 h-4 mr-1" />
              Tout lire
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher dans les messages…"
            className="pl-10 h-11"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24"
          >
            <Inbox className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {search ? "Aucun message correspondant" : "Aucun message pour l'instant"}
            </p>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-4">
            {/* List */}
            <div className="lg:col-span-2 space-y-2">
              {filtered.map((n, i) => {
                const typeKey  = n.data?.type ?? "default"
                const meta     = TYPE_ICONS[typeKey] ?? TYPE_ICONS.default
                const Icon     = meta.icon
                const isActive = selected?.id === n.id
                return (
                  <motion.button
                    key={n.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => handleSelect(n)}
                    className={`w-full text-left flex items-start gap-3 p-4 rounded-2xl border transition-all ${
                      isActive
                        ? "bg-primary/10 border-primary/30"
                        : "bg-card border-border/50 hover:border-primary/20"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.bg}`}>
                      <Icon className={`w-5 h-5 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className={`text-sm font-semibold truncate ${!n.is_read ? "text-foreground" : "text-muted-foreground"}`}>
                          {n.title}
                        </p>
                        {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                  </motion.button>
                )
              })}
            </div>

            {/* Detail pane */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {selected ? (
                  <motion.div
                    key={selected.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-card rounded-2xl border border-border/50 p-6"
                  >
                    {(() => {
                      const typeKey = selected.data?.type ?? "default"
                      const meta    = TYPE_ICONS[typeKey] ?? TYPE_ICONS.default
                      const Icon    = meta.icon
                      return (
                        <>
                          <div className="flex items-center gap-3 mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${meta.bg}`}>
                              <Icon className={`w-6 h-6 ${meta.color}`} />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{selected.title}</p>
                              <p className="text-xs text-muted-foreground">{timeAgo(selected.created_at)}</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{selected.body}</p>
                        </>
                      )
                    })()}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hidden lg:flex items-center justify-center h-48 rounded-2xl bg-card border border-border/50"
                  >
                    <p className="text-muted-foreground text-sm">Sélectionnez un message</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
