---
name: web-vitals-optimization
description: Use when diagnosing or improving web performance — how to measure first (Lighthouse, the web-vitals library, bundle analyzers), diagnose the right Core Web Vital (LCP, CLS, INP) with the fix that matches it, cut JavaScript via code-splitting and dependency trimming, fix loading/network waterfalls, and re-measure to prove the win. TRIGGER when a page is slow to load or interact, a vital regresses, or a bundle is bloated. NOT for visual/layout correctness or styling architecture. Any agent doing frontend perf (a perf specialist, a reviewer flagging a regression, a build engineer) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [performance, web-vitals, lighthouse, bundle, code-splitting]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Web Vitals Optimization

The substantive frontend-performance capability: work from measurements, optimize the metric
that actually matters, and verify the win — never guess at speed.

## When to use this skill
When the concern is *speed*: load or interaction latency, a Core Web Vital regression
(LCP/CLS/INP), render/runtime cost, or a bloated bundle. Not for layout correctness or styling
structure. Pairs with [[match-project-conventions]] and [[verify-by-running]] (the measurement
runs are the verification).

## Instructions
1. **Measure before optimizing.** "It feels slow" is not actionable — get a baseline number
   with the right tool:
   - **Lab:** `npx lighthouse <url> --view` (or `npx unlighthouse` for many routes) for
     LCP/CLS/TBT and opportunities; Chrome DevTools Performance panel for runtime flamegraphs
     and long tasks.
   - **Field/runtime:** the `web-vitals` library for real LCP/CLS/INP, and the DevTools
     "Interactions" track for INP attribution.
   - **Bundle:** `npx source-map-explorer` / `webpack-bundle-analyzer` / `vite-bundle-visualizer`,
     or the `next build` output, to see what is actually shipped.
2. **Diagnose per metric — the fix differs by vital:**
   - **LCP** (< 2.5s): find the LCP element; `preload` the hero image/font, serve modern formats
     (AVIF/WebP) with correct `sizes`, set `fetchpriority="high"`, eliminate render-blocking
     CSS/JS, and cut TTFB and request waterfalls. Lazy-load only *below-the-fold* media.
   - **CLS** (< 0.1): reserve space — width/height or `aspect-ratio` on media, `font-display` +
     size-adjust to avoid font-swap shift, and never inject content above existing content.
   - **INP** (< 200ms): break up long tasks, `yield` to the main thread, debounce/throttle, move
     heavy work off the critical path (web worker), and reduce hydration/JS execution cost.
3. **Cut JavaScript — usually the biggest lever.** Code-split by route and on interaction
   (dynamic `import()` / `React.lazy` / `next/dynamic`), tree-shake, drop or swap heavyweight
   deps (confirm with the analyzer), defer non-critical third-party scripts, and ship less to
   the client (server-render where possible). Quantify each cut in KB transferred and KB parsed.
4. **Fix loading & network.** Correct caching headers and immutable hashed assets,
   `preconnect`/`dns-prefetch` for critical origins, HTTP compression (brotli), responsive image
   `srcset`, and removing serial request chains — verify in the Network panel.
5. **Verify the win.** Re-run the same measurement under the same conditions (same throttling /
   CPU slowdown) and report the before/after delta for the *targeted* metric. A change with no
   measured improvement is not done.

## Inputs
- The target page and metric (which Core Web Vital or symptom; lab vs. field), `package.json`/
  build config, and the relevant components.

## Output
- The baseline number, the bottleneck identified (and the tool that showed it), and the change.
- Before/after for the targeted metric (LCP/CLS/INP/bundle KB), measured the same way both
  times — reported via [[verify-by-running]].
- Any trade-off (e.g. eager-preload cost) and remaining opportunities ranked by expected impact.

## Notes
- Never claim a speedup you did not measure; always cite the tool and conditions.
- Don't micro-optimize a metric that isn't the bottleneck, and don't regress one vital to chase
  another.
- Layout correctness and styling structure are a separate concern — see a CSS layout capability.
