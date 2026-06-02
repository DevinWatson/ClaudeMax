---
name: reproduce-then-fix
description: Use when fixing a reported bug or regression in any language — first reproduce it with a minimal failing case or test, confirm the failure, then make the smallest change that turns it green and guards against regression. Do not patch blind.
allowed-tools: Read, Grep, Glob, Bash
category: engineering
tags: [debugging, testing, bugfix]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Reproduce Then Fix

A language-agnostic discipline for fixing bugs: make the failure observable and
deterministic *before* changing any production code, so the fix is targeted and the
regression is permanently guarded.

## When to use this skill
Whenever you are asked to fix a reported bug, crash, flake, or regression — as opposed
to building a new feature. If you cannot yet make the bug happen on demand, this skill
applies. Do NOT skip to editing source because the cause "looks obvious."

## Instructions
1. **Reproduce first.** Write or run the smallest case that triggers the bug — ideally a
   failing test in the project's test framework. Confirm it fails for the reported reason
   (right error, right place), not an unrelated one. If you cannot reproduce it, say so
   and gather more input (inputs, version, environment, stack trace) rather than guessing.
2. **Locate the root cause**, not the symptom. Trace from the failing assertion/stack
   trace to the actual defect. Distinguish "where it blew up" from "where it went wrong."
3. **Make the smallest change** that turns the failing case green. Resist refactoring or
   fixing adjacent issues in the same change — note them separately.
4. **Guard against regression.** Keep the reproducing case as a committed test so the bug
   cannot silently return. If the codebase has no test harness, add the minimal one.
5. **Verify the whole suite.** Run the new test (now passing) and the existing tests to
   confirm nothing else broke. Report the exact commands and results.

## Inputs
- A bug report or failing behavior, ideally with inputs, expected vs. actual, and any
  stack trace, logs, or version/environment details.

## Output
- The reproducing case (preferably a test) and confirmation it failed before the fix.
- The minimal fix as a focused diff with the root cause explained.
- Test results before and after (commands run + pass/fail).
- Any adjacent issues found but deliberately not fixed.

## Notes
- Prefer false negatives over speculative patches: an unreproduced "fix" often hides the
  real defect and adds risk. State uncertainty honestly.
- For intermittent/flaky failures, reproduce under stress (loops, increased concurrency,
  seeded randomness) before declaring a fix.
