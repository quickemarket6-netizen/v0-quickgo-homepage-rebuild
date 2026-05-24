import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Suivi de commande",
  description: "Suivez votre commande en temps réel sur QuickGo. Carte interactive, notifications et contact direct avec votre livreur.",
  openGraph: {
    title: "Suivi de commande | QuickGo",
    description: "Suivez votre commande en temps réel sur QuickGo.",
  },
}

export default function TrackingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
