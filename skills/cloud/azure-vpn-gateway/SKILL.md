---
name: azure-vpn-gateway
description: Use when designing, provisioning, securing, or operating an Azure VPN Gateway — Azure's managed gateway for encrypted IPsec/IKE connectivity between a VNet and on-premises or other networks over the public internet (Azure VPN Gateway). Covers site-to-site (S2S) tunnels to on-prem VPN devices, point-to-site (P2S) for clients (OpenVPN/IKEv2/SSTP; Entra/cert/RADIUS auth), VNet-to-VNet, the GatewaySubnet, SKUs (VpnGw1–5/AZ), active-active vs active-standby HA, BGP for dynamic routing, local network gateways and shared keys, and throughput/tunnel limits. Loads the knowledge: choose SKU and HA, create the GatewaySubnet and gateway, configure S2S/P2S/VNet-to-VNet connections and BGP, secure, provision, and verify tunnels are Connected and traffic flows. Consumed by the azure-vpn-gateway specialist and by the Azure role team (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure VPN Gateway).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-vpn-gateway, networking, vpn, hybrid]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure VPN Gateway

Azure's **managed VPN gateway** providing **encrypted IPsec/IKE** connectivity between a VNet and
on-premises, remote clients, or other VNets **over the public internet**. This skill owns the **VPN-gateway
managed-service layer** — SKU, the GatewaySubnet, S2S/P2S/VNet-to-VNet connections, HA, and BGP. (For
**private, dedicated** hybrid connectivity use **ExpressRoute** instead.)

## Core concepts and components
- **Gateway types** — a **VPN** type virtual network gateway lives in the special **GatewaySubnet** and
  terminates tunnels. (ExpressRoute uses an ExpressRoute-type gateway.)
- **Site-to-site (S2S)** — IPsec/IKE tunnel from the gateway to an on-prem **VPN device**, modeled by a
  **local network gateway** (on-prem public IP + address space) + a **connection** with a **shared key**.
- **Point-to-site (P2S)** — individual clients connect via **OpenVPN/IKEv2/SSTP**, authenticated by
  **Entra ID**, **certificate**, or **RADIUS**; clients draw from a client address pool.
- **VNet-to-VNet** — connects two VNet gateways (alternative to peering for cross-region/cross-tenant).
- **SKUs** — **VpnGw1–VpnGw5** (and **AZ** zone-redundant variants) set aggregate **throughput** and **tunnel/
  P2S connection** limits. Legacy Basic SKU is limited.
- **HA** — **active-active** (two gateway instances + two public IPs, dual tunnels) vs **active-standby**.
- **BGP** — dynamic routing/route propagation across the tunnel (ASN + APIPA peer addresses), avoiding
  static route maintenance and enabling transit/failover.

## Configuration and sizing
- Create the **GatewaySubnet** (recommend **/27**), pick a **VpnGwN(AZ)** SKU for required **throughput/
  tunnels**, deploy **active-active** for HA, define **local network gateways** + **connections** (S2S),
  configure **P2S** (protocol + auth + client pool), enable **BGP** where dynamic routing/transit is needed.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC** (Network Contributor). Tunnels are **IPsec-encrypted**; use a
  strong **IKE/IPsec policy** and a strong **shared key** (rotate it), prefer **Entra ID auth for P2S**,
  store keys/certs in **Key Vault**, and scope on-prem/client address spaces tightly. Route inspected traffic
  through **Azure Firewall** where required. Avoid exposing more address space than necessary.

## Cost levers
- Bills on **gateway-hours by SKU** + **outbound data transfer** + P2S connection-hours. Levers: right-size
  the **SKU** to actual throughput/tunnels, avoid over-provisioning HA where not needed, and prefer
  **ExpressRoute** for sustained high-volume hybrid traffic. The gateway runs 24/7 once deployed.

## Scaling and limits
- Throughput and tunnel/P2S counts are **fixed by SKU** (scale by resizing the SKU). Limits: the
  **GatewaySubnet** is required and should be **/27** (some features need a larger range); gateway
  **provisioning/resize takes many minutes** (plan maintenance); aggregate throughput is **shared** across
  all tunnels; over-internet VPN has variable latency (use **ExpressRoute** for predictable performance);
  overlapping address spaces break routing; **BGP** ASNs must not conflict.

## Operating procedure
1. **Provision** — create the **GatewaySubnet** and the **VPN gateway** (type Vpn, SKU, active-active, public
   IP[s]) via Terraform `azurerm_virtual_network_gateway`, Bicep
   `Microsoft.Network/virtualNetworkGateways`, or `az network vnet-gateway create`.
2. **Configure** — add **local network gateway(s)** and **S2S connections** (`azurerm_local_network_gateway` +
   `azurerm_virtual_network_gateway_connection`), **P2S** (protocol/auth/client pool), **VNet-to-VNet**, and
   **BGP** (ASN/peer) as needed.
3. **Secure** — set a strong **IKE/IPsec policy** + **shared key** (rotate), use **Entra ID auth** for P2S,
   store secrets in **Key Vault**, scope address spaces, and route inspected traffic via firewall.
4. **Verify** — apply [[verify-by-running]]: confirm the gateway provisioned and the **connection status is
   Connected** (`az network vpn-connection show`), then send traffic across the tunnel and confirm
   **end-to-end reachability** (and, with BGP, that expected routes are learned). Capture state and result.

## Inputs
The connectivity model (S2S/P2S/VNet-to-VNet), on-prem device details + address space (local network
gateway), required throughput/tunnel counts (SKU), HA needs, P2S protocol/auth, BGP ASN/peers, the
GatewaySubnet range, key/cert management, and region.

## Output
An Azure VPN Gateway setup: a GatewaySubnet, a right-sized VpnGw(AZ) gateway (active-active for HA), S2S/
P2S/VNet-to-VNet connections with strong IKE/IPsec policy and rotated keys/Entra P2S auth, optional BGP —
plus verification that tunnels are Connected and traffic flows end-to-end.

## Notes
- Gotchas: the **GatewaySubnet** is mandatory and should be **/27**; gateway **create/resize is slow** (minutes
  of downtime); throughput is **shared** and **fixed by SKU**; **overlapping address spaces** break routing;
  internet VPN latency is variable — use **ExpressRoute** for predictable/high-volume hybrid; **BGP ASN**
  conflicts and missing route propagation cause silent failures; rotate the **shared key**. For private,
  dedicated connectivity use **ExpressRoute**. Broad topology is the role team's call via network-design. 2nd
  consumer: the Azure role team (azure-networking-engineer / azure-cloud-architect / azure-iac-engineer).
  Cross-cloud peers: AWS Site-to-Site VPN, GCP Cloud VPN.
- IaC/CLI: Terraform `azurerm_virtual_network_gateway` (+ `azurerm_local_network_gateway` /
  `azurerm_virtual_network_gateway_connection`); Bicep/ARM `Microsoft.Network/virtualNetworkGateways`. CLI `az
  network vnet-gateway create` / `az network vpn-connection create/show`.
