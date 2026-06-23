import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Rejoignez QuickGo | Offres d'emploi Cameroun",
  description: "QuickGo recrute ! Rejoignez une startup tech camerounaise en pleine croissance. Développeurs, commerciaux, livreurs — découvrez nos opportunités.",
  keywords: "emploi QuickGo, recrutement Cameroun, startup tech Yaoundé, offre emploi tech Afrique",
  openGraph: {
    title: "Rejoignez QuickGo | Offres d'emploi Cameroun",
    description: "QuickGo recrute ! Rejoignez une startup tech camerounaise en pleine croissance. Développeurs, commerciaux, livreurs — découvrez nos opportunités.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
