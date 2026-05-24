import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Suivi de Commande",
  description: "Suivez votre commande en temps réel sur QuickGo",
}

export default function TrackingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
