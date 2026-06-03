---
name: aws-firewall-manager
description: Use when designing, provisioning, securing, or operating AWS Firewall Manager — centrally defining and enforcing security policies across all accounts and resources in an AWS Organization, policy types for AWS WAF (web ACLs + rule groups), AWS Shield Advanced, security groups (common/audit/usage), AWS Network Firewall, Route 53 Resolver DNS Firewall, and third-party firewalls, automatic remediation and continuous compliance of new/non-compliant resources, policy scope by account/OU/tag, the delegated-administrator model, and the prerequisite of AWS Config + Organizations all-features (AWS Firewall Manager). Loads the Firewall Manager knowledge: author org-wide policies, scope them, and verify enforcement. Consumed by the Firewall Manager specialist and by the AWS role team (aws-iac-engineer / aws-security-reviewer) when they enforce protections at scale.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, firewall-manager, org-wide-policy, multi-account, governance, security-identity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Firewall Manager

AWS's **central security-policy management** service for an **AWS Organization**. It defines a
protection once and **automatically enforces it across all current and future accounts and
resources** — so new resources are protected and drift is remediated continuously. It is the
org-wide policy layer; the per-resource configuration of WAF/Shield/etc. is done by those services.

## Core concepts and components
- **Policy types** — **AWS WAF** (associate a web ACL + rule groups across resources), **Shield
  Advanced** (apply DDoS protection org-wide), **security group** policies (**common** apply a
  baseline SG, **audit** flag/remediate over-permissive rules, **usage** find unused SGs),
  **AWS Network Firewall** (deploy across VPCs), **Route 53 Resolver DNS Firewall**, and
  **third-party/Marketplace** firewalls.
- **Scope** — a policy targets accounts/resources by **account ID, OU, or resource tag**
  (include/exclude), so coverage follows the org structure automatically.
- **Automatic remediation** — when on, Firewall Manager creates/associates the protection on
  non-compliant resources and re-applies it as new resources appear; when off, it only reports
  compliance.
- **Delegated administrator** — a non-management member account is designated to run Firewall
  Manager (the Organizations management account cannot be the FMS admin for policy creation).
- **Compliance status** — per-policy, per-account compliance with violation details.

## Configuration and sizing
- Prerequisites: **AWS Organizations with all features enabled**, **AWS Config** enabled in every
  in-scope account/Region, and a designated **Firewall Manager delegated administrator**. Author
  policies centrally, scope by OU/tag, and decide per policy whether remediation is **automatic**
  (enforce) or **report-only** first. Use exclusion tags to carve out exceptions.

## Security and IAM
- Restrict `fms:PutPolicy`/`DeletePolicy` and delegated-admin designation to the security team.
  Firewall Manager assumes a service-linked role in member accounts to enforce policies; the
  resources it manages (WAF web ACLs, SGs, Network Firewall) carry their own IAM. Report-only
  first avoids enforcing a misconfigured policy org-wide.

## Cost levers
- Billed **per policy per Region per month**, plus the cost of the underlying protections it
  deploys (WAF web ACLs/rules, Shield Advanced, Network Firewall endpoints). Levers: consolidate
  policies, scope tightly by OU/tag, and remember each managed protection bills as its own
  service.

## Scaling and limits
- Quotas on policies per org and accounts/resources per policy. Enforcement scales with the
  org; remediation is eventually consistent as Config reports new resources. Coverage gaps appear
  where Config is not enabled.

## Operating procedure
1. **Provision** — ensure Organizations all-features + Config are enabled, then designate the
   **Firewall Manager delegated administrator** via `aws fms associate-admin-account` /
   Terraform `aws_fms_admin_account`.
2. **Configure** — author the policy (WAF/Shield/SG/Network Firewall/DNS Firewall) with
   Terraform `aws_fms_policy` or `aws fms put-policy`, set the **scope** (accounts/OUs/tags), and
   start in **report-only** to observe compliance.
3. **Secure** — enable **automatic remediation** once the policy is validated, add exclusion tags
   for sanctioned exceptions, and restrict policy/admin actions to the security team.
4. **Verify** — apply [[verify-by-running]]: `aws fms get-admin-account` confirms the delegated
   admin, `aws fms list-policies` confirms the policy exists, and
   `aws fms get-compliance-detail` (or `list-compliance-status`) confirms in-scope accounts are
   COMPLIANT and the protection is actually present on a target resource — capture the actual
   output.

## Inputs
The org structure (OUs/accounts) and tagging scheme, the protection to enforce (WAF rules/Shield/
SG baseline/Network Firewall/DNS Firewall), the scope and exclusions, the remediation mode
(report vs enforce), and confirmation that Organizations all-features + Config are enabled.

## Output
The Firewall Manager configuration (delegated admin, policies with scope and remediation mode,
exclusions) as code, plus verification of the admin account, the policy, and per-account
compliance with the protection present on a real target resource.

## Notes
- Gotchas: requires **Organizations all-features** and **AWS Config enabled everywhere** — missing
  Config means accounts silently fall out of scope; the **management account cannot be the FMS
  admin** for policy creation — use a delegated admin; enabling **automatic remediation org-wide
  can mass-modify resources** — always soak in report-only first; a WAF policy here associates web
  ACLs but the rule *content* is still authored in AWS WAF; security-group **audit** vs **common**
  policies behave very differently (flag vs enforce baseline).
- IaC/CLI: Terraform `aws_fms_admin_account`, `aws_fms_policy`. CLI
  `aws fms associate-admin-account`, `get-admin-account`, `put-policy`, `list-policies`,
  `get-policy`, `list-compliance-status`, `get-compliance-detail`. CloudFormation
  `AWS::FMS::Policy`, `AWS::FMS::NotificationChannel`, `AWS::FMS::ResourceSet`.
