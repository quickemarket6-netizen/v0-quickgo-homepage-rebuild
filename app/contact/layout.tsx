import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contactez QuickGo | Service Client",
  description: "Contactez l'équipe QuickGo par téléphone, email ou WhatsApp. Support disponible 7j/7 pour vous accompagner.",
  keywords: "contact QuickGo, support client, aide QuickGo, service client Cameroun",
  openGraph: {
    title: "Contactez QuickGo | Service Client",
    description: "Contactez l'équipe QuickGo par téléphone, email ou WhatsApp. Support disponible 7j/7 pour vous accompagner.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
