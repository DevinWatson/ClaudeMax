---
name: ux-heuristic-review
description: Use for a heuristic usability review of a flow, screen, or design — walk the user's task end to end, evaluate against Nielsen's 10 heuristics (citing the heuristic per finding), assess information hierarchy and cognitive load, scrutinize error/empty/loading states, and review microcopy, producing review-only findings ready to be severity-ranked. TRIGGER on "usability/UX/heuristic review." Assesses usability quality, NOT accessibility/WCAG conformance — defer that to a WCAG auditor. Any agent that judges usability (a UX reviewer, a design critique bot, a product reviewer) can load it.
allowed-tools: Read, Grep, Glob
category: product
tags: [ux, usability, heuristic-review, nielsen, microcopy]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# UX Heuristic Review

The substantive usability-evaluation capability: judge whether an experience is *usable* — easy
to understand, low-friction, forgiving of mistakes — by inspecting a flow, screen, or design and
reporting heuristic-cited findings. Inspect and report; do not redesign or edit.

## When to use this skill
When evaluating the usability of a flow, screen, prototype, or markup/copy. Pairs with a ranking
skill (e.g. [[severity-triage]]) to order findings by impact on the user's task. Assesses
**usability quality**, not **accessibility conformance** — color contrast, ARIA, keyboard
operability, screen-reader behavior, and WCAG success criteria belong to a WCAG auditor; defer
those there rather than half-covering them.

## Instructions
1. **Establish the task.** Identify the user's goal and context for the flow — a review without a
   task in mind is just opinion. If the primary task is unclear, state your assumed task explicitly.
   Read the artifact and any associated copy/state handling before judging.
2. **Walk the task end to end** as the user would, step by step, noting where you would hesitate,
   backtrack, or be unsure what happens next.
3. **Evaluate against Nielsen's 10 heuristics**, citing the heuristic for each finding: 1) Visibility
   of system status, 2) Match between system and the real world, 3) User control and freedom
   (undo/exit), 4) Consistency and standards, 5) Error prevention, 6) Recognition rather than recall,
   7) Flexibility and efficiency, 8) Aesthetic and minimalist design, 9) Help users
   recognize/diagnose/recover from errors, 10) Help and documentation.
4. **Assess information hierarchy & cognitive load.** Is the primary action obvious? Are choices
   chunked (Hick's law) and labels scannable? Flag competing CTAs, dense screens, and unnecessary
   required input (lean on recognition over recall).
5. **Scrutinize error & empty/loading states.** Are errors prevented where possible, stated in plain
   language, blamed on the system not the user, and paired with a recovery path? Are
   empty/loading/success states designed, not just the happy path?
6. **Review microcopy.** Labels, button verbs, helper text, and error messages should be specific,
   consistent, action-oriented, and jargon-free. Flag vague ("Submit", "Error occurred") or
   inconsistent terminology.
7. **Rank for the consumer.** Hand each finding to a ranking skill ([[severity-triage]]) framed by
   impact on task success/frustration/frequency — a dead-end with no recovery is high; an
   inconsistent label is low/medium. Suppress low+speculative nitpicks unless asked to be exhaustive.

## Inputs
- The target flow/screen/design (or markup/JSX/copy), the user's goal and context, and any
  associated state handling.

## Output
- A summary (what flow/screen, assumed user task, overall usability posture).
- Findings, each with: the cited heuristic (or usability principle), location, the issue, its
  impact on task success/friction, and a recommendation (what to change, not pixel-level how) —
  ready to be severity-ranked.
- A brief "what works" list, any a11y/WCAG concerns deferred to a WCAG auditor, and a verdict
  (solid / minor-friction / significant-friction / blocking-issues).

## Notes
- Review-only: this capability inspects and reports — editing, redesigning, or writing production
  copy is the consuming agent's decision and tool scope.
- Cite the heuristic or principle for every finding — no vague "feels off."
- Stay in lane: route accessibility conformance to a WCAG auditor; prefer false negatives to a
  flood of nitpicks, tying every high finding to a concrete failure in the user's task.
