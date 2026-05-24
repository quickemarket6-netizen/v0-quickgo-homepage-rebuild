import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Missions - Driver",
  description: "Explorez et acceptez des missions de livraison QuickGo",
}

export default function MissionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
