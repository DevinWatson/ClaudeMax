---
name: assumption-hygiene
description: Use for any estimate, model, plan, forecast, or research output — explicitly separate given facts from assumptions, label every estimate AS an estimate with its basis/source, mark unverified inputs as ASSUMED, give ranges instead of false-precision point values where uncertain, and list the assumptions that most move the result. Prevents presenting an assumption as a measured fact.
allowed-tools: Read
category: business
tags: [estimation, assumptions, modeling, forecasting, research, uncertainty]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Assumption Hygiene

A reusable discipline for any output built on inputs that are not all measured facts —
estimates, financial models, plans, forecasts, sizings, and research synthesis. It keeps the
line between *what is known* and *what was assumed* visible, so a confident-looking number is
never mistaken for a measured one.

## When to use
Whenever the result depends on inputs that are not all hard facts:
- Estimates and forecasts (market size, runway, effort, RICE scores, sample sizes).
- Driver-based models where outputs are only as good as the input assumptions.
- Plans and roadmaps whose sequencing rests on impact/effort guesses.
- Research synthesis that mixes observed evidence with inference.

If you cannot point to a source or a measurement for an input, this skill applies.

## Instructions
1. **Separate facts from assumptions.** Before computing, sort every input into *given facts*
   (provided, sourced, or measured) and *assumptions* (inferred, defaulted, or invented to
   proceed). Keep them visibly distinct — never silently blend them.
2. **Label every estimate as an estimate, with its basis.** Each non-fact input carries: the
   value, a source (citation + date) or the tag `ASSUMED`, and a one-line rationale. A bare
   number with no provenance is a defect.
3. **Mark unverified inputs `ASSUMED`.** Any value you invented or defaulted to in order to
   proceed is flagged `ASSUMED` and surfaced for the user to confirm — do not let it sink into
   a formula and disappear.
4. **Give ranges, not false precision.** Where an input or output is uncertain, state a
   low / base / high range rather than a single over-precise figure. Don't report
   "$4,237,910" when the honest answer is "roughly $3–5M." Beware round-number anchoring too.
5. **Surface the load-bearing assumptions.** Identify the 2–3 assumptions the result is most
   sensitive to — the ones where a plausible change flips the conclusion — and state which way
   each cuts and what would change the answer. This is more valuable than the point estimate.
6. **Never present an assumption as a measured fact.** Don't say "users churn at 4%" when you
   assumed it; say "ASSUMED 4% monthly churn (no data provided)." Garbage assumptions produce
   confident-looking garbage; honesty about the inputs is the whole point.

## Inputs
- The facts, data, and sources the user provided, plus whatever the agent must assume to
  produce a model, estimate, plan, or synthesis.

## Output
Include an **Assumptions & sources** block alongside the result, using this convention:

```
Assumptions & sources
  - <input>: <value or range> | <source + date OR ASSUMED> | <one-line rationale>
  - <input>: <value or range> | <source + date OR ASSUMED> | <one-line rationale>

Given facts (provided/measured): <bulleted, distinct from the above>
Most load-bearing assumptions: <the 2–3 that most move the result; which way each cuts>
What would change the conclusion: <the threshold/condition that flips it>
```

Every output figure must be reproducible from this block: a reader can trace each number to a
fact or a labeled assumption.

## Notes
- This skill governs *how inputs are disclosed*, not the substantive method — pair it with the
  agent's own procedure (RICE scoring, TAM/SAM/SOM, P&L modeling, affinity mapping, etc.).
- For tiny qualitative samples, prefer "n of N" over percentages; for surveys, report the
  margin of error. Honest uncertainty beats invented precision.
- When asked for "the number," still give the range and name the swing assumption — a single
  point value stated without its basis is exactly the failure this skill prevents.
