---
name: naming
description: Use when generating and screening names for a product, feature, company, or project — covers the naming-style taxonomy (descriptive, evocative, invented, metaphor, compound, real-word), candidate generation across styles, and a screening pass for pronounceability, spellability, memorability, meaning, brand collisions, and caveated (non-authoritative) domain/trademark risk. TRIGGER when someone needs name candidates plus an honest screen. Any agent that names something (naming specialist, branding helper, product-launch assistant) can load it.
allowed-tools: Read, Grep, Glob
category: creative
tags: [naming, branding, screening, product]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Naming

The substantive capability for naming things: generate candidates across the full
spread of naming styles, then screen each one against the practical tests a name must
pass, with honest, explicitly non-authoritative flags on trademark and domain risk.

## When to use this skill
When naming a product, feature, company, project, or release and the deliverable is a
set of candidate names plus a reasoned, screened shortlist. Use it together with
[[divergent-then-converge]], which provides the generate-broadly-then-narrow discipline;
this skill supplies the naming-specific style taxonomy and screening checklist.

## Naming-style taxonomy (generate across all of these)
Generate candidates in each style and label every candidate with its style, so the set
spans genuinely different directions rather than variants of one word:
- **Descriptive** — says what it does (e.g. *Salesforce*). Clear, weak distinctiveness.
- **Evocative / suggestive** — implies a feeling or quality (e.g. *Amazon*, *Oracle*).
- **Invented / coined** — neologisms, blends, altered spellings (e.g. *Spotify*).
- **Metaphor / analogy** — borrows an image from another domain (e.g. *Stripe*).
- **Compound / portmanteau** — two real words fused (e.g. *Snapchat*, *Netflix*).
- **Real-word / lexical** — an existing word repurposed (e.g. *Apple*).
Push past the literal first attempts; the obvious descriptive names come for free.

## Screening checklist (apply to every candidate; drop or flag failures)
1. **Pronounceable** — can a stranger say it correctly on first read?
2. **Spellable** — can they type it after only hearing it (the "radio test")?
3. **Memorable & distinct** — short-ish, not easily confused with the rest of the set.
4. **Meaning check** — no obvious negative or unintended meaning, including in other
   major languages if the audience is global.
5. **Collision scan** — call out names obviously close to well-known existing brands,
   products, or competitors you can recognize.
6. **Domain / handle plausibility** — note whether an exact-match .com or social handle
   is *plausibly* available, clearly caveated as a guess, not a lookup.

## Trademark & domain caveat (NON-AUTHORITATIVE — always state)
You cannot perform a real legal clearance or a live availability lookup. Flag plausible
conflicts you happen to recognize, but always tell the user to run an actual trademark
search (USPTO/EUIPO or a trademark attorney) and a live domain/handle check before
committing. **Never imply a name is "available" or "clear."**

## Instructions
1. Capture the brief: what is being named, positioning/personality, audience,
   must-evoke / must-avoid associations, length/format limits, and where the name
   appears (logo, URL, app store, spoken aloud). Ask 1–2 questions if the brief is thin.
2. Diverge across the style taxonomy above (defer judgment — see [[divergent-then-converge]]).
3. Screen every candidate against the checklist; drop or annotate failures.
4. Converge: state selection criteria, then shortlist a stylistically distinct spread.

## Inputs
- The naming brief: subject, positioning, audience, constraints, must-evoke/must-avoid.

## Output
```
Brief: <subject, positioning, audience, constraints>
Candidates (by style): descriptive / evocative / invented / metaphor / compound / real-word
Screening: <pronounce / spell / meaning / collision / domain notes per candidate>
Shortlist:
  - <name> [style] — why it fits the positioning — risks/caveats
Verification needed (do before committing):
  - Authoritative trademark search (USPTO/EUIPO or a trademark attorney)
  - Live domain & social-handle availability check
  - In-market pronunciation / meaning test with real users
```

## Notes
- The trademark/domain caveat is part of the deliverable, not a footnote — never present
  a name as legally clear or available.
- Preserve optionality across styles; don't collapse to one forced winner.
- Be honest about weak candidates rather than padding the list.
