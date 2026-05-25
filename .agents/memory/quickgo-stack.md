---
name: QuickGo stack
description: Project overview, key architecture decisions, and what is fixed vs pending
---

## Stack
Next.js 16 (App Router, Turbopack), TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion, Supabase (@supabase/ssr), Zustand, Sonner toasts, Vercel Analytics, Leaflet maps.

## Key Decisions
- CSS color tokens (`text-quickgo-blue`, `text-quickgo-cyan`, `text-quickgo-lime`) defined in `app/globals.css` @theme inline block
- Cart store: Zustand with persist middleware at `lib/store/cart.ts` — uses `productId: number` as the lookup key
- No Supabase env vars in dev → app gracefully skips auth (mock client returned)
- `proxy.ts` at root handles route protection (admin/vendor/driver/dashboard routes)

## What Was Fixed
- `proxy.ts` (was `middleware.ts`, had wrong function name `middleware`)
- `lib/supabase/client.ts` guards against missing env vars
- `app/layout.tsx` simplified — ThemeProvider removed (not needed, dark class on html)
- `app/globals.css` — added `scrollbar-hide` utility + all custom QuickGo color tokens
- `lib/store/cart.ts` — created Zustand persisted cart store
- `components/navbar/navbar.tsx` — real cart count from Zustand, city selector, mobile menu, auth state
- `app/admin/vendors/page.tsx` — created (was missing, sidebar linked to it)
- `app/admin/finances/page.tsx` — created (was missing, sidebar linked to it)
- `app/vendor/dashboard/page.tsx` — all sidebar href="#" fixed to real routes
- `app/marketplace/cart/page.tsx` — connected to Zustand cart store
- `app/marketplace/product/[id]/page.tsx` — Add to Cart / Buy Now wired to cart store + toast
- `next.config.mjs` — remote image patterns, ignoreBuildErrors false, optimizePackageImports
- `public/site.webmanifest` — created full PWA manifest

## Pending (needs Supabase credentials)
- Full auth flow (login/register/password reset)
- Protected routes actually enforcing auth
- Real orders, products, vendors from database
- Payment integration (CinetPay, Orange Money, MTN)
- Realtime order tracking
