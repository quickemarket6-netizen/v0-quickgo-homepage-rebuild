"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight,
  Loader2, ShoppingBag, Store, Bike, Shield, CheckCircle,
  ArrowLeft, Car, MapPin,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Role = "client" | "vendor" | "driver" | "admin"

interface RoleCard {
  role: Role
  label: string
  emoji: string
  desc: string
  icon: typeof ShoppingBag
  color: string
  bg: string
  border: string
}

const ROLES: RoleCard[] = [
  {
    role: "client",
    label: "Client",
    emoji: "🛍️",
    desc: "Je veux commander et me faire livrer",
    icon: ShoppingBag,
    color: "#3b82f6",
    bg: "bg-[#3b82f6]/10",
    border: "border-[#3b82f6]",
  },
  {
    role: "vendor",
    label: "Vendeur",
    emoji: "🏪",
    desc: "Je veux vendre mes produits sur QuickGo",
    icon: Store,
    color: "#22c55e",
    bg: "bg-[#22c55e]/10",
    border: "border-[#22c55e]",
  },
  {
    role: "driver",
    label: "Livreur",
    emoji: "🛵",
    desc: "Je veux effectuer des livraisons",
    icon: Bike,
    color: "#f97316",
    bg: "bg-[#f97316]/10",
    border: "border-[#f97316]",
  },
  {
    role: "admin",
    label: "Administrateur",
    emoji: "🛡️",
    desc: "Accès restreint — équipe QuickGo",
    icon: Shield,
    color: "#8b5cf6",
    bg: "bg-[#8b5cf6]/10",
    border: "border-[#8b5cf6]",
  },
]

const VEHICLE_TYPES = ["Moto", "Voiture", "Vélo", "Tricycle"]
const VENDOR_CATEGORIES = ["Alimentation", "Restaurant", "Pharmacie", "Électronique", "Mode", "Beauté", "Autre"]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    city: "",
    // Vendor-specific
    business_name: "",
    vendor_category: "",
    // Driver-specific
    vehicle_type: "",
    // Admin-specific
    access_code: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
    setStep(2)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) return
    if (!acceptTerms) { setError("Veuillez accepter les conditions d'utilisation"); return }
    if (formData.password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères"); return }
    if (selectedRole === "admin" && formData.access_code !== "QUICKGO_ADMIN_2024") {
      setError("Code d'accès administrateur invalide")
      return
    }

    setLoading(true)
    setError("")

    const supabase = createClient()

    const metadata: Record<string, string> = {
      full_name: formData.name,
      phone: formData.phone,
      role: selectedRole,
      city: formData.city,
    }
    if (selectedRole === "vendor") {
      metadata.business_name = formData.business_name
      metadata.vendor_category = formData.vendor_category
    }
    if (selectedRole === "driver") {
      metadata.vehicle_type = formData.vehicle_type
    }

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
        data: metadata,
      },
    })

    if (error) {
      setError(error.message === "User already registered"
        ? "Un compte existe déjà avec cet email"
        : error.message)
      setLoading(false)
      return
    }

    router.push("/auth/sign-up-success")
  }

  const handleGoogleSignup = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
      },
    })
  }

  const roleCard = ROLES.find((r) => r.role === selectedRole)

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex">
      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">

          {/* Logo */}
          <Link href="/" className="inline-block mb-8">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0007-ezKXkl63WOFNwwQlwNLqPoMzyaOKo5.jpg"
              alt="QuickGo" width={140} height={40} className="h-10 w-auto"
            />
          </Link>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  s < step ? "bg-[#22c55e] text-white" :
                  s === step ? "bg-[#3b82f6] text-white" :
                  "bg-[#16161f] text-white/30 border border-[#1e1e2e]"
                }`}>
                  {s < step ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${s === step ? "text-white" : "text-white/30"}`}>
                  {s === 1 ? "Choisir mon profil" : "Mes informations"}
                </span>
                {s < 2 && <div className="w-8 h-px bg-[#1e1e2e]" />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">

            {/* ── STEP 1 : Role selection ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h1 className="text-2xl font-bold text-white mb-1">Créer un compte</h1>
                <p className="text-white/40 mb-6 text-sm">Quel est votre profil sur QuickGo ?</p>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  {ROLES.map((r) => (
                    <motion.button key={r.role} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                      onClick={() => handleRoleSelect(r.role)}
                      className="p-5 rounded-2xl border-2 border-[#1e1e2e] bg-[#16161f] text-left transition-all hover:border-[#3b82f6]/50 group">
                      <span className="text-3xl block mb-3">{r.emoji}</span>
                      <p className="text-white font-semibold text-sm mb-1">{r.label}</p>
                      <p className="text-white/40 text-xs leading-relaxed">{r.desc}</p>
                    </motion.button>
                  ))}
                </div>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#1e1e2e]" /></div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-[#0a0a0f] text-white/30">Ou continuer avec</span>
                  </div>
                </div>

                <Button variant="outline" className="w-full h-12 border-[#1e1e2e] bg-[#16161f] text-white hover:bg-[#1c1c28] gap-3"
                  onClick={handleGoogleSignup} type="button">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  S&apos;inscrire avec Google
                </Button>

                <p className="mt-6 text-center text-sm text-white/30">
                  Déjà un compte ?{" "}
                  <Link href="/auth/login" className="text-[#3b82f6] font-medium hover:underline">Se connecter</Link>
                </p>
              </motion.div>
            )}

            {/* ── STEP 2 : Form ── */}
            {step === 2 && selectedRole && roleCard && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>

                {/* Selected role badge */}
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => { setStep(1); setError("") }}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <ArrowLeft className="w-4 h-4 text-white/40" />
                  </button>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${roleCard.border} ${roleCard.bg}`}>
                    <span className="text-base">{roleCard.emoji}</span>
                    <span className="text-sm font-semibold" style={{ color: roleCard.color }}>{roleCard.label}</span>
                  </div>
                  <div>
                    <p className="text-white font-bold">Créer votre compte</p>
                    <p className="text-white/30 text-xs">Remplissez vos informations</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Common fields */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-white/60 text-xs">Nom complet *</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input name="name" type="text" placeholder="Samuel Djoko"
                          value={formData.name} onChange={handleChange} required
                          className="pl-10 h-11 bg-[#16161f] border-[#1e1e2e] text-white placeholder:text-white/20 focus:border-[#3b82f6]/50" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white/60 text-xs">Téléphone {selectedRole !== "client" ? "*" : ""}</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input name="phone" type="tel" placeholder="+237 6XX XX XX XX"
                          value={formData.phone} onChange={handleChange}
                          required={selectedRole !== "client"}
                          className="pl-10 h-11 bg-[#16161f] border-[#1e1e2e] text-white placeholder:text-white/20 focus:border-[#3b82f6]/50" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-white/60 text-xs">Adresse email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <Input name="email" type="email" placeholder="exemple@email.com"
                        value={formData.email} onChange={handleChange} required
                        className="pl-10 h-11 bg-[#16161f] border-[#1e1e2e] text-white placeholder:text-white/20 focus:border-[#3b82f6]/50" />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-white/60 text-xs">Mot de passe *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input name="password" type={showPassword ? "text" : "password"} placeholder="••••••••"
                          value={formData.password} onChange={handleChange} required minLength={6}
                          className="pl-10 pr-10 h-11 bg-[#16161f] border-[#1e1e2e] text-white placeholder:text-white/20 focus:border-[#3b82f6]/50" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-white/60 text-xs">Ville</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input name="city" type="text" placeholder="Yaoundé"
                          value={formData.city} onChange={handleChange}
                          className="pl-10 h-11 bg-[#16161f] border-[#1e1e2e] text-white placeholder:text-white/20 focus:border-[#3b82f6]/50" />
                      </div>
                    </div>
                  </div>

                  {/* Vendor-specific */}
                  {selectedRole === "vendor" && (
                    <div className="grid sm:grid-cols-2 gap-4 p-4 rounded-xl border border-[#22c55e]/20 bg-[#22c55e]/5">
                      <div className="space-y-1.5">
                        <Label className="text-white/60 text-xs">Nom de la boutique *</Label>
                        <div className="relative">
                          <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                          <Input name="business_name" type="text" placeholder="Ma Boutique"
                            value={formData.business_name} onChange={handleChange} required
                            className="pl-10 h-11 bg-[#16161f] border-[#1e1e2e] text-white placeholder:text-white/20 focus:border-[#22c55e]/50" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-white/60 text-xs">Catégorie *</Label>
                        <select name="vendor_category" value={formData.vendor_category} onChange={handleChange} required
                          className="w-full h-11 px-3 bg-[#16161f] border border-[#1e1e2e] text-white rounded-xl text-sm focus:outline-none focus:border-[#22c55e]/50">
                          <option value="" className="bg-[#16161f]">Sélectionner…</option>
                          {VENDOR_CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#16161f]">{c}</option>)}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Driver-specific */}
                  {selectedRole === "driver" && (
                    <div className="p-4 rounded-xl border border-[#f97316]/20 bg-[#f97316]/5 space-y-1.5">
                      <Label className="text-white/60 text-xs">Type de véhicule</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {VEHICLE_TYPES.map((v) => (
                          <button key={v} type="button"
                            onClick={() => setFormData((p) => ({ ...p, vehicle_type: v }))}
                            className={`py-2 rounded-xl text-xs font-medium border-2 transition-colors ${
                              formData.vehicle_type === v
                                ? "border-[#f97316] bg-[#f97316]/20 text-[#f97316]"
                                : "border-[#1e1e2e] bg-[#16161f] text-white/40"
                            }`}>
                            {v === "Moto" ? "🛵" : v === "Voiture" ? "🚗" : v === "Vélo" ? "🚲" : "🛺"} {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Admin-specific */}
                  {selectedRole === "admin" && (
                    <div className="p-4 rounded-xl border border-[#8b5cf6]/20 bg-[#8b5cf6]/5 space-y-1.5">
                      <Label className="text-white/60 text-xs">Code d&apos;accès administrateur *</Label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <Input name="access_code" type="password" placeholder="••••••••••••"
                          value={formData.access_code} onChange={handleChange} required
                          className="pl-10 h-11 bg-[#16161f] border-[#1e1e2e] text-white placeholder:text-white/20 focus:border-[#8b5cf6]/50" />
                      </div>
                      <p className="text-white/30 text-[10px]">Fourni par l&apos;équipe DL Solutions SARL</p>
                    </div>
                  )}

                  {/* Terms */}
                  <div className="flex items-start gap-2.5">
                    <input type="checkbox" id="terms" checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-[#1e1e2e] bg-[#16161f] accent-[#3b82f6]" />
                    <label htmlFor="terms" className="text-xs text-white/40 leading-relaxed">
                      J&apos;accepte les{" "}
                      <Link href="/terms" className="text-[#3b82f6] hover:underline">conditions d&apos;utilisation</Link>
                      {" "}et la{" "}
                      <Link href="/privacy" className="text-[#3b82f6] hover:underline">politique de confidentialité</Link>
                    </label>
                  </div>

                  <Button type="submit" disabled={loading}
                    className="w-full h-12 rounded-xl font-bold text-black"
                    style={{ background: roleCard.color }}>
                    {loading ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Création en cours…</>
                    ) : (
                      <>Créer mon compte <ArrowRight className="ml-2 h-5 w-5" /></>
                    )}
                  </Button>
                </form>

                <p className="mt-5 text-center text-sm text-white/30">
                  Déjà un compte ?{" "}
                  <Link href="/auth/login" className="text-[#3b82f6] font-medium hover:underline">Se connecter</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Right — Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0d1117, #161b22)" }}>
        <div className="absolute inset-0">
          <svg viewBox="0 0 500 500" className="w-full h-full opacity-10">
            <defs><pattern id="grid2" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#3b82f6" strokeWidth="0.5"/>
            </pattern></defs>
            <rect width="500" height="500" fill="url(#grid2)" />
          </svg>
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center w-full">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center mb-6 shadow-2xl shadow-[#3b82f6]/30">
            <span className="text-white font-black text-3xl">Q</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-4">
            Rejoignez <span className="text-[#a3e635]">QuickGo</span>
          </h2>
          <p className="text-white/50 max-w-xs leading-relaxed mb-10">
            La super-application de livraison au Cameroun. Commandez, vendez, livrez — tout en un.
          </p>
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            {ROLES.map((r) => (
              <div key={r.role} className={`flex items-center gap-2.5 p-3 rounded-xl border border-[#1e1e2e] ${r.bg}`}>
                <span className="text-xl">{r.emoji}</span>
                <div className="text-left">
                  <p className="text-white text-xs font-semibold">{r.label}</p>
                  <p className="text-white/30 text-[10px]">Rejoindre</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
