import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation | QuickGo",
  description: "Conditions générales d'utilisation de la plateforme QuickGo — marketplace, livraison express et paiements mobiles au Cameroun.",
  keywords: "CGU QuickGo, conditions utilisation, règles marketplace Cameroun",
  openGraph: {
    title: "Conditions Générales d'Utilisation | QuickGo",
    description: "Conditions générales d'utilisation de la plateforme QuickGo — marketplace, livraison express et paiements mobiles au Cameroun.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
