"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Mail, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  ShoppingCart,
  CreditCard,
  Truck,
  MessageCircle,
  UserPlus
} from "lucide-react"

const emailTypes = [
  { id: 'order_confirmation', label: 'Confirmation commande', icon: ShoppingCart, color: 'bg-green-500' },
  { id: 'payment_alert', label: 'Alerte paiement', icon: AlertTriangle, color: 'bg-yellow-500' },
  { id: 'payment_confirmation', label: 'Confirmation paiement', icon: CreditCard, color: 'bg-blue-500' },
  { id: 'delivery_status', label: 'Statut livraison', icon: Truck, color: 'bg-purple-500' },
  { id: 'support_ticket', label: 'Ticket support', icon: MessageCircle, color: 'bg-red-500' },
  { id: 'welcome', label: 'Bienvenue', icon: UserPlus, color: 'bg-primary' },
]

export default function EmailTestPage() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('Jean Dupont')
  const [sending, setSending] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({})

  const testEmail = async (type: string) => {
    if (!email) {
      setResults(prev => ({ ...prev, [type]: { success: false, message: 'Entrez un email' } }))
      return
    }

    setSending(type)
    try {
      const testData: Record<string, unknown> = {
        email,
        customerName: name,
      }

      // Add specific data based on email type
      if (type === 'order_confirmation') {
        Object.assign(testData, {
          orderId: 'QG-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
          items: [
            { name: 'Pizza Margherita', quantity: 2, price: 5000 },
            { name: 'Coca-Cola 1L', quantity: 3, price: 1500 }
          ],
          subtotal: 14500,
          deliveryFee: 1000,
          total: 15500,
          deliveryAddress: 'Bastos, Yaounde - Face station Total',
          estimatedDelivery: '30-45 minutes',
          paymentMethod: 'Mobile Money (MTN)'
        })
      } else if (type === 'payment_alert') {
        Object.assign(testData, {
          orderId: 'QG-12345',
          total: 15500,
          paymentMethod: 'Mobile Money'
        })
      } else if (type === 'payment_confirmation') {
        Object.assign(testData, {
          orderId: 'QG-12345',
          amount: 15500,
          paymentMethod: 'MTN Mobile Money',
          transactionId: 'TXN-' + Math.random().toString(36).substr(2, 8).toUpperCase()
        })
      } else if (type === 'delivery_status') {
        Object.assign(testData, {
          orderId: 'QG-12345',
          status: 'on_the_way',
          driverName: 'Paul Kamga',
          driverPhone: '+237 690 123 456',
          estimatedArrival: '15 minutes',
          currentLocation: 'Carrefour Nlongkak'
        })
      } else if (type === 'support_ticket') {
        Object.assign(testData, {
          subject: 'Test ticket support',
          message: 'Ceci est un test du systeme d\'envoi de ticket support.',
          category: 'question'
        })
      } else if (type === 'welcome') {
        Object.assign(testData, {
          promoCode: 'BIENVENUE10'
        })
      }

      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data: testData })
      })

      const result = await response.json()
      
      if (response.ok) {
        setResults(prev => ({ ...prev, [type]: { success: true, message: 'Email envoye!' } }))
      } else {
        setResults(prev => ({ ...prev, [type]: { success: false, message: result.error || 'Erreur' } }))
      }
    } catch (err) {
      setResults(prev => ({ ...prev, [type]: { success: false, message: 'Erreur reseau' } }))
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Test d&apos;envoi d&apos;emails</h1>
          <p className="text-muted-foreground">Testez tous les types d&apos;emails QuickGo</p>
        </div>

        {/* Config */}
        <div className="bg-card border border-border/50 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Configuration
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Email destinataire *</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nom du client</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jean Dupont"
                className="bg-background"
              />
            </div>
          </div>
        </div>

        {/* Email Types */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {emailTypes.map((type) => (
            <div key={type.id} className="bg-card border border-border/50 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-lg ${type.color}`}>
                  <type.icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-foreground">{type.label}</span>
              </div>
              
              {results[type.id] && (
                <div className={`text-xs mb-3 flex items-center gap-1 ${results[type.id].success ? 'text-green-500' : 'text-red-500'}`}>
                  {results[type.id].success ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                  {results[type.id].message}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/api/email?preview=true&type=${type.id}`, '_blank')}
                >
                  Preview
                </Button>
                <Button
                  size="sm"
                  onClick={() => testEmail(type.id)}
                  disabled={sending === type.id || !email}
                  className="flex-1"
                >
                  {sending === type.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Envoyer'}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-sm text-yellow-200">
          <p className="font-medium mb-1">Note importante:</p>
          <p>Pour envoyer des emails reels, vous devez configurer la variable d&apos;environnement RESEND_API_KEY. 
             Sans cette cle, les previews fonctionnent mais les emails ne seront pas envoyes.</p>
        </div>
      </div>
    </div>
  )
}
