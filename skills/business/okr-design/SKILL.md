---
name: okr-design
description: Use to design Objectives and Key Results — write 1–3 qualitative, ambitious objectives plus 3–5 measurable, outcome-based KRs each (baseline → target → metric/source), balance leading vs lagging indicators, add counter-metrics to prevent gaming, link initiatives as inputs, and define 0.0–1.0 grading. TRIGGER when setting quarterly/annual goals at company/team/individual level. Sets goals/outcomes, NOT the feature schedule. Any agent that translates strategy into measurable goals (OKR planner, performance-review prep, team-planning facilitator) can load it.
allowed-tools: Read, Grep, Glob, Write
category: business
tags: [okr, goals, outcomes, planning, grading]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# OKR Design

The substantive capability for turning strategy into a small set of Objectives and Key Results:
an inspiring qualitative direction plus measurable, outcome-based results that prove progress.
It sets the *destination and how it's measured* — not the build schedule.

## When to use this skill
When defining goals and the outcomes that measure them (objectives + KRs + grading) for a cycle
at company/team/individual level. Composes [[assumption-hygiene]] because KRs' targets and
baselines are estimates that must be labeled. Not for deciding which features ship and in what
order (RICE/WSJF, sequencing, capacity) — that is a roadmap concern; produce targets here and
route the schedule to a roadmap planner.

## Instructions
1. **Write the Objective(s).** Qualitative, ambitious, time-bound, memorable — *what* you want
   and *why it matters*. Not a metric, not a task. Keep to 1–3 per level so focus is real.
2. **Write 3–5 Key Results per objective.** Each KR must be:
   - **Outcome-based**, not an activity — measures a change in the world (retention, revenue,
     NPS, cycle time), not work done ("launch X", "hold 5 meetings" are tasks, not KRs).
   - **Measurable** with baseline → target → metric and source ("Trial→paid from 12% → 20%,
     measured in billing"). Per [[assumption-hygiene]], label any estimated baseline/target.
   - **Ambitious yet credible** (~0.7 stretch is success for aspirational OKRs).
   Apply the test: *if all KRs hit, is the objective unarguably achieved?* If not, fix the KRs.
3. **Balance leading vs lagging.** Pair lagging results (revenue, retention — confirm late) with
   at least one leading indicator (activation, pipeline — movable in-cycle) so the team can steer.
4. **Add a counter-metric / health guardrail** where a KR could be gamed (grow signups WITHOUT
   raising churn or lowering quality).
5. **Link initiatives.** List bets/initiatives expected to move each KR, but mark them as
   *inputs* and hand sequencing/prioritization to a roadmap planner. Don't turn KRs into a task list.
6. **Define grading.** Score each KR **0.0–1.0** = actual / target (0.0 none, 0.3 short, 0.7
   strong/expected for stretch, 1.0 full). Objective grade = avg of its KRs. State the check-in
   cadence and that grading is for learning, not punishment.

## Inputs
- The level (company/team/individual), the cycle (quarter/year), the strategy or top-line goal
  the OKRs must serve, and any existing OKRs/strategy docs/metrics. If strategic intent is
  unclear, ask before drafting — OKRs that ladder up to nothing are worthless.

## Output
Write a durable artifact when expected (e.g. `docs/okrs.md`); else inline:
```
Level · Cycle · Strategy this serves
Objective 1: <qualitative, why it matters>
  KR1: <metric> baseline <x> → target <y> | source <…> | leading|lagging | grade target
  KR2: …
  Counter-metric: <what must NOT degrade>
  Initiatives (inputs → roadmap): <…>
[Objective 2 …]
Grading: 0.0–1.0 per KR (actual/target); objective = avg KRs; check-in cadence: <…>
Notes: assumptions, dependencies, what's explicitly out of scope
```
Every KR is measurable and outcome-based, with a baseline, target, and source.

## Notes
- **KRs measure outcomes, not tasks.** Convert any deliverable KR to the outcome it produces, or
  move it to the initiatives list.
- Keep the set small (≤3 objectives, ≤5 KRs each). Too many OKRs = no priorities.
- Don't invent baselines/targets; if a baseline is unknown, flag "establish baseline" as a KR or
  labeled assumption rather than fabricating a number.
