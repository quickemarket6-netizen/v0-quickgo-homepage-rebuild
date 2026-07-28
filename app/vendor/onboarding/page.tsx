"use client"

import { useState, useRef } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Store,
  User,
  FileText,
  CreditCard,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  MapPin,
  Phone,
  Mail,
  Building2,
  Camera,
  Shield,
  Clock,
} from "lucide-react"

const steps = [
  { number: 1, title: "Informations", icon: User },
  { number: 2, title: "Boutique", icon: Store },
  { number: 3, title: "Documents", icon: FileText },
  { number: 4, title: "Paiement", icon: CreditCard },
]

const categories = [
  "Electronique", "Mode", "Maison", "Beaute", "Sports", "Alimentation", "Pharmacie", "Autres"
]

export default function VendorOnboardingPage() {
  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    // Business Info
    businessName: "",
    businessType: "",
    category: "",
    description: "",
    address: "",
    city: "yaounde",
    // Documents (public URLs after upload)
    logoUrl: "",
    idCardUrl: "",
    businessLicenseUrl: "",
    taxId: "",
    // Payment
    paymentMethod: "mobile_money",
    mobileNumber: "",
    bankName: "",
    accountNumber: "",
  })
  const [uploading, setUploading] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [fileNames, setFileNames] = useState<Record<string, string>>({})
  const logoInputRef = useRef<HTMLInputElement>(null)
  const idCardInputRef = useRef<HTMLInputElement>(null)
  const licenseInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleFileUpload = async (kind: "logo" | "id_card" | "business_license", file: File | undefined) => {
    if (!file) return
    setUploading(kind)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("kind", kind)
      const res = await fetch("/api/vendor/onboarding/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setUploadError(data.error ?? "Échec de l'envoi du fichier")
        return
      }
      const field = kind === "logo" ? "logoUrl" : kind === "id_card" ? "idCardUrl" : "businessLicenseUrl"
      setFormData(prev => ({ ...prev, [field]: data.url }))
      setFileNames(prev => ({ ...prev, [kind]: file.name }))
    } catch {
      setUploadError("Erreur réseau pendant l'envoi")
    } finally {
      setUploading(null)
    }
  }

  const handleSubmit = async () => {
    if (!canProceed()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/vendor/onboarding", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur lors de la soumission")
      setSubmitted(true)
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur inattendue")
    } finally {
      setSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.email && formData.phone
      case 2:
        return formData.businessName && formData.category && formData.address
      case 3:
        return formData.taxId && formData.idCardUrl
      case 4:
        return formData.paymentMethod && (formData.mobileNumber || formData.accountNumber)
      default:
        return false
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-6"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Demande soumise !</h1>
            <p className="text-muted-foreground">
              Votre boutique <span className="font-semibold text-foreground">{formData.businessName}</span> a bien été enregistrée.
              Notre équipe va vérifier vos informations et vous notifier par email sous <strong>24 à 48h ouvrables</strong>.
            </p>
          </div>
          <div className="bg-muted/50 rounded-xl p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4 shrink-0" />
              <span>Délai de vérification : 24 à 48h ouvrables</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Vous recevrez un email à l'activation de votre compte</span>
            </div>
          </div>
          <Link href="/" className="block">
            <Button className="w-full">Retour à l'accueil</Button>
          </Link>
        </motion.div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border/50 z-50">
        <div className="max-w-5xl mx-auto h-full px-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <span className="text-xl font-bold text-white">Q</span>
            </div>
            <span className="font-bold text-foreground">QuickGo Vendeur</span>
          </Link>
          <div className="text-sm text-muted-foreground">
            Etape {step} sur 4
          </div>
        </div>
      </header>

      <div className="pt-24 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Progress */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-12"
          >
            {steps.map((s, idx) => (
              <div key={s.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                    step >= s.number 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {step > s.number ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <s.icon className="w-6 h-6" />
                    )}
                  </div>
                  <span className={`text-xs mt-2 ${step >= s.number ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.title}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-16 lg:w-24 h-0.5 mx-2 transition-colors ${
                    step > s.number ? "bg-primary" : "bg-muted"
                  }`} />
                )}
              </div>
            ))}
          </motion.div>

          {/* Step 1: Personal Info */}
          {step === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  Informations personnelles
                </h1>
                <p className="text-muted-foreground">
                  Commencez par nous parler de vous
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prenom *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Votre prenom"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="h-12 mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nom *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Votre nom"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="h-12 mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="h-12 pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Telephone *</Label>
                  <div className="relative mt-2">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+237 6XX XXX XXX"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="h-12 pl-10"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Business Info */}
          {step === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  Votre boutique
                </h1>
                <p className="text-muted-foreground">
                  Decrivez votre activite commerciale
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-6">
                {/* Logo Upload */}
                <div>
                  <Label>Logo de la boutique</Label>
                  <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                    onChange={(e) => handleFileUpload("logo", e.target.files?.[0])} />
                  <div className="mt-2 flex items-center gap-4">
                    <div className="w-24 h-24 rounded-xl bg-muted/30 border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                      {formData.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <Button type="button" variant="outline" className="rounded-xl"
                      disabled={uploading === "logo"}
                      onClick={() => logoInputRef.current?.click()}>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading === "logo" ? "Envoi…" : formData.logoUrl ? "Remplacer" : "Telecharger"}
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="businessName">Nom de la boutique *</Label>
                  <div className="relative mt-2">
                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="businessName"
                      name="businessName"
                      placeholder="Ma Super Boutique"
                      value={formData.businessName}
                      onChange={handleInputChange}
                      className="h-12 pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Categorie principale *</Label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full h-12 mt-2 px-3 rounded-xl bg-input border border-border text-foreground"
                  >
                    <option value="">Selectionnez une categorie</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Decrivez votre boutique en quelques mots..."
                    value={formData.description}
                    onChange={handleInputChange}
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Adresse *</Label>
                  <div className="relative mt-2">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="address"
                      name="address"
                      placeholder="Adresse complete"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="h-12 pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label>Ville</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {["yaounde", "douala"].map(city => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, city }))}
                        className={`p-4 rounded-xl border-2 text-center transition-all ${
                          formData.city === city
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="font-medium text-foreground capitalize">{city}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  Documents legaux
                </h1>
                <p className="text-muted-foreground">
                  Verification de votre identite et activite
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-6">
                {uploadError && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">{uploadError}</p>
                )}
                <div>
                  <Label>Piece d&apos;identite (CNI ou Passeport) *</Label>
                  <input ref={idCardInputRef} type="file" accept="image/png,image/jpeg,application/pdf" className="hidden"
                    onChange={(e) => handleFileUpload("id_card", e.target.files?.[0])} />
                  <div
                    onClick={() => uploading !== "id_card" && idCardInputRef.current?.click()}
                    className={`mt-2 p-8 rounded-xl border-2 border-dashed transition-colors cursor-pointer text-center ${
                      formData.idCardUrl ? "border-green-500/50 bg-green-500/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {formData.idCardUrl ? (
                      <>
                        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400" />
                        <p className="text-sm text-foreground font-medium">{fileNames.id_card ?? "Document envoyé"}</p>
                        <p className="text-xs text-muted-foreground mt-1">Cliquez pour remplacer</p>
                      </>
                    ) : (
                      <>
                        <Upload className={`w-10 h-10 mx-auto mb-3 text-muted-foreground ${uploading === "id_card" ? "animate-pulse" : ""}`} />
                        <p className="text-sm text-muted-foreground">
                          {uploading === "id_card" ? "Envoi en cours…" : "Cliquez pour telecharger ou glissez-deposez"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG ou PDF (max. 5MB)
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Registre de commerce (optionnel)</Label>
                  <input ref={licenseInputRef} type="file" accept="image/png,image/jpeg,application/pdf" className="hidden"
                    onChange={(e) => handleFileUpload("business_license", e.target.files?.[0])} />
                  <div
                    onClick={() => uploading !== "business_license" && licenseInputRef.current?.click()}
                    className={`mt-2 p-8 rounded-xl border-2 border-dashed transition-colors cursor-pointer text-center ${
                      formData.businessLicenseUrl ? "border-green-500/50 bg-green-500/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    {formData.businessLicenseUrl ? (
                      <>
                        <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-400" />
                        <p className="text-sm text-foreground font-medium">{fileNames.business_license ?? "Document envoyé"}</p>
                        <p className="text-xs text-muted-foreground mt-1">Cliquez pour remplacer</p>
                      </>
                    ) : (
                      <>
                        <Upload className={`w-10 h-10 mx-auto mb-3 text-muted-foreground ${uploading === "business_license" ? "animate-pulse" : ""}`} />
                        <p className="text-sm text-muted-foreground">
                          {uploading === "business_license" ? "Envoi en cours…" : "Cliquez pour telecharger"}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="taxId">Numero contribuable *</Label>
                  <div className="relative mt-2">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="taxId"
                      name="taxId"
                      placeholder="M012400012345A"
                      value={formData.taxId}
                      onChange={handleInputChange}
                      className="h-12 pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Vos documents sont securises</p>
                    <p className="text-xs text-muted-foreground">
                      Nous utilisons un chiffrement de bout en bout pour proteger vos informations.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Payment */}
          {step === 4 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                  Informations de paiement
                </h1>
                <p className="text-muted-foreground">
                  Comment souhaitez-vous recevoir vos paiements ?
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border/50 space-y-6">
                <div>
                  <Label>Mode de paiement</Label>
                  <div className="grid sm:grid-cols-2 gap-3 mt-2">
                    {[
                      { id: "mobile_money", label: "Mobile Money", desc: "Orange/MTN" },
                      { id: "bank", label: "Virement bancaire", desc: "Compte bancaire" },
                    ].map(method => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.id }))}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.paymentMethod === method.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="font-medium text-foreground block">{method.label}</span>
                        <span className="text-sm text-muted-foreground">{method.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {formData.paymentMethod === "mobile_money" && (
                  <div>
                    <Label htmlFor="mobileNumber">Numero Mobile Money *</Label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="mobileNumber"
                        name="mobileNumber"
                        placeholder="+237 6XX XXX XXX"
                        value={formData.mobileNumber}
                        onChange={handleInputChange}
                        className="h-12 pl-10"
                      />
                    </div>
                  </div>
                )}

                {formData.paymentMethod === "bank" && (
                  <>
                    <div>
                      <Label htmlFor="bankName">Nom de la banque *</Label>
                      <Input
                        id="bankName"
                        name="bankName"
                        placeholder="Ex: Afriland First Bank"
                        value={formData.bankName}
                        onChange={handleInputChange}
                        className="h-12 mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountNumber">Numero de compte *</Label>
                      <Input
                        id="accountNumber"
                        name="accountNumber"
                        placeholder="XXXX XXXX XXXX XXXX"
                        value={formData.accountNumber}
                        onChange={handleInputChange}
                        className="h-12 mt-2"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Delai de verification</p>
                    <p className="text-xs text-muted-foreground">
                      Votre compte sera verifie sous 24-48h ouvrables apres soumission.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Navigation */}
          <div className="flex gap-4 mt-8">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex-1 h-14 rounded-xl"
                size="lg"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Retour
              </Button>
            )}
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex-1 h-14 rounded-xl"
                size="lg"
              >
                Continuer
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            ) : (
              <Button
                disabled={!canProceed() || submitting}
                onClick={handleSubmit}
                className="flex-1 h-14 rounded-xl"
                size="lg"
              >
                {submitting ? (
                  <>
                    <span className="w-5 h-5 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Soumission…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Soumettre ma demande
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
