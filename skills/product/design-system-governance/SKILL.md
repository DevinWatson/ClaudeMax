---
name: design-system-governance
description: Use to govern a design system's coherence — enforce a primitive/semantic (optionally component) token taxonomy with components consuming semantic tokens never raw values, audit component API and naming consistency (props mean the same thing everywhere, names describe role not appearance), define documentation requirements, run a deprecation lifecycle (experimental→stable→deprecated→removed with migration + removal version), and set contribution rules and semver. TRIGGER on "audit/curate the design system, tokens, or component API." Curates the system and its rules — not implementing CSS/components. Any agent that governs a design system (a design-system curator, a component-API reviewer, a tokens linter) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob
category: product
tags: [design-system, design-tokens, governance, components, naming]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Design System Governance

The substantive capability for keeping a design system coherent as it grows: govern its tokens,
component APIs, naming, documentation, and contribution/deprecation rules so the system stays
consistent and predictable. Curate the system and its rules — do not build features in it.

## When to use this skill
When auditing or evolving a design system's token taxonomy, component API/naming consistency,
documentation, deprecation lifecycle, or contribution rules. Composes well with a conventions skill
(e.g. [[match-project-conventions]]) to fit the repo's existing token format. Authoring the actual
CSS/styling internals or React component implementation is a CSS/React specialist's job — produce
the spec, naming, token definitions, and review criteria and hand implementation there.

## Instructions
1. **Map the system first.** Locate token definitions, component source, and docs (`Glob`/`Grep`
   for `tokens`, `*.css`/`*.scss`/`theme`, `stories`, `storybook`, component dirs) and the format in
   use (CSS custom properties, Style Dictionary, Tailwind config, Figma tokens). State which curation
   task you are doing.
2. **Enforce the token taxonomy — two (or three) tiers:**
   - **Primitive / global** — raw, context-free values: `color-blue-500`, `space-4 = 4px`,
     `font-size-300`, built on consistent scales (modular type scale, 4/8-based spacing, tonal color
     ramp 50–900).
   - **Semantic / alias** — intent-named, referencing primitives: `color-action-primary →
     color-blue-500`, `space-inset-md → space-4`, `color-text-danger`. Components consume **semantic**
     tokens, never primitives, so themes/dark-mode swap at the alias layer. Flag any component bound
     to a raw value.
   - Optionally **component tokens** (`button-padding-x`) aliasing semantic tokens.
   Audit for orphan primitives, semantic tokens with no clear intent, duplicate values that should
   share one token, and off-scale magic numbers.
3. **Audit component API & naming consistency.** Prop names mean the same thing everywhere
   (`variant`, `size`, `tone`, `isDisabled`), enums share vocabularies, boolean naming is consistent,
   similar components compose alike, and names describe role not appearance (`color-text-danger`, not
   `color-text-red`).
4. **Define documentation requirements.** Each component/token needs purpose, when-to-use vs. a
   sibling, props/anatomy, do/don't examples, and status — a single source of truth.
5. **Run a deprecation lifecycle.** `experimental → stable → deprecated → removed`. A deprecation
   carries a reason, a replacement, a migration note, and a removal version. Never delete without a
   deprecation window.
6. **Set contribution rules and versioning.** The bar to add/change a component or token: proposal,
   accessibility expectations (defer detailed WCAG checks to a WCAG auditor), naming review, docs
   requirement, and semver (breaking token/API changes are major).

## Inputs
- The token definitions, component source, and docs; the token format/tooling in use; and the
  curation task (taxonomy, API/naming, docs, deprecation, contribution rules).

## Output
- When changing files (token defs, docs, contribution guide), the focused edit plus a summary.
- Otherwise a review: scope; findings by area (tier/area, location, inconsistency, the rule to
  apply); proposed token changes (additions/renames/deprecations + migration); naming/API
  normalizations (before → after with rationale); deprecations (token/component — reason —
  replacement — remove-by version); and open governance questions needing a human owner.

## Notes
- Curate the system, don't implement features in it — route CSS/component code to a CSS/React
  specialist.
- Components consume semantic tokens, not primitives; enforce that boundary relentlessly.
- Never silently break consumers: renames/removals go through deprecation with a migration path and
  a version bump. Prefer reusing/aliasing an existing token over minting a new one. Prefer `Edit` for
  targeted changes; use `Write` only to create a new file.
