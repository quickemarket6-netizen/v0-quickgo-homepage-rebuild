import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Devenez Livreur QuickGo | Gagnez plus avec flexibilité",
  description: "Rejoignez la flotte QuickGo et gagnez de l'argent à votre rythme. Livreur à moto, voiture ou camion — inscription gratuite, paiement rapide.",
  keywords: "devenir livreur Cameroun, livreur QuickGo, travail flexible Yaoundé, revenus livreur moto Douala",
  openGraph: {
    title: "Devenez Livreur QuickGo | Gagnez plus avec flexibilité",
    description: "Rejoignez QuickGo et gagnez de l'argent à votre rythme. Inscription gratuite.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
