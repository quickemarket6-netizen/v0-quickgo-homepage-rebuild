import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Admin - Tableau de bord",
  description: "Centre de contrôle administrateur QuickGo",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
