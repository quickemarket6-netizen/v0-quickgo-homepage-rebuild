import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tableau de bord Vendeur | QuickGo Vendor",
  description: "Gérez votre boutique, suivez vos ventes et analysez vos performances avec le tableau de bord QuickGo Vendor.",
  openGraph: {
    title: "Tableau de bord Vendeur | QuickGo Vendor",
    description: "Gérez votre boutique et analysez vos performances.",
    images: ["https://hebbkx1anhila5yf.public.blob.vercel-storage.com/IMG-20260524-WA0027-GOLyF5svxJe1iVY3n6ot2bANiCAWnO.jpg"],
  },
}

export default function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
