import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Devenez Commerçant QuickGo | Vendez en ligne au Cameroun",
  description: "Ouvrez votre boutique sur QuickGo et accédez à des milliers de clients à Yaoundé et Douala. Livraison gérée, paiements sécurisés, analytics inclus.",
  keywords: "vendre en ligne Cameroun, boutique QuickGo, marketplace Cameroun, e-commerce Yaoundé",
  openGraph: {
    title: "Devenez Commerçant QuickGo | Vendez en ligne au Cameroun",
    description: "Ouvrez votre boutique sur QuickGo et accédez à des milliers de clients à Yaoundé et Douala. Livraison gérée, paiements sécurisés, analytics inclus.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
