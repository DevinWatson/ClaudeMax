---
name: azure-expressroute
description: Use when designing, provisioning, securing, or operating Azure ExpressRoute — Azure's private, dedicated connectivity linking on-premises networks to Azure through a connectivity provider, bypassing the public internet for predictable bandwidth, low latency, and high reliability (Azure ExpressRoute). Covers circuits (provider/Direct, bandwidth tiers, Local/Standard/Premium SKUs, metered vs unlimited), peerings (private peering for VNets, Microsoft peering for M365/PaaS) with BGP, the ExpressRoute gateway and connections, Global Reach, FastPath, redundancy, and IPsec/MACsec encryption. Loads the knowledge: order/provision the circuit, configure peerings and BGP, deploy the gateway and connections, secure, and verify BGP routes are learned and traffic flows privately. Consumed by the azure-expressroute specialist and by the Azure role team (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure ExpressRoute).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-expressroute, networking, hybrid, private-connectivity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure ExpressRoute

Azure's **private, dedicated connectivity** linking on-premises networks to Azure **through a connectivity
provider**, **bypassing the public internet** for predictable bandwidth, lower/consistent latency, and higher
reliability. This skill owns the **ExpressRoute managed-service layer** — circuits, peerings, gateways, and
connections. (For encrypted connectivity **over the internet** use **VPN Gateway**; ExpressRoute is the
**private dedicated** option.)

## Core concepts and components
- **Circuit** — the logical connection through a **connectivity provider** (service-provider model) or via
  **ExpressRoute Direct** (dedicated ports). Has a **bandwidth tier** and a **service key (s-key)** you give
  the provider; **provisioning state** must reach **Provisioned** on both Azure and provider sides.
- **SKUs / billing** — **Local / Standard / Premium** (Premium extends route limits and global VNet reach;
  Local is region-local at lower cost) and **Metered vs Unlimited** data plans.
- **Peerings (BGP)** — **Azure private peering** (reach **VNets** privately) and **Microsoft peering** (reach
  **Microsoft 365 / public PaaS** over the private circuit), each a **BGP** session with primary/secondary
  links for redundancy.
- **ExpressRoute gateway + connections** — an **ExpressRoute-type** virtual network gateway in the
  **GatewaySubnet** linked to the circuit via a **connection**; **FastPath** bypasses the gateway data path
  for higher throughput.
- **Global Reach** — connect **on-prem sites to each other** through the Microsoft backbone via ExpressRoute.
- **Redundancy** — circuits are **dual (primary/secondary)** by design; add **dual circuits/providers** and
  **active-active gateways** for higher resiliency.

## Configuration and sizing
- Order a **circuit** (provider/Direct, **bandwidth tier**, SKU, billing model), give the provider the
  **s-key**, configure **private** (and optionally **Microsoft**) **peering** with **BGP**, deploy the
  **ExpressRoute gateway** in the **GatewaySubnet** and a **connection** to the circuit, enable **FastPath**
  for throughput, and add **redundancy** (dual circuits/providers, active-active).

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC** (Network Contributor). ExpressRoute is **private but not
  inherently encrypted** at L3 — for confidentiality use **IPsec over ExpressRoute** or **MACsec** (Direct);
  route traffic through **Azure Firewall** for inspection; scope **BGP** advertisements to required prefixes
  (avoid leaking routes); protect the **s-key**; and use **route filters** on Microsoft peering to limit which
  service prefixes are advertised.

## Cost levers
- Bills on the **circuit (port/bandwidth) fee** + **gateway** + **data (metered)** + optional **Global
  Reach/Premium add-ons**. Levers: pick **Local SKU** for region-local traffic, **Unlimited** plan for
  high/steady egress (Metered for low), right-size **bandwidth** and the **gateway SKU/FastPath**, and avoid
  paying for **Premium** unless the global reach/route limits are needed.

## Scaling and limits
- Provides high, dedicated bandwidth with an SLA. Limits: **circuit provisioning takes days/weeks** and
  depends on the **provider** (long lead time); **BGP route limits** depend on SKU (Standard vs Premium);
  **Microsoft peering** needs **route filters** and validation; ExpressRoute is **not encrypted by default**
  (add IPsec/MACsec); the **GatewaySubnet** is required; **gateway throughput** is capped by SKU (use
  **FastPath** for the data path); Global Reach has provider/region constraints.

## Operating procedure
1. **Provision** — create the **circuit** (provider, bandwidth, SKU, billing) via Terraform
   `azurerm_express_route_circuit`, Bicep `Microsoft.Network/expressRouteCircuits`, or `az network express-route
   create`; share the **s-key** and confirm the provider **provisions** it.
2. **Configure** — set up **private/Microsoft peering** + **BGP** (`azurerm_express_route_circuit_peering`,
   route filters for Microsoft peering), deploy the **ExpressRoute gateway** (`azurerm_virtual_network_gateway`
   type ExpressRoute) and a **connection** (`azurerm_virtual_network_gateway_connection` /
   `azurerm_express_route_connection`), and enable **FastPath**/**Global Reach** as needed.
3. **Secure** — add **IPsec/MACsec** for encryption, scope **BGP** prefixes, apply **route filters** on
   Microsoft peering, route through **Azure Firewall** for inspection, protect the **s-key**, scope **RBAC**.
4. **Verify** — apply [[verify-by-running]]: confirm the circuit **provisioning state is Provisioned** and
   peerings are up (`az network express-route show` / `... list-route-tables`), confirm the **BGP routes**
   are learned on the gateway, then send traffic on-prem↔VNet and confirm it flows **privately** over the
   circuit (not the internet). Capture state and result.

## Inputs
The connectivity provider (or Direct ports), required **bandwidth/SKU/billing** model, the peerings needed
(private and/or Microsoft, with route filters), on-prem **BGP** details, the **GatewaySubnet** and gateway
SKU/FastPath, redundancy/Global Reach requirements, encryption needs, and RBAC scope.

## Output
An Azure ExpressRoute setup: a provisioned circuit (right SKU/bandwidth/billing) with private/Microsoft
peering and BGP, an ExpressRoute gateway + connection (FastPath where needed), redundancy and optional Global
Reach, route filters and encryption (IPsec/MACsec) where required — plus verification that the circuit is
Provisioned, BGP routes are learned, and traffic flows privately.

## Notes
- Gotchas: **circuit provisioning is slow (days/weeks) and provider-dependent** — plan lead time; ExpressRoute
  is **private but not encrypted by default** (add **IPsec/MACsec**); **Microsoft peering** requires **route
  filters**; **BGP route limits** scale with SKU (Standard vs Premium); the **GatewaySubnet** is required and
  gateway throughput is **SKU-capped** (use **FastPath**); scope **BGP advertisements** to avoid route leaks.
  For encrypted connectivity over the internet use **VPN Gateway**. Broad hybrid topology is the role team's
  call via network-design. 2nd consumer: the Azure role team (azure-networking-engineer /
  azure-cloud-architect / azure-iac-engineer). Cross-cloud peers: AWS Direct Connect, GCP Cloud Interconnect.
- IaC/CLI: Terraform `azurerm_express_route_circuit` (+ `_circuit_peering` / `azurerm_virtual_network_gateway`
  ExpressRoute / `azurerm_express_route_connection`); Bicep/ARM `Microsoft.Network/expressRouteCircuits`. CLI
  `az network express-route create` / `... peering create` / `... show` / `... list-route-tables`.
