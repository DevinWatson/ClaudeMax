---
name: gcp-cloud-interconnect
description: Use when designing, provisioning, securing, or operating Cloud Interconnect — Google Cloud's high-bandwidth, low-latency, private hybrid connectivity between an on-premises network and a VPC, via Dedicated Interconnect (direct physical connections at a colocation) or Partner Interconnect (through a supported service provider). Loads the Cloud Interconnect knowledge: choose Dedicated vs Partner and capacity, order interconnects and create VLAN attachments, attach Cloud Routers with BGP for dynamic routing, configure redundancy/SLA topologies and MACsec, plus IAM and cost/scaling levers. Consumed by the Cloud Interconnect specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they build private hybrid connectivity (Cloud Interconnect).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-interconnect, networking, hybrid, vlan-attachment, bgp, cloud-router]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Interconnect

Cloud Interconnect extends an on-premises network to Google Cloud over a **private, high-bandwidth,
low-latency** connection that bypasses the public internet, giving you RFC1918 reachability into your
VPC. It comes in two flavors with different ownership and capacity models.

## Core concepts and components
- **Dedicated Interconnect** — a **direct physical connection** between your network and Google at a
  colocation facility (10 Gbps or 100 Gbps circuits, bundled into a LAG). You own the cross-connect; best
  for high bandwidth and the strongest SLA.
- **Partner Interconnect** — connectivity **through a supported service provider** when you can't reach a
  colocation or need sub-10G capacities; the partner provides the physical link and you provision a
  partner VLAN attachment.
- **VLAN attachments (InterconnectAttachment)** — logical connections that bind an interconnect to a
  **Cloud Router** in a region/VPC; each has a capacity, a VLAN ID, and BGP peering. Cross-Cloud
  Interconnect connects GCP to another cloud.
- **Cloud Router + BGP** — exchanges routes dynamically between on-prem and the VPC; controls advertised
  ranges and route priorities (also drives Active/Active or Active/Passive failover).
- **Redundancy / SLA topologies** — pairs of interconnects across **two edge availability domains** (and
  metros) deliver the 99.9% or 99.99% SLA. **MACsec** encrypts Dedicated Interconnect at layer 2.

## Configuration and sizing
- Choose **Dedicated** (10/100G, you reach a colo) vs **Partner** (provider, flexible capacity). Size
  VLAN attachment capacity to throughput needs. For SLA, provision a **redundant pair** across two edge
  availability domains and use a **Cloud Router per region** with BGP. Plan **non-overlapping** on-prem
  and VPC IP ranges and route advertisements.

## Security and IAM
- Traffic is **private** (off the public internet) but **not encrypted by default** — add **MACsec**
  (Dedicated) or run **HA VPN over Interconnect** for encryption-in-transit requirements. Constrain BGP
  **advertised ranges** to least-needed prefixes. Grant least-privilege IAM
  (`roles/compute.networkAdmin`, interconnect/router admin). Enable logging/monitoring on routers and
  attachments; pair with VPC firewall rules to segment hybrid traffic.

## Cost levers
- Cost is the **interconnect port/circuit** (per 10/100G), **VLAN attachment capacity** (hourly), and
  **egress over Interconnect** (cheaper than internet egress). Right-size attachment capacity, share an
  interconnect across multiple VLAN attachments/VPCs, and prefer Interconnect egress over internet egress
  for steady high-volume hybrid traffic.

## Scaling and limits
- Dedicated circuits come in 10G/100G units bundled in a LAG; Partner offers granular capacities. Limits:
  VLAN attachments per interconnect/router, advertised routes via BGP (learned-route limits per Cloud
  Router), and attachments per region. The SLA requires the correct **redundant edge-availability-domain**
  topology; single attachments have no SLA.

## Operating procedure
1. **Provision** — for **Dedicated**, order the **Interconnect** (Terraform `google_compute_interconnect`)
   and complete the cross-connect at the colo; for **Partner**, request capacity from the provider. Create
   a **Cloud Router** (`google_compute_router`) in the target region.
2. **Configure** — create **VLAN attachments** (`google_compute_interconnect_attachment`, dedicated or
   partner), set capacity/VLAN, attach to the Cloud Router, and configure **BGP sessions/peers** with
   controlled advertised ranges; build a **redundant pair** across edge availability domains for SLA.
3. **Secure** — enable **MACsec** (Dedicated) or HA VPN over Interconnect for encryption, scope BGP
   advertisements, grant least-privilege IAM, and enable router/attachment logging.
4. **Verify** — apply [[verify-by-running]]: confirm the attachment is **ACTIVE** and the **BGP session is
   ESTABLISHED** with expected learned/advertised routes (`gcloud compute interconnects attachments
   describe`, `gcloud compute routers get-status`), test on-prem↔VPC reachability with a connectivity test
   / ping across the link, and confirm failover to the redundant attachment — capture attachment/BGP
   status and the reachability result.

## Inputs
Bandwidth/latency requirements, colocation reachability (Dedicated vs Partner), region footprint,
on-prem and VPC IP plan and BGP advertisement policy, SLA/redundancy target, encryption requirement
(MACsec/HA VPN over Interconnect), IAM model, and cost ceiling.

## Output
A hybrid connection (Dedicated or Partner Interconnect) with redundant VLAN attachments across edge
availability domains, Cloud Router BGP sessions with scoped advertisements, MACsec/HA-VPN encryption if
required, least-privilege IAM and router logging, plus verification of attachment/BGP status and
on-prem↔VPC reachability with failover.

## Notes
- Gotchas: a **single attachment has no SLA** — you need a redundant pair across **two edge availability
  domains** for 99.9%/99.99%; Interconnect is **private but not encrypted** by default (add MACsec or HA
  VPN over Interconnect); **overlapping IP ranges** between on-prem and VPC break routing; over-broad BGP
  advertisements can blackhole/leak routes (scope advertised ranges); Dedicated requires physical
  cross-connect provisioning lead time; Partner depends on the provider's link health.
- IaC/CLI: Terraform `google_compute_interconnect`, `google_compute_interconnect_attachment`,
  `google_compute_router`, `google_compute_router_interface` / `google_compute_router_peer` (BGP). CLI
  `gcloud compute interconnects`, `... interconnects attachments`, `gcloud compute routers` (`add-bgp-peer`,
  `get-status`); verify attachment/BGP state and run a connectivity test across the link.
