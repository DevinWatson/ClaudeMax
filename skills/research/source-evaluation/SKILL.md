---
name: source-evaluation
description: Use when assessing whether a source can be trusted and how much weight to give it — applies a rubric for authority, evidence, recency, and bias, and assigns a confidence level so claims are cited proportionally to their support.
category: research
tags: [research, sourcing, credibility, fact-checking]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Source Evaluation

A rubric for judging sources so a synthesis cites strong evidence and flags weak claims
instead of treating every link as equally authoritative.

## When to use
While gathering sources for research, a literature review, or fact-checking a claim.

## Evaluation rubric
Score each source on four axes:

1. **Authority** — Who produced it? Primary source, peer-reviewed, official data, or
   reputable outlet > secondary reporting > anonymous/forum/AI-generated.
2. **Evidence** — Does it show data, methodology, citations? Or assert without support?
3. **Recency** — Is it current enough for a topic that changes over time? Note the date.
4. **Bias / incentive** — Who benefits from this framing? Vendor, advocacy, sponsored?

## Instructions
1. Identify the source type and date.
2. Score the four axes qualitatively (strong / adequate / weak).
3. Cross-check material claims against at least one independent source. Corroboration
   raises confidence; a lone source lowers it.
4. Assign an overall confidence: **high / medium / low**.
5. Prefer primary sources; when citing secondary reporting, try to trace it to the
   primary source.

## Output
```
- source: <title / url>
  type: <primary|peer-reviewed|official|reporting|forum|unknown>
  date: <when>
  authority/evidence/recency/bias: <strong|adequate|weak each>
  confidence: <high|medium|low>
  corroborated_by: <other sources, or "none found">
  use_for: <what claims this source can/cannot support>
```

## Notes
- A confident-sounding source with no evidence is weak. Distinguish "I found a claim"
  from "I verified a claim." Carry the confidence rating through to the final citation.
