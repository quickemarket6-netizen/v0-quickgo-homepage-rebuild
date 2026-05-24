import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Navigation - Driver",
  description: "Mode navigation immersif pour les livreurs QuickGo",
}

export default function NavigationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
