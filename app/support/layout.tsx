import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Aide & Support",
  description: "Centre d'aide QuickGo - Trouvez les réponses à vos questions",
}

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
