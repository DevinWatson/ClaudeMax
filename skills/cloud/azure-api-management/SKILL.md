---
name: azure-api-management
description: Use when designing, provisioning, securing, or operating Azure API Management (APIM) — the managed full API gateway for publishing, securing, transforming, and governing APIs (Azure API Management). Covers the APIM instance and gateway, APIs and operations, products (bundles + subscription approval), the policy engine (inbound/backend/outbound/on-error: auth/JWT validation, rate-limit/quota, caching, CORS, transformation, mocking), subscriptions and keys, the developer portal, versions and revisions, backends and named values, and the tiers (Consumption/Developer/Basic/Standard/Premium with VNet, multi-region, self-hosted gateway). Loads the knowledge: provision the instance, import APIs, bundle products, author policies, secure with Entra/managed identity + subscriptions, and verify a gateway call. Consumed by the azure-api-management specialist and by the Azure role team (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer) when standing up the managed service (Azure API Management).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-api-management, integration, api-gateway, apim]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure API Management

The managed **full API gateway** for publishing, securing, transforming, and governing APIs. This skill owns
the **Azure managed-service layer** — the instance/gateway, APIs/products/policies/subscriptions, the
developer portal, versions/revisions, and security — and verifying a gateway call; it defers **API contract/
domain design** to the API design teams.

## Core concepts and components
- **APIM instance** — the gateway resource (`azurerm_api_management`) with a tier; fronts backends and applies
  policies. Components: **gateway**, **developer portal**, and management plane.
- **APIs & operations** — imported (OpenAPI/WSDL/WADL or manual) **APIs** with **operations** (routes), each
  pointing at a **backend** (URL/Function/Logic App/Service Fabric).
- **Products** — bundles of APIs with a visibility + **subscription** model (open vs approval-required); the
  unit of packaging/governance for consumers.
- **Policy engine** — XML policies in **inbound / backend / outbound / on-error** scopes (global/product/API/
  operation): **JWT validation**, **rate-limit/quota**, **caching**, **CORS**, **transformation** (rewrite
  headers/body), **mock**, IP filter, **set-backend-service**.
- **Subscriptions & keys** — consumers get a **subscription** (and **subscription key**) scoped to a product/
  API; the gateway enforces it.
- **Versions & revisions** — **versions** (breaking, consumer-visible: path/header/query) vs **revisions**
  (non-breaking, staged then made current).
- **Backends & named values** — reusable **backend** entities and **named values** (config/secrets, Key
  Vault-backed) referenced from policies.

## Configuration and sizing
- Provision the **instance** (tier), **import APIs**, group them into **products** with a subscription model,
  author **policies** (auth/rate-limit/cache/transform) at the right scope, set up **versions/revisions**, and
  configure **backends** + **named values**. Scale via **units** (and **Premium** for VNet/multi-region/
  self-hosted gateway).

## Security and IAM
- **Entra ID** auth + **Azure RBAC** (control plane); gateway-level: **validate-jwt** against Entra/OAuth,
  **subscription keys**, client certs, IP allow-lists; use the instance's **managed identity** to fetch Key
  Vault secrets / call backends; **Premium** for **VNet integration** + private endpoints. Store secrets in
  **named values** backed by Key Vault — never inline.

## Cost levers
- **Consumption** = per-call (serverless, scale-to-zero); **Developer/Basic/Standard/Premium** = fixed
  **units**. Levers: **Consumption** for spiky/low-volume or microservice gateways, dedicated tiers for
  sustained throughput; enable **response caching** to cut backend calls; right-size **units**; reserve
  **Premium** for VNet/multi-region/self-hosted needs only.

## Scaling and limits
- Dedicated tiers scale by **units** (+ Premium multi-region/autoscale); Consumption auto-scales. Limits:
  **Developer** tier has **no SLA**; dedicated-tier provisioning/scaling takes time; per-unit throughput caps;
  policy complexity adds latency; cache size bounded by tier; Consumption lacks the developer portal/VNet.

## Operating procedure
1. **Provision** — create the **instance** via Terraform `azurerm_api_management`, Bicep
   `Microsoft.ApiManagement/service`, or `az apim create`.
2. **Configure** — **import APIs** (`azurerm_api_management_api`), define **operations** + **backends**, group
   into **products** with subscriptions, author **policies** (auth/rate-limit/cache/transform), and set up
   **versions/revisions** + **named values**.
3. **Secure** — enforce **validate-jwt**/subscription keys, use **managed identity** + Key Vault named values,
   add **VNet/private endpoints** (Premium), and scope **RBAC**.
4. **Verify** — apply [[verify-by-running]]: confirm the instance/API provisioned (`az apim api show`), then
   **call the gateway URL** with a subscription key and confirm a 200 with policies applied (auth enforced,
   rate-limit/transform behaving). Capture the request/response.

## Inputs
The APIs + backends to publish, product/subscription packaging, auth model (JWT/Entra/keys/certs), policy
needs (rate-limit/quota/cache/transform/CORS), versioning strategy, throughput + networking requirements
(drives tier + units + VNet), secret/config (named values/Key Vault), and region(s).

## Output
An Azure API Management setup: an instance on the right tier with imported APIs + operations + backends,
products + subscriptions, policies (auth/rate-limit/cache/transform) at the right scope, versions/revisions,
managed-identity + Key Vault named values + VNet (Premium) + scoped RBAC — plus verification that a gateway
call succeeds with policies applied.

## Notes
- Gotchas: **versions** (breaking) vs **revisions** (non-breaking) are distinct — pick correctly; **Developer
  tier has no SLA**; dedicated scaling/provisioning is **slow**; complex policies add latency; inline secrets
  leak — use Key Vault **named values**; Consumption lacks dev portal/VNet. **API contract/domain design is
  the API design team's job** — defer to web/api-designer. 2nd consumer: the Azure role team
  (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer). Cross-cloud peers: AWS API Gateway,
  GCP Apigee/API Gateway.
- IaC/CLI: Terraform `azurerm_api_management` (+ `azurerm_api_management_api` /
  `azurerm_api_management_product` / `azurerm_api_management_api_policy` /
  `azurerm_api_management_subscription` / `azurerm_api_management_named_value`); Bicep/ARM
  `Microsoft.ApiManagement/service`. CLI `az apim create` / `az apim api import`.
