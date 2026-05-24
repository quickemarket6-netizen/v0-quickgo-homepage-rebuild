import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Livraison Express",
  description: "Service de livraison ultra rapide en moins de 30 minutes",
}

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
