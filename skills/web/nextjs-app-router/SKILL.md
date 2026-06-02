---
name: nextjs-app-router
description: Use when working in the Next.js App Router — how to place the Server/Client Component boundary, fetch data and control the data/route cache and revalidation, write server actions and route handlers safely, and stream with Suspense. TRIGGER on hydration mismatches, "cannot use X in a Server Component" errors, stale-data/revalidation bugs, or App Router build/route config. NOT for framework-agnostic React (hook composition, where state lives, re-render tuning) or HTTP contract design. Any agent touching Next.js App Router code (a Next pro, a reviewer of an App Router PR, a full-stack debugger) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [nextjs, app-router, rsc, server-actions, caching]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Next.js App Router

The substantive Next.js capability: get the App Router *framework* concerns right — where code
runs (the server/client boundary), how data is fetched and cached, how mutations and routes are
wired — independent of pure React design.

## When to use this skill
When the problem is framework-level App Router behavior: a boundary error, a caching/stale-data
bug, a server action, a route handler, streaming/Suspense, middleware, or metadata. Not for
framework-agnostic React (that is the rendering model) or HTTP contract design (status codes,
error shapes, versioning). Pairs with [[match-project-conventions]] and [[verify-by-running]].

## Instructions
1. **Determine the execution environment first.** Read `package.json` for the Next major —
   13/14/15 differ on caching defaults; Next 15 made `fetch` and route handlers uncached by
   default and made `cookies()`/`headers()`/`params`/`searchParams` async. Then locate the
   failing code: Server Component (the default), Client Component, route handler, Edge
   middleware, or server action. Most App Router bugs are a boundary error.
2. **Fix the boundary.** Server Components cannot use hooks, browser APIs, event handlers, or
   Context. Push `"use client"` to the *leaf* that needs interactivity; keep data fetching and
   secrets on the server. Pass only serializable props across the boundary (no functions or
   class instances). For "importing a server-only module into a Client Component" errors, split
   the file or use the `server-only`/`client-only` guard packages.
3. **Get data fetching and caching right** — the top source of "stale data" and "works locally,
   not in prod" bugs. Be explicit per layer:
   - **Data cache:** `fetch(url, { cache: 'force-cache' | 'no-store', next: { revalidate, tags } })`
     — state the default you rely on (uncached on 15, cached on 14).
   - **Full Route Cache / static vs dynamic:** know what forces a route dynamic (`cookies()`,
     `headers()`, `searchParams`, `no-store`, `export const dynamic = 'force-dynamic'`).
   - **Revalidation:** `revalidatePath`/`revalidateTag` from a server action or route handler,
     or time-based `revalidate`. Tie every write to the exact revalidation it requires.
4. **Use server actions for mutations.** Mark `"use server"`, validate and authorize *inside*
   the action (never trust the client — treat it as a public POST endpoint), return typed
   results, and revalidate or `redirect()` afterward. Wire `useActionState`/`useFormStatus` on
   the client for pending/error UI.
5. **Route handlers & middleware.** Use `app/**/route.ts` for non-UI HTTP endpoints; read the
   Web `Request`/`Response` and set caching deliberately. Keep Edge middleware fast and free of
   Node-only APIs.
6. **Stream slow data.** Use `loading.tsx`/`<Suspense>` to stream instead of blocking the route,
   set `error.tsx` boundaries, and start independent fetches in parallel to avoid waterfalls.

## Inputs
- `package.json` (Next major), `next.config.*`, the relevant `app/` route segment, and any
  `"use client"`/`"use server"` directives.

## Output
- Which boundary or cache layer was wrong and why, then the change.
- For each route touched: static or dynamic, and what triggers its revalidation.
- The `next build`/`next lint` result via [[verify-by-running]] (the build surfaces RSC
  boundary errors and the per-route static/dynamic decision); any hydration warning resolved.

## Notes
- Don't slap `"use client"` on a whole subtree to silence an error — move the boundary to the leaf.
- Don't claim caching/revalidation behaves a certain way without confirming it against the
  installed Next major's defaults.
- HTTP contract design (status codes, error envelopes, pagination, versioning) is a separate
  concern — see a REST API design capability.
