"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { mutate } from "swr"
import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  BarChart3,
  Settings,
  Bell,
  Shield,
  CreditCard,
  Globe,
  Mail,
  Phone,
  Key,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  MessageCircle,
} from "lucide-react"

const sidebarItems = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", href: "/admin" },
  { icon: Package, label: "Commandes", href: "/admin/orders" },
  { icon: Truck, label: "Livreurs", href: "/admin/drivers" },
  { icon: Users, label: "Clients", href: "/admin/users" },
  { icon: BarChart3, label: "Analyses", href: "/admin/analytics" },
  { icon: Settings, label: "Paramètres", href: "/admin/settings", active: true },
]

const settingsSections = [
  { id: "general", label: "General", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Securite", icon: Shield },
  { id: "payments", label: "Paiements", icon: CreditCard },
  { id: "api", label: "API", icon: Key },
]

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState("general")
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    siteName: "QuickGo",
    siteUrl: "https://quickgo.cm",
    supportEmail: "support@quickgo.cm",
    supportPhone: "+237 690 773 615",
    whatsappNumber: "+237690773615",
    currency: "XAF",
    timezone: "Africa/Douala",
    minDeliveryFee: "1000",
    maxDeliveryDistance: "50",
    orderNotifications: true,
    driverNotifications: true,
    marketingEmails: false,
    smsAlerts: true,
    twoFactorAuth: true,
    sessionTimeout: "30",
    ipWhitelist: false,
    mobileMoneyEnabled: true,
    cardPaymentsEnabled: true,
    cashOnDelivery: true,
    apiEnabled: true,
    webhooksEnabled: true,
  })

  // Load settings from database on mount
  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from("admin_settings")
          .select("key, value")
        
        if (data) {
          const dbSettings: Record<string, string> = {}
          data.forEach((item: { key: string; value: string }) => { dbSettings[item.key] = item.value })
          
          setSettings(prev => ({
            ...prev,
            siteName: dbSettings.company_name || prev.siteName,
            supportEmail: dbSettings.company_email || prev.supportEmail,
            supportPhone: dbSettings.support_phone || prev.supportPhone,
            whatsappNumber: dbSettings.whatsapp_number || prev.whatsappNumber,
            minDeliveryFee: dbSettings.min_delivery_fee || prev.minDeliveryFee,
            maxDeliveryDistance: dbSettings.max_delivery_distance || prev.maxDeliveryDistance,
          }))
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSaveSettings = async () => {
    setSaving(true)
    setSaveStatus("idle")
    
    try {
      const supabase = createClient()
      
      // Map frontend settings to database keys
      const settingsToSave = [
        { key: "company_name", value: settings.siteName },
        { key: "company_email", value: settings.supportEmail },
        { key: "support_phone", value: settings.supportPhone },
        { key: "whatsapp_number", value: settings.whatsappNumber },
        { key: "min_delivery_fee", value: settings.minDeliveryFee },
        { key: "max_delivery_distance", value: settings.maxDeliveryDistance },
      ]

      for (const setting of settingsToSave) {
        await supabase
          .from("admin_settings")
          .upsert({ 
            key: setting.key, 
            value: setting.value,
            updated_at: new Date().toISOString()
          }, { onConflict: "key" })
      }

      // Invalidate SWR cache for WhatsApp button
      mutate("/api/settings")
      
      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Error saving settings:", error)
      setSaveStatus("error")
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 lg:pt-24">
        <div className="flex">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 min-h-[calc(100vh-6rem)] border-r border-border/50 p-6">
            <div className="mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                  <LayoutDashboard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Admin Panel</p>
                  <p className="text-xs text-muted-foreground">QuickGo</p>
                </div>
              </div>
            </div>
            
            <nav className="space-y-1">
              {sidebarItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                    item.active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
          
          {/* Main Content */}
          <div className="flex-1 p-6 lg:p-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
            >
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-1">
                  Parametres
                </h1>
                <p className="text-muted-foreground">
                  Configuration de la plateforme QuickGo
                </p>
              </div>
              <Button onClick={handleSaveSettings} disabled={saving} className="gap-2 bg-primary hover:bg-primary/90 mt-4 sm:mt-0">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : saveStatus === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saveStatus === "success" ? "Sauvegarde!" : "Sauvegarder"}
              </Button>
            </motion.div>

            <div className="grid lg:grid-cols-4 gap-6">
              {/* Settings Navigation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="lg:col-span-1"
              >
                <div className="p-4 rounded-2xl bg-card border border-border/50">
                  <nav className="space-y-1">
                    {settingsSections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                          activeSection === section.id
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <section.icon className="h-5 w-5" />
                        <span className="font-medium">{section.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </motion.div>

              {/* Settings Content */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="lg:col-span-3 space-y-6"
              >
                {activeSection === "general" && (
                  <div className="p-6 rounded-2xl bg-card border border-border/50">
                    <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                      <Globe className="h-5 w-5 text-primary" />
                      Informations generales
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Nom du site
                        </label>
                        <Input 
                          value={settings.siteName} 
                          onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          URL du site
                        </label>
                        <Input 
                          value={settings.siteUrl}
                          onChange={(e) => setSettings(prev => ({ ...prev, siteUrl: e.target.value }))}
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary" />
                          Email support
                        </label>
                        <Input 
                          value={settings.supportEmail}
                          onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          Telephone support
                        </label>
                        <Input 
                          value={settings.supportPhone}
                          onChange={(e) => setSettings(prev => ({ ...prev, supportPhone: e.target.value }))}
                          className="bg-background"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-green-500" />
                          Numero WhatsApp (bouton flottant)
                        </label>
                        <div className="flex gap-2">
                          <Input 
                            value={settings.whatsappNumber}
                            onChange={(e) => setSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                            className="bg-background"
                            placeholder="+237690773615"
                          />
                          <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span className="text-green-500 text-sm whitespace-nowrap">WhatsApp actif</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Ce numero sera utilise pour le bouton WhatsApp flottant sur tout le site
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Devise
                        </label>
                        <Input 
                          value={settings.currency}
                          onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Fuseau horaire
                        </label>
                        <Input 
                          value={settings.timezone}
                          onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                          className="bg-background"
                        />
                      </div>
                    </div>

                    {/* Delivery Settings */}
                    <h3 className="text-lg font-bold text-foreground mt-8 mb-6 flex items-center gap-2">
                      <Truck className="h-5 w-5 text-primary" />
                      Parametres de livraison
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Frais minimum (FCFA)
                        </label>
                        <Input 
                          type="number"
                          value={settings.minDeliveryFee}
                          onChange={(e) => setSettings(prev => ({ ...prev, minDeliveryFee: e.target.value }))}
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Distance max (km)
                        </label>
                        <Input 
                          type="number"
                          value={settings.maxDeliveryDistance}
                          onChange={(e) => setSettings(prev => ({ ...prev, maxDeliveryDistance: e.target.value }))}
                          className="bg-background"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "notifications" && (
                  <div className="p-6 rounded-2xl bg-card border border-border/50">
                    <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                      <Bell className="h-5 w-5 text-primary" />
                      Preferences de notifications
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Notifications commandes</p>
                          <p className="text-sm text-muted-foreground">Recevoir des alertes pour nouvelles commandes</p>
                        </div>
                        <Switch 
                          checked={settings.orderNotifications} 
                          onCheckedChange={() => handleToggle("orderNotifications")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Notifications livreurs</p>
                          <p className="text-sm text-muted-foreground">Alertes nouvelles inscriptions livreurs</p>
                        </div>
                        <Switch 
                          checked={settings.driverNotifications} 
                          onCheckedChange={() => handleToggle("driverNotifications")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Emails marketing</p>
                          <p className="text-sm text-muted-foreground">Rapports et newsletters</p>
                        </div>
                        <Switch 
                          checked={settings.marketingEmails} 
                          onCheckedChange={() => handleToggle("marketingEmails")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Alertes SMS</p>
                          <p className="text-sm text-muted-foreground">Notifications par SMS</p>
                        </div>
                        <Switch 
                          checked={settings.smsAlerts} 
                          onCheckedChange={() => handleToggle("smsAlerts")}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "security" && (
                  <div className="p-6 rounded-2xl bg-card border border-border/50">
                    <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Securite
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Authentification 2FA</p>
                          <p className="text-sm text-muted-foreground">Securite renforcee pour les admins</p>
                        </div>
                        <Switch 
                          checked={settings.twoFactorAuth} 
                          onCheckedChange={() => handleToggle("twoFactorAuth")}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Expiration session (minutes)
                        </label>
                        <Input 
                          type="number"
                          value={settings.sessionTimeout}
                          onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: e.target.value }))}
                          className="bg-background max-w-xs"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Liste blanche IP</p>
                          <p className="text-sm text-muted-foreground">Restreindre acces par adresse IP</p>
                        </div>
                        <Switch 
                          checked={settings.ipWhitelist} 
                          onCheckedChange={() => handleToggle("ipWhitelist")}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "payments" && (
                  <div className="p-6 rounded-2xl bg-card border border-border/50">
                    <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Methodes de paiement
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Mobile Money</p>
                          <p className="text-sm text-muted-foreground">MTN, Orange Money, etc.</p>
                        </div>
                        <Switch 
                          checked={settings.mobileMoneyEnabled} 
                          onCheckedChange={() => handleToggle("mobileMoneyEnabled")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Cartes bancaires</p>
                          <p className="text-sm text-muted-foreground">Visa, Mastercard</p>
                        </div>
                        <Switch 
                          checked={settings.cardPaymentsEnabled} 
                          onCheckedChange={() => handleToggle("cardPaymentsEnabled")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Paiement a la livraison</p>
                          <p className="text-sm text-muted-foreground">Cash on delivery</p>
                        </div>
                        <Switch 
                          checked={settings.cashOnDelivery} 
                          onCheckedChange={() => handleToggle("cashOnDelivery")}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {activeSection === "api" && (
                  <div className="p-6 rounded-2xl bg-card border border-border/50">
                    <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                      <Key className="h-5 w-5 text-primary" />
                      Configuration API
                    </h3>
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">API publique</p>
                          <p className="text-sm text-muted-foreground">Activer acces API externe</p>
                        </div>
                        <Switch 
                          checked={settings.apiEnabled} 
                          onCheckedChange={() => handleToggle("apiEnabled")}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">Webhooks</p>
                          <p className="text-sm text-muted-foreground">Notifications evenements</p>
                        </div>
                        <Switch 
                          checked={settings.webhooksEnabled} 
                          onCheckedChange={() => handleToggle("webhooksEnabled")}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Cle API
                        </label>
                        <div className="flex gap-2">
                          <Input 
                            value="sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                            disabled
                            className="bg-muted/30 font-mono text-sm"
                          />
                          <Button variant="outline">Regenerer</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning Banner */}
                <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-500">Attention</p>
                    <p className="text-sm text-yellow-500/80">
                      Les modifications des parametres peuvent affecter le fonctionnement de la plateforme. 
                      Assurez-vous de sauvegarder avant de quitter.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
