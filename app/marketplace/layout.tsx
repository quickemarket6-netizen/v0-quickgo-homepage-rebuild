import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Marketplace QuickGo | Shopping en ligne au Cameroun",
  description: "Des milliers de produits locaux disponibles sur QuickGo — alimentation, mode, électronique, cosmétiques et plus. Livraison express à Yaoundé et Douala.",
  keywords: "marketplace Cameroun, shopping en ligne Yaoundé, boutiques Douala, produits locaux, e-commerce Cameroun",
  openGraph: {
    title: "Marketplace QuickGo | Shopping en ligne au Cameroun",
    description: "Des milliers de produits locaux disponibles sur QuickGo. Livraison express à Yaoundé et Douala.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
