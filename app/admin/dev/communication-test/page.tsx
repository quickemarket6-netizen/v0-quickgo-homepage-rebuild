"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  Bell,
  MessageCircle,
  Mail,
  Phone,
  MessageSquare,
  Send,
  Gift,
  Truck,
  ShoppingBag,
  AlertTriangle,
  CheckCircle,
  Megaphone,
  Users,
  Building2,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { NotificationProvider, useNotifications, NotificationBell } from "@/components/ui/notification-provider"
import { QuickContact } from "@/components/ui/quick-contact"

function CommunicationTestContent() {
  const { addNotification } = useNotifications()
  const [testPhone, setTestPhone] = useState("690773615")
  const [testMessage, setTestMessage] = useState("Bonjour! Ceci est un message de test QuickGo.")

  const dlContacts = {
    cameroun1: { phone: "237694341586", display: "+237 694 341 586" },
    cameroun2: { phone: "237690773615", display: "+237 690 773 615" },
    suisse: { phone: "41779768768", display: "+41 77 976 87 68" },
  }

  const sendTestNotification = (type: 'promo' | 'delivery' | 'order' | 'alert' | 'success' | 'message') => {
    const notifications = {
      promo: {
        title: "Offre Speciale!",
        message: "-30% sur toutes les commandes ce weekend avec le code WEEKEND30",
        action: { label: "Profiter", url: "/marketplace" }
      },
      delivery: {
        title: "Livraison en approche",
        message: "Votre livreur Paul arrive dans 5 minutes. Preparez-vous!",
        action: { label: "Suivre", url: "/orders" }
      },
      order: {
        title: "Commande confirmee",
        message: "Votre commande #QG-2024-5678 a ete acceptee par le commercant",
      },
      alert: {
        title: "Action requise",
        message: "Veuillez confirmer votre adresse de livraison pour continuer",
        action: { label: "Confirmer", url: "/settings/address" }
      },
      success: {
        title: "Paiement reussi",
        message: "Votre paiement de 15,000 FCFA a ete confirme",
      },
      message: {
        title: "Nouveau message",
        message: "Le support QuickGo vous a repondu",
        action: { label: "Lire", url: "/messages" }
      },
    }

    addNotification({ type, ...notifications[type] })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Test Communication</h1>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="w-8 h-8 rounded-full bg-lime-500 flex items-center justify-center">
              <User className="w-4 h-4 text-black" />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Notifications Push */}
        <section className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Bell className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Notifications Push</h2>
              <p className="text-sm text-gray-400">Testez les differents types de notifications</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { type: 'promo' as const, label: 'Promotion', icon: Gift, color: 'bg-purple-500' },
              { type: 'delivery' as const, label: 'Livraison', icon: Truck, color: 'bg-blue-500' },
              { type: 'order' as const, label: 'Commande', icon: ShoppingBag, color: 'bg-lime-500' },
              { type: 'alert' as const, label: 'Alerte', icon: AlertTriangle, color: 'bg-red-500' },
              { type: 'success' as const, label: 'Succes', icon: CheckCircle, color: 'bg-green-500' },
              { type: 'message' as const, label: 'Message', icon: MessageCircle, color: 'bg-orange-500' },
            ].map(({ type, label, icon: Icon, color }) => (
              <Button
                key={type}
                onClick={() => sendTestNotification(type)}
                className={`${color} hover:opacity-90 flex flex-col items-center gap-2 h-auto py-4`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </section>

        {/* WhatsApp Direct */}
        <section className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-green-500/20">
              <MessageCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">WhatsApp Direct</h2>
              <p className="text-sm text-gray-400">Envoyez des messages WhatsApp instantanement</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Numero</label>
                <Input
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="690773615"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Message</label>
                <Input
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Votre message..."
                  className="bg-gray-800 border-gray-700"
                />
              </div>
            </div>

            <Button
              onClick={() => window.open(`https://wa.me/237${testPhone}?text=${encodeURIComponent(testMessage)}`, '_blank')}
              className="bg-green-500 hover:bg-green-600 gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Envoyer via WhatsApp
            </Button>
          </div>

          {/* DL Solutions Contacts */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-sm font-medium text-lime-400 mb-3">Contacts DL Solutions SARL</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {Object.entries(dlContacts).map(([key, { phone, display }]) => (
                <a
                  key={key}
                  href={`https://wa.me/${phone}?text=${encodeURIComponent("Bonjour DL Solutions!")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-all"
                >
                  <MessageCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-xs text-gray-400 capitalize">{key.replace(/[0-9]/g, '')}</p>
                    <p className="text-sm font-medium text-white">{display}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Appels Directs */}
        <section className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Phone className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Appels Directs</h2>
              <p className="text-sm text-gray-400">Appelez directement les contacts</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {Object.entries(dlContacts).map(([key, { phone, display }]) => (
              <a
                key={key}
                href={`tel:+${phone}`}
                className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-all"
              >
                <div className="p-2 rounded-full bg-blue-500">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 capitalize">{key.replace(/[0-9]/g, '')}</p>
                  <p className="text-sm font-medium text-white">{display}</p>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* SMS */}
        <section className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-cyan-500/20">
              <MessageSquare className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">SMS</h2>
              <p className="text-sm text-gray-400">Envoyez des SMS</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {Object.entries(dlContacts).map(([key, { phone, display }]) => (
              <a
                key={key}
                href={`sms:+${phone}?body=${encodeURIComponent("Bonjour QuickGo!")}`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all"
              >
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-white">{display}</span>
              </a>
            ))}
          </div>
        </section>

        {/* Email */}
        <section className="p-6 rounded-2xl bg-gray-900 border border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-orange-500/20">
              <Mail className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Email</h2>
              <p className="text-sm text-gray-400">Envoyez des emails</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="mailto:support@quickgo.cm?subject=Demande d'assistance"
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 transition-all"
            >
              <Mail className="w-5 h-5 text-orange-400" />
              <span className="text-white">support@quickgo.cm</span>
            </a>
            <a
              href="mailto:contact@dlsolutionssarl.tech?subject=Contact depuis QuickGo"
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-lime-500/10 border border-lime-500/30 hover:bg-lime-500/20 transition-all"
            >
              <Mail className="w-5 h-5 text-lime-400" />
              <span className="text-white">contact@dlsolutionssarl.tech</span>
            </a>
          </div>
        </section>

        {/* Campagne de masse */}
        <section className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Megaphone className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Campagne de Communication</h2>
              <p className="text-sm text-gray-400">Envoyez a plusieurs destinataires</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-lime-400" />
                <span className="text-sm font-medium text-white">Clients</span>
              </div>
              <p className="text-2xl font-bold text-lime-400">10,234</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">Commercants</span>
              </div>
              <p className="text-2xl font-bold text-blue-400">856</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-900/50 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">Livreurs</span>
              </div>
              <p className="text-2xl font-bold text-purple-400">1,368</p>
            </div>
          </div>

          <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 gap-2">
            <Send className="w-4 h-4" />
            Acceder au Centre de Communication
          </Button>
        </section>
      </main>

      {/* Quick Contact Button */}
      <QuickContact userType="customer" />
    </div>
  )
}

export default function CommunicationTestPage() {
  return (
    <NotificationProvider>
      <CommunicationTestContent />
    </NotificationProvider>
  )
}
