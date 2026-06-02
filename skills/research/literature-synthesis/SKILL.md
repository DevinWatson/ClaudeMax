---
name: literature-synthesis
description: Use to synthesize what is known about a topic from multiple sources — gather broadly from independent angles, evaluate each source's credibility, group claims by theme, reconcile agreements and conflicts, and produce a structured cited summary that separates well-supported findings from contested or thin ones with explicit confidence levels. TRIGGER when answering "what does the evidence say about X" across many sources. Any agent producing a cited, confidence-graded synthesis (literature reviewer, competitive analyst, due-diligence researcher) can load it.
allowed-tools: Read, Grep, Glob, WebSearch, WebFetch
category: research
tags: [research, synthesis, sourcing, review, confidence]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Literature Synthesis

The substantive capability for turning scattered sources into a trustworthy, cited synthesis
that is honest about the strength of the evidence. Composes [[source-evaluation]] to weigh each
source's credibility and carry that weight into each finding's confidence.

## When to use this skill
When synthesizing what is known about a topic from multiple sources — gathering, weighing
credibility, reconciling conflicting claims, and producing a structured cited summary that
distinguishes well-supported findings from contested or thin ones. Not for analyzing a single
source in isolation or for tasks with no sourcing/credibility dimension.

## Instructions
1. **Pin the question and scope** (timeframe, domain, geography) before searching. If
   underspecified, ask 1–2 clarifying questions first.
2. **Gather broadly.** Collect sources from multiple independent angles; don't anchor on the
   first result. Prefer primary sources.
3. **Evaluate each source** with the [[source-evaluation]] rubric (authority, evidence, recency,
   bias) and assign a confidence level.
4. **Reconcile.** Group claims by theme. Where sources agree, note the corroboration; where they
   conflict, present both and explain the likely reason for the disagreement.
5. **Synthesize**, distinguishing well-supported conclusions from tentative or contested ones.
   Carry source confidence into the finding's confidence — do not flatten uncertainty into false
   confidence.

## Inputs
- The research question and its scope; access to sources (files, web). Any constraints on
  acceptable source types.

## Output
```
Question: <restated scope>
Key findings:
  - <claim> — confidence: <high|medium|low> [sources]
Contested / open questions:
  - <claim> — why sources disagree [sources]
Sources: <numbered list with type and date>
Gaps: <what could not be answered and why>
```
Every non-obvious claim carries a citation and a confidence level.

## Notes
- Cite, don't fabricate. If you cannot find support, say "no reliable source found."
- Separate "a source claims X" from "X is established."
- Note recency for fast-moving topics; flag when the best source is stale.
