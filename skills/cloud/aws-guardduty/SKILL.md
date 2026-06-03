---
name: aws-guardduty
description: Use when designing, provisioning, securing, or operating Amazon GuardDuty — continuous threat detection from data sources (VPC Flow Logs, DNS query logs, CloudTrail management + S3 data events, EKS audit logs), protection plans (S3 Protection, EKS/Runtime Monitoring, Malware Protection for EC2/S3, RDS Protection, Lambda Protection), findings (types, severity, sample findings) and finding format, threat intel + trusted IP lists, suppression rules and filters, delegated administrator and organization auto-enable, and exporting findings to EventBridge / S3 / Security Hub for response (Amazon GuardDuty). Loads the GuardDuty knowledge: enable detectors and protection plans org-wide, tune findings, and verify detection fires and routes. Consumed by the GuardDuty specialist and by the AWS role team (aws-iac-engineer / aws-security-reviewer) when they enable threat detection.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, guardduty, threat-detection, findings, security-identity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon GuardDuty

AWS's managed **threat detection** service. It continuously analyzes account and network
activity to surface malicious or unauthorized behavior as **findings** — without you deploying
or managing agents/infrastructure for the core data sources. It detects; response/triage is
wired downstream.

## Core concepts and components
- **Detector** — the per-region GuardDuty resource that must be enabled to analyze that region.
- **Data sources** — foundational, always-on once enabled: **VPC Flow Logs**, **DNS query logs**,
  and **CloudTrail management events**. GuardDuty ingests these directly (no need to enable the
  logs yourself for GuardDuty's use).
- **Protection plans** (opt-in, additional cost): **S3 Protection** (CloudTrail S3 data events),
  **EKS Protection** (EKS audit logs) + **Runtime Monitoring** (eBPF agent on EKS/ECS/EC2),
  **Malware Protection** (EBS scan on suspicious EC2 + on-upload S3 object scanning), **RDS
  Protection** (Aurora login activity), and **Lambda Protection** (network activity).
- **Findings** — typed (e.g. `Recon:`, `UnauthorizedAccess:`, `CryptoCurrency:`, `Trojan:`),
  with **severity** (low/medium/high), evidence, and a stable finding type/ID. **Sample findings**
  can be generated for testing.
- **Lists** — **trusted IP lists** (suppress) and **threat lists** (flag) for custom intel.
- **Filters + suppression rules** — narrow noise / auto-archive expected findings.
- **Organization model** — a **delegated administrator** account enables GuardDuty across the org
  with **auto-enable** for new accounts; findings aggregate to the admin.

## Configuration and sizing
- Enable the detector in **every region in use** (threats are regional). Turn on only the
  protection plans whose data you care about (Runtime Monitoring and Malware Protection add the
  most cost). Use the delegated-admin + auto-enable model for org-wide coverage. Build
  suppression rules for known-benign patterns instead of disabling detection.

## Security and IAM
- GuardDuty uses **service-linked roles** to read its data sources; Malware Protection needs a
  role to snapshot/scan EBS and a KMS grant for encrypted volumes. Restrict who can disable the
  detector, delete findings, or modify suppression rules (a common attacker objective). Export
  findings to a centralized, locked-down account. GuardDuty reads logs internally — you do not
  hand it your CloudTrail/VPC logs directly.

## Cost levers
- Billed by **volume analyzed**: CloudTrail events, VPC Flow Log + DNS GB, S3 data events, EKS
  audit events, Runtime Monitoring agent-hours, Malware Protection GB scanned, RDS login events,
  Lambda network GB. Biggest levers: scope **S3 data event** and **Runtime Monitoring** coverage,
  and use the 30-day free trial estimate before org-wide enablement.

## Scaling and limits
- Detectors are per-account-per-region; the org model scales to all accounts via auto-enable.
  Findings are retained ~90 days in GuardDuty (export to S3/Security Hub for longer). Quotas on
  filters, trusted IP/threat lists, and members per detector (mostly soft/raisable).

## Operating procedure
1. **Provision** — enable the detector per region via Terraform `aws_guardduty_detector` (and set
   the delegated administrator + org auto-enable via `aws_guardduty_organization_admin_account` /
   `aws_guardduty_organization_configuration`) or `aws guardduty create-detector`.
2. **Configure** — enable the relevant protection plans (S3/EKS/Runtime/Malware/RDS/Lambda), add
   threat/trusted-IP lists, and create suppression filters for known-benign findings.
3. **Secure** — restrict detector-disable/finding-delete IAM, centralize findings to a locked
   account, and route findings to EventBridge → SNS/Security Hub for response.
4. **Verify** — apply [[verify-by-running]]: `aws guardduty create-sample-findings` (or
   `get-findings`/`list-findings`) and confirm sample findings appear, then confirm the
   EventBridge rule fires the downstream action (SNS/Security Hub) and that a suppression filter
   archives the intended type — capture the actual output.

## Inputs
The accounts/regions in scope, which protection plans the workloads warrant (S3/EKS/Runtime/
Malware/RDS/Lambda), org delegated-admin model, threat/trusted-IP intel, expected-benign patterns
to suppress, findings destination (EventBridge/S3/Security Hub), and cost tolerance.

## Output
The GuardDuty configuration (detectors per region, enabled protection plans, lists, suppression
filters, org auto-enable, findings export wiring) as code, plus verification that findings are
generated, route to the downstream responder, and benign noise is suppressed.

## Notes
- Gotchas: GuardDuty is **regional** — enabling it in one region leaves others blind; **disabling
  a detector deletes its findings**, so suspend rather than delete if pausing; Runtime Monitoring
  needs the **security agent** deployed (managed for EKS/Fargate, agent for EC2/ECS-EC2); Malware
  Protection cannot scan volumes encrypted with a KMS key it lacks a grant on; suppressed
  findings still count toward cost (they were analyzed); org auto-enable must be set or new
  accounts are uncovered; findings older than ~90 days are gone unless exported.
- IaC/CLI: Terraform `aws_guardduty_detector`, `aws_guardduty_detector_feature`,
  `aws_guardduty_filter`, `aws_guardduty_ipset`, `aws_guardduty_threatintelset`,
  `aws_guardduty_organization_admin_account`, `aws_guardduty_organization_configuration`. CLI
  `aws guardduty create-detector`, `update-detector`, `create-sample-findings`, `list-findings`,
  `get-findings`, `create-filter`. CloudFormation `AWS::GuardDuty::Detector`,
  `AWS::GuardDuty::Filter`, `AWS::GuardDuty::IPSet`.
