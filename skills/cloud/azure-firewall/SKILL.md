---
name: azure-firewall
description: Use when designing, provisioning, securing, or operating Azure Firewall — Azure's managed, stateful, cloud-native firewall-as-a-service that centrally governs and inspects traffic for a hub VNet (Azure Firewall). Covers the SKUs (Basic/Standard/Premium), the AzureFirewallSubnet with zones, network rules (L3/L4), application rules (FQDN/FQDN-tag), NAT (DNAT) rules, threat intelligence, the central Firewall Policy (rule collection groups + priorities), Premium IDPS and TLS inspection, forced tunneling and UDRs that route spoke traffic through it, and logging to Log Analytics. Loads the knowledge: pick SKU, deploy into the hub subnet, author a Firewall Policy (network/application/NAT rules + threat intel/IDPS), route traffic through it, secure, provision, and verify allowed/denied flows. Consumed by the azure-firewall specialist and by the Azure role team (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure Firewall).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-firewall, networking, security, firewall]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Firewall

Azure's **managed, stateful, cloud-native firewall-as-a-service** that **centrally inspects and governs**
network and application traffic, typically at a **hub** VNet for hub-spoke topologies. This skill owns the
**firewall managed-service layer** — SKU, the firewall + its policy (network/application/NAT rules, threat
intel, Premium IDPS), and the routing that sends traffic through it. (The hub-spoke **topology design** itself
is the role team's call.)

## Core concepts and components
- **SKUs** — **Basic** (small/SMB, lower throughput), **Standard** (network/application/NAT rules + threat
  intel), **Premium** (adds **TLS inspection**, **IDPS** intrusion detection/prevention, URL filtering, web
  categories). Choose by inspection needs and throughput.
- **Deployment** — runs in a dedicated **AzureFirewallSubnet** (and **AzureFirewallManagementSubnet** for
  forced-tunnel/Basic) in the **hub** VNet, with **availability zones** for HA and a static public IP.
- **Network rules** — stateful **L3/L4** allow rules by **source/dest IP, port, protocol**.
- **Application rules** — **FQDN / FQDN-tag** filtering for outbound HTTP/S (and TLS-aware controls in
  Premium); lets you allow only specific domains.
- **NAT (DNAT) rules** — **inbound publishing**: translate a firewall public IP:port to an internal target.
- **Threat intelligence** — **alert or deny** on traffic to/from Microsoft-curated known-malicious IPs/FQDNs.
- **Firewall Policy** — the **central, hierarchical, reusable** rule container (parent/child policies, **rule
  collection groups** with **priorities**); attach to one or many firewalls. Premium IDPS/TLS config lives here.
- **Routing** — **UDRs** on spoke subnets force egress (and inter-spoke traffic) **through the firewall**;
  **forced tunneling** sends all internet-bound traffic on-prem.

## Configuration and sizing
- Pick the **SKU** (Premium for IDPS/TLS), deploy the firewall into the **AzureFirewallSubnet** in the hub
  with **zones**, author a **Firewall Policy** (network + application + NAT **rule collection groups** with
  priorities), enable **threat intelligence (Deny)** and **IDPS** (Premium), and add **UDRs** so spokes route
  through it.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC** (Network Contributor). Default to **deny**, allow only required
  **FQDNs/IPs/ports**; enable **threat intel in Deny mode** and **IDPS** (Premium) in prevention; use
  **Firewall Policy** for consistent, auditable rules; restrict **DNAT** to the minimum published ports; send
  **all logs** (network/application/threat/IDPS) to **Log Analytics**; protect the public IP with DDoS where
  needed.

## Cost levers
- Bills on a **fixed deployment hour** + **data processed (per GB)**, higher for **Premium**. Levers: use
  **Basic/Standard** where IDPS/TLS isn't required, share **one hub firewall** across spokes (don't deploy
  per-spoke), consolidate rules in a shared **Firewall Policy**, and avoid routing intra-VNet traffic through
  it unnecessarily.

## Scaling and limits
- Azure Firewall **autoscales** with throughput and is zone-redundant with an SLA. Limits: requires the
  dedicated **AzureFirewallSubnet** (and management subnet for forced tunneling/Basic); **TLS inspection/IDPS
  are Premium-only**; **Basic** has lower throughput and is for small workloads; **non-transitive peering**
  means inter-spoke routing needs **UDRs** through the firewall; **SNAT port limits** apply for high-egress
  workloads (scale with more public IPs / NAT Gateway considerations); rule-processing order is by **priority**.

## Operating procedure
1. **Provision** — create the **AzureFirewallSubnet** and the **firewall** (SKU, zones, public IP) + a
   **Firewall Policy** via Terraform `azurerm_firewall` + `azurerm_firewall_policy` (+
   `azurerm_firewall_policy_rule_collection_group`), Bicep `Microsoft.Network/azureFirewalls` +
   `/firewallPolicies`, or `az network firewall create` + `az network firewall policy create`.
2. **Configure** — author **network/application/NAT rule collection groups** with **priorities**, enable
   **threat intelligence** and (Premium) **IDPS/TLS inspection**, and add **UDRs** on spoke subnets to route
   through the firewall.
3. **Secure** — default-**deny**, allow only required FQDNs/IPs/ports, threat intel in **Deny**, minimal
   **DNAT**, scope **RBAC**, and send all logs to **Log Analytics**.
4. **Verify** — apply [[verify-by-running]]: confirm the firewall + policy provisioned (`az network firewall
   show`), then generate traffic and confirm an **allowed** flow passes and a **denied** flow (and a
   threat-intel/IDPS hit) is blocked and **logged** in Log Analytics; confirm spoke UDRs route through the
   firewall. Capture state and result.

## Inputs
The inspection needs (SKU: Basic/Standard/Premium, IDPS/TLS), the hub VNet + AzureFirewallSubnet, the rule
set (network/application/NAT) and any inbound publishing (DNAT), threat-intel/IDPS posture, the spokes to
route through it (UDRs), logging destination, and region/zones.

## Output
An Azure Firewall setup: a right-sized firewall in the hub's AzureFirewallSubnet (zone-redundant) governed by
a Firewall Policy (default-deny network/application/NAT rules with priorities), threat intel in Deny, Premium
IDPS/TLS where needed, spoke UDRs routing through it, and Log Analytics logging — plus verification that
allowed traffic passes, denied/malicious traffic is blocked and logged.

## Notes
- Gotchas: requires a dedicated **AzureFirewallSubnet** (and a management subnet for forced tunneling/Basic);
  **TLS inspection and IDPS are Premium-only**; **peering is non-transitive** so inter-spoke traffic needs
  **UDRs** through the firewall; **SNAT port exhaustion** can hit high-egress workloads (add public IPs);
  rules apply by **priority** within collection groups — ordering matters; deploy **one shared hub firewall**,
  not per-spoke. The hub-spoke topology itself is the role team's call via network-design. 2nd consumer: the
  Azure role team (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer). Cross-cloud peers:
  AWS Network Firewall, GCP Cloud NGFW.
- IaC/CLI: Terraform `azurerm_firewall` + `azurerm_firewall_policy` (+
  `azurerm_firewall_policy_rule_collection_group`); Bicep/ARM `Microsoft.Network/azureFirewalls` +
  `/firewallPolicies`. CLI `az network firewall create` / `az network firewall policy create`.
