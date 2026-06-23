import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "API QuickGo | Documentation Développeurs",
  description: "Intégrez les services QuickGo dans vos applications. API RESTful, webhooks, SDK et documentation complète pour les développeurs.",
  keywords: "API QuickGo, documentation API, webhooks, SDK Cameroun, intégration e-commerce",
  openGraph: {
    title: "API QuickGo | Documentation Développeurs",
    description: "Intégrez les services QuickGo dans vos applications. API RESTful, webhooks, SDK et documentation complète pour les développeurs.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
