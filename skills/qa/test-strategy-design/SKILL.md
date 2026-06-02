---
name: test-strategy-design
description: Use when you need a test STRATEGY or plan rather than test code — risk-based prioritization, choosing test levels (unit/integration/e2e/manual), mapping coverage to requirements with a traceability matrix, defining entry/exit criteria, and deciding what to automate vs. test manually. TRIGGER on planning how to test a feature/change before any tests are written. Produces a document; it does not write or run tests. Any agent that plans or reviews test coverage (a test planner, a release-readiness reviewer) can load it.
allowed-tools: Read, Grep, Glob, Write
category: qa
tags: [testing, strategy, planning, coverage, risk]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Test Strategy Design

The substantive capability for producing a focused, risk-based test strategy: deciding *what*
to test, *at which level*, and *what not to bother automating* — without writing or running
the tests themselves.

## When to use this skill
When deciding how to test a feature or change: prioritizing by risk, assigning test levels,
mapping coverage to requirements, and setting entry/exit criteria. Not for implementing or
running tests, and not for diagnosing flaky tests.

## Instructions
1. **Enumerate what could go wrong.** List the requirements and the failure modes for each:
   correctness, edge cases, data integrity, security/authz, concurrency, compatibility,
   performance, and user-facing regressions. If acceptance criteria are vague, list the
   assumptions you are planning against rather than guessing silently.
2. **Rank by risk.** Apply the [[severity-triage]] rubric (impact x likelihood) so the
   highest-risk areas get the deepest coverage and low-risk areas a light touch. Surface the
   most certain, highest-impact risks first.
3. **Assign test levels.** For each risk, pick the cheapest level that catches it, following
   the test-pyramid bias:
   - **unit** — pure logic, branches, boundaries (fast, most coverage here).
   - **integration** — module/service/DB boundaries, contracts.
   - **e2e** — a few critical user journeys only.
   - **manual / exploratory** — UX, one-off setup, areas not worth automating yet.
4. **Map coverage to requirements.** Build a traceability matrix: every requirement maps to at
   least one planned test; flag any requirement with no coverage and any test with no requirement.
5. **Decide automate vs. manual.** Automate high-value, stable, repeated checks; leave volatile
   or low-frequency checks manual. Justify each call briefly.
6. **Define entry/exit criteria.** State when testing can start (entry) and the bar for "done"
   (exit): e.g. all high risks have passing automated coverage, no open critical/high defects,
   an agreed flake budget.

## Inputs
- The feature/PRD/spec, the affected code, and any existing tests (to gauge current coverage).

## Output
A written test plan with these sections:
- **Scope & assumptions** — what is and is not covered.
- **Risk register** — ranked risks (severity / likelihood / area) per severity-triage.
- **Coverage matrix** — requirement → test level → automate? → owner/notes.
- **Out of scope / accepted risks** — what is deliberately not tested and why.
- **Entry & exit criteria** — concrete, checkable conditions.

## Notes
- Plan only — no test code, scaffolding, or suite runs (this skill is read-only by design;
  Write is reserved for the plan document by the owning agent).
- Prioritize honestly: a plan that "tests everything equally" is no plan. Tie every planned
  test to a real requirement or risk; no coverage-number theater.
- Hand implementation to the relevant authoring skills/agents (unit/integration, browser e2e,
  load, contract).
