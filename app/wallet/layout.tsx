import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "QuickGo Pay — Portefeuille",
  description: "Votre portefeuille intelligent pour payer, recevoir et gérer votre argent",
  robots: { index: false, follow: false },
}

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
