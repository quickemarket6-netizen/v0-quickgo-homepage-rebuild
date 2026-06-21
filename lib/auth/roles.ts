export type UserRole = "customer" | "driver" | "vendor" | "admin" | "super_admin"

export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  customer: "/dashboard",
  driver: "/driver/dashboard",
  vendor: "/vendor/dashboard",
  admin: "/admin",
  super_admin: "/admin",
}

/**
 * Returns the dashboard path for a given role.
 * Defaults to the client dashboard when role is unknown.
 */
export function getDashboardPath(role?: string | null): string {
  if (role && role in ROLE_DASHBOARDS) {
    return ROLE_DASHBOARDS[role as UserRole]
  }
  return "/dashboard"
}

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Client",
  driver: "Livreur",
  vendor: "Vendeur",
  admin: "Administrateur",
  super_admin: "Super Administrateur",
}

/** Roles a user can self-select during onboarding. */
export const SELECTABLE_ROLES: UserRole[] = ["customer", "vendor", "driver"]

/** Roles that have full admin access. */
export function isAdminRole(role?: string | null): boolean {
  return role === "admin" || role === "super_admin"
}

/** Path prefixes that require a specific role to access. */
export const PROTECTED_ROUTES: { prefix: string; roles: UserRole[] }[] = [
  { prefix: "/admin", roles: ["admin", "super_admin"] },
  { prefix: "/driver", roles: ["driver", "admin", "super_admin"] },
  { prefix: "/vendor", roles: ["vendor", "admin", "super_admin"] },
  { prefix: "/dashboard", roles: ["customer", "driver", "vendor", "admin", "super_admin"] },
]
