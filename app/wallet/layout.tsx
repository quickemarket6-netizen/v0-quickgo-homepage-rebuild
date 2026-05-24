import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "QuickGo Pay",
  description: "Votre portefeuille intelligent pour payer, recevoir et gérer votre argent",
}

export default function WalletLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
