import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "DL Solutions — Services Numériques au Cameroun",
  description: "DL Solutions propose des services numériques complets : développement web, marketing digital, photo & vidéo et solutions e-commerce au Cameroun.",
  keywords: "DL Solutions, agence numérique Cameroun, développement web Yaoundé, marketing digital Afrique",
  openGraph: {
    title: "DL Solutions — Services Numériques au Cameroun",
    description: "Développement web, marketing digital et solutions e-commerce à Yaoundé.",
    locale: "fr_CM",
    type: "website",
  },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
