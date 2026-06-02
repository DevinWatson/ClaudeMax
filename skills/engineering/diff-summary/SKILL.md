---
name: diff-summary
description: Use when you need a structured understanding of a code change before reviewing or describing it — produces a per-file summary of what changed, why it likely changed, and which areas carry the most risk, from a git diff or a set of edited files.
category: engineering
tags: [git, diff, review, summarization]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Diff Summary

Turn a raw code change into a compact, structured map so downstream work (review,
PR description, changelog) starts from a shared understanding instead of raw hunks.

## When to use
Before reviewing a diff, writing a PR description, or triaging risk in a change set.

## Inputs
- A git ref range (e.g. `origin/main...HEAD`) or an explicit list of changed files.

## Instructions
1. Obtain the diff. Prefer `git diff --stat <range>` for the shape, then
   `git diff <range> -- <file>` per file for detail.
2. For each changed file, capture:
   - **path** and change type (added / modified / deleted / renamed).
   - **what changed** — 1–2 lines, behavioral not line-by-line.
   - **why** — the apparent intent (feature, fix, refactor, test, config).
   - **risk** — `low` | `medium` | `high`, with a one-clause reason.
3. Identify cross-cutting themes (e.g. "auth touched in 4 files", "new dependency added").
4. Flag anything that warrants extra scrutiny: public API changes, migrations,
   security-sensitive code, concurrency, deletions of tests.

## Output
A structured summary:

```
Overview: <1–2 sentence gist of the whole change>
Themes: <bullet list of cross-cutting observations>
Files:
  - path: <file>
    type: <added|modified|deleted|renamed>
    what: <behavioral summary>
    why:  <apparent intent>
    risk: <low|medium|high> — <reason>
Hotspots: <files/areas needing the closest review>
```

## Notes
- Summaries are behavioral, not a restatement of the diff. If you cannot tell why a
  change was made, say so — that uncertainty is itself a review signal.
- Pair with [[severity-triage]] when the consumer is a reviewer ranking findings.
