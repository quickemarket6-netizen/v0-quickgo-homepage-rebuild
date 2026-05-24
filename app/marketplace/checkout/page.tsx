"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  CreditCard,
  Smartphone,
  Truck,
  Shield,
  Clock,
  Check,
  Edit2,
  Plus,
  Zap,
} from "lucide-react"

const cartItems = [
  { id: 1, name: "iPhone 15 Pro Max 256GB", price: 850000, quantity: 1, image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=200" },
  { id: 2, name: "AirPods Pro 2", price: 150000, quantity: 2, image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=200" },
]

const savedAddresses = [
  { id: 1, name: "Maison", address: "123 Rue Bastos, Yaounde", phone: "+237 6 95 55 55 55", isDefault: true },
  { id: 2, name: "Bureau", address: "456 Avenue Kennedy, Douala", phone: "+237 6 77 88 99 00", isDefault: false },
]

const paymentMethods = [
  { id: "orange", name: "Orange Money", icon: "/images/orange-money.png", color: "from-orange-500/20 to-orange-600/20" },
  { id: "mtn", name: "MTN Mobile Money", icon: "/images/mtn-momo.png", color: "from-yellow-500/20 to-yellow-600/20" },
  { id: "card", name: "Carte bancaire", icon: null, color: "from-blue-500/20 to-blue-600/20" },
  { id: "quickgo", name: "QuickGo Pay", icon: null, color: "from-primary/20 to-accent/20" },
]

const deliveryOptions = [
  { id: "express", name: "Express", time: "30 min - 1h", price: 2500, icon: Zap },
  { id: "standard", name: "Standard", time: "2h - 4h", price: 1500, icon: Truck },
  { id: "scheduled", name: "Programme", time: "Choisir un creneau", price: 1000, icon: Clock },
]

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA"
}

export default function CheckoutPage() {
  const [step, setStep] = useState(1)
  const [selectedAddress, setSelectedAddress] = useState("1")
  const [selectedPayment, setSelectedPayment] = useState("orange")
  const [selectedDelivery, setSelectedDelivery] = useState("express")
  const [phoneNumber, setPhoneNumber] = useState("")

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = deliveryOptions.find(d => d.id === selectedDelivery)?.price || 0
  const total = subtotal + deliveryFee

  const steps = [
    { number: 1, title: "Livraison" },
    { number: 2, title: "Paiement" },
    { number: 3, title: "Confirmation" },
  ]

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 lg:pt-24 pb-32 lg:pb-20">
        {/* Header */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link href="/marketplace/cart" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ChevronLeft className="w-4 h-4" />
            Retour au panier
          </Link>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Finaliser la commande
            </h1>
          </motion.div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mt-8">
            {steps.map((s, idx) => (
              <div key={s.number} className="flex items-center">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                  step >= s.number ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {step > s.number ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold">
                      {s.number}
                    </span>
                  )}
                  <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-8 lg:w-16 h-0.5 mx-2 transition-colors ${
                    step > s.number ? "bg-primary" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Step 1: Delivery Address */}
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="p-6 rounded-2xl bg-card border border-border/50">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Adresse de livraison
                      </h2>
                      <Button variant="outline" size="sm" className="rounded-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Nouvelle adresse
                      </Button>
                    </div>

                    <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress} className="space-y-4">
                      {savedAddresses.map((addr) => (
                        <div key={addr.id} className="relative">
                          <RadioGroupItem value={String(addr.id)} id={`addr-${addr.id}`} className="peer sr-only" />
                          <Label
                            htmlFor={`addr-${addr.id}`}
                            className="flex items-start gap-4 p-4 rounded-xl border-2 border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                          >
                            <div className="w-5 h-5 rounded-full border-2 border-muted-foreground flex items-center justify-center shrink-0 mt-0.5 peer-data-[state=checked]:border-primary">
                              {selectedAddress === String(addr.id) && (
                                <div className="w-3 h-3 rounded-full bg-primary" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-foreground">{addr.name}</span>
                                {addr.isDefault && (
                                  <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
                                    Par defaut
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{addr.address}</p>
                              <p className="text-sm text-muted-foreground">{addr.phone}</p>
                            </div>
                            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                              <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Delivery Options */}
                  <div className="p-6 rounded-2xl bg-card border border-border/50">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                      <Truck className="w-5 h-5 text-primary" />
                      Mode de livraison
                    </h2>

                    <RadioGroup value={selectedDelivery} onValueChange={setSelectedDelivery} className="space-y-3">
                      {deliveryOptions.map((option) => (
                        <div key={option.id} className="relative">
                          <RadioGroupItem value={option.id} id={`delivery-${option.id}`} className="peer sr-only" />
                          <Label
                            htmlFor={`delivery-${option.id}`}
                            className="flex items-center justify-between p-4 rounded-xl border-2 border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                          >
                            <div className="flex items-center gap-4">
                              <div className="p-2 rounded-lg bg-muted">
                                <option.icon className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <span className="font-semibold text-foreground">{option.name}</span>
                                <p className="text-sm text-muted-foreground">{option.time}</p>
                              </div>
                            </div>
                            <span className="font-bold text-foreground">{formatPrice(option.price)}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <Button onClick={() => setStep(2)} className="w-full h-14 rounded-xl" size="lg">
                    Continuer vers le paiement
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <div className="p-6 rounded-2xl bg-card border border-border/50">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Mode de paiement
                    </h2>

                    <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment} className="space-y-3">
                      {paymentMethods.map((method) => (
                        <div key={method.id} className="relative">
                          <RadioGroupItem value={method.id} id={`payment-${method.id}`} className="peer sr-only" />
                          <Label
                            htmlFor={`payment-${method.id}`}
                            className={`flex items-center gap-4 p-4 rounded-xl border-2 border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-gradient-to-r ${method.color}`}
                          >
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                              {method.id === "card" ? (
                                <CreditCard className="w-6 h-6 text-primary" />
                              ) : method.id === "quickgo" ? (
                                <span className="text-xl font-bold text-primary">Q</span>
                              ) : (
                                <Smartphone className="w-6 h-6 text-primary" />
                              )}
                            </div>
                            <span className="font-semibold text-foreground">{method.name}</span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    {/* Phone Number for Mobile Money */}
                    {(selectedPayment === "orange" || selectedPayment === "mtn") && (
                      <div className="mt-6">
                        <Label htmlFor="phone" className="text-sm font-medium text-foreground mb-2 block">
                          Numero de telephone
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+237 6XX XXX XXX"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="h-12"
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                          Vous recevrez une demande de paiement sur ce numero
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-14 rounded-xl" size="lg">
                      <ChevronLeft className="w-5 h-5 mr-2" />
                      Retour
                    </Button>
                    <Button onClick={() => setStep(3)} className="flex-1 h-14 rounded-xl" size="lg">
                      Confirmer la commande
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-secondary/20 flex items-center justify-center">
                    <Check className="w-12 h-12 text-secondary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Commande confirmee !</h2>
                  <p className="text-muted-foreground mb-2">
                    Commande #QG2026052401
                  </p>
                  <p className="text-sm text-muted-foreground mb-8">
                    Vous allez recevoir une demande de paiement sur votre telephone
                  </p>
                  
                  <div className="p-6 rounded-2xl bg-card border border-border/50 text-left max-w-md mx-auto mb-8">
                    <h3 className="font-semibold text-foreground mb-4">Prochaines etapes</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">1</div>
                        <span className="text-sm text-muted-foreground">Validez le paiement sur votre telephone</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">2</div>
                        <span className="text-sm text-muted-foreground">Recevez la confirmation par SMS</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">3</div>
                        <span className="text-sm text-muted-foreground">Suivez votre livraison en temps reel</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/marketplace/orders">
                      <Button size="lg" className="rounded-xl">
                        Suivre ma commande
                      </Button>
                    </Link>
                    <Link href="/marketplace">
                      <Button variant="outline" size="lg" className="rounded-xl">
                        Continuer mes achats
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="sticky top-24 p-6 rounded-2xl bg-card border border-border/50"
              >
                <h2 className="text-lg font-bold text-foreground mb-4">Votre commande</h2>

                {/* Items */}
                <div className="space-y-4 pb-4 border-b border-border/50">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted/30 shrink-0">
                        <Image src={item.image} alt={item.name} fill className="object-cover" />
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-foreground line-clamp-2">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="space-y-3 py-4 border-b border-border/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span className="text-foreground">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Livraison</span>
                    <span className="text-foreground">{formatPrice(deliveryFee)}</span>
                  </div>
                </div>

                <div className="flex justify-between py-4">
                  <span className="text-lg font-bold text-foreground">Total</span>
                  <span className="text-xl font-bold text-foreground">{formatPrice(total)}</span>
                </div>

                {/* Trust Badges */}
                <div className="pt-4 border-t border-border/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Paiement 100% securise</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Truck className="w-4 h-4 text-primary" />
                    <span>Livraison suivie en temps reel</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  )
}
