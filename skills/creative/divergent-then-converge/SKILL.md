---
name: divergent-then-converge
description: Use when running open-ended idea generation (brainstorming, naming, copy angles) — a defer-judgment procedure to first diverge for quantity and variety, then cluster and converge to a shortlist with rationale.
category: creative
tags: [ideation, creativity, brainstorming, convergence]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Divergent Then Converge

A two-phase discipline for open-ended ideation: separate *generating* options from
*judging* them. Diverge first for quantity and genuine variety, then cluster and
converge to a small, reasoned shortlist — without prematurely collapsing onto the
first plausible answer.

## When to use this skill
Whenever an agent must produce a wide set of candidate ideas and then narrow them:
brainstorming sessions, naming candidates, copy/headline angles, concept exploration.
Do NOT use it for tasks that have one correct answer or that are structural rather than
generative (e.g. mapping a story arc, building an analogy).

## The core rule: separate the two phases
- **Divergence phase** — defer all judgment. No critiquing, ranking, or "that won't
  work" while generating. Quantity and spread are the goal; bad ideas are fuel.
- **Convergence phase** — only now apply criteria, cluster, and shortlist.
Never interleave them. Judging mid-generation kills variety and anchors on the obvious.

## Phase 1 — Diverge (quantity + variety)
1. Pin the prompt in one sentence (the problem, the offer, the thing being named).
2. Generate a large batch. Push past the obvious first cluster — the first 5 ideas are
   usually the average ideas. Aim for breadth across genuinely different *directions*,
   not minor variations of one direction.
3. Force variety with at least two divergence techniques, e.g.:
   - **SCAMPER** — Substitute, Combine, Adapt, Modify/magnify, Put to another use,
     Eliminate, Reverse/rearrange.
   - **Analogical** — borrow structure from an unrelated domain ("what would nature /
     a casino / a library do?").
   - **Assumption / constraint reversal** — list the implicit assumptions, then negate
     each ("what if the opposite were required?").
   - **Worst-idea** — deliberately generate terrible ideas, then invert them.
   - **Crazy-8s** — time-box to eight rapid variations to outrun the inner critic.
4. Track which technique produced each idea so the spread is visible.

## Phase 2 — Converge (cluster + shortlist)
5. **Cluster** the raw ideas into themes; collapse near-duplicates. Name each cluster.
6. State the **selection criteria** explicitly (fit to goal, originality, feasibility,
   risk, audience resonance) before scoring — criteria chosen after the fact rationalize.
7. **Shortlist** a handful of distinct, strong candidates spanning more than one cluster
   so the user keeps real optionality, not three flavors of the same idea.
8. For each shortlisted item give a one-line rationale and its main trade-off/risk.

## Inputs
- The prompt/goal, audience, and any hard constraints or must-avoids.

## Output
```
Prompt: <one-line restatement>
Raw ideas (deferred judgment): <broad list, tagged by technique, grouped into clusters>
Clusters: <named themes>
Selection criteria: <the bar applied>
Shortlist:
  - <idea> — why it's strong — main trade-off/risk
Expand-further options: <directions left unexplored, if the user wants more>
```

## Notes
- Hand the user an expanded, organized option space and a reasoned shortlist — do NOT
  silently pick the single "winner" for them unless they ask. The decision is theirs.
- If divergence is producing variations on one theme, switch techniques rather than
  generating more of the same.
