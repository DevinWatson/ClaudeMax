---
name: sast-triage
description: Use to triage existing SAST output (Semgrep, CodeQL, SonarQube, Bandit, gosec) into a short trustworthy list — parse SARIF/tool JSON, dedupe across tools and repeated root causes, classify each as true-positive / false-positive / needs-context by reading the actual source-to-sink path, re-score on this codebase's real risk, and give minimal fixes or precise targeted suppressions (never blanket-disable). TRIGGER when raw scan results already exist and need triage. Read-only; never authors new rules. Any agent that processes static-analysis results (a SAST triager, a CI security gate, a security reviewer) can load it.
allowed-tools: Read, Grep, Glob, Bash
category: security
tags: [security, sast, triage, static-analysis, sarif]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# SAST Triage

The substantive capability for turning noisy static-analysis output into a short, trustworthy,
actionable list: start from **existing tool results** and decide what is real — not a fresh manual
audit.

## When to use this skill
When SAST output already exists (SARIF, tool JSON, or pasted) and needs deduping, true/false-positive
classification, re-scoring, and fix/suppression recommendations. Pairs with a ranking skill (e.g.
[[severity-triage]]) to re-score true positives. Not for discovering issues from scratch with no
scan (that is appsec-review).

## Instructions
1. **Locate and parse the report(s).** SARIF (`.sarif`), tool JSON, or pasted output; confirm which
   report, which tool(s), and the codebase commit they correspond to. If you must re-run a scan to
   get machine-readable output, do so read-only (`semgrep --sarif`, `bandit -f json`) — but do not
   author new rules; triage what the tools produced. Normalize each finding into rule ID, CWE/OWASP
   mapping, severity-as-reported, file:line, and the matched data-flow/sink. Prefer SARIF since it
   carries rule metadata, code flows, and fingerprints.
2. **Deduplicate.** Collapse (a) the same issue from multiple tools, (b) one rule firing repeatedly
   on a single root cause (one tainted helper used in 20 places — report the source once), and (c)
   findings sharing a SARIF fingerprint. Track the occurrence count.
3. **Classify true vs. false positive — read the actual code.** For each unique finding, open the
   `file:line` and confirm:
   - Is there a real **source → sink** path with untrusted data, or is the input a constant /
     already-validated / framework-sanitized? Many injection alerts are false on parameterized
     queries or escaped templates.
   - Is the flagged code **reachable** (dead code, test fixtures, generated files are lower priority)?
   - Does the rule's assumption hold here (a "weak crypto" hit on a non-security cache-key hash is a
     false positive)?
   Mark each: **true positive**, **false positive** (with reason), or **needs-context** (you cannot
   confirm — say what's missing).
4. **Recommend fixes and suppressions.** For each true positive, give the minimal remediation
   (parameterize the query, encode output, pin the algorithm). For each false positive, give the
   precise suppression (inline `# nosec`/`// nosemgrep`, a baseline entry, or a rule-config tweak)
   so the noise does not return — never blanket-disable a rule.
5. **Rank for the consumer.** Hand true positives to a ranking skill ([[severity-triage]]),
   re-scored on *this codebase's* risk rather than the tool's default label (tools systematically
   over- and under-rate). Confidence reflects whether you traced the path yourself. Drop confirmed
   false positives from the action list but keep them listed for suppression/baselining.

## Inputs
- The SAST report(s), the tool(s) and commit they correspond to, and read access to the codebase
  to verify each finding's source-to-sink path.

## Output
- Scope (report(s), tool(s), commit; total raw findings → unique after dedupe).
- True positives, each with: rule-id (CWE), path:line, the issue, occurrence count, why-real
  evidence, and the minimal fix — ready to be severity-ranked.
- False positives, each with the reason it is benign and the exact suppression mechanism.
- Needs-context items with what is missing, and a summary (raw → actionable count, FP rate, top fixes).

## Notes
- Defensive only. Recommend remediations and suppressions; never write exploits or attack
  third-party systems.
- Read-only: suggest code fixes and suppression entries; do not edit code or rewrite rules yourself.
- Justify every dismissal — a false positive needs a stated reason and a targeted suppression; when
  you cannot confirm, label needs-context rather than guessing.
