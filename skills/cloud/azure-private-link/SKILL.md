---
name: azure-private-link
description: Use when designing, provisioning, securing, or operating Azure Private Link — private, backbone-only connectivity to Azure PaaS and your own services via a private IP in your VNet, with no public-internet exposure (Azure Private Link). Covers Private Endpoints (a private NIC for a target PaaS/service), the Private Link Service (expose your own L4 load-balanced service privately to consumers), private DNS zone integration (privatelink.* zones) so names resolve to the private IP, connection approval workflow, NSG/UDR behavior on endpoints, and cross-tenant/cross-region access. Loads the knowledge: create the endpoint or link service, wire private DNS, approve the connection, lock down public access on the target, and verify private resolution + reachability. Consumed by the azure-private-link specialist and by the Azure role team (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure Private Link).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-private-link, networking, private-endpoint, dns]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Private Link

Bring an Azure **PaaS resource** (or your own service) onto a **private IP inside your VNet** so traffic
stays on the Microsoft backbone and the resource's public endpoint can be disabled. This skill owns the
**endpoint/link-service + private-DNS layer** end-to-end and proving names resolve privately.

## Core concepts and components
- **Private Endpoint** — a NIC with a **private IP** in your subnet that maps to a specific **sub-resource**
  of a target (e.g. a storage account's `blob`, a SQL server's `sqlServer`). Created with
  `azurerm_private_endpoint`; the target's public access can then be denied.
- **Private Link Service** — the **provider** side: front your own service behind a **Standard internal Load
  Balancer** and publish it so **consumers** create private endpoints to it (incl. **cross-tenant**).
- **Private DNS integration** — a **privatelink.<service>.<suffix>** private DNS zone (e.g.
  `privatelink.blob.core.windows.net`) linked to the VNet so the public FQDN's CNAME resolves to the
  endpoint's **private IP**. Without this, clients still hit the public name/IP.
- **Connection approval** — endpoint connections are **auto-approved** (same owner) or **manually approved**
  by the resource/link-service owner (cross-team/cross-tenant), with a request message.
- **NSG/UDR** — endpoints support **NSG** filtering; default routes keep traffic private; the endpoint is
  reachable from peered VNets and on-prem over VPN/ExpressRoute.

## Configuration and sizing
- For each PaaS resource pick the correct **sub-resource group ID**, place the endpoint in an appropriate
  subnet, create/link the **privatelink** private DNS zone (centralized in a hub for org-wide resolution),
  and **disable public network access** on the target. For your own service, deploy a Standard internal LB
  then a **Private Link Service** and share its alias/resource ID with consumers.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC** (Network Contributor; resource owner approves connections).
  The security win is **no public exposure** — set `public_network_access_enabled = false` on the target.
  Use **manual approval** for cross-tenant. Endpoint NSGs and the absence of a public route enforce isolation.

## Cost levers
- Private endpoints bill **per hour + per GB** processed (inbound/outbound). Levers: **consolidate** endpoints
  (one per needed sub-resource, not per client), **centralize private DNS** in a hub VNet rather than per
  spoke, and remove unused endpoints. Private Link Service has its own LB/data costs.

## Scaling and limits
- Many endpoints per VNet/subscription (limits apply — request increases). Limits: an endpoint targets **one
  sub-resource** (multiple sub-resources = multiple endpoints), **private DNS must be wired** or resolution
  still goes public, endpoint **private IP is consumed from the subnet**, and Private Link Service requires a
  **Standard internal LB** (not Basic). Some services pin the FQDN — verify the privatelink zone name.

## Operating procedure
1. **Provision** — create the **Private Endpoint** to the target sub-resource (`azurerm_private_endpoint`,
   Bicep `Microsoft.Network/privateEndpoints`, or `az network private-endpoint create`); or for a provider,
   the **Private Link Service** (`azurerm_private_link_service`) behind a Standard internal LB.
2. **Configure** — create/link the **privatelink private DNS zone** (`azurerm_private_dns_zone` +
   `..._virtual_network_link` + the endpoint's `private_dns_zone_group`) so the FQDN resolves to the private
   IP; set NSGs as needed.
3. **Secure** — **disable public network access** on the target, scope **RBAC**, and use **manual approval**
   for cross-tenant connections.
4. **Verify** — apply [[verify-by-running]]: confirm the endpoint connection is **Approved** (`az network
   private-endpoint show`), then from a VNet client confirm the FQDN **resolves to the private IP** (`nslookup`
   / `dig`) and the service is reachable while the **public endpoint is denied**. Capture state and result.

## Inputs
The target resource + correct **sub-resource** (or the provider service/LB), the subnet for the endpoint, the
**privatelink DNS zone** strategy (hub vs spoke), approval model (auto/manual, cross-tenant), and whether to
disable public access on the target.

## Output
An Azure Private Link setup: private endpoint(s) (or a Private Link Service) with approved connections,
linked privatelink private DNS zones resolving to private IPs, public access disabled on targets, scoped
RBAC — plus verification that the FQDN resolves privately and the public path is closed.

## Notes
- Gotchas: forgetting **private DNS** is the #1 failure (clients keep hitting the public IP); an endpoint is
  **per sub-resource**; **disable public access** on the target or you have not isolated anything; cross-tenant
  needs **manual approval**; centralize the **privatelink zone** in a hub to avoid per-spoke drift; the
  endpoint consumes a **subnet IP**. Cross-cutting topology/DNS strategy is the role team's call via
  network-design. 2nd consumer: the Azure role team (azure-networking-engineer / azure-cloud-architect /
  azure-iac-engineer). Cross-cloud peers: AWS PrivateLink, GCP Private Service Connect.
- IaC/CLI: Terraform `azurerm_private_endpoint` (+ `azurerm_private_dns_zone` / `..._virtual_network_link` /
  `private_dns_zone_group`) and `azurerm_private_link_service`; Bicep/ARM `Microsoft.Network/privateEndpoints`
  / `privateLinkServices`. CLI `az network private-endpoint create` / `az network private-link-service create`.
