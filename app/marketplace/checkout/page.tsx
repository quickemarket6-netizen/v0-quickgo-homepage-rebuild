"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCart } from "@/lib/store/cart"
import {
  ChevronLeft, ChevronRight, MapPin, Truck, Shield,
  Clock, Check, Zap, CheckCircle, Package, ArrowRight,
} from "lucide-react"

const formatPrice = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA"

const PAYMENT_METHODS = [
  { id: "orange_money", label: "Orange Money",      emoji: "🟠", desc: "Paiement via Orange Money CM" },
  { id: "mtn_momo",    label: "MTN Mobile Money",   emoji: "🟡", desc: "Paiement via MTN MoMo CM" },
  { id: "quickgo_pay", label: "QuickGo Pay",         emoji: "💳", desc: "Solde de votre portefeuille" },
  { id: "cash",        label: "Paiement à la livraison", emoji: "💵", desc: "Payez en espèces à la réception" },
]

const DELIVERY_OPTIONS = [
  { id: "express",  label: "Express",    time: "30 – 60 min", price: 2500, icon: Zap },
  { id: "standard", label: "Standard",   time: "2h – 4h",     price: 1500, icon: Truck },
  { id: "scheduled",label: "Programmé",  time: "Choisir un créneau", price: 1000, icon: Clock },
]

interface SavedAddress {
  id: string; label: string; street: string | null; district: string | null
  city: string; lat: number | null; lng: number | null; is_default: boolean
}

// En cas d'article en rupture pendant la préparation (courses, pharmacie…)
const SUBSTITUTION_OPTIONS = [
  { id: "substitute", label: "Remplacer par un article similaire", desc: "La boutique choisit un équivalent à prix égal ou inférieur" },
  { id: "refund",     label: "Retirer et me rembourser",           desc: "L'article est retiré, la différence remboursée" },
  { id: "contact",    label: "Me contacter d'abord",               desc: "La boutique vous appelle avant toute modification" },
]

export default function CheckoutPage() {
  const router = useRouter()
  const { items, getTotalPrice, clearCart } = useCart()

  const [step, setStep]                   = useState(1)
  const [address, setAddress]             = useState("")
  const [landmark, setLandmark]           = useState("")
  const [coords, setCoords]               = useState<{ lat: number; lng: number } | null>(null)
  const [locating, setLocating]           = useState(false)
  const [phone, setPhone]                 = useState("")
  const [paymentMethod, setPaymentMethod] = useState("orange_money")
  const [deliveryOption, setDeliveryOption] = useState("express")
  const [substitutionPref, setSubstitutionPref] = useState("refund")
  const [promoCode, setPromoCode]         = useState("")
  const [promoApplied, setPromoApplied]   = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [notes, setNotes]                 = useState("")
  const [submitting, setSubmitting]       = useState(false)
  const [orderId, setOrderId]             = useState<string | null>(null)
  const [orderNumber, setOrderNumber]     = useState<string | null>(null)
  const [error, setError]                 = useState<string | null>(null)

  // Carnet d'adresses : pré-remplit avec l'adresse par défaut, propose les
  // autres en un clic, et permet d'enregistrer la nouvelle adresse saisie.
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [saveAddress, setSaveAddress] = useState(false)

  // Code promo appliqué au panier : pré-rempli et re-validé automatiquement
  // (le serveur reste la source de vérité sur la remise).
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("quickgo-promo")
      if (saved && !promoApplied) {
        setPromoCode(saved)
        fetch("/api/promo/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: saved, subtotal: getTotalPrice() }),
        })
          .then((r) => r.json())
          .then((body) => {
            if (body.valid) {
              setPromoDiscount(body.discount ?? 0)
              setPromoApplied(true)
            } else {
              sessionStorage.removeItem("quickgo-promo")
            }
          })
          .catch(() => {})
      }
    } catch { /* stockage indisponible */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetch("/api/addresses")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: SavedAddress[]) => {
        if (!Array.isArray(list)) return
        setSavedAddresses(list)
        const def = list.find((a) => a.is_default) ?? list[0]
        if (def) applySavedAddress(def)
      })
      .catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const applySavedAddress = (a: SavedAddress) => {
    setSelectedAddressId(a.id)
    setAddress([a.street, a.city].filter(Boolean).join(", "))
    setLandmark(a.district ?? "")
    setCoords(a.lat != null && a.lng != null ? { lat: Number(a.lat), lng: Number(a.lng) } : null)
  }

  // Nombre de boutiques dans le panier : chaque vendeur expédie séparément,
  // le serveur crée une sous-commande (et des frais de livraison) par boutique.
  const vendorCount = new Set(items.map((i) => i.vendorId ?? "unknown")).size || 1

  const subtotal        = getTotalPrice()
  const deliveryFeeUnit = DELIVERY_OPTIONS.find((d) => d.id === deliveryOption)?.price ?? 1500
  const deliveryFee     = deliveryFeeUnit * vendorCount
  const discount        = promoApplied ? promoDiscount : 0
  const serviceFee      = Math.round(subtotal * 0.02) // aligné sur le calcul serveur (2%)
  const total           = subtotal + deliveryFee + serviceFee - discount

  // Lance le paiement CinetPay (Orange Money / MTN MoMo) pour une commande
  // déjà créée, puis redirige vers la page de paiement de l'opérateur.
  const startMobilePayment = async (createdOrderId: string): Promise<boolean> => {
    const res = await fetch("/api/payments/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: createdOrderId,
        customer_phone: phone || undefined,
      }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.payment_url) {
      setError(data.error ?? "Impossible d'initier le paiement. Réessayez.")
      return false
    }
    window.location.href = data.payment_url
    return true
  }

  const retryPayment = async () => {
    if (!orderId) return
    setError(null)
    setSubmitting(true)
    try { await startMobilePayment(orderId) }
    finally { setSubmitting(false) }
  }

  // Capture GPS — au Cameroun l'adresse texte ne suffit pas (pas de numéros
  // de rue) : position + point de repère guident le livreur.
  const useMyLocation = () => {
    if (!navigator.geolocation) { setError("La géolocalisation n'est pas disponible sur cet appareil."); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
        setError(null)
      },
      () => {
        setLocating(false)
        setError("Impossible d'obtenir votre position. Vérifiez les autorisations de localisation.")
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  const submitOrder = async () => {
    if (!address.trim()) { setError("Veuillez saisir une adresse de livraison."); return }
    if (items.length === 0) { setError("Votre panier est vide."); return }
    setError(null)
    setSubmitting(true)
    try {
      // Enregistrement de l'adresse dans le carnet (best-effort, non bloquant)
      if (saveAddress && !selectedAddressId) {
        fetch("/api/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            street: address,
            district: landmark.trim() || undefined,
            lat: coords?.lat,
            lng: coords?.lng,
            is_default: savedAddresses.length === 0,
          }),
        }).catch(() => {})
      }

      const orderItems = items.map((item) => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
      }))
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Le serveur détermine le vendeur de chaque article et crée une
          // sous-commande par boutique (panier multi-vendeurs).
          items: orderItems,
          delivery_address: landmark.trim() ? `${address} — Repère : ${landmark.trim()}` : address,
          delivery_latitude: coords?.lat,
          delivery_longitude: coords?.lng,
          delivery_option: deliveryOption,
          substitution_preference: substitutionPref,
          payment_method: paymentMethod,
          notes,
          promo_code: promoApplied ? promoCode : undefined,
        }),
      })
      if (res.status === 401) {
        router.push("/auth/login?redirectTo=/marketplace/checkout")
        return
      }
      if (!res.ok) {
        const body = await res.json()
        setError(body.error ?? "Une erreur est survenue.")
        return
      }
      const data = await res.json()
      setOrderId(data.id)
      setOrderNumber(
        Array.isArray(data.orders) && data.orders.length > 1
          ? data.orders.map((o: { order_number: string }) => o.order_number).join(", ")
          : data.order_number,
      )
      clearCart()

      if (paymentMethod === "orange_money" || paymentMethod === "mtn_momo") {
        // Redirection vers CinetPay — la confirmation n'arrive qu'après
        // le retour de paiement (page Mes commandes).
        await startMobilePayment(data.id)
        return
      }
      // QuickGo Pay (déjà débité côté serveur) et cash : confirmation directe
      setStep(3)
    } catch {
      setError("Erreur réseau. Réessayez.")
    } finally {
      setSubmitting(false)
    }
  }

  const applyPromo = async () => {
    if (!promoCode.trim()) return
    const r = await fetch("/api/promo/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: promoCode, subtotal }),
    })
    const body = await r.json().catch(() => ({}))
    if (r.ok && body.valid) {
      setPromoDiscount(body.discount ?? 0)
      setPromoApplied(true)
      setError(null)
    } else {
      setError(body.error ?? "Code promo invalide ou expiré.")
    }
  }

  const STEPS = [
    { n: 1, label: "Livraison" },
    { n: 2, label: "Paiement" },
    { n: 3, label: "Confirmation" },
  ]

  if (items.length === 0 && step !== 3) {
    return (
      <main className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center py-20">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Votre panier est vide</h2>
            <Link href="/marketplace"><Button className="mt-4 rounded-xl">Explorer le marketplace</Button></Link>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24 pb-32 lg:pb-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Back */}
          <Link href="/marketplace/cart" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Retour au panier
          </Link>

          {/* Step indicator */}
          <div className="flex items-center mb-8">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all font-semibold text-sm ${
                    step > s.n ? "bg-primary border-primary text-primary-foreground" :
                    step === s.n ? "border-primary text-primary" : "border-border text-muted-foreground"
                  }`}>
                    {step > s.n ? <Check className="w-4 h-4" /> : s.n}
                  </div>
                  <span className={`text-xs mt-1 font-medium ${step >= s.n ? "text-primary" : "text-muted-foreground"}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-4 mb-4 transition-colors ${step > s.n ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">

                {/* Step 1: Livraison */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="p-6 rounded-2xl bg-card border border-border/50">
                      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" /> Adresse de livraison
                      </h2>
                      <div className="space-y-4">
                        {savedAddresses.length > 0 && (
                          <div>
                            <Label>Mes adresses enregistrées</Label>
                            <div className="flex gap-2 flex-wrap mt-1.5">
                              {savedAddresses.map((a) => (
                                <button key={a.id} type="button" onClick={() => applySavedAddress(a)}
                                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors text-left ${
                                    selectedAddressId === a.id
                                      ? "border-primary bg-primary/10 text-primary"
                                      : "border-border text-muted-foreground hover:border-primary/40"
                                  }`}
                                >
                                  <span className="font-semibold">{a.label}</span>
                                  {a.street && <span className="block text-[11px] opacity-70 max-w-[180px] truncate">{a.street}</span>}
                                </button>
                              ))}
                              <button type="button"
                                onClick={() => { setSelectedAddressId(null); setAddress(""); setLandmark(""); setCoords(null) }}
                                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                                  selectedAddressId === null
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border text-muted-foreground hover:border-primary/40"
                                }`}
                              >
                                + Nouvelle adresse
                              </button>
                            </div>
                          </div>
                        )}
                        <div>
                          <Label htmlFor="address">Adresse complète *</Label>
                          <Input id="address" value={address}
                            onChange={(e) => { setAddress(e.target.value); setSelectedAddressId(null) }}
                            placeholder="Ex: Quartier Bastos, Yaoundé" className="mt-1.5 h-11 rounded-xl" />
                        </div>
                        <div>
                          <Label htmlFor="landmark">Point de repère</Label>
                          <Input id="landmark" value={landmark} onChange={(e) => setLandmark(e.target.value)}
                            placeholder="Ex: Face station Total, immeuble bleu 2e étage" className="mt-1.5 h-11 rounded-xl" />
                          <p className="text-xs text-muted-foreground mt-1">Aide le livreur à vous trouver plus vite.</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button type="button" variant="outline" className="rounded-xl gap-2 h-11"
                            onClick={useMyLocation} disabled={locating}>
                            <MapPin className={`w-4 h-4 ${locating ? "animate-pulse" : ""}`} />
                            {locating ? "Localisation…" : coords ? "Position mise à jour" : "Utiliser ma position GPS"}
                          </Button>
                          {coords && (
                            <span className="inline-flex items-center gap-1.5 text-xs text-green-500 font-medium">
                              <Check className="w-3.5 h-3.5" /> Position capturée
                            </span>
                          )}
                        </div>
                        {!selectedAddressId && (
                          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer select-none">
                            <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)}
                              className="w-4 h-4 rounded accent-[var(--primary)]" />
                            Enregistrer cette adresse pour mes prochaines commandes
                          </label>
                        )}
                        <div>
                          <Label htmlFor="phone">Numéro de téléphone</Label>
                          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)}
                            placeholder="+237 6 XX XX XX XX" className="mt-1.5 h-11 rounded-xl" />
                        </div>
                        <div>
                          <Label htmlFor="notes">Instructions spéciales (optionnel)</Label>
                          <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ex: Appartement 3B, code d'entrée 1234…"
                            rows={3} className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background border border-input text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                        </div>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-card border border-border/50">
                      <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-primary" /> Option de livraison
                      </h2>
                      <div className="space-y-3">
                        {DELIVERY_OPTIONS.map(({ id, label, time, price, icon: Icon }) => (
                          <label key={id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${deliveryOption === id ? "border-primary bg-primary/5" : "border-border hover:border-border/80"}`}>
                            <input type="radio" name="delivery" value={id} checked={deliveryOption === id} onChange={() => setDeliveryOption(id)} className="sr-only" />
                            <div className={`p-2 rounded-xl ${deliveryOption === id ? "bg-primary/10" : "bg-muted"}`}>
                              <Icon className={`w-5 h-5 ${deliveryOption === id ? "text-primary" : "text-muted-foreground"}`} />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">{label}</p>
                              <p className="text-sm text-muted-foreground">{time}</p>
                            </div>
                            <span className="font-bold text-foreground">{formatPrice(price)}</span>
                            {deliveryOption === id && <Check className="w-5 h-5 text-primary shrink-0" />}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-card border border-border/50">
                      <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" /> En cas d&apos;article en rupture
                      </h2>
                      <p className="text-xs text-muted-foreground mb-4">Pour les courses et la pharmacie, un article peut manquer au moment de la préparation.</p>
                      <div className="space-y-2">
                        {SUBSTITUTION_OPTIONS.map((o) => (
                          <label key={o.id} className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                            substitutionPref === o.id ? "border-primary bg-primary/5" : "border-border hover:border-border/80"
                          }`}>
                            <input type="radio" name="substitution" value={o.id}
                              checked={substitutionPref === o.id} onChange={() => setSubstitutionPref(o.id)} className="sr-only" />
                            <div className={`w-4 h-4 mt-0.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                              substitutionPref === o.id ? "border-primary" : "border-border"
                            }`}>
                              {substitutionPref === o.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-foreground">{o.label}</p>
                              <p className="text-xs text-muted-foreground">{o.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {error && <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-xl">{error}</p>}
                    <Button className="w-full h-14 rounded-xl text-base gap-2" onClick={() => { if (!address.trim()) { setError("Adresse requise."); return }; setError(null); setStep(2) }}>
                      Continuer vers le paiement <ChevronRight className="w-5 h-5" />
                    </Button>
                  </motion.div>
                )}

                {/* Step 2: Paiement */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="p-6 rounded-2xl bg-card border border-border/50">
                      <h2 className="text-lg font-bold text-foreground mb-4">Mode de paiement</h2>
                      <div className="space-y-3">
                        {PAYMENT_METHODS.map(({ id, label, emoji, desc }) => (
                          <label key={id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === id ? "border-primary bg-primary/5" : "border-border hover:border-border/80"}`}>
                            <input type="radio" name="payment" value={id} checked={paymentMethod === id} onChange={() => setPaymentMethod(id)} className="sr-only" />
                            <span className="text-2xl">{emoji}</span>
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">{label}</p>
                              <p className="text-xs text-muted-foreground">{desc}</p>
                            </div>
                            {paymentMethod === id && <Check className="w-5 h-5 text-primary shrink-0" />}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Promo code */}
                    <div className="p-6 rounded-2xl bg-card border border-border/50">
                      <h2 className="text-base font-bold text-foreground mb-3">Code promo</h2>
                      <div className="flex gap-2">
                        <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value)}
                          placeholder="Entrez votre code" className="h-11 rounded-xl flex-1" disabled={promoApplied} />
                        <Button variant="outline" className="h-11 rounded-xl px-5" onClick={applyPromo} disabled={promoApplied || !promoCode}>
                          {promoApplied ? <Check className="w-4 h-4 text-green-500" /> : "Appliquer"}
                        </Button>
                      </div>
                      {promoApplied && <p className="text-sm text-green-500 mt-2 flex items-center gap-1"><Check className="w-4 h-4" />Code appliqué (−{formatPrice(promoDiscount)})</p>}
                    </div>

                    {error && <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-xl">{error}</p>}
                    {error && orderId ? (
                      // La commande existe mais le paiement mobile n'a pas pu démarrer
                      <Button className="w-full h-14 rounded-xl text-base gap-2" onClick={retryPayment} disabled={submitting}>
                        {submitting ? "Initialisation…" : <><Shield className="w-5 h-5" /> Réessayer le paiement</>}
                      </Button>
                    ) : (
                      <div className="flex gap-3">
                        <Button variant="outline" className="h-14 rounded-xl px-6" onClick={() => setStep(1)}>
                          <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button className="flex-1 h-14 rounded-xl text-base gap-2" onClick={submitOrder} disabled={submitting}>
                          {submitting ? "Commande en cours…" : <><Shield className="w-5 h-5" /> Confirmer la commande</>}
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">Commande confirmée !</h2>
                    {orderNumber && <p className="text-muted-foreground mb-1">Commande <span className="font-bold text-foreground">#{orderNumber}</span></p>}
                    <p className="text-sm text-muted-foreground mb-8">Vous allez recevoir une notification dès que le vendeur accepte votre commande.</p>
                    <div className="flex gap-3 justify-center">
                      <Link href={orderId ? `/marketplace/orders` : "/marketplace/orders"}>
                        <Button className="rounded-xl gap-2">
                          <Package className="w-4 h-4" /> Suivre ma commande
                        </Button>
                      </Link>
                      <Link href="/marketplace">
                        <Button variant="outline" className="rounded-xl gap-2">
                          <ArrowRight className="w-4 h-4" /> Continuer mes achats
                        </Button>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right: Order summary */}
            {step !== 3 && (
              <div>
                <div className="sticky top-24 p-6 rounded-2xl bg-card border border-border/50">
                  <h2 className="text-lg font-bold text-foreground mb-4">Récapitulatif</h2>
                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        {item.image && (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted/30 shrink-0">
                            <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">×{item.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold text-foreground shrink-0">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border pt-4 space-y-2 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Sous-total</span><span>{formatPrice(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Livraison{vendorCount > 1 ? ` (${vendorCount} boutiques)` : ""}</span>
                      <span>{formatPrice(deliveryFee)}</span>
                    </div>
                    {vendorCount > 1 && (
                      <p className="text-xs text-muted-foreground/70">
                        Votre panier contient {vendorCount} boutiques : une commande et une
                        livraison distinctes par boutique.
                      </p>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>Frais de service (2%)</span><span>{formatPrice(serviceFee)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-500">
                        <span>Réduction</span><span>-{formatPrice(discount)}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-border mt-4 pt-4 flex justify-between font-bold text-lg">
                    <span>Total</span><span>{formatPrice(total)}</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <Shield className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs text-muted-foreground">Paiement 100% sécurisé par QuickGo Pay</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  )
}
