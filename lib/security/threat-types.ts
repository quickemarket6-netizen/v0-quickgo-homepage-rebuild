// Types et libellés des menaces — module volontairement pur (aucune I/O, aucun
// accès serveur), pour que le tableau de bord admin (composant client) puisse
// l'importer sans entraîner dans le bundle navigateur la couche d'alerte
// serveur de cybersecurity.ts (email, SMS, WhatsApp, cookies Supabase).

export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical'

export type ThreatType =
  | 'brute_force'
  | 'sql_injection'
  | 'xss_attack'
  | 'ddos'
  | 'bot_attack'
  | 'session_hijack'
  | 'api_abuse'
  | 'fraud_attempt'
  | 'unauthorized_access'
  | 'data_scraping'
  | 'suspicious_login'
  | 'rate_limit_exceeded'

export interface ThreatEvent {
  id: string
  type: ThreatType
  level: ThreatLevel
  ip: string
  country?: string
  city?: string
  device?: string
  browser?: string
  os?: string
  fingerprint?: string
  timestamp: Date
  endpoint: string
  payload?: string
  requestCount?: number
  sessionId?: string
  userId?: string
  blocked: boolean
  alertsSent: boolean
}

// Threat level colors and icons
export const THREAT_LEVEL_CONFIG = {
  low: { color: 'text-green-500', bg: 'bg-green-500/10', icon: '🟢' },
  medium: { color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: '🟡' },
  high: { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: '🟠' },
  critical: { color: 'text-red-500', bg: 'bg-red-500/10', icon: '🔴' }
}

export const THREAT_TYPE_LABELS: Record<ThreatType, string> = {
  brute_force: 'Brute Force',
  sql_injection: 'SQL Injection',
  xss_attack: 'XSS Attack',
  ddos: 'DDoS',
  bot_attack: 'Bot Attack',
  session_hijack: 'Session Hijack',
  api_abuse: 'API Abuse',
  fraud_attempt: 'Fraud Attempt',
  unauthorized_access: 'Unauthorized Access',
  data_scraping: 'Data Scraping',
  suspicious_login: 'Suspicious Login',
  rate_limit_exceeded: 'Rate Limit Exceeded'
}
