import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

type Role = "client" | "vendor" | "driver" | "admin"

const DASHBOARD: Record<Role, string> = {
  client: "/dashboard",
  vendor: "/vendor/dashboard",
  driver: "/driver/dashboard",
  admin: "/admin/dashboard",
}

function dashboardFor(role: string | undefined | null): string {
  return DASHBOARD[(role as Role) ?? "client"] ?? "/dashboard"
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? ""

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/auth/login?error=${encodeURIComponent(error.message)}`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }

  // Only these roles can be self-assigned via registration metadata
  const ASSIGNABLE_ROLES = new Set(["client", "vendor", "driver"])

  function isSafeRedirect(url: string): boolean {
    return url.startsWith("/") && !url.startsWith("//") && !url.includes("://")
  }

  // Sync role from user metadata → profile (handles email-confirmed registrations)
  const rawMetaRole = user.user_metadata?.role as string | undefined
  // Whitelist to prevent privilege escalation via manipulated user_metadata
  const metaRole = rawMetaRole && ASSIGNABLE_ROLES.has(rawMetaRole) ? rawMetaRole : undefined

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single()

  let role = profile?.role as string | undefined

  if (metaRole && !role) {
    // User registered with role in metadata but profile not updated yet
    await supabase.from("profiles").upsert({
      id: user.id,
      role: metaRole,
      full_name: profile?.full_name ?? user.user_metadata?.full_name ?? null,
    }).eq("id", user.id)
    role = metaRole
  }

  // If no role at all (Google OAuth new user) → ask them to choose
  if (!role) {
    return NextResponse.redirect(`${origin}/auth/choose-role`)
  }

  // Safe redirect: only allow relative internal paths to prevent open redirect
  if (next && isSafeRedirect(next) && next !== "/" && !next.startsWith("/auth")) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}${dashboardFor(role)}`)
}
