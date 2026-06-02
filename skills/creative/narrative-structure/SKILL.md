---
name: narrative-structure
description: Use when designing the STRUCTURE of a story rather than writing finished prose — defining the spine (theme, protagonist, stakes, tone), choosing and laying out a structural model (three-act, hero's journey, story circle) as an explicit beat sheet, detailing character motivation/obstacle/transformation, handling interactive/branching narrative, and verifying every beat serves the theme. TRIGGER on brand-story, game/interactive narrative, or long-form content storytelling work. Any agent building narrative skeletons (narrative designer, content strategist, game-writing assistant) can load it.
allowed-tools: Read, Grep, Glob
category: creative
tags: [storytelling, narrative, structure, beats]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Narrative Structure

The substantive capability for designing the *structure* of a story: its arc, the
characters and stakes, the theme, the tone, and the explicit beat-by-beat sequence —
the skeleton and emotional logic, not polished prose.

## When to use this skill
When the deliverable is how a story is built and why it lands emotionally — brand
stories, game/interactive narrative, onboarding narratives, long-form content arcs.
Not for short persuasive marketing artifacts (taglines/headlines — that is copy
ideation) and not for open-ended idea generation.

## Instructions
1. **Establish the brief.** Capture the audience, the medium (brand film, game, article
   series, onboarding flow), the core message or change the audience should feel, the
   desired tone, and length/format constraints. For interactive/game narrative, also
   capture player agency: branching, choices, and what the player can change.
2. **Define the spine.** State the **theme** (the idea the story argues), the
   **protagonist** (who the audience identifies with — for brand stories this is usually
   the *customer*, not the brand), the **stakes** (what is at risk / the desired change),
   and the **tone**.
3. **Choose a structural model and justify it.** Lay out its beats explicitly:
   - **Three-act** — Setup (status quo + inciting incident) → Confrontation (rising
     complications, midpoint, low point) → Resolution (climax + new normal).
   - **Hero's journey** — Ordinary world → Call → Refusal → Mentor → Threshold → Trials →
     Ordeal → Reward → Road back → Resurrection → Return with the elixir.
   - **Story circle (Dan Harmon)** — You → Need → Go → Search → Find → Take → Return →
     Change.
   For brand stories, map the customer to the hero and the brand to the mentor/guide.
4. **Write the beat sheet.** For each beat: what happens, what the audience feels, and how
   it advances the theme. Keep cause-and-effect tight — each beat should make the next
   one necessary.
5. **Detail character & stakes.** Motivation, the obstacle/antagonistic force, and the
   transformation by the end.
6. **Handle interactive narrative** (if any): mark branch points, what choices mean, and
   how branches converge/diverge without breaking the theme.
7. **Verify coherence.** Confirm every beat serves the theme, stakes escalate, the
   protagonist changes, and tone is consistent. Flag any beat that does not earn its place.

## Inputs
- The brief: audience, medium, core message/change, tone, constraints, and (for
  interactive work) the player-agency model.

## Output
```
Brief: <audience, medium, core message, tone, constraints>
Spine: theme / protagonist / stakes / tone
Structure chosen: <model> — why it fits
Beat sheet:
  - <beat name> — what happens — what the audience feels — how it serves the theme
Characters & stakes: <motivation, obstacle, transformation>
Interactive notes (if any): <branch points, consequences, convergence>
Tone samples: <a few representative lines to convey voice — illustrative, not final copy>
Coherence check: <confirmation each beat earns its place; weak beats flagged>
```

## Notes
- Deliver structure and emotional logic, not finished copy; representative lines are only
  to convey tone.
- Keep the protagonist's transformation and the theme central; cut beats that do not
  serve them rather than padding the arc.
- For brand stories grounded in real claims, do not invent facts about the product or
  company; mark anything assumed so the user can confirm it.
