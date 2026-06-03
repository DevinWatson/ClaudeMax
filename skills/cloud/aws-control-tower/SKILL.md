---
name: aws-control-tower
description: Use when designing, provisioning, securing, or operating AWS Control Tower — the landing zone (multi-account baseline built on AWS Organizations), guardrails/controls (preventive SCP-based, detective Config-based, proactive CloudFormation-hooks; mandatory/strongly-recommended/elective), Account Factory and Account Factory for Terraform (AFT) for governed account provisioning, the management/log-archive/audit foundational accounts, the Customizations for Control Tower (CfCT) pipeline, controls applied to OUs, and landing-zone drift/repair (AWS Control Tower). Loads the Control Tower knowledge: how to set up a landing zone, enable controls on OUs, vend accounts via Account Factory, and verify controls enforce and the zone has no drift. Consumed by the Control Tower specialist and by the AWS role team (aws-security-reviewer / aws-cloud-architect) for multi-account governance.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, control-tower, landing-zone, multi-account, governance, management-governance]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Control Tower

AWS's opinionated, managed multi-account governance: it sets up a secure **landing zone**
on top of AWS Organizations and enforces **controls (guardrails)** across OUs. Control Tower
**builds on Organizations** — Organizations provides the account/OU/SCP substrate; Control
Tower automates and standardizes a best-practice landing zone over it.

## Core concepts and components
- **Landing zone** — the baselined multi-account environment: a management account plus
  foundational **Log Archive** and **Audit** accounts, a Security OU, and centralized
  CloudTrail/Config logging.
- **Controls (guardrails)** — governance rules in three behaviors: **preventive** (SCPs that
  block actions), **detective** (Config rules that flag non-compliance), and **proactive**
  (CloudFormation hooks that block non-compliant resources before creation). Categorized
  **mandatory**, **strongly recommended**, and **elective**, and enabled per OU.
- **Account Factory** — self-service, governed account provisioning that applies the
  baseline automatically; **Account Factory for Terraform (AFT)** does the same via a GitOps
  Terraform pipeline.
- **Customizations for Control Tower (CfCT)** — a pipeline to layer your own
  CloudFormation/SCPs onto accounts/OUs as they are vended.
- **Drift detection / repair** — Control Tower detects when the landing zone or controls
  have drifted from baseline and offers repair; landing-zone versions are upgraded over time.

## Configuration and sizing
- Design the OU layout (Security, Sandbox, Workloads) before enablement; enable mandatory
  controls everywhere and strongly-recommended on workload OUs. Use Account Factory/AFT for
  every new account so the baseline always applies. Centralize logging in Log Archive and
  delegate security tooling to Audit.

## Security and IAM
- Control Tower configures cross-account roles, centralized CloudTrail (org trail) and Config
  in Log Archive/Audit. Keep the management account minimal. Controls are enforced via SCPs
  (preventive) and Config (detective) — do not edit Control-Tower-managed SCPs/Config rules
  by hand or you cause drift. Treat landing-zone settings as security-critical.

## Cost levers
- Control Tower has no direct charge, but it enables CloudTrail, Config, and S3 logging that
  do cost — the main lever is **Config configuration-item and rule volume** in every governed
  account and CloudTrail/S3 storage. Scope detective controls thoughtfully.

## Scaling and limits
- Account/OU counts follow Organizations limits; control enablement is per-OU and can take
  minutes; landing-zone and AFT operations are asynchronous. Not all regions support Control
  Tower equally — confirm region availability.

## Operating procedure
1. **Provision** — set up the landing zone (or register an existing org), creating Log
   Archive and Audit accounts and the baseline OUs.
2. **Configure** — enable controls (mandatory + chosen strongly-recommended/elective) on the
   right OUs; wire Account Factory/AFT and CfCT for governed vending and customizations.
3. **Secure** — confirm centralized CloudTrail/Config, minimal management account, and
   delegated security tooling; avoid manual edits to managed guardrails.
4. **Verify** — apply [[verify-by-running]]: vend a test account via Account Factory and
   confirm it lands in the OU with the baseline applied; from that account attempt an action
   a preventive control should block and confirm denial; run
   `aws controltower list-enabled-controls`/`get-landing-zone` and confirm enabled controls
   and **no drift** — capture the output.

## Inputs
Existing org/account state, desired OU layout and control set per OU, account-vending model
(Account Factory vs AFT), customizations to layer (CfCT), logging/audit account
requirements, and region scope.

## Output
The Control Tower configuration (landing zone, foundational accounts, enabled controls per
OU, Account Factory/AFT, CfCT customizations) as code/runbook, plus verification that a
vended account is baselined, a preventive control blocks the intended action, and the
landing zone reports no drift.

## Notes
- Gotchas: Control Tower **manages** SCPs and Config rules — editing them directly in
  Organizations/Config causes **landing-zone drift** that must be repaired; controls are
  enabled per OU, not per account; not every governance need maps to a built-in control
  (use CfCT/custom SCPs for the rest); enrolling pre-existing accounts can fail if they
  conflict with the baseline; some controls are region-scoped. For raw account/OU/SCP
  mechanics without the managed layer, see Organizations.
- IaC/CLI: Terraform `aws_controltower_landing_zone`, `aws_controltower_control`, and the AFT
  module; CfCT uses a CloudFormation/CodePipeline manifest. CLI
  `aws controltower enable-control`, `disable-control`, `list-enabled-controls`,
  `get-landing-zone`, `list-landing-zones`. Much of Control Tower is provisioned through its
  own console/service rather than CloudFormation, with controls expressed as control
  identifiers applied to OU ARNs.
