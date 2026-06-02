---
name: integration-testing
description: Use when testing behavior that crosses a component, module, or service boundary — deciding where to use a real dependency versus a test double, standing up and tearing down test data and infrastructure deterministically, distinguishing an integration test from a contract test or a unit test, and controlling the flakiness that boundary tests are prone to. TRIGGER when verifying that two or more parts work together (service↔database, service↔service, app↔external API) rather than testing one unit in isolation. Language- and framework-agnostic — the strategy for boundary tests; the runner/library specifics come from a separate language capability the agent also composes. Any agent that writes or reviews boundary tests (an integration-test author, a backend engineer, a QA reviewer) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: qa
tags: [testing, integration, test-doubles, fixtures, flakiness]
version: 0.1.0
maintainer: devinwatson@gmail.com
license: MIT
status: experimental
---

# Integration Testing

The substantive capability for testing across boundaries: verify that components actually work
together — with real dependencies where it matters and doubles where it does not — while keeping the
suite deterministic and fast enough to run. Independent of the language; the test runner and
container/mocking libraries come from the composed language capability.

## When to use this skill
When the behavior under test spans a boundary: service to database, service to service, app to a
third-party API, or module to module through real wiring. Not for isolated single-unit logic (that is
test-design / unit testing) and not for consumer-driven API compatibility (that is contract-testing,
which this is distinct from). Pairs with [[test-design]] (case selection) and [[verify-by-running]]
(prove the suite passes).

## Instructions
1. **Identify the boundary and the contract under test.** Name precisely which two-or-more parts are
   integrating and what observable behavior crosses the boundary. Decide the scope: a narrow
   integration (one boundary, e.g. repository↔database) is more diagnosable than a broad one.
2. **Choose real vs. double per dependency, deliberately.** Use the **real** thing for the dependency
   you are actually verifying (the database for a query test; a containerized broker for a queue test).
   Use a **double** for dependencies that are slow, external, non-deterministic, or out of scope —
   and prefer a high-fidelity double (in-memory/containerized real-equivalent) over a hand-mock when
   correctness depends on the dependency's real behavior. Never mock the thing you are testing.
3. **Make data setup and teardown deterministic.** Seed exactly the data each test needs and isolate
   tests from each other — fresh schema/transaction-rollback/unique-namespace per test, not shared
   mutable state. Tear down so a re-run starts clean; never depend on test execution order.
4. **Distinguish integration from contract and unit.** Integration verifies *this system's* wiring
   against a dependency; a contract test verifies *agreement* between a consumer and provider that
   deploy independently; a unit test isolates one unit. Keep these in separate suites with separate
   intents so failures localize.
5. **Control flakiness at the source.** Eliminate the common boundary-test flake causes: race
   conditions (await readiness, poll with timeout — never fixed `sleep`), shared state, real time/clock
   and randomness (inject them), network nondeterminism, and ordering. A test that fails
   intermittently is a defect in the test, not noise to retry away.
6. **Define the environment reproducibly.** Pin the dependency versions and provision them the same way
   in local and CI (containers/compose/ephemeral env). Document how to bring the environment up so the
   suite runs identically everywhere.
7. **Verify and report.** Run the suite via [[verify-by-running]]; report the exact command, what was
   real vs. doubled, and the result. Re-run to confirm determinism if flakiness was a concern.

## Inputs
- The components/services and their boundary, the available test infrastructure (containers, test DBs,
  sandboxes), the dependency versions to pin, and any data the scenarios require.

## Output
- A statement of the boundary under test and, per dependency, the real-vs-double decision with rationale.
- The tests with deterministic setup/teardown, plus the environment provisioning (compose/fixtures).
- The verification result via [[verify-by-running]] (exact command + outcome) and a note on
  determinism (re-run clean).

## Notes
- Don't over-mock: a test where every dependency is faked verifies the mocks, not the integration.
- A fixed `sleep` to "fix" a race is a flaky test waiting to happen — wait on a condition instead.
- Stay language-agnostic; the runner, container library, and mocking framework belong to the composed
  language capability.
