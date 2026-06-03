---
name: azure-virtual-network
description: Use when designing, provisioning, securing, or operating an Azure Virtual Network (VNet) — the foundational private network in a region where Azure resources run, with isolation, segmentation, and connectivity (Azure Virtual Network). Covers VNet address space (CIDR) and subnets, Network Security Groups (NSGs) and Application Security Groups, user-defined routes (UDRs)/route tables and NAT Gateway for egress, VNet peering (regional/global) and the hub-spoke model, service endpoints vs private endpoints (Private Link) for reaching PaaS privately, subnet delegation, DNS, and Entra/RBAC. Loads the knowledge: plan non-overlapping CIDRs and subnets, apply NSGs/routes, wire peering/endpoints, secure, provision, and verify connectivity. Consumed by the azure-virtual-network specialist and by the Azure role team (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure Virtual Network).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-virtual-network, networking, vnet, subnet]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Virtual Network

The **foundational private network** in an Azure region — a **VNet** gives your resources isolation, an IP
address space, segmentation into subnets, and controlled connectivity to other VNets, on-prem, and PaaS.
Almost every other service plugs into a VNet. This skill owns the **single-VNet managed-service layer** —
address space, subnets, NSGs, routes, peering, and endpoints. (Multi-VNet topology design is the role team's
job.)

## Core concepts and components
- **VNet & address space** — one or more **non-overlapping CIDR** ranges (e.g. `10.0.0.0/16`) scoped to a
  region + subscription. Overlap blocks peering/VPN later.
- **Subnets** — partition the VNet's CIDR; resources get IPs from a subnet. Some services need a **delegated**
  subnet; gateways need named subnets (`GatewaySubnet`, `AzureBastionSubnet`).
- **NSGs & ASGs** — **Network Security Groups** are stateful allow/deny rules (priority-ordered, 5-tuple) on
  subnets/NICs; **Application Security Groups** group NICs so rules reference workloads, not IPs.
- **Routes** — system routes by default; **user-defined routes (UDRs)** / **route tables** force traffic
  (e.g. through a firewall/NVA); **NAT Gateway** gives scalable, deterministic **outbound** SNAT.
- **Peering & hub-spoke** — **VNet peering** (regional or **global**) connects VNets with private,
  low-latency, non-transitive links; the **hub-spoke** pattern centralizes shared services.
- **Reaching PaaS privately** — **service endpoints** (route to PaaS over the backbone, still PaaS public IP)
  vs **private endpoints / Private Link** (a private IP in your subnet for the PaaS resource; preferred).

## Configuration and sizing
- Plan a **non-overlapping** address space sized for growth, carve **subnets** per tier/role (leave headroom;
  Azure reserves 5 IPs per subnet), attach **NSGs** (default-deny inbound), add **UDRs/NAT Gateway** for
  egress control, and decide **peering** vs gateway connectivity and **service vs private endpoints** for PaaS.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC** (Network Contributor). Data-plane security is **NSGs/ASGs**
  (least-privilege, default-deny inbound, explicit allows), **UDRs** to route egress through inspection,
  **private endpoints** to keep PaaS off the public internet, and DDoS Protection where needed. Disable public
  IPs where private connectivity suffices; segment tiers into separate subnets.

## Cost levers
- The VNet itself is **free**; you pay for **peering data transfer** (both directions, more for global),
  **NAT Gateway** (hourly + data), **private endpoints** (hourly + data), VPN/ExpressRoute gateways, and
  DDoS. Levers: prefer **same-region** peering, consolidate **private endpoints**, right-size **NAT Gateway**,
  and avoid unnecessary cross-region/global peering chatter.

## Scaling and limits
- A VNet scales to large address spaces and many subnets/NICs (per-subscription limits apply — request
  increases). Limits: **peering is non-transitive** (spokes can't reach each other through the hub without a
  firewall/route), **address spaces must not overlap** across peered/connected networks, **5 IPs reserved per
  subnet**, some subnet properties are hard to change once resources are deployed, and certain services
  require dedicated/delegated subnets.

## Operating procedure
1. **Provision** — create the **VNet** (address space) and **subnets** via Terraform `azurerm_virtual_network`
   + `azurerm_subnet`, Bicep `Microsoft.Network/virtualNetworks` (+ `/subnets`), or `az network vnet create` +
   `az network vnet subnet create`.
2. **Configure** — attach **NSGs/ASGs** (`azurerm_network_security_group` + associations), **route tables/
   UDRs** and **NAT Gateway**, set up **peering** and **service/private endpoints**, and DNS as needed.
3. **Secure** — apply **default-deny** NSGs with least-privilege allows, route egress through inspection,
   prefer **private endpoints** for PaaS, and scope **RBAC** (Network Contributor).
4. **Verify** — apply [[verify-by-running]]: confirm the VNet/subnets provisioned (`az network vnet show`),
   then validate **connectivity** — e.g. NSG effective rules and a reachability test (`az network watcher
   test-connectivity` / `test-ip-flow`) between a source and destination — and confirm expected allow/deny.
   Capture state and result.

## Inputs
The address-space plan (non-overlapping CIDR), subnet/tier segmentation and delegations, egress control needs
(UDR/NAT/firewall), connectivity (peering/hub-spoke, VPN/ExpressRoute), PaaS access model (service vs private
endpoints), DNS, security posture (NSG rules), and region/subscription.

## Output
An Azure Virtual Network setup: a VNet with a sound non-overlapping address space, segmented subnets,
default-deny NSGs/ASGs, routes/NAT for egress, peering and service/private endpoints, scoped RBAC — plus
verification that intended connectivity works and unintended paths are blocked.

## Notes
- Gotchas: **overlapping address spaces** break peering/VPN — plan IPAM up front; **peering is
  non-transitive** (hub-spoke needs a firewall/UDR to route between spokes); **5 IPs reserved per subnet**;
  some subnet changes require redeploying resources; **NSG default rules** allow intra-VNet traffic — tighten
  explicitly; prefer **private endpoints** over service endpoints for true isolation. Broad multi-VNet
  topology is the role team's call via network-design. 2nd consumer: the Azure role team
  (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer). Cross-cloud peers: AWS VPC, GCP
  VPC.
- IaC/CLI: Terraform `azurerm_virtual_network` + `azurerm_subnet` (+ `azurerm_network_security_group` /
  `azurerm_route_table` / `azurerm_virtual_network_peering` / `azurerm_private_endpoint`); Bicep/ARM
  `Microsoft.Network/virtualNetworks`. CLI `az network vnet create` / `az network vnet subnet create` / `az
  network watcher test-connectivity`.
