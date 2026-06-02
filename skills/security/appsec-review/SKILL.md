---
name: appsec-review
description: Use for a defensive, code-level application-security review — trace untrusted input from each entry point to its sinks and find injection (SQL/NoSQL/command/template), broken authn/authz and IDOR, secrets exposure, unsafe deserialization, SSRF/open-redirect/path-traversal, and crypto misuse, confirming reachability before reporting and giving a concrete minimal remediation per finding. TRIGGER on "security review / appsec audit" of code or a diff the user is authorized to review. Defensive and read-only — never produces weaponized exploits. Any agent that reviews code for security (an appsec auditor, a security-aware code reviewer, a PR-gate bot) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: security
tags: [security, appsec, audit, owasp, injection, authz]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AppSec Review

The substantive defensive application-security capability: build a source-to-sink data-flow
picture of code the user is authorized to review and find real, reachable vulnerabilities with
concrete remediations — never weaponized attacks.

## When to use this skill
When auditing first-party code or a change for security defects: injection, broken access
control, secrets exposure, unsafe deserialization, SSRF, or crypto misuse. For authorized
review of the user's own codebase only. Pairs with a ranking skill (e.g. [[severity-triage]])
to order findings. Not for triaging existing SAST output (that is sast-triage) or scanning
third-party dependencies (that is dependency-vuln-assessment).

## Instructions
1. **Scope and map trust boundaries.** Identify what code/change is in scope, what the asset
   is, and where untrusted input enters (HTTP params/body/headers, file uploads, message
   queues, env, cross-service calls). Build a quick data-flow picture from sources to sinks.
2. **Trace untrusted input to sinks** for each entry point. Walk the review checklist, adapting
   to the stack:
   - **Injection** — SQL/NoSQL/command/template/LDAP injection where untrusted input reaches a
     sink without parameterization or escaping.
   - **AuthN/AuthZ** — missing or incorrect access checks, IDOR (object access by id with no
     ownership check), privilege escalation, trusting client-supplied identity/role.
   - **Secrets** — hardcoded keys, secrets in logs/error messages, secrets shipped in client
     bundles.
   - **Input handling** — missing validation, unsafe deserialization (pickle, Java serializable,
     YAML), path traversal, SSRF, open redirects.
   - **Crypto** — weak or rolled-your-own algorithms, static IVs/nonces, predictable randomness,
     improper password storage (unsalted/fast hashes).
   - **Transport / headers / config** — missing TLS, permissive CORS, debug endpoints exposed.
3. **Confirm reachability before reporting.** For each candidate, verify it is reachable and
   exploitable in context (untrusted data actually flows to the sink, the code path is live).
   Down-rank or mark lower-confidence anything you cannot confirm; do not inflate theoretical
   issues into confirmed ones.
4. **Remediate concretely.** Give a specific, minimal fix per finding (parameterize the query,
   add the ownership check, move the secret to a manager, pin a strong algorithm) — the change,
   not a lecture.
5. **Rank for the consumer.** Hand each finding to a ranking skill ([[severity-triage]]) with a
   severity and confidence so the most important, most certain issues surface first.

## Inputs
- The code or diff in scope, the entry points / trust boundaries, and enough context to judge
  reachability (routing, auth middleware, ORM/query layer, deserialization config).

## Output
- Scope and trust boundaries summary.
- Findings, each with: location (`path:line`), vulnerability class, how it is reachable (the
  data flow), and a concrete minimal remediation — ready to be severity-ranked.
- Lower-priority defense-in-depth hardening suggestions, kept separate from confirmed findings.

## Notes
- Defensive only. Provide remediations and explain risk; never produce weaponized exploit code
  or attacks against systems the user does not own.
- Read-and-report: this capability inspects and reports — applying fixes is the consuming
  agent's decision and tool scope. Do not run intrusive scans.
- Distinguish confirmed-reachable issues from theoretical ones; state confidence honestly.
