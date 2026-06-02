---
name: prompt-library-management
description: Use when managing a collection of prompts at scale rather than crafting one — versioning prompts, cataloging them with metadata, templating shared variables/partials, reviewing prompt changes, running a regression eval on every change before it ships, and deprecating retired prompts. TRIGGER on "organize / version / govern our prompts", a growing prompts directory, or wiring eval-on-change for prompts. Distinct from prompt-design, which crafts a single prompt — this is the lifecycle and governance of many. Language- and framework-agnostic — the storage/format specifics come from a separate language capability the agent also composes. Any agent that owns a prompt corpus (a prompt-ops engineer, an LLM platform maintainer, a reviewer gating prompt changes) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob
category: ai-ml
tags: [prompt-ops, versioning, catalog, templating, regression-eval, governance]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Prompt Library Management

The substantive capability for governing a prompt corpus as it grows: versioning, cataloging,
templating, change review, eval-on-change, and deprecation — so a fleet of prompts stays discoverable,
reviewable, and safe to change. Independent of the language; the storage format and eval runner come
from the composed language/eval capability.

## When to use this skill
When the unit of work is the *library*, not a single prompt: organizing many prompts, versioning them,
preventing regressions when one changes, and retiring old ones. Not for crafting/optimizing one prompt
(that is prompt-design) and not for building the eval harness from scratch (that is eval-suite-design /
llm-eval-rubric, which this composes). Pairs with [[match-project-conventions]].

## Instructions
1. **Treat prompts as versioned artifacts.** Store each prompt in source control as a discrete,
   reviewable file with a semantic version and an explicit identifier — not inline in application code.
   A prompt change is a code change: it gets a diff, a review, and a version bump.
2. **Catalog with metadata.** Give every prompt a record: id, version, owner, purpose, target
   model(s)/params, input variables, and status (active/experimental/deprecated). Maintain an index so
   a consumer can find the right prompt without grepping. Flag duplicates and near-duplicates for
   consolidation.
3. **Template shared structure.** Factor repeated instructions, formats, and few-shot blocks into
   reusable templates/partials with named variables, so a system-wide change (a new safety clause, a
   format tweak) is made once and propagates. Define the variable contract for each template; validate
   that callers supply the required variables.
4. **Review prompt changes deliberately.** Require a diff review on every prompt change — small wording
   changes can shift behavior dramatically. The review checks the diff, the version bump, the metadata
   update, and that an eval ran.
5. **Run a regression eval on every change.** Wire prompts to an eval set so each change runs against
   held-out cases and is compared to the prior version before shipping — block a change that regresses
   quality past threshold. Use [[llm-eval-rubric]] / eval-suite-design for the scoring; this skill
   ensures the gate exists and fires on change. Never ship a prompt change on vibes.
6. **Deprecate cleanly.** Mark retired prompts deprecated with a pointer to the replacement and a
   removal date; keep them resolvable until consumers migrate, then remove. Track which consumers use
   which prompt version so a deprecation doesn't silently break a caller.

## Inputs
- The prompt corpus (files/store), the existing metadata/index if any, the eval set(s), and the
  consumers (which app/agent uses which prompt).

## Output
- The library structure: versioned prompt files, the catalog/index with per-prompt metadata, and the
  shared templates/variable contracts.
- The change-governance setup: the review checklist and the regression-eval gate wired to fire on every
  prompt change.
- The deprecation plan for any retired prompts (replacement + removal date + affected consumers).

## Notes
- A prompt change without an eval is an untested code change — gate it.
- Don't let near-duplicate prompts proliferate; consolidate into templates with variables.
- Stay language-agnostic; the storage format, loader, and eval runner belong to the composed
  language/eval capability, and single-prompt crafting belongs to [[prompt-design]].
