"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
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
  Palette,
  Mail,
  Smartphone,
  Database,
  Key,
  Save,
  AlertCircle,
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
  const [settings, setSettings] = useState({
    siteName: "QuickGo",
    siteUrl: "https://quickgo.cm",
    supportEmail: "support@quickgo.cm",
    supportPhone: "+237 690 000 000",
    currency: "XAF",
    timezone: "Africa/Douala",
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
              <Button className="gap-2 bg-primary hover:bg-primary/90 mt-4 sm:mt-0">
                <Save className="h-4 w-4" />
                Sauvegarder
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
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Email support
                        </label>
                        <Input 
                          value={settings.supportEmail}
                          onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                          className="bg-background"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Telephone support
                        </label>
                        <Input 
                          value={settings.supportPhone}
                          onChange={(e) => setSettings(prev => ({ ...prev, supportPhone: e.target.value }))}
                          className="bg-background"
                        />
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
