import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Devenir Vendeur",
  description: "Rejoignez la marketplace QuickGo et vendez vos produits à des milliers de clients",
}

export default function VendorsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
