---
name: scala-idioms
description: Use when writing or fixing Scala code — case classes, pattern matching and sealed-trait ADTs, immutability and expression-oriented style, Option/Either/Try, for-comprehensions, type classes via given/using (Scala 3) or implicits (Scala 2), variance and higher-kinded types, the collections library, functional effect systems (Cats Effect / ZIO) and Futures, and JVM interop. Verifies with the project's build (sbt compile/test or scala-cli) plus scalafmt and scalafix/wartremover. Any agent touching Scala (writer, reviewer, debugger, a Spark/Akka team) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [scala, jvm, functional, cats-effect, zio, sbt]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Scala Idioms

The substantive Scala capability: write clear, type-safe, idiomatic Scala — favoring
immutability, ADTs, and total functions over partial, mutable code — and verify it with the
project's build.

## When to use this skill
When authoring, reviewing, or debugging Scala and any of these is involved: modeling data with
case classes and sealed-trait ADTs, exhaustive pattern matching, error handling via
Option/Either/Try, for-comprehensions over monadic types, type-class derivation and resolution
(given/using or implicits), variance or higher-kinded type errors, collection-API choices,
effect-system code (Cats Effect / ZIO) or `Future` concurrency, or JVM/Java interop. Also when a
Scala 2 vs Scala 3 difference is in play. Not needed for a trivial one-line edit with no typing,
effect, or build dimension.

## Instructions
1. **Detect the dialect and build first.** Read `build.sbt` / `project/build.properties` (or the
   `//> using scala` directive for scala-cli) to determine Scala 2 vs 3 and the exact version,
   the build tool (sbt or scala-cli), and the core libraries (Cats Effect, ZIO, Akka/Pekko,
   Spark, http4s, Play). The dialect changes the right syntax — do not assume Scala 3.
2. **Model data as immutable ADTs.** Use `case class` for product types and a `sealed trait` /
   `sealed abstract class` (Scala 2) or `enum` / sealed `trait` (Scala 3) for sum types so the
   compiler can check exhaustiveness. Prefer `val` over `var`, immutable collections, and
   expression-oriented code where every block yields a value. Keep functions total.
3. **Pattern-match exhaustively and safely.** Match on sealed hierarchies and let the compiler
   warn on missing cases (`-Wunused`, `-Xfatal-warnings` if the project enables them). Avoid
   matching that can throw `MatchError`; handle every constructor or use a sealed default.
4. **Handle absence and failure with the right type.** `Option` for optionality, `Either[E, A]`
   for typed errors, `Try` for exception-bearing interop. Compose them with `map`/`flatMap` and
   `for`-comprehensions rather than nested matches; reserve exceptions for truly exceptional,
   non-recoverable paths.
5. **Use type classes idiomatically per dialect.** In **Scala 3** define instances with `given`
   and require them with `using`; derive with `derives` where available. In **Scala 2** use
   `implicit val`/`implicit def` instances and `implicit` parameters (or context bounds
   `[A: TypeClass]`). Keep instance resolution unambiguous; place instances in the companion
   object. Avoid implicit conversions unless the project already relies on them.
6. **Reason about variance and higher-kinded types deliberately.** Annotate variance (`+A`/`-A`)
   to match how the type produces vs. consumes `A`; use `F[_]` higher-kinded abstractions
   (`Functor`, `Monad`, tagless-final `F[_]: Sync`) where the project does. Diagnose
   variance/HKT compiler errors by the producer/consumer position, not by trial-and-error.
7. **Choose collections and operations well.** Prefer immutable `List`/`Vector`/`Map`/`Set`;
   pick `Vector` for indexed access, `List` for head/tail recursion. Use `view` for lazy
   pipelines on large data, and avoid hidden O(n) operations (e.g. `list(i)`, repeated `++`).
8. **Get concurrency and effects right.** For effect systems, keep effects suspended in `IO` /
   `ZIO` and run them only at the edge (`IOApp` / `ZIOAppDefault`); use the library's
   concurrency primitives (`Ref`, `Resource`/`Scope`, fibers) instead of raw threads, and never
   block an async pool. For `Future`, thread the `ExecutionContext` explicitly and avoid
   `Await`/blocking in production paths. Make resource acquisition/release safe under
   cancellation.
9. **Handle JVM/Java interop carefully.** Convert collections with `scala.jdk.CollectionConverters`,
   wrap nullable Java returns in `Option(...)`, and bridge Java exceptions into `Try`/`Either` at
   the boundary so the Scala core stays total.
10. **Verify.** Run the project's build: `sbt compile` and `sbt test` (or `sbt "testOnly ..."`,
    or `scala-cli test`); apply `scalafmt` (`sbt scalafmtCheckAll` / `scalafmt --check`); and run
    the lint/refactor checks the project configures (`sbt "scalafixAll --check"` or wartremover
    via compiler flags). Report the exact commands and their real results.

## Inputs
- The Scala source, the build definition (`build.sbt` / `build.properties` / `//> using`
  directives) with the Scala version, and the full error text (compiler error, stack trace,
  failed test output, scalafix diagnostic) for anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious
  given/implicit, variance annotation, or effect-composition choice.
- The build/test command run and its result; any remaining `var`, partial match, `null`-leak, or
  blocking call flagged with why, and any Scala 2 vs 3 assumption made stated explicitly.

## Notes
- Type-safety and totality over cleverness; do not reach for advanced type-level machinery where
  a plain ADT and pattern match suffice.
- Never claim an effectful path is safe without reasoning about cancellation and resource release
  on the specific code path.
- Apply within the project's conventions — match its dialect, effect system, collection style,
  and formatting/lint configuration rather than imposing a different stack.
