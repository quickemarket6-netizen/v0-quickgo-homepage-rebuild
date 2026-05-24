import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Devenir Livreur",
  description: "Rejoignez la communauté QuickGo et devenez livreur partenaire",
}

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
