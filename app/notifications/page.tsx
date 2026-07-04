"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useState, useEffect, useCallback } from "react"
import {
  Bell,
  Package,
  Truck,
  CreditCard,
  Gift,
  MessageSquare,
  Star,
  CheckCircle2,
  Clock,
  ChevronRight,
  Settings,
  Trash2,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer/footer"

type NotificationType = "order" | "delivery" | "payment" | "promo" | "message" | "review"

interface ApiNotification {
  id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
  type?: NotificationType
  action_url?: string
  action_label?: string
}

interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string
  time: string
  read: boolean
  actionUrl?: string
  actionLabel?: string
}

const notificationIcons: Record<NotificationType, typeof Package> = {
  order: Package,
  delivery: Truck,
  payment: CreditCard,
  promo: Gift,
  message: MessageSquare,
  review: Star,
}

const notificationColors: Record<NotificationType, string> = {
  order: "bg-blue-500/20 text-blue-400",
  delivery: "bg-quickgo-lime/20 text-quickgo-lime",
  payment: "bg-purple-500/20 text-purple-400",
  promo: "bg-orange-500/20 text-orange-400",
  message: "bg-cyan-500/20 text-cyan-400",
  review: "bg-yellow-500/20 text-yellow-400",
}

const filterOptions = [
  { id: "all", label: "Toutes" },
  { id: "unread", label: "Non lues" },
  { id: "order", label: "Commandes" },
  { id: "delivery", label: "Livraisons" },
  { id: "promo", label: "Promotions" },
  { id: "message", label: "Messages" },
]

function formatRelativeTime(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 1) return "À l'instant"
  if (minutes < 60) return `Il y a ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Il y a ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return "Il y a 1 jour"
  return `Il y a ${days} jours`
}

function mapApiNotification(n: ApiNotification): Notification {
  return {
    id: n.id,
    type: n.type ?? "message",
    title: n.title,
    description: n.message,
    time: formatRelativeTime(n.created_at),
    read: n.is_read,
    actionUrl: n.action_url,
    actionLabel: n.action_label,
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState("all")

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const res = await fetch("/api/notifications")
      if (!res.ok) throw new Error("Erreur de chargement")
      const data: ApiNotification[] = await res.json()
      setNotifications(data.map(mapApiNotification))
    } catch {
      setLoadError("Impossible de charger les notifications")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const unreadCount = notifications.filter(n => !n.read).length

  const filteredNotifications = notifications.filter(n => {
    if (filter === "all") return true
    if (filter === "unread") return !n.read
    return n.type === filter
  })

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_read: true }),
    })
  }

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "all" }),
    })
  }

  const deleteNotification = async (id: string) => {
    const prev = notifications
    setNotifications(cur => cur.filter(n => n.id !== id))
    const res = await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null)
    if (!res || !res.ok) setNotifications(prev) // rollback on failure
  }

  const clearAll = async () => {
    const prev = notifications
    setNotifications([])
    const res = await fetch("/api/notifications", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: "all" }),
    }).catch(() => null)
    if (!res || !res.ok) setNotifications(prev) // rollback on failure
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                Notifications
              </h1>
              <p className="text-muted-foreground">
                {isLoading
                  ? "Chargement..."
                  : unreadCount > 0
                    ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                    : "Toutes vos notifications sont lues"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead} className="hidden sm:flex">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Tout marquer lu
                </Button>
              )}
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide"
          >
            {filterOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setFilter(option.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                  filter === option.id
                    ? "bg-quickgo-blue text-white"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-quickgo-blue/50"
                }`}
              >
                {option.label}
                {option.id === "unread" && unreadCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-white/20 text-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </motion.div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground text-sm">Chargement des notifications...</p>
            </div>
          )}

          {/* Error state */}
          {!isLoading && loadError && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <p className="text-muted-foreground">{loadError}</p>
              <Button variant="outline" onClick={loadNotifications}>
                Réessayer
              </Button>
            </div>
          )}

          {/* Notifications List */}
          {!isLoading && !loadError && (
            <div className="space-y-4">
              {filteredNotifications.map((notification, index) => {
                const Icon = notificationIcons[notification.type]
                const colorClass = notificationColors[notification.type]

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${
                      notification.read
                        ? "bg-card border-border"
                        : "bg-quickgo-blue/5 border-quickgo-blue/30"
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    {!notification.read && (
                      <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-quickgo-blue" />
                    )}

                    <div className="flex gap-4">
                      <div className={`shrink-0 w-12 h-12 rounded-xl ${colorClass} flex items-center justify-center`}>
                        <Icon className="w-6 h-6" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <h3 className="font-semibold text-foreground">{notification.title}</h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteNotification(notification.id)
                            }}
                            className="shrink-0 p-1 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3">
                          {notification.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {notification.time}
                          </span>

                          {notification.actionUrl && (
                            <Link href={notification.actionUrl}>
                              <Button size="sm" variant="ghost" className="text-quickgo-blue hover:text-quickgo-blue hover:bg-quickgo-blue/10">
                                {notification.actionLabel}
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !loadError && filteredNotifications.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Aucune notification
              </h3>
              <p className="text-muted-foreground mb-6">
                {filter === "all"
                  ? "Vous n'avez pas encore de notifications"
                  : "Aucune notification dans cette categorie"
                }
              </p>
              {filter !== "all" && (
                <Button variant="outline" onClick={() => setFilter("all")}>
                  Voir toutes les notifications
                </Button>
              )}
            </motion.div>
          )}

          {/* Clear All */}
          {!isLoading && !loadError && notifications.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 text-center"
            >
              <Button variant="ghost" className="text-muted-foreground hover:text-red-500" onClick={clearAll}>
                <Trash2 className="w-4 h-4 mr-2" />
                Effacer toutes les notifications
              </Button>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
