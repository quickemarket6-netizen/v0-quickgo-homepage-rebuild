"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

// Frontière d'erreur de l'espace admin. Sans elle, la moindre erreur de rendu
// remonte à l'écran global "Oups !", qui n'indique ni la page ni le motif — on
// perd l'information au moment précis où elle est utile.
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[admin]", error)
  }, [error])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground mb-2">
            Cette page admin a rencontré une erreur
          </h1>
          <p className="text-sm text-muted-foreground break-words">{error.message}</p>
          {error.digest && (
            <p className="text-xs text-muted-foreground/60 mt-2">Réf. {error.digest}</p>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Réessayer
          </Button>
          <Link href="/admin"><Button variant="outline">Tableau de bord</Button></Link>
        </div>
      </div>
    </div>
  )
}
