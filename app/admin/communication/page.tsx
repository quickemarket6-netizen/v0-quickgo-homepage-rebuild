"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
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
  Filter,
  Plus,
  ChevronRight,
  Megaphone,
  TrendingUp,
  BarChart3,
  Calendar,
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

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Communication</h1>
            <p className="text-muted-foreground">Gerez vos notifications et campagnes marketing</p>
          </div>
          <Button className="gap-2 bg-lime-500 hover:bg-lime-600 text-black">
            <Plus className="w-4 h-4" />
            Nouvelle campagne
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Messages envoyes', value: stats.totalSent.toLocaleString(), icon: Send, color: 'text-blue-400' },
            { label: 'Taux d\'ouverture', value: `${stats.openRate}%`, icon: TrendingUp, color: 'text-green-400' },
            { label: 'Taux de clic', value: `${stats.clickRate}%`, icon: BarChart3, color: 'text-purple-400' },
            { label: 'Utilisateurs actifs', value: stats.activeUsers.toLocaleString(), icon: Users, color: 'text-lime-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-gray-900/50 border border-gray-800 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-gray-800", stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Compose Message */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Nouveau message</h2>
              
              {/* Channels */}
              <div className="mb-6">
                <label className="text-sm text-muted-foreground mb-2 block">Canaux de diffusion</label>
                <div className="flex flex-wrap gap-2">
                  {channels.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => toggleChannel(channel.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
                        selectedChannels.includes(channel.id)
                          ? `${channel.bgColor} border-current ${channel.color}`
                          : "bg-gray-800/50 border-gray-700 text-muted-foreground hover:border-gray-600"
                      )}
                    >
                      <channel.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{channel.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Segment */}
              <div className="mb-6">
                <label className="text-sm text-muted-foreground mb-2 block">Destinataires</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {segments.map(segment => (
                    <button
                      key={segment.id}
                      onClick={() => setSelectedSegment(segment.id)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all",
                        selectedSegment === segment.id
                          ? "bg-lime-500/10 border-lime-500/50 text-lime-400"
                          : "bg-gray-800/50 border-gray-700 text-muted-foreground hover:border-gray-600"
                      )}
                    >
                      <p className="font-medium text-sm">{segment.label}</p>
                      <p className="text-xs opacity-70">{segment.count.toLocaleString()}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Type */}
              <div className="mb-6">
                <label className="text-sm text-muted-foreground mb-2 block">Type de message</label>
                <div className="flex flex-wrap gap-2">
                  {messageTypes.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedType(type.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                        selectedType === type.id
                          ? "bg-lime-500/10 border-lime-500/50 text-lime-400"
                          : "bg-gray-800/50 border-gray-700 text-muted-foreground hover:border-gray-600"
                      )}
                    >
                      <type.icon className="w-4 h-4" />
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title & Message */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Titre</label>
                  <Input 
                    placeholder="Ex: Promo exceptionnelle -30%!"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="bg-gray-800/50 border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Message</label>
                  <textarea 
                    placeholder="Redigez votre message ici..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-lime-500/50 resize-none"
                  />
                  <p className="text-xs text-muted-foreground mt-1">{message.length}/500 caracteres</p>
                </div>
              </div>

              {/* Schedule */}
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-600 text-lime-500 focus:ring-lime-500"
                  />
                  <span className="text-sm text-foreground">Programmer l&apos;envoi</span>
                </label>
                {isScheduled && (
                  <div className="mt-3">
                    <Input 
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className="bg-gray-800/50 border-gray-700 w-auto"
                    />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button 
                  onClick={handleSend}
                  disabled={isSending || !title || !message || selectedChannels.length === 0}
                  className="gap-2 bg-lime-500 hover:bg-lime-600 text-black"
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
                  Apercu
                </Button>
                <Button variant="ghost">
                  Sauvegarder brouillon
                </Button>
              </div>
            </div>

            {/* Recent Campaigns */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Campagnes recentes</h2>
                <Button variant="ghost" size="sm" className="text-lime-400">
                  Voir tout <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="space-y-3">
                {campaigns.map(campaign => (
                  <div 
                    key={campaign.id}
                    className="p-4 rounded-lg bg-gray-800/30 border border-gray-800 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-foreground">{campaign.title}</h3>
                        <p className="text-xs text-muted-foreground">{campaign.date}</p>
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
                        <p className="text-lg font-bold text-foreground">{campaign.sent.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Envoyes</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-green-400">{campaign.opened.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Ouverts</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-lime-400">{campaign.clicked.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">Clics</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions & Templates */}
          <div className="space-y-6">
            {/* Quick Send */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Envoi rapide</h2>
              
              <div className="space-y-3">
                <QuickSendButton
                  icon={Phone}
                  label="Appeler un client"
                  description="Lancer un appel direct"
                  color="text-blue-400"
                  onClick={() => {}}
                />
                <QuickSendButton
                  icon={MessageSquare}
                  label="WhatsApp"
                  description="Envoyer un message WhatsApp"
                  color="text-green-400"
                  onClick={() => {}}
                />
                <QuickSendButton
                  icon={Mail}
                  label="Email"
                  description="Envoyer un email"
                  color="text-purple-400"
                  onClick={() => {}}
                />
                <QuickSendButton
                  icon={Smartphone}
                  label="SMS"
                  description="Envoyer un SMS"
                  color="text-yellow-400"
                  onClick={() => {}}
                />
              </div>
            </div>

            {/* Templates */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Templates</h2>
              
              <div className="space-y-2">
                {[
                  { name: 'Code promo', type: 'promotion' },
                  { name: 'Bienvenue', type: 'welcome' },
                  { name: 'Commande confirmee', type: 'order' },
                  { name: 'Livraison en cours', type: 'delivery' },
                  { name: 'Rappel panier', type: 'reminder' },
                ].map(template => (
                  <button
                    key={template.name}
                    className="w-full p-3 rounded-lg bg-gray-800/30 border border-gray-700 hover:border-lime-500/50 transition-colors text-left group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground group-hover:text-lime-400 transition-colors">
                        {template.name}
                      </span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-lime-400 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Support Contacts */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-bold text-foreground mb-4">Contacts DL Solutions</h2>
              
              <div className="space-y-3">
                <a 
                  href="https://wa.me/237694341586"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors"
                >
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium text-foreground">+237 694 341 586</p>
                    <p className="text-xs text-muted-foreground">WhatsApp Cameroun</p>
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
                    <p className="text-sm font-medium text-foreground">+237 690 773 615</p>
                    <p className="text-xs text-muted-foreground">WhatsApp Cameroun</p>
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
                    <p className="text-sm font-medium text-foreground">+41 77 976 87 68</p>
                    <p className="text-xs text-muted-foreground">WhatsApp Suisse</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-bold text-foreground mb-4">Apercu du message</h3>
            
            <div className="bg-gray-800 rounded-xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-lime-500 flex items-center justify-center">
                  <span className="text-black font-bold">Q</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground">{title || 'Titre du message'}</p>
                  <p className="text-sm text-muted-foreground mt-1">{message || 'Contenu du message...'}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-muted-foreground">Canaux:</span>
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
              <Button onClick={() => { setShowPreview(false); handleSend(); }} className="flex-1 bg-lime-500 hover:bg-lime-600 text-black">
                Envoyer
              </Button>
            </div>
          </motion.div>
        </div>
      )}
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
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-800/30 border border-gray-700 hover:border-gray-600 transition-colors text-left group"
    >
      <div className={cn("p-2 rounded-lg bg-gray-800", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1">
        <p className="font-medium text-foreground group-hover:text-lime-400 transition-colors">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  )
}
