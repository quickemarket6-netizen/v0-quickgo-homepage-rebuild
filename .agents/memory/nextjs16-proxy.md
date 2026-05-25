---
name: Next.js 16 proxy
description: Next.js 16 renamed middleware.ts to proxy.ts — export must be named 'proxy'
---

In Next.js 16 (this project runs v16.2.6), the `middleware.ts` convention is replaced by `proxy.ts`.

**Rule:** The file must be `proxy.ts` at the project root (not `middleware.ts`). The exported function must be named `proxy` (or a default export), not `middleware`.

**Why:** Next.js 16 broke the old convention. Having both `middleware.ts` and `proxy.ts` causes a hard crash. The `config.matcher` export still works the same way.

**How to apply:** When setting up route protection or request interceptors, always use `proxy.ts` with `export async function proxy(request: NextRequest)`.
