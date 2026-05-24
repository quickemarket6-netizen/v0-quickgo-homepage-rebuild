import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tableau de bord Livreur | QuickGo Driver",
  description: "Gérez vos missions, suivez vos gains et optimisez vos courses avec le tableau de bord QuickGo Driver.",
  openGraph: {
    title: "Tableau de bord Livreur | QuickGo Driver",
    description: "Gérez vos missions, suivez vos gains et optimisez vos courses.",
    images: ["https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0024-U4s2UDpvENxwAdPCezTrWL95wI71B4.jpg"],
  },
}

export default function DriverDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
