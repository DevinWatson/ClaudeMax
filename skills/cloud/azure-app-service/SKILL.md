---
name: azure-app-service
description: Use when designing, provisioning, securing, or operating Azure App Service — Microsoft Azure's PaaS for hosting web apps, APIs, and backends (Azure App Service). Covers App Service plans and tiers (Free/Shared/Basic/Standard/Premium v3/Isolated v2 ASE), Web Apps for Windows/Linux and code vs custom-container deployment, deployment slots and slot swaps with warm-up, autoscale and manual scale (out and up), custom domains and managed TLS certificates, app settings/connection strings and Key Vault references, deployment (zip/Run-From-Package, CI/CD, containers), VNet integration and Private Endpoints and Access Restrictions, Entra ID / Easy Auth and managed identities, and cost. Loads the App Service knowledge: pick a plan and runtime, configure slots and scaling, secure, and verify the app serves. Consumed by the azure-app-service specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure App Service).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-app-service, compute, paas, web-apps, deployment-slots]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure App Service

Microsoft Azure's **PaaS for web apps, APIs, and backends** — fully managed hosting for code or containers
with built-in scaling, deployment slots, TLS, and identity, behind Azure networking and SLAs.

## Core concepts and components
- **App Service plan** — the compute that hosts one or more apps, defined by an **OS** (Windows/Linux) and
  a **pricing tier**: Free/Shared (dev), **Basic**, **Standard**, **Premium v3** (production, autoscale,
  zone redundancy), or **Isolated v2 (ASE)** for VNet-isolated single-tenant compute.
- **Web App** — the deployed unit: a code app (built-in runtime: .NET, Node, Python, Java, PHP) or a
  **custom container** image.
- **Deployment slots** — additional live instances (e.g. `staging`) sharing the plan; **slot swap** with
  **warm-up** promotes staging to production with near-zero downtime and instant rollback.
- **Scaling** — **scale out** (instance count, manual or **autoscale** rules) and **scale up** (change
  tier); Premium v3 supports autoscale and **zone redundancy**.
- **Custom domains & TLS** — bind custom hostnames with **App Service Managed Certificates** (free) or
  Key Vault certs; enforce HTTPS and a minimum TLS version.
- **Configuration** — **app settings / connection strings** (with **Key Vault references** for secrets)
  surface as environment variables; sticky (slot) settings stay with a slot across swaps.

## Configuration and sizing
- Pick the **OS + tier** by need (Premium v3 for production scale/zone redundancy, Isolated for full VNet
  isolation). Choose **code vs container** deployment and the runtime. Add a **staging slot** for safe
  swaps with warm-up. Configure **app settings/connection strings** + Key Vault references. Set **always-on**
  for non-Consumption tiers, health-check path, and the deployment method (Run-From-Package/CI-CD).

## Security and IAM
- Use **Easy Auth (App Service Authentication)** with **Entra ID** for sign-in and **managed identities**
  for downstream access; least-privilege **RBAC**. Store secrets via **Key Vault references**, not plain
  app settings. Isolate with **VNet integration + Private Endpoints** and **Access Restrictions** (IP/
  service-tag rules); disable FTP/basic-auth deploy. Enforce **HTTPS-only** and a min TLS version. Use
  **Isolated v2 (ASE)** when full network isolation is required.

## Cost levers
- Billed per **plan instance-hour** (independent of traffic) + bandwidth; slots/multiple apps **share the
  plan's cost**. Levers: pack multiple apps on one plan; right-size the tier; **autoscale in** off-peak and
  scale to a low minimum; use **Reserved Instances / Savings Plans** on Premium v3; avoid over-provisioned
  Isolated/ASE unless isolation is required; turn off always-on for non-prod.

## Scaling and limits
- **Scale out** to the tier's max instance count (autoscale on Standard+); **scale up** changes the tier.
  All apps + slots on a plan **share its instances/memory** — a noisy app starves neighbors. Premium v3
  gives **zone redundancy**; Isolated gives a private, higher-limit ASE. Per-plan/app quotas (connections,
  outbound SNAT ports) apply under high concurrency.

## Operating procedure
1. **Provision** — create the **App Service plan** and **Web App** via Terraform `azurerm_service_plan` +
   `azurerm_linux_web_app` / `azurerm_windows_web_app` (or Bicep/`az appservice plan create` +
   `az webapp create`).
2. **Configure** — set the **runtime / container image**, **app settings / connection strings** (Key Vault
   references), add a **staging slot**, set always-on/health-check, configure autoscale, and deploy code
   (Run-From-Package / zip / CI-CD).
3. **Secure** — enable **Easy Auth + Entra ID**, assign a **managed identity**, store secrets in Key Vault,
   add **VNet integration / Private Endpoints / Access Restrictions**, and enforce HTTPS + min TLS.
4. **Verify** — apply [[verify-by-running]]: confirm the app is `Running` (`az webapp show`), then **hit
   it** — curl the app/health-check URL (and the staging slot) and confirm a 200/expected response; perform
   a **slot swap** and confirm production serves the new build with rollback available. Capture the HTTP
   response and the swap result.

## Inputs
The app type (web/API), runtime or container image, expected scale and whether zone redundancy/isolation
is needed (tier), custom domains/TLS, whether you need staging slots, app settings/secrets, networking, the
region, and the identity security requirements.

## Output
An Azure App Service setup: a plan at the chosen tier hosting the web app (code or container) with a
staging slot, autoscale, custom domain/TLS, app settings via Key Vault references — secured by Easy Auth/
Entra ID, managed identity, and VNet/Private Endpoints — plus verification that the app serves and slot
swap works.

## Notes
- Gotchas: all apps/slots on a plan **share compute** — a busy app starves neighbors; **slot swap** uses
  warm-up and respects sticky (slot) settings — mark environment-specific settings sticky or they swap;
  **SNAT port exhaustion** under high outbound concurrency; Linux containers vs built-in runtimes differ in
  startup/health behavior; **always-on** is needed to prevent idle unload on non-Consumption tiers;
  Isolated/ASE is expensive — use only when isolation is required. This owns **PaaS web/API hosting** — for
  serverless event functions defer to **azure-functions**, for general containers to azure-container-apps,
  for raw VMs to **azure-virtual-machines**. 2nd consumer: the Azure role team (azure-iac-engineer /
  azure-cloud-architect). Cross-cloud peers: AWS Elastic Beanstalk, GCP App Engine.
- IaC/CLI: Terraform `azurerm_service_plan` + `azurerm_linux_web_app` / `azurerm_windows_web_app`
  (+ `azurerm_linux_web_app_slot`); Bicep/ARM `Microsoft.Web/serverfarms` + `Microsoft.Web/sites`. CLI
  `az appservice plan create` / `az webapp create` / `az webapp deployment slot swap` / `az webapp show`;
  verify by curling the app URL and swapping slots.
