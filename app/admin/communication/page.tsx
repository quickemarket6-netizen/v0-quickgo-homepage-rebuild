"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Bell,
  Send,
  Users,
  MessageSquare,
  Phone,
  Mail,
  Smartphone,
  Gift,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  ChevronRight,
  Megaphone,
  TrendingUp,
  BarChart3,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"
import { toast } from "sonner"

const channels = [
  { id: 'push', label: 'Push', icon: Bell, color: 'text-blue-400', bgColor: 'bg-blue-500/10' },
  { id: 'email', label: 'Email', icon: Mail, color: 'text-purple-400', bgColor: 'bg-purple-500/10' },
  { id: 'sms', label: 'SMS', icon: Smartphone, color: 'text-yellow-400', bgColor: 'bg-yellow-500/10' },
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-green-400', bgColor: 'bg-green-500/10' },
  { id: 'popup', label: 'Popup', icon: Megaphone, color: 'text-pink-400', bgColor: 'bg-pink-500/10' },
]

const messageTypes = [
  { id: 'promotion', label: 'Promotion', icon: Gift },
  { id: 'order_update', label: 'Mise a jour commande', icon: CheckCircle },
  { id: 'delivery_update', label: 'Mise a jour livraison', icon: Clock },
  { id: 'alert', label: 'Alerte', icon: AlertCircle },
  { id: 'broadcast', label: 'Diffusion generale', icon: Megaphone },
]

type Campaign = {
  id: number | string
  title: string
  type: string
  channels: string[]
  sent: number
  opened: number
  clicked: number
  date: string
}

type Segment = { id: string; label: string; count: number }

type CommStats = {
  totalSent: number
  openRate: number
  clickRate: number
  activeUsers: number
}

export default function CommunicationDashboard() {
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['push'])
  const [selectedSegment, setSelectedSegment] = useState('all')
  const [selectedType, setSelectedType] = useState('promotion')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [isScheduled, setIsScheduled] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [quickModal, setQuickModal] = useState<{ type: "call" | "whatsapp" | null; phone: string }>({ type: null, phone: "" })
  const composeRef = useRef<HTMLDivElement>(null)

  const [stats, setStats] = useState<CommStats>({ totalSent: 0, openRate: 0, clickRate: 0, activeUsers: 0 })
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [segments, setSegments] = useState<Segment[]>([
    { id: 'all', label: 'Tous les utilisateurs', count: 0 },
    { id: 'clients', label: 'Clients', count: 0 },
    { id: 'vendors', label: 'Commercants', count: 0 },
    { id: 'drivers', label: 'Livreurs', count: 0 },
  ])
  const [loadingStats, setLoadingStats] = useState(true)

  async function fetchStats() {
    try {
      const res = await fetch('/api/admin/communication')
      if (!res.ok) return
      const data = await res.json()
      if (data.stats) setStats(data.stats)
      if (data.campaigns) setCampaigns(data.campaigns)
      if (data.segments) setSegments(data.segments)
    } catch { /* non-critical */ } finally {
      setLoadingStats(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  const toggleChannel = (channelId: string) => {
    setSelectedChannels(prev =>
      prev.includes(channelId)
        ? prev.filter(c => c !== channelId)
        : [...prev, channelId]
    )
  }

  const handleSend = async () => {
    if (!title || !message || selectedChannels.length === 0) {
      toast.error('Veuillez remplir tous les champs requis')
      return
    }

    setIsSending(true)
    try {
      const response = await fetch('/api/admin/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channels: selectedChannels,
          messageType: selectedType,
          title,
          content: message,
          segment: selectedSegment,
          scheduledAt: isScheduled ? scheduledDate : null,
        }),
      })

      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(isScheduled ? 'Campagne programmée !' : `Messages envoyés (${data.recipientsCount ?? 0} destinataires)`)
        setTitle('')
        setMessage('')
        fetchStats()
      } else {
        toast.error(data.error ?? "Erreur lors de l'envoi")
      }
    } catch {
      toast.error("Erreur réseau")
    } finally {
      setIsSending(false)
    }
  }

  const handleQuickCall = () => setQuickModal({ type: "call", phone: "" })
  const handleQuickWhatsApp = () => setQuickModal({ type: "whatsapp", phone: "" })

  const handleQuickEmail = () => {
    setSelectedChannels(["email"])
    composeRef.current?.scrollIntoView({ behavior: "smooth" })
    toast.info("Canal Email sélectionné dans le formulaire")
  }

  const handleQuickSMS = () => {
    setSelectedChannels(["sms"])
    composeRef.current?.scrollIntoView({ behavior: "smooth" })
    toast.info("Canal SMS sélectionné dans le formulaire")
  }

  const confirmQuickModal = () => {
    const raw = quickModal.phone.trim()
    if (!raw) return
    const digits = raw.replace(/\s/g, "").replace(/^00/, "+")
    if (quickModal.type === "call") {
      window.open(`tel:${digits}`)
    } else if (quickModal.type === "whatsapp") {
      window.open(`https://wa.me/${digits.replace(/^\+/, "")}`, "_blank")
    }
    setQuickModal({ type: null, phone: "" })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Communication</h1>
            <p className="text-[#6b6b8a]">Gérez vos notifications et campagnes marketing</p>
          </div>
          <Button className="gap-2 bg-blue-600 hover:bg-blue-500 text-white">
            <Plus className="w-4 h-4" />
            Nouvelle campagne
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Messages envoyés', value: stats.totalSent.toLocaleString(), icon: Send, color: 'text-blue-400' },
            { label: 'Taux d\'ouverture', value: `${stats.openRate}%`, icon: TrendingUp, color: 'text-green-400' },
            { label: 'Taux de clic', value: `${stats.clickRate}%`, icon: BarChart3, color: 'text-purple-400' },
            { label: 'Utilisateurs actifs', value: stats.activeUsers.toLocaleString(), icon: Users, color: 'text-blue-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.1, 0.4) }}
              className="bg-[#16161f]/50 border border-[#1e1e2e] rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-[#1e1e2e]", stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-[#6b6b8a]">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Compose Message */}
          <div className="lg:col-span-2 space-y-6">
            <div ref={composeRef} className="bg-[#16161f]/50 border border-[#1e1e2e] rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Nouveau message</h2>
              
              {/* Channels */}
              <div className="mb-6">
                <label className="text-sm text-[#6b6b8a] mb-2 block">Canaux de diffusion</label>
                <div className="flex flex-wrap gap-2">
                  {channels.map((channel, i) => (
                    <motion.button
                      key={channel.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.05, 0.4) }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleChannel(channel.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
                        selectedChannels.includes(channel.id)
                          ? `${channel.bgColor} border-current ${channel.color}`
                          : "bg-[#1e1e2e]/50 border-[#1e1e2e] text-[#6b6b8a] hover:border-[#2a2a3e]"
                      )}
                    >
                      <channel.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{channel.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Segment */}
              <div className="mb-6">
                <label className="text-sm text-[#6b6b8a] mb-2 block">Destinataires</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {segments.map((segment, i) => (
                    <motion.button
                      key={segment.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.05, 0.4) }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedSegment(segment.id)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        selectedSegment === segment.id
                          ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                          : "bg-[#1e1e2e]/50 border-[#1e1e2e] text-[#6b6b8a] hover:border-[#2a2a3e]"
                      )}
                    >
                      <p className="font-medium text-sm">{segment.label}</p>
                      <p className="text-xs opacity-70">{segment.count.toLocaleString()}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Message Type */}
              <div className="mb-6">
                <label className="text-sm text-[#6b6b8a] mb-2 block">Type de message</label>
                <div className="flex flex-wrap gap-2">
                  {messageTypes.map((type, i) => (
                    <motion.button
                      key={type.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.05, 0.4) }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedType(type.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                        selectedType === type.id
                          ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                          : "bg-[#1e1e2e]/50 border-[#1e1e2e] text-[#6b6b8a] hover:border-[#2a2a3e]"
                      )}
                    >
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Title & Message */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm text-[#6b6b8a] mb-2 block">Titre</label>
                  <Input 
                    placeholder="Ex: Promo exceptionnelle -30%!"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-[#1e1e2e]/50 border-[#1e1e2e]"
                  />
                </div>
                <div>
                  <label className="text-sm text-[#6b6b8a] mb-2 block">Message</label>
                  <textarea 
                    placeholder="Rédigez votre message ici..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-[#1e1e2e]/50 border border-[#1e1e2e] text-white placeholder:text-[#6b6b8a] focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                  />
                  <p className="text-xs text-[#6b6b8a] mt-1">{message.length}/500 caractères</p>
                </div>
              </div>

              {/* Schedule */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="w-4 h-4 rounded border-[#1e1e2e] text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-white">Programmer l&apos;envoi</span>
                </label>
                {isScheduled && (
                  <div className="mt-3">
                    <Input 
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="bg-[#1e1e2e]/50 border-[#1e1e2e] w-auto"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleSend}
                  disabled={isSending || !title || !message || selectedChannels.length === 0}
                  className="gap-2 bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isScheduled ? 'Programmer' : 'Envoyer maintenant'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowPreview(true)}
                  disabled={!title || !message}
                >
                  Aperçu
                </Button>
                <Button variant="ghost">
                  Sauvegarder brouillon
                </Button>
              </div>
            </div>

            {/* Recent Campaigns */}
            <div className="bg-[#16161f]/50 border border-[#1e1e2e] rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Campagnes récentes</h2>
                <Button variant="ghost" size="sm" className="text-blue-400">
                  Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="space-y-3">
                {campaigns.map((campaign, i) => (
                  <motion.div
                    key={campaign.id}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4) }}
                    className="p-4 rounded-lg bg-[#1e1e2e]/30 border border-[#1e1e2e] hover:border-[#2a2a3e] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-white">{campaign.title}</h3>
                        <p className="text-xs text-[#6b6b8a]">{campaign.date}</p>
                      </div>
                      <div className="flex gap-1">
                        {campaign.channels.map(ch => {
                          const channel = channels.find(c => c.id === ch)
                          if (!channel) return null
                          return (
                            <div 
                              key={ch}
                              className={cn("p-1 rounded", channel.bgColor)}
                            >
                              <channel.icon className={cn("w-3 h-3", channel.color)} />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-white">{campaign.sent.toLocaleString()}</p>
                        <p className="text-xs text-[#6b6b8a]">Envoyés</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-400">{campaign.opened.toLocaleString()}</p>
                        <p className="text-xs text-[#6b6b8a]">Ouverts</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-400">{campaign.clicked.toLocaleString()}</p>
                        <p className="text-xs text-[#6b6b8a]">Clics</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions & Templates */}
          <div className="space-y-6">
            {/* Quick Send */}
            <div className="bg-[#16161f]/50 border border-[#1e1e2e] rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Envoi rapide</h2>
              
              <div className="space-y-3">
                <QuickSendButton
                  icon={Phone}
                  label="Appeler un client"
                  description="Lancer un appel direct"
                  color="text-blue-400"
                  onClick={handleQuickCall}
                />
                <QuickSendButton
                  icon={MessageSquare}
                  label="WhatsApp"
                  description="Envoyer un message WhatsApp"
                  color="text-green-400"
                  onClick={handleQuickWhatsApp}
                />
                <QuickSendButton
                  icon={Mail}
                  label="Email"
                  description="Envoyer un email"
                  color="text-purple-400"
                  onClick={handleQuickEmail}
                />
                <QuickSendButton
                  icon={Smartphone}
                  label="SMS"
                  description="Envoyer un SMS"
                  color="text-yellow-400"
                  onClick={handleQuickSMS}
                />
              </div>
            </div>

            {/* Templates */}
            <div className="bg-[#16161f]/50 border border-[#1e1e2e] rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Templates</h2>
              
              <div className="space-y-2">
                {[
                  { name: 'Code promo', type: 'promotion' },
                  { name: 'Bienvenue', type: 'welcome' },
                  { name: 'Commande confirmee', type: 'order' },
                  { name: 'Livraison en cours', type: 'delivery' },
                  { name: 'Rappel panier', type: 'reminder' },
                ].map((template, i) => (
                  <motion.button
                    key={template.name}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.4) }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full p-3 rounded-lg bg-[#1e1e2e]/30 border border-[#1e1e2e] hover:border-blue-500/30 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white group-hover:text-blue-400 transition-colors">
                        {template.name}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#6b6b8a] group-hover:text-blue-400 transition-colors" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Support Contacts */}
            <div className="bg-[#16161f]/50 border border-[#1e1e2e] rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Contacts DL Solutions</h2>
              
              <div className="space-y-3">
                <a 
                  href="https://wa.me/237694341586"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors"
                >
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-white">+237 694 341 586</p>
                    <p className="text-xs text-[#6b6b8a]">WhatsApp Cameroun</p>
                  </div>
                </a>
                <a 
                  href="https://wa.me/237690773615"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors"
                >
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-white">+237 690 773 615</p>
                    <p className="text-xs text-[#6b6b8a]">WhatsApp Cameroun</p>
                  </div>
                </a>
                <a 
                  href="https://wa.me/41779768768"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
                >
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-white">+41 77 976 87 68</p>
                    <p className="text-xs text-[#6b6b8a]">WhatsApp Suisse</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Send Modal */}
      <AnimatePresence>
      {quickModal.type && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-6 max-w-sm w-full"
          >
            <h3 className="text-lg font-bold text-white mb-1">
              {quickModal.type === "call" ? "Appeler un client" : "WhatsApp"}
            </h3>
            <p className="text-sm text-[#6b6b8a] mb-4">
              {quickModal.type === "call"
                ? "Entrez le numéro à appeler"
                : "Entrez le numéro WhatsApp du destinataire"}
            </p>
            <Input
              placeholder="+237 6XX XXX XXX"
              value={quickModal.phone}
              onChange={(e) => setQuickModal(prev => ({ ...prev, phone: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && confirmQuickModal()}
              className="bg-[#1e1e2e]/50 border-[#1e1e2e] mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setQuickModal({ type: null, phone: "" })}
              >
                Annuler
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
                onClick={confirmQuickModal}
                disabled={!quickModal.phone.trim()}
              >
                {quickModal.type === "call" ? "Appeler" : "Ouvrir WhatsApp"}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
      {showPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-bold text-white mb-4">Aperçu du message</h3>
            
            <div className="bg-[#1e1e2e] rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-bold">Q</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-white">{title || 'Titre du message'}</p>
                  <p className="text-sm text-[#6b6b8a] mt-1">{message || 'Contenu du message...'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-[#6b6b8a]">Canaux:</span>
              {selectedChannels.map(ch => {
                const channel = channels.find(c => c.id === ch)
                if (!channel) return null
                return (
                  <span key={ch} className={cn("text-xs px-2 py-1 rounded", channel.bgColor, channel.color)}>
                    {channel.label}
                  </span>
                )
              })}
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setShowPreview(false)} variant="outline" className="flex-1">
                Fermer
              </Button>
              <Button onClick={() => { setShowPreview(false); handleSend(); }} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white">
                Envoyer
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
      </div>
    </div>
  )
}

function QuickSendButton({ 
  icon: Icon, 
  label, 
  description, 
  color, 
  onClick 
}: { 
  icon: React.ElementType
  label: string
  description: string
  color: string
  onClick: () => void
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#1e1e2e]/30 border border-[#1e1e2e] hover:border-[#2a2a3e] transition-colors text-left group"
    >
      <div className={cn("p-2 rounded-lg bg-[#1e1e2e]", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-white group-hover:text-blue-400 transition-colors">{label}</p>
        <p className="text-xs text-[#6b6b8a]">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-[#6b6b8a]" />
    </motion.button>
  )
}
