---
name: azure-static-web-apps
description: Use when designing, provisioning, configuring, or operating Azure Static Web Apps — Azure's service for hosting a static frontend with an integrated serverless (managed-functions) API, globally distributed (Azure Static Web Apps). Covers the static frontend + managed/bring-your-own API, global content distribution, staging environments per pull request, built-in authentication (Entra/GitHub/custom OIDC) and route-based authorization, custom domains + free TLS, the staticwebapp.config.json routes/headers, and GitHub Actions / Azure Pipelines build-and-deploy. Loads the knowledge to provision the app, wire the API + auth + routing, add custom domains and PR staging, and verify a deployed build serves and authenticates. Consumed by the azure-static-web-apps specialist and by the Azure role team (azure-platform-engineer / azure-cloud-architect) when operating the managed service.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-static-web-apps, web-mobile, jamstack, hosting]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Static Web Apps

**Azure Static Web Apps** hosts a **static frontend** (React/Vue/Angular/Svelte/static HTML) together with an
integrated **serverless API**, distributed globally with free TLS. This skill owns the **single-service Static Web
Apps layer** — frontend hosting, the managed API, global distribution, staging environments, auth, routing, and
custom domains.

## Core concepts and components
- **Static frontend + managed API** — the built static assets are served from a global edge; an integrated
  **managed Azure Functions** API (or a **bring-your-own** Functions app / linked backend like App Service/
  Container Apps) handles `/api/*` routes.
- **Global distribution** — assets are replicated to **edge nodes** worldwide automatically; no CDN to wire up.
- **Staging environments** — every **pull request** (and named branches) gets an ephemeral **preview URL** with its
  own deploy, torn down on merge/close.
- **Built-in authentication** — first-class providers (**Entra ID / GitHub / custom OIDC**) with `/.auth/login`
  endpoints; **route-based authorization** via roles in `staticwebapp.config.json`.
- **Routing/config** — `staticwebapp.config.json` defines **routes, allowedRoles, response overrides, custom
  headers, fallback (SPA) routes, and MIME types**.
- **Custom domains + TLS** — bind apex/subdomains with **free managed certificates**.

## Configuration and sizing
- Provision the app, set **app/api/output locations** for the build, add the **staticwebapp.config.json**, link the
  **API** (managed or BYO), configure **auth providers + roles**, add **custom domains**, and connect the
  **CI/CD** workflow. Sizing is by **plan tier** (Free vs Standard) — Standard unlocks BYO Functions, more custom
  domains, SLA, and private endpoints.

## Security and IAM
- Authenticate via **Entra ID** for management RBAC; runtime auth uses the built-in providers with **role-based
  route protection**. Use **deployment tokens** or, better, **OIDC workload-identity** in CI rather than long-lived
  secrets. On Standard, add **private endpoints** + IP restrictions; store API secrets in app settings / Key Vault
  references, never in the repo.

## Cost levers
- **Free** tier for hobby/dev (limited domains, no SLA); **Standard** billed per app + bandwidth + managed-functions
  execution. Levers: use Free for non-prod, consolidate apps, cap **staging environments** retention, and keep the
  managed API lightweight (it scales to zero) rather than running a separate always-on backend.

## Scaling and limits
- Per-app size/route caps, custom-domain limits (more on Standard), staging-environment count, and managed-API
  execution limits (it inherits Functions Consumption scaling). Heavy/stateful backends should use a **BYO** linked
  backend instead of the managed API.

## Operating procedure
1. **Provision** — create the app via **azurerm** (`azurerm_static_web_app`) or `az staticwebapp create`; choose
   Free vs Standard.
2. **Configure** — set the **build config** (app/api/output locations) in the CI workflow, add
   **staticwebapp.config.json** (routes/roles/fallback/headers), link the **API**, configure **auth providers +
   roles**, and bind **custom domains** (`azurerm_static_web_app_custom_domain`).
3. **Secure** — wire **Entra/RBAC** for management, **route-based authorization** at runtime, **OIDC** in CI (avoid
   long-lived deployment tokens), Standard private endpoints/IP rules, secrets in app settings/Key Vault.
4. **Verify** — apply [[verify-by-running]]: trigger the **build/deploy** (CI or `swa deploy`), curl the served
   **frontend** and an **`/api/*`** endpoint for 200s, confirm a **protected route** challenges auth, confirm a
   **PR staging URL** deployed, and capture the results.

## Inputs
The **frontend framework + build output**, the **API** (managed vs BYO), the **staticwebapp.config.json** routes/
roles, the **auth providers**, the **custom domains**, the **plan tier**, and the **CI/CD** wiring.

## Output
A Static Web Apps setup: a provisioned app on the right tier, a working frontend + linked API, route-based auth,
custom domains with managed TLS, PR staging environments, and OIDC-based CI deploy — plus verification that a
deployed build serves the frontend, the API responds, protected routes challenge, and a staging URL exists.

## Notes
- Gotchas: wrong **app/api/output locations** break the build silently; SPA needs a **fallback route** in
  staticwebapp.config.json or deep links 404; **managed API** is Consumption-tier (cold starts, limits) — use a BYO
  backend for heavy/stateful work; long-lived **deployment tokens** leak (prefer OIDC); Free-tier lacks SLA/private
  endpoints. This is static + managed-API hosting — for full server-side apps defer to **azure-app-service**.
  2nd consumer: the Azure role team (azure-platform-engineer / azure-cloud-architect). Cross-cloud peers: AWS
  Amplify, GCP Firebase Hosting.
- IaC/CLI: Terraform **azurerm** (`azurerm_static_web_app`, `azurerm_static_web_app_custom_domain`); CLI
  `az staticwebapp ...`, SWA CLI `swa deploy`; Bicep `Microsoft.Web/staticSites`. Build/deploy via the
  `Azure/static-web-apps-deploy` GitHub Action or the Azure Pipelines task.
