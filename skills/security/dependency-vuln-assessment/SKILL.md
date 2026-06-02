---
name: dependency-vuln-assessment
description: Use to audit a project's third-party dependencies for known vulnerabilities — run SCA tools read-only (npm audit, osv-scanner, pip-audit, Trivy, govulncheck, cargo audit) against the lockfile, normalize and dedupe advisories by ID, assess reachability/exploitability (direct vs transitive, prod vs dev, vulnerable function actually called), weigh CVSS against reachability, and recommend the smallest safe upgrade. TRIGGER on "scan/audit dependencies for CVEs" or supply-chain advisory review. Defensive and read-only — never mutates manifests or runs upgrades. Any agent that assesses dependency risk (an SCA scanner, a release gate, a security reviewer) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: security
tags: [security, sca, dependencies, cve, supply-chain]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Dependency Vulnerability Assessment

The substantive software-composition-analysis (SCA) capability: find *known* vulnerabilities in
a project's third-party dependencies, judge whether each is actually exploitable here, and
recommend the safest upgrade — reading published advisories, not hunting novel bugs.

## When to use this skill
When auditing dependencies/lockfiles for known CVEs/advisories and recommending upgrades. Pairs
with a ranking skill (e.g. [[severity-triage]]) to combine advisory severity with reachability.
Not for reviewing the project's own first-party code (that is appsec-review).

## Instructions
1. **Scope to the lockfiles.** Identify the ecosystems and lockfiles in play
   (`package-lock.json`/`pnpm-lock.yaml`/`yarn.lock`, `requirements.txt`/`poetry.lock`/
   `Pipfile.lock`, `go.sum`, `Cargo.lock`, `pom.xml`/`build.gradle`, container images /
   `Dockerfile`). Prefer scanning the **lockfile** so results reflect exact resolved versions,
   and state whether dev/transitive deps are included.
2. **Run the right scanner read-only** — never modify files:
   - Node: `npm audit --json`, or `osv-scanner --lockfile=package-lock.json`.
   - Python: `pip-audit -r requirements.txt` or against `poetry.lock`.
   - Polyglot / containers / IaC: `osv-scanner scan -r .` and `trivy fs --scanners vuln .` or
     `trivy image <ref>`.
   - Go: `govulncheck ./...` (also gives call-graph reachability). Rust: `cargo audit`.
   Capture raw JSON so findings are reproducible.
3. **Normalize and dedupe.** Collapse the same advisory reported across tools/paths into one
   finding keyed by advisory ID (GHSA/CVE/OSV) and affected package@version. Record the
   dependency path (direct vs. transitive) and which manifest pulls it in.
4. **Assess reachability and exploitability — do not just forward the CVSS.** For each advisory:
   is the package a **direct** or **transitive** dependency, and `prod` or `dev`/test only? Is
   the **vulnerable function/feature actually called** (use the advisory's affected symbols,
   `govulncheck` reachability, and `Grep`)? Do the advisory's preconditions hold here? Down-rank
   "present but unreachable"; flag "reachable in a request path" higher.
5. **Recommend the safe upgrade path.** Give the minimum fixed version per finding and whether it
   is a patch/minor/major (breaking) bump — prefer the smallest non-breaking jump that clears the
   advisory. For transitive deps, name the override/resolution that fixes it. Note when no fix
   exists (suggest mitigation/temporary pin) and watch for upgrades that pull in *new* advisories.
6. **Rank for the consumer.** Hand each finding to a ranking skill ([[severity-triage]]) combining
   the advisory's CVSS vector (not just the number) with your reachability assessment — a critical
   CVE in unreachable dev-only code is not critical *for this project*; say so.

## Inputs
- The lockfiles/manifests/images in scope, access to run SCA scanners read-only, and the codebase
  for reachability checks.

## Output
- Scope (manifests/images scanned, tools used, prod/dev/transitive coverage).
- Findings, each with: package@version, advisory ID, vuln class, dependency path (direct/transitive,
  prod/dev), reachability verdict with evidence, and the fix (version + patch/minor/major, override
  if transitive) — ready to be severity-ranked.
- A no-fix-available list with mitigations, and a summary with counts and the upgrade recommendation.

## Notes
- Defensive only. Report known vulnerabilities and remediations; never write exploit code.
- Read-only: run scanners in reporting mode (`--json`) and read files. Never run package-manager
  mutations (`npm install`, `npm audit fix`, `pip install`, `cargo update`) — hand the user the
  exact commands instead.
- Distinguish "advisory exists" from "exploitable here"; state reachability and confidence honestly.
