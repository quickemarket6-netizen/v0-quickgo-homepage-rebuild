import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Livraison Express",
  description: "Faites-vous livrer en moins de 30 minutes. Rapide, fiable et sécurisé. Service de livraison express partout au Cameroun.",
  openGraph: {
    title: "Livraison Express | QuickGo",
    description: "Faites-vous livrer en moins de 30 minutes. Rapide, fiable et sécurisé.",
  },
}

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
