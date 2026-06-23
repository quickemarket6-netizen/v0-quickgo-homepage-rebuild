import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mes Missions ",
  description: " QuickGo Driver|Explorez et acceptez des missions de livraison QuickGo",
  robots: { index: false, follow: false },
}

export default function MissionsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
