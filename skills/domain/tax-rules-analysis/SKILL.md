---
name: tax-rules-analysis
description: Use when someone wants to UNDERSTAND, at an informational level, how a tax rule/treatment applies to a scenario — framing the facts and question, naming the governing rule(s) and the factors that drive the outcome (marginal vs effective rate, residency/domicile/nexus, income character, deduction vs credit, timing/realization/basis, entity treatment), listing what changes the answer, and specifying the facts/documents to gather before talking to a professional. NOT tax/legal advice, NOT a return preparer; jurisdiction- and date-sensitive. TRIGGER on conceptual "how is this taxed / treated" questions. Any informational tax-explainer agent can load it.
allowed-tools: Read, Grep, Glob
category: domain
tags: [tax, rules, informational, finance]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Tax Rules Analysis

The substantive capability for explaining — informationally — how a tax rule tends to
apply to a described scenario: the concepts, the factors that drive the outcome, and the
facts to gather, so a non-professional can have a productive conversation with a qualified
advisor.

## NOT tax or legal advice (read first, and say it in every output)
- This is **general informational explanation only**. You are **not a CPA, EA, tax
  attorney, or advisor**, this is **not tax or legal advice**, and nothing here creates a
  professional relationship or may be relied upon to take a tax position or file a return.
- **Tax law is jurisdiction-specific and changes constantly** (annual brackets, thresholds,
  sunsetting provisions, new legislation, court/IRS guidance). Always state the assumed
  jurisdiction and tax year, and warn that rules may have changed since the knowledge cutoff.
- For anything affecting an actual filing, liability, or decision, **recommend a qualified
  tax professional** licensed in the relevant jurisdiction. Never present output as a
  definitive answer ("you owe X", "this is deductible") — frame it as "generally, this is
  treated as… subject to confirmation."

## When to use this skill
When the user wants to understand the concepts and factors behind how a tax rule applies —
not to prepare a return or get a definitive liability. Confirm the **jurisdiction**, the
**tax year**, the **taxpayer type** (individual, sole prop, partnership, S/C-corp, trust,
nonprofit), and the **scenario**; if any are unstated, ask or state the assumption.

## Instructions
1. **Frame the scenario.** Restate the facts given and the tax question (income
   characterization, deductibility, residency/nexus, basis, timing, etc.).
2. **Identify the governing rule(s) at a conceptual level.** Name the relevant doctrine and
   the factors that drive the outcome, using the right mental models:
   - **Marginal vs effective rate** — additional income is taxed at the marginal bracket;
     the effective rate is total tax ÷ total income. Do not conflate them.
   - **Residency / domicile / nexus** — individuals (resident vs nonresident, days-present
     tests, domicile) and businesses (where activity creates a filing/withholding obligation).
   - **Income character** — ordinary vs capital, short- vs long-term, earned vs passive —
     and how each is treated.
   - **Deduction vs credit** — a deduction reduces taxable income; a credit reduces tax
     dollar-for-dollar (and may be refundable/nonrefundable).
   - **Timing / realization / basis** — when income/gain is recognized and how basis is
     computed.
   - **Entity treatment** — pass-through vs entity-level tax, and how distributions are
     treated.
3. **List the factors that change the answer.** Be explicit that the outcome turns on
   specifics (thresholds, holding periods, elections, residency days) and which way each cuts.
4. **Specify the facts/documents to gather.** A concrete checklist (income statements, basis
   records, residency days, prior returns, entity docs, relevant forms) so the user is
   prepared.
5. **Point to authority categories, carefully.** Name the *type* of authority that governs
   (statute, regulation, IRS publication/form, treaty) so the user knows what to look up or
   ask about — but do not assert specific section numbers/amounts as current without flagging
   date sensitivity.

## Inputs
- The scenario, plus jurisdiction, tax year, and taxpayer type (or explicit assumptions).

## Output
```
⚠ General information only — NOT tax/legal advice. Tax law varies by jurisdiction and
  changes; verify with a qualified tax professional. Assumed jurisdiction: <…> ·
  Tax year: <…> · Taxpayer: <…>

Scenario (as understood): <restatement>
Generally how this is treated: <concept-level explanation: marginal/effective, character, …>
Factors that change the answer: <bulleted, with which way each cuts>
Facts / documents to gather: <checklist>
What to ask a professional: <specific questions>
Why a professional is needed here: <the judgment calls / date-and-jurisdiction risk>
```

## Notes
- **Read-only and informational.** Do not prepare returns, compute a final liability as
  authoritative, fill out forms, or tell the user what position to take.
- Never state a figure (rate, threshold, limit) as current without flagging it is year- and
  jurisdiction-specific and may have changed.
- When the answer genuinely depends on facts not given or on unsettled law, say so and route
  to a professional rather than guessing. Combine with [[assumption-hygiene]] to label
  ASSUMED inputs and [[not-professional-advice]] for the disclaimer framing.
