---
name: clojure-idioms
description: Use when writing, reviewing, or debugging Clojure/JVM-Lisp code — immutable persistent data structures, the seq abstraction and laziness, pure functions and functional composition, threading macros (->/->>), destructuring, multimethods and protocols, namespaces, state via atoms/refs/agents and STM, core.async channels/go blocks, spec/malli validation, REPL-driven development, and Java interop. Verifies with the project's build (clj/lein/deps.edn, clojure.test or kaocha, clj-kondo, cljfmt). Any agent touching Clojure (writer, reviewer, debugger) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [clojure, jvm, functional, repl, core-async, spec]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Clojure Idioms

The substantive Clojure capability: write clear, data-oriented, functionally-composed Clojure
with disciplined state and verify it with the project's build and the REPL.

## When to use this skill
When authoring, reviewing, or debugging Clojure and any of these is involved: data
transformation over persistent collections, lazy-seq behavior, state management
(atoms/refs/agents/STM), concurrency via core.async, polymorphism via multimethods/protocols,
data validation with spec/malli, Java interop, or a deps.edn/lein/clj build or dependency
issue. Not needed for trivial edits with no data-modeling, state, concurrency, or build
dimension.

## Instructions
1. **Model the problem as data, transformed by pure functions.** Reach for the built-in
   persistent collections (maps, vectors, sets, lists) and the rich core sequence library
   (`map`/`filter`/`reduce`/`group-by`/`into`/`transduce`) before writing custom control flow.
   Keep functions pure; isolate side effects at the edges. Compose small functions rather than
   nesting deeply.
2. **Understand the seq abstraction and laziness.** Know which operations are lazy
   (`map`/`filter`/`take`/`for`) and the hazards — head retention, side effects inside lazy
   pipelines, exceptions surfacing only on realization, and unconsumed laziness holding
   resources open. Force realization deliberately with `doall`/`dorun`/`into`/`vec`, or use
   `transduce`/eager `reduce` when laziness is wrong. Never put I/O or side effects in a lazy
   seq that may not be fully consumed.
3. **Write idiomatic flow with threading macros and destructuring.** Use `->` for
   value-first/object-style chains and `->>` for collection/sequence pipelines; reach for
   `as->`, `cond->`, `some->` where the data position varies or may be nil. Destructure
   function args and `let` bindings (associative `{:keys [...]}` and sequential) instead of
   manual `get`/`nth`. Prefer `when`/`if-let`/`when-let`/`cond` over deeply nested `if`.
4. **Choose polymorphism deliberately — protocols vs. multimethods.** Use protocols for
   fast, type-based dispatch and a clear set of operations on an abstraction; use multimethods
   when dispatch is on arbitrary computed values (a tag, a derived key, a hierarchy). Define
   namespaces cleanly: one concept per namespace, explicit `:require` with aliases, no
   `:refer :all`, and no cyclic dependencies.
5. **Manage state with the right reference type, never with mutation.** `atom` for
   uncoordinated synchronous state (`swap!`/`reset!` with pure update fns); `ref` + `dosync`
   for coordinated multi-item updates under STM; `agent` for asynchronous, serialized updates.
   Keep update functions pure and side-effect-free (they may retry). For channel-based
   concurrency use `core.async` — `chan`, `>!`/`<!` inside `go`, `>!!`/`<!!` outside,
   `alts!`, and bounded buffers — and always close channels and bound buffering to avoid
   leaks and unbounded backpressure.
6. **Validate data at boundaries with spec or malli.** Define specs/schemas for external
   inputs and key internal data; use `s/valid?`/`s/conform`/`s/explain` (or malli's
   `m/validate`/`m/explain`) at trust boundaries, and consider instrumentation or generative
   testing where it pays off. Keep validation at the edges, not sprinkled through pure logic.
7. **Do Java interop cleanly.** Use `(.method obj args)`, `(Klass/staticMethod ...)`,
   `(Klass. ctor-args)`, `doto`, and `..`; add type hints to remove reflection on hot paths;
   manage resources with `with-open`; and convert at the boundary between Java collections and
   Clojure persistent collections rather than threading mutable Java types through the code.
8. **Develop and diagnose at the REPL.** Reproduce behavior with small forms, inspect
   intermediate values, and confirm a fix interactively before committing it to a file. Prefer
   evaluating a focused form over re-running the whole build for fast iteration.
9. **Verify.** Run the project's checks and report the exact command and result: tests with
   `clojure -M:test` / `lein test` / `clj -X:test` or **kaocha** (`bin/kaocha` /
   `clojure -M:kaocha`); lint with **clj-kondo** (`clj-kondo --lint src`); and formatting with
   **cljfmt** (`cljfmt check`). Detect the build (`deps.edn`, `project.clj`, or `build.clj`)
   first and use its real aliases/tasks.

## Inputs
- The Clojure code, the build file (`deps.edn` / `project.clj`) with its aliases, and the full
  error text (stack trace, `clj-kondo` output, spec `explain` data) for anything being
  diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious
  reference type, lazy-seq decision, or dispatch choice.
- The build/lint/test command run and its result; any reflection warning, head-retention risk,
  unbounded channel, or impure update fn flagged with why.

## Notes
- Simplicity and data-orientation over cleverness; do not add a library where a core function
  or a plain map suffices.
- Never claim correctness of stateful or concurrent code without reasoning through retries
  (atoms/refs), realization (lazy seqs), and channel lifecycle (core.async) on the specific path.
- Apply within the project's conventions — match its existing build, namespaces, and style.
