---
name: wcag-audit
description: Use when auditing UI for accessibility against WCAG 2.2 (A/AA) — how to combine automated scans (axe-core / jest-axe / Lighthouse) with manual review of semantics, ARIA, keyboard operability and focus management, color contrast, names/labels, and reduced-motion, mapping each finding to a specific success criterion and the assistive tech it affects. TRIGGER on "audit/check accessibility (a11y/WCAG)" for a component, page, or diff. Any agent that evaluates accessibility (an a11y auditor, a UI reviewer, a design-system checker) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: web
tags: [accessibility, a11y, wcag, aria, keyboard]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# WCAG Audit

The substantive accessibility capability: find real, criterion-mapped WCAG 2.2 defects in UI
by combining automated tooling with the manual review automation cannot do, and map each to
the success criterion and the users it blocks.

## When to use this skill
When evaluating UI for accessibility conformance: a component, page, route, or diff that needs
a WCAG 2.2 A/AA judgement. Pairs with a ranking skill (e.g. [[severity-triage]]) to order the
findings. Note: automated scans catch only ~30-40% of issues — they are a floor, not a verdict.

## Instructions
1. **Run automated checks where possible** to catch mechanical issues fast: `npx @axe-core/cli
   <url>` for a live page, or axe-core in the project's test runner (`jest-axe` /
   `@axe-core/playwright`); Lighthouse's accessibility category as a second signal. Treat every
   result as a *candidate* — verify it; a clean scan does not mean accessible.
2. **Audit semantics and structure manually.** Prefer native elements (`<button>`, `<a href>`,
   `<nav>`, `<label>`, headings) over `<div role=...>`. Check logical heading order, landmarks,
   list semantics, and that every control has an accessible name (visible label, `aria-label`,
   or `aria-labelledby`). First rule of ARIA: don't use ARIA if a native element exists —
   invalid roles/states are worse than none (1.3.1, 4.1.2).
3. **Test keyboard operability and focus** (2.1.1 Keyboard, 2.4.3 Focus Order, 2.4.7 Focus
   Visible, 2.4.11 Focus Not Obscured): everything actionable is reachable and operable by
   keyboard, tab order is logical, focus is never trapped (except an intentional modal trap that
   restores focus on close), no positive `tabindex`, and the focus indicator is visible. Confirm
   dialogs move focus in and restore it out, and that custom widgets implement the expected key
   patterns (WAI-ARIA Authoring Practices).
4. **Check perceivability.** Color contrast (1.4.3: 4.5:1 text, 3:1 large text and UI
   components per 1.4.11), information not conveyed by color alone (1.4.1), text resize/reflow
   (1.4.10), images with appropriate `alt` (decorative = empty alt), form fields with
   programmatic labels and announced errors, and `prefers-reduced-motion` honored.
5. **Map every finding to its criterion.** Tag each with its WCAG success criterion (e.g.
   "1.3.1 Info and Relationships") and the assistive tech it affects (screen reader / keyboard /
   low-vision). A keyboard trap or unlabeled primary control is high/critical; a marginal
   contrast ratio is medium.

## Inputs
- The target markup/JSX, associated styles, and interaction handlers; the conformance target
  (default WCAG 2.2 Level AA); and whether automated tooling is available in the repo.

## Output
- Findings, each with: WCAG criterion, location (`path:line`), the issue, which users it blocks
  and how, and the minimal correct fix — ready to be severity-ranked.
- What was verified clean, and what you could *not* test (e.g. real screen-reader announcement),
  stated plainly rather than overclaiming conformance.

## Notes
- This is a read-and-report capability; it inspects and reports — applying fixes is the consuming
  agent's decision and tool scope.
- No vague "improve accessibility": every finding names a criterion and the affected assistive tech.
