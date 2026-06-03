---
name: azure-application-gateway
description: Use when designing, provisioning, securing, or operating an Azure Application Gateway — Azure's regional Layer-7 (HTTP/HTTPS) load balancer and web application firewall (Azure Application Gateway). Covers the v2 SKU (Standard_v2/WAF_v2) with autoscaling and zones, frontend IPs, listeners (multi-site), routing rules, backend pools and HTTP settings, health probes, TLS termination and end-to-end TLS, path-/host-based routing, redirects/rewrites, the WAF (OWASP CRS managed + custom rules, Detection/Prevention), and the dedicated subnet. Loads the knowledge: choose SKU, define frontends/listeners/rules/backend pools/probes, enable WAF and TLS, provision, and verify L7 routing reaches healthy backends. Consumed by the azure-application-gateway specialist and by the Azure role team (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure Application Gateway).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-application-gateway, networking, layer7, waf]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Application Gateway

Azure's **regional Layer-7 (HTTP/HTTPS) load balancer** with an integrated **web application firewall**. It
makes routing decisions on **URL path, host header, and other HTTP attributes**, terminates **TLS**, and
protects web apps with the **WAF**. This skill owns the **L7 application-gateway managed-service layer** —
SKU, listeners, rules, backend pools, probes, TLS, and WAF. (For L4 TCP/UDP use Load Balancer; for global
edge routing use Front Door.)

## Core concepts and components
- **SKU** — use **v2** (**Standard_v2** for L7 LB, **WAF_v2** for L7 LB + firewall). v2 adds **autoscaling**,
  **availability-zone** redundancy, and a static frontend VIP. Basic/v1 are legacy.
- **Frontend IP** — a **public** and/or **private** frontend the gateway listens on.
- **Listeners** — bind frontend IP + port + protocol; **basic** (single site) or **multi-site** (host-based,
  SNI). HTTPS listeners hold the **TLS certificate** (or reference Key Vault).
- **Routing rules** — map a listener to a backend via **basic** (1:1) or **path-based** (URL path map →
  different backend pools/settings) routing; also do **redirects** and **URL rewrites**.
- **Backend pools** — targets by IP/FQDN/NIC/VMSS/App Service; **backend HTTP settings** set port, protocol
  (HTTP/HTTPS for end-to-end TLS), **cookie-based affinity**, **connection draining**, and probe.
- **Health probes** — default or custom (path, interval, thresholds, match conditions) gate backend health.
- **WAF** — OWASP **Core Rule Set** managed rules + **custom rules**, in **Detection** or **Prevention** mode,
  managed via a **WAF Policy**. Tune exclusions/anomaly scoring to cut false positives.

## Configuration and sizing
- Pick **WAF_v2** (or Standard_v2), deploy into a **dedicated subnet**, enable **autoscaling** (min/max
  instances) and **zones**, define **frontend IP(s)**, **listeners** (multi-site for several hosts),
  **backend pools** + **backend HTTP settings**, **path-based rules**, custom **probes**, **TLS termination**
  (Key Vault cert), and a **WAF Policy** in Prevention.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC** (Network Contributor); use a **managed identity** to pull TLS
  certs from **Key Vault**. Enable the **WAF in Prevention** with OWASP CRS, terminate **TLS** (and use
  end-to-end TLS to backends where required), front only intended hosts, and restrict the gateway subnet with
  **NSGs** (allow the required GatewayManager/health ports). Send WAF/access logs to Log Analytics.

## Cost levers
- v2 bills on **fixed hourly + capacity units** (compute/connections/throughput). Levers: right-size
  **autoscale min/max**, consolidate sites onto **multi-site listeners**, avoid idle gateways, prefer
  **WAF_v2** only where the firewall is needed (Standard_v2 otherwise), and tune WAF to avoid wasted retries.

## Scaling and limits
- v2 **autoscales** and is zone-redundant with an SLA. Limits: it is **regional** (use **Front Door** for
  global/edge); requires a **dedicated subnet**; per-gateway limits on listeners/rules/backend pools;
  mixing v1 and v2 is not supported; **WAF Prevention** can block legitimate traffic if rules aren't tuned
  (test in Detection first); end-to-end TLS needs trusted backend certs.

## Operating procedure
1. **Provision** — create the gateway (**WAF_v2/Standard_v2**) in a **dedicated subnet** with **frontend IP**,
   **listeners**, **backend pool(s)**, **HTTP settings**, **probes**, and **routing rules** via Terraform
   `azurerm_application_gateway` (+ `azurerm_web_application_firewall_policy`), Bicep
   `Microsoft.Network/applicationGateways`, or `az network application-gateway create`.
2. **Configure** — set **TLS termination** (Key Vault cert via managed identity), **path-based routing**,
   redirects/rewrites, **cookie affinity/connection draining**, autoscale, and zones.
3. **Secure** — attach the **WAF Policy** (OWASP CRS, Prevention, tuned exclusions), apply **NSGs** to the
   gateway subnet, restrict listeners to intended hosts, and scope **RBAC**.
4. **Verify** — apply [[verify-by-running]]: confirm the gateway provisioned and **backend health is Healthy**
   (`az network application-gateway show-backend-health`), then send HTTP(S) requests and confirm **path/host
   routing** reaches the right backend, **TLS** terminates, and the **WAF** blocks a malicious sample (e.g. a
   probe matching a CRS rule) in Prevention. Capture state and result.

## Inputs
The hosts/paths to route and their backends, public vs private exposure, TLS certificates (Key Vault),
WAF posture (Detection vs Prevention, exclusions), health-endpoint per backend, autoscale/zone requirements,
the dedicated subnet, NSG posture, and region.

## Output
An Azure Application Gateway setup: a v2 (WAF_v2) gateway in a dedicated subnet with autoscaling/zones,
frontend IP(s), multi-site listeners, path-based routing rules, backend pools + tuned HTTP settings/probes,
TLS termination, and a tuned WAF Policy in Prevention — plus verification that routing reaches healthy
backends and the WAF blocks malicious requests.

## Notes
- Gotchas: requires a **dedicated subnet** (don't share it); **WAF Prevention can block legitimate traffic** —
  start in **Detection**, then tune exclusions/anomaly score; it is **regional, not global** (use Front Door
  for edge/CDN); v1↔v2 are not interchangeable (migrate, don't mix); end-to-end TLS needs trusted backend
  certs; a bad **health probe** drains backends. For L4 use **Load Balancer**; for global edge use **Front
  Door**. Broad topology is the role team's call via network-design. 2nd consumer: the Azure role team
  (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer). Cross-cloud peers: AWS ALB, GCP
  Application Load Balancer.
- IaC/CLI: Terraform `azurerm_application_gateway` (+ `azurerm_web_application_firewall_policy`); Bicep/ARM
  `Microsoft.Network/applicationGateways`. CLI `az network application-gateway create` / `... rule/listener/
  address-pool create` / `... show-backend-health`.
