import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Centre de Contrôle - Driver",
  description: "Centre de contrôle en temps réel pour la logistique QuickGo",
}

export default function ControlCenterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
