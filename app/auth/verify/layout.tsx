import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Vérification OTP",
  description: "Vérifiez votre numéro de téléphone avec le code OTP pour accéder à votre compte QuickGo.",
}

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
