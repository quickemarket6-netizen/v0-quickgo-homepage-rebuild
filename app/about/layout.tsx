import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "À propos de QuickGo | Super App Cameroun",
  description: "Découvrez QuickGo, la super app camerounaise qui révolutionne le commerce local, la livraison express et les paiements mobiles à Yaoundé et Douala.",
  keywords: "QuickGo, super app Cameroun, livraison Yaoundé, marketplace Douala, DL Solutions",
  openGraph: {
    title: "À propos de QuickGo | Super App Cameroun",
    description: "Découvrez QuickGo, la super app camerounaise qui révolutionne le commerce local, la livraison express et les paiements mobiles à Yaoundé et Douala.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
