---
name: csharp-idioms
description: Use when writing or fixing C#/.NET code — async/await and Task pitfalls (deadlocks from .Result/.Wait, ConfigureAwait by layer, CancellationToken), LINQ deferred execution and multiple enumeration, nullable reference types and flow analysis, generics, and dotnet build/NuGet/csproj issues. Verifies with dotnet build/test. Any agent touching C# (writer, reviewer, debugger) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [csharp, dotnet, async, linq, nullable]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# C# Idioms

The substantive C#/.NET capability: write correct async, deliberate LINQ, and null-safe modern
C#, and verify it with the .NET CLI.

## When to use this skill
When authoring, reviewing, or debugging C# and any of these is involved: an async deadlock or
`ConfigureAwait` question, LINQ deferred-execution/multiple-enumeration trouble, a nullable
reference-type warning, generics, or a `dotnet`/NuGet/csproj build issue. Not needed for
trivial edits with no async/nullability/LINQ dimension.

## Instructions
1. **Diagnose async precisely.** Trace deadlocks to `.Result`/`.Wait()`/`GetAwaiter().GetResult()`
   blocking on a captured synchronization context. Reason about context by host: ASP.NET Core
   and console apps have no `SynchronizationContext`; classic ASP.NET and UI frameworks do.
   Apply `ConfigureAwait(false)` in library code; it is usually unnecessary in app code on
   contextless hosts.
2. **Async all the way.** Propagate `async`/`await` end to end; never block on async with
   `.Result`/`.Wait()`. Accept and honor `CancellationToken`. Use `IAsyncEnumerable<T>` with
   `await foreach` for async streams; avoid needless buffering. Return `Task`/`ValueTask`
   appropriately and avoid `async void` outside event handlers.
3. **Use LINQ deliberately.** Understand deferred execution and the multiple-enumeration trap
   (materialize with `ToList`/`ToArray` when iterating more than once); avoid N+1 materialization
   on `IQueryable`. Prefer expressive query/method syntax where it reads clearer, but watch
   allocations on hot paths.
4. **Honor nullability.** Keep `<Nullable>enable</Nullable>` clean; reason about the compiler's
   flow analysis and `?`/`!`/`[NotNull]`/`[MaybeNull]` annotations. Avoid the null-forgiving `!`
   without justification. Use records, pattern matching, and `required` members idiomatically.
5. **Verify.** Read the `.csproj`/`Directory.Build.props` for target framework, `LangVersion`,
   and `<Nullable>`; run `dotnet build` (warnings-as-errors if configured) and `dotnet test`,
   and report the exact commands and results.

## Inputs
- The C# code, the `.csproj`/`Directory.Build.props` (target framework, `LangVersion`,
  nullable setting), and the full error/warning text or stack trace being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious
  async/nullable decision.
- The build/test commands run and their results; any remaining `!`, blocking call, or
  suppressed warning flagged with why.

## Notes
- Clarity and correctness over cleverness; respect the project's nullable and analyzer settings.
- Never block on async or silence a nullable warning with `!` without flagging the trade-off.
- Apply within the project's conventions — match its existing async and DI patterns.
