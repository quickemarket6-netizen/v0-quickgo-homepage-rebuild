"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Loader2 } from "lucide-react"
import { useT } from "@/lib/i18n/context"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

const DASHBOARD: Record<string, string> = {
  client: "/dashboard",
  vendor: "/vendor/dashboard",
  driver: "/driver/dashboard",
  admin: "/admin",
}

const roles = [
  {
    id: "client",
    emoji: "🛍️",
    title: "Acheteur",
    description: "Commandez des produits et recevez-les en moins de 30 minutes.",
    color: "#a3e635",
    glowColor: "rgba(163,230,53,0.35)",
    borderColor: "rgba(163,230,53,0.5)",
  },
  {
    id: "vendor",
    emoji: "🏪",
    title: "Marchand",
    description: "Vendez vos produits à des milliers de clients dans votre ville.",
    color: "#3b82f6",
    glowColor: "rgba(59,130,246,0.35)",
    borderColor: "rgba(59,130,246,0.5)",
  },
  {
    id: "driver",
    emoji: "🛵",
    title: "Livreur",
    description: "Gagnez de l'argent en livrant des commandes autour de vous.",
    color: "#f97316",
    glowColor: "rgba(249,115,22,0.35)",
    borderColor: "rgba(249,115,22,0.5)",
  },
  // "Administrateur" is intentionally NOT selectable here — the set-role API
  // only accepts client/vendor/driver, and admin access is granted from the
  // admin panel. Offering it would just fail silently.
]

export default function ChooseRolePage() {
  const { t } = useT()
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!selectedRole) return
    setLoading(true)

    try {
      const res = await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body?.error ?? t("toast.roleFail"))
        setLoading(false)
        return
      }

      router.push(DASHBOARD[selectedRole] ?? "/dashboard")
    } catch {
      toast.error(t("toast.network"))
      setLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-4 py-16"
      style={{ backgroundColor: "#0a0a0f" }}
    >
      {/* ── Full animated background ───────────────────────────── */}

      {/* SVG grid */}
      <div className="absolute inset-0 opacity-[0.07]">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="cr-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cr-grid)" />
        </svg>
      </div>

      {/* Scan-line overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
        }}
      />

      {/* Large pulsing glow orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Blue — top-left */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[600px] h-[600px] rounded-full blur-[160px]"
          style={{ background: "#3b82f6", top: "-200px", left: "-200px" }}
        />
        {/* Purple — top-right */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: "#8b5cf6", top: "-100px", right: "-150px" }}
        />
        {/* Cyan — bottom-center */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute w-[450px] h-[450px] rounded-full blur-[120px]"
          style={{ background: "#06b6d4", bottom: "-150px", left: "50%", transform: "translateX(-50%)" }}
        />
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-2xl">

        {/* Logo / back link */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex justify-center mb-8"
        >
          <Link
            href="/auth/register"
            className="text-sm text-muted-foreground hover:text-white transition-colors"
          >
            ← Retour
          </Link>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 18, delay: 0.1 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            <span
              className="text-transparent bg-clip-text"
              style={{
                backgroundImage: "linear-gradient(to right, #a3e635, #06b6d4, #3b82f6)",
              }}
            >
              Qui êtes-vous ?
            </span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Choisissez votre rôle pour rejoindre l&apos;écosystème QuickGo.
          </p>
        </motion.div>

        {/* Role cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {roles.map((role, i) => {
            const isSelected = selectedRole === role.id
            return (
              /* Entrance wrapper + persistent idle float */
              <motion.div
                key={role.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, y: [0, -4, 0] }}
                transition={{
                  opacity: { delay: 0.2 + i * 0.1, duration: 0.4 },
                  scale: { type: "spring", stiffness: 100, damping: 15, delay: 0.2 + i * 0.1 },
                  y: { duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 },
                }}
              >
                <motion.button
                  onClick={() => setSelectedRole(role.id)}
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative rounded-2xl p-6 text-left w-full focus:outline-none"
                  style={{
                    backgroundColor: isSelected ? `${role.color}12` : "#16161f",
                    border: `1px solid ${isSelected ? role.borderColor : "#1e1e2e"}`,
                    boxShadow: isSelected
                      ? `0 0 32px 4px ${role.glowColor}, 0 0 0 1px ${role.borderColor}`
                      : `0 0 0 1px transparent`,
                    transform: isSelected ? "scale(1.03)" : undefined,
                  }}
                >
                  {/* Animated glow border pulse when selected */}
                  {isSelected && (
                    <motion.div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      animate={{ opacity: [0.4, 0.8, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      style={{
                        boxShadow: `0 0 40px 6px ${role.glowColor}`,
                        border: `1px solid ${role.borderColor}`,
                      }}
                    />
                  )}

                  {/* Radial glow behind emoji */}
                  <div
                    className="absolute inset-0 rounded-2xl transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(circle at 30% 40%, ${role.color}20, transparent 60%)`,
                      opacity: isSelected ? 1 : 0,
                    }}
                  />

                  <div className="relative z-10 flex items-start gap-4">
                    <span className="text-4xl leading-none">{role.emoji}</span>
                    <div>
                      <p
                        className="text-lg font-bold mb-1 transition-colors duration-200"
                        style={{ color: isSelected ? role.color : "#ffffff" }}
                      >
                        {role.title}
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {role.description}
                      </p>
                    </div>
                  </div>

                  {/* Selection checkmark */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: role.color, color: "#0a0a0f" }}
                      >
                        ✓
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </motion.div>
            )
          })}
        </div>

        {/* Confirm button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="flex justify-center"
        >
          <motion.div
            whileHover={selectedRole ? { scale: 1.03 } : {}}
            whileTap={selectedRole ? { scale: 0.98 } : {}}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="relative rounded-xl overflow-hidden w-full sm:w-auto"
          >
            {/* Animated shimmer gradient background */}
            {selectedRole && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{
                  backgroundImage: "linear-gradient(135deg, #a3e635, #06b6d4, #3b82f6, #8b5cf6, #a3e635)",
                  backgroundSize: "300% 300%",
                  opacity: 0.15,
                }}
              />
            )}
            <Button
              onClick={handleConfirm}
              disabled={!selectedRole || loading}
              className="relative z-10 w-full sm:w-auto px-10 h-13 text-base font-semibold transition-all duration-200"
              style={
                selectedRole
                  ? {
                      background: "linear-gradient(135deg, #a3e635 0%, #06b6d4 50%, #3b82f6 100%)",
                      color: "#0a0a0f",
                      boxShadow: "0 0 30px rgba(163,230,53,0.4)",
                      height: "52px",
                    }
                  : { height: "52px" }
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  Continuer
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </motion.div>
        </motion.div>

        {/* Login link */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
          className="mt-6 text-center text-sm text-muted-foreground"
        >
          Déjà un compte ?{" "}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            Se connecter
          </Link>
        </motion.p>
      </div>
    </main>
  )
}
