---
name: erlang-idioms
description: Use when writing, reviewing, or debugging Erlang/BEAM code — the actor model and lightweight processes, message passing and selective receive, pattern matching and guards, immutability and single-assignment, OTP (gen_server/gen_statem/supervisor/application), "let it crash" and supervision trees, links/monitors, ETS/Mnesia, hot code loading, distributed Erlang and clustering, and binaries/bit syntax. Verifies with rebar3 (compile/eunit/ct), dialyzer, elvis, and erlfmt. Runs on the BEAM like Elixir but is a distinct language with distinct syntax and ecosystem. Any agent touching Erlang (writer, reviewer, debugger, a telecom/distributed-systems team) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: languages
tags: [erlang, beam, otp, gen-server, supervision, rebar3]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Erlang Idioms

The substantive Erlang capability: write clear, idiomatic, fault-tolerant Erlang on the BEAM and
verify it with rebar3.

## When to use this skill
When authoring, reviewing, or debugging Erlang and any of these is involved: process/actor modeling
and message passing, pattern matching or guard design, OTP behaviours (gen_server, gen_statem,
supervisor, application), supervision and "let it crash", links/monitors, ETS/Mnesia, hot code
loading, distributed Erlang/clustering, or binaries and bit syntax. Not needed for trivial edits
with no language, OTP, concurrency, or data dimension.

Boundary: this is the **Erlang** capability. Erlang and Elixir both compile to BEAM bytecode and
share OTP, processes, and supervision semantics, but they are distinct languages with different
syntax and tooling. Use this skill for `.erl`/`.hrl`, rebar3, and Erlang-specific syntax; use
`elixir-idioms` for `.ex`/`.exs`, mix, and Elixir syntax.

## Instructions
1. **Pattern-match instead of branching, and use guards.** Destructure in function heads and
   bindings; prefer multiple function clauses with guards (`when`) over nested `case`/`if`. Match
   on the shape you expect and let non-matching input fail loudly. Reserve `case`/`if` for genuine
   in-function dispatch, and remember `if` requires a true guard in every clause.
2. **Respect immutability and single-assignment.** Variables bind once within a scope and are never
   mutated; "updating" a record or map produces a new term. Shape transformations with recursion,
   list comprehensions, and `lists`/`maps` functions; carry state as accumulators or process state
   rather than reassigning.
3. **Model concurrency with the actor model and message passing.** Each process is isolated with
   its own heap and mailbox; coordinate only via messages, never shared memory. Spawn lightweight
   processes for concurrent work, send with `!`, and consume with `receive`. Use **selective
   receive** carefully — match only the messages you expect, always include a timeout or
   catch-all where unbounded mailbox growth is possible, and avoid scanning a large mailbox for a
   rare message.
4. **Use links and monitors deliberately.** Link processes whose lifecycles are coupled (`link`,
   `spawn_link`) so a crash propagates; monitor (`monitor/2`) when you want a `'DOWN'` message
   without coupling your own fate. Trap exits (`process_flag(trap_exit, true)`) only where you
   genuinely need to handle a linked process's death rather than crash with it.
5. **Build on OTP behaviours, not raw processes.** Prefer `gen_server` for stateful servers,
   `gen_statem` for explicit state machines, `supervisor` for process lifecycle, and `application`
   for the overall unit. Keep `handle_call`/`handle_cast`/`handle_info` clauses small and
   pattern-matched; return the correct `{reply, _, State}` / `{noreply, State}` / `{stop, _, _}`
   tuples. Reach for a raw `spawn`/`receive` loop only when no behaviour fits.
6. **"Let it crash" under a supervision tree.** Design supervisors with the right restart strategy
   (`one_for_one`, `one_for_all`, `rest_for_one`, `simple_one_for_one`/dynamic children) and
   sensible child specs (restart type, shutdown, intensity/period). Let a process crash to a
   known-good restart rather than defensively coding every error path; reserve `try`/`catch` for
   boundaries where you must convert a crash into a value.
7. **Use ETS and Mnesia for shared/persistent state.** Use ETS for fast in-memory shared tables
   (choose `set`/`ordered_set`/`bag`, and the right concurrency and access options); own the table
   from a long-lived process so it is not lost on crash. Use Mnesia for distributed/transactional
   storage, with explicit table types, replication, and transactions vs. dirty operations chosen
   deliberately.
8. **Handle binaries and bit syntax correctly.** Parse and construct protocol/wire data with the
   bit syntax (`<<...>>`), specifying sizes, signedness, and endianness explicitly. Prefer binaries
   over lists for byte data, watch for sub-binary/ref-counted-binary retention, and avoid
   copying large binaries needlessly.
9. **Use distribution and hot code loading where the system calls for it.** For distributed Erlang,
   reason about node connectivity, `global`/`pg` registration, net splits, and the cost of remote
   messages. For hot code loading, respect the two-version (`Module:` fully-qualified call) upgrade
   rule and `code_change/3` in OTP behaviours; do not assume in-place upgrades are free.
10. **Add types and specs.** Write `-spec`/`-type` for public functions so Dialyzer can find
    discrepancies; keep records (`-record`) and their accessors consistent, or use maps where an
    open, evolving shape is better.
11. **Verify.** Run `rebar3 compile` (treat warnings seriously), `rebar3 eunit` and/or
    `rebar3 ct` for Common Test suites, `rebar3 dialyzer` for type discrepancies, `rebar3 lint`
    (elvis) for style, and `erlfmt --check` (or `rebar3 fmt`) for formatting — whichever the
    project configures. Report the exact command(s) and the real result.

## Inputs
- The Erlang code, `rebar.config`/`rebar.lock` (or `erlang.mk` build), the OTP release layout
  (`.app.src`, `sys.config`, `vm.args`) where relevant, and the full error text (compiler
  warning/error, crash report/SASL log, supervisor report, Dialyzer warning, failing EUnit/CT case)
  for anything being diagnosed.

## Output
- The real cause and the change as a focused diff, with a one-line rationale per non-obvious clause,
  supervision choice, restart strategy, or `receive` pattern.
- The rebar3 command(s) run and their result; any unbounded mailbox/selective-receive risk, missing
  timeout, missing `-spec`, risky restart strategy, dirty-Mnesia hazard, or leaked/orphaned process
  flagged with why.

## Notes
- Clarity and fault-tolerance over cleverness; let it crash rather than defensively trapping every error.
- Do not reach for a gen_server/process where a plain function and immutable data suffice.
- BEAM-shared with Elixir but distinct syntax and tooling — apply Erlang syntax and rebar3, not mix.
- Apply within the project's conventions — match its existing supervision layout, OTP release
  structure, elvis ruleset, and erlfmt configuration.
