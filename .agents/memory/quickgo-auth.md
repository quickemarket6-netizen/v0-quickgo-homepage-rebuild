---
name: QuickGo auth flows
description: Auth pages and their Supabase integration status; key patterns for OTP verify and password reset
---

# QuickGo Auth Flows

## Status (all real Supabase calls, no more setTimeout simulation)

- **forgot-password**: `supabase.auth.resetPasswordForEmail(email, { redirectTo: origin/auth/reset-password })`
- **reset-password**: `supabase.auth.updateUser({ password })` — guard uses `window.location.hash.includes("access_token")` for Supabase magic link flow
- **verify (OTP)**: `supabase.auth.verifyOtp({ email, token, type: "signup" })` — email comes from `?email=` query param passed by register page

## Register → Verify flow
Register page calls `supabase.auth.signUp()` and redirects to `/auth/sign-up-success`. The verify page at `/auth/verify` expects `?email=xxx` in the URL to pass to verifyOtp. If email is missing, OTP verification will fail silently.

**Why:** Supabase OTP requires the email that the code was sent to. The verify page cannot infer it from session alone (no session yet pre-verification).

## Resend OTP
`supabase.auth.resend({ type: "signup", email })` — only works if email is in query params.

## Protected page redirects
Auth middleware (proxy.ts) redirects unauthenticated users to `/auth/login?redirectTo=<path>`. 307 on wallet/*, dashboard/* is expected and correct behavior.
