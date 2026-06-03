---
name: ocaml-idioms
description: Use when writing, reviewing, or debugging OCaml — algebraic data types and exhaustive pattern matching, the module system (modules, signatures, functors), the type system and Hindley-Milner inference, immutability vs refs/mutable records, option/result error handling, the standard libraries (Stdlib vs Base/Core), Lwt/Async and OCaml 5 effects/domains for concurrency, the Dune build system and opam, ppx preprocessors, and verification (dune build/test, ocamlformat, alcotest/ounit, merlin, odoc). Any agent touching OCaml (writer, reviewer, debugger) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [ocaml, functional, pattern-matching, modules, functors, dune, opam, lwt]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# OCaml Idioms

The substantive OCaml capability: write clear, well-typed, total OCaml that uses the module
system and pattern matching idiomatically, and verify it with the project's Dune/opam tooling.

## When to use this skill
When authoring, reviewing, or debugging OCaml and any of these is involved: a variant /
pattern-match design or a non-exhaustive-match warning, a type-inference or type-error puzzle, a
module/signature/functor design choice, an immutability-vs-`ref`/mutable-record decision, error
handling via `option`/`result`/exceptions, a Stdlib-vs-`Base`/`Core` choice, an Lwt/Async or
OCaml 5 effects/domains concurrency question, a `ppx` preprocessor decision, or a Dune/opam build
and dependency issue. Not needed for trivial edits with no type, module, or build dimension.

## Instructions
1. **Model data with variants and records; match exhaustively.** Use algebraic data types
   (variants, including polymorphic variants where they earn it) and records to make illegal
   states unrepresentable. Pattern-match exhaustively — never silence a non-exhaustive-match
   warning with a catch-all `_` that hides a real case; treat compiler warnings as errors where
   the project does (`-w +a` / `(flags ...)`). Use `when` guards and or-patterns sparingly and
   keep matches readable.
2. **Let the type system work; annotate at boundaries.** Trust Hindley-Milner inference for
   locals, but annotate public function signatures, `.mli` interface files, and anything where
   inference is surprising or the error is opaque. Resolve type errors by reading the inferred vs.
   expected type, not by adding `Obj.magic`. Use the type system (phantom types, GADTs, abstract
   types in signatures) to enforce invariants only when it removes a real class of bug — do not
   over-engineer.
3. **Design with the module system.** Use modules for namespacing and encapsulation, `.mli`
   signatures to hide representation and pin the public surface, and functors to parameterize over
   a signature rather than copy-pasting. Prefer abstract types in interfaces over exposing the
   concrete representation. Keep functor application and first-class modules for genuine
   abstraction, not for cleverness.
4. **Default to immutability; isolate mutation.** Prefer immutable values and persistent data
   structures; reach for `ref`, mutable record fields, or `array`/`Hashtbl` only where a measured
   need (performance, an inherently stateful resource) justifies it, and keep the mutable region
   small and local. Be explicit about `ref` aliasing.
5. **Handle errors in the type, not by surprise.** Model expected absence with `option` and
   expected failure with `result` (or a dedicated variant); reserve exceptions for truly
   exceptional / programmer-error cases and document any function that raises. Use `Result`/`Option`
   combinators (`map`/`bind`/`let*` via a monad-let ppx like `ppx_let`) rather than nested matches
   where it reads clearer. Do not let a partial function (`List.hd`, `Option.get`) sit on an
   untrusted path.
6. **Pick the standard library and concurrency model deliberately.** Detect whether the project
   uses Stdlib or Jane Street `Base`/`Core` (and `Stdio`) and follow it — do not mix idioms
   needlessly. For concurrency, identify the model: `Lwt` or `Async` (monadic, single-domain
   cooperative I/O — never block the scheduler) vs. OCaml 5 effect handlers and `Domain`-based
   parallelism; keep to the project's model and respect its scheduling/locking discipline. Apply
   `ppx` preprocessors (`ppx_deriving`, `ppx_let`, `ppx_sexp_conv`, `ppx_inline_test`) only as the
   project already does.
7. **Manage the Dune build and opam environment.** Detect the build from `dune-project`,
   `dune` files, and the `*.opam` / `dune-project` package stanzas; understand libraries vs.
   executables vs. tests, public vs. private names, and the dependency list before changing it.
   Resolve dependency issues through opam (`opam install`, pins, version constraints) deliberately
   rather than guessing; respect the project's compiler switch.
8. **Verify.** Build and test with the project's toolchain — `dune build` and `dune test` (or
   `dune runtest`), using `merlin` for in-editor type feedback. Run `dune build @fmt` /
   `ocamlformat` for formatting, run the test suite (`alcotest`, `ounit2`, or `ppx_inline_test`),
   and build docs with `odoc` (`dune build @doc`) where relevant. Report the exact command and its
   real result.

## Inputs
- The OCaml source and any `.mli` interfaces, the build files (`dune-project`, `dune`, `*.opam`)
  with the compiler switch and dependencies, the concurrency model and `ppx` set in use, and the
  full error text (type error, non-exhaustive-match warning, failing test, or build/opam error)
  for anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious type
  annotation, functor, or use of mutation.
- The build/test command run and its result; any remaining non-exhaustive match, partial function
  on an untrusted path, or unjustified `ref`/`Obj.magic` flagged with why.

## Notes
- Clarity, totality, and well-typed boundaries over cleverness; do not add a functor, GADT, or
  ppx where plain variants and functions suffice.
- Never silence a non-exhaustive-match or type warning to make it compile — fix the case.
- Apply within the project's conventions — match its existing standard library (Stdlib vs.
  Base/Core), concurrency model (Lwt vs. Async vs. effects), ppx set, formatter, and style.
