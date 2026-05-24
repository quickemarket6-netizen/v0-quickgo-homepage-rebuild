import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "S'inscrire",
  description: "Créez votre compte QuickGo en quelques secondes et profitez de la livraison rapide partout au Cameroun.",
  openGraph: {
    title: "S'inscrire | QuickGo",
    description: "Créez votre compte QuickGo en quelques secondes et profitez de nos services.",
  },
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
