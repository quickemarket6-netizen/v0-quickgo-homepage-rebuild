import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tableau de bord Livreur ",
  description: " QuickGo Driver|Gérez vos missions, suivez vos gains et optimisez vos courses avec le tableau de bord QuickGo Driver.",
  robots: { index: false, follow: false },
}

export default function DriverDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
