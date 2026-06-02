---
name: rust-ownership
description: Use when writing or fixing Rust where ownership, lifetimes, traits, or async correctness are in play — explains borrow-checker and lifetime errors in real terms, restructures ownership before reaching for clone/unsafe, gets Send/Sync/'static bounds right, and verifies with cargo check/clippy/test. TRIGGER on borrow-checker fights, trait-resolution errors, async Send issues, or unsafe justification. Any agent touching Rust (writer, reviewer, debugger) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [rust, ownership, lifetimes, traits, async, cargo]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Rust Ownership

The substantive Rust capability: reason correctly about ownership, borrowing, lifetimes,
the trait system, and async `Send`/`Sync` bounds, and write code that works *with* the
borrow checker rather than around it.

## When to use this skill
When authoring, reviewing, or debugging Rust and any of the following is involved: a
borrow-checker or lifetime error, a trait-bound or coherence error, an async
`Send`/`Sync`/`'static` problem, a decision about `unsafe`, or designing an
ownership-friendly API. Not needed for trivial edits with no ownership/trait dimension.

## Instructions
1. **Diagnose in real terms.** Read rustc's error *codes and suggestions* — they are precise.
   Explain the actual cause: move vs. borrow, overlapping `&mut`, lifetime variance,
   `'static` bounds, two-phase borrows. For trait errors, reason about coherence, blanket
   impls, orphan rules, and unsatisfied/ambiguous bounds — not guesses.
2. **Restructure ownership before escape hatches.** Prefer borrowing, splitting a struct so
   fields borrow independently, passing `&mut` through, or returning owned data. Reach for
   `Rc`/`RefCell`/`Arc<Mutex<_>>` only when shared ownership is genuinely required — not to
   silence the checker. Treat `.clone()` spam and gratuitous `unsafe` as smells.
3. **Get async bounds right.** For `Send` futures, do not hold a non-`Send` guard (e.g. a
   `MutexGuard`, `Rc`, `RefCell` borrow) across an `.await`; scope the lock or use an async-aware
   primitive. Track `'static` requirements on spawned tasks and trait-object futures.
4. **Write idiomatic Rust.** `Result` with `?`, `Option` combinators, iterators over manual
   loops, exhaustive `match`, newtypes and enums to make illegal states unrepresentable, and
   the standard error-handling crates (`thiserror` for libraries, `anyhow` for applications)
   matching what the crate already uses.
5. **Justify any `unsafe`.** State the invariant being upheld and why it holds, wrap it in a
   safe abstraction, and document it with a `// SAFETY:` comment. Prefer a safe alternative.
6. **Verify.** Run `cargo check`, `cargo clippy -- -D warnings`, `cargo fmt --check`, and
   `cargo test` (add `--all-features` or specific features as the crate needs). Report the
   exact commands and their real output.

## Inputs
- The Rust code, the relevant `Cargo.toml` (edition, features, deps), and the full compiler
  output (error codes intact) for any error being diagnosed.

## Output
- A precise explanation of the ownership/lifetime/trait cause in the code's own terms.
- Idiomatic Rust that compiles, with a one-line rationale per non-obvious lifetime/trait/bound.
- The verify commands run and their results; any remaining `unsafe`/`clone`/`unwrap` flagged
  with why it is acceptable.

## Notes
- Soundness and clarity over cleverness; never silence the borrow checker with `unsafe`.
- For a reported bug, combine with a reproduce-then-fix loop using `cargo test`.
- Apply within the project's existing conventions; do not introduce a new error-handling
  crate or async runtime the crate does not already depend on without saying why.
