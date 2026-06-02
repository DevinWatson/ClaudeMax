---
name: e2e-test-authoring
description: Use when writing end-to-end / browser UI tests (Playwright or Cypress) that drive a real browser through full-stack user journeys — using resilient role/text/testid selectors, framework auto-waiting instead of sleeps, network mocking for out-of-scope calls, per-test isolation, and the trace viewer to diagnose. TRIGGER on authoring or stabilizing a browser e2e spec. Any agent that writes or reviews browser tests (an e2e author, a flake reviewer) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: qa
tags: [testing, e2e, playwright, cypress, browser]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# E2E Test Authoring

The substantive capability for browser-driven end-to-end tests of full-stack user journeys:
specs that survive refactors, never sleep on arbitrary timers, and run green deterministically
in CI.

## When to use this skill
When writing or stabilizing a Playwright/Cypress test that drives a real browser through a
user flow (login, checkout, multi-page journey). Not for unit/integration tests in the app's
own framework, and not for load/performance tests.

## Instructions
1. **Detect the harness.** Look for `playwright.config.*`, `cypress.config.*`, a `tests/`/`e2e/`
   directory, and existing specs. Match the framework, file naming, fixture style, and
   base-URL/auth setup. Never introduce a second e2e framework alongside one that exists.
2. **Read the real markup.** Identify the flow under test and the application's actual roles,
   labels, and `data-testid`s — never invent selectors. State the flow and framework in one line.
3. **Map the journey.** Break the flow into user-visible steps (navigate → act → assert
   observable state). Note auth/session setup, seeded data, and external calls to mock.
4. **Select resilient locators.** Prefer semantic, user-facing selectors over brittle CSS/XPath:
   - Playwright: `getByRole('button', { name: 'Sign in' })`, `getByLabel`, `getByText`, falling
     back to `getByTestId`.
   - Cypress: `cy.findByRole` / `cy.contains` (Testing Library) or `cy.get('[data-cy=...]')`.
5. **Never sleep — rely on auto-waiting.** Assert on state and let the framework retry:
   - Playwright web-first assertions auto-retry — `await expect(locator).toBeVisible()`,
     `.toHaveText()`, `.toHaveURL()`. Banish `page.waitForTimeout(...)`.
   - Cypress chained assertions retry; never `cy.wait(<ms>)`. Use `cy.intercept()` aliases and
     `cy.wait('@alias')` to wait on the network, not the clock.
6. **Isolate every test.** Each spec sets up and cleans up its own state; no ordering
   dependencies. Use fixtures (Playwright `test.extend`, storage-state for pre-auth; Cypress
   `beforeEach` + programmatic API login rather than clicking through the UI each time).
7. **Mock out-of-scope network.** Stub third-party/flaky endpoints with `page.route()` or
   `cy.intercept()`; keep the real backend for the flow actually under test.
8. **Run and stabilize.** Headless: `npx playwright test` (`--trace on` / `show-trace`,
   `--repeat-each=5`/`--retries` to surface flake) or `npx cypress run`. Confirm it passes
   repeatedly, not once.

## Inputs
- The user flow under test, the app's real markup, the existing e2e harness/config, and any
  auth/seed setup.

## Output
- The new/updated spec(s) with semantic locators and auto-waiting assertions.
- The run command and observed passing output (pasted), plus any mocks/fixtures added with one
  line of why.
- Coverage left out and why (e.g. covered by unit tests).

## Notes
- Test observable user behavior, not internal DOM that will churn. No arbitrary
  `waitForTimeout`/`cy.wait(ms)` — the urge means a missing assertion or network wait. Keep
  e2e tests few and high-value; push edge cases down to unit/integration.
- Fit the repo with [[match-project-conventions]]; confirm green with [[verify-by-running]],
  running more than once (an intermittent pass is a failure).
