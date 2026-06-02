---
name: flaky-test-diagnosis
description: Use when an existing test passes sometimes and fails other times for no code reason — reproduce the failure under stress, isolate the source of nondeterminism (timing/async, test ordering, shared mutable state, real network/clock/randomness, resource limits), and make it deterministic with the smallest change. TRIGGER on an intermittently-failing test. NOT for a test that fails every time (that is a real bug). Any agent that stabilizes or reviews flaky tests (a flake hunter, a CI reliability reviewer) can load it.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: qa
tags: [testing, flaky, determinism, debugging, ci]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Flaky Test Diagnosis

The substantive capability for turning an intermittently-failing test into a deterministic
one: find the nondeterminism, prove it, and remove it — without papering over it with retries.

## When to use this skill
When a test passes on some runs and fails on others with no code change. Not for a test that
fails every time (that is a genuine bug — use a reproduce-then-fix loop directly) and not for
writing new coverage.

## Instructions
1. **Reproduce the flake under stress** before touching code. A single pass proves nothing;
   make the failure observable on demand:
   - Repeat: many runs (`npx jest --runInBand <file>` in a loop, `pytest -p no:randomly
     --count=50`, `npx playwright test --repeat-each=20 --retries=0`, `go test -run X -count=100`).
   - Vary ordering: randomize order (`pytest-randomly`, `jest --shuffle`) and run the single
     test alone vs. in the full suite to expose ordering/shared-state coupling.
   - Stress concurrency (`-parallel`, `--workers`) and increase machine load.
2. **Classify the root cause.** Most flakes are one of:
   - **Timing/async** — missing await, racing promises, fixed sleeps, polling without retry,
     animation/transition timing.
   - **Test order / shared state** — global singletons, module-level caches, DB rows, temp
     files, env vars left mutated between tests.
   - **Real I/O** — live network, current time/`Date.now()`, unseeded randomness, locale/timezone,
     filesystem ordering.
   - **Resource limits** — port collisions, connection pools, fixture teardown leaks.
3. **Confirm the cause, don't guess.** Make the failure rate move predictably: force the
   suspected race, pin/unpin the clock, isolate the shared resource — and watch the flake
   appear/vanish accordingly.
4. **Make it deterministic with the smallest change.** Replace fixed sleeps with explicit
   waits/assertions on state; await the real promise; freeze the clock (fake timers,
   `freezegun`); seed RNG; reset/isolate shared state per test (proper setup/teardown, unique
   fixtures, transaction rollback); mock the network. Quarantine (`.skip`/tag) only as a
   temporary, clearly-labeled stopgap — never as the fix.
5. **Verify the cure.** Re-run the same stress loop (same repeat count and ordering
   randomization) and confirm consistent passing. Run the surrounding suite to ensure the
   isolation change didn't break neighbors.

## Inputs
- The flaky test(s), failure messages/stack traces, CI run history, observed failure rate, and
  whether it fails in isolation or only in a full run.

## Output
- The reproduction recipe (exact command + repeat/ordering flags) and the failure rate before.
- Root cause: the class of nondeterminism and the precise `path:line`.
- The minimal fix as a focused diff, and after-fix evidence (the same stress run now green).
- Any other flakes spotted but deliberately not fixed.

## Notes
- This is the [[reproduce-then-fix]] discipline applied to nondeterministic failures under
  stress: reproduce → confirm cause → minimal fix → guard. No blind patches; no `--retries`
  band-aids passed off as fixes.
- Change test/setup determinism, not production behavior — unless the flake reveals a genuine
  production race, in which case surface it explicitly.
- Confirm the cure with [[verify-by-running]]: don't declare it fixed off a single green run;
  prove it over the same stress that reproduced it.
