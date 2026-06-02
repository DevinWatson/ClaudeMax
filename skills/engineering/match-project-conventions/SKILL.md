---
name: match-project-conventions
description: Use before writing or editing code in an existing codebase — read the surrounding code first and match its established conventions (naming, error-handling approach, formatting/lint config, test framework, dependency and structural choices) instead of imposing your own. Do not introduce a new framework, pattern, or dependency without an explicit, stated reason. TRIGGER for any change to code you did not author.
allowed-tools: Read, Grep, Glob
category: engineering
tags: [conventions, consistency, style, refactoring]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Match Project Conventions

A discipline for making changes that look like they were always part of the codebase:
before you write a line, learn how this project already does the thing you are about to do,
and conform to it unless there is a stated reason to diverge.

## When to use this skill
Whenever you are about to add or modify code in a codebase you did not write — a feature,
a fix, a refactor. The goal is that a reviewer cannot tell which lines are new from style
alone. Use it especially before reaching for a library, abstraction, or pattern that the
project does not already use.

## Instructions
1. **Read the neighbors first.** Before editing a file, read it in full and skim 2-3 sibling
   files in the same module/package. Identify the local idioms rather than assuming defaults.
2. **Detect the conventions that matter:**
   - **Naming & layout** — casing, file/module organization, how things are grouped and named.
   - **Error handling** — does the code return errors, raise/throw, use a Result/Either type,
     wrap with context, or log-and-continue? Match the prevailing approach.
   - **Formatting & lint** — find the config (`.editorconfig`, formatter/linter config, the
     `lint`/`format` scripts) and conform to it; do not hand-impose a different style.
   - **Tests** — find the test framework, file naming, and fixture style already in use, and
     write new tests the same way rather than introducing a second framework.
   - **Dependencies & structure** — note the existing libraries for HTTP, logging, dates,
     validation, DI, etc. Prefer what is already a dependency over adding a new one.
3. **Prefer existing patterns over "better" ones.** If the project has an established (even
   imperfect) way to do something, follow it. Consistency usually beats a local improvement.
4. **Diverge only with an explicit reason.** If introducing a new dependency, framework, or
   pattern is genuinely warranted, say so out loud: state what you are adding, why the existing
   options do not suffice, and the cost. Never smuggle in a new pattern silently.
5. **When conventions conflict or are absent,** surface the ambiguity and pick the option most
   consistent with the closest/most-recent code, noting the choice.

## Inputs
- The file(s) to be changed and their surrounding module, plus any repo-level config
  (formatter, linter, test, dependency manifest) that encodes project conventions.

## Output
- A short note of the conventions you detected and are matching (naming, errors, tests, deps).
- Code that conforms to them, with any deliberate divergence called out and justified.

## Notes
- This skill is about *fitting in*, not judging the code — quality critique belongs to a
  reviewer. It pairs with any code-writing skill (e.g. a language idioms skill): apply the
  language idiom *within* the project's established conventions, and let the project win when
  the two disagree on a stylistic point.
- Reusable by essentially every code-writing or refactoring agent in the repo, not just the
  language pros.
