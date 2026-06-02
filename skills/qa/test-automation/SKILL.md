---
name: test-automation
description: Use when building or restructuring a durable automated-test suite or harness — selecting a framework/runner, structuring tests with page-object/fixture/factory patterns, choosing deterministic selectors and waits, wiring the suite into CI with parallelism and sharding, and producing trustworthy reporting and artifacts. TRIGGER when standing up test infrastructure, refactoring a brittle suite, or wiring tests into a pipeline — as opposed to writing the cases for one feature. Language- and framework-agnostic — the engineering of the harness; the specific runner/tooling comes from a separate language capability the agent also composes. Any agent that owns test infrastructure (a test-automation engineer, an SDET, a CI maintainer) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: qa
tags: [test-automation, ci, fixtures, page-object, parallelism, reporting]
version: 0.1.0
maintainer: devinwatson@gmail.com
license: MIT
status: experimental
---

# Test Automation

The substantive capability for engineering a test suite that stays maintainable and trustworthy as it
grows: the right framework, reusable structure, deterministic execution, CI integration, and reporting
people believe. Independent of the language; the concrete runner and libraries come from the composed
language capability.

## When to use this skill
When building, restructuring, or wiring an automated-test suite or harness — not when writing the test
cases for a single feature (that is test-design) or designing a boundary test (that is
integration-testing). Pairs with [[test-design]] (what to assert), [[flaky-test-diagnosis]] (when the
suite is already flaky), and [[verify-by-running]] (prove the harness runs).

## Instructions
1. **Define the suite's job and scale.** State the test level(s) the suite targets (unit, integration,
   e2e), how many tests are expected, how fast it must run, and where it runs (local + CI). This drives
   every later choice; an e2e UI suite and a unit suite need different architecture.
2. **Select the framework/runner against constraints.** Choose the runner, assertion library, and (for
   e2e) the driver based on the stack, parallelism support, debuggability, and ecosystem — not
   familiarity. Justify the pick in one line; defer the exact tool to the composed language capability
   where appropriate.
3. **Structure for reuse and change.** Apply the right organizing pattern: page objects / screen models
   for UI, fixtures and factories/builders for data and setup, and shared helpers for cross-cutting
   concerns. Keep test bodies declarative (intent), pushing wiring into reusable layers so a UI/schema
   change touches one place, not every test.
4. **Make execution deterministic.** Use stable, semantic selectors (test IDs/roles, not brittle
   CSS/XPath); wait on conditions, never fixed sleeps; inject time/randomness; isolate each test's
   state so any subset can run in any order. Determinism is the precondition for parallelism.
5. **Wire into CI with parallelism.** Run on the right triggers, shard/parallelize across workers,
   cache dependencies, and fail fast. Make local and CI execution identical (same provisioning) so
   "passes locally" means something. Quarantine — don't auto-retry-to-green — known-flaky tests, and
   track them down via [[flaky-test-diagnosis]].
6. **Produce trustworthy reporting and artifacts.** Emit a standard report (e.g. JUnit XML) the CI
   understands, plus failure artifacts that make triage fast: screenshots/video/DOM for UI, logs and
   request/response for service tests, and stable test names. A green that hides skips is not green.
7. **Verify the harness itself.** Run the suite via [[verify-by-running]] — full run and a parallel run
   — and confirm a deliberately failing test actually fails and reports clearly. Report the commands and
   results.

## Inputs
- The system under test and its stack, the target test level(s) and scale, the CI platform, and any
  existing suite to refactor or extend.

## Output
- The harness design: framework/runner choice (with rationale), the structuring patterns, and the
  selector/wait strategy.
- The implemented harness/fixtures and the CI configuration (triggers, sharding, caching, reporting).
- The verification result via [[verify-by-running]] (full + parallel run) and a note on flake handling.

## Notes
- Auto-retrying a flaky test to green hides a real defect — quarantine and diagnose instead.
- A test's value is reproducibility; if it can't run identically in CI and locally, it isn't automated.
- Stay language-agnostic; the specific runner, driver, and reporter belong to the composed language
  capability.
