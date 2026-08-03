"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Package,
  MapPin,
  Truck,
  Bike,
  Car,
  Clock,
  Zap,
  ChevronRight,
  Camera,
  Scale,
  Shield,
  CreditCard,
  Check,
  Loader2,
} from "lucide-react"

const vehicleTypes = [
  { id: "moto", name: "Moto", icon: Bike, maxWeight: "5 kg", price: 1500, eta: "30-45 min" },
  { id: "voiture", name: "Voiture", icon: Car, maxWeight: "20 kg", price: 3000, eta: "45-60 min" },
  { id: "camion", name: "Camion", icon: Truck, maxWeight: "100 kg", price: 8000, eta: "1-2h" },
]

const deliveryTypes = [
  { id: "express", name: "Express", icon: Zap, description: "Livraison prioritaire", multiplier: 1.5 },
  { id: "standard", name: "Standard", icon: Clock, description: "Livraison normale", multiplier: 1 },
]

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA"
}

export default function CreateDeliveryPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedVehicle, setSelectedVehicle] = useState("moto")
  const [selectedDeliveryType, setSelectedDeliveryType] = useState("standard")
  const [formData, setFormData] = useState({
    pickupAddress: "",
    pickupName: "",
    pickupPhone: "",
    dropoffAddress: "",
    dropoffName: "",
    dropoffPhone: "",
    packageDescription: "",
    packageWeight: "",
    instructions: "",
  })
  const [step1Error, setStep1Error] = useState<string | null>(null)
  const [step2Error, setStep2Error] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const basePrice = vehicleTypes.find(v => v.id === selectedVehicle)?.price || 1500
  const multiplier = deliveryTypes.find(d => d.id === selectedDeliveryType)?.multiplier || 1
  const totalPrice = Math.round(basePrice * multiplier)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleStep1Continue = () => {
    if (!formData.pickupAddress.trim() || !formData.pickupPhone.trim() ||
        !formData.dropoffAddress.trim() || !formData.dropoffPhone.trim()) {
      setStep1Error("Veuillez remplir tous les champs obligatoires (*)")
      return
    }
    setStep1Error(null)
    setStep(2)
  }

  const handleStep2Continue = () => {
    if (!formData.packageDescription.trim()) {
      setStep2Error("Veuillez décrire le colis")
      return
    }
    setStep2Error(null)
    setStep(3)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setSubmitError(null)
    try {
      const weight = parseFloat(formData.packageWeight) || 0
      const package_type = weight > 10 ? "large" : "standard"

      const res = await fetch("/api/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_type,
          package_description: formData.packageDescription,
          pickup_address: formData.pickupAddress,
          pickup_contact: formData.pickupName || undefined,
          pickup_phone: formData.pickupPhone,
          delivery_address: formData.dropoffAddress,
          delivery_contact: formData.dropoffName || undefined,
          delivery_phone: formData.dropoffPhone,
          notes: formData.instructions || undefined,
          vehicle_type: selectedVehicle,
          delivery_type: selectedDeliveryType,
          payment_method: "wallet",
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        // Guest reaching the final step: send them to login and bring them
        // straight back to the booking form afterwards.
        if (res.status === 401) {
          router.push(`/auth/login?next=${encodeURIComponent("/delivery/create")}`)
          return
        }
        setSubmitError(data.error ?? "Une erreur est survenue")
        return
      }
      router.push(`/delivery/history?created=${data.tracking_number}`)
    } catch {
      setSubmitError("Erreur réseau, veuillez réessayer")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      
      <div className="pt-20 lg:pt-24 pb-32 lg:pb-20">
        {/* Header */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Nouvelle Livraison
            </h1>
            <p className="text-muted-foreground">
              Envoyez un colis partout en ville
            </p>
          </motion.div>

          {/* Progress */}
          <div className="flex items-center gap-2 mt-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div className={`w-12 lg:w-24 h-0.5 mx-2 transition-colors ${
                    step > s ? "bg-primary" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Step 1: Addresses */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Pickup */}
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-lg bg-secondary/20">
                    <MapPin className="w-5 h-5 text-secondary" />
                  </div>
                  Point de collecte
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="pickupAddress">Adresse de collecte *</Label>
                    <Input
                      id="pickupAddress"
                      name="pickupAddress"
                      placeholder="Ex: 123 Rue Bastos, Yaounde"
                      value={formData.pickupAddress}
                      onChange={handleInputChange}
                      className="h-12 mt-2"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pickupName">Nom du contact</Label>
                      <Input
                        id="pickupName"
                        name="pickupName"
                        placeholder="Nom complet"
                        value={formData.pickupName}
                        onChange={handleInputChange}
                        className="h-12 mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pickupPhone">Telephone *</Label>
                      <Input
                        id="pickupPhone"
                        name="pickupPhone"
                        placeholder="+237 6XX XXX XXX"
                        value={formData.pickupPhone}
                        onChange={handleInputChange}
                        className="h-12 mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dropoff */}
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  Point de livraison
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dropoffAddress">Adresse de livraison *</Label>
                    <Input
                      id="dropoffAddress"
                      name="dropoffAddress"
                      placeholder="Ex: 456 Avenue Kennedy, Douala"
                      value={formData.dropoffAddress}
                      onChange={handleInputChange}
                      className="h-12 mt-2"
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dropoffName">Nom du destinataire</Label>
                      <Input
                        id="dropoffName"
                        name="dropoffName"
                        placeholder="Nom complet"
                        value={formData.dropoffName}
                        onChange={handleInputChange}
                        className="h-12 mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dropoffPhone">Telephone *</Label>
                      <Input
                        id="dropoffPhone"
                        name="dropoffPhone"
                        placeholder="+237 6XX XXX XXX"
                        value={formData.dropoffPhone}
                        onChange={handleInputChange}
                        className="h-12 mt-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {step1Error && (
                <p className="text-sm text-destructive text-center">{step1Error}</p>
              )}
              <Button onClick={handleStep1Continue} className="w-full h-14 rounded-xl" size="lg">
                Continuer
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          )}

          {/* Step 2: Package Details */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Package Info */}
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-lg bg-accent/20">
                    <Package className="w-5 h-5 text-accent" />
                  </div>
                  Details du colis
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="packageDescription">Description du colis *</Label>
                    <Input
                      id="packageDescription"
                      name="packageDescription"
                      placeholder="Ex: Documents, vetements, electronique..."
                      value={formData.packageDescription}
                      onChange={handleInputChange}
                      className="h-12 mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="packageWeight">Poids estime (kg)</Label>
                    <Input
                      id="packageWeight"
                      name="packageWeight"
                      type="number"
                      placeholder="Ex: 2"
                      value={formData.packageWeight}
                      onChange={handleInputChange}
                      className="h-12 mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="instructions">Instructions speciales</Label>
                    <Textarea
                      id="instructions"
                      name="instructions"
                      placeholder="Instructions pour le livreur..."
                      value={formData.instructions}
                      onChange={handleInputChange}
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                  <div className="pt-4">
                    <Label className="mb-3 block">Photo du colis (optionnel)</Label>
                    <button className="w-full h-32 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Ajouter une photo</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Vehicle Selection */}
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                  Type de vehicule
                </h2>
                <RadioGroup value={selectedVehicle} onValueChange={setSelectedVehicle} className="space-y-3">
                  {vehicleTypes.map((vehicle) => (
                    <div key={vehicle.id} className="relative">
                      <RadioGroupItem value={vehicle.id} id={`vehicle-${vehicle.id}`} className="peer sr-only" />
                      <Label
                        htmlFor={`vehicle-${vehicle.id}`}
                        className="flex items-center justify-between p-4 rounded-xl border-2 border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-muted">
                            <vehicle.icon className="w-6 h-6 text-foreground" />
                          </div>
                          <div>
                            <span className="font-semibold text-foreground">{vehicle.name}</span>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Scale className="w-3 h-3" />
                                Max {vehicle.maxWeight}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {vehicle.eta}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="font-bold text-foreground">{formatPrice(vehicle.price)}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Delivery Type */}
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
                  <div className="p-2 rounded-lg bg-secondary/20">
                    <Zap className="w-5 h-5 text-secondary" />
                  </div>
                  Mode de livraison
                </h2>
                <RadioGroup value={selectedDeliveryType} onValueChange={setSelectedDeliveryType} className="grid sm:grid-cols-2 gap-3">
                  {deliveryTypes.map((type) => (
                    <div key={type.id} className="relative">
                      <RadioGroupItem value={type.id} id={`type-${type.id}`} className="peer sr-only" />
                      <Label
                        htmlFor={`type-${type.id}`}
                        className="flex flex-col items-center p-4 rounded-xl border-2 border-border cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                      >
                        <type.icon className={`w-8 h-8 mb-2 ${type.id === "express" ? "text-secondary" : "text-muted-foreground"}`} />
                        <span className="font-semibold text-foreground">{type.name}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                        {type.id === "express" && (
                          <span className="text-xs text-secondary mt-1">+50%</span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {step2Error && (
                <p className="text-sm text-destructive text-center">{step2Error}</p>
              )}
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-14 rounded-xl" size="lg">
                  Retour
                </Button>
                <Button onClick={handleStep2Continue} className="flex-1 h-14 rounded-xl" size="lg">
                  Continuer
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirmation */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Summary */}
              <div className="p-6 rounded-2xl bg-card border border-border/50">
                <h2 className="text-xl font-bold text-foreground mb-6">Resume de la livraison</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                    <div className="p-2 rounded-lg bg-secondary/20 shrink-0">
                      <MapPin className="w-4 h-4 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Collecte</p>
                      <p className="font-medium text-foreground">{formData.pickupAddress || "123 Rue Bastos, Yaounde"}</p>
                      <p className="text-sm text-muted-foreground">{formData.pickupPhone || "+237 6 95 55 55 55"}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                    <div className="p-2 rounded-lg bg-primary/20 shrink-0">
                      <MapPin className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Livraison</p>
                      <p className="font-medium text-foreground">{formData.dropoffAddress || "456 Avenue Kennedy, Douala"}</p>
                      <p className="text-sm text-muted-foreground">{formData.dropoffPhone || "+237 6 77 88 99 00"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
                    <div className="p-2 rounded-lg bg-accent/20 shrink-0">
                      <Package className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Colis</p>
                      <p className="font-medium text-foreground">{formData.packageDescription || "Documents"}</p>
                      <p className="text-sm text-muted-foreground">{formData.packageWeight || "2"} kg</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Vehicule ({vehicleTypes.find(v => v.id === selectedVehicle)?.name})</span>
                  <span className="text-foreground">{formatPrice(basePrice)}</span>
                </div>
                {selectedDeliveryType === "express" && (
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-muted-foreground">Supplement Express</span>
                    <span className="text-foreground">{formatPrice(basePrice * 0.5)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                  <span className="text-lg font-bold text-foreground">Total</span>
                  <span className="text-2xl font-bold text-foreground">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              {/* Trust */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium text-foreground">Livraison assure</p>
                </div>
                <div className="p-4 rounded-xl bg-card border border-border/50 text-center">
                  <CreditCard className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium text-foreground">Paiement securise</p>
                </div>
              </div>

              {submitError && (
                <p className="text-sm text-destructive text-center">{submitError}</p>
              )}
              <div className="flex gap-4">
                <Button variant="outline" onClick={() => setStep(2)} disabled={isLoading} className="flex-1 h-14 rounded-xl" size="lg">
                  Retour
                </Button>
                <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 h-14 rounded-xl" size="lg">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Confirmer et payer"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      <Footer />
    </main>
  )
}
