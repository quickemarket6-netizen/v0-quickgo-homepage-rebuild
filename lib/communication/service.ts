// Unified Communication Service
// Handles: Push notifications, SMS, WhatsApp, Email, In-app popups

export type CommunicationChannel = 'push' | 'email' | 'sms' | 'whatsapp' | 'popup' | 'call'

export type MessageType = 
  | 'promotion'
  | 'order_update'
  | 'delivery_update'
  | 'new_offer'
  | 'alert'
  | 'reminder'
  | 'support'
  | 'broadcast'

export interface Message {
  id: string
  type: MessageType
  title: string
  body: string
  channels: CommunicationChannel[]
  recipients: {
    type: 'all' | 'segment' | 'individual'
    userIds?: string[]
    segment?: 'clients' | 'vendors' | 'drivers' | 'all'
    filters?: Record<string, unknown>
  }
  data?: Record<string, unknown>
  scheduledAt?: Date
  expiresAt?: Date
  priority: 'low' | 'normal' | 'high' | 'urgent'
  createdAt: Date
  sentAt?: Date
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  image?: string
  url?: string
  data?: Record<string, unknown>
}

// WhatsApp message templates
export const whatsappTemplates = {
  order_confirmation: (data: { orderId: string; total: number; items: number }) => ({
    template: 'order_confirmation',
    params: [data.orderId, `${data.items} articles`, `${data.total.toLocaleString()} FCFA`]
  }),
  delivery_update: (data: { orderId: string; status: string; eta?: string }) => ({
    template: 'delivery_update',
    params: [data.orderId, data.status, data.eta || 'Bientot']
  }),
  promotion: (data: { code: string; discount: string; expiry: string }) => ({
    template: 'promotion',
    params: [data.code, data.discount, data.expiry]
  }),
  support_response: (data: { ticketId: string; message: string }) => ({
    template: 'support_response',
    params: [data.ticketId, data.message]
  })
}

// SMS templates (short messages)
export const smsTemplates = {
  order_confirmation: (data: { orderId: string; total: number }) => 
    `QuickGo: Commande #${data.orderId} confirmee! Total: ${data.total.toLocaleString()} FCFA. Suivez votre commande sur quickgo.cm`,
  
  delivery_arriving: (data: { minutes: number; driverName: string }) =>
    `QuickGo: Votre livreur ${data.driverName} arrive dans ${data.minutes} min! Preparez-vous.`,
  
  verification_code: (data: { code: string }) =>
    `QuickGo: Votre code de verification est ${data.code}. Ne le partagez avec personne.`,
  
  promotion: (data: { code: string; discount: string }) =>
    `QuickGo: ${data.discount} avec le code ${data.code}! Commandez maintenant sur quickgo.cm`,
  
  payment_alert: (data: { amount: number; code: string }) =>
    `QuickGo: Validez votre paiement de ${data.amount.toLocaleString()} FCFA. Code: ${data.code}`
}

// Push notification service
export class PushNotificationService {
  private vapidPublicKey: string
  private vapidPrivateKey: string

  constructor() {
    this.vapidPublicKey = process.env.VAPID_PUBLIC_KEY || ''
    this.vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || ''
  }

  async sendPush(subscription: PushSubscription, payload: NotificationPayload) {
    // In production, use web-push library
    console.log('[Push] Sending to subscription:', subscription.endpoint)
    console.log('[Push] Payload:', payload)
    
    // Simulated success
    return { success: true, endpoint: subscription.endpoint }
  }

  async sendBulkPush(subscriptions: PushSubscription[], payload: NotificationPayload) {
    const results = await Promise.allSettled(
      subscriptions.map(sub => this.sendPush(sub, payload))
    )
    
    return {
      total: subscriptions.length,
      success: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length
    }
  }
}

// WhatsApp Business API service
export class WhatsAppService {
  private apiUrl: string
  private accessToken: string
  private phoneNumberId: string

  constructor() {
    this.apiUrl = 'https://graph.facebook.com/v17.0'
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || ''
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || ''
  }

  async sendMessage(to: string, message: string) {
    const url = `${this.apiUrl}/${this.phoneNumberId}/messages`
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(to),
          type: 'text',
          text: { body: message }
        })
      })

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[WhatsApp] Error sending message:', error)
      // Fallback: Generate WhatsApp link for manual sending
      return {
        success: false,
        fallbackUrl: `https://wa.me/${this.formatPhoneNumber(to)}?text=${encodeURIComponent(message)}`
      }
    }
  }

  async sendTemplate(to: string, templateName: string, params: string[]) {
    const url = `${this.apiUrl}/${this.phoneNumberId}/messages`
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: this.formatPhoneNumber(to),
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'fr' },
            components: [{
              type: 'body',
              parameters: params.map(p => ({ type: 'text', text: p }))
            }]
          }
        })
      })

      return await response.json()
    } catch (error) {
      console.error('[WhatsApp] Error sending template:', error)
      return { success: false, error }
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove spaces and special characters
    let cleaned = phone.replace(/[\s\-\(\)]/g, '')
    
    // Add country code if missing
    if (cleaned.startsWith('6')) {
      cleaned = '237' + cleaned
    } else if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1)
    }
    
    return cleaned
  }

  // Generate click-to-chat link
  generateChatLink(phone: string, message?: string): string {
    const formattedPhone = this.formatPhoneNumber(phone)
    let url = `https://wa.me/${formattedPhone}`
    if (message) {
      url += `?text=${encodeURIComponent(message)}`
    }
    return url
  }
}

// SMS Service (using Africa's Talking or similar)
export class SMSService {
  private apiKey: string
  private senderId: string

  constructor() {
    this.apiKey = process.env.SMS_API_KEY || ''
    this.senderId = process.env.SMS_SENDER_ID || 'QuickGo'
  }

  async sendSMS(to: string, message: string) {
    // Format phone number
    let phone = to.replace(/[\s\-\(\)]/g, '')
    if (phone.startsWith('6')) {
      phone = '+237' + phone
    } else if (!phone.startsWith('+')) {
      phone = '+' + phone
    }

    // In production, integrate with SMS provider (Africa's Talking, Twilio, etc.)
    console.log(`[SMS] Sending to ${phone}: ${message}`)
    
    // Simulated response
    return {
      success: true,
      messageId: `sms_${Date.now()}`,
      to: phone,
      cost: 25 // FCFA per SMS
    }
  }

  async sendBulkSMS(recipients: string[], message: string) {
    const results = await Promise.allSettled(
      recipients.map(to => this.sendSMS(to, message))
    )
    
    return {
      total: recipients.length,
      success: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      totalCost: results.filter(r => r.status === 'fulfilled').length * 25
    }
  }
}

// Unified Communication Manager
export class CommunicationManager {
  private pushService: PushNotificationService
  private whatsappService: WhatsAppService
  private smsService: SMSService

  constructor() {
    this.pushService = new PushNotificationService()
    this.whatsappService = new WhatsAppService()
    this.smsService = new SMSService()
  }

  async sendMessage(message: Message, contacts: { phone?: string; email?: string; pushSubscription?: PushSubscription }[]) {
    const results: Record<CommunicationChannel, { success: number; failed: number }> = {
      push: { success: 0, failed: 0 },
      email: { success: 0, failed: 0 },
      sms: { success: 0, failed: 0 },
      whatsapp: { success: 0, failed: 0 },
      popup: { success: 0, failed: 0 },
      call: { success: 0, failed: 0 }
    }

    for (const channel of message.channels) {
      for (const contact of contacts) {
        try {
          switch (channel) {
            case 'push':
              if (contact.pushSubscription) {
                await this.pushService.sendPush(contact.pushSubscription, {
                  title: message.title,
                  body: message.body,
                  data: message.data
                })
                results.push.success++
              }
              break

            case 'sms':
              if (contact.phone) {
                await this.smsService.sendSMS(contact.phone, `${message.title}: ${message.body}`)
                results.sms.success++
              }
              break

            case 'whatsapp':
              if (contact.phone) {
                await this.whatsappService.sendMessage(contact.phone, `*${message.title}*\n\n${message.body}`)
                results.whatsapp.success++
              }
              break

            case 'email':
              // Email is handled by the existing email service
              if (contact.email) {
                results.email.success++
              }
              break

            case 'popup':
              // Popup notifications are handled client-side
              results.popup.success++
              break
          }
        } catch (error) {
          console.error(`[Communication] Error on ${channel}:`, error)
          results[channel].failed++
        }
      }
    }

    return results
  }

  getWhatsAppLink(phone: string, message?: string): string {
    return this.whatsappService.generateChatLink(phone, message)
  }

  getCallLink(phone: string): string {
    let formatted = phone.replace(/[\s\-\(\)]/g, '')
    if (formatted.startsWith('6')) {
      formatted = '+237' + formatted
    }
    return `tel:${formatted}`
  }
}

// Export singleton instance
export const communicationManager = new CommunicationManager()
