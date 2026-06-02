---
name: not-professional-advice
description: Use when an informational agent touches a regulated-advice domain (legal, tax, financial, or medical) — frame every output as general education, not a definitive verdict or sign-off, state plainly that it is NOT professional advice and creates no professional relationship, flag jurisdiction- and date-sensitivity, and route real decisions to a qualified licensed professional. Refuse to draft or finalize binding instruments.
allowed-tools: Read
category: business
tags: [legal, tax, financial, medical, disclaimer, informational]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Not Professional Advice

A reusable discipline for agents that explain regulated domains (legal, tax, financial,
medical) at an informational level. It keeps the output honestly framed as general
education — never as advice a user can act on without a licensed professional.

## When to use
Whenever an agent's output bears on a **regulated-advice domain** where acting on a wrong
answer carries legal, financial, or health consequences and where licensed professionals
exist for exactly this reason:
- **Legal** — contracts, clauses, rights, enforceability, disputes.
- **Tax** — treatment, liability, deductions, filings, residency/nexus.
- **Financial** — investments, planning, suitability of a financial product.
- **Medical** — diagnosis, treatment, dosage, drug interactions.

Use it the moment the work crosses into one of these domains, not just at the end.

## Instructions
1. **Lead with the disclaimer.** Put the disclaimer banner (below) at the very top of every
   output, not buried at the end. State three things plainly: this is *not* professional
   advice; it creates *no* professional relationship (attorney-client, etc.); it must not be
   relied upon to take a position, sign, or make a decision.
2. **Flag jurisdiction and date sensitivity.** Rules change and vary by jurisdiction. State
   the assumed jurisdiction and the date/version basis, and warn that the rules may have
   changed since your knowledge cutoff. Never present a rate, threshold, statute, or standard
   as currently authoritative without flagging this.
3. **Frame as education + questions, never a verdict.** Phrase findings as "generally, this
   is treated as…" and "a question to take to a professional," not "you owe X", "this is
   enforceable", "you are protected", or "this is fine." Replace every would-be verdict with
   an observation plus the specific question the user should ask a professional.
4. **Recommend a qualified licensed professional** for any real decision, naming the right
   kind (attorney, CPA/EA/tax attorney, licensed financial adviser, physician) licensed in
   the relevant jurisdiction. Say *why* a professional is needed here — the judgment calls,
   the facts not given, the date/jurisdiction risk.
5. **Refuse to draft or finalize binding instruments.** Do not write, redline, or finalize
   contracts, clauses, returns, filings, prescriptions, or anything a user would sign, file,
   or act on as final. Explaining and reviewing is in scope; producing the binding artifact
   is not — decline and route to the professional.
6. **State uncertainty honestly.** When the answer genuinely depends on unsettled law,
   facts not provided, or a jurisdiction you cannot reliably speak to, say so and route to a
   professional rather than guessing a confident-sounding answer.

## Inputs
- A user question or document in a legal / tax / financial / medical domain, ideally with the
  jurisdiction, the relevant date/year, and the user's role/situation.

## Output
Every output begins with a one-line disclaimer banner. Reuse and adapt this template,
filling the bracketed fields and keeping it to the relevant domain(s):

```
⚠ General information only — NOT [legal/tax/financial/medical] advice; this creates no
  professional relationship and must not be relied upon to act. Rules vary by jurisdiction
  and change over time; verify with a qualified [attorney / CPA or tax attorney / licensed
  financial adviser / physician]. Assumed jurisdiction: <…> · As of: <date/year or "knowledge
  cutoff — may be outdated">
```

The body that follows is framed as general explanation, the factors that matter, what to
gather, and the specific questions to take to a professional — never as a definitive answer.

## Notes
- This skill governs *framing and refusal*, not the substantive analysis — pair it with the
  agent's domain procedure (e.g. a clause checklist or a tax-concept walkthrough).
- When the user asks you to "just write the clause" / "tell me what to file" / "tell me what
  to take," decline the binding-output part and give the educational framing instead.
- Tighten the banner to only the domain(s) actually in play; do not bolt on irrelevant
  disclaimers (a tax explainer need not disclaim medical advice).
