---
name: azure-entra-id-b2c
description: Use when designing, provisioning, securing, or operating Microsoft Entra External ID / Azure AD B2C — customer identity and access management (CIAM) for sign-up/sign-in of external/consumer users to your apps (Microsoft Entra External ID (B2C)). Covers the dedicated B2C/External ID tenant, user flows (built-in sign-up/sign-in/password-reset/profile-edit) vs custom policies (Identity Experience Framework / TrustFramework XML), external identity providers (social + SAML/OIDC federation), local accounts and user attributes/custom claims, UI/branding customization, token configuration and API connectors, and access via Entra/RBAC. Loads the knowledge: create the CIAM tenant, register the app, build user flows or custom policies, federate IdPs, secure tokens, and verify sign-up/sign-in and token claims. Consumed by the entra-id-b2c specialist and by the Azure role team when standing up the managed service (Microsoft Entra External ID / B2C).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-entra-id-b2c, identity, ciam, user-flows]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Microsoft Entra External ID (Azure AD B2C)

The **customer identity and access management (CIAM)** platform — sign-up/sign-in, profile, and federation for
**external/consumer users** of your applications, separate from your workforce directory. This skill owns the
**CIAM tenant layer**: user flows/custom policies, identity providers, attributes/claims, and tokens.

## Core concepts and components
- **B2C / External ID tenant** — a **dedicated** consumer directory, separate from your workforce Entra tenant;
  holds **local accounts** and federated external users.
- **User flows (policies)** — built-in, configurable journeys: **sign-up/sign-in**, **password reset**,
  **profile edit**. Fast to stand up; cover the common cases.
- **Custom policies** — the **Identity Experience Framework (IEF)** using **TrustFramework** XML policy files
  for fully custom journeys (complex orchestration, REST calls, multiple IdPs). Powerful but advanced.
- **Identity providers** — **local accounts** (email/username + password) plus **social** (Google, Facebook,
  Apple, etc.) and **federated** SAML/OIDC enterprise IdPs.
- **User attributes & custom claims** — built-in + **custom attributes** collected at sign-up and emitted as
  **token claims**; **API connectors** call external REST APIs mid-flow (validation/enrichment).
- **App registration & tokens** — the relying app registers in the B2C tenant; **token configuration**
  (lifetimes, claims, audience) and **UI/branding** customize the experience.

## Configuration and sizing
- Create the **B2C/External ID tenant** and link it to a subscription for billing, register the **app(s)**,
  choose **user flows** (default) vs **custom policies** (advanced), configure **IdPs** and **user attributes**,
  customize **branding**, and set **token** lifetimes/claims. Sizing is by **monthly active users (MAU)**.

## Security and IAM
- Tenant administration via **Entra roles/RBAC** in the B2C tenant. Protect the consumer experience with
  **MFA** in flows, **age/abuse** controls, custom-domain + branding to prevent phishing, secure **API
  connector** endpoints (auth + allowlist), and store **IdP/app secrets** safely (rotate). Token claims should
  expose the minimum needed; validate `iss`/`aud` in the app.

## Cost levers
- Billed on a **monthly active users (MAU)** model with a generous free tier, plus per-authentication for some
  premium features (e.g. phone-based MFA). Levers: stay within the MAU free allotment where possible, prefer
  **user flows** over expensive bespoke custom-policy maintenance, and minimize SMS-based MFA (cost per send).

## Scaling and limits
- Scales to large consumer populations; limits include **custom attributes per user**, **user flows/custom
  policies** per tenant, token/claim sizes, and **API connector** timeouts (slow REST calls break flows).
  Custom policies (IEF) carry significant operational complexity — use only when user flows can't express the
  journey.

## Operating procedure
1. **Provision** — create the **B2C/External ID tenant** (`azurerm_aadb2c_directory` / portal) and link
   billing; register the relying **app**.
2. **Configure** — define **user attributes**, build **user flows** (or **custom policies** for advanced
   journeys), add **identity providers** (local + social/federated), wire **API connectors**, and customize
   **branding** + **token** claims/lifetimes.
3. **Secure** — enforce **MFA** in flows, secure **API connector** endpoints and **IdP/app secrets**, use a
   **custom domain**, and emit minimal token claims.
4. **Verify** — apply [[verify-by-running]]: confirm the tenant/app exist, run the **user flow** test
   ("Run user flow") to complete a **sign-up and sign-in**, decode the returned **token** to confirm expected
   **claims** (and that an **API connector**/custom attribute populated), and confirm a federated **IdP**
   login succeeds. Capture state and result.

## Inputs
The consumer app(s) and their sign-in protocol, required identity providers (local/social/federated), user
attributes/claims to collect and emit, journey complexity (user flows vs custom policies), branding/custom
domain, MFA and abuse-protection requirements, token configuration, MAU scale, and region/subscription.

## Output
A Microsoft Entra External ID (B2C) setup: a CIAM tenant with registered app(s), user flows or custom
policies, federated identity providers, custom attributes/claims and API connectors, branding, and secured
tokens — plus verification that sign-up/sign-in completes and tokens carry the expected claims.

## Notes
- Gotchas: B2C/External ID is a **separate tenant** from your workforce Entra ID — don't conflate them;
  **custom policies (IEF)** are powerful but a steep maintenance burden — exhaust **user flows** first; **API
  connector** latency/failures break the user journey (set timeouts + fallback); SMS **MFA** has per-message
  cost; tenant choice (legacy Azure AD B2C vs newer External ID) affects available features. 2nd consumer: the
  Azure role team (azure-iam-engineer / azure-cloud-architect / azure-iac-engineer). Sibling
  azure-microsoft-entra-id is the **workforce** IdP. Cross-cloud peers: AWS Cognito, GCP Identity Platform.
- IaC/CLI: Terraform `azurerm_aadb2c_directory` (tenant) + **azuread** provider for app registrations; user
  flows/custom policies are largely managed via portal/Graph (limited Terraform coverage). CLI `az ad` /
  Microsoft Graph; custom policies as TrustFramework XML.
