/**
 * Admin action audit logger.
 * Call this from any admin API route after a successful mutation.
 * Always fire-and-forget — never block the response.
 */

import { createClient } from "@/lib/supabase/server"

export interface AdminActionParams {
  adminId: string
  adminEmail?: string
  action: string       // create | update | delete | approve | reject | block | export
  resource: string     // vendor | payout | order | user | cms_page | blog_post | faq_item | mission
  resourceId?: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  ip?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

export async function logAdminAction(params: AdminActionParams): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from("admin_action_logs").insert({
      admin_id:    params.adminId,
      admin_email: params.adminEmail ?? null,
      action:      params.action,
      resource:    params.resource,
      resource_id: params.resourceId ?? null,
      before_data: params.before ?? null,
      after_data:  params.after ?? null,
      ip_address:  params.ip ?? null,
      user_agent:  params.userAgent ?? null,
      metadata:    params.metadata ?? {},
    })
  } catch {
    // non-critical — never block the actual operation
  }
}
