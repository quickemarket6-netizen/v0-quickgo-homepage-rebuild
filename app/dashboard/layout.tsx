import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tableau de bord",
  description: "Gérez vos commandes et votre compte QuickGo",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
