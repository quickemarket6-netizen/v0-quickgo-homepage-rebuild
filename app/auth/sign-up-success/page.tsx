"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react"

export default function SignUpSuccessPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        {/* Logo */}
        <Link href="/" className="inline-block mb-8">
          <Image
            src="/quickgo-logo.jpg"
            alt="QuickGo"
            width={140}
            height={40}
            className="h-10 w-auto mx-auto"
          />
        </Link>

        {/* Success Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-secondary/20 flex items-center justify-center">
          <CheckCircle2 className="h-10 w-10 text-secondary" />
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">
          Compte cree avec succes !
        </h1>
        <p className="text-muted-foreground mb-8">
          Un email de confirmation a ete envoye a votre adresse email. 
          Veuillez cliquer sur le lien pour activer votre compte.
        </p>

        {/* Email Icon */}
        <div className="p-6 rounded-xl bg-card border border-border mb-8">
          <Mail className="h-12 w-12 mx-auto mb-4 text-primary" />
          <p className="text-sm text-muted-foreground">
            Verifiez votre boite de reception et vos spams
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full h-12 bg-secondary text-secondary-foreground hover:bg-secondary/90">
            <Link href="/auth/login">
              Se connecter
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full h-12">
            <Link href="/">
              Retour a l&apos;accueil
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Vous n&apos;avez pas recu l&apos;email ?{" "}
          <button className="text-primary hover:underline">
            Renvoyer
          </button>
        </p>
      </motion.div>
    </main>
  )
}
