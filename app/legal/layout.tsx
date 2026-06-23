import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Mentions Légales | QuickGo",
  description: "Mentions légales de QuickGo — DL Solutions SARL, société de droit camerounais, Bastos Yaoundé. Informations légales et réglementaires.",
  keywords: "mentions légales QuickGo, DL Solutions SARL, société Cameroun",
  openGraph: {
    title: "Mentions Légales | QuickGo",
    description: "Mentions légales de QuickGo — DL Solutions SARL, société de droit camerounais, Bastos Yaoundé. Informations légales et réglementaires.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
