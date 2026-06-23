import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mes Gains ",
  description: " QuickGo Driver|Analysez vos revenus et performances en tant que livreur QuickGo",
  robots: { index: false, follow: false },
}

export default function EarningsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
