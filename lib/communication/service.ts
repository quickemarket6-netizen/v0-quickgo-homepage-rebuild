// Unified Communication Service
// Handles: Push notifications, SMS (Africa's Talking), WhatsApp Business API, Email, In-app

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

// ── Phone normaliser ─────────────────────────────────────────
// Converts any Cameroonian format to E.164 (+237XXXXXXXXX)
function normalisePhone(raw: string): string {
  const p = raw.replace(/[\s\-\(\)\.]/g, '')
  if (p.startsWith('+'))  return p
  if (p.startsWith('00')) return '+' + p.slice(2)
  if (p.startsWith('237')) return '+' + p
  // Cameroonian numbers start with 6
  if (p.startsWith('6')) return '+237' + p
  return '+' + p
}

// ── WhatsApp templates ───────────────────────────────────────
export const whatsappTemplates = {
  order_confirmation: (data: { orderId: string; total: number; items: number }) => ({
    template: 'order_confirmation',
    params: [data.orderId, `${data.items} articles`, `${data.total.toLocaleString()} FCFA`],
  }),
  delivery_update: (data: { orderId: string; status: string; eta?: string }) => ({
    template: 'delivery_update',
    params: [data.orderId, data.status, data.eta ?? 'Bientôt'],
  }),
  promotion: (data: { code: string; discount: string; expiry: string }) => ({
    template: 'promotion',
    params: [data.code, data.discount, data.expiry],
  }),
  support_response: (data: { ticketId: string; message: string }) => ({
    template: 'support_response',
    params: [data.ticketId, data.message],
  }),
}

// ── SMS templates ────────────────────────────────────────────
export const smsTemplates = {
  order_confirmation: (data: { orderId: string; total: number }) =>
    `QuickGo: Commande #${data.orderId} confirmee! Total: ${data.total.toLocaleString()} FCFA. Suivi: quickgo.cm`,

  delivery_arriving: (data: { minutes: number; driverName: string }) =>
    `QuickGo: ${data.driverName} arrive dans ${data.minutes} min! Preparez-vous.`,

  verification_code: (data: { code: string }) =>
    `QuickGo: Votre code de verification est ${data.code}. Ne le partagez pas.`,

  promotion: (data: { code: string; discount: string }) =>
    `QuickGo: ${data.discount} avec le code ${data.code}! quickgo.cm`,

  payment_alert: (data: { amount: number; code: string }) =>
    `QuickGo: Validez votre paiement de ${data.amount.toLocaleString()} FCFA. Code: ${data.code}`,
}

// ── Push Notification Service ────────────────────────────────
export class PushNotificationService {
  async sendPush(_subscription: PushSubscription, payload: NotificationPayload) {
    // Production: use the `web-push` npm package with VAPID keys.
    // VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be set.
    console.log('[Push] Payload:', payload)
    return { success: true }
  }

  async sendBulkPush(subscriptions: PushSubscription[], payload: NotificationPayload) {
    const results = await Promise.allSettled(subscriptions.map(s => this.sendPush(s, payload)))
    return {
      total: subscriptions.length,
      success: results.filter(r => r.status === 'fulfilled').length,
      failed:  results.filter(r => r.status === 'rejected').length,
    }
  }
}

// ── WhatsApp Business API ────────────────────────────────────
export class WhatsAppService {
  private readonly apiBase = 'https://graph.facebook.com/v21.0'
  private readonly accessToken  = process.env.WHATSAPP_ACCESS_TOKEN   ?? ''
  private readonly phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? ''

  private get configured() {
    return Boolean(this.accessToken && this.phoneNumberId)
  }

  async sendMessage(to: string, message: string): Promise<{ success: boolean; messageId?: string; fallbackUrl?: string }> {
    const phone = normalisePhone(to)

    if (!this.configured) {
      console.warn('[WhatsApp] Not configured — falling back to link')
      return { success: false, fallbackUrl: this.generateChatLink(phone, message) }
    }

    try {
      const res = await fetch(`${this.apiBase}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message },
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`WhatsApp API ${res.status}: ${err}`)
      }

      const json = await res.json()
      return { success: true, messageId: json.messages?.[0]?.id }
    } catch (error) {
      console.error('[WhatsApp] Error:', error)
      return { success: false, fallbackUrl: this.generateChatLink(phone, message) }
    }
  }

  async sendTemplate(to: string, templateName: string, params: string[]) {
    const phone = normalisePhone(to)

    if (!this.configured) {
      return { success: false, error: 'WhatsApp not configured' }
    }

    try {
      const res = await fetch(`${this.apiBase}/${this.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'fr' },
            components: [{
              type: 'body',
              parameters: params.map(p => ({ type: 'text', text: p })),
            }],
          },
        }),
      })

      if (!res.ok) throw new Error(`WhatsApp API ${res.status}`)
      return { success: true, ...(await res.json()) }
    } catch (error) {
      console.error('[WhatsApp] Template error:', error)
      return { success: false, error }
    }
  }

  generateChatLink(phone: string, message?: string): string {
    const p = normalisePhone(phone).replace('+', '')
    return message
      ? `https://wa.me/${p}?text=${encodeURIComponent(message)}`
      : `https://wa.me/${p}`
  }
}

// ── SMS Service — Africa's Talking ───────────────────────────
// Docs: https://developers.africastalking.com/docs/sms/sending
export class SMSService {
  private readonly apiKey   = process.env.AFRICASTALKING_API_KEY   ?? ''
  private readonly username = process.env.AFRICASTALKING_USERNAME   ?? 'sandbox'
  private readonly senderId = process.env.SMS_SENDER_ID             ?? 'QuickGo'

  // Africa's Talking uses a sandbox endpoint for testing
  private get apiUrl() {
    return this.username === 'sandbox'
      ? 'https://api.sandbox.africastalking.com/version1/messaging'
      : 'https://api.africastalking.com/version1/messaging'
  }

  private get configured() {
    return Boolean(this.apiKey && this.username !== 'sandbox')
  }

  async sendSMS(to: string, message: string): Promise<{ success: boolean; messageId?: string; cost?: number; error?: string }> {
    const phone = normalisePhone(to)

    if (!this.configured) {
      // Sandbox mode — still hits the AT sandbox so devs can test
      console.log(`[SMS] Sandbox → ${phone}: ${message}`)
    }

    try {
      const body = new URLSearchParams({
        username: this.username,
        to:       phone,
        message,
        from:     this.senderId,
      })

      const res = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          apiKey: this.apiKey || 'sandbox_key',
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`AT API ${res.status}: ${err}`)
      }

      const json = await res.json()
      const recipient = json.SMSMessageData?.Recipients?.[0]

      if (recipient?.statusCode !== 101) {
        throw new Error(recipient?.status ?? 'Unknown AT error')
      }

      return {
        success:   true,
        messageId: recipient.messageId,
        cost:      parseFloat(recipient.cost?.replace(/[^\d.]/g, '') ?? '0'),
      }
    } catch (error) {
      console.error('[SMS] Error:', error)
      return { success: false, error: String(error) }
    }
  }

  async sendBulkSMS(recipients: string[], message: string) {
    const results = await Promise.allSettled(recipients.map(r => this.sendSMS(r, message)))
    const succeeded = results.filter((r): r is PromiseFulfilledResult<{ success: boolean; cost?: number }> =>
      r.status === 'fulfilled' && r.value.success)
    return {
      total:     recipients.length,
      success:   succeeded.length,
      failed:    recipients.length - succeeded.length,
      totalCost: succeeded.reduce((s, r) => s + (r.value.cost ?? 0), 0),
    }
  }
}

// ── Unified Communication Manager ───────────────────────────
export class CommunicationManager {
  private push     = new PushNotificationService()
  private whatsapp = new WhatsAppService()
  private sms      = new SMSService()

  async sendMessage(
    message: Message,
    contacts: { phone?: string; email?: string; pushSubscription?: PushSubscription }[],
  ) {
    const results: Record<CommunicationChannel, { success: number; failed: number }> = {
      push:     { success: 0, failed: 0 },
      email:    { success: 0, failed: 0 },
      sms:      { success: 0, failed: 0 },
      whatsapp: { success: 0, failed: 0 },
      popup:    { success: 0, failed: 0 },
      call:     { success: 0, failed: 0 },
    }

    for (const channel of message.channels) {
      for (const contact of contacts) {
        try {
          switch (channel) {
            case 'push':
              if (contact.pushSubscription) {
                await this.push.sendPush(contact.pushSubscription, { title: message.title, body: message.body, data: message.data })
                results.push.success++
              }
              break

            case 'sms':
              if (contact.phone) {
                const r = await this.sms.sendSMS(contact.phone, `${message.title}: ${message.body}`)
                r.success ? results.sms.success++ : results.sms.failed++
              }
              break

            case 'whatsapp':
              if (contact.phone) {
                const r = await this.whatsapp.sendMessage(contact.phone, `*${message.title}*\n\n${message.body}`)
                r.success ? results.whatsapp.success++ : results.whatsapp.failed++
              }
              break

            case 'email':
              // Email handled separately via /api/email
              if (contact.email) results.email.success++
              break

            case 'popup':
              results.popup.success++
              break
          }
        } catch (error) {
          console.error(`[Communication] ${channel} error:`, error)
          results[channel].failed++
        }
      }
    }

    return results
  }

  getWhatsAppLink(phone: string, message?: string): string {
    return this.whatsapp.generateChatLink(phone, message)
  }

  getCallLink(phone: string): string {
    return `tel:${normalisePhone(phone)}`
  }
}

export const communicationManager = new CommunicationManager()
