"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Package,
  Truck,
  Gift,
  AlertTriangle,
  CheckCircle,
  Info,
  Phone,
  MessageCircle,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type PopupType = 'info' | 'success' | 'warning' | 'error' | 'promotion' | 'order' | 'delivery'

export interface PopupNotification {
  id: string
  type: PopupType
  title: string
  message: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  secondaryAction?: {
    label: string
    onClick?: () => void
    href?: string
  }
  image?: string
  duration?: number // ms, 0 = persistent
  sound?: boolean
  vibrate?: boolean
}

const typeConfig: Record<PopupType, { icon: React.ElementType; color: string; bgColor: string }> = {
  info: { icon: Info, color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/30' },
  success: { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/10 border-green-500/30' },
  warning: { icon: AlertTriangle, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/30' },
  error: { icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/30' },
  promotion: { icon: Gift, color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/30' },
  order: { icon: Package, color: 'text-lime-400', bgColor: 'bg-lime-500/10 border-lime-500/30' },
  delivery: { icon: Truck, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10 border-cyan-500/30' }
}

interface PopupNotificationProps {
  notification: PopupNotification
  onClose: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

function SinglePopup({ notification, onClose, position = 'top-right' }: PopupNotificationProps) {
  const config = typeConfig[notification.type]
  const Icon = config.icon

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => onClose(notification.id), notification.duration)
      return () => clearTimeout(timer)
    }
  }, [notification.id, notification.duration, onClose])

  useEffect(() => {
    // Play sound if enabled
    if (notification.sound) {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {})
    }
    
    // Vibrate if enabled and supported
    if (notification.vibrate && navigator.vibrate) {
      navigator.vibrate([200, 100, 200])
    }
  }, [notification.sound, notification.vibrate])

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className={cn(
        "fixed z-[100] max-w-sm w-full mx-4 sm:mx-0",
        positionClasses[position]
      )}
    >
      <div className={cn(
        "rounded-xl border p-4 shadow-2xl backdrop-blur-xl",
        config.bgColor,
        "bg-gray-900/95"
      )}>
        <div className="flex items-start gap-3">
          <div className={cn("p-2 rounded-lg", config.bgColor)}>
            <Icon className={cn("w-5 h-5", config.color)} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-foreground text-sm">{notification.title}</h4>
              <button 
                onClick={() => onClose(notification.id)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
              {notification.message}
            </p>

            {notification.image && (
              <div className="mt-3 rounded-lg overflow-hidden">
                <img 
                  src={notification.image} 
                  alt="" 
                  className="w-full h-24 object-cover"
                />
              </div>
            )}

            {(notification.action || notification.secondaryAction) && (
              <div className="flex items-center gap-2 mt-3">
                {notification.action && (
                  notification.action.href ? (
                    <a href={notification.action.href} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="h-8 text-xs gap-1">
                        {notification.action.label}
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </a>
                  ) : (
                    <Button 
                      size="sm" 
                      className="h-8 text-xs"
                      onClick={notification.action.onClick}
                    >
                      {notification.action.label}
                    </Button>
                  )
                )}
                {notification.secondaryAction && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-8 text-xs"
                    onClick={notification.secondaryAction.onClick}
                  >
                    {notification.secondaryAction.label}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar for timed notifications */}
        {notification.duration && notification.duration > 0 && (
          <motion.div 
            className="absolute bottom-0 left-0 h-1 bg-lime-500 rounded-b-xl"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: notification.duration / 1000, ease: 'linear' }}
          />
        )}
      </div>
    </motion.div>
  )
}

// Notification Manager Hook
export function usePopupNotifications() {
  const [notifications, setNotifications] = useState<PopupNotification[]>([])

  const showNotification = useCallback((notification: Omit<PopupNotification, 'id'>) => {
    const id = `popup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setNotifications(prev => [...prev, { ...notification, id }])
    return id
  }, [])

  const closeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  // Pre-built notification types
  const notify = {
    success: (title: string, message: string, options?: Partial<PopupNotification>) => 
      showNotification({ type: 'success', title, message, duration: 5000, ...options }),
    
    error: (title: string, message: string, options?: Partial<PopupNotification>) => 
      showNotification({ type: 'error', title, message, duration: 8000, ...options }),
    
    warning: (title: string, message: string, options?: Partial<PopupNotification>) => 
      showNotification({ type: 'warning', title, message, duration: 6000, ...options }),
    
    info: (title: string, message: string, options?: Partial<PopupNotification>) => 
      showNotification({ type: 'info', title, message, duration: 5000, ...options }),
    
    promotion: (title: string, message: string, code?: string) => 
      showNotification({ 
        type: 'promotion', 
        title, 
        message,
        duration: 0, // Persistent
        action: code ? { label: `Copier: ${code}`, onClick: () => navigator.clipboard.writeText(code) } : undefined,
        sound: true
      }),
    
    orderUpdate: (orderId: string, status: string, message: string) => 
      showNotification({ 
        type: 'order', 
        title: `Commande #${orderId}`, 
        message: `${status}: ${message}`,
        duration: 8000,
        action: { label: 'Voir details', href: `/orders/${orderId}` }
      }),
    
    deliveryUpdate: (driverName: string, eta: string, phone?: string) => 
      showNotification({ 
        type: 'delivery', 
        title: 'Livraison en cours', 
        message: `${driverName} arrive dans ${eta}`,
        duration: 0,
        action: phone ? { label: 'Appeler', href: `tel:${phone}` } : undefined,
        secondaryAction: phone ? { 
          label: 'WhatsApp', 
          href: `https://wa.me/237${phone.replace(/\D/g, '')}`
        } : undefined,
        sound: true,
        vibrate: true
      })
  }

  return { notifications, showNotification, closeNotification, clearAll, notify }
}

// Notification Container Component
interface NotificationContainerProps {
  notifications: PopupNotification[]
  onClose: (id: string) => void
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
  maxVisible?: number
}

export function NotificationContainer({ 
  notifications, 
  onClose, 
  position = 'top-right',
  maxVisible = 3 
}: NotificationContainerProps) {
  const visibleNotifications = notifications.slice(-maxVisible)

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      <AnimatePresence mode="sync">
        {visibleNotifications.map((notification, index) => (
          <div 
            key={notification.id}
            className="pointer-events-auto"
            style={{ 
              transform: `translateY(${index * 10}px)`,
              zIndex: 100 - index 
            }}
          >
            <SinglePopup
              notification={notification}
              onClose={onClose}
              position={position}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Quick Contact Popup
interface QuickContactPopupProps {
  isOpen: boolean
  onClose: () => void
  contactName: string
  contactPhone: string
  contactType: 'driver' | 'vendor' | 'support' | 'customer'
}

export function QuickContactPopup({ 
  isOpen, 
  onClose, 
  contactName, 
  contactPhone,
  contactType 
}: QuickContactPopupProps) {
  const formattedPhone = contactPhone.replace(/\D/g, '')
  const whatsappPhone = formattedPhone.startsWith('237') ? formattedPhone : `237${formattedPhone}`

  const contactLabels = {
    driver: 'Votre livreur',
    vendor: 'Le vendeur',
    support: 'Support QuickGo',
    customer: 'Le client'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
            onClick={onClose}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-[100]"
          >
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground">Contacter {contactLabels[contactType]}</h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-lime-500/20 flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl font-bold text-lime-400">
                    {contactName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <p className="font-semibold text-foreground">{contactName}</p>
                <p className="text-sm text-muted-foreground">{contactPhone}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <a 
                  href={`tel:+237${formattedPhone}`}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
                >
                  <Phone className="w-6 h-6 text-blue-400" />
                  <span className="text-xs text-blue-400 font-medium">Appeler</span>
                </a>
                
                <a 
                  href={`https://wa.me/${whatsappPhone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors"
                >
                  <MessageCircle className="w-6 h-6 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">WhatsApp</span>
                </a>
                
                <a 
                  href={`sms:+237${formattedPhone}`}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-colors"
                >
                  <MessageCircle className="w-6 h-6 text-purple-400" />
                  <span className="text-xs text-purple-400 font-medium">SMS</span>
                </a>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default NotificationContainer
