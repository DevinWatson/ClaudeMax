---
name: gcp-identity-platform
description: Use when designing, provisioning, securing, or operating Identity Platform — Google Cloud's customer identity and access management (CIAM) service for adding sign-up, sign-in, and auth to your apps (Identity Platform). The enterprise-grade evolution of Firebase Auth: covers email/password and many social/federated providers, OIDC and SAML enterprise SSO, multi-factor authentication (SMS/TOTP), multi-tenancy (per-tenant user pools and providers), the user store and account management, ID/refresh token issuance and verification, blocking functions and custom claims, plus IAM, quotas, and cost. Loads the Identity Platform knowledge: enable providers, configure MFA and tenants, integrate the SDK, verify tokens, and verify end to end. Consumed by the Identity Platform specialist and by the GCP role team (gcp-cloud-architect / gcp-security-reviewer) when adding customer auth (Identity Platform).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, identity-platform, management, ciam, authentication, mfa, multi-tenancy]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Identity Platform

Google Cloud's **customer identity and access management (CIAM)** service — the enterprise-grade evolution
of **Firebase Authentication**. It lets you add **sign-up, sign-in, and authentication** to your web and
mobile apps for **end users/customers** (not your workforce), with social/federated login, enterprise SSO,
MFA, and multi-tenancy, backed by an SLA and Google-managed token infrastructure.

## Core concepts and components
- **Identity providers** — **email/password**, phone, anonymous, many **social** providers (Google,
  Apple, Facebook, GitHub, Microsoft, etc.), and **federated** providers via **OIDC** and **SAML** for
  enterprise SSO into your app.
- **User store** — the managed directory of customer accounts (UID, email, claims, metadata) with account
  lifecycle (create/disable/delete), email verification, and password reset.
- **MFA** — **multi-factor authentication** (SMS, TOTP) layered on sign-in for stronger customer auth.
- **Multi-tenancy** — **tenants** give each customer/org its own isolated **user pool and provider
  config** within one project (B2B SaaS), with per-tenant settings.
- **Tokens** — issues **ID tokens (JWT)** and **refresh tokens**; your backend **verifies** the ID token
  (via the Admin SDK / JWKS) to authenticate API calls. **Custom claims** carry authorization data.
- **Blocking functions / triggers** — Cloud Functions that run on **before-create / before-sign-in** to
  enforce custom policy (allowlist domains, enrich claims, block).
- **SDK integration** — client SDKs (Firebase Auth JS/Android/iOS) for the sign-in UI/flows; the **Admin
  SDK** for server-side user management and token verification.

## Configuration and sizing
- Decide **single-tenant vs multi-tenant** (B2B SaaS → tenants). Enable only the **providers** you need and
  configure each (client IDs/secrets, SAML/OIDC metadata). Set the **MFA** policy. Decide where
  **authorization** lives — **custom claims** vs your own DB. Plan **blocking functions** for domain
  allowlists/claim enrichment. Identity Platform is for **customers**; workforce identity is Cloud
  Identity.

## Security and IAM
- Harden the **customer auth surface**: enforce **email verification** and strong **password policy**,
  enable **MFA** for sensitive apps, set **authorized domains** (and blocking functions to allowlist),
  and rate-limit. **Verify ID tokens server-side** on every request — never trust client claims. Store
  provider **secrets** in Secret Manager. GCP **IAM** (`roles/identitytoolkit.admin/viewer`) governs who
  **administers** the service; it does not govern your app's end users (custom claims do).

## Cost levers
- Billed by **monthly active users (MAU)** tiered by provider type (password/social vs enterprise
  SAML/OIDC vs MFA), plus SMS costs for phone/MFA. Levers: prefer **free-tier** providers where possible,
  reserve enterprise SAML/OIDC and SMS-MFA for users that need them, and clean up inactive accounts.

## Scaling and limits
- Quotas on **sign-in/token operations**, **tenants per project**, providers per tenant, and SMS sends
  apply. SMS-MFA depends on carrier deliverability/region. Token verification is **stateless** (JWKS) and
  scales well; refresh-token revocation and account changes are **eventually consistent**.

## Operating procedure
1. **Provision** — enable `identitytoolkit.googleapis.com` (Identity Platform); enable the **default
   config** and, for B2B, create **tenants** (Terraform `google_identity_platform_config` /
   `google_identity_platform_tenant`).
2. **Configure** — enable and configure **providers** (email/password, social, OIDC/SAML), set **MFA** and
   **authorized domains**, add **blocking functions**, and integrate the **client SDK** + server **Admin
   SDK** token verification (`google_identity_platform_*_idp_config`).
3. **Secure** — enforce **email verification / password policy / MFA**, allowlist domains, store provider
   secrets in **Secret Manager**, verify **ID tokens server-side**, and set least-privilege
   **identitytoolkit.* IAM** for admins.
4. **Verify** — apply [[verify-by-running]]: complete a **sign-up + sign-in** flow for a test user, have
   the **backend verify the ID token** and read a **custom claim**, confirm **MFA** is required where set,
   and (multi-tenant) confirm a user in **tenant A cannot authenticate against tenant B**. Capture the
   successful sign-in, the verified token/claim, and the tenant-isolation/MFA check.

## Inputs
The app's auth needs (providers, social/enterprise SSO), single- vs multi-tenant model, MFA policy,
where authorization lives (custom claims vs app DB), blocking-function/domain-allowlist rules, and the
client/backend SDK integration points.

## Output
An Identity Platform configuration: enabled/configured providers (incl. OIDC/SAML SSO), MFA, tenants for
multi-tenancy, blocking functions and authorized domains, server-side token verification, least-privilege
admin IAM — plus verification of a full sign-in flow, server-side token/claim verification, and an
MFA/tenant-isolation check.

## Notes
- Gotchas: always **verify ID tokens server-side** (never trust client-sent claims); this is **CIAM for
  end users**, not workforce identity (that is Cloud Identity); it is the **enterprise evolution of
  Firebase Auth** (same client SDKs); **multi-tenancy** isolates user pools — don't mix tenants;
  SMS-MFA cost/deliverability varies by region; **MAU-based pricing** by provider tier. 2nd consumer:
  the GCP role team (gcp-cloud-architect / gcp-security-reviewer) adding customer auth. Cross-cloud peers:
  AWS Cognito, Azure/Microsoft Entra External ID.
- IaC/CLI: Terraform `google_identity_platform_config`, `google_identity_platform_tenant`,
  `google_identity_platform_default_supported_idp_config`, `google_identity_platform_oauth_idp_config`,
  `google_identity_platform_tenant_inbound_saml_config`. Admin SDK / `gcloud` + REST (Identity Toolkit
  API) for user management; verify by completing a sign-in and validating the ID token server-side.
