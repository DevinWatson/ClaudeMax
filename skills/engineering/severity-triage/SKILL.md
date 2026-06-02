---
name: severity-triage
description: Use when ranking or filtering code-review findings, bugs, or audit results — applies a consistent severity rubric (critical/high/medium/low) and confidence rating so the most important, most certain issues surface first and noise is suppressed.
category: engineering
tags: [review, triage, severity, prioritization]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Severity Triage

A consistent rubric for rating findings so reviews are comparable across agents and
runs, and so low-value noise does not drown out real problems.

## When to use
Whenever you have a list of candidate issues (review findings, bugs, audit results)
and must order or filter them.

## Severity rubric
- **critical** — data loss, security breach, money/safety impact, or production outage
  if shipped. Must block.
- **high** — incorrect behavior in a common path, broken contract, or a regression with
  no easy workaround. Should block.
- **medium** — incorrect behavior in an edge case, missing validation, or
  maintainability problem likely to bite later.
- **low** — style, naming, minor inefficiency, or nit with no behavioral impact.

## Confidence rubric
- **certain** — you can point to the exact line and explain the failure deterministically.
- **likely** — strong reasoning but you have not executed/confirmed it.
- **speculative** — a hunch worth mentioning; could be wrong.

## Instructions
1. For each finding, assign one severity and one confidence.
2. Drop or collapse anything that is `low` + `speculative` unless explicitly asked to be
   exhaustive — it is usually noise.
3. Sort by severity first, then confidence.
4. For `critical`/`high`, require a concrete reproduction or a precise line reference.
   If you cannot provide one, downgrade confidence.

## Output
```
- severity: <critical|high|medium|low>
  confidence: <certain|likely|speculative>
  location: <path:line>
  finding: <what is wrong>
  impact: <what happens if unaddressed>
  fix: <the minimal suggested change>
```

## Notes
- Prefer false negatives over a flood of false positives: a review that cries wolf gets
  ignored. State uncertainty honestly rather than inflating severity.
