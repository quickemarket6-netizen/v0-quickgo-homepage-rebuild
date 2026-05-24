import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Gains & Analyses - Driver",
  description: "Analysez vos revenus et performances en tant que livreur QuickGo",
}

export default function EarningsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
