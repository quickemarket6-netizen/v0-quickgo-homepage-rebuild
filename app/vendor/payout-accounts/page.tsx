"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Plus, Trash2, Star, CheckCircle2, AlertTriangle,
  RefreshCw, CreditCard, Smartphone, Banknote, Shield,
  X, Phone, User, Wallet, LayoutDashboard, Package,
  ShoppingBag, Users, UserCog, Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface PayoutAccount {
  id: string
  payout_method: "orange_money" | "mtn_momo" | "bank_transfer"
  account_name: string
  phone_number: string
  is_default: boolean
  verified: boolean
}

const navItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", href: "/vendor/dashboard" },
  { icon: Package, label: "Produits", href: "/vendor/products" },
  { icon: ShoppingBag, label: "Commandes", href: "/vendor/orders" },
  { icon: Users, label: "Clients CRM", href: "/vendor/crm" },
  { icon: Wallet, label: "Finances", href: "/vendor/finances", active: true },
  { icon: Settings, label: "Paramètres", href: "/vendor/settings" },
]

const METHODS = [
  { value: "orange_money", label: "Orange Money", icon: "🟠", desc: "Paiement instantané via Orange Money Cameroun", color: "border-orange-300 bg-orange-50" },
  { value: "mtn_momo", label: "MTN Mobile Money", icon: "💛", desc: "Paiement instantané via MTN MoMo Cameroun", color: "border-yellow-300 bg-yellow-50" },
  { value: "bank_transfer", label: "Virement bancaire", icon: "🏦", desc: "Virement vers votre compte bancaire (2-3 jours ouvrés)", color: "border-blue-300 bg-blue-50" },
]

function AccountCard({
  account,
  onSetDefault,
  onDelete,
}: {
  account: PayoutAccount
  onSetDefault: (id: string) => void
  onDelete: (id: string) => void
}) {
  const method = METHODS.find((m) => m.value === account.payout_method)
  const [deleting, setDeleting] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border-2 p-5 shadow-sm transition-all ${account.is_default ? "border-quickgo-blue ring-2 ring-quickgo-blue/10" : "border-gray-100 hover:border-gray-200"}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{method?.icon ?? "💳"}</span>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{method?.label ?? account.payout_method}</p>
              {account.is_default && (
                <span className="bg-quickgo-blue/10 text-quickgo-blue text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <Star size={10} fill="currentColor" />
                  Par défaut
                </span>
              )}
              {account.verified ? (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <CheckCircle2 size={10} />
                  Vérifié
                </span>
              ) : (
                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                  <AlertTriangle size={10} />
                  Non vérifié
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{account.account_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!account.is_default && (
            <button
              onClick={() => onSetDefault(account.id)}
              className="text-xs text-quickgo-blue hover:underline font-medium"
            >
              Définir par défaut
            </button>
          )}
          <button
            onClick={async () => {
              setDeleting(true)
              onDelete(account.id)
            }}
            disabled={deleting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
        <Phone size={16} className="text-gray-400 shrink-0" />
        <span className="font-mono text-gray-800 text-sm font-medium">{account.phone_number}</span>
      </div>
    </motion.div>
  )
}

function AddAccountModal({
  vendorId,
  onClose,
  onSuccess,
}: {
  vendorId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [step, setStep] = useState(1)
  const [method, setMethod] = useState<string>("")
  const [accountName, setAccountName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isDefault, setIsDefault] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (!method || !accountName.trim() || !phoneNumber.trim()) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    // Validate Cameroon phone number
    const cleaned = phoneNumber.replace(/\D/g, "")
    if (cleaned.length < 9) {
      toast.error("Numéro de téléphone invalide (format: 6XX XXX XXX)")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/vendor/payout-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendor_id: vendorId,
          payout_method: method,
          account_name: accountName.trim(),
          phone_number: phoneNumber.trim(),
          is_default: isDefault,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur")
      toast.success("Compte de paiement ajouté")
      onSuccess()
      onClose()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur serveur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Ajouter un compte</h2>
            <p className="text-sm text-gray-500">Étape {step} / 2</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-5">
          {step === 1 ? (
            <>
              <p className="text-sm text-gray-600 font-medium">Choisissez votre méthode de paiement</p>
              <div className="space-y-3">
                {METHODS.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => { setMethod(m.value); setStep(2) }}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:shadow-sm text-left ${method === m.value ? `${m.color} border-opacity-100` : "border-gray-100 hover:border-gray-200"}`}
                  >
                    <span className="text-3xl">{m.icon}</span>
                    <div>
                      <p className="font-semibold text-gray-900">{m.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <button onClick={() => setStep(1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
                <ArrowLeft size={14} />
                Changer de méthode
              </button>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-2xl">{METHODS.find((m) => m.value === method)?.icon}</span>
                <p className="font-medium text-gray-800">{METHODS.find((m) => m.value === method)?.label}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Nom du titulaire du compte</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="Ex: Jean Paul Nguemo"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-quickgo-blue/20 focus:border-quickgo-blue outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Numéro de téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="6XX XXX XXX"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-quickgo-blue/20 focus:border-quickgo-blue outline-none text-sm font-mono"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Numéro Cameroun (sans indicatif 237)</p>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setIsDefault(!isDefault)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isDefault ? "bg-quickgo-blue border-quickgo-blue" : "border-gray-300"}`}
                >
                  {isDefault && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <span className="text-sm text-gray-700">Définir comme compte par défaut</span>
              </label>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex gap-2">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={14} />
                <p className="text-xs text-amber-700">
                  Assurez-vous que le numéro correspond exactement au compte{" "}
                  {METHODS.find((m) => m.value === method)?.label}. QuickGo n&apos;est pas responsable des erreurs de numéro.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1">Annuler</Button>
                <Button
                  onClick={handleAdd}
                  disabled={loading || !accountName || !phoneNumber}
                  className="flex-1 bg-gradient-to-r from-quickgo-blue to-quickgo-cyan text-white border-0"
                >
                  {loading && <RefreshCw size={14} className="animate-spin mr-2" />}
                  Ajouter le compte
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default function VendorPayoutAccountsPage() {
  const [accounts, setAccounts] = useState<PayoutAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [vendorId, setVendorId] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)

  const fetchAccounts = useCallback(async () => {
    try {
      const vendorRes = await fetch("/api/vendors?my=true")
      if (!vendorRes.ok) return
      const vendors = await vendorRes.json()
      const vid = Array.isArray(vendors) ? vendors[0]?.id : vendors?.id
      if (!vid) return
      setVendorId(vid)

      const res = await fetch(`/api/vendor/wallet?vendor_id=${vid}`)
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.payout_accounts ?? [])
      }
    } catch {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  async function handleSetDefault(accountId: string) {
    if (!vendorId) return
    const res = await fetch("/api/vendor/payout-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vendor_id: vendorId,
        ...accounts.find((a) => a.id === accountId),
        is_default: true,
      }),
    })
    if (res.ok) {
      toast.success("Compte par défaut mis à jour")
      fetchAccounts()
    }
  }

  async function handleDelete(accountId: string) {
    if (!vendorId) return
    const res = await fetch(`/api/vendor/payout-accounts?account_id=${accountId}&vendor_id=${vendorId}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setAccounts((prev) => prev.filter((a) => a.id !== accountId))
      toast.success("Compte supprimé")
    } else {
      toast.error("Erreur lors de la suppression")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-60 bg-white border-r border-gray-100 flex flex-col fixed h-full z-20 shadow-sm">
        <div className="p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-quickgo-blue to-quickgo-cyan rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Q</span>
            </div>
            <span className="font-bold bg-gradient-to-r from-quickgo-blue to-quickgo-cyan bg-clip-text text-transparent">QuickGo</span>
          </Link>
          <span className="text-xs text-gray-500 mt-0.5 block">Espace Vendeur</span>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${item.active
                ? "bg-gradient-to-r from-quickgo-blue/10 to-quickgo-cyan/10 text-quickgo-blue font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              <item.icon size={17} />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="ml-60 flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/vendor/finances" className="p-2 rounded-xl hover:bg-gray-50 transition-colors">
              <ArrowLeft size={18} className="text-gray-600" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Comptes de paiement</h1>
              <p className="text-sm text-gray-500">Gérez vos comptes pour recevoir vos retraits</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAdd(true)}
            disabled={accounts.length >= 5}
            className="gap-2 bg-gradient-to-r from-quickgo-blue to-quickgo-cyan text-white border-0"
          >
            <Plus size={16} />
            Ajouter un compte
          </Button>
        </header>

        <main className="flex-1 p-6 max-w-2xl mx-auto w-full space-y-6">
          {/* Security badge */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <Shield size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-blue-900 text-sm">Comptes sécurisés</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Vos informations de paiement sont chiffrées et sécurisées. Maximum 5 comptes · {accounts.length}/5 utilisés
              </p>
            </div>
          </div>

          {/* Accounts */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl p-5 animate-pulse h-28 border border-gray-100" />
              ))}
            </div>
          ) : accounts.length === 0 ? (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
              <CreditCard className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="font-semibold text-gray-700 mb-2">Aucun compte configuré</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                Ajoutez un compte Orange Money, MTN MoMo ou bancaire pour recevoir vos retraits
              </p>
              <Button
                onClick={() => setShowAdd(true)}
                className="gap-2 bg-gradient-to-r from-quickgo-blue to-quickgo-cyan text-white border-0"
              >
                <Plus size={16} />
                Ajouter mon premier compte
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onSetDefault={handleSetDefault}
                  onDelete={handleDelete}
                />
              ))}

              {accounts.length < 5 && (
                <button
                  onClick={() => setShowAdd(true)}
                  className="w-full bg-white rounded-2xl border-2 border-dashed border-gray-200 p-4 flex items-center justify-center gap-2 text-gray-500 hover:border-quickgo-blue hover:text-quickgo-blue transition-all group"
                >
                  <Plus size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium">Ajouter un compte ({accounts.length}/5)</span>
                </button>
              )}
            </div>
          )}

          {/* Info */}
          <div className="bg-gray-50 rounded-2xl p-5 space-y-3 border border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">Informations importantes</h3>
            <ul className="space-y-2 text-xs text-gray-500">
              <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-green-500 mt-0.5 shrink-0" />Les retraits Orange Money et MTN MoMo sont traités dans les 24h ouvrées</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-green-500 mt-0.5 shrink-0" />Les virements bancaires prennent 2-3 jours ouvrés</li>
              <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-green-500 mt-0.5 shrink-0" />Minimum de retrait: 5 000 FCFA · Maximum journalier: 2 000 000 FCFA</li>
              <li className="flex items-start gap-2"><AlertTriangle size={12} className="text-amber-500 mt-0.5 shrink-0" />Vérifiez bien vos numéros — les erreurs de transfert ne sont pas remboursables</li>
            </ul>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showAdd && vendorId && (
          <AddAccountModal
            vendorId={vendorId}
            onClose={() => setShowAdd(false)}
            onSuccess={fetchAccounts}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
