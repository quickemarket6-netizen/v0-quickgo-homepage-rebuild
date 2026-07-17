import { updateSession } from "@/lib/supabase/middleware"
import { createServerClient } from "@supabase/ssr"
import { NextRequest, NextResponse } from "next/server"

// ── Route groups ─────────────────────────────────────────────────────────────

// publicRoot: the bare prefix path is a public landing page (recruitment
// pitch), only its sub-routes are the role-gated app.
const ROLE_ROUTES = [
  { prefix: "/admin",  allowed: ["admin", "super_admin"], publicRoot: false },
  { prefix: "/vendor", allowed: ["vendor"],               publicRoot: false },
  { prefix: "/driver", allowed: ["driver"],               publicRoot: true  },
] as const

// Segment-aware prefix match: "/vendor" must guard "/vendor" and "/vendor/…"
// but NOT "/vendors" (the public «Devenir vendeur» landing page).
function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(prefix + "/")
}

const AUTH_REQUIRED_PREFIXES = [
  "/dashboard",
  "/profile",
  "/marketplace/orders",
  "/marketplace/checkout",
  "/wallet",
  "/delivery",
  "/notifications",
  "/ai",
  "/ai-assistant",
  "/assistant",
]

// ── Redirects ─────────────────────────────────────────────────────────────────

function toLogin(req: NextRequest): NextResponse {
  const url = req.nextUrl.clone()
  url.pathname = "/auth/login"
  url.searchParams.set("next", req.nextUrl.pathname)
  return NextResponse.redirect(url)
}

function toDashboard(req: NextRequest, role: string): NextResponse {
  const url = req.nextUrl.clone()
  url.searchParams.delete("next")
  if (role === "admin" || role === "super_admin") url.pathname = "/admin"
  else if (role === "vendor")                     url.pathname = "/vendor/dashboard"
  else if (role === "driver")                     url.pathname = "/driver/dashboard"
  else                                            url.pathname = "/dashboard"
  return NextResponse.redirect(url)
}

// ── Role lookup ───────────────────────────────────────────────────────────────

async function getRole(req: NextRequest, userId: string): Promise<string> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: () => {},
      },
    }
  )
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()
  return data?.role ?? "customer"
}

// ── Security headers ──────────────────────────────────────────────────────────

function applySecurityHeaders(res: NextResponse, pathname: string): NextResponse {
  res.headers.set("X-Frame-Options", "DENY")
  res.headers.set("X-Content-Type-Options", "nosniff")
  res.headers.set("X-XSS-Protection", "1; mode=block")
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self), payment=()")

  // Segment-aware so the public landings stay indexable: "/vendors"
  // («Devenir vendeur») must not be caught by "/vendor", and the bare
  // "/driver" recruitment page is public — only the driver app is noindexed.
  const noindex =
    matchesPrefix(pathname, "/admin")     ||
    matchesPrefix(pathname, "/dashboard") ||
    matchesPrefix(pathname, "/api")       ||
    matchesPrefix(pathname, "/vendor")    ||
    (matchesPrefix(pathname, "/driver") && pathname !== "/driver")
  if (noindex) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow")
  }

  if (process.env.NODE_ENV === "production") {
    res.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
  }

  return res
}

// ── Proxy (Next.js 16 convention, replaces middleware.ts) ─────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const { response, user } = await updateSession(request)

  // Auth-only pages (any logged-in user)
  if (AUTH_REQUIRED_PREFIXES.some(p => matchesPrefix(pathname, p))) {
    if (!user) return toLogin(request)
    return applySecurityHeaders(response, pathname)
  }

  // Role-protected pages. A publicRoot prefix leaves its bare landing page
  // (e.g. /driver — recruitment pitch) open to everyone.
  const match = ROLE_ROUTES.find(r =>
    matchesPrefix(pathname, r.prefix) && !(r.publicRoot && pathname === r.prefix)
  )
  if (match) {
    if (!user) return toLogin(request)
    const role = await getRole(request, user.id)
    if (!(match.allowed as readonly string[]).includes(role)) {
      return toDashboard(request, role)
    }
  }

  return applySecurityHeaders(response, pathname)
}

// ── Matcher ───────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
}
