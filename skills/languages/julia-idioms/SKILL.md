---
name: julia-idioms
description: Use when writing, reviewing, or debugging Julia code — multiple dispatch as the core paradigm, the type system (abstract/concrete/parametric types, type stability), performance (type instability, globals, @code_warntype, @inbounds, allocations), broadcasting and vectorization, the package manager and environments (Project.toml/Manifest.toml), modules, metaprogramming/macros, and the two-language-problem solution (calling C/Python/R). Verifies with the project's tooling (julia run, Pkg.test/Test.jl, JET.jl, JuliaFormatter, BenchmarkTools). Common in scientific computing, numerical/ML, and data work. Any agent touching Julia (writer, reviewer, debugger, a scientific-computing team) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [julia, multiple-dispatch, type-stability, performance, pkg, scientific-computing]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Julia Idioms

The substantive Julia capability: write clear, type-stable, performant Julia built around
multiple dispatch, and verify it with the project's tooling.

## When to use this skill
When authoring, reviewing, or debugging Julia and any of these is involved: a dispatch or
type-system question, a performance/type-instability problem, broadcasting/vectorization,
environment/package issues (Project.toml/Manifest.toml), modules, metaprogramming/macros, or
calling into C/Python/R. Common in scientific computing, numerical/ML, and data workloads. Not
needed for trivial edits with no dispatch, type, performance, or build dimension.

## Instructions
1. **Design around multiple dispatch.** Dispatch is Julia's core paradigm — model behavior as
   generic functions with methods specialized on argument types, not as class hierarchies or
   `if isa(...)` chains. Define small abstract type hierarchies and dispatch on them; keep
   functions generic over types rather than over-concretizing. Prefer composition and traits
   (Holy traits) where a single dispatch axis is insufficient.
2. **Use the type system deliberately.** Distinguish abstract types (dispatch anchors, never
   instantiated), concrete types (the actual data layout), and parametric types (`Point{T}`).
   Annotate struct fields with concrete or tightly-bounded types so the layout is known; leave
   function argument types as abstract/parametric as possible for reuse. Prefer immutable
   `struct` over `mutable struct` unless mutation is required.
3. **Write type-stable, allocation-aware code.** Type instability — a variable or return whose
   type the compiler cannot infer — is the dominant Julia performance bug. Keep functions
   type-stable (one inferable return type per call signature), avoid non-const globals in hot
   paths (pass values as arguments or mark `const`), and put work inside functions rather than
   top-level scope. Reach for `@code_warntype` to spot instabilities (red `Any`/`Union`),
   `@inbounds` only after bounds are proven safe, and watch allocations in inner loops.
4. **Broadcast and vectorize idiomatically.** Use dot-broadcasting (`f.(x)`, `x .+ y`) and
   fused broadcast expressions (`@.`) instead of manual loops where it reads clearer and fuses
   allocations; understand that broadcasting is loop-fusing, not a separate vectorized runtime.
   Use views (`@view`, `view`) to avoid copying slices in hot paths.
5. **Manage environments and packages.** Each project has a `Project.toml` (declared deps +
   compat) and a `Manifest.toml` (the exact resolved graph). Activate the project environment
   (`Pkg.activate(".")` / `julia --project=.`) before resolving, adding, or testing; pin compat
   bounds in `[compat]`; never edit `Manifest.toml` by hand. Organize code into `module`s with
   explicit `export`s.
6. **Use metaprogramming sparingly and correctly.** Macros operate on expressions before
   evaluation — reach for them only when a function cannot do the job (DSLs, code generation,
   `@inbounds`/`@views`-style transforms). Respect macro hygiene; expand with `@macroexpand`
   to verify the generated code.
7. **Solve the two-language problem in-language.** Call C with `ccall`, Python via `PythonCall`/
   `PyCall`, and R via `RCall` rather than reimplementing or shelling out — keep numerical hot
   paths in Julia and only bridge to existing libraries at the boundary.
8. **Verify.** Run the project's checks and report the exact command and result:
   - Run a script/REPL: `julia --project=. script.jl`.
   - Tests (Test.jl): `julia --project=. -e 'using Pkg; Pkg.test()'` or run `test/runtests.jl`.
   - Static/inference checks: `JET.jl` (`@report_opt` / `@report_call`) for type and dispatch issues.
   - Formatting: `JuliaFormatter` (`format(".")`).
   - Benchmarks: `BenchmarkTools` (`@benchmark` / `@btime`) for performance and allocation deltas.

## Inputs
- The Julia code, the `Project.toml`/`Manifest.toml` and Julia version, and the full error text
  (stack trace, `@code_warntype` output, dispatch/`MethodError`, Pkg resolution error) for
  anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious
  dispatch choice, type annotation, or `@inbounds`.
- The exact command run (run/test/JET/format/benchmark) and its real result; any remaining type
  instability, unbounded allocation, or unsafe `@inbounds` flagged with why.

## Notes
- Clarity and type stability over cleverness; do not reach for a macro where a function suffices.
- Never claim a hot path is fast without a `@btime`/`@benchmark` measurement on the real path.
- Apply within the project's conventions — match its existing module layout, environment, and style.
