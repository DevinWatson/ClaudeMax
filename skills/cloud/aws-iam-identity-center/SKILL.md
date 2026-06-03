---
name: aws-iam-identity-center
description: Use when designing, provisioning, securing, or operating AWS IAM Identity Center (successor to AWS SSO) — workforce single sign-on across AWS accounts and SAML/OIDC apps, the identity source choice (Identity Center directory, Active Directory, or external IdP via SAML + SCIM provisioning of users/groups), permission sets (managed/inline/custom policies + permission boundaries + session duration) assigned to principals on accounts/OUs across an AWS Organization, the AWS access portal and short-lived role credentials, attribute-based access control (ABAC), MFA enforcement, and trusted identity propagation to apps (AWS IAM Identity Center). Loads the Identity Center knowledge: wire the identity source, model permission sets, assign access, and verify sign-in. Consumed by the Identity Center specialist and by the AWS role team (aws-iac-engineer / aws-security-reviewer) when they centralize workforce access.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, iam-identity-center, sso, workforce-identity, permission-sets, security-identity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS IAM Identity Center

AWS's **workforce single sign-on** service (formerly AWS SSO). It centrally manages **human**
access to multiple AWS accounts and to SAML/OIDC business applications from one identity source,
issuing **short-lived** role credentials through an access portal. It governs workforce/employee
access — not AWS service principals (IAM) and not end-user/customer app identities (Cognito).

## Core concepts and components
- **Identity source** — exactly one of: the built-in **Identity Center directory**, **AWS
  Managed/self-managed Active Directory** (via AD Connector), or an **external IdP** (Okta, Entra
  ID, Ping, etc.) federated by **SAML** with user/group **SCIM** provisioning.
- **Permission sets** — reusable definitions of what access looks like in an account: AWS managed
  + customer managed + inline policies, an optional **permission boundary**, and a **session
  duration** (1–12h). A permission set provisions an IAM role into each assigned account.
- **Account assignments** — bind a **principal (user or group)** to a **permission set** on a
  **target (account or OU)** across the **AWS Organization**, so group membership drives access.
- **Access portal** — the user-facing portal/CLI (`aws sso login`) that issues short-lived
  credentials; no long-lived keys for humans.
- **ABAC** — attribute-based access control using identity-source attributes mapped to session
  tags for fine-grained, scalable authorization.
- **Application assignments / trusted identity propagation** — assign SAML/OIDC apps and propagate
  the human identity into AWS analytics services (e.g. Redshift, QuickSight, Lake Formation).

## Configuration and sizing
- Enable Identity Center in the **Organizations management account**, pick **one** identity source
  (external IdP + SCIM is the scalable default for an existing corporate directory), and model
  access as **group → permission set → account/OU** rather than per-user grants. Set conservative
  **session durations** and enforce MFA. Use OUs so assignments scale as accounts are added.

## Security and IAM
- Identity Center *is* the human authentication boundary: enforce **MFA** (and consider
  passwordless/WebAuthn), keep permission sets least-privilege with permission boundaries, and
  prefer short session durations. Protect the management-account delegated administration.
  Removing a user in the external IdP should de-provision via SCIM — verify deprovisioning works.

## Cost levers
- IAM Identity Center itself has **no additional charge**; you pay only for the AWS resources used
  under assumed roles and any directory (AWS Managed AD) you run. Lever: prefer the free built-in
  directory or external-IdP federation over a paid managed directory where possible.

## Scaling and limits
- Quotas on permission sets, account assignments, and SCIM-provisioned users/groups; most are
  raisable. One identity source per instance. Assignments to **OUs** scale automatically to new
  member accounts; per-account assignments do not.

## Operating procedure
1. **Provision** — enable IAM Identity Center in the org management account and configure the
   **identity source** (external IdP SAML + SCIM, AD, or built-in) via Terraform
   `aws_ssoadmin_*` / `aws sso-admin` and the IdP's SCIM connector.
2. **Configure** — create **permission sets** (`aws_ssoadmin_permission_set` +
   `aws_ssoadmin_managed_policy_attachment` / inline) with session duration and permission
   boundaries, and create **account assignments** (`aws_ssoadmin_account_assignment`) binding
   groups to permission sets on accounts/OUs.
3. **Secure** — enforce MFA, set least-privilege permission sets with boundaries, configure ABAC
   attribute mappings, and confirm SCIM deprovisioning removes departed users.
4. **Verify** — apply [[verify-by-running]]: `aws sso-admin list-permission-sets` and
   `list-account-assignments` confirm the intended access, and an actual `aws sso login` +
   `aws sts get-caller-identity` (or portal sign-in) confirms a test user gets the expected role
   and an unauthorized account is NOT accessible — capture the actual output.

## Inputs
The identity source (IdP/AD/built-in), the org accounts/OUs, the workforce groups and what each
should access, required session durations, MFA/ABAC requirements, and any SAML/OIDC apps to assign.

## Output
The Identity Center configuration (identity source + SCIM, permission sets with boundaries/session
duration, group-to-account/OU assignments, MFA/ABAC) as code, plus verification that a test user
signs in and receives exactly the expected access and no more.

## Notes
- Gotchas: only **one identity source** per instance and switching it can reset
  assignments/provisioning; **SCIM** must be configured for the external IdP or users/groups will
  not appear; assign to **groups and OUs**, not individual users/accounts, so it scales; permission
  sets provision an IAM role per account — editing the permission set re-provisions all of them;
  it manages **humans**, not service principals (that's IAM) or app end-users (that's Cognito);
  enable in the **management account** (delegated administration is limited).
- IaC/CLI: Terraform `aws_ssoadmin_permission_set`, `aws_ssoadmin_managed_policy_attachment`,
  `aws_ssoadmin_customer_managed_policy_attachment`, `aws_ssoadmin_permissions_boundary_attachment`,
  `aws_ssoadmin_account_assignment`, `aws_identitystore_user`/`group`. CLI
  `aws sso-admin create-permission-set`, `list-permission-sets`, `create-account-assignment`,
  `list-account-assignments`, `aws identitystore list-users`, `aws sso login`. CloudFormation
  `AWS::SSO::PermissionSet`, `AWS::SSO::Assignment`, `AWS::SSO::InstanceAccessControlAttributeConfiguration`.
