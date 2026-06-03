---
name: azure-ddos-protection
description: Use when designing, provisioning, securing, or operating Azure DDoS Protection — the managed always-on distributed-denial-of-service mitigation that protects public IPs and virtual networks at the Azure network edge (Azure DDoS Protection). Covers the Network Protection and IP Protection tiers, DDoS protection plans, enabling protection on VNets/public IPs, adaptive tuning and mitigation policies (per-IP detection thresholds), telemetry/metrics/attack analytics and alerting, the SLA/cost-protection guarantee, and integration with Azure Firewall/WAF for layer-7. Loads the knowledge: pick the tier, create the plan, associate VNets/IPs, tune policies, wire metrics+alerts, and verify mitigation. Consumed by the azure-ddos-protection specialist and by the Azure role team (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure DDoS Protection).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-ddos-protection, networking, ddos, security]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure DDoS Protection

Managed, **always-on** mitigation of volumetric (L3/L4) distributed-denial-of-service attacks against
Azure **public IPs**. Azure applies basic platform protection for free; this skill owns the **enhanced**
tiers — turning on adaptive, per-resource mitigation, tuning policies, and proving an attack is absorbed.

## Core concepts and components
- **Tiers** — **DDoS Network Protection** protects all public IPs in associated **virtual networks** under a
  plan (priced per plan + per protected resource overage). **DDoS IP Protection** (cheaper, SMB) protects
  **individual public IP addresses** with no plan, billed per protected IP.
- **DDoS protection plan** — a subscription-scoped resource (`azurerm_network_ddos_protection_plan`) that
  Network Protection VNets associate to; one plan can cover many VNets across subscriptions.
- **Mitigation policies** — auto-tuned **adaptive** thresholds (TCP SYN, TCP, UDP packets/sec) learned per
  public IP from traffic profile; mitigation triggers when traffic exceeds the learned policy.
- **Telemetry** — per-IP **metrics** (`Under DDoS attack`, packets/bytes in/out, dropped/forwarded),
  **attack flow logs**, mitigation reports, and **diagnostic settings** to Log Analytics/Storage/Event Hub.
- **Cost protection / SLA** — Network Protection includes **cost-protection credits** for scale-out during a
  documented attack plus rapid-response support and a 99.99% uptime SLA on protected resources.

## Configuration and sizing
- Choose **Network Protection** (VNet-wide, enterprise, includes WAF discount + cost protection) vs **IP
  Protection** (a few public IPs, no plan). Create **one plan** per org/tenant where practical (it is the
  costly unit), associate production VNets, and let adaptive tuning learn — do not hand-set thresholds.
  Pair with **Azure WAF** (Front Door / Application Gateway) for **layer-7** attacks DDoS does not cover.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC** (Network Contributor to create/associate plans). DDoS protects
  only **public IPs** — private resources are unaffected. It is **L3/L4 only**: combine with WAF for HTTP
  floods and with **Azure Firewall/NSGs** for filtering. Enable **diagnostic settings** for an audit trail.

## Cost levers
- Network Protection is a **fixed monthly plan** covering up to 100 public IP resources, then per-resource
  overage — **share one plan across all VNets/subscriptions** to amortize. Use **IP Protection** for a small
  number of IPs to avoid the plan fee. Do not leave a plan with no associated VNets (paying for nothing).

## Scaling and limits
- Mitigation scales to absorb very large volumetric attacks at the Azure edge automatically. Limits: covers
  **public IPs only** (no Basic SKU IPs for some features — use Standard public IPs), **L3/L4 only**, a plan
  covers a baseline number of resources before overage, and adaptive policies need a **learning window**
  before thresholds are accurate on a brand-new IP.

## Operating procedure
1. **Provision** — create a **DDoS protection plan** via Terraform `azurerm_network_ddos_protection_plan`,
   Bicep `Microsoft.Network/ddosProtectionPlans`, or `az network ddos-protection create`.
2. **Configure** — for Network Protection, set `enable_ddos_protection = true` + `ddos_protection_plan_id` on
   the VNet (`azurerm_virtual_network`); for IP Protection, set the DDoS protection mode on the public IP. Let
   adaptive tuning establish per-IP policies.
3. **Secure** — scope **RBAC**, enable **diagnostic settings** to Log Analytics, and add **WAF** (Front Door/
   App Gateway) for L7 plus **alerts** on the `Under DDoS attack` metric.
4. **Verify** — apply [[verify-by-running]]: confirm the plan exists and VNet/IP association is active (`az
   network ddos-protection show`, public IP shows DDoS enabled), confirm metrics/diagnostics are flowing, and
   review a **simulation/test** report (BreakingPoint Cloud partner test) showing mitigation engaged. Capture
   state and result.

## Inputs
Tier choice (Network vs IP Protection), the VNets/public IPs to protect, plan scope (which subscriptions),
telemetry destination (Log Analytics/Storage/Event Hub), alert thresholds, and the L7/WAF pairing.

## Output
An Azure DDoS Protection setup: a protection plan (or IP-level protection), VNet/IP associations, adaptive
mitigation policies, metrics + diagnostic settings + alerts, and WAF pairing for L7 — plus verification that
protection is active and mitigation engages under a simulated attack.

## Notes
- Gotchas: DDoS is **L3/L4 only** — HTTP floods need **WAF**; protects **public IPs only**; the **plan** is
  the costly unit so **share it** rather than creating one per VNet; adaptive policies need a **learning
  window**; cost-protection credits require a **documented attack** and support case; do not confuse the free
  always-on **platform** protection with the paid enhanced tiers. Cross-cutting edge topology is the role
  team's call via network-design. 2nd consumer: the Azure role team (azure-networking-engineer /
  azure-cloud-architect / azure-iac-engineer). Cross-cloud peer: AWS Shield (Advanced).
- IaC/CLI: Terraform `azurerm_network_ddos_protection_plan` (+ `azurerm_virtual_network` with
  `ddos_protection_plan`); Bicep/ARM `Microsoft.Network/ddosProtectionPlans`. CLI `az network ddos-protection
  create` / `show`.
