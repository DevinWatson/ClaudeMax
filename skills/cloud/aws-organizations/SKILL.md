---
name: aws-organizations
description: Use when designing, provisioning, securing, or operating AWS Organizations — the organization root and management account, organizational units (OUs) and account hierarchy, service control policies (SCPs) and resource control policies (RCPs), tag policies and backup policies, consolidated billing, delegated administration for member services, account creation/invitation/move/close, trusted access for AWS services, and the all-features vs consolidated-billing mode (AWS Organizations). Loads the Organizations knowledge: how to structure OUs, author SCP guardrails, delegate admin, and verify a policy denies/allows as intended. Consumed by the Organizations specialist and by the AWS role team (aws-security-reviewer / aws-cloud-architect) for multi-account governance.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, organizations, multi-account, governance, scp, management-governance]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Organizations

AWS's multi-account governance foundation: it groups accounts into a hierarchy, applies
policy guardrails, and consolidates billing. Organizations is the **account-structure and
policy substrate** that higher-level governance (Control Tower) builds on top of.

## Core concepts and components
- **Management account + root** — the org's billing/admin owner and the top of the hierarchy.
  Keep it minimal and tightly controlled; do not run workloads in it.
- **Organizational units (OUs)** — nested containers grouping accounts by purpose
  (Security, Infrastructure, Workloads/Prod/Non-prod, Sandbox); policies attach to OUs and
  inherit downward.
- **Service control policies (SCPs)** — guardrails that set the **maximum** permissions for
  member accounts (they do not grant — IAM still must allow). Allow-list or deny-list
  strategy; deny is most common (e.g., deny disabling CloudTrail/region restrictions).
- **Resource control policies (RCPs)** — org-wide maximum permissions on resources
  (complementing SCPs which bound principals).
- **Tag policies / backup policies** — standardize tagging and centralize AWS Backup plans.
- **Consolidated billing** — one payer, combined volume discounts and RIs/Savings Plans
  shared across accounts.
- **Delegated administration / trusted access** — delegate a member account to administer a
  service (Config, GuardDuty, Security Hub, CloudTrail, StackSets) org-wide.

## Configuration and sizing
- Adopt an OU design (Security, Infrastructure, Workloads, Sandbox, Suspended). Enable
  **all features** (not just consolidated billing) to use SCPs. Keep SCPs small, layered by
  OU, and prefer deny-lists. Delegate admin to a dedicated Security/Audit account rather
  than the management account.

## Security and IAM
- The management account is the highest-value target — enforce MFA, minimal principals, no
  workloads. SCPs cannot be overridden by member-account IAM. Use SCPs to enforce baseline
  controls (mandatory CloudTrail, region lockdown, deny root actions). Delegate service
  admin to reduce management-account usage.

## Cost levers
- Organizations is free; the lever is **consolidated billing** — shared Savings Plans/RIs
  and volume tiering reduce spend across accounts. (Cost optimization/allocation is owned by
  the aws-cost-governor role; this skill provides the billing/account structure.)

## Scaling and limits
- Default quota of accounts per org (soft, raisable); OU nesting up to 5 levels; SCPs have
  size limits (~5 KB) and a max number attached per entity; new account creation is
  asynchronous. Policy changes propagate within seconds-to-minutes.

## Operating procedure
1. **Provision** — create the organization (all-features mode), build the OU hierarchy, and
   create/invite member accounts into the right OUs.
2. **Configure** — author and attach SCPs/RCPs per OU, tag/backup policies, and enable
   trusted access + delegated administration for org-wide services.
3. **Secure** — lock down the management account (MFA, no workloads), apply baseline deny
   SCPs (protect CloudTrail/Config, region restrictions), delegate audit to a Security
   account.
4. **Verify** — apply [[verify-by-running]]: from a member account in the targeted OU,
   attempt an action the SCP should deny and confirm it is denied (and an allowed action
   succeeds); `aws organizations list-accounts-for-parent` confirms placement;
   `describe-effective-policy` confirms the effective SCP/tag policy — capture the output.

## Inputs
Account inventory and intended OU placement, guardrail requirements (region/service
restrictions, protected controls), tag/backup standards, services to delegate, billing
ownership, and naming conventions.

## Output
The Organizations structure (OUs, account placement, SCPs/RCPs, tag/backup policies,
delegated admin, trusted access) as code, plus verification that an SCP denies the intended
action while allowed actions still work and accounts are placed correctly.

## Notes
- Gotchas: SCPs **restrict, never grant** — an SCP allow still needs IAM to allow; the
  management account is **not** subject to SCPs (do not rely on SCPs to constrain it); the
  implicit `FullAWSAccess` SCP must remain or attaching a restrictive one locks everything
  out; deleting/closing accounts and detaching the last SCP are high-risk; region-restriction
  SCPs must allow global services (IAM, CloudFront, Route 53). For an opinionated managed
  landing zone on top of this, see Control Tower; for cost allocation see the aws-cost-governor
  role.
- IaC/CLI: Terraform `aws_organizations_organization`,
  `aws_organizations_organizational_unit`, `aws_organizations_account`,
  `aws_organizations_policy`, `aws_organizations_policy_attachment`. CLI
  `aws organizations create-organization`, `create-organizational-unit`,
  `create-account`, `create-policy`, `attach-policy`, `list-accounts-for-parent`,
  `describe-effective-policy`. CloudFormation `AWS::Organizations::Organization`,
  `AWS::Organizations::OrganizationalUnit`, `AWS::Organizations::Account`,
  `AWS::Organizations::Policy`.
