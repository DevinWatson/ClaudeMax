---
name: typescript-type-system
description: Use when working with the TypeScript type system — confusing type errors, generics and constraints, conditional/mapped/template-literal types, inference and narrowing, strictness migration, or tsconfig/module-resolution issues. Diagnoses errors in type-system terms, prefers the simplest sound fix over type-level wizardry, and verifies with tsc --noEmit. Any agent reading or writing TS (writer, reviewer) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [typescript, types, generics, inference, tsconfig]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# TypeScript Type System

The substantive TypeScript capability: model a problem in the type system soundly and
ergonomically, explain type errors by their real cause, and keep inference working for
callers — without reaching for `any` or unnecessary type-level machinery.

## When to use this skill
When a TS type error is confusing, types need to be made safer, strictness is being raised,
a generic API needs designing, or `tsconfig`/module resolution is misbehaving. Not needed
for plain runtime-logic edits that the types already cover.

## Instructions
1. **Diagnose in type-system terms.** Name the actual cause — variance (co/contra/invariance),
   the inference site, control-flow narrowing, structural vs. intended shape, distributive
   conditional types, excess-property checks, or widening of literals. Read the error from
   the deepest "Type 'X' is not assignable to 'Y'" outward.
2. **Prefer the simplest sound fix.** Reach for generics-with-constraints, conditional, mapped,
   and template-literal types only when they earn their complexity. Avoid `any`; prefer
   `unknown` plus narrowing or a type guard. Justify any `as`/non-null `!` assertion and
   prefer making it unnecessary.
3. **Keep inference working for callers.** Design APIs so consumers get good inference and
   good error messages; avoid over-annotating where inference suffices, and use `satisfies`
   to check a value against a type without widening it. Use discriminated unions and
   exhaustive `switch` with a `never` check for closed sets.
4. **Tune strictness deliberately.** Understand `strict`, `noUncheckedIndexedAccess`,
   `exactOptionalPropertyTypes`, and module/`moduleResolution`/`paths` settings. Migrate toward
   stricter, not looser; never disable a flag to silence a single error without flagging it.
5. **Verify.** Run `tsc --noEmit` (or the project's typecheck script, which encodes its flags)
   and report the exact command and result. Type-level changes that "look right" still need
   the compiler to confirm.

## Inputs
- The TS code, the governing `tsconfig.json` (strict flags, target/module, paths), and the
  full type error text for anything being diagnosed.

## Output
- The real cause of the type error and the change as a focused diff, with a one-line rationale
  per non-obvious type.
- The typecheck command run and its result; any remaining `any`/assertion flagged with why.

## Notes
- Soundness over cleverness; readability over maximal type-level wizardry.
- Apply within the project's conventions — match its existing utility-type style and avoid
  adding a type-fest-style dependency the project does not use without saying why.
