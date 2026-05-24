import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentification",
  description: "Connectez-vous ou créez un compte QuickGo",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
