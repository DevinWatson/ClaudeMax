---
name: gcp-cloud-vpn
description: Use when designing, provisioning, securing, or operating Cloud VPN — Google Cloud's managed IPsec VPN that securely connects an on-premises or other-cloud network to a VPC over the public internet, via HA VPN (99.99% SLA, two interfaces) or Classic VPN (single tunnel, legacy). Loads the Cloud VPN knowledge: choose HA vs Classic, create VPN gateways and tunnels, attach Cloud Routers for dynamic BGP routing (or static routes), configure IKE versions/PSKs and redundant tunnel topologies, plus IAM and cost/scaling levers. Consumed by the Cloud VPN specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they build encrypted hybrid connectivity (Cloud VPN).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-vpn, networking, ipsec, ha-vpn, bgp, cloud-router]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud VPN

Cloud VPN securely connects a peer network (on-premises or another cloud) to a Google Cloud VPC over the
public internet using **IPsec** encryption. Traffic is encrypted between the two VPN gateways. It is the
internet-based hybrid option (vs. private Cloud Interconnect) and comes in HA and Classic variants.

## Core concepts and components
- **HA VPN** — the recommended gateway with **two interfaces** (two external IPs) and a **99.99% SLA**
  when configured with redundant tunnels to a peer that supports it. Uses **dynamic (BGP) routing** via
  Cloud Router.
- **Classic VPN** — legacy single-interface gateway (target VPN gateway) supporting static or
  policy-based and dynamic routing; lower SLA — prefer HA VPN for new builds.
- **VPN tunnels** — IPsec tunnels between the GCP gateway and the **peer (external) VPN gateway**;
  configured with **IKEv2** (preferred) or IKEv1, a **pre-shared key (PSK)**, and IKE/IPsec ciphers.
- **Cloud Router + BGP** — for HA VPN, BGP exchanges routes dynamically and enables tunnel
  Active/Active or Active/Passive failover; controls advertised ranges and route priorities.
- **Redundancy topology** — HA VPN's SLA requires **two tunnels** on the two interfaces to a redundant
  peer gateway (or two peer gateways) across different external IPs.

## Configuration and sizing
- Choose **HA VPN** (default) over Classic. Create an **HA VPN gateway** (two interfaces), an **external
  VPN gateway** describing the peer, and **two tunnels** with **BGP** via a **Cloud Router** for the SLA.
  Use **IKEv2** with strong ciphers and a strong **PSK**. Plan non-overlapping IP ranges and scope BGP
  advertisements. Per-tunnel bandwidth caps mean you scale by adding tunnels.

## Security and IAM
- Encrypt with **IKEv2** and strong cipher suites; use long, randomly generated **PSKs** stored in a
  secret manager (never in plaintext IaC). Scope **BGP advertised ranges** to least-needed prefixes and
  pair with VPC **firewall rules** to segment hybrid traffic. Grant least-privilege IAM
  (`roles/compute.networkAdmin`). Enable VPN/Cloud Router logging and monitor tunnel status. For higher
  throughput/lower latency, prefer **Cloud Interconnect** (optionally HA VPN over Interconnect for
  encryption).

## Cost levers
- Cost is **per-tunnel hourly** charges plus **egress** over the tunnel (internet egress rates). Minimize
  tunnels to those needed for the SLA, prefer **regional** traffic, and for sustained high-volume hybrid
  traffic evaluate **Cloud Interconnect** (cheaper egress) instead of VPN.

## Scaling and limits
- Each tunnel has a **bandwidth cap** (per-tunnel throughput limit) — scale by **adding tunnels** (ECMP
  across tunnels via BGP), not by resizing one. Limits: tunnels per gateway, gateways per region, and BGP
  learned/advertised routes per Cloud Router. HA VPN's 99.99% SLA requires the correct redundant
  two-tunnel topology; a single tunnel has a lower SLA.

## Operating procedure
1. **Provision** — create the **HA VPN gateway** (Terraform `google_compute_ha_vpn_gateway`), the
   **external VPN gateway** for the peer (`google_compute_external_vpn_gateway`), and a **Cloud Router**
   (`google_compute_router`) with an ASN.
2. **Configure** — create **two VPN tunnels** (`google_compute_vpn_tunnel`) on the two interfaces with
   **IKEv2** + PSK, then add **Cloud Router interfaces and BGP peers**
   (`google_compute_router_interface` / `google_compute_router_peer`) with scoped advertised ranges for
   failover.
3. **Secure** — use strong PSKs from a secret store, scope BGP advertisements, add least-privilege
   **firewall rules**, grant least-privilege IAM, and enable VPN/router logging.
4. **Verify** — apply [[verify-by-running]]: confirm both tunnels are **ESTABLISHED** and the **BGP
   sessions are UP** with expected routes (`gcloud compute vpn-tunnels describe`,
   `gcloud compute routers get-status`), test peer↔VPC reachability across the tunnel (ping / connectivity
   test), and confirm **failover** by exercising the redundant tunnel — capture tunnel/BGP status and the
   reachability result.

## Inputs
Peer gateway details (IPs, supported IKE/ciphers, redundancy), HA vs Classic choice, region, on-prem and
VPC IP plan and BGP advertisement policy, SLA/redundancy target, throughput needs (tunnel count),
PSK/secret handling, IAM model, and cost ceiling.

## Output
A Cloud VPN connection (HA VPN gateway, external VPN gateway, two IKEv2 tunnels) with Cloud Router BGP and
redundant topology for the 99.99% SLA, scoped advertisements and firewall segmentation, secrets-managed
PSKs, least-privilege IAM and logging, plus verification of tunnel/BGP status and peer↔VPC reachability
with failover.

## Notes
- Gotchas: a **single tunnel does not meet the 99.99% SLA** — HA VPN needs **two tunnels** across both
  interfaces to a redundant peer; **per-tunnel bandwidth caps** mean you scale out with more tunnels (ECMP),
  not up; **overlapping IP ranges** break routing; weak/plaintext **PSKs** and IKEv1 are security risks
  (use IKEv2 + secret manager); for sustained high throughput **Cloud Interconnect** is faster/cheaper;
  BGP mismatch (ASN, advertised ranges) is a common tunnel-up-but-no-routes failure.
- IaC/CLI: Terraform `google_compute_ha_vpn_gateway`, `google_compute_external_vpn_gateway`,
  `google_compute_vpn_tunnel`, `google_compute_router`, `google_compute_router_interface` /
  `google_compute_router_peer`. CLI `gcloud compute vpn-gateways`, `... external-vpn-gateways`,
  `... vpn-tunnels`, `gcloud compute routers` (`add-bgp-peer`, `get-status`); verify tunnel/BGP state and
  run a connectivity test across the tunnel.
