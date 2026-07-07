"use client"

import { useState, useEffect } from "react"
import { Smartphone, Check, Share } from "lucide-react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

// Installation de la PWA : bouton natif quand le navigateur le permet
// (beforeinstallprompt), instructions iOS sinon. Remplace les badges
// App Store/Google Play qui pointaient vers « # » pour une app inexistante.
export function InstallAppButton() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [showIosHint, setShowIosHint] = useState(false)

  useEffect(() => {
    // Déjà installée (mode standalone)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true)
      return
    }
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent))

    const onPrompt = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => { setInstalled(true); setPrompt(null) }
    window.addEventListener("beforeinstallprompt", onPrompt)
    window.addEventListener("appinstalled", onInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      window.removeEventListener("appinstalled", onInstalled)
    }
  }, [])

  const install = async () => {
    if (prompt) {
      await prompt.prompt()
      const choice = await prompt.userChoice
      if (choice.outcome === "accepted") setInstalled(true)
      setPrompt(null)
    } else if (isIos) {
      setShowIosHint((s) => !s)
    }
  }

  if (installed) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Check className="w-4 h-4 text-quickgo-lime" /> Application installée
      </div>
    )
  }

  // Ni prompt natif ni iOS : rien à proposer (navigateur non compatible)
  if (!prompt && !isIos) return null

  return (
    <div className="space-y-2">
      <button
        onClick={install}
        className="h-12 px-5 rounded-xl bg-foreground flex items-center gap-3 hover:opacity-90 transition-opacity"
      >
        <Smartphone className="h-5 w-5 text-background" />
        <div className="text-left">
          <p className="text-[10px] text-background/70">Gratuit, sans passer par un store</p>
          <p className="text-sm font-semibold text-background">Installer l&apos;application</p>
        </div>
      </button>
      {showIosHint && (
        <p className="text-xs text-muted-foreground max-w-[260px] flex items-start gap-1.5">
          <Share className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Sur iPhone : touchez Partager puis « Sur l&apos;écran d&apos;accueil ».
        </p>
      )}
    </div>
  )
}
