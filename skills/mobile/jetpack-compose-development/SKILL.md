---
name: jetpack-compose-development
description: Use when writing, reviewing, or debugging native Android in Kotlin + Jetpack Compose — composables and recomposition, state hoisting / UDF, the Android lifecycle and process death, coroutines/Flow, Navigation-Compose, and Gradle builds. TRIGGER on UI not updating, state lost on rotation/process death, leaked coroutines or main-thread work, or excessive recomposition / jank. Any agent touching Compose (writer, reviewer, performance debugger) can load it. NOT for cross-platform RN/Flutter or iOS/SwiftUI.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: mobile
tags: [android, kotlin, jetpack-compose, coroutines, gradle]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Jetpack Compose Development

The substantive native-Android capability: reason about Compose recomposition and state, the
Android lifecycle, and Kotlin coroutines/Flow, and write unidirectional-data-flow UI with
hoisted state — not mutable-view-holding code.

## When to use this skill
When authoring, reviewing, or debugging Kotlin/Compose and any of the following is involved:
UI not updating, state lost on rotation/process death, broken navigation, leaked coroutines or
work on the main dispatcher, Flow-collection bugs, or excessive recomposition / jank. Not
needed for trivial edits with no state, lifecycle, concurrency, or perf dimension.

## Instructions
1. **Establish the build context first.** Read `build.gradle(.kts)` and `libs.versions.toml`:
   confirm the Compose BOM/compiler version, `minSdk`/`targetSdk`, and which libs are in play
   (Hilt, Navigation-Compose, Room, kotlinx-coroutines). Read the composable(s), their hosting
   screen, and the `ViewModel` that feeds them. Classify the issue as **correctness**,
   **concurrency**, or **performance** — the fixes differ.
2. **Hoist state and follow UDF.** Composables are functions of state and emit events upward.
   - `remember`/`rememberSaveable` for UI-only state; survive config change/process death with
     `rememberSaveable` or a `ViewModel` + `SavedStateHandle`.
   - Hold screen state in a `ViewModel` as immutable `StateFlow<UiState>`, collected with
     `collectAsStateWithLifecycle()` (not bare `collectAsState`, which keeps collecting in the
     background). Pass state down, events up; keep composables stateless where possible.
   - Use stable `key`s in `LazyColumn`/`LazyRow` items; unstable keys cause needless
     recomposition and scroll-position loss.
3. **Use Navigation-Compose correctly.** Type-safe routes, a single `NavHost`, and hoist
   navigation events out of composables (emit an event, let the screen host call `navigate`).
   Avoid passing the `NavController` deep into the tree.
4. **Get coroutines/Flow right.** Launch UI-scoped work in `viewModelScope`; never block the
   main thread — move CPU/IO work to `Dispatchers.Default`/`IO`. Use `stateIn`/`shareIn` with
   `WhileSubscribed` for cold→hot upstreams, `flowOn` for upstream dispatch. Respect structured
   concurrency; don't leak `GlobalScope`.
5. **Diagnose performance with evidence.** Recomposition comes from unstable parameters or
   reading state too high in the tree, not "Compose being slow." Check stability (prefer
   immutable types / `@Immutable`/`@Stable`, stable lambdas), use Layout Inspector's
   recomposition counts and the Compose compiler metrics report. For leaks/jank, use LeakCanary
   and the Profiler / `perfetto`.
6. **Verify.** Build/test from the CLI: `./gradlew :app:assembleDebug`,
   `./gradlew testDebugUnitTest`, and `./gradlew lint`. Confirm they pass with no new warnings;
   report the exact commands and real output.

## Inputs
- The composable(s), their hosting screen, and the `ViewModel`; the Compose BOM/compiler
  version and `minSdk`/`targetSdk`; the full crash/build output or profiler trace being
  diagnosed.

## Output
- The root cause in Compose/lifecycle/coroutine terms, then the change as focused diffs with a
  one-line rationale per non-obvious `remember`/scope/dispatcher choice.
- The exact `./gradlew` commands run and results; how to verify any recomposition claim (Layout
  Inspector / compiler metrics); any retained warning.

## Notes
- Respect `minSdk`: do not use APIs above the supported level without a guarded fallback.
- Correctness before performance; never add `@Stable`/`key` hacks to mask a state-hoisting or
  lifecycle bug.
- For a reported bug/crash, combine with a reproduce-then-fix loop using a JUnit / Compose UI
  test (`createComposeRule`) before patching.
