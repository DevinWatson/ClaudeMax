---
name: azure-traffic-manager
description: Use when designing, provisioning, securing, or operating Azure Traffic Manager — Azure's DNS-based global traffic load balancer that directs clients to the best endpoint across regions via DNS responses (Azure Traffic Manager). Covers profiles and routing methods (Priority/Weighted/Performance/Geographic/Multivalue/Subnet), endpoints (Azure/External/Nested profiles), endpoint health monitoring (HTTP/HTTPS/TCP probes) and automatic failover, DNS TTL and the relative DNS name, and the fact that it operates only at the DNS layer (it does not proxy — clients connect directly to the resolved endpoint). Loads the knowledge: create the profile, pick the routing method, add and monitor endpoints, tune TTL, provision, and verify DNS resolves to the right endpoint and fails over on outage. Consumed by the azure-traffic-manager specialist and by the Azure role team (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure Traffic Manager).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-traffic-manager, networking, dns, global-routing]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Traffic Manager

Azure's **DNS-based global traffic load balancer** — it directs clients to the **best endpoint across
regions** by returning the chosen endpoint in a **DNS response**. It operates **only at the DNS layer**:
it does **not** proxy or see traffic; the client connects **directly** to the resolved endpoint. This skill
owns the **Traffic Manager managed-service layer** — profiles, routing methods, endpoints, and health
monitoring. (For an L7 proxying global edge with CDN/WAF use **Front Door**; for authoritative DNS hosting
use **Azure DNS**.)

## Core concepts and components
- **Profile** — the unit of config with a **relative DNS name** (`<name>.trafficmanager.net`), a **routing
  method**, **DNS TTL**, and a set of **endpoints**.
- **Routing methods** — **Priority** (ordered failover), **Weighted** (proportional distribution),
  **Performance** (lowest network latency to the client), **Geographic** (route by client geo for
  compliance/locale), **Multivalue** (return multiple healthy IPs), **Subnet** (map client IP ranges to
  endpoints).
- **Endpoints** — **Azure endpoints** (App Service, public IP, classic), **External endpoints** (any
  FQDN/IP, e.g. on-prem or another cloud), and **Nested profiles** (combine methods, e.g. Performance over
  Priority).
- **Health monitoring** — periodic **HTTP/HTTPS/TCP probes** (path, interval, timeout, tolerated failures,
  expected status); unhealthy endpoints are **removed from DNS responses** automatically.
- **DNS layer behavior** — responses are **cached for the TTL**, so failover is bounded by **TTL + probe
  interval** (not instant); the client connects directly to the endpoint after resolution.

## Configuration and sizing
- Create a **profile** with a unique relative DNS name, choose the **routing method** (Priority for
  active-passive failover, Performance for latency, Weighted for canary/distribution, Geographic for
  compliance), add **endpoints** (Azure/External/Nested), configure **health monitoring** (probe protocol/
  path/interval/tolerance), and set a **DNS TTL** balancing failover speed vs query volume.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC** (Traffic Manager Contributor). Traffic Manager **only resolves
  DNS** — it provides **no traffic inspection, TLS, or WAF**; secure the **endpoints themselves** (e.g. Front
  Door/App Gateway WAF, NSGs, TLS at the endpoint). Probe over **HTTPS** to a real health path, and ensure
  endpoints don't trust Traffic Manager as a security boundary (it isn't one).

## Cost levers
- Bills on **DNS queries (per million)** + **health checks (per monitored endpoint)** + endpoint count.
  Levers: set a **sensible TTL** (higher TTL = fewer billed queries but slower failover), monitor only the
  endpoints you need, and consolidate with **nested profiles** rather than many flat profiles where possible.

## Scaling and limits
- Scales to very high query volumes globally with an SLA. Limits: it is **DNS-only** — failover is **not
  instant** (bounded by **TTL + probe interval**, and by client/resolver DNS caching that may ignore low
  TTLs); it **does not proxy** (no TLS/WAF/caching — use **Front Door** for that); **Performance** routing
  uses latency tables, not live RUM; endpoints must expose a reachable **probe path**; **Geographic** routing
  needs a fallback for unmapped regions.

## Operating procedure
1. **Provision** — create the **profile** (routing method, relative DNS name, TTL) via Terraform
   `azurerm_traffic_manager_profile`, Bicep `Microsoft.Network/trafficManagerProfiles`, or `az network
   traffic-manager profile create`.
2. **Configure** — add **endpoints** (`azurerm_traffic_manager_azure_endpoint` /
   `_external_endpoint` / `_nested_endpoint`), set **priority/weight/geo-mapping** per the method, and
   configure **health monitoring** (probe protocol/path/interval/tolerance).
3. **Secure** — scope **RBAC**, probe over **HTTPS** to a real health path, and secure the **endpoints**
   themselves (Traffic Manager provides no inspection/TLS/WAF).
4. **Verify** — apply [[verify-by-running]]: confirm the profile/endpoints provisioned and **endpoint
   monitor status is Online** (`az network traffic-manager profile show`), then **resolve the
   trafficmanager.net name** (`dig`/`nslookup`/`Resolve-DnsName`) and confirm it returns the expected endpoint
   per the routing method; simulate an outage (or disable an endpoint) and confirm DNS **fails over** to a
   healthy one. Capture state and result.

## Inputs
The global routing goal (failover/distribution/latency/compliance → routing method), the endpoints (Azure/
External/Nested) and their priorities/weights/geo-mappings, a health-probe path/protocol, the DNS TTL, the
relative DNS name, and RBAC scope.

## Output
An Azure Traffic Manager setup: a profile with the right routing method and a sensible TTL, monitored
endpoints (Azure/External/Nested) with health probes, and (where used) nested profiles — plus verification
that the trafficmanager.net name resolves to the expected endpoint and fails over to a healthy one on outage.

## Notes
- Gotchas: it is **DNS-only and does not proxy** — **no TLS/WAF/caching** (use **Front Door** for an L7 edge);
  **failover is not instant** — bounded by **TTL + probe interval** and by **client/resolver DNS caching**
  (which may ignore low TTLs); **Performance** routing uses latency tables (not live measurements);
  **Geographic** needs a fallback for unmapped regions; secure the **endpoints**, not Traffic Manager. For
  authoritative DNS hosting use **Azure DNS**. Broad global-routing strategy is the role team's call via
  network-design. 2nd consumer: the Azure role team (azure-networking-engineer / azure-cloud-architect /
  azure-iac-engineer). Cross-cloud peer: AWS Route 53 (routing policies).
- IaC/CLI: Terraform `azurerm_traffic_manager_profile` (+ `_azure_endpoint` / `_external_endpoint` /
  `_nested_endpoint`); Bicep/ARM `Microsoft.Network/trafficManagerProfiles`. CLI `az network traffic-manager
  profile create` / `az network traffic-manager endpoint create`.
