---
name: behavior-preserving-refactoring
description: Use when improving the structure of working code without changing what it does — how to baseline behavior with tests, apply one small reversible transformation at a time, re-run the suite after each, and stop the moment a change would alter observable behavior. TRIGGER on "refactor / clean up / simplify / restructure this without changing behavior". NOT for adding features or fixing bugs. Any agent that restructures code (a refactoring specialist, a language pro tidying a module, a reviewer suggesting a safe cleanup) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: engineering
tags: [refactoring, safety, maintainability, tests]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Behavior Preserving Refactoring

The substantive refactoring capability: change the internal structure of code while keeping
its observable behavior identical, with tests as the contract and small reversible steps as
the method.

## When to use this skill
When the goal is to make working code clearer, simpler, or better-factored — reduce
duplication, clarify naming, untangle a complex function, improve cohesion — *without*
altering what it does. Not for new features or bug fixes; those change behavior by design.
Pairs with [[verify-by-running]] (the test runs that prove behavior held) and
[[match-project-conventions]] (refactor toward the codebase's own idioms, not yours).

## Instructions
1. **Establish a behavior baseline first.** Run the existing test suite and record the green
   state. If coverage around the target is thin, write **characterization tests** that pin
   down the current behavior (including any quirks) *before* touching the code. If there is
   no harness at all, say so and add the minimal one — refactoring without a safety net is
   guessing.
2. **Refactor in small, reversible steps.** One transformation at a time — extract function,
   inline, rename, remove duplication, simplify a conditional, introduce a parameter object,
   split a class — each small enough to undo cleanly. Resist bundling several changes into one.
3. **Re-run the tests after every step.** Green → keep the step. Red → revert that single step
   and reconsider; do not pile a fix on top of a broken transformation.
4. **Stop at any behavior change.** If a "refactor" would alter observable behavior (output,
   side effects, error semantics, performance contract), halt and surface it as a *separate*
   decision — that is no longer a refactor. Never smuggle a bug fix or feature into a refactor.
5. **Keep it conventional.** Refactor toward the project's established patterns and style, not
   a personal preference; the result should look like it always belonged.

## Inputs
- The working code to restructure, the specific smell to address (don't boil the ocean), and
  a test suite — or the means to add characterization tests — to verify behavior is preserved.

## Output
- The refactored code as focused diffs, one logical transformation per step.
- Confirmation (via [[verify-by-running]]) that the suite was green before and after each step.
- A short summary of each transformation and why it improves the code, plus any behavior change
  you found and deliberately did NOT make.

## Notes
- Prefer many small verifiable steps over one large rewrite — the small steps are what make the
  behavior-preservation claim credible.
- A characterization test captures *current* behavior, bugs included; do not "fix" the quirk
  while refactoring — note it separately.
