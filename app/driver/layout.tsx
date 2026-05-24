import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Devenir livreur",
  description: "Rejoignez la communauté QuickGo et devenez livreur partenaire. Gagnez de l'argent avec flexibilité et liberté.",
  openGraph: {
    title: "Devenir livreur | QuickGo",
    description: "Rejoignez la communauté QuickGo et devenez livreur partenaire.",
  },
}

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
