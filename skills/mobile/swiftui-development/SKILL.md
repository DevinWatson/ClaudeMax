---
name: swiftui-development
description: Use when writing, reviewing, or debugging native iOS in Swift/SwiftUI — view composition and identity, @State/@Observable state ownership, NavigationStack navigation, Swift structured concurrency (async/await, actors, Sendable), and SwiftUI performance via Instruments. TRIGGER on stale/not-updating UI, lost state, main-actor/data-race warnings, dropped frames, or broken navigation. Any agent touching SwiftUI (writer, reviewer, performance debugger) can load it. NOT for cross-platform RN/Flutter or store submission.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: mobile
tags: [ios, swift, swiftui, concurrency, instruments]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# SwiftUI Development

The substantive native-iOS capability: reason about the SwiftUI render/identity model, the
modern observation system, Swift structured concurrency, and SwiftUI performance, and write
idiomatic value-typed, declarative Swift — not UIKit habits forced into SwiftUI.

## When to use this skill
When authoring, reviewing, or debugging Swift/SwiftUI and any of the following is involved:
wrong/stale UI or a view that won't update, state lost on re-render, broken navigation, a
data race / main-actor violation / `Sendable` warning, or dropped frames / excessive `body`
re-evaluation. Not needed for trivial edits with no view-identity, state, concurrency, or
perf dimension.

## Instructions
1. **Establish the deployment target first.** Read `Package.swift` or the Xcode project build
   settings (`IPHONEOS_DEPLOYMENT_TARGET`, `SWIFT_VERSION`). The observation API differs
   sharply by OS: `@Observable`/`@Bindable` require iOS 17+; pre-17 uses
   `ObservableObject`/`@StateObject`/`@Published`. Match what the target supports. Classify the
   issue as **correctness**, **concurrency**, or **performance** — the fixes differ.
2. **Get view identity and state ownership right.** Source of truth lives once:
   - `@State` for value-type state a view *owns*; `@Binding` to pass write access down.
   - iOS 17+: an `@Observable` model held by `@State`; pass it plainly or via `@Bindable` for
     two-way bindings. Do NOT wrap `@Observable` in `@StateObject`.
   - Pre-17: `@StateObject` to create, `@ObservedObject` to receive, `@EnvironmentObject` for
     injected shared models. Never create an `ObservableObject` with `@ObservedObject` (it is
     recreated on re-render and loses state).
   - Stable `id` on `List`/`ForEach` items; unstable identity is the most common "state resets"
     and animation-glitch bug.
3. **Use modern navigation.** Prefer `NavigationStack` with a typed `path` /
   `navigationDestination` over the deprecated `NavigationView`. Keep navigation state in the
   model so deep links and programmatic pops work.
4. **Get Swift concurrency right.** Mutate UI state on the main actor — annotate view models
   `@MainActor`. Use `async/await` and `.task {}` (auto-cancels on disappear) over manual
   `Task {}` + lifecycle juggling. Isolate mutable shared state in `actor`s; resolve `Sendable`
   warnings honestly rather than `@unchecked Sendable`. Never block the main thread.
5. **Diagnose performance with evidence.** Excess `body` re-evaluation comes from observing too
   much state or unstable values, not "SwiftUI being slow." Narrow observation, hoist expensive
   work out of `body`, use `@State`-cached values or `task(id:)`, and lazy containers
   (`LazyVStack`/`LazyVGrid`) for long scrolls. Confirm with Instruments (SwiftUI / Time Profiler
   templates) and the `_printChanges()` hook — not guesses.
6. **Verify.** Build and test from the CLI:
   `xcodebuild -scheme <S> -destination 'platform=iOS Simulator,name=iPhone 15' build test`
   (or `swift build`/`swift test` for SPM packages). Confirm no new warnings. Report the exact
   command and its real output.

## Inputs
- The View(s), their parent, and the model/state they consume; the deployment target and Swift
  version; the full build/runtime error or Instruments trace for anything being diagnosed.

## Output
- The root cause stated in SwiftUI terms (identity / observation / actor isolation), then the
  change as focused diffs with a one-line rationale per non-obvious property wrapper.
- The exact `xcodebuild`/`swift` command run and its result; how to verify any performance
  claim in Instruments; any retained warning and why.

## Notes
- Respect the deployment target: do not introduce `@Observable`/`NavigationStack` on a project
  targeting iOS 16 or below.
- Correctness before performance; never sprinkle `EquatableView`/`@State` caching to mask a
  state-ownership bug.
- For a reported bug/crash, combine with a reproduce-then-fix loop using an XCTest / Swift
  Testing case before patching.
