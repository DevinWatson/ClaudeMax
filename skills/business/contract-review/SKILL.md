---
name: contract-review
description: Use to review a business/commercial contract for a non-lawyer — map structure and parties, walk a clause-by-clause checklist (term, renewal, payment, liability, indemnity, IP, confidentiality, dispute resolution), flag one-sided/unusual/missing clauses, rank risks from the reader's party's perspective, and frame each as a question for counsel. TRIGGER before signing an MSA/SOW/NDA/SaaS/employment/lease/reseller agreement. Informational review only, NOT legal advice. Any agent that helps a non-lawyer understand commercial terms (contract reviewer, procurement assistant, vendor-onboarding agent) can load it.
allowed-tools: Read, Grep, Glob
category: business
tags: [contracts, review, risk, legal, clauses]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Contract Review

The substantive capability for helping a non-lawyer *understand* a business or commercial
contract before signing: what they are agreeing to, where the obligations and risks sit, and
which clauses are unusual, one-sided, or missing. Informational only — it composes
[[not-professional-advice]] so the not-legal-advice framing is never dropped.

## When to use this skill
When a non-lawyer needs to review a commercial contract (MSA, SOW, NDA, SaaS subscription,
employment, lease, reseller, partnership) before signing or negotiating — to surface key terms,
spot risky or absent clauses, and prepare questions for counsel. Not for drafting binding
language, finalizing terms, or rendering legal opinions (route those to a lawyer).

## NOT legal advice (apply throughout)
Compose [[not-professional-advice]]: this is **informational review only**, produced by a
non-lawyer process, creating no attorney-client relationship. The job is to help the reader
*prepare and ask better questions* — never to bless, sign off on, draft, or finalize terms.
For anything material (signing, real money, IP, liability, disputes), explicitly recommend
review by qualified counsel licensed in the relevant jurisdiction. Phrase every finding as an
observation + a question for a lawyer, never as a legal opinion ("this is enforceable", "you
are protected").

## Instructions
1. **Identify structure.** Map the document: parties, term/effective date, defined terms,
   exhibits/SOWs, and any incorporated-by-reference documents (flag anything you cannot see).
   Confirm the contract type and which party the reader is.
2. **Walk the clause checklist.** For each, note what it says, who it favors, and the risk:
   - **Term & termination** — length, termination for convenience vs for cause, notice/cure
     periods, effect of termination.
   - **Auto-renewal** — auto-renews? renewal length, opt-out window and deadline (a short
     non-renewal window is a classic trap — flag it).
   - **Payment** — amounts, schedule, late fees/interest, price-increase rights, taxes,
     non-refundability.
   - **Liability** — limitation-of-liability cap (amount/formula), carve-outs, mutual vs
     one-sided. Uncapped or wildly asymmetric is a high flag.
   - **Indemnification** — who indemnifies whom, scope (IP, third-party claims), defense/control.
   - **IP & ownership** — work product, pre-existing IP, licenses granted, feedback, residuals.
   - **Confidentiality** — definition, duration, permitted disclosures, return/destruction.
   - **Warranties & disclaimers** — promised vs disclaimed ("AS IS").
   - **Data & privacy/security** — data ownership, DPA, breach handling.
   - **Dispute resolution** — governing law, venue, arbitration, jury/class-action waivers.
   - **Assignment, change of control, exclusivity, non-compete/non-solicit, force majeure.**
3. **Flag the unusual and the missing.** Call out one-sided terms, surprising obligations, and
   notably *absent* protections (no liability cap, no termination-for-convenience, no
   data-return). Missing clauses are findings too.
4. **Rank the risks.** Apply [[severity-triage]] (severity + confidence) from the reader's
   party's perspective. Quote exact clause text and cite `path` (and clause/section number) so
   every finding is auditable.
5. **Frame as questions for counsel.** For each material risk, give the specific question to
   put to a lawyer, not a verdict.

## Inputs
- The contract file(s); the reader's role (which party) and the governing law if known. If role
  or law is unstated, ask or state an explicit assumption.

## Output
```
⚠ Informational review only — NOT legal advice. Consult qualified counsel before acting.
Document: <name/type> · Parties: <…> · Reviewing as: <user's party> · Governing law: <… or "unstated">

Key terms (plain language): <the 5–8 that matter>

Findings (ranked):
  - [severity / confidence] §<clause> (path) — <one-sided / unusual / missing>
    what it says: "<short quote or paraphrase>"
    why it matters to you: <exposure/obligation>
    ask your lawyer: <specific question>

Missing / expected-but-absent clauses: <list>
Open questions / unseen documents: <exhibits, incorporated docs you could not read>
Bottom line: <plain-language summary> — have qualified counsel review before signing.
```
Every finding quotes or cites the clause; nothing is asserted as a legal conclusion.

## Notes
- **Read-only.** Review and summarize; do not draft, edit, or produce final binding language.
  If asked to "write the clause", decline and route to a lawyer (per [[not-professional-advice]]).
- Be specific to the reader's party and jurisdiction-aware; when a clause's effect is genuinely
  ambiguous or jurisdiction-dependent, say so and send it to counsel rather than guessing.
