---
name: remix-framework
description: Use when working in Remix (React Router 7 era) — nested routes and the route module API (loader/action/Component/ErrorBoundary/meta/links), server data loading with loaders and mutations with actions, the Web Fetch Request/Response model, forms and progressive enhancement (Form/useFetcher), error/catch boundaries, the loader→useLoaderData / action→useActionData data flow, cookies/sessions, deferred data and streaming (defer/Await), SSR and edge adapters, and the React Router 7 convergence. TRIGGER on loader/action design, "data isn't revalidating"/stale-loader-data issues, Form vs useFetcher choices, redirect/Response/headers handling, session/cookie wiring, deferred/streaming UI, or remix vite:build / react-router build errors. NOT for framework-agnostic React rendering (use react-rendering-model) and NOT for the Next.js App Router (server components/route handlers). Any agent touching Remix or React Router 7 can load it.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [remix, react-router, loaders, actions, ssr, web-fetch]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Remix Framework

The substantive Remix capability (React Router 7 era): get the *framework* concerns right — nested
routing and the route module API, server-side data loading and mutation via loaders and actions, the
Web Fetch `Request`/`Response` model, forms and progressive enhancement, error/catch boundaries, the
loader/action data flow, cookies and sessions, `meta`/`links`, deferred data and streaming, and SSR/edge
adapters — independent of framework-agnostic React rendering and independent of the Next.js App Router.

## When to use this skill

When the problem is framework-level Remix / React Router 7 behavior: designing or fixing a loader or
action, a data-revalidation or stale-`useLoaderData` bug, choosing `Form` vs `useFetcher`, handling a
`Response`/`redirect`/headers correctly, wiring cookies/sessions, building deferred/streaming UI, an
error/catch boundary question, route module typing, or a `remix vite:build` / `react-router build`
error. Not for framework-agnostic React rendering (memoization, reconciliation — use
[[react-rendering-model]]) and not for the Next.js App Router (server components, route handlers — that
is a separate meta-framework boundary). Pairs with [[match-project-conventions]] and
[[verify-by-running]].

## Instructions

1. **Establish the setup first.** Read `package.json` to determine whether the app is on classic Remix
   (`@remix-run/*`) or the React Router 7 framework mode (`react-router`, `@react-router/*`) — they share
   one programming model but differ in package names and the build command. Note the runtime adapter
   (Node, Cloudflare, Vercel, Deno, edge), whether Vite is the bundler (it is the default now), and
   whether route typegen (`.react-router/types` or `+types`) is in use. Match the conventions you find.
2. **Map the nested route tree and the route module API.** Routes are nested via file-based or config
   routes; nesting maps URL segments to nested layouts that render through `<Outlet />`. Each route
   *module* may export: `loader` (server read), `action` (server write), the default `Component`/element,
   `ErrorBoundary` (and in classic Remix, `CatchBoundary` for thrown `Response`s — converged into
   `ErrorBoundary` + `isRouteErrorResponse` in v2/RR7), `meta`, `links`, `handle`, and `shouldRevalidate`.
   Parent loaders run for child routes — design the data needs per segment, not per page.
3. **Load data with `loader` (server-only, runs on every navigation to the route).** A loader receives
   `{ request, params, context }`, runs only on the server, and returns serializable data (return a plain
   object, or a `Response`/`json()` — in RR7 you can return raw objects). Read it in the component with
   `useLoaderData<typeof loader>()` for end-to-end typing. Use `request` (a Web `Request`) for the URL,
   search params, and headers; throw a `Response` (e.g. `throw new Response(null, { status: 404 })` or
   `throw redirect(...)`) to short-circuit into the nearest boundary. Loaders re-run after actions
   (revalidation) — control it with `shouldRevalidate` when needed.
4. **Mutate with `action` and drive it from a `Form`.** Actions are server-only and handle non-GET
   submissions: read the submitted data via `await request.formData()`, perform the write, then return
   either data (read with `useActionData`) or a `redirect(...)` (the Post/Redirect/Get pattern — prefer it
   after a successful mutation). Use the Remix `<Form method="post">` for the primary navigation
   submission (it works without JS — progressive enhancement) and `useFetcher` for in-place submissions
   that should NOT trigger navigation (likes, inline edits, type-ahead, optimistic UI). Use
   `useNavigation`/`fetcher.state` for pending UI and `fetcher.formData`/`navigation.formData` for
   optimistic UI.
5. **Use the Web Fetch model deliberately.** Loaders/actions speak `Request` in and `Response` out:
   set status and headers on the `Response`, use `redirect`/`json` helpers, and return per-route
   `headers` (for caching/Set-Cookie) via the `headers` export. Don't reach for Node-specific request
   objects — stay on the Web standard so the code runs on edge runtimes too.
6. **Handle errors with boundaries.** Export an `ErrorBoundary` to catch render and loader/action errors;
   use `useRouteError()` and `isRouteErrorResponse(error)` to distinguish a thrown `Response` (expected
   4xx/5xx, formerly `CatchBoundary`) from an unexpected thrown error. Place boundaries at the right
   nesting level so a child error doesn't blank the whole app — a route segment can recover locally.
7. **Manage cookies and sessions on the server.** Build cookies with `createCookie` and sessions with a
   session storage (`createCookieSessionStorage`, or a server/DB-backed store). Read the session from
   `request` headers in the loader/action, commit it into the response `Set-Cookie` header, and keep
   secrets server-side. Never trust client-supplied auth state — the loader/action is the authorization
   boundary.
8. **Set `meta` and `links` per route.** Export `meta` for title/description/OG tags (it receives loader
   data, so derive SEO tags from data) and `links` for stylesheets/preloads/preconnect. These compose
   down the nested tree.
9. **Defer slow data and stream it.** When part of a loader's data is slow, return a promise (RR7) or use
   `defer({ fast, slow })`, render the fast data immediately, and wrap the slow part in
   `<Suspense fallback>` + `<Await resolve={slow}>`. This streams the shell first and hydrates the slow
   region — improving TTFB/LCP without blocking the whole route.
10. **Mind the SSR/edge adapter.** The same route modules render on the server (SSR) and hydrate on the
    client; the adapter (Node/Cloudflare/Vercel/edge) determines available APIs and request handling.
    Keep server-only code (DB clients, secrets, `*.server.ts` files) out of the client bundle, and verify
    behavior under the actual adapter.
11. **Know the React Router 7 convergence.** Remix v2's framework features now ship as React Router 7
    "framework mode": loaders/actions, nested routes, `Form`/`useFetcher`, boundaries, and the Vite plugin
    are the same model under `react-router`/`@react-router/*` with `react-router build`. When advising,
    state which package set the project uses and give the correct import paths and build command for it.
12. **Verify via [[verify-by-running]].** Type-check with `tsc --noEmit` (route typegen feeds
    `useLoaderData<typeof loader>` typing), build with `remix vite:build` or `react-router build`, lint
    with `eslint`, and run tests with `vitest` (unit/component) and/or `playwright` (e2e of the data
    flow). Report the exact command and its real result.

## Inputs

- `package.json` (classic Remix vs React Router 7, adapter, Vite, typegen), the route module(s) in
  scope, any session/cookie and `entry.server`/`entry.client` setup, and the failing behavior or
  feature requirement.

## Output

- Which loader/action/boundary/data-flow concern was wrong and why, then the change.
- For routes touched: the loader/action contract (params, returned data shape, redirects/status), the
  `Form`/`useFetcher` and revalidation behavior, and any cookie/session/headers handling.
- The `tsc` + `remix vite:build`/`react-router build` + `vitest`/`playwright` result via
  [[verify-by-running]]; any stale-data or revalidation bug resolved.

## Notes

- Most "my data is stale / didn't update" bugs are revalidation issues: an action that returned data
  instead of redirecting, a `shouldRevalidate` returning `false`, or client state held outside the
  loader — check the loader/action data flow first.
- Prefer `<Form>` + `action` + `redirect` for primary mutations (progressive enhancement, no double
  submit); reach for `useFetcher` only when you specifically want no navigation.
- Keep server-only modules (`*.server.ts`, DB/secret access) off the client; loaders/actions are the
  trust boundary, not client-side guards.
- State the package set (`@remix-run/*` vs `react-router`/`@react-router/*`) and the matching build
  command (`remix vite:build` vs `react-router build`) explicitly — they are the same model with
  different names.
