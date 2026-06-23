import Link from "next/link"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"
import { Bell, Mail, MessageSquare } from "lucide-react"

const tools = [
  {
    href: "/admin/dev/notifications-test",
    icon: Bell,
    label: "Notifications test",
    description: "Tester l'envoi et l'affichage des notifications",
  },
  {
    href: "/admin/dev/communication-test",
    icon: MessageSquare,
    label: "Communication test",
    description: "Tester les canaux de communication (push, SMS, WhatsApp)",
  },
  {
    href: "/admin/dev/email-test",
    icon: Mail,
    label: "Email test",
    description: "Tester l'envoi d'emails transactionnels via Resend",
  },
]

export default function AdminDevPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Outils développement</h1>
            <p className="text-muted-foreground mt-1">Pages de test — non exposées aux utilisateurs</p>
          </div>

          <div className="grid gap-4">
            {tools.map(({ href, icon: Icon, label, description }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-4 p-5 rounded-xl bg-gray-900/50 border border-gray-800 hover:border-lime-500/50 transition-colors group"
              >
                <div className="p-3 rounded-lg bg-gray-800 text-lime-400 group-hover:bg-lime-500/10 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground group-hover:text-lime-400 transition-colors">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
