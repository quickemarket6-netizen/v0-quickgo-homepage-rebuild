import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Assistant IA QuickGo | Commandez par chat",
  description: "Parlez à l'assistant IA QuickGo pour commander, suivre votre livraison ou trouver les meilleures offres. Intelligent, rapide et disponible 24h/24.",
  openGraph: {
    title: "Assistant IA QuickGo",
    description: "Commandez, suivez et explorez QuickGo par chat IA.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function AILayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
