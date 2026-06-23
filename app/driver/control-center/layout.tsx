import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Centre de Contrôle ",
  description: " QuickGo Driver|Centre de contrôle en temps réel pour la logistique QuickGo",
  robots: { index: false, follow: false },
}

export default function ControlCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
