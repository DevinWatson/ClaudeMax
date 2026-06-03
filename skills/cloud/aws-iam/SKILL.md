---
name: aws-iam
description: Use when designing, provisioning, securing, or operating AWS Identity and Access Management — users, groups, roles (and trust policies / AssumeRole), managed and inline policies, the IAM policy evaluation logic (explicit deny > allow > implicit deny, SCPs, permission boundaries, session/resource policies), permission boundaries, instance profiles, federation/OIDC and IAM Roles Anywhere, access keys vs roles, IAM Access Analyzer (external + unused access), credential reports, and last-accessed data for least-privilege right-sizing (AWS IAM). Loads the IAM knowledge: model identities and authorization, write and evaluate policies, scope trust, and verify effective permissions. Consumed by the IAM specialist and by the AWS role team (aws-iac-engineer / aws-security-reviewer) when they wire up access control.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, iam, identity, authorization, policies, security-identity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Identity and Access Management (IAM)

AWS's authentication and authorization control plane for **AWS principals**: who (users,
roles, federated identities) can do what (actions) on which resources, under what conditions.
IAM governs access to AWS APIs — it is not an end-user/customer identity store (that is
Cognito).

## Core concepts and components
- **Identities** — **users** (long-lived; avoid for humans, prefer SSO/federation), **groups**
  (permission bundles for users), and **roles** (assumable identities with no long-lived
  credentials; the right tool for workloads, cross-account, and federation).
- **Roles + trust policy** — a role has a **trust policy** (who may `sts:AssumeRole`) and one or
  more **permissions policies**. **Instance profiles** attach a role to EC2.
- **Policies** — **identity-based** (managed or inline), **resource-based** (on S3/KMS/etc.),
  **permission boundaries** (max permissions an identity can have), **session policies**, and
  org **SCPs**. JSON: `Effect`, `Action`, `Resource`, `Condition`.
- **Policy evaluation** — default deny; an **explicit Deny** always wins; otherwise access needs
  an **Allow** that is not capped by a permission boundary, SCP, or session policy, and (for
  cross-account) allows on both sides.
- **Federation** — SAML/OIDC identity providers, AWS IAM Identity Center (SSO), web identity,
  and **IAM Roles Anywhere** (X.509 for on-prem workloads).
- **Analysis** — **IAM Access Analyzer** (external access + **unused access** findings, policy
  validation, policy generation), **credential reports**, and **last-accessed** data.

## Configuration and sizing
- Prefer **roles over users**, short-lived STS credentials over access keys, and **groups** for
  human permission management via Identity Center. Start from least privilege and grow using
  Access Analyzer last-accessed/unused data. Apply **permission boundaries** to delegate IAM
  administration safely. Keep policies small and scoped by `Resource` and `Condition`.

## Security and IAM
- IAM *is* the security control: enforce MFA, rotate or eliminate access keys, deny `iam:*`
  broadly except to a controlled admin path, use permission boundaries for self-service role
  creation, and avoid `"Resource": "*"` with `"Action": "*"`. Condition keys (`aws:SourceIp`,
  `aws:PrincipalOrgID`, `aws:SourceArn`) tighten trust and resource policies.

## Cost levers
- IAM, Access Analyzer external-access, and credential reports are free. **IAM Access Analyzer
  unused-access analyzers are billed per resource monitored** — scope which accounts/resources
  they cover. No data-plane charge for AssumeRole/policy evaluation.

## Scaling and limits
- Quotas on managed policies attached per identity (10), policy document size, roles/users per
  account, and inline policy size; most are soft/raisable. Trust-policy and AssumeRole calls are
  high-throughput; session duration is bounded (1h default, up to 12h for roles).

## Operating procedure
1. **Provision** — create roles with tight **trust policies** and groups for humans via Terraform
   `aws_iam_role`/`aws_iam_group` or `aws iam create-role`; avoid creating long-lived users.
2. **Configure** — attach least-privilege managed/inline permissions policies, set permission
   boundaries where delegating, and wire federation/Identity Center as the human entry point.
3. **Secure** — enable IAM Access Analyzer (external + unused), require MFA, eliminate stale
   access keys (credential report), and add `Condition` constraints (org id, source arn, MFA).
4. **Verify** — apply [[verify-by-running]]: `aws iam simulate-principal-policy` (or
   `simulate-custom-policy`) to confirm the intended action is Allowed and an unintended one is
   Denied, `aws sts assume-role` to confirm the trust policy works, and check Access Analyzer
   findings show no unexpected external/unused access — capture the actual output.

## Inputs
The principals (humans, workloads, cross-account, federated), the actions/resources each needs,
trust relationships, boundary/delegation requirements, federation/SSO source, condition
constraints (MFA, org, source), and least-privilege/compliance targets.

## Output
The IAM configuration (roles with trust + permissions policies, groups, permission boundaries,
federation wiring, Access Analyzer enablement) as code, plus verification via policy simulation,
a successful scoped AssumeRole, and clean Access Analyzer findings.

## Notes
- Gotchas: an **explicit Deny** (including from an SCP or permission boundary) overrides any
  Allow — debug "access denied" by checking all five policy types, not just identity policies;
  cross-account access needs Allow on **both** the resource policy and the caller's identity
  policy; `iam:PassRole` is required to hand a role to a service and is a common privilege-
  escalation gap — scope it tightly; wildcards in trust policies (`"Principal": "*"`) are
  dangerous; access keys never expire — prefer roles; IAM changes are eventually consistent.
- IaC/CLI: Terraform `aws_iam_role`, `aws_iam_role_policy`, `aws_iam_policy`,
  `aws_iam_role_policy_attachment`, `aws_iam_user`, `aws_iam_group`, `aws_iam_instance_profile`,
  `aws_iam_openid_connect_provider`, `aws_accessanalyzer_analyzer`. CLI `aws iam create-role`,
  `put-role-policy`, `attach-role-policy`, `simulate-principal-policy`,
  `get-account-authorization-details`, `generate-credential-report`. CloudFormation
  `AWS::IAM::Role`, `AWS::IAM::ManagedPolicy`, `AWS::IAM::InstanceProfile`.
