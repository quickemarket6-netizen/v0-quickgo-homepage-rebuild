"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  Gift, 
  Package, 
  Truck,
  Phone,
  MessageCircle,
  Mail,
  Send,
  Smartphone
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  usePopupNotifications, 
  NotificationContainer,
  QuickContactPopup 
} from "@/components/ui/popup-notification"

export default function NotificationTestPage() {
  const { notifications, notify, closeNotification } = usePopupNotifications()
  const [showContactPopup, setShowContactPopup] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [testPhone, setTestPhone] = useState('690773615')

  const testNotifications = [
    {
      label: 'Succes',
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      action: () => notify.success('Operation reussie', 'Votre commande a ete passee avec succes!')
    },
    {
      label: 'Erreur',
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      action: () => notify.error('Erreur de paiement', 'Le paiement a echoue. Veuillez reessayer.')
    },
    {
      label: 'Info',
      icon: Info,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      action: () => notify.info('Information', 'Une nouvelle version est disponible.')
    },
    {
      label: 'Avertissement',
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      action: () => notify.warning('Attention', 'Votre session expire dans 5 minutes.')
    },
    {
      label: 'Promotion',
      icon: Gift,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      action: () => notify.promotion('Offre speciale!', 'Profitez de -30% sur toutes les commandes ce weekend!', 'WEEKEND30')
    },
    {
      label: 'Commande',
      icon: Package,
      color: 'text-lime-400',
      bgColor: 'bg-lime-500/10',
      action: () => notify.orderUpdate('QG-2024-001234', 'Confirmee', 'Votre commande est en preparation.')
    },
    {
      label: 'Livraison',
      icon: Truck,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      action: () => notify.deliveryUpdate('Paul Kamga', '15 minutes', '690123456')
    },
  ]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Test des Notifications
          </h1>
          <p className="text-muted-foreground">
            Testez les differents types de notifications push, popups et contacts
          </p>
        </motion.div>

        {/* Notification Types */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Types de notifications</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {testNotifications.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-700 hover:border-lime-500/50 transition-all ${item.bgColor}`}
              >
                <item.icon className={`w-8 h-8 ${item.color}`} />
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Notification */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Notification personnalisee</h2>
          <div className="space-y-4">
            <Input 
              placeholder="Titre de la notification"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="bg-gray-800/50 border-gray-700"
            />
            <Input 
              placeholder="Message"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="bg-gray-800/50 border-gray-700"
            />
            <Button 
              onClick={() => {
                if (customTitle && customMessage) {
                  notify.info(customTitle, customMessage)
                  setCustomTitle('')
                  setCustomMessage('')
                }
              }}
              disabled={!customTitle || !customMessage}
              className="gap-2 bg-lime-500 hover:bg-lime-600 text-black"
            >
              <Bell className="w-4 h-4" />
              Envoyer notification
            </Button>
          </div>
        </div>

        {/* Quick Contact Test */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Test Contact Rapide</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Input 
              placeholder="Numero de telephone"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="bg-gray-800/50 border-gray-700 flex-1"
            />
            <Button 
              onClick={() => setShowContactPopup(true)}
              variant="outline"
              className="gap-2"
            >
              <Phone className="w-4 h-4" />
              Ouvrir contact
            </Button>
          </div>
        </div>

        {/* Direct Actions */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Actions directes</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <a 
              href={`tel:+237${testPhone}`}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
            >
              <Phone className="w-6 h-6 text-blue-400" />
              <span className="text-sm text-foreground">Appeler</span>
            </a>
            <a 
              href={`https://wa.me/237${testPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors"
            >
              <MessageCircle className="w-6 h-6 text-green-400" />
              <span className="text-sm text-foreground">WhatsApp</span>
            </a>
            <a 
              href={`sms:+237${testPhone}`}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors"
            >
              <Smartphone className="w-6 h-6 text-yellow-400" />
              <span className="text-sm text-foreground">SMS</span>
            </a>
            <a 
              href="mailto:support@quickgo.cm"
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-colors"
            >
              <Mail className="w-6 h-6 text-purple-400" />
              <span className="text-sm text-foreground">Email</span>
            </a>
          </div>
        </div>

        {/* DL Solutions Contacts */}
        <div className="mt-8 bg-gradient-to-r from-lime-500/10 to-green-500/10 border border-lime-500/30 rounded-xl p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Contacts DL Solutions SARL</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <a 
              href="https://wa.me/237694341586"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/50 border border-gray-700 hover:border-green-500/50 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm font-medium text-foreground">+237 694 341 586</p>
                <p className="text-xs text-muted-foreground">Cameroun</p>
              </div>
            </a>
            <a 
              href="https://wa.me/237690773615"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/50 border border-gray-700 hover:border-green-500/50 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-sm font-medium text-foreground">+237 690 773 615</p>
                <p className="text-xs text-muted-foreground">Cameroun</p>
              </div>
            </a>
            <a 
              href="https://wa.me/41779768768"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-900/50 border border-gray-700 hover:border-blue-500/50 transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-foreground">+41 77 976 87 68</p>
                <p className="text-xs text-muted-foreground">Suisse</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Notification Container */}
      <NotificationContainer 
        notifications={notifications} 
        onClose={closeNotification}
        position="top-right"
      />

      {/* Quick Contact Popup */}
      <QuickContactPopup
        isOpen={showContactPopup}
        onClose={() => setShowContactPopup(false)}
        contactName="Test Contact"
        contactPhone={testPhone}
        contactType="support"
      />
    </div>
  )
}
