"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Loader2, ShoppingBag, Store, Bike, Shield } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Role = "client" | "vendor" | "driver" | "admin"

const ROLES = [
  {
    role: "client" as Role,
    emoji: "🛍️",
    label: "Client",
    desc: "Je veux commander et me faire livrer",
    color: "#3b82f6",
    icon: ShoppingBag,
  },
  {
    role: "vendor" as Role,
    emoji: "🏪",
    label: "Vendeur",
    desc: "Je veux vendre mes produits",
    color: "#22c55e",
    icon: Store,
  },
  {
    role: "driver" as Role,
    emoji: "🛵",
    label: "Livreur",
    desc: "Je veux effectuer des livraisons",
    color: "#f97316",
    icon: Bike,
  },
  {
    role: "admin" as Role,
    emoji: "🛡️",
    label: "Administrateur",
    desc: "Accès restreint — équipe QuickGo",
    color: "#8b5cf6",
    icon: Shield,
  },
]

const DASHBOARD: Record<Role, string> = {
  client: "/dashboard",
  vendor: "/vendor/dashboard",
  driver: "/driver/dashboard",
  admin: "/admin/dashboard",
}

export default function ChooseRolePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleConfirm = async () => {
    if (!selected) return
    setLoading(true)
    setError("")

    try {
      const r = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selected }),
      })
      if (!r.ok) {
        const json = await r.json().catch(() => ({}))
        setError(json.error ?? "Erreur lors de la mise à jour du profil")
        setLoading(false)
        return
      }
      router.push(DASHBOARD[selected])
    } catch {
      setError("Erreur réseau, veuillez réessayer")
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg">

        <Link href="/" className="inline-block mb-8">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0007-ezKXkl63WOFNwwQlwNLqPoMzyaOKo5.jpg"
            alt="QuickGo" width={140} height={40} className="h-10 w-auto"
          />
        </Link>

        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center mb-6">
          <span className="text-white font-black text-2xl">Q</span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">Bienvenue sur QuickGo !</h1>
        <p className="text-white/40 text-sm mb-8">
          Dernière étape — choisissez votre type de compte pour accéder à votre espace.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-8">
          {ROLES.map((r) => (
            <motion.button key={r.role} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => setSelected(r.role)}
              className={`p-5 rounded-2xl border-2 text-left transition-all ${
                selected === r.role
                  ? "border-current"
                  : "border-[#1e1e2e] bg-[#16161f] hover:border-[#3b82f6]/40"
              }`}
              style={selected === r.role ? {
                borderColor: r.color,
                background: `${r.color}15`,
              } : {}}>
              <span className="text-3xl block mb-3">{r.emoji}</span>
              <p className="font-semibold text-sm mb-1" style={{ color: selected === r.role ? r.color : "white" }}>
                {r.label}
              </p>
              <p className="text-white/40 text-xs leading-relaxed">{r.desc}</p>
              {selected === r.role && (
                <div className="mt-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: r.color }}>
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </motion.button>
          ))}
        </div>

        <Button disabled={!selected || loading} onClick={handleConfirm}
          className="w-full h-12 rounded-xl font-bold text-black"
          style={{ background: selected ? ROLES.find(r => r.role === selected)?.color ?? "#3b82f6" : "#3b82f6" }}>
          {loading
            ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Mise à jour…</>
            : "Accéder à mon espace →"
          }
        </Button>

        <p className="mt-4 text-center text-xs text-white/20">
          Vous pourrez modifier votre profil depuis les paramètres
        </p>
      </motion.div>
    </main>
  )
}
