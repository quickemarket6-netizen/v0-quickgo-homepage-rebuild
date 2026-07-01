"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import { mutate } from "swr"
import {
  Settings, Bell, Shield, CreditCard, Globe, Mail, Phone,
  Key, Save, AlertCircle, CheckCircle, Loader2, MessageCircle, Truck,
} from "lucide-react"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"

const settingsSections = [
  { id: "general",       label: "Général",       icon: Settings  },
  { id: "notifications", label: "Notifications", icon: Bell      },
  { id: "security",      label: "Sécurité",      icon: Shield    },
  { id: "payments",      label: "Paiements",     icon: CreditCard },
  { id: "api",           label: "API",           icon: Key       },
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

  useEffect(() => {
    async function loadSettings() {
      try {
        const supabase = createClient()
        const { data } = await supabase.from("admin_settings").select("key, value")
        if (data) {
          const db: Record<string, string> = {}
          data.forEach((item: { key: string; value: string }) => { db[item.key] = item.value })
          const bool = (v: string | undefined, d: boolean) => (v == null ? d : v === "true")
          setSettings(prev => ({
            ...prev,
            siteName:             db.company_name           || prev.siteName,
            siteUrl:              db.site_url               || prev.siteUrl,
            supportEmail:         db.company_email          || prev.supportEmail,
            supportPhone:         db.support_phone          || prev.supportPhone,
            whatsappNumber:       db.whatsapp_number        || prev.whatsappNumber,
            currency:             db.currency               || prev.currency,
            timezone:             db.timezone               || prev.timezone,
            minDeliveryFee:       db.min_delivery_fee       || prev.minDeliveryFee,
            maxDeliveryDistance:  db.max_delivery_distance  || prev.maxDeliveryDistance,
            sessionTimeout:       db.session_timeout        || prev.sessionTimeout,
            orderNotifications:   bool(db.order_notifications,   prev.orderNotifications),
            driverNotifications:  bool(db.driver_notifications,  prev.driverNotifications),
            marketingEmails:      bool(db.marketing_emails,      prev.marketingEmails),
            smsAlerts:            bool(db.sms_alerts,            prev.smsAlerts),
            twoFactorAuth:        bool(db.two_factor_auth,       prev.twoFactorAuth),
            ipWhitelist:          bool(db.ip_whitelist,          prev.ipWhitelist),
            mobileMoneyEnabled:   bool(db.mobile_money_enabled,  prev.mobileMoneyEnabled),
            cardPaymentsEnabled:  bool(db.card_payments_enabled, prev.cardPaymentsEnabled),
            cashOnDelivery:       bool(db.cash_on_delivery,      prev.cashOnDelivery),
            apiEnabled:           bool(db.api_enabled,           prev.apiEnabled),
            webhooksEnabled:      bool(db.webhooks_enabled,      prev.webhooksEnabled),
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
      const b = (v: boolean) => (v ? "true" : "false")
      // Persist EVERY field (previously only 6 of 21 were saved, silently
      // discarding all toggles + site URL / currency / timezone / timeouts).
      const rows = [
        { key: "company_name",          value: settings.siteName            },
        { key: "site_url",              value: settings.siteUrl             },
        { key: "company_email",         value: settings.supportEmail        },
        { key: "support_phone",         value: settings.supportPhone        },
        { key: "whatsapp_number",       value: settings.whatsappNumber      },
        { key: "currency",              value: settings.currency            },
        { key: "timezone",              value: settings.timezone            },
        { key: "min_delivery_fee",      value: settings.minDeliveryFee      },
        { key: "max_delivery_distance", value: settings.maxDeliveryDistance },
        { key: "session_timeout",       value: settings.sessionTimeout      },
        { key: "order_notifications",   value: b(settings.orderNotifications)  },
        { key: "driver_notifications",  value: b(settings.driverNotifications) },
        { key: "marketing_emails",      value: b(settings.marketingEmails)     },
        { key: "sms_alerts",            value: b(settings.smsAlerts)           },
        { key: "two_factor_auth",       value: b(settings.twoFactorAuth)       },
        { key: "ip_whitelist",          value: b(settings.ipWhitelist)         },
        { key: "mobile_money_enabled",  value: b(settings.mobileMoneyEnabled)  },
        { key: "card_payments_enabled", value: b(settings.cardPaymentsEnabled) },
        { key: "cash_on_delivery",      value: b(settings.cashOnDelivery)      },
        { key: "api_enabled",           value: b(settings.apiEnabled)          },
        { key: "webhooks_enabled",      value: b(settings.webhooksEnabled)     },
      ]
      const now = new Date().toISOString()
      const { error } = await supabase
        .from("admin_settings")
        .upsert(rows.map(r => ({ ...r, updated_at: now })), { onConflict: "key" })
      if (error) throw error

      mutate("/api/settings")
      setSaveStatus("success")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Error saving settings:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 5000)
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = (key: string) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))
  }

  const inputCls = "bg-[#0a0a0f] border-[#1e1e2e] text-white placeholder:text-[#6b6b8a] focus:border-blue-500"

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <AdminSidebar />

      <div className="flex-1 overflow-auto p-6 lg:p-8 text-white">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1">Paramètres</h1>
            <p className="text-[#6b6b8a]">Configuration de la plateforme QuickGo</p>
          </div>
          <Button
            onClick={handleSaveSettings}
            disabled={saving}
            className={`gap-2 text-white mt-4 sm:mt-0 ${
              saveStatus === "error" ? "bg-red-600 hover:bg-red-700" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saveStatus === "success" ? (
              <CheckCircle className="h-4 w-4" />
            ) : saveStatus === "error" ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saveStatus === "success"
              ? "Sauvegardé !"
              : saveStatus === "error"
                ? "Échec — réessayer"
                : "Sauvegarder"}
          </Button>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[#6b6b8a]" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Section nav */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1"
            >
              <div className="p-4 rounded-2xl bg-[#16161f] border border-[#1e1e2e]">
                <nav className="space-y-1">
                  {settingsSections.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${
                        activeSection === s.id
                          ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                          : "text-[#6b6b8a] hover:bg-[#0a0a0f] hover:text-white"
                      }`}
                    >
                      <s.icon className="h-5 w-5" />
                      {s.label}
                    </button>
                  ))}
                </nav>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:col-span-3 space-y-6"
            >
              {/* ── GENERAL ── */}
              {activeSection === "general" && (
                <div className="p-6 rounded-2xl bg-[#16161f] border border-[#1e1e2e]">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-400" />
                    Informations générales
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Nom du site</label>
                      <Input value={settings.siteName}
                        onChange={e => setSettings(p => ({ ...p, siteName: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">URL du site</label>
                      <Input value={settings.siteUrl}
                        onChange={e => setSettings(p => ({ ...p, siteUrl: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-400" /> Email support
                      </label>
                      <Input value={settings.supportEmail}
                        onChange={e => setSettings(p => ({ ...p, supportEmail: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-400" /> Téléphone support
                      </label>
                      <Input value={settings.supportPhone}
                        onChange={e => setSettings(p => ({ ...p, supportPhone: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-white mb-2 flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-green-400" /> Numéro WhatsApp (bouton flottant)
                      </label>
                      <div className="flex gap-2">
                        <Input value={settings.whatsappNumber}
                          onChange={e => setSettings(p => ({ ...p, whatsappNumber: e.target.value }))}
                          className={inputCls}
                          placeholder="+237690773615" />
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-green-400 text-sm whitespace-nowrap">WhatsApp actif</span>
                        </div>
                      </div>
                      <p className="text-xs text-[#6b6b8a] mt-1">
                        Ce numéro sera utilisé pour le bouton WhatsApp flottant sur tout le site
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Devise</label>
                      <Input value={settings.currency}
                        onChange={e => setSettings(p => ({ ...p, currency: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Fuseau horaire</label>
                      <Input value={settings.timezone}
                        onChange={e => setSettings(p => ({ ...p, timezone: e.target.value }))}
                        className={inputCls} />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-white mt-8 mb-6 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-400" />
                    Paramètres de livraison
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Frais minimum (FCFA)</label>
                      <Input type="number" value={settings.minDeliveryFee}
                        onChange={e => setSettings(p => ({ ...p, minDeliveryFee: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Distance max (km)</label>
                      <Input type="number" value={settings.maxDeliveryDistance}
                        onChange={e => setSettings(p => ({ ...p, maxDeliveryDistance: e.target.value }))}
                        className={inputCls} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── NOTIFICATIONS ── */}
              {activeSection === "notifications" && (
                <div className="p-6 rounded-2xl bg-[#16161f] border border-[#1e1e2e]">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-blue-400" />
                    Préférences de notifications
                  </h3>
                  <div className="space-y-6">
                    {[
                      { key: "orderNotifications",  label: "Notifications commandes", desc: "Alertes pour nouvelles commandes"       },
                      { key: "driverNotifications",  label: "Notifications livreurs",  desc: "Alertes nouvelles inscriptions livreurs" },
                      { key: "marketingEmails",      label: "Emails marketing",        desc: "Rapports et newsletters"                },
                      { key: "smsAlerts",            label: "Alertes SMS",             desc: "Notifications par SMS"                  },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{label}</p>
                          <p className="text-sm text-[#6b6b8a]">{desc}</p>
                        </div>
                        <Switch
                          checked={!!settings[key as keyof typeof settings]}
                          onCheckedChange={() => handleToggle(key)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── SECURITY ── */}
              {activeSection === "security" && (
                <div className="p-6 rounded-2xl bg-[#16161f] border border-[#1e1e2e]">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-400" />
                    Sécurité
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">Authentification 2FA</p>
                        <p className="text-sm text-[#6b6b8a]">Sécurité renforcée pour les admins</p>
                      </div>
                      <Switch checked={settings.twoFactorAuth} onCheckedChange={() => handleToggle("twoFactorAuth")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Expiration session (minutes)</label>
                      <Input type="number" value={settings.sessionTimeout}
                        onChange={e => setSettings(p => ({ ...p, sessionTimeout: e.target.value }))}
                        className={`${inputCls} max-w-xs`} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">Liste blanche IP</p>
                        <p className="text-sm text-[#6b6b8a]">Restreindre accès par adresse IP</p>
                      </div>
                      <Switch checked={settings.ipWhitelist} onCheckedChange={() => handleToggle("ipWhitelist")} />
                    </div>
                  </div>
                </div>
              )}

              {/* ── PAYMENTS ── */}
              {activeSection === "payments" && (
                <div className="p-6 rounded-2xl bg-[#16161f] border border-[#1e1e2e]">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-400" />
                    Méthodes de paiement
                  </h3>
                  <div className="space-y-6">
                    {[
                      { key: "mobileMoneyEnabled",  label: "Mobile Money",          desc: "MTN, Orange Money, etc."   },
                      { key: "cardPaymentsEnabled",  label: "Cartes bancaires",      desc: "Visa, Mastercard"          },
                      { key: "cashOnDelivery",       label: "Paiement à la livraison", desc: "Cash on delivery"        },
                    ].map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{label}</p>
                          <p className="text-sm text-[#6b6b8a]">{desc}</p>
                        </div>
                        <Switch
                          checked={!!settings[key as keyof typeof settings]}
                          onCheckedChange={() => handleToggle(key)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── API ── */}
              {activeSection === "api" && (
                <div className="p-6 rounded-2xl bg-[#16161f] border border-[#1e1e2e]">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Key className="h-5 w-5 text-blue-400" />
                    Configuration API
                  </h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">API publique</p>
                        <p className="text-sm text-[#6b6b8a]">Activer accès API externe</p>
                      </div>
                      <Switch checked={settings.apiEnabled} onCheckedChange={() => handleToggle("apiEnabled")} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">Webhooks</p>
                        <p className="text-sm text-[#6b6b8a]">Notifications événements</p>
                      </div>
                      <Switch checked={settings.webhooksEnabled} onCheckedChange={() => handleToggle("webhooksEnabled")} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Clé API</label>
                      <div className="flex gap-2">
                        <Input
                          value="sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                          disabled
                          className="bg-[#0a0a0f]/50 border-[#1e1e2e] text-[#6b6b8a] font-mono text-sm"
                        />
                        <Button variant="outline" className="border-[#1e1e2e] bg-[#16161f] text-white hover:bg-[#1e1e2e]">
                          Regénérer
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="p-4 rounded-2xl bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-400">Attention</p>
                  <p className="text-sm text-yellow-400/80">
                    Les modifications des paramètres peuvent affecter le fonctionnement de la plateforme.
                    Assurez-vous de sauvegarder avant de quitter.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
