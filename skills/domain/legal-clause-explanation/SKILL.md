---
name: legal-clause-explanation
description: Use when someone wants ONE specific legal clause or term explained in plain language — its plain-language meaning and operative parts (who owes what, when, triggered by what), why it exists and which party it protects, common variants (mutual vs one-sided, broad vs narrow, capped vs uncapped, carve-outs, reasonable vs best efforts) and what each signals, and general watch-outs framed as questions for counsel. Educational/explanatory only, NOT legal advice. Severity-RANKING of clause risk is intentionally out of scope (that belongs to whole-contract review). TRIGGER on "what does this clause/term mean and why is it here." Any clause-teaching agent can load it.
allowed-tools: Read, Grep, Glob
category: domain
tags: [legal, clause, explainer, informational]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Legal Clause Explanation

The substantive capability for explaining a single legal clause or term in plain language
so a non-lawyer understands what it does and why it is there — a glossary-plus-tutorial for
one provision, not an assessment of a whole document.

## NOT legal advice (read first, and say it in every output)
- This is **general educational explanation only**. You are **not a lawyer**, this is **not
  legal advice**, and nothing here creates an attorney-client relationship or may be relied
  upon to act on a specific contract.
- **Law is jurisdiction-specific and changes**, and how a clause is interpreted/enforced
  varies by jurisdiction and the surrounding contract. State the assumed jurisdiction (or
  "general/common-law") and note when meaning depends on local law.
- For any decision about a real document (signing, negotiating, enforcing, relying on a
  clause), **recommend a qualified attorney** licensed in the relevant jurisdiction. Never
  assert that a clause "is enforceable", "protects you", or "is fine" — explain in general
  terms and route the applied judgment to counsel.

## Scope boundary
This skill *educates* about one clause/term — meaning, purpose, typical variants, general
watch-outs. **Severity-ranking of clause risk is intentionally out of scope** — ranking
risks/red flags across a whole contract from a party's perspective is whole-contract review
work, not single-clause education. If the user wants their full contract reviewed for risk,
say so and route them there.

## When to use this skill
When the user wants to *understand a provision*. If they pasted clause text, explain *that*
text; if they named a concept (e.g. "indemnification", "force majeure", "limitation of
liability"), explain the general concept. Confirm the clause/term, the context (agreement
type, if known), and the assumed jurisdiction/legal tradition.

## Instructions
1. **Plain-language meaning.** Say what the clause does in one or two sentences a non-lawyer
   understands, then unpack the operative parts (who owes what, when, triggered by what).
2. **Why it exists.** Explain the purpose/risk it allocates — what problem it solves and
   which party it typically protects.
3. **Common variants.** Describe how the clause commonly differs (mutual vs one-sided; broad
   vs narrow; capped vs uncapped; with/without carve-outs; "reasonable efforts" vs "best
   efforts") and what each variant generally signals.
4. **What to watch for.** Note general red flags and questions a careful reader would raise —
   framed as things to check or ask counsel about, not as verdicts on the user's situation.
5. **Define the jargon.** Translate any embedded legal terms of art used in the explanation.

## Inputs
- The clause text or named concept, the agreement context if known, and the assumed
  jurisdiction/legal tradition.

## Output
```
⚠ General educational explanation only — NOT legal advice. Meaning/enforceability vary by
  jurisdiction and the full contract; consult a qualified attorney before acting.
  Assumed jurisdiction/tradition: <…> · Context: <agreement type or "general">

Clause/term: <name>
In plain language: <1–2 sentence explanation>
Why it exists / what it does: <purpose, who it protects>
Common variants: <bulleted, with what each signals>
What to watch for: <general watch-outs, framed as questions for counsel>
Key terms defined: <jargon → plain meaning>
For your specific document: have a qualified attorney review it. (Want a full-contract
  risk review instead of a single-clause explanation? That is whole-contract review, not
  this skill.)
```

## Notes
- **Educational, read-only.** Explain; do not draft, redline, negotiate, or opine on whether
  a specific clause is enforceable/good for the user. Decline drafting and route to counsel.
- Never frame an explanation as applied advice or a sign-off on the user's contract.
- When meaning is genuinely jurisdiction-dependent or unsettled, say so rather than guessing.
- Stay on a single clause/term; severity-ranking is out of scope. Combine with
  [[not-professional-advice]] for the disclaimer framing.
