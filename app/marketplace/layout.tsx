import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Explorez notre marketplace avec des milliers de produits disponibles",
}

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
