import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Se connecter',
  description: 'Connectez-vous à votre compte QuickGo pour commander vos produits préférés et suivre vos livraisons en temps réel.',
  openGraph: {
    title: 'Se connecter | QuickGo',
    description: 'Connectez-vous à votre compte QuickGo pour commander vos produits préférés.',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
