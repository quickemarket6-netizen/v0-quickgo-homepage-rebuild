"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ArrowLeft,
  Send,
  Phone,
  ChevronRight,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react"

interface Contact { name: string; phone: string; initial: string }

const formatPrice = (p: number) => new Intl.NumberFormat("fr-FR").format(p) + " FCFA"

export default function TransferPage() {
  const [step, setStep] = useState<"form" | "confirm" | "success">("form")
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recipientName, setRecipientName] = useState("")
  const [contacts, setContacts] = useState<Contact[]>([])

  useEffect(() => {
    fetch("/api/wallet/transfer")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d.contacts)) setContacts(d.contacts) })
      .catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === "form") { setStep("confirm"); return }

    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, amount: Number(amount), note }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setRecipientName(data.recipient_name ?? recipient)
        setStep("success")
      } else {
        setError(data.error ?? "Erreur lors du transfert")
        setStep("form")
      }
    } catch {
      setError("Erreur réseau, veuillez réessayer")
      setStep("form")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24 pb-20">
        <div className="max-w-lg mx-auto px-4 py-8">
          <Link href="/wallet" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour au portefeuille
          </Link>

          {step === "success" ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Transfert réussi !</h1>
              <p className="text-muted-foreground mb-2">
                <span className="text-white font-bold">{formatPrice(Number(amount))}</span> envoyé à
              </p>
              <p className="text-quickgo-lime font-medium mb-8">{recipientName}</p>
              <div className="space-y-3">
                <Link href="/wallet">
                  <Button className="w-full h-12 rounded-xl">Retour au portefeuille</Button>
                </Link>
                <Button variant="outline" className="w-full h-12 rounded-xl" onClick={() => { setStep("form"); setAmount(""); setRecipient(""); setNote(""); setRecipientName(""); setError(null) }}>
                  Nouveau transfert
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl font-bold text-white mb-1">Envoyer de l&apos;argent</h1>
              <p className="text-muted-foreground mb-6">Transferts gratuits entre comptes QuickGo</p>

              {error && (
                <div className="mb-4 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <span className="text-red-300 text-sm">{error}</span>
                </div>
              )}

              {step === "confirm" && (
                <div className="mb-6 p-4 rounded-2xl bg-quickgo-blue/10 border border-quickgo-blue/30">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-quickgo-blue" />
                    <span className="text-white font-medium">Confirmer le transfert</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Destinataire</span><span className="text-white">{recipient}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Montant</span><span className="text-quickgo-lime font-bold">{formatPrice(Number(amount))}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Frais</span><span className="text-green-400">Gratuit</span></div>
                    {note && <div className="flex justify-between"><span className="text-muted-foreground">Note</span><span className="text-white">{note}</span></div>}
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Destinataire</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      placeholder="Numéro de téléphone ou email"
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value)}
                      required
                      disabled={step === "confirm"}
                      className="pl-10 h-12 bg-card border-border/50"
                    />
                  </div>
                </div>

                {step === "form" && contacts.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-white mb-3">Contacts récents</p>
                    <div className="space-y-2">
                      {contacts.map((c) => (
                        <button key={c.phone} type="button" onClick={() => setRecipient(c.phone)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl bg-card/50 border border-border/30 hover:border-quickgo-blue/50 transition-colors text-left">
                          <div className="w-10 h-10 rounded-full bg-quickgo-blue/20 flex items-center justify-center text-quickgo-blue font-bold">{c.initial}</div>
                          <div><p className="text-white text-sm font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{c.phone}</p></div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Montant (FCFA)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="100"
                    disabled={step === "confirm"}
                    className="h-12 bg-card border-border/50 text-xl font-bold"
                  />
                  <div className="flex gap-2 mt-2">
                    {[1000, 5000, 10000, 25000].map((v) => (
                      <button key={v} type="button" onClick={() => setAmount(String(v))}
                        className="flex-1 py-1.5 text-xs rounded-lg bg-card/50 border border-border/30 text-muted-foreground hover:text-white hover:border-quickgo-blue/50 transition-colors">
                        {new Intl.NumberFormat("fr-FR").format(v)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">Note (optionnel)</label>
                  <Input placeholder="Ex: Remboursement dîner" value={note} onChange={(e) => setNote(e.target.value)} disabled={step === "confirm"} className="h-12 bg-card border-border/50" />
                </div>

                <div className="flex gap-3 pt-2">
                  {step === "confirm" && (
                    <Button type="button" variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setStep("form")}>
                      Modifier
                    </Button>
                  )}
                  <Button type="submit" disabled={isLoading} className="flex-1 h-12 rounded-xl bg-quickgo-blue hover:bg-quickgo-blue/90">
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : step === "form" ? <><Send className="w-4 h-4 mr-2" />Continuer</> : <><CheckCircle className="w-4 h-4 mr-2" />Confirmer</>}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </div>
      </div>
      <Footer />
    </main>
  )
}
