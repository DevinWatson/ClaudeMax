---
name: gcp-cloud-identity
description: Use when designing, provisioning, securing, or operating Cloud Identity — Google Cloud's identity-as-a-service for managing workforce users, groups, and devices and acting as an identity provider for Google services (Cloud Identity). Covers managed user accounts and the organization domain, groups and group-based access (the backbone of IAM grants), single sign-on (SSO/SAML/OIDC) with external IdPs, directory and user/group provisioning (SCIM, Google Cloud Directory Sync from on-prem AD/LDAP), device management and context-aware access, MFA/2SV and security policies, plus admin roles and limits. Loads the Cloud Identity knowledge: set up the domain, provision users/groups, federate SSO, enforce MFA/device policy, and verify. Consumed by the Cloud Identity specialist and by the GCP role team (gcp-cloud-architect / gcp-security-reviewer) when establishing workforce identity (Cloud Identity).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-identity, management, identity, sso, groups, workforce-identity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Identity

Google Cloud's **identity-as-a-service** for the **workforce**: it manages your organization's **users,
groups, and devices**, and acts as the **identity provider (IdP)** for Google services. It is the source
of the **groups and accounts** that GCP IAM grants are bound to, so it underpins org-wide access.

## Core concepts and components
- **Managed user accounts + domain** — Cloud Identity owns your verified **domain** and provisions
  **managed Google identities** (employees) under the organization; the Admin Console / Directory API
  administer them.
- **Groups** — the **backbone of access management**: bind IAM roles to **groups**, not individuals, so
  membership changes (not policy edits) control access. Groups are also used for mailing/membership.
- **Single sign-on (SSO)** — federate with an **external IdP** (Okta, Microsoft Entra ID, Ping, ADFS) via
  **SAML/OIDC**, or use Google as the IdP for third-party SaaS apps.
- **Directory provisioning** — **Google Cloud Directory Sync (GCDS)** mirrors users/groups from on-prem
  **Active Directory/LDAP**; **SCIM** auto-provisions accounts from an IdP. Keeps the directory authoritative.
- **Device management** — endpoint/device inventory, enrollment, and **context-aware access** (device
  posture + location as access conditions, with Access Context Manager / BeyondCorp).
- **Security policies** — **MFA/2-Step Verification** enforcement, session controls, password policy, and
  **admin roles** (super admin vs delegated admin) for least-privilege administration.

## Configuration and sizing
- Decide **editions** (Cloud Identity Free vs Premium for advanced device/security features). Verify the
  **domain**, choose the **authoritative source** (Google-native, GCDS from AD, or IdP via SCIM), and
  design a **group model** that maps cleanly to IAM. Pick the **SSO topology** (Google as IdP vs external
  IdP). Plan **MFA enforcement** and any **context-aware access** policies.

## Security and IAM
- This is **workforce identity** — the front door. Enforce **MFA/2SV** (ideally phishing-resistant
  security keys), minimize **super admins** (separate, hardware-key-protected break-glass accounts), use
  **delegated admin roles** for least privilege, and apply **context-aware access** for sensitive groups.
  Groups drive **GCP IAM** bindings, so group membership is a security boundary. Audit with admin/login
  audit logs.

## Cost levers
- **Cloud Identity Free** covers core identity/SSO/groups; **Premium** adds advanced device management,
  endpoint security, and reporting at a per-seat cost. Lever: license only the users who need Premium
  features; core IAM-group usage is free.

## Scaling and limits
- Limits on **users, groups, group membership depth/size**, and **SSO profiles** apply per organization.
  GCDS/SCIM sync runs on a **schedule** (not instant). **Super admin** count should be minimal. Identity
  changes (group membership) propagate to IAM with **eventual consistency**.

## Operating procedure
1. **Provision** — verify the **domain**, create the organization, and establish the **authoritative
   source**: native users, **GCDS** from AD/LDAP, or **SCIM** from the IdP. Create the **group model** that
   will back IAM (Terraform `google_cloud_identity_group` / `google_cloud_identity_group_membership`).
2. **Configure** — set up **SSO** (Google as IdP or external SAML/OIDC IdP), wire **SCIM/GCDS**
   provisioning, and define **device/context-aware access** policies as needed.
3. **Secure** — enforce **MFA/2SV** (security keys), minimize and protect **super admins** (break-glass),
   assign **delegated admin roles** least-privilege, and apply context-aware access to sensitive groups.
4. **Verify** — apply [[verify-by-running]]: confirm a test user can **SSO** in (and that a non-provisioned
   user cannot), confirm a **group** exists and that adding a member **grants the bound GCP IAM access**
   (cross-check with `gcloud projects get-iam-policy`), and confirm **MFA is enforced** for the test
   account. Capture the successful SSO, the group-driven access change, and the MFA enforcement.

## Inputs
The verified domain and org, the authoritative identity source (native / AD via GCDS / IdP via SCIM), the
group model that maps to IAM, the SSO topology, MFA/device/context-aware policy requirements, and the
admin-role/least-privilege plan.

## Output
A Cloud Identity setup: provisioned users/groups (authoritative source synced), SSO federation, enforced
MFA and minimized super admins, device/context-aware access policies, and a group model that backs GCP
IAM — plus verification of SSO, group-driven IAM access, and MFA enforcement.

## Notes
- Gotchas: bind IAM to **groups, not users** (so membership controls access); minimize and **harden super
  admins** with security keys and break-glass; **GCDS/SCIM sync is scheduled**, not instant; group/IAM
  changes are **eventually consistent**; Premium vs Free gates advanced device features. This is
  **workforce** identity (employees/admins) — for **customer/end-user** auth use Identity Platform. 2nd
  consumer: the GCP role team (gcp-cloud-architect / gcp-security-reviewer) establishing workforce
  identity. Cross-cloud peers: AWS IAM Identity Center, Azure/Microsoft Entra ID.
- IaC/CLI: Terraform `google_cloud_identity_group`, `google_cloud_identity_group_membership`, and SSO/
  context-aware via Admin/Access Context Manager APIs (often configured in the Admin Console + GCDS/SCIM,
  not pure Terraform). CLI `gcloud identity groups`, `gcloud organizations`, and `gcloud projects
  get-iam-policy` to confirm group-driven access; GCDS for AD sync.
