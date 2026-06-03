---
name: azure-microsoft-entra-id
description: Use when designing, provisioning, securing, or operating Microsoft Entra ID (formerly Azure AD) — the cloud identity and access management directory for workforce/organizational identities (Microsoft Entra ID). Covers tenants, users and groups (dynamic + assigned), app registrations and enterprise apps (SSO, service principals, OAuth/OIDC/SAML), Conditional Access policies, multi-factor authentication and authentication methods, single sign-on, role-based access control and Privileged Identity Management (PIM) for just-in-time elevation, managed identities, and external collaboration (B2B guests). Loads the knowledge: model users/groups, register apps and configure SSO, enforce Conditional Access + MFA, assign roles via PIM, and verify sign-in and access work. Consumed by the microsoft-entra-id specialist and by the Azure role team when standing up the managed service (Microsoft Entra ID).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-microsoft-entra-id, identity, conditional-access, sso]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Microsoft Entra ID

The **cloud identity provider** for workforce/organizational identities (formerly Azure Active Directory) —
the directory of users, groups, and applications, the source of **single sign-on**, **Conditional Access**,
**MFA**, and **RBAC** across Azure and SaaS. This skill owns the **Entra tenant identity layer**: principals,
apps, policies, and role assignment.

## Core concepts and components
- **Tenant** — the dedicated directory instance; the boundary for identities, apps, and policies.
- **Users & groups** — cloud-only or **hybrid** (synced via Entra Connect) users; **groups** are **assigned**
  (manual members) or **dynamic** (membership rule on attributes) and drive app/role assignment and licensing.
- **App registrations & enterprise apps** — register an app to get a **service principal**; configure **SSO**
  (OIDC/OAuth2 or SAML), API permissions/scopes (delegated + application), and client secrets/**certificates**
  (prefer certs). Enterprise apps are the tenant's instances of (gallery or custom) apps.
- **Conditional Access (CA)** — policies that gate access by signals (user/group, app, device state, location,
  risk) and grant/block or require controls (**MFA**, compliant device). The core Zero Trust enforcement point.
- **MFA & authentication methods** — phishing-resistant methods (FIDO2, Windows Hello, certificate) and the
  Authenticator app; configured via authentication-methods policy.
- **RBAC & PIM** — **Entra roles** (directory roles like Global Admin) and **Azure RBAC** (resource access);
  **Privileged Identity Management** makes high-privilege roles **eligible** with **just-in-time** activation,
  approval, and time limits.
- **Managed identities** — Azure-managed service principals so workloads authenticate without secrets.

## Configuration and sizing
- Set the **license tier** (Free / Entra ID P1 / P2 — CA needs P1, PIM/Identity Protection need P2), model
  **users/groups** (prefer dynamic groups for scale), register **apps** with least-privilege scopes, author
  **Conditional Access** in report-only first, and configure **MFA**/authentication methods.

## Security and IAM
- This service **is** the IAM plane. Enforce **least privilege** (scoped role assignments, PIM eligible not
  permanent for admin roles, break-glass accounts excluded from CA), **phishing-resistant MFA** via Conditional
  Access, **app credentials as certificates/managed identities** (not long-lived secrets), and review with
  **access reviews** (governance). Protect Global Admin; use **named locations** and risk policies (P2).

## Cost levers
- Billed **per user per month** by license tier (Free/P1/P2), and many features (CA, PIM, Identity Protection,
  entitlement management) require **P1/P2**. Levers: license only users who need premium features (mixed
  licensing), use **group-based licensing** to avoid waste, and right-size P1 vs P2 to the features you enforce.

## Scaling and limits
- Scales to very large directories; limits include **objects per tenant** (raisable), **groups a user can
  belong to**, **app registrations**, role-assignment counts, and CA policy counts. Dynamic-group rule
  processing and Entra Connect sync latency matter at scale. One tenant per org boundary; multi-tenant needs
  cross-tenant settings / B2B.

## Operating procedure
1. **Provision** — within the **tenant**, create **users/groups** (`azuread_user`/`azuread_group`) and
   **app registrations** (`azuread_application` + `azuread_service_principal`) / enterprise apps; set the
   license tier.
2. **Configure** — wire **SSO** (OIDC/SAML) and API permissions, build **Conditional Access** (report-only →
   on), set **authentication methods/MFA**, and create role-eligible assignments.
3. **Secure** — enforce **MFA + CA**, use **PIM** (eligible, JIT, approval) for privileged roles, app
   **certificates/managed identities** over secrets, exclude **break-glass** accounts, and scope RBAC.
4. **Verify** — apply [[verify-by-running]]: confirm objects exist (`az ad user/group/app show`), use the
   **What If** tool to confirm a **Conditional Access** policy evaluates as intended, perform/inspect a test
   **sign-in** in the sign-in logs to confirm MFA was required and access granted/blocked, and confirm a
   **PIM** activation works. Capture state and result.

## Inputs
The tenant and identity sources (cloud vs hybrid), user/group model, applications needing SSO and their
protocol/scopes, access policies (who/what/conditions), MFA/authentication strategy, privileged-role model
(PIM), license tier, and external collaboration needs.

## Output
A Microsoft Entra ID configuration: modeled users/groups, registered apps with SSO and least-privilege scopes,
Conditional Access + MFA enforcement, PIM-governed privileged roles, managed identities for workloads — plus
verification that sign-in, CA evaluation, and PIM activation work as intended.

## Notes
- Gotchas: **CA requires P1, PIM/Identity Protection require P2** — confirm licensing before designing; always
  ship CA policies in **report-only** first and keep **break-glass accounts excluded** to avoid lockout; prefer
  **certificates/managed identities** over client secrets (and rotate); **dynamic group** rule changes take time
  to propagate; deleting an app registration breaks its service principal and SSO. Posture *review* of this
  config belongs to **azure-security-reviewer** — this skill **configures** Entra. 2nd consumer: the Azure role
  team (azure-iam-engineer / azure-cloud-architect / azure-iac-engineer). Cross-cloud peers: AWS IAM + IAM
  Identity Center, GCP Cloud Identity.
- IaC/CLI: Terraform **azuread** provider — `azuread_user`, `azuread_group`, `azuread_application`,
  `azuread_service_principal`, `azuread_conditional_access_policy`, `azuread_directory_role_assignment`; Bicep
  has limited Entra coverage (use azuread/Graph). CLI `az ad user/group/app/sp` and Microsoft Graph.
