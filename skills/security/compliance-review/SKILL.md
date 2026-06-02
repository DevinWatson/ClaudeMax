---
name: compliance-review
description: Use when reviewing code or a change for compliance obligations — open-source license obligations (SPDX identification, copyleft/attribution), data-handling and privacy (PII/PHI classification, retention, consent, minimization), regulatory control mapping (SOC 2 / GDPR / HIPAA and similar), and whether the change leaves the audit evidence a control requires. TRIGGER on a compliance/privacy/license review of code or a diff the user is authorized to review. This is engineering-level compliance triage, NOT legal advice — flag anything material for qualified counsel. Language- and framework-agnostic — the obligations, not the syntax. Any agent that gates changes on compliance (a compliance reviewer, a privacy-aware code reviewer, a release-gate bot) can load it.
allowed-tools: Read, Grep, Glob
category: security
tags: [compliance, privacy, licensing, gdpr, hipaa, soc2, pii]
version: 0.1.0
maintainer: devinwatson@gmail.com
license: MIT
status: experimental
---

# Compliance Review

The substantive capability for engineering-level compliance triage: examine code/changes for license,
privacy, and regulatory obligations and report concrete gaps with the obligation behind each — without
giving legal advice. Read-only and language-agnostic. Where an issue is materially uncertain or
high-stakes, flag it for qualified counsel rather than resolving it yourself.

## When to use this skill
When reviewing first-party code or a change the user is authorized to review for compliance:
open-source license obligations, data-handling/privacy, regulatory control mapping, and audit evidence.
Not for finding exploitable vulnerabilities (that is appsec-review) and not a substitute for a lawyer.
Pairs with [[not-professional-advice]] (frame the legal disclaimer) and [[severity-triage]] (rank
findings).

## Instructions
1. **Scope and applicable regimes.** Identify the code/change in scope and which obligations plausibly
   apply: the project's own license and its dependencies' licenses, the data categories the code
   touches, and any regulatory regime in play (SOC 2, GDPR, HIPAA, PCI, CCPA, or the one the user names).
   Confirm authorization to review.
2. **License obligations.** Inventory third-party code introduced or relied on; identify each
   dependency's license by its SPDX identifier. Flag copyleft (GPL/AGPL/LGPL) reaching into proprietary
   code, attribution/notice requirements not met, license incompatibilities, and missing or incorrect
   SPDX headers / NOTICE entries. State the obligation each flag triggers.
3. **Data handling and privacy.** Trace what personal data the change collects, stores, transmits, or
   logs. Classify it (PII/PHI/financial/sensitive). Check data minimization (collecting only what's
   needed), retention (is there a deletion path?), consent/lawful basis, encryption in transit/at rest,
   purpose limitation, and PII leaking into logs/analytics/third parties. Flag cross-border transfer
   where relevant.
4. **Regulatory control mapping.** Map the change to the relevant controls — e.g. access control and
   audit logging (SOC 2 CC), data-subject rights and minimization (GDPR), PHI safeguards and access
   logging (HIPAA). For each in-scope control, state whether the change satisfies, weakens, or is
   silent on it.
5. **Audit evidence.** Determine whether the change produces the evidence a control needs to be
   demonstrable: audit/access logs, approval records, configuration as code, data-flow documentation.
   Flag where a control is effectively met but unprovable for lack of evidence.
6. **Report with the obligation, not a verdict.** For each finding give the location (`path:line`), the
   specific obligation/regime, why the code falls short, and a concrete remediation. Mark items that are
   materially legal questions for counsel rather than asserting a legal conclusion.

## Inputs
- The code or diff in scope, the dependency manifest / license metadata, the applicable regimes (or
  enough context to infer them), and the data categories the system handles.

## Output
- Scope and the regimes/obligations assessed.
- Findings, each with: location (`path:line`), the obligation/regime, the gap, and a concrete
  remediation — ready to be severity-ranked.
- A clearly separated list of items flagged for qualified counsel (material legal questions), framed via
  [[not-professional-advice]].

## Notes
- This is not legal advice — provide engineering-level triage and surface obligations; defer material
  legal judgments to counsel.
- Read-and-report only: identify gaps and remediations; applying changes is the consuming agent's
  decision and tool scope.
- Distinguish a confirmed obligation from a possible one, and state your confidence; license/regime
  applicability is fact-dependent.
