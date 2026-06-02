---
name: css-layout-and-cascade
description: Use when diagnosing or building CSS layout — how to debug with the cascade (specificity, source order, inheritance) instead of !important, choose the right layout primitive (Flexbox vs. Grid), get positioning and stacking contexts right, build responsive/fluid layouts (clamp, container queries, logical properties), and use modern CSS with fallbacks. TRIGGER when layout is broken or misaligned, a style isn't applying, z-index "doesn't work", or you need a robust responsive layout. NOT for load/runtime speed (LCP/CLS/INP/bundle). Any agent doing CSS (a CSS specialist, a UI reviewer, a component author) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [css, layout, flexbox, grid, responsive, cascade]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# CSS Layout and Cascade

The substantive CSS capability: make layouts correct, robust, and maintainable across
viewports by diagnosing with the cascade and choosing the right layout primitive — fixing the
cause rather than escalating with `!important`.

## When to use this skill
When the concern is visual/layout *correctness*: a style not applying, an element
mis-positioned, an overflow/wrap problem, a stacking issue, or building a responsive layout.
Not for load/runtime speed. Pairs with [[match-project-conventions]] (match Tailwind / CSS
Modules / styled-components / the token system already in use).

## Instructions
1. **Diagnose with the cascade, not guesses.** When a style "doesn't work," inspect computed
   styles and the rules pane: is the selector matching, is it being overridden (specificity,
   source order, `!important`, inline), or is the property inherited/invalid in this context?
   Fix the *cause* — lower specificity or reorder — rather than escalating with `!important`.
2. **Choose the right layout primitive.** **Flexbox** for one-dimensional distribution (a
   row/column, alignment, spacing with `gap`); **Grid** for two-dimensional layout (page
   templates, card grids, `grid-template-areas`, `minmax()`/`auto-fit`/`auto-fill` for
   responsive tracks). Don't fight the formatting context — know whether a block, flex, or grid
   container is in play and how `margin`, `gap`, and alignment behave inside each.
3. **Get positioning and stacking right.** Understand containing blocks, `position`
   (relative/absolute/sticky/fixed), and stacking contexts — `z-index` only compares within the
   same context, and `transform`/`opacity`/`filter`/`will-change` create new ones. Diagnose
   "z-index doesn't work" as a stacking-context problem, not a bigger-number problem.
4. **Make it responsive and fluid.** Prefer intrinsic, content-driven sizing and fluid
   techniques (`clamp()`, `min()`/`max()`, `%`/`fr`, `aspect-ratio`) over fixed breakpoints
   where possible. Use **container queries** (`@container`) for component-level responsiveness
   and media queries for page-level. Mobile-first. Use logical properties (`margin-inline`,
   `inset`) for writing-mode/RTL safety.
5. **Write maintainable CSS.** Keep specificity flat and predictable, use custom properties for
   tokens/theming, and lean on modern features (`:has()`, `:is()`/`:where()`, nesting) where
   support allows — check support and provide a fallback when it doesn't. Avoid magic numbers.
6. **Verify across states and viewports.** Test at narrow/wide widths, with long/short content,
   RTL if relevant, and at zoom/reflow (400%). Confirm the fix in computed styles and the
   responsive/device toolbar; run the project's `stylelint` if present.

## Inputs
- The affected markup/JSX, the stylesheets/CSS-in-JS, and any design tokens or framework
  (Tailwind, CSS Modules, styled-components) — match the existing approach.

## Output
- The root cause stated in CSS terms (cascade / layout / stacking / sizing), then the change.
- One line of rationale per non-obvious rule, plus a browser-support note for any modern feature.
- Which viewports/states were tested (and the `stylelint` result, when present) and any
  remaining fragility.

## Notes
- Fix specificity at the source; avoid `!important` and deep selector chains unless justified.
- Don't break other viewports or RTL/zoom to fix one — verify across states.
- Load/runtime speed (LCP/CLS/INP/bundle) is a separate concern — see a web-vitals capability.
