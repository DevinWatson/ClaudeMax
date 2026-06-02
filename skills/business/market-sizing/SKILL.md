---
name: market-sizing
description: Use to estimate market size — compute TAM/SAM/SOM using BOTH a top-down path (published total narrowed by cited filters) AND an independent bottom-up path (buyers × penetration% × price), cross-check the two for convergence, derive a justified obtainable share, and sanity-check against incumbent revenues. TRIGGER when sizing a market opportunity for a product/buyer/geography/timeframe. NOT full financial projections or unit economics (that is financial-modeling). Any agent estimating opportunity size (market sizer, go-to-market planner, investment-memo analyst) can load it.
allowed-tools: Read, Grep, Glob, Write
category: business
tags: [market-sizing, tam, sam, som, estimation]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Market Sizing

The substantive capability for estimating the size of a market with disciplined, sourced
reasoning: TAM/SAM/SOM produced by two independent methods and cross-checked, so the number is
defensible rather than a round figure pulled from the air.

## When to use this skill
When estimating how big an opportunity is (TAM/SAM/SOM) for a defined product, buyer, geography,
and timeframe. Composes [[assumption-hygiene]] so every figure is sourced or flagged `ASSUMED`.
Not for turning a captured share into revenue/cost projections, margins, or unit economics —
that is [[financial-modeling]]; the SOM produced here is an *input* to that model.

## Definitions (use consistently)
- **TAM** — total annual demand if you had 100% of every buyer.
- **SAM** — the slice your product + business model + geography can actually serve.
- **SOM** — the realistic share you can capture in the timeframe, given competition and reach.

## Instructions
1. **Top-down.** Start from a published total (industry/analyst figure) and narrow with explicit
   filters: `TAM × geography% × segment-fit% × addressable% = SAM`. Cite each source and date; if
   a figure is unsourced, label it `ASSUMED` per [[assumption-hygiene]].
2. **Bottom-up.** Build from units: `# of potential buyers × adoption/penetration% × annual
   price (ACV/ARPA) = market size`. Derive the buyer count from a countable base (firmographics,
   population, # of establishments), not a guess. Usually the more credible method.
3. **Cross-check the two.** Compare top-down and bottom-up. If within a reasonable range, state
   the converged estimate; if they diverge widely, explain why and trust the better-sourced method
   (state which and why). Convergence is the whole point.
4. **Derive SOM.** Apply a realistic obtainable share to SAM based on competition, reach, and
   timeframe — and justify the share %. Don't default to a vanity "1% of a huge market."
5. **Sanity-check.** Does buyer-count × price reconcile to known incumbent revenues? Is implied
   penetration plausible? Is the number suspiciously round? Note the biggest swing assumption and
   give a low/base/high range, not false precision.

## Inputs
- The market definition (product/service, buyer, geography, timeframe) and any provided research,
  pricing, or customer data. A market without those four is undefined — clarify before sizing.

## Output
Write a durable artifact when expected (e.g. `docs/market-sizing.md`); else inline:
```
Market definition: product · buyer · geography · timeframe
TAM / SAM / SOM (with range: low | base | high)
Top-down path: source → filters → result (each step cited or ASSUMED)
Bottom-up path: buyers × penetration% × price → result (sources)
Cross-check: top-down vs bottom-up — convergence or explained divergence; chosen estimate
SOM rationale: obtainable share% and why
Key assumptions (each sourced or flagged ASSUMED) · Biggest swing factor · Sanity checks
```
Both methods are shown; every figure is sourced or explicitly flagged as an assumption.

## Notes
- **Always do both top-down and bottom-up** and reconcile them — a single method is not defensible.
- Cite sources with dates; give ranges, not false precision. Beware round-number anchoring and
  the "1% of a billion" trap.
- Stop at SOM — projections, margins, and unit economics go to [[financial-modeling]].
