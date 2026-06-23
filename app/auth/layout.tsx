import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentification | QuickGo",
  description: "Connectez-vous ou créez un compte QuickGo",
  robots: { index: false, follow: false },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
