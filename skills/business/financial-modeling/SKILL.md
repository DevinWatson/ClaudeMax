---
name: financial-modeling
description: Use to build or review a driver-based financial model — separate assumptions from calculations, project revenue/costs/margins, compute unit economics (CAC, LTV, LTV:CAC, CAC payback, NRR), model cash burn and runway, run Base/Downside/Upside scenarios with a sensitivity table, and sanity-check the result. TRIGGER for a 3-year projection, runway/burn analysis, unit-economics review, or fundraise model. NOT market sizing (that is market-sizing). Any agent producing or auditing business financials (financial modeler, fundraise-prep agent, FP&A reviewer) can load it.
allowed-tools: Read, Grep, Glob, Write
category: business
tags: [finance, modeling, projections, unit-economics, runway]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Financial Modeling

The substantive capability for building and reviewing transparent, auditable, driver-based
financial models — projections, unit economics, scenarios, and cash runway — where every number
traces to a stated, sourced assumption.

## When to use this skill
When the task is to model a business *given a market*: 3-year projections, P&L, unit economics,
scenarios, or cash runway/burn. Composes [[assumption-hygiene]] so inputs are never confused
with facts. Not for estimating market size (TAM/SAM/SOM) — that is [[market-sizing]]; consume
its SOM as an input assumption here, don't re-derive it.

## Instructions
1. **Separate assumptions from calculations.** Maintain a single assumptions block: every input
   (price, growth %, churn, CAC, headcount, COGS %) listed once with a source or `ASSUMED` per
   [[assumption-hygiene]]. Calculations reference assumptions — never bury a magic number in a
   formula.
2. **Build the projection.** Driver-based, not straight-line guesses:
   - Revenue = volume × price (or accounts × ARPA), grown by a stated rate, net of churn.
   - Costs split into COGS (variable, scales with revenue) and OpEx (largely fixed/stepped).
   - Roll up to gross margin, contribution margin, EBITDA, and net.
3. **Compute unit economics** and show the formulas:
   - **CAC** = sales+marketing spend / new customers acquired (same period).
   - **LTV** = (ARPA × gross-margin%) / churn rate (or Σ discounted contribution over lifetime).
   - **LTV:CAC** (rule of thumb ≥ 3:1) and **CAC payback** = CAC / (monthly ARPA × GM%), in months.
     Also gross margin %, churn, NRR. State which definition you used.
4. **Cash, burn, runway.** Net burn = cash out − cash in per month; **runway = cash balance /
   avg net burn**. Show the cash trajectory and the month it hits zero.
5. **Scenarios & sensitivity.** Provide Base / Downside / Upside by flexing the 2–3
   highest-leverage drivers (growth, churn, CAC). Add a sensitivity table showing how a key
   output (runway, EBITDA, LTV:CAC) moves as one driver varies. Name the most sensitive assumption.
6. **Sanity-check.** Margins within industry norms? Growth humanly possible (sales capacity,
   hiring)? Do statements tie (cash reconciles to P&L)? Flag anything failing a smell test.

## Inputs
- The goal (projection / runway / unit-economics / fundraise), business model (subscription,
  transactional, marketplace, services), period grain (monthly vs annual), and any existing
  model/data files. A captured-market SOM, if available, as an input assumption.

## Output
Write a durable artifact when expected (e.g. `docs/financial-model.md` or a `.csv`); else inline:
```
Goal & business model · Period grain · Currency
Assumptions (each: value | source or ASSUMED | rationale)
Projection (period rows): revenue | COGS | gross margin% | OpEx | EBITDA | net | cash | runway
Unit economics: CAC | LTV | LTV:CAC | CAC payback (months) | gross margin% | churn | NRR  (+ formulas)
Scenarios: Base | Downside | Upside — drivers flexed and resulting key outputs
Sensitivity: <output> vs <driver> table; most-sensitive assumption
Sanity checks & risks · What would change the conclusion
```
Every output number is reproducible from the assumptions block.

## Notes
- **No unstated assumptions** — label invented numbers `ASSUMED` and flag them for confirmation.
- Show formulas and intermediate steps; never present a single bottom-line number as fact.
- This is a planning model, not audited financials or investment advice — say so.
