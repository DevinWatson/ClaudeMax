---
name: haskell-idioms
description: Use when writing, reviewing, or debugging Haskell code — purity and laziness (space leaks, strictness with seq/BangPatterns), the type system (type classes, kinds, GADTs, higher-kinded and higher-rank types), Functor/Applicative/Monad and do-notation, Maybe/Either error handling, Foldable/Traversable, newtype and deriving, monad transformers and effect systems (mtl/ReaderT pattern), STM and concurrency, common extensions, and Cabal/Stack builds. Verifies with the project's build and tooling (cabal/stack build & test, ghcid, HLint, ormolu/fourmolu, hspec/QuickCheck). Any agent touching Haskell (writer, reviewer, debugger) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [haskell, ghc, type-classes, monads, laziness, cabal, stack]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Haskell Idioms

The substantive Haskell capability: write clear, well-typed, lazily-correct Haskell that does
not leak space, and verify it with the project's build and test tooling.

## When to use this skill
When authoring, reviewing, or debugging Haskell and any of these is involved: a type-class /
instance or type-inference error, a laziness/space-leak or strictness question, a
Functor/Applicative/Monad design choice, error handling via `Maybe`/`Either`/exceptions, a
monad-transformer or effect-system stack, STM/concurrency, a `LANGUAGE` extension decision, or a
Cabal/Stack build and dependency issue. Not needed for trivial edits with no type, laziness, or
build dimension.

## Instructions
1. **Keep functions pure; isolate effects.** Push `IO` to the edges and keep the core total and
   referentially transparent. Model effects in the type (`IO`, `STM`, a transformer stack, or an
   effect library) rather than reaching for `unsafePerformIO`. Prefer total functions; avoid
   partial ones (`head`, `fromJust`, incomplete patterns) — handle the empty/absent case.
2. **Reason about laziness explicitly.** Evaluation is non-strict by default; a thunk pile-up is
   a space leak, not a property of the data. For strict accumulation use `foldl'`, strict fields
   (`!`), `BangPatterns`, or `seq`/`$!`; reach for `deepseq` (`force`/`rnf`) when WHNF is not
   enough. Diagnose leaks with `+RTS -s` / heap profiling rather than guessing where to add a
   bang.
3. **Design with the type system.** Use type classes for genuine, law-abiding abstractions, and
   prefer `newtype` over `data` for zero-cost wrappers and instance selection. Reach for the
   richer machinery — GADTs, higher-kinded and higher-rank types, kinds — only when it removes a
   real class of bug; do not over-engineer the types. Derive instances (`deriving`,
   `GeneralizedNewtypeDeriving`, `DerivingVia`, `deriving stock/anyclass`) instead of writing
   them by hand where the law-abiding derivation is correct.
4. **Use the Functor/Applicative/Monad hierarchy idiomatically.** Choose the weakest abstraction
   that works (`fmap` < `<*>`/`liftA2` < `>>=`); use `do`-notation for monadic sequencing and
   `traverse`/`for`/`sequenceA` over hand-written recursion across `Foldable`/`Traversable`.
   Handle absence/failure with `Maybe`/`Either` (and `ExceptT`) in pure code; reserve runtime
   exceptions for truly exceptional `IO` and catch them at the right boundary.
5. **Pick the effect strategy deliberately.** For most apps the `ReaderT env IO` pattern or an
   `mtl` stack is the pragmatic default; consider an effect system (e.g. `effectful`,
   `polysemy`, `fused-effects`) only when its benefits outweigh its cost. Keep the stack shallow
   and the constraints (`MonadReader`, `MonadError`, `MonadIO`) precise. For concurrency prefer
   `STM` (`TVar`/`atomically`) and the `async` library over raw `MVar`/`forkIO` juggling; never
   hold a transaction across a blocking call.
6. **Manage extensions and the build.** Enable `LANGUAGE` extensions per-need (common:
   `OverloadedStrings`, `DeriveGeneric`, `GADTs`, `TypeApplications`, `ScopedTypeVariables`,
   `RecordWildCards`, `LambdaCase`) and prefer a project-wide `default-extensions` for the agreed
   set. Detect the build — Cabal (`*.cabal`, `cabal.project`) or Stack (`stack.yaml`,
   `package.yaml`) — the GHC version, and the resolver/constraints before changing dependencies;
   resolve version clashes by pinning/allow-newer deliberately rather than guessing.
7. **Verify.** Build and test with the project's toolchain — `cabal build` / `cabal test` or
   `stack build` / `stack test` (use `ghcid` for a fast feedback loop). Run `hlint` for idiom
   warnings and `ormolu`/`fourmolu` for formatting, and run the test suite (`hspec`, `tasty`,
   `QuickCheck` properties). Report the exact command and its real result.

## Inputs
- The Haskell source, the build files (`*.cabal` / `cabal.project` / `stack.yaml` / `package.yaml`)
  with the GHC version and resolver, the enabled extensions, and the full error text (GHC type
  error, `hlint` hint, failing test, or heap/`+RTS -s` output) for anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious
  type signature, strictness annotation, or instance.
- The build/test command run and its result; any remaining partial function, suspected space
  leak, or unlawful instance flagged with why.

## Notes
- Clarity, totality, and predictable space behavior over cleverness; do not add an effect
  library or advanced type machinery where plain functions and `Maybe`/`Either` suffice.
- Never claim code is leak-free or an instance is lawful without reasoning it through (or
  profiling/QuickCheck-ing) on the specific path.
- Apply within the project's conventions — match its existing build (Cabal vs. Stack), extension
  set, effect strategy, formatter, and style.
