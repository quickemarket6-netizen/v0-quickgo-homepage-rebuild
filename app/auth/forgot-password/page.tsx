"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Mail, CheckCircle, Loader2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setIsLoading(false)
    setIsSubmitted(true)
  }

  return (
    <main className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <div className="relative w-10 h-10">
              <Image
                src="/images/quickgo-logo.png"
                alt="QuickGo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              QuickGo
            </span>
          </Link>

          {/* Back Link */}
          <Link 
            href="/auth/login" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour a la connexion
          </Link>

          {!isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Mot de passe oublie ?
              </h1>
              <p className="text-muted-foreground mb-8">
                Entrez votre adresse email et nous vous enverrons un lien pour reinitialiser votre mot de passe.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Adresse email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="votre@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 h-12 bg-card border-border/50"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-lg font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    "Envoyer le lien"
                  )}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Email envoye !
              </h1>
              <p className="text-muted-foreground mb-8">
                Nous avons envoye un lien de reinitialisation a <span className="text-primary font-medium">{email}</span>. 
                Verifiez votre boite de reception et vos spams.
              </p>
              <div className="space-y-4">
                <Button 
                  onClick={() => setIsSubmitted(false)}
                  variant="outline" 
                  className="w-full h-12"
                >
                  Renvoyer le lien
                </Button>
                <Link href="/auth/login">
                  <Button className="w-full h-12 bg-primary hover:bg-primary/90">
                    Retour a la connexion
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Help */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Besoin d&apos;aide ? {" "}
            <Link href="/support" className="text-primary hover:underline">
              Contactez le support
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Visual */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary/20 via-background to-accent/20 items-center justify-center p-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-lg text-center"
        >
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-8">
            <Mail className="h-16 w-16 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Securite avant tout
          </h2>
          <p className="text-muted-foreground text-lg">
            Nous protegeons votre compte avec les meilleures pratiques de securite. 
            Votre nouveau mot de passe sera crypte et securise.
          </p>
          
          {/* Security Features */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="p-4 rounded-2xl bg-card/50 border border-border/50">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-2">
                <span className="text-lg">🔐</span>
              </div>
              <p className="text-sm text-muted-foreground">Cryptage SSL</p>
            </div>
            <div className="p-4 rounded-2xl bg-card/50 border border-border/50">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-2">
                <span className="text-lg">⏱️</span>
              </div>
              <p className="text-sm text-muted-foreground">Lien expire en 1h</p>
            </div>
            <div className="p-4 rounded-2xl bg-card/50 border border-border/50">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-2">
                <span className="text-lg">✅</span>
              </div>
              <p className="text-sm text-muted-foreground">Usage unique</p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
