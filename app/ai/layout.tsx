import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "AI Assistant",
  description: "Votre assistant intelligent QuickGo AI pour vous aider 24h/24",
}

export default function AILayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
