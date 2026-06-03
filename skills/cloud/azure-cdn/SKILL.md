---
name: azure-cdn
description: Use when designing, provisioning, securing, or operating Azure CDN — content delivery that caches and accelerates static and dynamic content from origins through globally distributed edge POPs (Azure CDN). Covers CDN profiles and endpoints, provider SKUs (Azure CDN from Microsoft / Standard from Edgio (formerly Verizon/Akamai)), origins and origin groups, caching rules and cache-control/expiration behavior, query-string caching modes, compression, custom domains with managed TLS, the Standard/Premium Rules engine for request/response manipulation and redirects, geo-filtering, and purge/preload. Loads the knowledge: create the profile + endpoint, point at origins, set caching/rules, add custom domain + TLS, and verify cache HIT/MISS and TTLs. Consumed by the azure-cdn specialist and by the Azure role team (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure CDN).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-cdn, networking, caching, content-delivery]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure CDN

Cache and accelerate content from an **origin** (Blob/Storage, App Service, a public host, or a custom origin)
at globally distributed **edge POPs** to cut latency and offload the origin. This skill owns the **profile +
endpoint + caching/rules** layer and proving cache behavior. (For WAF + advanced L7 routing, that is Front
Door's job.)

## Core concepts and components
- **Profile + endpoint** — a **CDN profile** (`azurerm_cdn_profile`) groups **endpoints**
  (`azurerm_cdn_endpoint`); each endpoint has a hostname (`*.azureedge.net`), an **origin**, and caching
  config. Newer workloads use **Front Door / CDN Standard (azurerm_cdn_frontdoor_*)** — pick one.
- **Provider SKUs** — **Standard/Premium Microsoft**, and the classic **Standard/Premium from Edgio**
  (formerly Verizon/Akamai). SKU determines the **Rules engine** capabilities and feature set.
- **Origins / origin groups** — the backend the edge fetches from on a cache **MISS**; origin groups add
  health probes and failover (provider-dependent).
- **Caching** — cache **behavior** (honor origin Cache-Control vs override), **TTL/expiration**, **query-string
  caching mode** (ignore / cache every unique / bypass), and **compression** of eligible MIME types.
- **Rules engine** — Standard/Premium rules to rewrite URLs, set headers, force HTTPS, redirect, and apply
  caching overrides per path; plus **geo-filtering** and **custom domains** with **managed TLS**.

## Configuration and sizing
- Create a **profile** + **endpoint**, set the **origin** (and origin host header), choose a **caching
  behavior** + **TTL** appropriate to content volatility, set the **query-string mode**, enable
  **compression**, add a **custom domain** with **managed certificate**, and codify behavior in the **Rules
  engine** (HTTPS redirect, cache overrides). Use **purge** on deploys for versioned/changed assets.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC** (CDN Profile/Endpoint Contributor). Enforce **HTTPS** (managed
  TLS on custom domains, HTTP→HTTPS redirect rule), **token auth/geo-filtering** where supported, and restrict
  the origin to CDN where possible. **Azure CDN has no WAF** — use **Front Door** (azure-front-door) when you
  need WAF, bot protection, or path-based routing.

## Cost levers
- Billing is mainly **outbound data (egress) by zone** + requests. Levers: **maximize cache hit ratio**
  (sensible TTLs, normalized query-string mode, cache static assets aggressively) to offload egress from the
  origin, enable **compression**, and avoid caching truly dynamic/per-user responses. Pick the **SKU** that
  matches needed Rules-engine features (don't overpay for Premium if unused).

## Scaling and limits
- Edge POPs scale globally and automatically. Limits: **endpoint name** must be globally unique; **caching
  changes/purges take time to propagate**; **query-string mode** misconfig causes cache fragmentation or
  stale/wrong content; some Rules-engine features are **SKU/provider-specific**; classic Edgio profiles differ
  from Microsoft Standard — **don't mix mental models**. No WAF (use Front Door).

## Operating procedure
1. **Provision** — create the **profile** + **endpoint** via Terraform `azurerm_cdn_profile` +
   `azurerm_cdn_endpoint` (or `azurerm_cdn_frontdoor_profile`/`_endpoint`), Bicep `Microsoft.Cdn/profiles`
   (+ `/endpoints`), or `az cdn profile create` + `az cdn endpoint create`.
2. **Configure** — set the **origin** + host header, **caching behavior/TTL**, **query-string mode**,
   **compression**, add a **custom domain** + **managed TLS**, and author **Rules engine** rules (HTTPS
   redirect, cache overrides, geo-filter).
3. **Secure** — enforce **HTTPS**, scope **RBAC**, restrict the origin, and (if WAF/bot/path routing needed)
   defer to **Front Door**.
4. **Verify** — apply [[verify-by-running]]: confirm profile/endpoint provisioned (`az cdn endpoint show`),
   then `curl -I` the endpoint and inspect **`X-Cache` HIT/MISS** and **`Cache-Control`/age** headers across a
   warm/cold path, confirming caching, compression, and HTTPS redirect behave as configured. Capture result.

## Inputs
The origin(s) and host header, content cacheability/volatility (TTL strategy), query-string behavior, SKU/
provider, custom domain + TLS, required Rules-engine rules (redirects/headers/geo), and purge strategy.

## Output
An Azure CDN setup: a profile + endpoint pointed at the origin, caching behavior/TTL + query-string mode +
compression, custom domain with managed TLS, Rules-engine rules, scoped RBAC — plus verification of cache
HIT/MISS, TTL, compression, and HTTPS behavior.

## Notes
- Gotchas: **query-string mode** misconfig fragments the cache or serves wrong content; **purges/config
  propagate slowly**; **no WAF** (use Front Door for WAF/bot/path routing); **classic Edgio vs Microsoft
  Standard** profiles behave differently; cache truly dynamic content carefully; set the **origin host header**
  correctly or the origin 404s. For WAF + advanced routing prefer **Front Door** (azure-front-door).
  Cross-cutting edge strategy is the role team's call via network-design. 2nd consumer: the Azure role team
  (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer). Cross-cloud peers: AWS CloudFront,
  GCP Cloud CDN.
- IaC/CLI: Terraform `azurerm_cdn_profile` + `azurerm_cdn_endpoint` (or `azurerm_cdn_frontdoor_profile` /
  `_endpoint` / `_origin_group`); Bicep/ARM `Microsoft.Cdn/profiles` / `endpoints`. CLI `az cdn profile
  create` / `az cdn endpoint create` / `az cdn endpoint purge`.
