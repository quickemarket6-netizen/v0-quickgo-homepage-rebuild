"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OTPVerificationPage() {
  const router = useRouter()
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value.slice(-1)
    }
    
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newOtp = [...otp]
    pastedData.split("").forEach((char, index) => {
      if (index < 6) newOtp[index] = char
    })
    setOtp(newOtp)
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const code = otp.join("")
    if (code.length !== 6) return

    setIsLoading(true)
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsLoading(false)
    router.push("/dashboard")
  }

  const handleResend = () => {
    setCanResend(false)
    setCountdown(60)
    // TODO: Resend OTP API call
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/auth/register" className="inline-flex items-center gap-2 text-muted-foreground hover:text-white mb-8">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center">
                <span className="text-white font-bold text-lg">Q</span>
              </div>
              <span className="text-xl font-bold text-white">QUICK</span>
              <span className="text-xl font-bold text-quickgo-lime">GO</span>
            </Link>

            <h1 className="text-2xl font-bold text-white mb-2">Vérification</h1>
            <p className="text-muted-foreground mb-8">
              Nous avons envoyé un code à 6 chiffres à<br />
              <span className="text-white">+237 6 12 34 56 78</span>
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* OTP Input */}
              <div className="flex justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-12 h-14 text-center text-xl font-bold bg-card border border-border rounded-xl focus:border-quickgo-blue focus:ring-1 focus:ring-quickgo-blue transition-colors text-white"
                  />
                ))}
              </div>

              {/* Countdown / Resend */}
              <div className="text-center">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="inline-flex items-center gap-2 text-quickgo-blue hover:text-quickgo-blue/80"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Renvoyer le code
                  </button>
                ) : (
                  <p className="text-muted-foreground">
                    Renvoyer le code dans <span className="text-quickgo-blue">{countdown}s</span>
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={otp.join("").length !== 6 || isLoading}
                className="w-full h-12 bg-quickgo-blue hover:bg-quickgo-blue/90 rounded-xl text-base font-medium"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  "Vérifier"
                )}
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground text-center">
              Vous n&apos;avez pas reçu de code ?{" "}
              <Link href="/support" className="text-quickgo-blue hover:underline">
                Contacter le support
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-quickgo-blue/10 to-quickgo-cyan/10 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-quickgo-blue/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-quickgo-cyan/20 rounded-full blur-3xl" />
        </div>
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10"
        >
          <div className="w-[300px] h-[600px] rounded-[50px] bg-gradient-to-br from-gray-800 to-gray-900 p-3 shadow-2xl">
            <div className="w-full h-full rounded-[40px] overflow-hidden bg-background">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0026-38VVJ43JKgav3PTmCF4aqNzPQc2hRA.jpg"
                alt="QuickGo App"
                fill
                className="object-cover object-top"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
