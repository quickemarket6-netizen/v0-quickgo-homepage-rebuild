import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
import { ThemeProvider } from "@/components/theme-provider"
import { MotionProvider } from "@/components/motion-provider"
import { I18nProvider } from "@/lib/i18n/context"
import { RegisterSW } from "@/components/pwa/RegisterSW"
import { SITE_URL } from "@/lib/site-config"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "QuickGo - Livraison rapide & sécurisée au Cameroun",
    template: "%s | QuickGo",
  },
  description:
    "QuickGo est la super application de livraison au Cameroun. Courses, restaurants, pharmacies, supermarchés et bien plus encore, livrés rapidement.",
  keywords: [
    "livraison",
    "Cameroun",
    "Yaoundé",
    "Douala",
    "express",
    "marketplace",
    "QuickGo",
    "delivery",
    "logistics",
    "Orange Money",
    "MTN Mobile Money",
  ],
  authors: [{ name: "QuickGo" }],
  creator: "QuickGo",
  publisher: "QuickGo",
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "fr_CM",
    url: SITE_URL,
    siteName: "QuickGo",
    title: "QuickGo - Livraison rapide & sécurisée au Cameroun",
    description:
      "Marketplace locale, livraison express, paiements sécurisés. Tout ce dont vous avez besoin, livré intelligemment.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "QuickGo — Super App Cameroun" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "QuickGo - Livraison rapide & sécurisée",
    description: "La super application de livraison au Cameroun",
    images: ["/opengraph-image"],
    creator: "@quickgocm",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // app/icon.jpg + app/apple-icon.jpg are auto-detected by Next.js
  manifest: "/site.webmanifest",
}

export const viewport: Viewport = {
  themeColor: "#C8FF00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" className="dark bg-background">
      <body
        className={`${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <I18nProvider>
          <MotionProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
            <RegisterSW />
            {process.env.NODE_ENV === "production" && <Analytics />}
          </MotionProvider>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
