"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, AlertTriangle, Ban, Globe, Clock, RefreshCw, Search,
  Eye, Unlock, Download, ShieldAlert,
  ShieldCheck, ShieldX, MapPin, Bug
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"
import { 
  THREAT_LEVEL_CONFIG, 
  THREAT_TYPE_LABELS,
  type ThreatEvent,
  type ThreatLevel 
} from '@/lib/security/cybersecurity'

interface BlockedIPEntry { ip_address: string; reason?: string; blocked_at: string; expires_at?: string; auto_blocked: boolean }
interface SecurityKpi { total_threats: number; critical_threats: number; high_threats: number; blocked_ips_count: number; threats_today: number; security_score: number; failed_logins_24h: number }

export default function SecurityDashboardPage() {
  const [threats, setThreats]           = useState<ThreatEvent[]>([])
  const [blockedIPEntries, setBlocked]  = useState<BlockedIPEntry[]>([])
  const [kpi, setKpi]                   = useState<SecurityKpi | null>(null)
  const [loading, setLoading]           = useState(true)
  const [selectedThreat, setSelectedThreat] = useState<ThreatEvent | null>(null)
  const [filter, setFilter]             = useState<ThreatLevel | 'all'>('all')
  const [searchQuery, setSearchQuery]   = useState('')
  const [isLive, setIsLive]             = useState(true)
  const [actioning, setActioning]       = useState(false)

  const blockedIPs = blockedIPEntries.map(e => e.ip_address)

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/security?hours=48&limit=100')
      if (!res.ok) return
      const data = await res.json()
      setThreats((data.threats ?? []).map((t: ThreatEvent & { timestamp: string }) => ({
        ...t,
        timestamp: new Date(t.timestamp),
      })))
      setBlocked(data.blocked_ips ?? [])
      setKpi(data.kpi ?? null)
    } catch {
      // keep existing state
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Auto-refresh every 30s when live
  useEffect(() => {
    if (!isLive) return
    const iv = setInterval(fetchData, 30_000)
    return () => clearInterval(iv)
  }, [isLive])

  // Stats — prefer API kpi, fallback to computed
  const stats = {
    totalThreats:    kpi?.total_threats    ?? threats.length,
    blockedIPs:      kpi?.blocked_ips_count ?? blockedIPs.length,
    criticalThreats: kpi?.critical_threats ?? threats.filter(t => t.level === 'critical').length,
    highThreats:     kpi?.high_threats     ?? threats.filter(t => t.level === 'high').length,
    todayThreats:    kpi?.threats_today    ?? 0,
    securityScore:   kpi?.security_score   ?? 98,
  }

  // Filter threats
  const filteredThreats = threats.filter(t => {
    if (filter !== 'all' && t.level !== filter) return false
    if (searchQuery && !t.ip.includes(searchQuery) && !t.endpoint.includes(searchQuery)) return false
    return true
  })

  const exportCsv = () => {
    if (filteredThreats.length === 0) { toast.info("Aucune donnée à exporter"); return }
    const header = ["ID", "Type", "Niveau", "IP", "Pays", "Ville", "Endpoint", "Bloque", "Horodatage"]
    const rows = filteredThreats.map((t) => [
      t.id,
      THREAT_TYPE_LABELS[t.type] ?? t.type,
      t.level,
      t.ip,
      t.country,
      t.city,
      t.endpoint,
      t.blocked ? "Oui" : "Non",
      t.timestamp.toLocaleString("fr-FR"),
    ])
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(";"))
      .join("\n")
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `securite-menaces-quickgo-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    toast.success(`${filteredThreats.length} menace(s) exportée(s)`)
  }

  const unblockIP = async (ip: string) => {
    setActioning(true)
    try {
      await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unblock_ip', ip }),
      })
      setBlocked(prev => prev.filter(e => e.ip_address !== ip))
      setThreats(prev => prev.map(t => t.ip === ip ? { ...t, blocked: false } : t))
    } finally { setActioning(false) }
  }

  const blockIP = async (ip: string) => {
    setActioning(true)
    try {
      await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'block_ip', ip, reason: 'Manual block' }),
      })
      setBlocked(prev => prev.some(e => e.ip_address === ip) ? prev : [
        ...prev,
        { ip_address: ip, blocked_at: new Date().toISOString(), auto_blocked: false }
      ])
      setThreats(prev => prev.map(t => t.ip === ip ? { ...t, blocked: true } : t))
    } finally { setActioning(false) }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex">
        <AdminSidebar />
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <div className="flex-1 overflow-auto p-4 md:p-6">
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
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" size="sm" onClick={exportCsv}>
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
                  <p className="text-2xl font-bold text-green-500">{stats.securityScore}%</p>
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
                          transition={{ delay: Math.min(index * 0.05, 0.4) }}
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
                          aria-label="Débloquer l'IP"
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
    </div>
  )
}
