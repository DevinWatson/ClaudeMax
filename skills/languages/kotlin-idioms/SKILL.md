---
name: kotlin-idioms
description: Use when writing, reviewing, or debugging Kotlin code — null-safety and smart casts, data/sealed classes, coroutines and structured concurrency, Flow, extension and scope functions, immutability (val), generics and variance (in/out), and JVM interop. Verifies with the project's Gradle build (gradlew build/test) and ktlint/detekt. Any agent touching Kotlin (writer, reviewer, debugger, the android team) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [kotlin, jvm, coroutines, flow, null-safety, gradle]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Kotlin Idioms

The substantive Kotlin capability: write clear, null-safe, structured-concurrent, idiomatic
Kotlin and verify it with the project's Gradle build and linters.

## When to use this skill
When authoring, reviewing, or debugging Kotlin and any of these is involved: a nullability or
smart-cast question, modeling with data/sealed classes, coroutines/structured-concurrency or
Flow correctness, extension/scope-function usage, generic variance (`in`/`out`), Java interop,
or a Gradle Kotlin DSL build/dependency issue. Not needed for trivial edits with no
null-safety, concurrency, or build dimension.

## Instructions
1. **Lean on the type system for null-safety.** Make nullability explicit (`T?` vs `T`); prefer
   non-null types and let smart casts narrow after a null check. Use `?.`, `?:`, `let`/`also`,
   and `requireNotNull`/`checkNotNull` over force-unwrap `!!`. Justify every `!!` and every
   platform-type (`T!`) that crosses a Java boundary — that is where NPEs leak back in.
2. **Model data with data and sealed classes.** Use `data class` for value-like aggregates
   (with `copy`, structural equality), `enum`/`sealed class`/`sealed interface` for closed
   hierarchies, and exhaustive `when` over them (no `else` branch, so a new variant forces a
   compile error). Prefer `val` and immutable collections; expose read-only types (`List`,
   `Map`) and keep mutation internal.
3. **Use coroutines under structured concurrency.** Every coroutine runs in a scope; never
   launch into `GlobalScope`. Choose the right dispatcher (`Default` for CPU, `IO` for blocking
   I/O, `Main` for UI), propagate cancellation cooperatively (check `isActive`, use cancellable
   suspend calls), and reach for `withContext`/`coroutineScope`/`supervisorScope` deliberately.
   Model streams with `Flow` (cold, backpressure-aware); pick `StateFlow`/`SharedFlow` for hot
   state and collect on the correct dispatcher.
4. **Apply extension and scope functions idiomatically.** Use extension functions to add
   behavior without inheritance; pick the right scope function by intent — `let` (transform a
   nullable), `run`/`with` (configure + return result), `apply` (configure + return receiver),
   `also` (side effect). Do not nest scope functions into unreadable chains.
5. **Get generics and variance right.** Declare variance at the declaration site with `out`
   (producer/covariant) and `in` (consumer/contravariant); use bounds and reified type
   parameters in `inline` functions where erasure would otherwise bite. Avoid star-projections
   when a precise type is knowable.
6. **Respect JVM interop.** Watch platform types coming from Java, use `@JvmStatic`/
   `@JvmOverloads`/`@JvmName` where Java callers need them, and handle checked exceptions and
   SAM conversions correctly. Detect the Gradle setup (Kotlin DSL `build.gradle.kts` vs Groovy),
   the Kotlin/JVM target version, and frameworks (Spring, Ktor, Android) in play. Resolve
   dependency conflicts with `./gradlew dependencies` rather than guessing.
7. **Verify.** Run the project's build + tests — `./gradlew build` or `./gradlew test` (or the
   module's task) — plus `ktlint`/`detekt` if configured, and report the exact command and
   result.

## Inputs
- The Kotlin code, the build file (`build.gradle.kts`/`settings.gradle.kts`) with the Kotlin/JVM
  target, and the full error text (compiler error, stack trace, dependency tree) for anything
  being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious
  nullability, variance, or coroutine-scope decision.
- The Gradle build/test (and lint) command run and its result; any remaining `!!`, leaked
  platform type, `GlobalScope` use, or unstructured coroutine flagged with why.

## Notes
- Clarity and null-safety over cleverness; do not add a framework where plain Kotlin suffices.
- Never claim structured-concurrency correctness without reasoning through scope, dispatcher,
  and cancellation on the specific path.
- Apply within the project's conventions — match its existing Gradle setup, framework, and style.
