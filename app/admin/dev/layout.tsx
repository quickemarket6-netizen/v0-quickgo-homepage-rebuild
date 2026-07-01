import { notFound } from "next/navigation"
import { verifyAdmin } from "@/lib/payments/security"

// Guard for the /admin/dev/* developer tools.
//
// These pages can send real transactional emails, open real WhatsApp/SMS
// channels and expose internal contact details. They must never be reachable
// by the public and, by default, must not be reachable in production at all.
//
//   - Production: blocked entirely (404) unless ENABLE_ADMIN_DEV_TOOLS=true is
//     explicitly set — an opt-in escape hatch for deliberate prod diagnostics.
//   - Any environment: requires an authenticated admin / super_admin.
export default async function AdminDevLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const devToolsEnabled =
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_ADMIN_DEV_TOOLS === "true"

  if (!devToolsEnabled) notFound()

  const admin = await verifyAdmin()
  if (!admin.valid) notFound()

  return <>{children}</>
}
