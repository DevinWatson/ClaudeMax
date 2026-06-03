---
name: astro-framework
description: Use when working in Astro — the islands architecture and partial hydration (client:load/idle/visible/media/only), `.astro` components and the script-vs-template split, type-safe content collections (content/data, schemas, MDX), framework-agnostic UI islands (React/Vue/Svelte/Solid), the file-based router, output modes (static vs server SSR adapters vs hybrid), view transitions, and Astro's zero-JS-by-default performance model. TRIGGER on hydration/`client:*` questions, "my island isn't interactive"/over-hydration issues, `.astro` frontmatter-vs-template confusion, content-collection schema/typing errors, SSR-adapter vs static output decisions, view-transition wiring, or `astro build`/`astro check` errors. NOT for framework-agnostic UI concerns (CSS/layout, generic a11y), and NOT for the internal authoring model of a hydrated React/Vue/Svelte island — that is the host framework's boundary (Astro is the islands/content meta-framework around them). Any agent touching Astro can load it.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [astro, islands, partial-hydration, content-collections, ssr, view-transitions]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Astro Framework

The substantive Astro capability: get the *framework* concerns right — the islands
architecture and partial hydration, the `.astro` component model, type-safe content
collections, framework-agnostic UI islands, the file-based router, the static/SSR/hybrid
output modes, view transitions, and Astro's zero-JS-by-default performance posture —
independent of framework-agnostic UI design and independent of the internal authoring
model of any specific React/Vue/Svelte island once you are inside it.

## When to use this skill
When the problem is framework-level Astro behavior: choosing or debugging a `client:*`
hydration directive, an island that ships too much (or no) JS, an `.astro` component
script-vs-template question, a content-collection schema or MDX typing issue, the
static-vs-SSR-adapter-vs-hybrid output decision, file-based routing and dynamic routes,
view transitions, or an `astro build`/`astro check` failure. Not for framework-agnostic
concerns (CSS/layout, generic accessibility), and not for the internals of a hydrated
React/Vue/Svelte component once execution is inside that island — that is the host
framework's boundary, and Astro is the islands/content meta-framework around it. Pairs
with [[match-project-conventions]] and [[verify-by-running]].

## Instructions
1. **Establish the setup first.** Read `astro.config.mjs`/`astro.config.ts` and
   `package.json`: the Astro major, the `output` mode (`static` default, `server`, or
   `hybrid`), any SSR `adapter` (node/vercel/netlify/cloudflare), and which UI framework
   integrations are installed (`@astrojs/react`, `vue`, `svelte`, `solid`, `mdx`,
   `tailwind`). These determine what is even possible — e.g. you cannot SSR a route or
   call `Astro.request` without a server adapter.
2. **Honor the zero-JS-by-default model — Astro's core strength.** A `.astro` component
   renders to HTML on the server/at build time and ships **no client JS** unless you opt
   in. Default to static `.astro` markup; reach for a hydrated island only where genuine
   interactivity is required. The biggest Astro mistake is hydrating large subtrees that
   could be static.
3. **Author `.astro` components with the script-vs-template split clear.** The frontmatter
   fence (`---` … `---`) is the **component script**: it runs on the server/at build time
   only — fetch data, import components, compute props, define `Astro.props`. Below the
   fence is the **template**: HTML with JSX-like expressions. Code in the script never
   reaches the client. Use `Astro.props` for typed props (`interface Props`), slots
   (default + named) for composition, and scoped `<style>`. `<script>` tags in the
   template ARE processed/bundled and run on the client — use them for small page-level
   JS, distinct from island hydration.
4. **Choose the right `client:*` directive deliberately — this is partial hydration.**
   Only framework-component islands take a directive; an island with none renders to
   static HTML.
   - `client:load` — hydrate immediately on page load (above-the-fold, must-be-interactive-now).
   - `client:idle` — hydrate when the main thread is idle (`requestIdleCallback`); good
     default for low-priority interactivity.
   - `client:visible` — hydrate when the island scrolls into view (`IntersectionObserver`);
     best for below-the-fold widgets — ships JS only when needed.
   - `client:media={query}` — hydrate only when a media query matches (e.g. mobile-only menu).
   - `client:only={"react"|"vue"|"svelte"}` — skip SSR entirely, render client-side only
     (for components that can't render on the server); you MUST name the framework.
   Prefer the laziest directive that meets the UX need; pass only serializable props across
   the island boundary, and remember sibling islands don't share state by default.
5. **Mix UI frameworks freely — framework-agnostic islands.** React, Vue, Svelte, Solid,
   and Preact islands can coexist on one page (each integration installed in the config).
   Use the framework that fits the widget; share data by passing serializable props or via
   a shared store (e.g. nanostores) designed for cross-island state. Inside a hydrated
   island, the host framework's own rules apply — that boundary belongs to that framework,
   not here.
6. **Model content with type-safe content collections.** Define collections in
   `src/content/config.ts` with `defineCollection` + a Zod `schema` (for frontmatter or
   data), typed as `type: 'content'` (Markdown/MDX) or `type: 'data'` (JSON/YAML). Query
   with `getCollection`/`getEntry`; render Markdown/MDX via the entry's `render()`. The
   schema gives you validated, fully-typed frontmatter and autocompletion — let `astro
   check` catch schema drift. (In current Astro the Content Layer / `loader` API
   generalizes this to external sources; match the project's version.)
7. **Use the file-based router.** Files under `src/pages/` become routes:
   `index.astro` → `/`, `[slug].astro` → dynamic, `[...path].astro` → catch-all,
   `.md`/`.mdx` pages route too. In `static` output, dynamic routes need
   `getStaticPaths()` to enumerate pages at build. In `server`/`hybrid` output, dynamic
   routes can render on request and you can author API endpoints (`.ts` files exporting
   `GET`/`POST`). Use layouts via slots, not a framework router.
8. **Pick the output mode for the workload.** `static` (SSG) — fully pre-rendered, the
   default, fastest and cheapest; `server` (SSR via an adapter) — render per request for
   dynamic/auth/personalized content; `hybrid`/per-route `export const prerender` — mix
   static and on-demand. Choosing `server` requires an adapter and changes what runs at
   request time (`Astro.request`, cookies, redirects). Don't pick SSR for content that can
   be static.
9. **Wire view transitions when needed.** Add the `<ClientRouter />` (formerly
   `<ViewTransition />`) to a shared layout `<head>` for SPA-like cross-page transitions
   and persisted state; use `transition:name`/`transition:persist`/`transition:animate` to
   control element morphing and what survives navigation. It is opt-in and degrades
   gracefully where unsupported.
10. **Apply Astro performance levers — and measure.** Keep pages static; downgrade
    `client:load` → `client:visible`/`idle` where possible; split heavy interactivity into
    small islands instead of one large one; prefer `client:only` sparingly (no SSR/HTML
    means a flash and worse LCP); optimize images via `astro:assets` (`<Image/>`,
    `<Picture/>`); audit the shipped JS in the build output. Astro's win is shipping *less*
    client JS — protect that.
11. **Verify via [[verify-by-running]].** Type/diagnostics check with `astro check`
    (validates `.astro` types, props, and content-collection schemas), build with
    `astro build` (catches route/adapter/`getStaticPaths` errors and reports per-route
    output), lint with `eslint` (`eslint-plugin-astro`), and run tests with `vitest` and/or
    `playwright test`. Report the exact command and its real result.

## Inputs
- `astro.config.mjs`/`.ts` (output mode, adapter, integrations), `package.json` (Astro
  major, framework integrations), `src/content/config.ts`, the relevant `.astro`/island
  components and pages, and the failing behavior or feature requirement.

## Output
- Which framework concern was wrong and why (over/under-hydration, wrong `client:*`
  directive, script-vs-template confusion, content-collection schema, output-mode
  mismatch, routing), then the change.
- For components/pages touched: the `Astro.props`/slot contract, the chosen `client:*`
  directive and why, and any content-collection schema involved.
- The `astro check`/`astro build`/test result via [[verify-by-running]]; any
  hydration/output/routing bug resolved.

## Notes
- Most "my island isn't interactive" bugs are a missing or wrong `client:*` directive (no
  directive = static HTML); most "it ships too much JS" bugs are an over-eager `client:load`
  or a too-large island — check these first.
- Frontmatter (between the `---` fences) runs only on the server/at build; it never reaches
  the browser. `<script>` tags in the template DO ship to the client — don't conflate them.
- The internal authoring model of a hydrated React/Vue/Svelte island (its hooks, reactivity,
  lifecycle) is that framework's boundary — note it and defer rather than reasoning about it
  here. Astro owns the islands, content, routing, and output layers around them.
