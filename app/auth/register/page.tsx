"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Loader2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useT } from "@/lib/i18n/context"

const welcomeCards = [
  {
    emoji: "🛍️",
    title: "Acheteur",
    desc: "Commandez facilement",
    color: "#a3e635",
    glowColor: "rgba(163,230,53,0.3)",
    delay: 0.5,
    floatDelay: 0,
  },
  {
    emoji: "🏪",
    title: "Marchand",
    desc: "Vendez vos produits",
    color: "#3b82f6",
    glowColor: "rgba(59,130,246,0.3)",
    delay: 0.7,
    floatDelay: 0.8,
  },
  {
    emoji: "🛵",
    title: "Livreur",
    desc: "Gagnez en livrant",
    color: "#f97316",
    glowColor: "rgba(249,115,22,0.3)",
    delay: 0.9,
    floatDelay: 1.6,
  },
  {
    emoji: "🛡️",
    title: "Sécurisé",
    desc: "Paiements protégés",
    color: "#8b5cf6",
    glowColor: "rgba(139,92,246,0.3)",
    delay: 1.1,
    floatDelay: 2.4,
  },
]

const formFields = [
  { id: "name", name: "name", type: "text", label: "Nom complet", placeholder: "Samuel Djoko", Icon: User },
  { id: "email", name: "email", type: "email", label: "Email", placeholder: "exemple@email.com", Icon: Mail },
  { id: "phone", name: "phone", type: "tel", label: "Téléphone", placeholder: "+237 6 XX XX XX XX", Icon: Phone },
]

export default function RegisterPage() {
  const { t } = useT()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)

  // Code de parrainage (?ref=CODE) : mémorisé jusqu'à la première connexion,
  // où il est activé automatiquement (voir /marketplace).
  useEffect(() => {
    const ref = searchParams.get("ref")
    if (ref && /^[A-Za-z0-9]{4,20}$/.test(ref)) {
      try { localStorage.setItem("quickgo-ref", ref.toUpperCase()) } catch { /* stockage indisponible */ }
    }
  }, [searchParams])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!acceptTerms) {
      setError("Veuillez accepter les conditions d'utilisation")
      return
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caracteres")
      return
    }

    setLoading(true)
    setError("")

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
        data: {
          full_name: formData.name,
          phone: formData.phone,
        }
      }
    })

    if (error) {
      setError(error.message)
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
          `${window.location.origin}/auth/callback`
      }
    })
  }

  return (
    <main className="min-h-screen flex" style={{ backgroundColor: "#0a0a0f" }}>
      {/* Global background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[130px] animate-orb"
          style={{ background: "#3b82f6", opacity: 0.18, top: "-150px", left: "-150px", "--orb-s": "1.2", "--orb-o-min": "0.2", "--orb-o-max": "0.4", "--orb-dur": "8s" } as React.CSSProperties}
          />
        <div
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px] animate-orb"
          style={{ background: "#06b6d4", opacity: 0.15, bottom: "80px", right: "10%", "--orb-s": "1.15", "--orb-o-min": "0.15", "--orb-o-max": "0.3", "--orb-dur": "6s", "--orb-delay": "1.5s" } as React.CSSProperties}
          />
        <div
          className="absolute w-[350px] h-[350px] rounded-full blur-[90px] animate-orb"
          style={{ background: "#a3e635", opacity: 0.12, top: "200px", left: "5%", "--orb-s": "1.1", "--orb-o-min": "0.1", "--orb-o-max": "0.2", "--orb-dur": "7s", "--orb-delay": "3s" } as React.CSSProperties}
          />
        {/* Scan-line overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
          }}
        />
      </div>

      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Link href="/" className="inline-block mb-8">
              <Image
                src="/quickgo-logo.jpg"
                alt="QuickGo"
                width={140}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold mb-2"
            style={{ color: "#ffffff" }}
          >
            Créer un compte
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-muted-foreground mb-8"
          >
            Créez votre compte QuickGo en quelques secondes et profitez !
          </motion.p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
              >
                {error}
              </motion.div>
            )}

            {formFields.map((field, i) => (
              <motion.div
                key={field.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="space-y-2"
              >
                <Label htmlFor={field.id}>{field.label}</Label>
                <div className="relative">
                  <field.Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id={field.id}
                    name={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.name as keyof typeof formData]}
                    onChange={handleChange}
                    className="pl-10 h-12"
                    required={field.id !== "phone"}
                  />
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10 h-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-start gap-2"
            >
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                J&apos;accepte les{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  conditions d&apos;utilisation
                </Link>{" "}
                et la{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  politique de confidentialité
                </Link>
              </label>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
            >
              <motion.div
                whileHover={{ boxShadow: "0 0 24px 4px rgba(163,230,53,0.35)", scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="rounded-lg"
              >
                <Button
                  type="submit"
                  className="w-full h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creation...
                    </>
                  ) : (
                    <>
                      Créer un compte
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </form>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="relative my-8"
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">Ou continuer avec</span>
            </div>
          </motion.div>

          {/* Social Login */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75 }}
          >
            {/* Un seul fournisseur OAuth réellement configuré : Google.
                Pas de bouton Apple décoratif (aucun handler, provider absent). */}
            <Button variant="outline" className="h-12 w-full" onClick={handleGoogleSignup} type="button">
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {t("app.auth.google")}
            </Button>
          </motion.div>

          {/* Login Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8 text-center text-sm text-muted-foreground"
          >
            {t("app.auth.haveAccount")}{" "}
            <Link href="/auth/login" className="text-primary font-medium hover:underline">
              Se connecter
            </Link>
          </motion.p>
        </div>
      </div>

      {/* Right - Visual (Hidden on mobile) */}
      <div
        className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{ backgroundColor: "#111118" }}
      >
        {/* SVG grid pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="register-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#register-grid)" />
          </svg>
        </div>

        {/* Glow orbs behind cards */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute w-[380px] h-[380px] rounded-full blur-[120px] animate-orb"
            style={{ background: "#8b5cf6", top: "10%", left: "10%", "--orb-s": "1.2", "--orb-o-min": "0.25", "--orb-o-max": "0.45", "--orb-dur": "7s" } as React.CSSProperties}
            />
          <div
            className="absolute w-[320px] h-[320px] rounded-full blur-[100px] animate-orb"
            style={{ background: "#06b6d4", bottom: "10%", right: "5%", "--orb-s": "1.15", "--orb-o-min": "0.2", "--orb-o-max": "0.35", "--orb-dur": "8s", "--orb-delay": "1s" } as React.CSSProperties}
            />
          <div
            className="absolute w-[260px] h-[260px] rounded-full blur-[80px] animate-orb"
            style={{ background: "#f97316", top: "50%", right: "30%", "--orb-s": "1.1", "--orb-o-min": "0.15", "--orb-o-max": "0.3", "--orb-dur": "6s", "--orb-delay": "2s" } as React.CSSProperties}
            />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center p-12 w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-3">
              <span
                className="text-transparent bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(to right, #a3e635, #06b6d4, #8b5cf6)",
                }}
              >
                Rejoignez QuickGo
              </span>
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Des milliers de produits, livraison express, paiement sécurisé.
            </p>
          </motion.div>

          {/* Floating welcome cards — 2x2 grid */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-xs">
            {welcomeCards.map((card) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 100, delay: card.delay }}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: card.floatDelay,
                  }}
                  whileHover={{ y: -4, scale: 1.04 }}
                  className="relative rounded-xl p-4 flex flex-col items-center gap-2 cursor-default text-center"
                  style={{
                    backgroundColor: "#16161f",
                    border: `1px solid #1e1e2e`,
                    boxShadow: `0 0 18px 2px ${card.glowColor}`,
                  }}
                >
                  {/* Glow halo behind emoji */}
                  <div
                    className="absolute inset-0 rounded-xl opacity-10"
                    style={{ background: `radial-gradient(circle at 50% 40%, ${card.color}, transparent 70%)` }}
                  />
                  <span className="text-3xl relative z-10">{card.emoji}</span>
                  <div className="relative z-10">
                    <p className="text-sm font-semibold" style={{ color: card.color }}>{card.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">{card.desc}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
