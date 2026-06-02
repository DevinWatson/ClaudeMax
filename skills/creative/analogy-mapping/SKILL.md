---
name: analogy-mapping
description: Use when making a complex or abstract idea intuitive through analogy/metaphor — decomposing the target into its elements and relationships, generating source domains familiar to the audience, building an explicit source→target correspondence mapping, testing where each analogy holds and (crucially) where it breaks, and offering several framings tuned to different audiences. TRIGGER when explanation/communication clarity is the goal, not open-ended idea generation. Any agent that must explain hard concepts (analogy finder, teacher/tutor, docs explainer) can load it.
allowed-tools: Read, Grep, Glob
category: creative
tags: [analogy, metaphor, explanation, communication]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Analogy Mapping

The substantive capability for making a hard idea intuitive: map the *relational
structure* of a familiar source onto an unfamiliar target, test where the mapping holds
and where it breaks, and offer framings tuned to the audience.

## When to use this skill
When the goal is explanation and communication clarity — making a mechanism, scale,
relationship, or trade-off intuitive via analogy. Not for open-ended idea generation or
creative ideation. A good analogy illuminates a *specific* difficulty, not a topic vaguely.

## Instructions
1. **Pin down the target.** State the exact idea to explain and which part is hard (the
   mechanism, the scale, the relationship, the trade-off). Identify the **audience** and
   what they already know — the best source domain is one already familiar to them.
2. **Decompose the target.** List its key elements and the relationships between them
   (what causes what, what trades off against what). The analogy must match the
   *relational structure*, not just surface features.
3. **Generate candidate source domains** from areas the audience knows (everyday objects,
   nature, cooking, sports, money, traffic, plumbing). Prefer sources whose internal
   relationships mirror the target's.
4. **Map source → target explicitly.** For each candidate, build a correspondence table:
   each element of the target ↔ its counterpart in the source. A mapping you cannot fill
   in is a weak analogy.
5. **Test where it holds and where it breaks (required).** State which inferences transfer
   correctly and — crucially — where the analogy misleads if pushed too far. Every analogy
   breaks somewhere; naming the break point prevents wrong conclusions.
6. **Offer several framings** at different levels (a one-liner for a layperson, a richer
   mapping for a technical audience) so the user can pick what fits the moment.

## Inputs
- The target idea and its specific hard part, plus the audience and their prior knowledge.

## Output
```
Target: <the idea, and the specific hard part>
Audience: <who, and what they already know>
Target structure: <key elements + relationships>
Framings:
  - Analogy: "<X is like Y>"
    Mapping: <target element ↔ source element, for each>
    Holds for: <which inferences transfer correctly>
    Breaks down at: <where it misleads if pushed — always state this>
    Best for: <which audience / situation>
Recommended framing: <which to lead with, and why>
```

## Notes
- Always state where each analogy breaks down — the break point is part of the deliverable.
- Match relational structure, not superficial resemblance; reject analogies that only
  share surface vibes.
- Keep sources genuinely familiar to the stated audience; avoid analogies that smuggle in
  misleading connotations.
