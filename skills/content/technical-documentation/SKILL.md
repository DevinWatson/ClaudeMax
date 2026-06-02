---
name: technical-documentation
description: Use to write or improve developer-facing documentation — READMEs, API references, how-to guides, tutorials, and concept docs. Selects audience and doc type, verifies every name/signature/flag/default against the actual source, structures for the reader's task, supplies runnable examples, and edits for clarity. TRIGGER to document a feature or fix confusing docs. Any agent producing accurate developer docs (technical writer, API-docs author, changelog writer, onboarding-guide author) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: content
tags: [documentation, writing, developer-docs, accuracy]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Technical Documentation

The substantive capability for writing documentation developers can actually follow. Accuracy
first: every claim and example must match the real code. Composes [[match-project-conventions]]
to fit the repo's doc style and [[verify-by-running]] to confirm examples work.

## When to use this skill
When writing or improving developer-facing docs — READMEs, API references, how-to guides,
tutorials, concept/explanation docs — grounded in actual code with runnable examples. Use to
document a new feature or repair docs that are confusing, stale, or wrong.

## Instructions
1. **Pick audience and doc type.** Identify the reader (end user, integrator, contributor) and
   the doc type (reference, how-to, tutorial, explanation). Lead with what the reader is trying
   to do — these choices set structure and depth.
2. **Verify the facts.** Confirm names, signatures, flags, defaults, and behavior against the
   source. Never document an API you haven't checked. Anything unverifiable gets flagged for the
   author, not guessed.
3. **Structure for the task.** Short sections, descriptive headings, logical progression
   (prerequisites → steps → verification → troubleshooting).
4. **Show, don't just tell.** Provide minimal, copy-pasteable, correct examples. Run them via
   [[verify-by-running]] to confirm they work; report the exact commands and real output.
5. **Match the repo's conventions.** Per [[match-project-conventions]], mirror the existing doc
   format, tone, heading style, and terminology; reuse existing terms consistently rather than
   inventing new ones (Markdown unless the repo says otherwise).
6. **Edit for clarity.** Active voice, concrete verbs, no filler. Define jargon on first use.
   Keep it as short as it can be while still complete.

## Inputs
- The feature/API/topic to document, the relevant code/config to ground it, and the repo's
  existing docs (for style and terminology).

## Output
- The documentation in the project's existing format and style.
- A note on any examples you executed to verify (commands + result).
- A list of any claims you could NOT verify against the code, flagged for the author.

## Notes
- Do not invent behavior, flags, or output. If unsure, verify or mark it unverified.
- Examples that are documented but not run are a liability — run them when feasible and say so.
