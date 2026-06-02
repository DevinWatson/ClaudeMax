---
name: code-review-method
description: Use when reviewing a code change (diff, branch, or PR) for real defects — how to read a change for correctness, security, data/concurrency, and maintainability problems, confirm each finding against the surrounding code, and report it with a precise location and a minimal fix. TRIGGER on any "review this code/diff/PR" request. Any agent that reviews code (a dedicated reviewer, a security auditor, a language pro double-checking a change) can load it.
allowed-tools: Read, Grep, Glob
category: engineering
tags: [review, correctness, security, concurrency, maintainability]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Code Review Method

The substantive reviewing capability: read a code change for the defects that actually
matter, confirm each before asserting it, and report it so the author can act — with a
precise location and the smallest correct fix.

## When to use this skill
When evaluating a code change rather than writing one: a diff, a branch, a PR, or a set
of edited files that needs a correctness/security/maintainability judgement before it
merges. Pairs with a change-mapping skill (e.g. [[diff-summary]]) to understand the change
first, and a ranking skill (e.g. [[severity-triage]]) to order the findings.

## Instructions
1. **Review for real issues, in priority order.** Spend effort where the risk is.
   - **Correctness** — logic errors, off-by-one, null/undefined/None, wrong error handling,
     unhandled edge cases, broken pre/post-conditions and invariants, incorrect
     `async`/`await` or promise handling, resource leaks (unclosed handles, missing cleanup).
   - **Security** — injection (SQL/command/template), missing authn/authz checks, secrets in
     code or logs, unsafe deserialization, SSRF, path traversal, missing input validation or
     output encoding, weak/predictable crypto and tokens.
   - **Data & concurrency** — race conditions, lost updates, check-then-act gaps,
     non-idempotent retries, transaction scope/isolation errors, ordering assumptions, and
     migration risk (irreversible or lock-heavy schema changes, unguarded backfills).
   - **Maintainability** — duplication, dead code, unclear naming, leaky abstractions, and
     missing tests for newly added behavior. Keep these to genuinely useful notes, not style
     policing that a formatter/linter already owns.
2. **Confirm before asserting.** Read enough of the surrounding code — callers, callees, the
   types involved — to verify the finding is real and reachable, and trace the concrete
   failure path. If you cannot confirm it, mark it speculative or drop it.
3. **Locate precisely.** Every finding gets a `path:line` (or line range). A finding without
   a location is not actionable.
4. **Propose the minimal fix.** State the smallest change that resolves the issue, not a
   rewrite. If the fix has a trade-off or an alternative, name it in one clause.
5. **Prefer false negatives to a false-positive flood.** A review that cries wolf gets
   ignored. Reserve the top severities for issues with a concrete, demonstrated failure path.

## Inputs
- The change set (diff/branch/PR or edited files) and read access to the surrounding code
  needed to confirm findings. Ideally a prior change map (see [[diff-summary]]) so hotspots
  (public APIs, auth, migrations, money, concurrency, deletions) are already identified.

## Output
- A list of confirmed findings, each with: location (`path:line`), the issue, the concrete
  impact if unaddressed, and the minimal fix — ready to be severity-ranked.
- Separately, low-impact nits, clearly marked as such.

## Notes
- Review the change, not the author: no personal style preferences dressed up as bugs.
- This is a read-and-report capability; it proposes fixes, it does not apply them. The
  consuming agent's tool scope decides whether edits are allowed.
- Map every security/correctness finding to its failure path; "looks risky" is not a finding.
