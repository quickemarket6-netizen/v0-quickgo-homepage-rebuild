import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politique des Cookies | QuickGo",
  description: "QuickGo utilise des cookies pour améliorer votre expérience. Découvrez comment gérer vos préférences de cookies.",
  keywords: "cookies QuickGo, politique cookies, préférences confidentialité",
  openGraph: {
    title: "Politique des Cookies | QuickGo",
    description: "QuickGo utilise des cookies pour améliorer votre expérience. Découvrez comment gérer vos préférences de cookies.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
