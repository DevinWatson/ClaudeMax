---
name: zig-idioms
description: Use when writing, reviewing, or debugging Zig code — explicit allocators and manual memory management (no hidden allocations), errdefer/defer and error unions/error sets, optionals, comptime metaprogramming and generics-via-types, no hidden control flow, slices vs arrays vs pointers, packed/extern structs, C interop (@cImport / translate-c), build.zig and the build system, and cross-compilation. Verifies with zig build / zig test, zig fmt, std.testing, and GeneralPurposeAllocator leak detection. Any agent touching Zig (writer, reviewer, debugger, a systems/embedded team) can load it. Note Zig is pre-1.0 — language and std churn across versions.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [zig, systems, allocators, comptime, c-interop]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Zig Idioms

The substantive Zig capability: write clear, leak-free, correctly-typed Zig with explicit
memory management and no hidden control flow, and verify it with the project's build and tests.

## When to use this skill
When authoring, reviewing, or debugging Zig and any of these is involved: an allocator or
memory-lifetime question, an error-handling (`error{}`/`!T`/`errdefer`) or optional (`?T`)
issue, a comptime/generics design, a slice-vs-array-vs-pointer mistake, packed/extern struct
layout, C interop via `@cImport`/`translate-c`, a `build.zig`/`build.zig.zon` problem, or a
cross-compilation target. Not needed for a trivial edit with no memory, error, comptime, or
build dimension.

## Instructions
1. **Pin the Zig version first.** Zig is pre-1.0; syntax, std APIs, and the build API change
   between releases (e.g. `async`, `usingnamespace`, allocator and `std.Build` signatures).
   Read the project's `build.zig.zon` / CI / toolchain pin and run `zig version`; match that
   version's idioms and std, and flag any API that differs from what the toolchain provides.
2. **Make every allocation explicit.** Zig has no hidden allocations — functions that allocate
   take an `Allocator` parameter. Thread the allocator through, pair every `alloc`/`create`
   with a `free`/`destroy`, and use `defer`/`errdefer` so cleanup runs on both the success and
   the error path. Prefer `std.heap.GeneralPurposeAllocator` (or `std.testing.allocator` in
   tests) for leak detection during development; use an arena (`std.heap.ArenaAllocator`) where
   lifetimes are scoped and bulk-freed. Never return a slice or pointer into memory the caller
   does not own or that outlives its allocator.
3. **Handle errors with error unions and sets, not sentinels.** Use `!T` / explicit
   `error{...}` sets, propagate with `try`, and recover with `catch`. Reserve `defer` for
   unconditional cleanup and `errdefer` for cleanup that must happen only when the function
   errors out (e.g. free a just-allocated buffer before returning the error). Do not discard an
   error with `catch unreachable` unless it is provably impossible; do not swallow errors.
4. **Use optionals for absence, not null pointers.** Model "maybe a value" as `?T`, unwrap with
   `if (x) |v|` / `orelse` / `.?`, and keep optional and error-union concerns distinct (`!?T`
   means "may fail, and may legitimately be absent").
5. **Respect "no hidden control flow."** There are no exceptions, no implicit destructors, and
   no operator overloading — control flow you can see is the only control flow. Make
   error-return and `defer` ordering explicit and obvious; do not rely on RAII semantics that
   Zig does not have.
6. **Get pointer/slice/array semantics right.** Distinguish arrays (`[N]T`, value, comptime
   length), slices (`[]T` / `[]const T`, ptr+len), single-item pointers (`*T`), many-item
   pointers (`[*]T`), and sentinel-terminated forms (`[:0]u8`). Keep `const` correctness; never
   form a slice that outlives its backing storage; bound every index.
7. **Use comptime for generics and metaprogramming, deliberately.** Generics are functions that
   take `comptime T: type` and return types; use `comptime`, `@TypeOf`, `@typeInfo`, and
   `inline for`/`inline while` where they earn their keep, and keep comptime logic readable.
   Do not reach for comptime where a plain runtime function is clearer.
8. **Lay out interop structs explicitly.** Use `extern struct` for C-ABI layout and `packed
   struct` for exact bit layout; do not assume field order/padding of a default struct across
   targets. For C interop use `@cImport`/`@cInclude` (or `zig translate-c`), link the C library
   in `build.zig`, and check the translated signatures rather than guessing.
9. **Drive the build with build.zig.** Treat `build.zig` + `build.zig.zon` as the source of
   truth for steps, modules, dependencies, and targets. For cross-compilation set the target
   triple (`-Dtarget=...` / `b.resolveTargetQuery`) and optimize mode (`-Doptimize=...`); Zig
   cross-compiles by default, so prefer the build system over ad-hoc flags.
10. **Verify.** Format with `zig fmt` (or `zig fmt --check`), then run the project's checks —
    `zig build`, `zig build test`, or `zig test <file>` — with leak-detecting allocators in
    tests (`std.testing.allocator` / a `GeneralPurposeAllocator` whose `deinit()` is asserted
    leak-free). Report the exact command, the Zig version, and the real result.

## Inputs
- The Zig source, the `build.zig` / `build.zig.zon`, the pinned Zig version (or `zig version`
  output), the target/optimize settings, and the full error text (compile error, panic/stack
  trace, leak report) for anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale for each
  non-obvious allocator choice, `errdefer`, comptime construct, or pointer/slice form.
- The exact `zig fmt`/`zig build`/`zig test` command run, the Zig version, and its result; any
  remaining leak, unbounded index, `catch unreachable`, or version-sensitive API flagged with
  why.

## Notes
- Pre-1.0 churn is the top footgun: confirm the version before trusting any std or build API.
- Leak-free and bounds-correct over clever; do not hide allocations or rely on control flow Zig
  does not have.
- Apply within the project's conventions — match its existing `build.zig` structure, module
  layout, and style.
