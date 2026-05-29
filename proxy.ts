import { updateSession } from "@/lib/supabase/middleware"
import { type NextRequest, NextResponse } from "next/server"

const PROTECTED_ROUTES = ["/dashboard", "/marketplace/orders", "/marketplace/favorites", "/wallet", "/notifications"]
const ADMIN_ROUTES = ["/admin"]
const VENDOR_ROUTES = ["/vendor"]
const DRIVER_ROUTES = ["/driver"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r))
  const isVendorRoute = VENDOR_ROUTES.some((r) => pathname.startsWith(r))
  const isDriverRoute = DRIVER_ROUTES.some((r) => pathname.startsWith(r))
  const isProtectedRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r))

  // updateSession refreshes the token and returns the verified user in one shot.
  // Reusing the same client avoids reading stale cookies in a second client.
  const { response, user } = await updateSession(request)

  if (isAdminRoute || isVendorRoute || isDriverRoute || isProtectedRoute) {
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = "/auth/login"
      loginUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|manifest)$).*)",
  ],
}
