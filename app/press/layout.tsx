import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Centre de Presse QuickGo | Actualités & Communiqués",
  description: "Retrouvez tous les communiqués de presse, actualités et ressources médias de QuickGo, leader de la livraison et du e-commerce au Cameroun.",
  keywords: "presse QuickGo, communiqué de presse, actualité startup Cameroun, media kit",
  openGraph: {
    title: "Centre de Presse QuickGo | Actualités & Communiqués",
    description: "Retrouvez tous les communiqués de presse, actualités et ressources médias de QuickGo, leader de la livraison et du e-commerce au Cameroun.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
