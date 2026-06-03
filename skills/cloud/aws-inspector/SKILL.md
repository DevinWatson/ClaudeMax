---
name: aws-inspector
description: Use when designing, provisioning, securing, or operating Amazon Inspector — continuous automated vulnerability management for EC2 instances, ECR container images, and Lambda functions (code + dependencies), CVE detection against the EC2/ECR/Lambda scanning engines, SSM-agent-based and agentless EC2 scanning, network reachability analysis, software bill of materials (SBOM) export, the Inspector risk score, finding suppression rules, delegated-administrator org enablement, and routing findings to AWS Security Hub and EventBridge (Amazon Inspector). Loads the Inspector knowledge: enable continuous scanning across accounts, triage CVE findings, and verify coverage. Consumed by the Inspector specialist and by the AWS role team (aws-iac-engineer / aws-security-reviewer) when they add vulnerability scanning.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, inspector, vulnerability-scanning, cve, sbom, security-identity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Inspector

AWS's **continuous, automated vulnerability management** service. It scans **EC2 instances,
ECR container images, and Lambda functions** for known software vulnerabilities (CVEs) and
unintended network exposure, and produces prioritized findings — without scheduled scan jobs.

## Core concepts and components
- **Scan engines** — **EC2** (OS/system packages + optional **network reachability**), **ECR**
  (container image OS and programming-language package CVEs, with **continuous re-scan** on new
  CVE data or re-push), and **Lambda** (function dependency CVEs plus optional **Lambda code
  scanning** for insecure code). Each is independently enabled.
- **EC2 scan modes** — **agent-based** via the SSM Agent (deep package inventory) and
  **agentless** (EBS-snapshot-based, no agent) — Inspector chooses per instance under hybrid
  mode.
- **Findings** — each carries a **CVE/CWE**, affected package + fix version, an **Inspector
  score** and CVSS, and exploitability/network-reachability context. Findings update and auto-
  close as packages are patched.
- **SBOM export** — export a **software bill of materials** (CycloneDX) per resource to S3 for
  supply-chain inventory.
- **Suppression rules** — filter expected/accepted findings without losing the underlying data.
- **Org enablement** — a **delegated administrator** account enables Inspector and auto-enables
  new member accounts; findings flow to **Security Hub** and **EventBridge**.

## Configuration and sizing
- Enable only the scan types you need per account, set **auto-enable** for new members at the
  org level, and use **ECR re-scan duration** (lifetime vs days) to bound image scan cost. Tag
  resources so suppression rules and routing can target them. For EC2, ensure the SSM Agent +
  instance role are present for agent-based depth, or rely on agentless for coverage breadth.

## Security and IAM
- Inspector needs a service-linked role and (for SSM scanning) the instance profile to allow
  SSM. Restrict `inspector2:Enable`/`Disable`/`UpdateConfiguration` to the security team.
  Findings can expose package inventory — control Security Hub/S3 SBOM access. Agentless EC2
  scanning reads EBS snapshots; keep that path least-privileged.

## Cost levers
- Billed per **EC2 instance**, per **ECR image scanned** (initial + re-scans), and per **Lambda
  function** evaluated. Levers: scope auto-enable, shorten ECR re-scan windows for low-value
  repos, exclude non-production accounts, and prefer agentless where agent depth is unnecessary.

## Scaling and limits
- Continuous scanning scales with resource count; findings and suppression-rule quotas apply.
  ECR re-scan triggers on new CVE intelligence and on image push. Org coverage is bounded by the
  delegated-admin model and member auto-enable.

## Operating procedure
1. **Provision** — designate the Inspector **delegated administrator** and enable the desired
   scan types (EC2/ECR/Lambda) with member auto-enable via Terraform
   `aws_inspector2_enabler` / `aws_inspector2_delegated_admin_account` or
   `aws inspector2 enable`.
2. **Configure** — set EC2 hybrid (agent/agentless) mode, ECR re-scan duration, Lambda code
   scanning, and ensure SSM Agent + instance roles exist; add suppression rules for accepted
   findings.
3. **Secure** — route findings to Security Hub and EventBridge for triage/automation, enable
   SBOM export to S3 for supply-chain inventory, and lock down enable/disable permissions.
4. **Verify** — apply [[verify-by-running]]: `aws inspector2 batch-get-account-status` confirms
   the scan types are ENABLED, `aws inspector2 list-coverage` confirms target resources are
   actually being scanned (not "INACTIVE"), and `aws inspector2 list-findings` returns expected
   findings for a known-vulnerable test image — capture the actual output.

## Inputs
The accounts/resources to cover (EC2/ECR/Lambda), org/delegated-admin model, scan-mode
preferences, ECR re-scan policy, accepted-finding suppression criteria, and the findings
destination (Security Hub/EventBridge/SBOM-to-S3).

## Output
The Inspector configuration (delegated admin, enabled scan types, EC2 scan mode, ECR re-scan
duration, suppression rules, findings routing, SBOM export) as code, plus verification of
account status ENABLED, active coverage, and expected findings on a known-vulnerable resource.

## Notes
- Gotchas: EC2 **agent-based** depth requires a working SSM Agent + instance role — without it
  coverage shows INACTIVE; Lambda **code** scanning is separate from dependency scanning and
  costs more; ECR re-scan duration controls how long images keep getting re-scanned for new
  CVEs; suppression rules hide findings from views but do not delete the data; disabling a scan
  type stops scanning but keeps existing findings until they age out; Inspector reports CVEs but
  does not patch — remediation is yours.
- IaC/CLI: Terraform `aws_inspector2_enabler`, `aws_inspector2_delegated_admin_account`,
  `aws_inspector2_organization_configuration`, `aws_inspector2_member_association`. CLI
  `aws inspector2 enable`, `batch-get-account-status`, `list-coverage`, `list-findings`,
  `create-filter`, `create-sbom-export`. CloudFormation `AWS::InspectorV2::Filter`,
  `AWS::InspectorV2::CisScanConfiguration`.
