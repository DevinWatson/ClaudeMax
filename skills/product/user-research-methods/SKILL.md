---
name: user-research-methods
description: Use to plan or synthesize PRIMARY user research — design interview/survey/usability/diary studies, choose method by question type and justify sample size (Nielsen ~5 for usability, proportion margin-of-error math for surveys), write non-leading instruments and screeners, and synthesize raw sessions bottom-up via affinity mapping into prevalence-weighted insights tied to the decision they inform. TRIGGER on "design a user study / write an interview guide or survey / synthesize research notes." Not synthesis of published/secondary sources (that is a literature reviewer). Any agent doing first-party research (a user researcher, a discovery lead, a usability analyst) can load it.
allowed-tools: Read, Grep, Glob, Write
category: product
tags: [user-research, interviews, surveys, usability-testing, synthesis]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# User Research Methods

The substantive capability for primary, first-party user research: design studies that reduce
uncertainty about a specific decision and synthesize their raw data into trustworthy,
prevalence-weighted insights.

## When to use this skill
When planning a study (design + instruments) or synthesizing raw study data (notes, transcripts,
survey exports). Pairs with an evidence-discipline skill (e.g. [[assumption-hygiene]]) to separate
observation from inference. Does **primary** research only — synthesizing *published/secondary*
sources (papers, market reports) is a literature reviewer's job; route there for "what is already
known about X."

## Instructions
1. **Pin the decision.** Every study and question exists to reduce uncertainty about a specific
   decision — if you cannot name it, ask. State the mode: **plan a study** or **synthesize data**.

### When planning a study
2. **Frame.** Write the research questions and the decision each informs; state
   assumptions/hypotheses to test.
3. **Choose method by question type, and justify sample size:**
   - *Why / how / motivations* → qualitative **interviews** (~5–8 users per segment; diminishing
     returns past ~5 for discovering top usability issues — Nielsen).
   - *Can users complete the task* → moderated/unmoderated **usability test** (~5 users per round,
     iterate).
   - *How many / prevalence* → **survey** (size for the precision needed: for a proportion,
     n ≈ (1.96/MoE)² · p(1−p); ~385 for ±5% at p=0.5, ~1067 for ±3%).
   - *Behavior over time* → diary study / log analysis.
   Note the tradeoff (speed vs. confidence).
4. **Write the instrument.** Open-ended, non-leading interview questions ordered broad → specific
   with neutral probes ("tell me more", "walk me through that"); realistic usability task scenarios
   (goal, not instructions); surveys free of double-barreled/leading items with balanced Likert
   scales. Include a **screener** to recruit the right participants and a consent/recording note.
   Plan the analysis up front (what you'll code for, the bar for "validated").

### When synthesizing data
5. **Extract atomic observations.** Read everything; pull one quote/behavior per note, attributed
   to a participant ID, no interpretation yet.
6. **Affinity-map.** Cluster observations into emergent themes bottom-up, named in the users'
   framing; count how many participants support each (prevalence).
7. **Derive insights.** observation → interpretation → implication/recommendation. Separate what
   users *did/said* (evidence) from what you *infer*. Rate confidence by prevalence + consistency +
   directness. Report "n of N participants," not percentages on tiny qual samples; report surveys
   with the margin of error.

## Inputs
- The decision to inform and target segment (for planning), or the raw notes/transcripts/survey
  exports (for synthesis).

## Output
- For a **study plan**: decision to inform · research questions · method + rationale ·
  participants/screener + justified sample size · script/instrument · analysis plan · logistics/ethics.
- For a **synthesis**: study & method; ranked insights (each with confidence, attributed evidence
  "n of N", and an implication); themes with prevalence; contradictions/surprises; open questions.
- Every insight ties to a research question; every research question ties to a decision. Written to
  a file (e.g. `research/<study>-plan.md`) when a deliverable is expected; otherwise inline.

## Notes
- Never invent participants, quotes, or numbers. If data is thin, say "low confidence, n too small."
- Avoid leading/loaded questions in instruments and confirmation bias in synthesis — actively look
  for disconfirming evidence.
- Design and analyze; do not claim to have "run" sessions you did not. Flag ethics/consent/PII
  rather than glossing them.
