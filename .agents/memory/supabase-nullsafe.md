---
name: Supabase client null-safe
description: createBrowserClient throws if env vars are missing — must guard before calling it
---

`@supabase/ssr`'s `createBrowserClient` throws a hard error if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are empty/undefined. This crashes the entire React tree.

**Rule:** In `lib/supabase/client.ts`, always check for the env vars before calling `createBrowserClient`. Return a mock client (with no-op auth methods) when vars are absent so the app gracefully degrades without Supabase.

**Why:** Dev environments often don't have Supabase configured yet. A crash-on-import is unacceptable for an app that needs to run without credentials during development.

**How to apply:** Pattern used in this project:
```ts
if (!url || !key) {
  return { auth: { getUser: async () => ({ data: { user: null }, error: null }), ... } } as any
}
return createBrowserClient(url, key)
```
