"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useState } from "react"
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
  Filter,
  X
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar/navbar"
import { Footer } from "@/components/footer/footer"

type NotificationType = "order" | "delivery" | "payment" | "promo" | "message" | "review"

interface Notification {
  id: number
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

const initialNotifications: Notification[] = [
  {
    id: 1,
    type: "delivery",
    title: "Livraison en cours",
    description: "Votre commande #QG-2024-1234 est en route. Le livreur arrivera dans 15 minutes.",
    time: "Il y a 5 min",
    read: false,
    actionUrl: "/tracking?id=QG-2024-1234",
    actionLabel: "Suivre"
  },
  {
    id: 2,
    type: "promo",
    title: "-30% sur les restaurants",
    description: "Profitez de 30% de reduction sur votre prochaine commande restaurant avec le code FOOD30.",
    time: "Il y a 1h",
    read: false,
    actionUrl: "/marketplace/offers",
    actionLabel: "Voir l'offre"
  },
  {
    id: 3,
    type: "order",
    title: "Commande confirmee",
    description: "Votre commande #QG-2024-1233 a ete confirmee et sera bientot preparee.",
    time: "Il y a 2h",
    read: true,
    actionUrl: "/marketplace/orders",
    actionLabel: "Details"
  },
  {
    id: 4,
    type: "payment",
    title: "Paiement recu",
    description: "Votre paiement de 12 500 FCFA a ete effectue avec succes via QuickGo Pay.",
    time: "Il y a 3h",
    read: true
  },
  {
    id: 5,
    type: "review",
    title: "Donnez votre avis",
    description: "Comment s'est passee votre derniere commande chez Le Gourmet ? Partagez votre experience !",
    time: "Il y a 5h",
    read: false,
    actionUrl: "#",
    actionLabel: "Noter"
  },
  {
    id: 6,
    type: "message",
    title: "Nouveau message du support",
    description: "L'equipe QuickGo a repondu a votre demande concernant votre remboursement.",
    time: "Il y a 1 jour",
    read: true,
    actionUrl: "/support",
    actionLabel: "Repondre"
  },
  {
    id: 7,
    type: "delivery",
    title: "Livraison effectuee",
    description: "Votre commande #QG-2024-1230 a ete livree avec succes. Merci de votre confiance !",
    time: "Il y a 2 jours",
    read: true
  },
  {
    id: 8,
    type: "promo",
    title: "Bienvenue sur QuickGo !",
    description: "Utilisez le code BIENVENUE pour obtenir 2 000 FCFA de reduction sur votre premiere commande.",
    time: "Il y a 3 jours",
    read: true,
    actionUrl: "/marketplace",
    actionLabel: "Commander"
  },
]

const filterOptions = [
  { id: "all", label: "Toutes" },
  { id: "unread", label: "Non lues" },
  { id: "order", label: "Commandes" },
  { id: "delivery", label: "Livraisons" },
  { id: "promo", label: "Promotions" },
  { id: "message", label: "Messages" },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [filter, setFilter] = useState("all")

  const unreadCount = notifications.filter(n => !n.read).length

  const filteredNotifications = notifications.filter(n => {
    if (filter === "all") return true
    if (filter === "unread") return !n.read
    return n.type === filter
  })

  const markAsRead = (id: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
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
                {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes vos notifications sont lues'}
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

          {/* Notifications List */}
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
                  className={`relative p-4 rounded-2xl border transition-all ${
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

          {/* Empty State */}
          {filteredNotifications.length === 0 && (
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
          {notifications.length > 0 && (
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
