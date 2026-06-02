---
name: feature-development
description: Use when turning a requirement, ticket, or feature request into working, tested, incrementally-shipped code — clarifying acceptance criteria, slicing the work into small verifiable increments, implementing the smallest viable change, self-reviewing the diff, and leaving the result independently verifiable. TRIGGER when asked to build or extend a feature from a spec rather than fix a known bug or refactor. Language- and framework-agnostic — the disciplined delivery loop, not the syntax; the language specifics come from a separate language capability the agent also composes. Any agent that ships application code (a feature developer, a full-stack engineer, a tech-lead reviewing how work was sliced) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: engineering
tags: [feature, delivery, incremental, tdd, acceptance-criteria]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Feature Development

The substantive delivery capability: convert a requirement into working, tested code through
small verifiable increments, independent of the language or framework that implements it. Bias
toward the smallest change that satisfies an explicit acceptance criterion, and leave every step
provable by running something.

## When to use this skill
When building a new feature or extending existing behavior from a requirement, ticket, or
informal request. Not for diagnosing a known defect (that is reproduce-then-fix) or for changing
structure without changing behavior (that is behavior-preserving-refactoring). Pairs with
[[match-project-conventions]] (fit the codebase's style), [[test-design]] (choose the tests), and
[[verify-by-running]] (prove each increment).

## Instructions
1. **Pin acceptance criteria before code.** Restate the requirement as a short list of
   observable, testable criteria (given/when/then or input→output). Surface ambiguity, scope
   boundaries, and non-functional constraints (performance, compatibility, security) now; if a
   criterion is unknowable, state your assumption explicitly rather than guessing silently.
2. **Map the change surface.** Read the relevant code, data model, and call sites with Grep/Glob
   so the design fits what exists. Identify the seams where the feature attaches and the existing
   patterns to reuse rather than inventing parallel structure.
3. **Slice into increments.** Decompose into the smallest changes that each leave the system in a
   working, mergeable state — a vertical slice that delivers one criterion end-to-end beats a
   horizontal layer that delivers nothing runnable. Order slices to retire the riskiest unknown
   first.
4. **Implement the smallest viable increment.** Write the minimal code to satisfy the current
   slice, following [[match-project-conventions]]. Prefer extending existing abstractions over new
   ones; defer generalization until a second caller actually exists. Keep the public surface and
   error handling consistent with the codebase.
5. **Cover behavior with tests.** Use [[test-design]] to pick the right level (unit for logic,
   integration for boundaries) and assert behavior against the acceptance criteria, including the
   failure/edge cases — not just the happy path.
6. **Self-review the diff.** Re-read your own change as a reviewer would: dead code, leftover
   debug output, unhandled errors, broadened scope, and missing tests. Confirm it stays inside the
   stated scope.
7. **Verify and hand off.** Run the build/tests/linters via [[verify-by-running]] and report the
   exact commands and results. State which acceptance criteria are now met and which slices remain.

## Inputs
- The requirement/ticket and any spec or designs, the relevant area of the codebase, the project's
  test and build tooling, and any non-functional constraints (compatibility, performance, security).

## Output
- The pinned acceptance criteria (with any assumptions called out).
- The increment plan: the slices, in order, with the current one marked.
- The implemented change as `path:line` diffs plus the new/updated tests, each tied to a criterion.
- The verification result via [[verify-by-running]] (exact commands + outcome) and a short status of
  met criteria and remaining work.

## Notes
- One mergeable increment at a time; never leave the tree broken between slices.
- Match the codebase, don't reshape it mid-feature — flag a needed refactor as separate work rather
  than smuggling it into the feature diff.
- Stay language-agnostic here; idioms, types, and library choices belong to the composed language
  capability (e.g. [[python-idioms]], [[go-idioms]]).
