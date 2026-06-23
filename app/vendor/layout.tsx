import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Espace Commerçant | QuickGo Vendor",
  description: "Gérez votre boutique, vos produits, commandes et finances sur QuickGo.",
  robots: { index: false, follow: false },
}

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
