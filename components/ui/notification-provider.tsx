"use client"

import { useState, useEffect, createContext, useContext, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell,
  X,
  Gift,
  Truck,
  ShoppingBag,
  AlertTriangle,
  Info,
  CheckCircle,
  MessageCircle,
  Volume2,
  VolumeX,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type NotificationType = 'promo' | 'delivery' | 'order' | 'alert' | 'info' | 'success' | 'message'

export interface PushNotification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    url?: string
    onClick?: () => void
  }
  data?: Record<string, any>
}

interface NotificationContextType {
  notifications: PushNotification[]
  unreadCount: number
  addNotification: (notification: Omit<PushNotification, 'id' | 'timestamp' | 'read'>) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearNotification: (id: string) => void
  clearAll: () => void
  soundEnabled: boolean
  toggleSound: () => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider')
  }
  return context
}

// Notification sound
const playNotificationSound = () => {
  try {
    const audio = new Audio('/sounds/notification.mp3')
    audio.volume = 0.5
    audio.play().catch(() => {})
  } catch (e) {
    // Sound not available
  }
}

const typeConfig: Record<NotificationType, { icon: any; color: string; bgColor: string }> = {
  promo: { icon: Gift, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  delivery: { icon: Truck, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  order: { icon: ShoppingBag, color: 'text-lime-400', bgColor: 'bg-lime-500/20' },
  alert: { icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  info: { icon: Info, color: 'text-cyan-400', bgColor: 'bg-cyan-500/20' },
  success: { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/20' },
  message: { icon: MessageCircle, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<PushNotification[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showToast, setShowToast] = useState<PushNotification | null>(null)

  const addNotification = useCallback((notification: Omit<PushNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: PushNotification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    }
    
    setNotifications(prev => [newNotification, ...prev])
    setShowToast(newNotification)
    
    if (soundEnabled) {
      playNotificationSound()
    }

    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      setShowToast(null)
    }, 5000)
  }, [soundEnabled])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const toggleSound = useCallback(() => {
    setSoundEnabled(prev => !prev)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  // Simulate incoming notifications for demo
  useEffect(() => {
    const demoNotifications = [
      {
        type: 'promo' as const,
        title: 'Offre Flash!',
        message: '-25% sur toutes les livraisons pendant 2h!',
        action: { label: 'Voir', url: '/marketplace' }
      },
      {
        type: 'delivery' as const,
        title: 'Livraison en cours',
        message: 'Votre livreur Paul arrive dans 10 minutes',
      },
      {
        type: 'order' as const,
        title: 'Commande confirmee',
        message: 'Votre commande #QG-2024-1234 est en preparation',
      },
    ]

    // Add demo notification after 10 seconds
    const timer = setTimeout(() => {
      const randomNotif = demoNotifications[Math.floor(Math.random() * demoNotifications.length)]
      addNotification(randomNotif)
    }, 10000)

    return () => clearTimeout(timer)
  }, [addNotification])

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotification,
      clearAll,
      soundEnabled,
      toggleSound,
    }}>
      {children}
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -50, x: 50 }}
            className="fixed top-4 right-4 z-[100] max-w-sm"
          >
            <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    typeConfig[showToast.type].bgColor
                  )}>
                    {(() => {
                      const Icon = typeConfig[showToast.type].icon
                      return <Icon className={cn("w-5 h-5", typeConfig[showToast.type].color)} />
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm">{showToast.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{showToast.message}</p>
                    {showToast.action && (
                      <button
                        onClick={() => {
                          if (showToast.action?.url) {
                            window.location.href = showToast.action.url
                          }
                          showToast.action?.onClick?.()
                          setShowToast(null)
                        }}
                        className="mt-2 text-xs font-medium text-lime-400 hover:text-lime-300"
                      >
                        {showToast.action.label} →
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowToast(null)}
                    className="p-1 hover:bg-gray-800 rounded"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
              {/* Progress bar */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
                className={cn("h-1", typeConfig[showToast.type].bgColor.replace('/20', ''))}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  )
}

// Notification Bell Component
export function NotificationBell({ className }: { className?: string }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, soundEnabled, toggleSound } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-400" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-3 border-b border-gray-800">
                <h3 className="font-semibold text-white">Notifications</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSound}
                    className="p-1.5 hover:bg-gray-800 rounded-lg"
                    title={soundEnabled ? 'Couper le son' : 'Activer le son'}
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4 text-gray-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-lime-400 hover:text-lime-300"
                    >
                      Tout marquer lu
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Aucune notification</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const config = typeConfig[notif.type]
                    const Icon = config.icon
                    return (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                          "p-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer",
                          !notif.read && "bg-gray-800/30"
                        )}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("p-1.5 rounded-lg", config.bgColor)}>
                            <Icon className={cn("w-4 h-4", config.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={cn(
                                "font-medium text-sm",
                                notif.read ? "text-gray-400" : "text-white"
                              )}>
                                {notif.title}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  clearNotification(notif.id)
                                }}
                                className="p-1 hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100"
                              >
                                <X className="w-3 h-3 text-gray-500" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-[10px] text-gray-600 mt-1">
                              {new Date(notif.timestamp).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-lime-500 rounded-full mt-1" />
                          )}
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-2 border-t border-gray-800">
                  <button
                    onClick={() => {
                      setIsOpen(false)
                      window.location.href = '/notifications'
                    }}
                    className="w-full py-2 text-xs text-center text-lime-400 hover:text-lime-300 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    Voir toutes les notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationProvider
