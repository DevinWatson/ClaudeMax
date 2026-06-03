---
name: elixir-idioms
description: Use when writing or fixing Elixir/BEAM code — pattern matching and multiple function clauses, immutability, the pipe operator, with-expressions, structs/protocols/behaviours, OTP (GenServer, Supervisor, supervision trees, "let it crash"), processes and message passing, Tasks and concurrency, Ecto changesets/queries, and {:ok, _}/{:error, _} error handling. Verifies with mix (mix compile/test, mix format, credo, dialyzer/dialyxir). Any agent touching Elixir (writer, reviewer, debugger, a Phoenix team) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [elixir, beam, otp, genserver, ecto, mix]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Elixir Idioms

The substantive Elixir capability: write clear, idiomatic, fault-tolerant Elixir on the BEAM and
verify it with mix.

## When to use this skill
When authoring, reviewing, or debugging Elixir and any of these is involved: pattern matching or
function-clause design, immutability and data transformation, OTP/process modeling (GenServer,
supervision, "let it crash"), concurrency with Tasks/processes, Ecto changesets or queries, or
error-handling shape ({:ok, _}/{:error, _} tuples and `with`). Not needed for trivial edits with
no language, OTP, concurrency, or data-access dimension.

## Instructions
1. **Pattern-match instead of branching.** Destructure in function heads and bindings; prefer
   multiple function clauses with guards over nested `case`/`if`. Match on the shape you expect
   and let non-matching input fail loudly. Use `case`/`cond`/`with` where a single function would
   be clearer, and reserve `if`/`unless` for genuine booleans.
2. **Respect immutability and pipe data through transformations.** Data is never mutated —
   rebinding produces new terms. Shape transformations as a pipeline with `|>`, keeping the
   data being transformed as the first argument of each function. Use `Enum`/`Stream`/`Map`/
   `Keyword` idiomatically; reach for `Stream` when laziness or large/infinite sequences matter.
3. **Sequence fallible steps with `with`.** Chain operations that each return `{:ok, _}` /
   `{:error, _}` using a `with` expression, and handle the `else` cases explicitly. Return tagged
   tuples from functions that can fail; reserve raising (`!` functions, `raise`) for truly
   exceptional, unrecoverable conditions. Never swallow an `{:error, _}` silently.
4. **Model data with structs, polymorphism with protocols, contracts with behaviours.** Use
   `defstruct` (with `@enforce_keys` where appropriate) for domain data; define protocols for
   open polymorphism over types you do not own; define behaviours (`@callback`) for pluggable
   modules. Add `@type`/`@spec` to public functions so Dialyzer can check them.
5. **Design OTP deliberately and "let it crash".** Model stateful concurrency with GenServers;
   keep `handle_call`/`handle_cast`/`handle_info` clauses small and pattern-matched. Place
   processes under a Supervisor with the right restart strategy (`:one_for_one`, `:rest_for_one`,
   `:one_for_all`) and child specs; design the supervision tree so a crashing process is
   isolated and restarted to a known-good state rather than defensively coding every error.
6. **Reason about processes and message passing.** Each process has isolated state and a mailbox;
   coordinate via messages, not shared memory. Avoid unbounded mailbox growth and selective-
   receive pitfalls; prefer `GenServer` calls/casts over raw `send`/`receive` unless a low-level
   primitive is warranted. Name or register processes intentionally and avoid bottlenecking on a
   single GenServer.
7. **Use Tasks and concurrency safely.** Use `Task.async`/`await` and `Task.async_stream` (with a
   bounded `max_concurrency` and a timeout) for parallel work; supervise long-lived tasks under a
   `Task.Supervisor`. Set explicit timeouts; never leak or orphan processes.
8. **Write Ecto with changesets and composable queries.** Validate and cast input through
   changesets (`cast`, `validate_*`, constraints) before persisting; build queries with the
   `Ecto.Query` DSL, compose with pipeable query functions, and prevent N+1 with `preload`/joins.
   Run schema changes through migrations.
9. **Verify.** Run `mix compile --warnings-as-errors`, `mix test`, and
   `mix format --check-formatted`; run `mix credo` and `mix dialyzer` (dialyxir) where the project
   configures them. Report the exact command(s) and the real result.

## Inputs
- The Elixir code, `mix.exs` (deps, OTP app, Elixir/OTP versions), and the full error text
  (compiler warning/error, stacktrace, supervisor crash report, Dialyzer warning, failing test)
  for anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious clause,
  supervision choice, or `with` chain.
- The mix command(s) run and their result; any swallowed error, unbounded mailbox/task, missing
  `@spec`, or risky restart strategy flagged with why.

## Notes
- Clarity and fault-tolerance over cleverness; let it crash rather than defensively trapping every error.
- Do not reach for a GenServer/process where a plain function and immutable data suffice.
- Apply within the project's conventions — match its existing supervision layout, Ecto patterns,
  formatting (`.formatter.exs`), and Credo/Dialyzer configuration.
