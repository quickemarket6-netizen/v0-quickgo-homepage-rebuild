import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/sonner"
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
  metadataBase: new URL("https://quickgo.cm"),
  openGraph: {
    type: "website",
    locale: "fr_CM",
    url: "https://quickgo.cm",
    siteName: "QuickGo",
    title: "QuickGo - Livraison rapide & sécurisée au Cameroun",
    description:
      "Marketplace locale, livraison express, paiements sécurisés. Tout ce dont vous avez besoin, livré intelligemment.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "QuickGo - Super App de Livraison",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QuickGo - Livraison rapide & sécurisée",
    description: "La super application de livraison au Cameroun",
    images: ["/og-image.jpg"],
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
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
  manifest: "/site.webmanifest",
}

export const viewport: Viewport = {
  themeColor: "#0a0f1a",
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
        {children}
        <Toaster position="top-right" richColors closeButton />
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
