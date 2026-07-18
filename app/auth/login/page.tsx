"use client"

import { useState } from "react"
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
  ArrowRight,
  Loader2,
  Clock,
  CreditCard,
  ShieldCheck,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// Faits vérifiables sur le service — pas de compteurs inventés.
const floatingCards = [
  {
    icon: Clock,
    label: "Livraison express en ville",
    value: "30-60 min",
    color: "#a3e635",
    delay: 0.6,
    floatDelay: 0,
    glowColor: "rgba(163,230,53,0.25)",
  },
  {
    icon: CreditCard,
    label: "Paiements mobiles & cash",
    value: "OM & MoMo",
    color: "#06b6d4",
    delay: 0.8,
    floatDelay: 1,
    glowColor: "rgba(6,182,212,0.25)",
  },
  {
    icon: ShieldCheck,
    label: "Transactions sécurisées CinetPay",
    value: "100%",
    color: "#22c55e",
    delay: 1.0,
    floatDelay: 2,
    glowColor: "rgba(34,197,94,0.25)",
  },
]

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message === "Invalid login credentials"
        ? "Email ou mot de passe incorrect"
        : error.message)
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = user
      ? await supabase.from("profiles").select("role").eq("id", user.id).single()
      : { data: null }

    const DASHBOARD: Record<string, string> = {
      client: "/dashboard",
      vendor: "/vendor/dashboard",
      driver: "/driver/dashboard",
      admin: "/admin",
      super_admin: "/admin",
    }
    const role = profile?.role as string | undefined
    // Le proxy redirige avec ?next= ; on accepte aussi l'ancien ?redirectTo=.
    // Seuls les chemins relatifs internes sont autorisés (anti open-redirect).
    const redirectTo = searchParams.get("next") ?? searchParams.get("redirectTo")
    const isSafePath = redirectTo != null
      && redirectTo.startsWith("/")
      && !redirectTo.startsWith("//")
      && !redirectTo.startsWith("/\\")
      && !redirectTo.startsWith("/auth")
    const dest = isSafePath ? redirectTo : (DASHBOARD[role ?? ""] ?? "/dashboard")

    router.push(dest)
    router.refresh()
  }

  const handleGoogleLogin = async () => {
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
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[500px] h-[500px] rounded-full blur-[130px]"
          style={{ background: "#3b82f6", opacity: 0.18, top: "-150px", left: "-150px" }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          className="absolute w-[400px] h-[400px] rounded-full blur-[100px]"
          style={{ background: "#06b6d4", opacity: 0.15, bottom: "100px", left: "30%" }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute w-[350px] h-[350px] rounded-full blur-[90px]"
          style={{ background: "#a3e635", opacity: 0.12, top: "200px", right: "5%" }}
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
            Se connecter
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-muted-foreground mb-8"
          >
            Connectez-vous à votre compte QuickGo pour commander
          </motion.p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
              >
                {error}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <Label htmlFor="email">Email ou téléphone</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="exemple@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12"
                  required
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
              transition={{ delay: 0.4 }}
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
                      Connexion...
                    </>
                  ) : (
                    <>
                      Se connecter
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
            transition={{ delay: 0.45 }}
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
            transition={{ delay: 0.5 }}
          >
            {/* Un seul fournisseur OAuth réellement configuré : Google.
                Pas de bouton Apple décoratif (aucun handler, provider absent). */}
            <Button variant="outline" className="h-12 w-full" onClick={handleGoogleLogin} type="button">
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuer avec Google
            </Button>
          </motion.div>

          {/* Sign Up Link */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="mt-8 text-center text-sm text-muted-foreground"
          >
            Pas encore de compte ?{" "}
            <Link href="/auth/register" className="text-primary font-medium hover:underline">
              Créer un compte
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
              <pattern id="login-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#login-grid)" />
          </svg>
        </div>

        {/* Glow orbs behind cards */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-[400px] h-[400px] rounded-full blur-[120px]"
            style={{ background: "#3b82f6", top: "5%", right: "-10%" }}
          />
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute w-[350px] h-[350px] rounded-full blur-[100px]"
            style={{ background: "#06b6d4", bottom: "10%", left: "5%" }}
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute w-[280px] h-[280px] rounded-full blur-[80px]"
            style={{ background: "#a3e635", top: "45%", right: "20%" }}
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
                className="text-transparent bg-clip-text bg-gradient-to-r"
                style={{
                  backgroundImage: "linear-gradient(to right, #a3e635, #06b6d4, #3b82f6)",
                }}
              >
                Bienvenue sur QuickGo
              </span>
            </h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              La super application de livraison au Cameroun.
            </p>
          </motion.div>

          {/* Floating stat cards */}
          <div className="flex flex-col gap-5 w-full max-w-xs">
            {floatingCards.map((card, i) => {
              const Icon = card.icon
              return (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
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
                    whileHover={{ y: -3, scale: 1.02 }}
                    className="relative rounded-xl p-4 flex items-center gap-4 cursor-default"
                    style={{
                      backgroundColor: "#16161f",
                      border: `1px solid #1e1e2e`,
                      boxShadow: `0 0 20px 2px ${card.glowColor}`,
                    }}
                  >
                    <div
                      className="flex items-center justify-center w-11 h-11 rounded-lg flex-shrink-0"
                      style={{ backgroundColor: `${card.color}18`, border: `1px solid ${card.color}40` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: card.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                      <p className="text-xl font-bold" style={{ color: "#ffffff" }}>
                        {card.value}
                      </p>
                    </div>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </main>
  )
}
