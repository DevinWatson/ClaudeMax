---
name: aws-cognito
description: Use when designing, provisioning, securing, or operating Amazon Cognito — user pools (sign-up/sign-in, password policy, MFA, account recovery, attributes, groups), app clients and the hosted UI, OAuth 2.0 / OIDC flows and scopes, federation with social and SAML/OIDC identity providers, Lambda triggers (pre-sign-up, pre/post-authentication, custom message, token generation), JWT (ID/access/refresh) tokens and verification, identity pools (federated identities exchanging tokens for temporary AWS IAM credentials), and the managed login experience — for end-user/customer application authentication and authorization (Amazon Cognito). Loads the Cognito knowledge: stand up user/identity pools, wire federation and triggers, and verify auth flows issue valid tokens. Consumed by the Cognito specialist and by the AWS role team (aws-iac-engineer / aws-security-reviewer) when they add app auth.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, cognito, authentication, user-pools, oauth, security-identity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Cognito

AWS's managed **end-user / customer identity** service: sign-up, sign-in, and access control
for your web and mobile apps, plus exchanging identities for temporary AWS credentials. It is
for *application users* (B2C/B2B customers) — not AWS principals (that is IAM).

## Core concepts and components
- **User pools** — the user directory + auth engine: sign-up/sign-in, **password policy**, **MFA**
  (SMS/TOTP), account recovery, **standard + custom attributes**, **groups** (map to IAM roles),
  and **app clients**. Issues **JWTs**: ID token, access token, refresh token.
- **App clients** — per-application config: allowed auth flows, OAuth scopes, callback/logout
  URLs, token validity, and client secret (for confidential clients).
- **Hosted UI / managed login** — Cognito-hosted sign-in/sign-up pages and OAuth endpoints, with
  customizable branding; supports the **authorization code**, implicit, and client-credentials
  OAuth flows.
- **Federation** — bring in users from **social IdPs** (Google/Facebook/Apple/Amazon) and
  **SAML/OIDC** enterprise IdPs; Cognito normalizes them into the user pool.
- **Lambda triggers** — customize the flow: pre-sign-up, pre/post-authentication, custom message,
  define/create/verify-auth-challenge, **pre-token-generation** (add/override claims), migrate-user.
- **Identity pools (federated identities)** — exchange a user-pool (or external IdP) token for
  **temporary AWS IAM credentials** (authenticated/unauthenticated roles) to call AWS APIs.

## Configuration and sizing
- Decide user pool only (auth/JWT) vs user pool **+ identity pool** (need AWS credentials).
  Choose OAuth flows (prefer **authorization code + PKCE**, avoid implicit). Set token validity
  short for access/ID and longer for refresh. Use groups + identity-pool role mapping for
  authz. Keep custom attributes minimal (immutable after creation).

## Security and IAM
- Enforce MFA (or risk-based **advanced security** / threat protection), strong password policy,
  and prevent user-existence errors. App clients with secrets must keep them server-side.
  Identity pool roles are real IAM roles — scope the authenticated/unauthenticated roles least-
  privilege and use **role mapping** by group/claim. Always **verify JWT signature, `iss`,
  `aud`/`client_id`, and expiry** on the resource server; never trust unverified tokens.

## Cost levers
- Billed by **monthly active users (MAU)** with a free tier; advanced security / threat
  protection and SAML/OIDC federation MAUs are priced higher. Identity pool itself is free
  (you pay for the AWS resources the issued credentials use). Lever: avoid unnecessary advanced-
  security tier on low-risk pools; consolidate pools.

## Scaling and limits
- User pools scale to large directories; API rate limits apply per category (sign-in, user CRUD,
  hosted UI). Quotas on app clients, identity providers, groups, and Lambda trigger payload
  size; most are soft/raisable. Token sizes grow with claims/groups — watch header limits.

## Operating procedure
1. **Provision** — create the user pool (password policy, MFA, attributes, recovery) and app
   client(s) via Terraform `aws_cognito_user_pool`/`aws_cognito_user_pool_client` or
   `aws cognito-idp create-user-pool`; add a domain for the hosted UI.
2. **Configure** — set OAuth flows/scopes and callback URLs, wire social/SAML/OIDC IdPs, attach
   Lambda triggers, create groups, and (if AWS creds are needed) an identity pool with role
   mapping.
3. **Secure** — enable MFA/threat protection, scope identity-pool IAM roles least-privilege,
   keep client secrets server-side, and enforce JWT verification on resource servers.
4. **Verify** — apply [[verify-by-running]]: run the auth flow (`aws cognito-idp
   admin-initiate-auth` or the hosted UI / token endpoint) and confirm it returns ID/access/
   refresh tokens, decode and verify the JWT claims (`iss`/`aud`/`exp`/groups), and for identity
   pools confirm `get-credentials-for-identity` returns scoped temporary AWS creds — capture the
   actual output.

## Inputs
The app(s) needing auth, required sign-in/federation methods, MFA/recovery policy, user
attributes and groups, OAuth flows/scopes and callback URLs, trigger customizations, whether AWS
credentials are needed (identity pool), and compliance/security tier.

## Output
The Cognito configuration (user pool with policy/MFA/attributes, app clients, hosted UI domain,
IdP federation, Lambda triggers, optional identity pool with role mapping) as code, plus
verification that the auth flow issues verifiable JWTs and identity-pool credentials are scoped.

## Notes
- Gotchas: many user-pool attributes (and the username attribute) are **immutable after pool
  creation** — recreate the pool to change them; the **implicit** OAuth flow is discouraged
  (use code + PKCE); **always verify the JWT signature against the pool JWKS** and check `aud`/
  `client_id`, not just expiry; identity pool (Cognito Federated Identities) is a *separate*
  resource from the user pool and issues real IAM credentials — a too-broad unauthenticated role
  is a common leak; refresh-token revocation and device tracking are opt-in; SMS MFA needs SNS +
  an origination number / spending limit.
- IaC/CLI: Terraform `aws_cognito_user_pool`, `aws_cognito_user_pool_client`,
  `aws_cognito_user_pool_domain`, `aws_cognito_identity_provider`, `aws_cognito_user_group`,
  `aws_cognito_identity_pool`, `aws_cognito_identity_pool_roles_attachment`. CLI `aws cognito-idp
  create-user-pool`, `create-user-pool-client`, `admin-initiate-auth`, `cognito-identity
  get-id`/`get-credentials-for-identity`. CloudFormation `AWS::Cognito::UserPool`,
  `AWS::Cognito::UserPoolClient`, `AWS::Cognito::IdentityPool`.
