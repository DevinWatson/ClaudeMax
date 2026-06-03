---
name: swift-idioms
description: Use when writing or fixing Swift LANGUAGE code — optionals and safe unwrapping, value vs reference semantics (struct/enum/class), protocol-oriented programming with associated types and generics, error handling (throws/Result), Swift Concurrency (async/await, actors, Sendable, structured concurrency/TaskGroup), and ARC memory management (weak/unowned, retain cycles), built and verified with SwiftPM (swift build/test, swiftformat/swiftlint). Covers server-side, CLI, library, and concurrency Swift — NOT SwiftUI view layout (use the swiftui-development skill for that). Any agent touching Swift (writer, reviewer, debugger, the SwiftUI team) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [swift, concurrency, protocols, generics, arc, swiftpm]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Swift Idioms

The substantive Swift LANGUAGE capability: write clear, safe, correctly-typed and
concurrency-safe Swift — server, CLI, library, and concurrency code — and verify it with the
package's SwiftPM build. This is the language layer (the Swift type system, value semantics,
protocols, concurrency, and memory model), distinct from SwiftUI view construction.

## When to use this skill
When authoring, reviewing, or debugging Swift and any of these is involved: an optional /
force-unwrap question, a value-vs-reference (struct/enum/class) decision, protocol/generic or
associated-type design, error-handling shape (`throws` vs `Result`), a Swift Concurrency
question (async/await, actors, `Sendable`, data races, `TaskGroup`), an ARC retain cycle, or a
SwiftPM build/dependency issue. Not needed for trivial edits with no type/concurrency/memory/build
dimension, and not the right skill for SwiftUI view layout (use the swiftui-development skill).

## Instructions
1. **Handle optionals safely.** Prefer `if let` / `guard let` binding, `??` defaulting, and
   optional chaining over force-unwrap. Reserve `!` for invariants you can prove, and justify
   any force-unwrap or `try!`. Model true absence with `Optional`, not sentinels; avoid implicitly
   unwrapped optionals except where the lifecycle genuinely requires them.
2. **Choose value vs reference semantics deliberately.** Default to `struct`/`enum` value types
   for data and state; reach for `class` only when you need identity, shared mutable state, or
   reference lifecycle. Use `enum` with associated values for closed, exhaustively-switched state.
   Account for copy-on-write on standard collections and for the cost of unnecessary boxing.
3. **Design with protocol-oriented programming.** Express capabilities as protocols with default
   implementations in extensions; use associated types and generics with constraints
   (`where` clauses, `some`/`any`) rather than type erasure where it reads clearer. Prefer
   composition of small protocols over deep class hierarchies; reach for `any` existentials only
   when you actually need heterogeneity.
4. **Handle errors with the right tool.** Use `throws` + typed `do/catch` for synchronous failure
   paths and `Result` where you must store or pass a success/failure value; model domain errors as
   an `Error` enum. Don't swallow errors with `try?` when the failure matters; never use `try!`
   unless the call cannot fail by construction.
5. **Reason about Swift Concurrency for thread-safety.** Identify shared mutable state and protect
   it with an `actor` (or `@MainActor` isolation) rather than ad-hoc locks. Use `async/await` and
   structured concurrency (`async let`, `TaskGroup`) over detached tasks; ensure values crossing
   isolation boundaries are `Sendable`, and treat compiler data-race warnings (strict concurrency)
   as defects to fix, not silence. Never block a thread with a synchronous wait inside async code.
6. **Manage memory under ARC.** Find and break retain cycles — use `[weak self]` / `[unowned self]`
   in escaping closures and on delegate/parent back-references, choosing `weak` (optional, safe)
   vs `unowned` (non-optional, must outlive) deliberately. Watch closures captured by stored
   properties, `Task` captures, and delegate patterns.
7. **Build and depend via SwiftPM.** Read `Package.swift` for the targets, products, dependencies,
   and swift-tools-version. Resolve dependency conflicts deliberately (pin/update in the manifest
   and `Package.resolved`) rather than guessing. Detect whether the project is a SwiftPM package,
   and which server framework (Vapor, Hummingbird) or test framework (XCTest, swift-testing) is in
   play.
8. **Verify.** Run the package's build + tests — `swift build` and `swift test` (or the project's
   script/CI invocation) — and run `swiftformat`/`swiftlint` if the project uses them. Report the
   exact command and the actual result. Hand off to [[verify-by-running]] for the discipline of
   not claiming success you did not observe.

## Inputs
- The Swift code, the `Package.swift` manifest (with swift-tools-version) and `Package.resolved`,
  and the full error text (compiler diagnostic, concurrency/`Sendable` warning, stack trace,
  dependency-resolution output) for anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious
  unwrap, value/reference choice, generic constraint, actor boundary, or capture-list decision.
- The build/test command run and its result; any remaining force-unwrap, `try!`, data-race
  window, or retain cycle flagged with why.

## Notes
- Clarity, value semantics, and concurrency safety over cleverness; do not add a framework where
  plain Swift and the standard library suffice.
- Never claim concurrency-safety without reasoning through isolation and `Sendable` on the
  specific path; a passing build with strict-concurrency warnings is not safe.
- Apply within the project's conventions — match its existing SwiftPM layout, framework, and style.
- Scope boundary: this skill is the Swift LANGUAGE (server/CLI/library/concurrency). SwiftUI view
  layout, state-driven view updates, and UI rendering belong to the swiftui-development skill.
