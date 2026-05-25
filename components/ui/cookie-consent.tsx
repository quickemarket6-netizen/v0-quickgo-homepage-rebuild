"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Cookie, Settings, Check } from "lucide-react"
import Link from "next/link"

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false
  })

  useEffect(() => {
    const consent = localStorage.getItem("quickgo-cookie-consent")
    if (!consent) {
      // Delay showing the popup for better UX
      const timer = setTimeout(() => setIsVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    }
    localStorage.setItem("quickgo-cookie-consent", JSON.stringify(allAccepted))
    setIsVisible(false)
  }

  const acceptSelected = () => {
    localStorage.setItem("quickgo-cookie-consent", JSON.stringify(preferences))
    setIsVisible(false)
  }

  const rejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    }
    localStorage.setItem("quickgo-cookie-consent", JSON.stringify(onlyNecessary))
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
        onClick={() => {}}
      />
      
      {/* Cookie Banner */}
      <div className="relative w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-4 duration-500">
        {/* Glow effect */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-lime-500/20 via-green-500/20 to-lime-500/20 rounded-2xl blur-sm" />
        
        <div className="relative bg-gray-900 rounded-2xl p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-lime-500/10 rounded-xl">
              <Cookie className="w-6 h-6 text-lime-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">
                Nous utilisons des cookies
              </h3>
              <p className="text-gray-400 text-sm">
                QuickGo utilise des cookies pour ameliorer votre experience, analyser le trafic 
                et personnaliser le contenu. En continuant, vous acceptez notre{" "}
                <Link href="/cookies" className="text-lime-400 hover:underline">
                  politique de cookies
                </Link>.
              </p>
            </div>
            <button 
              onClick={rejectAll}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-4 p-4 bg-gray-800/50 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Cookies necessaires</p>
                  <p className="text-gray-500 text-xs">Requis pour le fonctionnement du site</p>
                </div>
                <div className="w-12 h-6 bg-lime-500 rounded-full flex items-center justify-end px-1">
                  <div className="w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
              
              {[
                { key: "analytics", label: "Cookies analytiques", desc: "Nous aident a comprendre l'utilisation" },
                { key: "marketing", label: "Cookies marketing", desc: "Pour des publicites personnalisees" },
                { key: "preferences", label: "Cookies de preferences", desc: "Memorisent vos choix" }
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{label}</p>
                    <p className="text-gray-500 text-xs">{desc}</p>
                  </div>
                  <button
                    onClick={() => setPreferences(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      preferences[key as keyof typeof preferences] 
                        ? "bg-lime-500 justify-end" 
                        : "bg-gray-700 justify-start"
                    }`}
                  >
                    <div className="w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              className="flex-1 border-gray-700 hover:bg-gray-800 text-gray-300"
            >
              <Settings className="w-4 h-4 mr-2" />
              Personnaliser
            </Button>
            <Button
              onClick={rejectAll}
              variant="outline"
              className="flex-1 border-gray-700 hover:bg-gray-800 text-gray-300"
            >
              Refuser tout
            </Button>
            <Button
              onClick={showSettings ? acceptSelected : acceptAll}
              className="flex-1 bg-lime-500 hover:bg-lime-600 text-black font-semibold"
            >
              <Check className="w-4 h-4 mr-2" />
              {showSettings ? "Accepter la selection" : "Accepter tout"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
