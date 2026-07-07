"use client"

import { useT } from "@/lib/i18n/context"
import { Globe } from "lucide-react"

// Bascule FR/EN compacte pour la surface publique.
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useT()
  return (
    <div className={`inline-flex items-center rounded-full border border-border/60 bg-muted/40 p-0.5 ${className}`}>
      <Globe className="w-3.5 h-3.5 text-muted-foreground ml-2 mr-1 shrink-0" />
      {(["fr", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${
            lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={lang === l}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
