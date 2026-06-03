---
name: dart-idioms
description: Use when writing or fixing Dart LANGUAGE code — sound null safety, async/await with Futures and Streams, isolates and concurrency, the type system (mixins, extension methods, sealed/final classes, records and patterns in Dart 3), const and immutability, generics, error handling, package structure and pub, and FFI. Verifies with dart compile/run, dart test, dart analyze, and dart format. This is Dart the language (CLI, server, packages, async) — NOT Flutter widgets/UI, which is flutter-development. Any agent touching Dart (writer, reviewer, debugger, the Flutter team) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [dart, null-safety, async, isolates, pub, dart3]
version: 1.0.0
license: MIT
status: stable
---

# Dart Idioms

The substantive Dart LANGUAGE capability: write clear, sound, modern Dart — CLI tools,
servers, and reusable packages — and verify it with the Dart toolchain. This is Dart the
language (async, isolates, type system, packages, FFI), distinct from Flutter widget/UI work,
which belongs to the [[flutter-development]] skill.

## When to use this skill
When authoring, reviewing, or debugging Dart code and any of these is involved: a null-safety
or type-system question (mixins, extension methods, sealed/final classes, records, patterns),
async/Future/Stream correctness, isolate-based concurrency, const/immutability, generics,
error handling, package layout and `pub` dependency resolution, or FFI. Not needed for trivial
edits with no language dimension, and not the right tool for Flutter widget trees, build
methods, or UI state — use [[flutter-development]] for those.

## Instructions
1. **Reason in sound null safety.** Keep types non-nullable by default; reach for `?` only when
   absence is real. Use `late` deliberately (initialization you can guarantee), prefer
   `??`/`?.`-based flow with type promotion, and justify every `!` null-assertion. Make invalid
   states unrepresentable rather than null-checking everywhere.
2. **Get async right.** Distinguish a single `Future` from a `Stream` of events. Always `await`
   or deliberately fire-and-forget (never silently drop a `Future`); use `Future.wait` for
   concurrency, `Stream`/`StreamController`/`async*` for event sequences, and cancel
   subscriptions. Remember Dart is single-threaded per isolate with a cooperative event loop —
   long synchronous work blocks it.
3. **Use isolates for real parallelism.** CPU-bound work goes on an isolate (`Isolate.run` for
   one-shot, `Isolate.spawn`/ports for long-lived). Isolates share no memory — pass only
   sendable messages and design the message protocol explicitly.
4. **Exploit the Dart 3 type system.** Records and pattern matching (`switch` expressions,
   destructuring, exhaustiveness) for structured data and control flow; `sealed`/`final`/`base`
   class modifiers for closed/controlled hierarchies; mixins for shared behavior; extension
   methods to augment types without subclassing; generics with bounds where they add safety.
   Prefer `const` constructors and immutable data for sharable, canonicalized values.
5. **Handle errors idiomatically.** Throw typed exceptions/errors; use `try/catch/on`,
   `rethrow`, and `Future`/`Stream` error channels correctly; never swallow errors silently.
   Distinguish `Error` (programmer bug) from `Exception` (expected condition).
6. **Structure the package and resolve deps deliberately.** Respect `pubspec.yaml`, `lib/`
   public API vs. `lib/src/` privates, and `part`/`library` boundaries. Use
   `dart pub get`/`dart pub upgrade` and read the resolved versions; pin or constrain explicitly
   rather than guessing. For native interop, use `dart:ffi` with correct memory ownership.
7. **Verify with the Dart toolchain.** Run `dart analyze` (zero analyzer issues),
   `dart format --output=none --set-exit-if-changed .` (formatting), `dart test` (or the
   package's test command), and `dart compile`/`dart run` where a build/run check matters.
   Report the exact commands and their real results.

## Inputs
- The Dart code, the `pubspec.yaml` (with the Dart SDK constraint), and the full error text
  (analyzer diagnostic, stack trace, `pub` resolution conflict) for anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious
  null-assertion, isolate boundary, or pattern.
- The toolchain commands run (`dart analyze`/`dart test`/`dart format`/`dart compile`) and their
  results; any remaining `!`, dropped `Future`, blocked event loop, or analyzer suppression
  flagged with why.

## Notes
- Clarity and soundness over cleverness; do not add a package where the SDK suffices.
- Never claim parallelism without an isolate — async alone does not give you a second thread.
- This skill is Dart-the-language only. Anything that renders, lays out, or manages widget/UI
  state is Flutter — defer to [[flutter-development]] and the Flutter framework team.
- Apply within the project's conventions — match its existing package layout, lints
  (`analysis_options.yaml`), and style.
