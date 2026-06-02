---
name: verify-by-running
description: Use before claiming that code or config builds, compiles, lints, type-checks, or passes tests — pick the right verify command for the stack, run it, capture the ACTUAL output, and report the exact command + result. Distinguish observed-pass from assumed-pass; if you cannot run it here, say so and give the exact command rather than asserting success. The general sibling of reproduce-then-fix (which is bug-specific).
allowed-tools: Read, Bash
category: engineering
tags: [verification, build, lint, typecheck, tests, ci]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Verify By Running

A language-agnostic discipline for any claim that code or configuration *works* — that it
builds, compiles, lints, type-checks, validates, or passes tests. The rule is simple: run the
appropriate command and report what actually happened, rather than asserting an outcome you
did not observe.

## When to use this skill
Whenever you are about to state that something is correct in a way a command can confirm:
"it compiles", "lint passes", "types check", "the build succeeds", "tests are green", "the
config is valid". If a tool can verify the claim, verify it before making the claim.

This is the **general sibling of [[reproduce-then-fix]]**: that skill is bug-specific (make a
failure observable, then fix it); this one is the broader pre-claim check that *any* "it works"
assertion is backed by an actual run.

## Instructions
1. **Pick the right verify command for the stack.** Detect the ecosystem from the project
   files and use its canonical command. Prefer the project's own script (a `Makefile` target,
   `package.json` script, `tox`/`nox` env, CI step) over a generic invocation, since it
   encodes the project's flags. Common defaults:
   - **JS/TS:** `npm test` / `pnpm test`; type-check `tsc --noEmit`; lint `eslint .`; build
     `npm run build` (or `next build`, `vite build`).
   - **Python:** `pytest`; lint/format `ruff check` / `flake8`; types `mypy` / `pyright`.
   - **Rust:** `cargo build`, `cargo clippy`, `cargo test`.
   - **Go:** `go build ./...`, `go vet ./...`, `go test ./...`.
   - **Java/JVM:** `mvn verify` / `./gradlew build test`.
   - **Containers/IaC:** `docker build .`; `terraform validate` / `terraform fmt -check`;
     `promtool check rules`; `dbt build`; `kubeval`/`kubeconform` for manifests.
   - **SQL/data:** run the query (or a representative subset) against sample data and check the
     result, since "valid syntax" is not "correct result."
   When unsure which command the project uses, read the build/CI config to find it rather than
   guessing flags.
2. **Run it and capture the ACTUAL output.** Execute the command and keep the real output —
   exit code, the pass/fail summary, the count of tests/errors. Do not paraphrase a result you
   imagine; quote what the tool printed.
3. **Report the exact command + result.** State the command you ran verbatim and its observed
   outcome, so the claim is auditable and reproducible. "Ran `tsc --noEmit` → 0 errors" beats
   "the types are fine."
4. **Distinguish observed-pass from assumed-pass.** Only say it passes if you saw it pass. If
   you reasoned that it *should* pass but did not run it, label that explicitly as an
   expectation, not a result.
5. **If you cannot run it here, say so — and give the exact command.** When the environment
   lacks the toolchain, network, services, or credentials to run the check, state that plainly
   and hand the user the exact command(s) to run themselves. Never substitute "should work"
   for a real run; an unverified "it builds" is the failure mode this skill exists to prevent.
6. **On failure, report it honestly** with the real error, rather than hiding it or claiming
   partial success. A surfaced failure is a successful verification. If the goal is now to *fix*
   that failure, hand off to [[reproduce-then-fix]] (reproduce → root-cause → minimal fix → guard).

## Inputs
- The code or config change to be asserted-correct, and the project files needed to determine
  the right verify command (build config, CI definition, manifest).

## Output
- The exact verify command run (verbatim) and its observed result (exit status + summary).
- A clear `observed-pass` vs `assumed-pass` / `not-run-here` label on the claim.
- On failure or inability to run: the real error or the precise reason it couldn't run, plus
  the exact command for the user to run.

## Notes
- This is a *pre-claim* check, not a debugging loop — when the goal is fixing a reported defect,
  use [[reproduce-then-fix]] (reproduce → root-cause → minimal fix → guard) instead.
- Match the project's existing flags/scripts; a verify run with different flags than CI can
  pass locally yet fail in CI, which defeats the purpose.
- For nondeterministic suites, run more than once before declaring green (an intermittent pass
  is not a pass).
- The `Bash` grant is what enables an actual run; it is conditional on the environment. An agent
  whose own tool scope is read-only (no Bash) cannot satisfy this skill's core step — such agents
  should not list `verify-by-running` in their `skills:`; step 5 (surface the exact command for
  the user to run) is the fallback when execution isn't possible.
