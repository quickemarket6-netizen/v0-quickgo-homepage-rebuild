import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Navigation ",
  description: " QuickGo Driver|Mode navigation immersif pour les livreurs QuickGo",
  robots: { index: false, follow: false },
}

export default function NavigationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
