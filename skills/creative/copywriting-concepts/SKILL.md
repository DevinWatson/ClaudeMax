---
name: copywriting-concepts
description: Use when generating persuasive marketing/brand copy CONCEPTS — headlines, taglines, value props, hooks, CTAs — as multiple distinct persuasive angles on the same offer (benefit/outcome, problem-agitate-solve, social-proof, curiosity, objection-handling, authority/specificity), each with a rationale, plus a mandatory honesty pass that strips any invented claim, stat, testimonial, or guarantee. TRIGGER when someone needs varied copy directions, not finished campaigns or factual docs. Any agent producing persuasive short-form copy (copy ideator, landing-page assistant, ad-concept helper) can load it.
allowed-tools: Read, Grep, Glob
category: creative
tags: [copywriting, marketing, persuasion, ideation]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Copywriting Concepts

The substantive capability for persuasive copy ideation: generate the same offer through
several distinct persuasive *angles* — so the user compares approaches, not rewrites of
one line — and then enforce an honesty pass so every line rests on something true.

## When to use this skill
When the deliverable is short-form persuasive artifacts (headlines, taglines, value
props, hooks, CTAs) explored as multiple angles. Use it with [[divergent-then-converge]]
for the generate-broadly-then-shortlist discipline; this skill supplies the persuasive-
angle taxonomy and the honesty pass. Not for accurate explanatory documentation
(that optimizes for correct understanding, not persuasion) and not for story structure.

## Persuasive angles (generate across all that fit, keeping the SAME offer)
Label each line with its angle so the spread is visible:
- **Benefit / outcome** — lead with the result the customer gets.
- **Problem–agitate–solve (PAS)** — name the pain, twist it, then resolve.
- **Social proof** — "joined by N teams," credibility, popularity — *only if real*.
- **Curiosity / open loop** — provoke a question the reader must resolve.
- **Objection-handling** — disarm the top reason they would say no.
- **Authority / specificity** — concrete numbers and credentials over adjectives.

## Honesty pass (REQUIRED — non-negotiable)
Re-read every line and confirm each claim is supported by something true about the offer.
Strip or rewrite anything that implies a benefit, stat, endorsement, award, scarcity, or
guarantee that is not real. If a punchy line needs proof you do not have, flag it as
"claim to verify" — never ship it as fact. Persuade, do not deceive; avoid dark-pattern
urgency and misleading framing.

## Instructions
1. Capture the brief: the offer, the single most important benefit, the audience and
   their pain, brand voice/tone, the channel (landing page, ad, email subject, app store),
   and length limits. Note which claims are TRUE and substantiated. Ask 1–2 questions if
   the offer is unclear.
2. Diverge across the persuasive angles above (defer judgment — see
   [[divergent-then-converge]]), producing the requested artifact types under each angle,
   matched to the channel's length norms.
3. Converge: state criteria (clarity, distinctiveness, on-brand voice, likely resonance),
   then shortlist a spread of distinct angles — not several tweaks of one.
4. Run the honesty pass over the shortlist; flag every assumed claim to verify.

## Inputs
- The brief: offer, core benefit, audience/pain, voice, channel, constraints, and the
  list of true/substantiated claims available.

## Output
```
Brief: <offer, core benefit, audience, voice, channel, constraints>
Concepts by angle:
  benefit / problem-agitate-solve / social-proof (only if real) / curiosity /
  objection-handling / authority-specificity: <lines>
Selection criteria: <the bar applied>
Shortlist:
  - "<line>" [angle / artifact type] — why it works — the claim it rests on
Honesty check: <confirmation every line makes a distinct, truthful claim>
Assumptions to verify: <any stat/proof/benefit assumed that the user must confirm>
```

## Notes
- Preserve optionality: the user picks the direction; do not collapse to one line unless
  asked.
- Match the stated brand voice; flag if a high-performing angle conflicts with it.
- The honesty pass is part of the deliverable, not an afterthought.
