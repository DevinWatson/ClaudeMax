---
name: test-design
description: Use when adding or expanding automated tests for existing code — how to map a unit's behaviors, enumerate the cases that catch real regressions (happy path, boundaries, invalid input, error paths, concurrency/ordering), and write deterministic tests that read like the project's existing suite. TRIGGER when asked to add/expand tests or raise meaningful coverage. Any agent that writes tests (a test author, a TDD-driven feature builder, a bug-fixer adding a regression guard) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: engineering
tags: [testing, coverage, cases, regression]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Test Design

The substantive test-writing capability: turn a unit's contract into a set of tests that
would actually catch a realistic regression — meaningful coverage, not coverage-number
padding — written in the project's own framework and idioms.

## When to use this skill
When authoring or expanding automated tests for code that already exists: a function,
module, component, or endpoint whose behavior you need to pin down. Pairs with
[[match-project-conventions]] (write the tests in the existing framework/style) and
[[verify-by-running]] (run them and report the real result).

## Instructions
1. **Map the behaviors.** Read the target and list its responsibilities, inputs, outputs,
   and side effects. Identify its contract — what it promises — and its dependencies
   (I/O, time, randomness, network, shared state) that must be controlled in a test.
2. **Enumerate the cases that matter.** For each behavior, cover:
   - **Happy path** — the normal, expected input and result.
   - **Boundaries** — empty/single/max collections, zero/negative, off-by-one limits,
     first/last, min/max, Unicode/whitespace edges.
   - **Invalid input & error paths** — bad arguments, missing data, the exact exception or
     error value the contract promises (assert the failure, not just "it throws").
   - **Concurrency/ordering** — where relevant: interleaving, idempotency, retry behavior.
   Prioritize cases that would catch a *realistic* regression over exhaustive permutations.
3. **Write tests in the project's style.** Use the existing framework, runner, file naming,
   assertion library, and fixture/mock approach — never introduce a second framework. One
   behavior per test, descriptive names, arrange-act-assert, minimal shared mutable state.
4. **Make them deterministic.** Control time, randomness, and I/O (inject/fake/freeze) unless
   real dependencies are the established pattern. A flaky test is worse than no test.
5. **Sanity-check that they can fail.** For at least one new test, confirm it goes red when
   the behavior is broken — a test that passes against broken code asserts nothing.
6. **Note deliberate gaps.** State which behaviors you left uncovered and why, so the gap is
   a recorded decision, not an accident.

## Inputs
- The target code and its contract, plus the project's test setup (framework, runner, naming,
  fixtures/mocks) — discover this via [[match-project-conventions]].

## Output
- The new/updated test files, in the project's style.
- The list of behaviors covered and any intentionally uncovered, with rationale.
- Hand the actual run (command + observed pass/fail) to [[verify-by-running]].

## Notes
- Test observable behavior, not implementation details that will churn — coupling tests to
  internals makes every refactor a test rewrite.
- If a test reveals a genuine bug in the code under test, surface it explicitly rather than
  shaping the test around the wrong behavior.
- For a regression guard on a *reported* bug, the reproduce-first discipline of a bugfix
  loop applies; this skill covers the case-design once you are writing the test.
