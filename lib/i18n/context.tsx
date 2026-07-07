"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import { dictionaries, type Lang } from "./dictionaries"

interface I18nValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nValue | null>(null)

const STORAGE_KEY = "quickgo-lang"

// Fournisseur i18n léger (sans dépendance) pour la surface publique.
// Persiste le choix en localStorage et met à jour <html lang>.
// L'app authentifiée reste en français pour l'instant (phase 2).
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr")

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null
      if (saved === "fr" || saved === "en") {
        setLangState(saved)
        document.documentElement.lang = saved
      }
    } catch { /* stockage indisponible */ }
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem(STORAGE_KEY, l) } catch { /* ignore */ }
    document.documentElement.lang = l
  }, [])

  const t = useCallback((key: string): string => {
    return dictionaries[lang][key] ?? dictionaries.fr[key] ?? key
  }, [lang])

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

// Sûr même hors provider (composants rendus en dehors du marketing) :
// renvoie la clé française par défaut.
export function useT() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    return {
      lang: "fr" as Lang,
      setLang: () => {},
      t: (key: string) => dictionaries.fr[key] ?? key,
    }
  }
  return ctx
}
