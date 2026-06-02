---
name: roadmap-prioritization
description: Use to prioritize and sequence work ACROSS features into a defensible roadmap — pick a framework deliberately (RICE / WSJF / MoSCoW / Kano) and state the scale, score every item consistently showing the math, group items into themes/objectives, map hard dependencies and the critical path, fit the sequence to capacity, and present a now/next/later view with tradeoffs. TRIGGER on "prioritize the backlog / build a roadmap / sequence these initiatives." Not writing a single feature's detailed spec (that is prd-authoring). Any agent that prioritizes across initiatives (a roadmap planner, a backlog groomer, a portfolio reviewer) can load it.
allowed-tools: Read, Grep, Glob, Write
category: product
tags: [roadmap, prioritization, rice, wsjf, sequencing]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Roadmap Prioritization

The substantive capability for turning a set of initiatives into a defensible, communicable
roadmap: decide *what to do in what order and why* across many features — not the detailed spec
for any single one.

## When to use this skill
When prioritizing and sequencing across features: framework scoring, themes, dependencies,
capacity, and a now/next/later view. Pairs with an evidence-discipline skill (e.g.
[[assumption-hygiene]]) to keep known inputs separate from assumed reach/impact/effort. The deep
spec for one feature (requirements, user stories, acceptance criteria) is prd-authoring's job.

## Instructions
1. **Gather inputs and pick a framework deliberately.** Collect each item's value/impact, effort
   estimate, confidence, strategic fit, and dependencies (`Grep`/`Glob` for `roadmap`, `backlog`,
   `okr`, `prd`). Choose the framework that fits the inputs and say why; if a key input (effort,
   capacity, objectives) is missing, ask or state the assumption before scoring.
   - **RICE** — `score = (Reach × Impact × Confidence) / Effort`. Reach = #users/period; Impact on a
     fixed scale (3 massive, 2 high, 1 medium, 0.5 low, 0.25 minimal); Confidence as % (100/80/50);
     Effort in person-months. Best with rough quantitative inputs; show every factor.
   - **WSJF** (SAFe) — `WSJF = Cost of Delay / Job Size`, CoD = user/business value + time
     criticality + risk-reduction/opportunity-enablement. Best for sequencing time-sensitive work.
   - **MoSCoW** — Must / Should / Could / Won't (this cycle). Best for scoping a fixed release; force
     a real "Won't" list so "Must" stays meaningful.
   - **Kano** — Basic / Performance / Delighter (+ Indifferent/Reverse) to balance table-stakes vs.
     differentiators. Best when deciding the *mix*.
   Use one primary framework; a second only as a sanity check. State the scale used.
2. **Score consistently.** Apply the same definitions to every item and show the math/inputs so the
   ranking is auditable, not a black box. Sensitivity-check the items near the cut line.
3. **Group into themes / objectives.** Tie clusters to strategic objectives or OKRs so the roadmap
   tells a story, not a sorted list. Flag items that ladder up to nothing.
4. **Map dependencies & sequence.** Build the ordering from priority + hard dependencies (X must
   precede Y) + risk (de-risk early). Identify the critical path; a high-priority item gated by a
   dependency cannot jump the queue.
5. **Fit to capacity.** Lay the sequence against available capacity per period (team-weeks/sprints).
   Don't over-commit; leave buffer. State what falls below the line and why.
6. **Communicate.** Present a now / next / later (or time-boxed) view with the rationale, the biggest
   tradeoffs made, and what would change the plan.

## Inputs
- The candidate items with value/impact, effort, confidence, fit, and dependencies; the objectives/
  OKRs; and available capacity per period.

## Output
- The objective(s)/themes the roadmap serves and the framework + scale definition.
- A prioritized table showing every scoring input (e.g. RICE: item | reach | impact | confidence |
  effort | score | theme | depends-on).
- A Now/Next/Later sequence (each item: why here, dependencies, capacity cost); a capacity-fit note
  (committed vs. available, what's below the line); key tradeoffs/risks; and what would change the plan.
- Written to a file (e.g. `docs/roadmap.md`) when a durable artifact is expected; otherwise inline.

## Notes
- Prioritize across features; do not write a single feature's PRD (route to prd-authoring).
- Make scoring transparent and consistent — show inputs and the formula, no opaque rankings.
- Do not invent reach/impact/effort numbers; mark estimates as assumptions with their confidence.
  Respect hard dependencies and capacity over raw score, and force an explicit "Won't"/"Later".
