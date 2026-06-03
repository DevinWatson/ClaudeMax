---
name: azure-virtual-wan
description: Use when designing, provisioning, securing, or operating Azure Virtual WAN — the managed global transit networking service that connects VNets, branches, and users through Microsoft-managed regional hubs in a hub-and-spoke / any-to-any model (Azure Virtual WAN). Covers the Virtual WAN resource and virtual hubs (one per region), hub connections (VNet connections, site-to-site VPN, point-to-site VPN, ExpressRoute), the hub route tables / routing intent and inter-hub global transit, secured virtual hubs (integrated Azure Firewall / Routing Intent for private+internet traffic inspection), and hub capacity/scale units. Loads the knowledge: create the WAN + hubs, attach connections, design routing, secure hubs, and verify branch/VNet-to-VNet transit. Consumed by the azure-virtual-wan specialist and by the Azure role team (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure Virtual WAN).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-virtual-wan, networking, hub-spoke, global-transit]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Virtual WAN

A **Microsoft-managed global transit** network. Instead of hand-building hub VNets, gateways, and route
tables, you create a **Virtual WAN** with **virtual hubs** per region; Azure manages the hub, gateways, and
**any-to-any** routing (VNet↔VNet, branch↔VNet, branch↔branch, inter-region). This skill owns the WAN, hubs,
connections, and routing.

## Core concepts and components
- **Virtual WAN** — the top-level resource (`azurerm_virtual_wan`) of type **Standard** (full transit) or
  **Basic** (S2S VPN only). Standard enables inter-hub transit and all gateway types.
- **Virtual hub** — a Microsoft-managed hub VNet **per region** (`azurerm_virtual_hub`) with a hub address
  space and a **scale-unit/capacity** setting; hubs are auto-meshed for **global transit**.
- **Connections** — **VNet connections** (`azurerm_virtual_hub_connection`), **site-to-site VPN** (VPN gateway
  + sites), **point-to-site VPN** (user VPN), and **ExpressRoute** circuits attach into a hub.
- **Routing** — **hub route tables** and **Routing Intent** (preferred) declare how the hub forwards
  **private** and **internet** traffic; replaces hand-managed UDRs. Inter-hub routing is automatic on Standard.
- **Secured virtual hub** — a hub with **Azure Firewall** (Firewall Manager) so Routing Intent steers private
  and/or internet traffic through inspection without per-spoke UDRs.

## Configuration and sizing
- Create a **Standard** WAN, one **virtual hub per region** you operate in (non-overlapping hub CIDR, sized
  /23 or larger), attach **spoke VNet connections** and **VPN/ExpressRoute** for branches/on-prem, and use
  **Routing Intent** to centralize forwarding. Add **Azure Firewall** to hubs needing inspection (secured hub).
  Scale hubs via **routing infrastructure units** as throughput grows.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC** (Network Contributor). Data-plane: **secured hubs** with Azure
  Firewall + **Routing Intent** to inspect private/internet traffic centrally; NSGs still apply on spokes.
  Branch VPN uses IPsec; user VPN uses Entra/RADIUS/cert auth. Hubs replace error-prone manual transit routing.

## Cost levers
- You pay for the **hub** (per hour + scale units), **connection units** per VNet connection, **gateways**
  (VPN/ExpressRoute scale units), **data processed** for transit, and **Azure Firewall** in secured hubs.
  Levers: minimize **number of hubs** (one per active region), right-size **scale units**, and avoid
  unnecessary **inter-region** transit chatter; consolidate firewalls into shared secured hubs.

## Scaling and limits
- Scales to many spokes, branches, and hubs with managed routing. Limits: **hub address space cannot overlap**
  spokes/on-prem; **Basic WAN is S2S-only** (no transit) — use **Standard**; hub address space and some
  properties are hard to change post-deploy; gateway/connection counts and aggregate throughput are bounded by
  **scale units** (request increases). Routing Intent and custom route tables interact — pick one model.

## Operating procedure
1. **Provision** — create the **Virtual WAN** (Standard) and a **virtual hub** per region via Terraform
   `azurerm_virtual_wan` + `azurerm_virtual_hub`, Bicep `Microsoft.Network/virtualWans` (+ `/virtualHubs`),
   or `az network vwan create` + `az network vhub create`.
2. **Configure** — attach **VNet connections** (`azurerm_virtual_hub_connection`), **VPN gateways + sites**,
   **point-to-site**, and **ExpressRoute**; define **Routing Intent** / hub route tables for private+internet.
3. **Secure** — convert hubs to **secured hubs** with **Azure Firewall** + Routing Intent for inspection, and
   scope **RBAC**.
4. **Verify** — apply [[verify-by-running]]: confirm WAN/hub provisioned and connections **Connected** (`az
   network vhub show` / `az network vhub connection list`), inspect **effective routes**, and run a
   reachability test between a spoke VNet and a branch (and VNet↔VNet across hubs) confirming transit works.
   Capture state and result.

## Inputs
Regions/hubs needed (non-overlapping hub CIDRs), spoke VNets to connect, branch/on-prem connectivity (S2S/P2S
VPN, ExpressRoute), routing model (Routing Intent vs custom route tables), inspection needs (secured hub +
Firewall), and scale-unit sizing.

## Output
An Azure Virtual WAN setup: a Standard WAN with regional virtual hubs, VNet/VPN/ExpressRoute connections,
Routing Intent for global transit, optional secured hubs with Azure Firewall, scoped RBAC — plus verification
that spoke↔branch and inter-hub transit routes and reaches as intended.

## Notes
- Gotchas: **hub CIDR overlap** breaks connections — plan IPAM; **Basic WAN has no transit** (use Standard);
  mixing **Routing Intent** and custom route tables is confusing — choose one; hubs are **per region**;
  secured-hub inspection needs **Routing Intent**; aggregate throughput is bounded by **scale units**. Virtual
  WAN is the managed hub-spoke alternative to building hubs by hand (azure-virtual-network). Cross-cutting
  topology is the role team's call via network-design. 2nd consumer: the Azure role team
  (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer). Cross-cloud peer: AWS Transit
  Gateway.
- IaC/CLI: Terraform `azurerm_virtual_wan` + `azurerm_virtual_hub` (+ `azurerm_virtual_hub_connection` /
  `azurerm_vpn_gateway` / `azurerm_express_route_circuit`); Bicep/ARM `Microsoft.Network/virtualWans` /
  `virtualHubs`. CLI `az network vwan create` / `az network vhub create`.
