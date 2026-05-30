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
  Eye, EyeOff, Mail, Lock, ArrowRight, Loader2,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Role = "client" | "vendor" | "driver" | "admin"

const DASHBOARD: Record<Role, string> = {
  client: "/dashboard",
  vendor: "/vendor/dashboard",
  driver: "/driver/dashboard",
  admin: "/admin/dashboard",
}

function dashboardFor(role: string | undefined | null): string {
  return DASHBOARD[(role as Role) ?? "client"] ?? "/dashboard"
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirectTo") ?? ""

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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect"
          : error.message === "Email not confirmed"
          ? "Veuillez confirmer votre email avant de vous connecter"
          : error.message
      )
      setLoading(false)
      return
    }

    const userId = data.user?.id
    if (!userId) { router.push("/dashboard"); return }

    // Fetch role to redirect to the right dashboard
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single()

    const role = profile?.role as string | undefined

    const destination =
      redirectTo && !redirectTo.startsWith("/auth") ? redirectTo : dashboardFor(role)

    router.push(destination)
    router.refresh()
  }

  const handleGoogleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ??
          `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex">
      {/* Left — Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md">

          <Link href="/" className="inline-block mb-8">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0007-ezKXkl63WOFNwwQlwNLqPoMzyaOKo5.jpg"
              alt="QuickGo" width={140} height={40} className="h-10 w-auto"
            />
          </Link>

          <h1 className="text-3xl font-bold text-white mb-2">Se connecter</h1>
          <p className="text-white/40 mb-8">Connectez-vous à votre compte QuickGo</p>

          {/* Error from callback */}
          {searchParams.get("error") && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
              {decodeURIComponent(searchParams.get("error") ?? "")}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-white/60 text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                <Input type="email" placeholder="exemple@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required
                  className="pl-10 h-12 bg-[#16161f] border-[#1e1e2e] text-white placeholder:text-white/20 focus:border-[#3b82f6]/50" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-white/60 text-sm">Mot de passe</Label>
                <Link href="/auth/forgot-password" className="text-xs text-[#3b82f6] hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)} required
                  className="pl-10 pr-10 h-12 bg-[#16161f] border-[#1e1e2e] text-white placeholder:text-white/20 focus:border-[#3b82f6]/50" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" disabled={loading}
              className="w-full h-12 rounded-xl bg-[#3b82f6] hover:bg-[#3b82f6]/90 font-semibold">
              {loading
                ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Connexion…</>
                : <>Se connecter <ArrowRight className="ml-2 h-5 w-5" /></>
              }
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#1e1e2e]" /></div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#0a0a0f] text-white/30">Ou continuer avec</span>
            </div>
          </div>

          <Button variant="outline" className="w-full h-12 border-[#1e1e2e] bg-[#16161f] text-white hover:bg-[#1c1c28] gap-3"
            onClick={handleGoogleLogin} type="button">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Se connecter avec Google
          </Button>

          <p className="mt-8 text-center text-sm text-white/30">
            Pas encore de compte ?{" "}
            <Link href="/auth/register" className="text-[#3b82f6] font-medium hover:underline">Créer un compte</Link>
          </p>
        </motion.div>
      </div>

      {/* Right — Visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0d1117, #161b22)" }}>
        <div className="absolute inset-0">
          <svg viewBox="0 0 500 500" className="w-full h-full opacity-10">
            <defs><pattern id="grid3" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#3b82f6" strokeWidth="0.5"/>
            </pattern></defs>
            <rect width="500" height="500" fill="url(#grid3)" />
          </svg>
        </div>
        <div className="relative z-10 flex items-center justify-center p-12 text-center">
          <div>
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#3b82f6]/30">
              <span className="text-white font-black text-3xl">Q</span>
            </div>
            <h2 className="text-3xl font-black text-white mb-4">
              Bienvenue sur <span className="text-[#a3e635]">QuickGo</span>
            </h2>
            <p className="text-white/40 max-w-xs leading-relaxed">
              La super-application de livraison au Cameroun. Commandez et faites-vous livrer en moins de 30 minutes.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
