// QuickGo Enterprise Cybersecurity System
// Real-time threat detection, monitoring, and automated response

// Ré-export de types uniquement (effacé à la compilation). Les constantes
// restent dans ./threat-types : les ré-exporter ici ferait entrer tout ce
// module — et sa couche d'alerte serveur — dans le bundle de quiconque ne veut
// qu'un libellé.
export type { ThreatLevel, ThreatType, ThreatEvent } from './threat-types'

import type { ThreatEvent, ThreatLevel } from './threat-types'

export interface SecurityAlert {
  email: string
  phone?: string
  whatsapp?: string
  type: 'email' | 'sms' | 'whatsapp' | 'all'
}

export interface RiskScore {
  score: number // 0-100
  level: ThreatLevel
  factors: string[]
}

// Threat detection rules
const THREAT_RULES = {
  brute_force: {
    maxAttempts: 5,
    windowMs: 60000, // 1 minute
    blockDurationMs: 900000, // 15 minutes
  },
  rate_limit: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  },
  sql_injection: {
    patterns: [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/gi,
      /('|")\s*(OR|AND)\s*('|")?.*=/gi,
      /(\-\-|\/\*|\*\/|;)/g,
    ]
  },
  xss: {
    patterns: [
      /<script\b[^>]*>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
    ]
  }
}

// In-memory store for rate limiting and tracking (use Redis in production)
const ipAttempts = new Map<string, { count: number; firstAttempt: number; blocked: boolean; blockedUntil?: number }>()
const requestCounts = new Map<string, { count: number; windowStart: number }>()

export class SecurityService {
  private static alertContacts: SecurityAlert[] = []

  // Set alert contacts (from admin settings)
  static setAlertContacts(contacts: SecurityAlert[]) {
    this.alertContacts = contacts
  }

  // Calculate risk score for an activity
  static calculateRiskScore(event: Partial<ThreatEvent>): RiskScore {
    let score = 0
    const factors: string[] = []

    // Check for known bad patterns
    if (event.payload) {
      if (THREAT_RULES.sql_injection.patterns.some(p => p.test(event.payload!))) {
        score += 40
        factors.push('SQL injection pattern detected')
      }
      if (THREAT_RULES.xss.patterns.some(p => p.test(event.payload!))) {
        score += 35
        factors.push('XSS pattern detected')
      }
    }

    // Check request frequency
    if (event.requestCount && event.requestCount > 50) {
      score += 20
      factors.push('High request frequency')
    }

    // Check for suspicious endpoints
    const sensitiveEndpoints = ['/api/admin', '/api/auth', '/api/payment', '/api/users']
    if (event.endpoint && sensitiveEndpoints.some(e => event.endpoint!.includes(e))) {
      score += 15
      factors.push('Sensitive endpoint targeted')
    }

    // Determine level
    let level: ThreatLevel = 'low'
    if (score >= 70) level = 'critical'
    else if (score >= 50) level = 'high'
    else if (score >= 30) level = 'medium'

    return { score, level, factors }
  }

  // Check for brute force attacks
  static checkBruteForce(ip: string, endpoint: string): { blocked: boolean; attempts: number } {
    const now = Date.now()
    const data = ipAttempts.get(ip)

    if (data) {
      // Check if currently blocked
      if (data.blocked && data.blockedUntil && now < data.blockedUntil) {
        return { blocked: true, attempts: data.count }
      }

      // Reset if window expired
      if (now - data.firstAttempt > THREAT_RULES.brute_force.windowMs) {
        ipAttempts.set(ip, { count: 1, firstAttempt: now, blocked: false })
        return { blocked: false, attempts: 1 }
      }

      // Increment counter
      data.count++
      
      // Check if should block
      if (data.count >= THREAT_RULES.brute_force.maxAttempts) {
        data.blocked = true
        data.blockedUntil = now + THREAT_RULES.brute_force.blockDurationMs
        ipAttempts.set(ip, data)
        return { blocked: true, attempts: data.count }
      }

      ipAttempts.set(ip, data)
      return { blocked: false, attempts: data.count }
    }

    // First attempt
    ipAttempts.set(ip, { count: 1, firstAttempt: now, blocked: false })
    return { blocked: false, attempts: 1 }
  }

  // Check rate limiting
  static checkRateLimit(ip: string): { limited: boolean; count: number } {
    const now = Date.now()
    const data = requestCounts.get(ip)

    if (data) {
      if (now - data.windowStart > THREAT_RULES.rate_limit.windowMs) {
        requestCounts.set(ip, { count: 1, windowStart: now })
        return { limited: false, count: 1 }
      }

      data.count++
      requestCounts.set(ip, data)

      if (data.count > THREAT_RULES.rate_limit.maxRequests) {
        return { limited: true, count: data.count }
      }

      return { limited: false, count: data.count }
    }

    requestCounts.set(ip, { count: 1, windowStart: now })
    return { limited: false, count: 1 }
  }

  // Detect SQL injection
  static detectSQLInjection(input: string): boolean {
    return THREAT_RULES.sql_injection.patterns.some(p => p.test(input))
  }

  // Detect XSS
  static detectXSS(input: string): boolean {
    return THREAT_RULES.xss.patterns.some(p => p.test(input))
  }

  // Get geo location from IP (mock - use real service in production)
  static async getGeoFromIP(ip: string): Promise<{ country: string; city: string }> {
    // In production, use services like ipapi.co, ipgeolocation.io, etc.
    return {
      country: 'Cameroon',
      city: 'Douala'
    }
  }

  // Generate device fingerprint
  static generateFingerprint(userAgent: string, ip: string): string {
    const data = `${userAgent}-${ip}-${new Date().toDateString()}`
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16)
  }

  // Block an IP
  static blockIP(ip: string, durationMs: number = 3600000) {
    const now = Date.now()
    ipAttempts.set(ip, {
      count: 999,
      firstAttempt: now,
      blocked: true,
      blockedUntil: now + durationMs
    })
  }

  // Unblock an IP
  static unblockIP(ip: string) {
    ipAttempts.delete(ip)
  }

  // Get blocked IPs
  static getBlockedIPs(): string[] {
    const blocked: string[] = []
    const now = Date.now()
    
    ipAttempts.forEach((data, ip) => {
      if (data.blocked && data.blockedUntil && now < data.blockedUntil) {
        blocked.push(ip)
      }
    })
    
    return blocked
  }

  // Send security alerts
  static async sendSecurityAlert(event: ThreatEvent): Promise<void> {
    const alertMessage = `
🚨 ALERTE SECURITE QUICKGO

Type: ${event.type}
Niveau: ${event.level.toUpperCase()}
IP: ${event.ip}
Pays: ${event.country || 'Inconnu'}
Ville: ${event.city || 'Inconnue'}
Endpoint: ${event.endpoint}
Heure: ${event.timestamp.toISOString()}
Device: ${event.device || 'Inconnu'}
Browser: ${event.browser || 'Inconnu'}
OS: ${event.os || 'Inconnu'}
${event.userId ? `User ID: ${event.userId}` : ''}
${event.blocked ? '✅ IP BLOQUEE AUTOMATIQUEMENT' : '⚠️ Surveillance active'}

Payload suspect:
${event.payload?.substring(0, 500) || 'N/A'}
    `.trim()

    // Send to all configured alert channels
    for (const contact of this.alertContacts) {
      try {
        if (contact.type === 'email' || contact.type === 'all') {
          await this.sendEmailAlert(contact.email, event, alertMessage)
        }
        if ((contact.type === 'whatsapp' || contact.type === 'all') && contact.whatsapp) {
          await this.sendWhatsAppAlert(contact.whatsapp, alertMessage)
        }
        if ((contact.type === 'sms' || contact.type === 'all') && contact.phone) {
          await this.sendSMSAlert(contact.phone, alertMessage)
        }
      } catch (error) {
        console.error('[Security Alert Error]', error)
      }
    }
  }

  // Les trois canaux passent par les intégrations réelles du projet. Ils
  // journalisaient auparavant sans rien envoyer — une alerte de sécurité qui
  // n'part pas est pire qu'absente, puisqu'elle laisse croire à une couverture.
  // L'envoi email se faisait par fetch('/api/email') en URL relative, ce qui
  // échoue systématiquement côté serveur (URL non absolue) : on appelle
  // directement la couche email, sans détour HTTP.
  private static async sendEmailAlert(email: string, event: ThreatEvent, message: string): Promise<void> {
    const { sendEmail } = await import('@/lib/email/resend')
    const res = await sendEmail({
      to:      email,
      subject: `[Sécurité QuickGo] ${event.type} — niveau ${event.level}`,
      html:    `<p><strong>Alerte de sécurité</strong></p><p>${message.replace(/</g, '&lt;')}</p>`,
      text:    message,
    })
    if (!res.success) console.error('[Security Alert] email non envoyé:', res.error)
  }

  private static async sendWhatsAppAlert(phone: string, message: string): Promise<void> {
    const { WhatsAppService } = await import('@/lib/communication/service')
    const res = await new WhatsAppService().sendMessage(phone, message)
    if (!res.success) console.error('[Security Alert] WhatsApp non envoyé vers', phone)
  }

  private static async sendSMSAlert(phone: string, message: string): Promise<void> {
    const { SMSService } = await import('@/lib/communication/service')
    const res = await new SMSService().sendSMS(phone, message.substring(0, 160))
    if (!res.success) console.error('[Security Alert] SMS non envoyé:', res.error)
  }
}
