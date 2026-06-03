---
name: azure-front-door
description: Use when designing, provisioning, securing, or operating Azure Front Door — Azure's global L7 entry point combining a CDN, dynamic site acceleration, web application firewall, and intelligent routing at the Microsoft edge (Azure Front Door). Covers the Standard/Premium tiers, endpoints and custom domains with managed TLS, origin groups/origins with health probes and latency/priority/weighted failover, routes (domain+path → origin group), CDN caching (compression, query-string, purge), the Rules engine, WAF policies (managed + custom rules, bot, rate limiting), Private Link origins (Premium), and end-to-end TLS. Loads the knowledge: create the profile/endpoint, define origins and routes, enable caching and WAF, attach custom domains with TLS, provision, and verify global routing/caching/WAF behavior. Consumed by the azure-front-door specialist and by the Azure role team (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure Front Door).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-front-door, networking, cdn, edge]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Front Door

Azure's **global, scalable Layer-7 entry point** at the **Microsoft edge** — combining **CDN caching**,
**dynamic site acceleration**, a **web application firewall**, and **intelligent global routing/failover**.
This skill owns the **Front Door managed-service layer** — profile, endpoints, origins, routes, caching, the
Rules engine, and WAF. (Regional L7 routing/WAF is **Application Gateway**; DNS-only global routing is
**Traffic Manager** — Front Door is the **edge CDN + WAF + L7** option.)

## Core concepts and components
- **Tiers** — **Standard** (CDN + static/dynamic delivery + basic WAF) and **Premium** (adds managed WAF rule
  sets, bot protection, and **Private Link** origins). Use the modern **azurerm_cdn_frontdoor_*** profile.
- **Endpoint + custom domains** — a default `*.azurefd.net` endpoint plus **custom domains** with
  **Azure-managed TLS** certificates (or Key Vault certs) and managed validation.
- **Origin groups & origins** — backends (**App Service, Storage, Load Balancer, or any public host**) with
  **health probes** and **load balancing** by **latency / priority / weighted**, enabling **failover** across
  regions.
- **Routes** — map **domain + path patterns** to an **origin group**, choosing accepted protocols, HTTPS
  redirect, caching, and an associated WAF/Rules set.
- **Caching (CDN)** — cache behavior, **compression**, **query-string** handling, cache duration, and
  **purge**; accelerates static + dynamic content at the edge.
- **Rules engine** — conditional **header/URL rewrite/redirect** and routing manipulation at the edge.
- **WAF policy** — **managed** (OWASP/bot) + **custom** rules, **rate limiting**, geo-filtering, in
  Detection/Prevention; associated to endpoints/routes.

## Configuration and sizing
- Create a **Standard/Premium profile** + **endpoint**, define **origin group(s)** with **health probes** and
  **latency/priority/weighted** load balancing for **failover**, add **routes** (domain+path → origin group,
  HTTPS redirect), enable **caching/compression**, attach **custom domains** with **managed TLS**, add a
  **WAF policy** (Prevention), and use the **Rules engine** for edge logic. Premium: **Private Link origins**.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC**. Enable the **WAF in Prevention** (managed + custom + rate
  limiting/bot), enforce **HTTPS** with **managed TLS**, and **lock origins to Front Door** (restrict by the
  `X-Azure-FDID` header / Front Door service tag, or **Private Link** origins on Premium) so attackers can't
  bypass the edge. Use a **managed identity** for Key Vault certs; send WAF/access logs to Log Analytics.

## Cost levers
- Bills on a **base fee + data transfer (egress) + requests** (+ WAF, + extra domains/rules on some tiers).
  Levers: maximize **cache hit ratio** (cuts origin egress), use **Standard** unless Premium WAF/Private Link
  is needed, consolidate routes/domains into one profile, and tune compression/query-string handling.

## Scaling and limits
- Front Door scales **globally** and is highly available with an SLA. Limits: it is **global, not a regional
  in-VNet L7 device** (use **Application Gateway** for regional/in-VNet WAF + path routing); **Private Link
  origins are Premium-only**; **custom-domain TLS validation** and propagation take time; **caching dynamic
  content** needs care (cache-control/query-string); without **origin lock-down** the edge can be bypassed;
  managed-rule **Prevention** can block legitimate traffic if untuned.

## Operating procedure
1. **Provision** — create the **profile** + **endpoint** via Terraform `azurerm_cdn_frontdoor_profile` +
   `azurerm_cdn_frontdoor_endpoint`, Bicep `Microsoft.Cdn/profiles` (Front Door), or `az afd profile create`
   + `az afd endpoint create`.
2. **Configure** — add **origin group(s)** + **origins** + **health probes** (`azurerm_cdn_frontdoor_origin_
   group` / `_origin`), **routes** (`_route`) with caching/compression, **custom domains** with **managed
   TLS** (`_custom_domain`), and **Rules engine** rule sets (`_rule_set` / `_rule`).
3. **Secure** — attach a **WAF policy** (Prevention, managed + custom + rate limit) via
   `azurerm_cdn_frontdoor_firewall_policy` + `_security_policy`, enforce **HTTPS**, and **lock origins** to
   Front Door (FDID header / service tag / Private Link).
4. **Verify** — apply [[verify-by-running]]: confirm the profile/endpoint/routes provisioned, then request the
   **custom domain** and confirm it serves from the right **origin group**, **caching** works (cache-hit
   header on a second request), **failover** picks a healthy origin, and the **WAF** blocks a malicious sample
   in Prevention. Capture state and result.

## Inputs
The domains/paths to publish and their origins (with regions for failover), caching needs, TLS/custom-domain
requirements, WAF posture (managed/custom/rate-limit, Detection vs Prevention), tier (Standard/Premium,
Private Link origins), edge logic (Rules engine), origin lock-down strategy, and logging destination.

## Output
An Azure Front Door setup: a Standard/Premium profile + endpoint, origin groups with health probes and
latency/priority/weighted failover, routes with caching/compression, custom domains with managed TLS, a
tuned WAF policy in Prevention, locked-down origins, and Rules-engine edge logic — plus verification that
global routing, caching, failover, and WAF all behave as intended.

## Notes
- Gotchas: it is **global, not a regional in-VNet L7 device** — for regional/in-VNet WAF + path routing use
  **Application Gateway**; for DNS-only global routing use **Traffic Manager**; **lock origins to Front Door**
  (FDID header / service tag / **Private Link** on Premium) or the edge is bypassable; **Private Link origins
  are Premium-only**; **custom-domain TLS** validation/propagation takes time; **caching dynamic content**
  needs careful cache-control/query-string config; managed-rule **Prevention** can block legit traffic if
  untuned (test in Detection). Broad topology is the role team's call via network-design. 2nd consumer: the
  Azure role team (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer). Cross-cloud peers:
  AWS CloudFront, GCP Cloud CDN / Cloud Load Balancing (global).
- IaC/CLI: Terraform `azurerm_cdn_frontdoor_profile` + `_endpoint` + `_origin_group` + `_origin` + `_route`
  (+ `_custom_domain` / `_firewall_policy` / `_security_policy` / `_rule_set`); Bicep/ARM `Microsoft.Cdn/
  profiles`. CLI `az afd profile/endpoint/origin-group/origin/route/custom-domain create`.
