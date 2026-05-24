import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Classement - Driver",
  description: "Classement et récompenses des livreurs QuickGo",
}

export default function RankingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
