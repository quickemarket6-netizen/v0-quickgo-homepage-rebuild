"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Phone,
  MessageCircle,
  Mail,
  MessageSquare,
  X,
  Send,
  Loader2,
  User,
  Building2,
  Truck,
  Headphones,
  Copy,
  CheckCircle,
  ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface ContactTarget {
  id: string
  name: string
  phone?: string
  email?: string
  type: 'customer' | 'driver' | 'vendor' | 'support' | 'admin'
  avatar?: string
}

interface QuickContactProps {
  userType: 'customer' | 'driver' | 'vendor' | 'admin'
  currentUser?: {
    name: string
    phone?: string
    email?: string
  }
  onSendMessage?: (data: {
    channel: string
    recipient: ContactTarget
    message: string
  }) => Promise<void>
  className?: string
}

// Contacts DL Solutions
const dlContacts = {
  cameroun1: { phone: "237694341586", display: "+237 694 341 586", label: "Cameroun 1" },
  cameroun2: { phone: "237690773615", display: "+237 690 773 615", label: "Cameroun 2" },
  suisse: { phone: "41779768768", display: "+41 77 976 87 68", label: "Suisse" },
  email: "support@quickgo.cm",
  websites: ["www.dlsolutionssarl.tech", "www.daveandlucesolutions.com"]
}

const channelIcons = {
  whatsapp: MessageCircle,
  sms: MessageSquare,
  call: Phone,
  email: Mail,
}

const channelColors = {
  whatsapp: "bg-green-500 hover:bg-green-600",
  sms: "bg-blue-500 hover:bg-blue-600",
  call: "bg-purple-500 hover:bg-purple-600",
  email: "bg-orange-500 hover:bg-orange-600",
}

export function QuickContact({ userType, currentUser, onSendMessage, className }: QuickContactProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeChannel, setActiveChannel] = useState<string | null>(null)
  const [message, setMessage] = useState("")
  const [recipient, setRecipient] = useState<ContactTarget | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // Contacts réels, dérivés de la commande / livraison active de
  // l'utilisateur. Le support est toujours proposé.
  const SUPPORT_CONTACT: ContactTarget = {
    id: 'support',
    name: 'Support QuickGo',
    phone: dlContacts.cameroun2.phone,
    email: dlContacts.email,
    type: 'support',
  }
  const [recipients, setRecipients] = useState<ContactTarget[]>([SUPPORT_CONTACT])

  useEffect(() => {
    const normalizePhone = (p?: string | null) => (p ? p.replace(/[^0-9]/g, "") : undefined)
    const load = async () => {
      const found: ContactTarget[] = []
      try {
        if (userType === 'customer') {
          const res = await fetch('/api/orders')
          if (res.ok) {
            const orders: Array<{
              status: string
              vendor: { name: string; phone: string | null } | null
              driver: { user: { full_name: string | null; phone: string | null } | null } | null
            }> = await res.json()
            const active = orders.find((o) => !['delivered', 'cancelled'].includes(o.status))
            if (active?.driver?.user?.phone) {
              found.push({ id: 'driver', name: `${active.driver.user.full_name ?? 'Livreur'} (Livreur)`, phone: normalizePhone(active.driver.user.phone), type: 'driver' })
            }
            if (active?.vendor?.phone) {
              found.push({ id: 'vendor', name: active.vendor.name, phone: normalizePhone(active.vendor.phone), type: 'vendor' })
            }
          }
        } else if (userType === 'driver') {
          const res = await fetch('/api/driver/active-delivery')
          if (res.ok) {
            const d = await res.json()
            const customer = d?.order?.customer ?? d?.customer
            const vendor = d?.order?.vendor ?? d?.vendor
            if (customer?.phone) found.push({ id: 'customer', name: `${customer.full_name ?? 'Client'} (Client)`, phone: normalizePhone(customer.phone), type: 'customer' })
            if (vendor?.phone) found.push({ id: 'vendor', name: vendor.name ?? 'Boutique', phone: normalizePhone(vendor.phone), type: 'vendor' })
          }
        } else if (userType === 'vendor') {
          const res = await fetch('/api/vendor/orders')
          if (res.ok) {
            const payload = await res.json()
            const orders: Array<{
              status: string
              customer: { full_name: string | null; phone: string | null } | null
              driver: { full_name: string | null; phone: string | null } | null
            }> = Array.isArray(payload) ? payload : payload.data ?? []
            const active = orders.find((o) => !['delivered', 'cancelled'].includes(o.status))
            if (active?.customer?.phone) found.push({ id: 'customer', name: `${active.customer.full_name ?? 'Client'} (Client)`, phone: normalizePhone(active.customer.phone), type: 'customer' })
            if (active?.driver?.phone) found.push({ id: 'driver', name: `${active.driver.full_name ?? 'Livreur'} (Livreur)`, phone: normalizePhone(active.driver.phone), type: 'driver' })
          }
        }
      } catch { /* pas de commande active ou non connecté — support seul */ }
      setRecipients([SUPPORT_CONTACT, ...found])
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType])

  const getRecipients = (): ContactTarget[] => recipients

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleSend = async () => {
    if (!recipient || !activeChannel) return
    
    setIsSending(true)
    
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    if (onSendMessage) {
      await onSendMessage({
        channel: activeChannel,
        recipient,
        message
      })
    }
    
    setIsSending(false)
    setSent(true)
    setTimeout(() => {
      setSent(false)
      setMessage("")
      setActiveChannel(null)
    }, 2000)
  }

  const openWhatsApp = (phone: string, msg?: string) => {
    const text = msg || message || "Bonjour, j'ai besoin d'assistance."
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank')
  }

  const openCall = (phone: string) => {
    window.open(`tel:+${phone}`, '_self')
  }

  const openSMS = (phone: string, msg?: string) => {
    const text = msg || message || ""
    window.open(`sms:+${phone}?body=${encodeURIComponent(text)}`, '_self')
  }

  const openEmail = (email: string, subject?: string, body?: string) => {
    const subj = subject || "Demande d'assistance QuickGo"
    const msg = body || message || ""
    window.open(`mailto:${email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(msg)}`, '_self')
  }

  const getTypeIcon = (type: ContactTarget['type']) => {
    switch (type) {
      case 'customer': return User
      case 'driver': return Truck
      case 'vendor': return Building2
      case 'support': return Headphones
      default: return User
    }
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full",
          "bg-gradient-to-r from-lime-500 to-green-500 text-black font-semibold",
          "shadow-lg shadow-lime-500/25 hover:shadow-lime-500/40 transition-all",
          className
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline">Contacter</span>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="fixed bottom-0 left-0 right-0 sm:bottom-6 sm:right-6 sm:left-auto sm:w-[420px] z-50 max-h-[85vh] overflow-hidden"
            >
              <div className="bg-gray-900 border border-gray-800 rounded-t-3xl sm:rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800">
                  <div>
                    <h3 className="font-bold text-lg text-white">Centre de Contact</h3>
                    <p className="text-xs text-gray-400">Choisissez comment nous contacter</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  {/* Quick DL Solutions Contacts */}
                  <div className="p-3 rounded-xl bg-gradient-to-br from-lime-500/10 to-green-500/10 border border-lime-500/20">
                    <p className="text-xs font-medium text-lime-400 mb-2">Support DL Solutions</p>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(dlContacts).filter(([key]) => key.includes('cameroun') || key === 'suisse').map(([key, value]) => (
                        <button
                          key={key}
                          onClick={() => openWhatsApp((value as any).phone)}
                          className="flex flex-col items-center gap-1 p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4 text-green-400" />
                          <span className="text-[10px] text-gray-300">{(value as any).label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recipient Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-300 mb-2 block">
                      Destinataire
                    </label>
                    <Select onValueChange={(val) => setRecipient(getRecipients().find(r => r.id === val) || null)}>
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Choisir un destinataire" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        {getRecipients().map((r) => {
                          const Icon = getTypeIcon(r.type)
                          return (
                            <SelectItem key={r.id} value={r.id}>
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-gray-400" />
                                <span>{r.name}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Channel Selection */}
                  {recipient && (
                    <div>
                      <label className="text-sm font-medium text-gray-300 mb-2 block">
                        Canal de communication
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {(['whatsapp', 'call', 'sms', 'email'] as const).map((channel) => {
                          const Icon = channelIcons[channel]
                          const isDisabled = channel === 'email' && !recipient.email
                          return (
                            <button
                              key={channel}
                              onClick={() => {
                                if (channel === 'call' && recipient.phone) {
                                  openCall(recipient.phone)
                                } else if (channel === 'whatsapp' && recipient.phone) {
                                  setActiveChannel(channel)
                                } else if (channel === 'sms' && recipient.phone) {
                                  setActiveChannel(channel)
                                } else if (channel === 'email' && recipient.email) {
                                  setActiveChannel(channel)
                                }
                              }}
                              disabled={isDisabled}
                              className={cn(
                                "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
                                activeChannel === channel
                                  ? channelColors[channel] + " text-white"
                                  : "bg-gray-800 hover:bg-gray-700 text-gray-300",
                                isDisabled && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="text-xs capitalize">{channel}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Message Input */}
                  {activeChannel && activeChannel !== 'call' && (
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Ecrivez votre message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="bg-gray-800 border-gray-700 min-h-[100px] resize-none"
                      />

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            if (activeChannel === 'whatsapp' && recipient?.phone) {
                              openWhatsApp(recipient.phone, message)
                            } else if (activeChannel === 'sms' && recipient?.phone) {
                              openSMS(recipient.phone, message)
                            } else if (activeChannel === 'email' && recipient?.email) {
                              openEmail(recipient.email, undefined, message)
                            }
                          }}
                          disabled={!message.trim()}
                          className={cn(
                            "flex-1 gap-2",
                            activeChannel === 'whatsapp' && "bg-green-500 hover:bg-green-600",
                            activeChannel === 'sms' && "bg-blue-500 hover:bg-blue-600",
                            activeChannel === 'email' && "bg-orange-500 hover:bg-orange-600"
                          )}
                        >
                          {isSending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : sent ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          {sent ? "Envoyé!" : "Envoyer"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Contact Info */}
                  {recipient && (
                    <div className="p-3 rounded-xl bg-gray-800/50 space-y-2">
                      <p className="text-xs font-medium text-gray-400">Informations de contact</p>
                      {recipient.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">+{recipient.phone}</span>
                          <button
                            onClick={() => handleCopy(recipient.phone!, 'phone')}
                            className="text-xs text-lime-400 hover:text-lime-300 flex items-center gap-1"
                          >
                            {copied === 'phone' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied === 'phone' ? 'Copié!' : 'Copier'}
                          </button>
                        </div>
                      )}
                      {recipient.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-300">{recipient.email}</span>
                          <button
                            onClick={() => handleCopy(recipient.email!, 'email')}
                            className="text-xs text-lime-400 hover:text-lime-300 flex items-center gap-1"
                          >
                            {copied === 'email' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied === 'email' ? 'Copié!' : 'Copier'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 bg-gray-900/80">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Powered by DL Solutions SARL</span>
                    <a
                      href="https://www.dlsolutionssarl.tech"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-lime-400 hover:text-lime-300"
                    >
                      dlsolutionssarl.tech
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default QuickContact
