"use client"

import { useState } from "react"
import { Mail, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useT } from "@/lib/i18n/context"
import { Input } from "@/components/ui/input"

// Capture d'email newsletter — visiteurs non connectés inclus.
export function NewsletterForm() {
  const { t } = useT()
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "loading" | "done">("idle")
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setState("loading")
    setError(null)
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "footer" }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? "Inscription impossible.")
        setState("idle")
        return
      }
      setState("done")
      setEmail("")
    } catch {
      setError("Erreur réseau, réessayez.")
      setState("idle")
    }
  }

  if (state === "done") {
    return (
      <div className="flex items-center gap-2 text-sm text-quickgo-lime">
        <Check className="w-4 h-4" /> {t("footer.newsletter.done")}
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null) }}
            placeholder={t("footer.newsletter.placeholder")}
            className="pl-9 h-11 rounded-xl"
            aria-label="Adresse email"
          />
        </div>
        <Button type="submit" disabled={state === "loading" || !email.trim()} className="h-11 rounded-xl px-5">
          {state === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : t("footer.newsletter.btn")}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </form>
  )
}
