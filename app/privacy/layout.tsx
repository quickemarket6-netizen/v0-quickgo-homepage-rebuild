import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Politique de Confidentialité | QuickGo",
  description: "Comment QuickGo collecte, utilise et protège vos données personnelles. Vos droits RGPD et la sécurité de vos informations.",
  keywords: "politique confidentialité QuickGo, RGPD, protection données, vie privée",
  openGraph: {
    title: "Politique de Confidentialité | QuickGo",
    description: "Comment QuickGo collecte, utilise et protège vos données personnelles. Vos droits RGPD et la sécurité de vos informations.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
