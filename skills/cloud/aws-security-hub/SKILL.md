---
name: aws-security-hub
description: Use when designing, provisioning, securing, or operating AWS Security Hub — centralized security findings aggregation in the AWS Security Finding Format (ASFF) from GuardDuty, Inspector, Macie, IAM Access Analyzer, Firewall Manager, and partner products, automated security standards and controls (CIS AWS Foundations, PCI DSS, AWS Foundational Security Best Practices/FSBP, NIST), the consolidated control finding and security score, insights (saved finding queries), automation rules and EventBridge-based response, cross-Region finding aggregation, and delegated-administrator org enablement with auto-enabled controls (AWS Security Hub). Loads the Security Hub knowledge: aggregate findings, enable standards, and verify scoring. Consumed by the Security Hub specialist and by the AWS role team (aws-iac-engineer / aws-security-reviewer) when they centralize posture management.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, security-hub, findings-aggregation, compliance-standards, posture, security-identity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Security Hub

AWS's **cloud security posture management (CSPM) and findings-aggregation** hub. It collects,
normalizes, and prioritizes security findings from AWS services and partners into a single pane,
runs automated **security standards** as continuous controls, and produces a security score per
account/standard. Security Hub aggregates and scores; it does not itself detect threats.

## Core concepts and components
- **Findings aggregation (ASFF)** — ingests findings in the **AWS Security Finding Format** from
  **GuardDuty, Inspector, Macie, IAM Access Analyzer, Firewall Manager, Config**, and partner
  integrations, deduplicating into a normalized store.
- **Security standards & controls** — turnkey standards: **CIS AWS Foundations Benchmark**, **PCI
  DSS**, **AWS Foundational Security Best Practices (FSBP)**, and **NIST 800-53**. Each is a set
  of **controls** that run continuously (many backed by AWS Config) and produce pass/fail control
  findings and a **security score**.
- **Consolidated control findings** — one finding per control regardless of how many standards
  reference it, reducing noise.
- **Insights** — saved, grouped finding queries (e.g. "resources with the most failed controls").
- **Automation rules** — automatically update finding fields (severity, workflow status,
  suppression) on ingest; combine with **EventBridge** for automated response/ticketing.
- **Aggregation Region** — designate a home Region that aggregates findings from all linked
  Regions for a single view.
- **Org model** — a **delegated administrator** enables Security Hub, auto-enables new members,
  and centrally configures which standards/controls apply (central configuration policies).

## Configuration and sizing
- Use **central configuration** from the delegated admin to enable Security Hub, choose
  standards, and turn controls on/off org-wide without per-account drift. Set a single
  **aggregation Region**. Enable only the standards you must report against (FSBP is the broad
  default; CIS/PCI/NIST for compliance). Use automation rules to suppress accepted-risk controls.

## Security and IAM
- Restrict `securityhub:*` admin (enable/disable standards, batch-update-findings, central config)
  to the security team. Note Security Hub controls often depend on **AWS Config** recording the
  relevant resource types — controls show "no data" without it. Cross-Region aggregation and
  member enablement use the org/delegated-admin trust.

## Cost levers
- Billed per **security check** (control evaluation) per account per Region and per **finding
  ingestion event** above a free tier. Levers: disable unneeded standards/controls, set one
  aggregation Region, suppress noisy controls with automation rules, and scope Config recording
  so dependent controls only run where needed.

## Scaling and limits
- Findings retention is ~90 days; insight, automation-rule, and member-account quotas apply.
  Control evaluation scales with enabled standards x resources x Regions x accounts. Cross-Region
  aggregation centralizes the view but each linked Region still evaluates locally.

## Operating procedure
1. **Provision** — designate the Security Hub **delegated administrator**, enable the hub, and
   set the **aggregation Region** via Terraform `aws_securityhub_account` /
   `aws_securityhub_organization_admin_account` or `aws securityhub enable-security-hub`.
2. **Configure** — enable the required standards (FSBP/CIS/PCI/NIST) via central configuration,
   turn off controls that don't apply, ensure AWS Config records the dependent resource types,
   and enable product integrations (GuardDuty/Inspector/Macie/Access Analyzer).
3. **Secure** — add automation rules to suppress accepted risks and normalize severity, wire
   EventBridge to ticketing/response, and restrict admin actions to the security team.
4. **Verify** — apply [[verify-by-running]]: `aws securityhub get-enabled-standards` confirms the
   intended standards are enabled, `aws securityhub describe-products` /
   `list-enabled-products-for-import` confirms integrations feed findings,
   `aws securityhub get-findings` returns aggregated findings, and the security score reflects
   real control results (not "no data") — capture the actual output.

## Inputs
The accounts/Regions to cover, org/delegated-admin and aggregation-Region model, required
compliance standards, product integrations to ingest, Config recording status for dependent
controls, automation/suppression rules, and the response/ticketing destination.

## Output
The Security Hub configuration (delegated admin, aggregation Region, enabled standards/controls,
product integrations, automation rules, EventBridge response) as code, plus verification of
enabled standards, feeding integrations, aggregated findings, and a meaningful security score.

## Notes
- Gotchas: many controls **depend on AWS Config** recording the resource type — without Config
  they report "no data," not "pass"; **consolidated control findings** must be on to avoid
  duplicate findings across standards; findings retention is ~90 days — export for long-term
  audit; Security Hub aggregates but does not detect — GuardDuty/Inspector/Macie are the sources;
  set exactly one aggregation Region to avoid a fragmented view; automation rules run on ingest
  only (not retroactively).
- IaC/CLI: Terraform `aws_securityhub_account`, `aws_securityhub_standards_subscription`,
  `aws_securityhub_organization_admin_account`, `aws_securityhub_organization_configuration`,
  `aws_securityhub_product_subscription`, `aws_securityhub_finding_aggregator`,
  `aws_securityhub_automation_rule`, `aws_securityhub_insight`. CLI
  `aws securityhub enable-security-hub`, `get-enabled-standards`, `batch-enable-standards`,
  `get-findings`, `batch-update-findings`, `create-automation-rule`,
  `update-security-control`. CloudFormation `AWS::SecurityHub::Hub`, `AWS::SecurityHub::Standard`,
  `AWS::SecurityHub::AutomationRule`, `AWS::SecurityHub::FindingAggregator`.
