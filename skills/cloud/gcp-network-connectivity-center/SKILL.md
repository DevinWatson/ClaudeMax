---
name: gcp-network-connectivity-center
description: Use when designing, provisioning, securing, or operating Network Connectivity Center (NCC) — Google Cloud's hub-and-spoke connectivity management plane that uses Google's backbone as the transit network to interconnect VPCs and hybrid sites. Covers the Hub resource and spoke types (VPC spokes for VPC-to-VPC transitivity, hybrid spokes over HA VPN / Interconnect VLAN attachments / Router Appliances, and producer/PSC spokes), spoke acceptance/auto-accept and topology (mesh vs star with center groups), route exchange and dynamic routing via Cloud Router, plus IAM, logging, cost, and scaling/limits. Loads the NCC knowledge: create a hub, attach VPC/hybrid spokes, manage route exchange and topology, and verify spoke-to-spoke reachability. Consumed by the NCC specialist and by the GCP role team (gcp-networking-engineer / gcp-iac-engineer) when building enterprise WAN/transit topologies (Network Connectivity Center).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, network-connectivity-center, networking, hub-and-spoke, transit, hybrid-connectivity]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Network Connectivity Center

Google Cloud's **hub-and-spoke** connectivity orchestration. NCC uses Google's global **backbone as the
transit network**: you create a central **Hub** and attach **spokes** (VPCs and hybrid sites), and NCC
manages route exchange so spokes can reach one another — giving **VPC-to-VPC transitivity** (which raw
VPC peering does not) and a single place to manage enterprise WAN/transit topology.

## Core concepts and components
- **Hub** — the global resource that represents the transit fabric; spokes attach to it and exchange
  routes through it.
- **VPC spokes** — attach VPC networks directly to the hub for **transitive** VPC-to-VPC connectivity
  across projects/regions (subject to route-exchange rules).
- **Hybrid spokes** — connect on-prem/other clouds via **HA VPN tunnels**, **Interconnect VLAN
  attachments**, or **Router Appliance** VMs (third-party SD-WAN/NVA), with dynamic routing through
  **Cloud Router**.
- **Producer / PSC spokes** — connect producer networks / Private Service Connect endpoints into the hub.
- **Topology** — **mesh** (all spokes reach all spokes) or **star** with **center groups** (spokes reach a
  central group but not each other) to enforce hub-routed segmentation.
- **Spoke acceptance** — spokes can require **explicit acceptance** (or auto-accept) when they live in
  different projects/admins, controlling who can join the hub.

## Configuration and sizing
- Create one **hub** per transit domain. Attach **VPC spokes** for transitive VPC interconnect and
  **hybrid spokes** for on-prem/other-cloud reach. Choose **mesh** for full reachability or **star/center
  groups** for segmentation. Pair hybrid spokes with **redundant** VPN tunnels / VLAN attachments and a
  Cloud Router per region. Plan **non-overlapping CIDRs** across all spokes (overlaps break route exchange).

## Security and IAM
- Use **spoke acceptance** to gate cross-project/cross-admin joins. Grant least-privilege IAM
  (`roles/networkconnectivity.hubAdmin`, `roles/networkconnectivity.spokeAdmin`/groupUser) narrowly.
  Combine **star topology / center groups** to prevent unwanted spoke-to-spoke lateral traffic. Enforce
  firewall rules per VPC spoke and pair with VPC-SC; enable VPN/Interconnect/router logging.

## Cost levers
- NCC's data path rides the **backbone**: cost comes from **inter-region/inter-spoke egress**, the
  underlying **VPN tunnels / Interconnect attachments / Router Appliance VMs**, and per-spoke charges.
  Keep traffic regional where possible, right-size attachments, and prefer mesh only where transitivity is
  actually needed.

## Scaling and limits
- Limits on **spokes per hub**, **VPC spokes**, prefixes/routes exchanged, and Router Appliance
  throughput. Route-exchange and dynamic-route quotas (via Cloud Router) cap large topologies — summarize
  prefixes. NCC removes the **non-transitive** limitation of raw VPC peering, but you must still keep CIDRs
  unique and respect per-hub route limits.

## Operating procedure
1. **Provision** — enable the Network Connectivity API and create the **Hub**
   (Terraform `google_network_connectivity_hub`).
2. **Configure** — attach **VPC spokes** (`google_network_connectivity_spoke` with
   `linked_vpc_network`) and **hybrid spokes** (`linked_vpn_tunnels` /
   `linked_interconnect_attachments` / `linked_router_appliance_instances`), set **topology** (mesh vs
   star/center groups), and wire dynamic routing via Cloud Router for hybrid spokes.
3. **Secure** — require **spoke acceptance** for cross-project joins, apply star/center-group segmentation,
   enforce per-VPC firewall rules, grant hub/spoke IAM least-privilege, and enable logging.
4. **Verify** — apply [[verify-by-running]]: confirm spokes are **ACTIVE/accepted** and routes are
   exchanged (`gcloud network-connectivity hubs/spokes describe`, `gcloud compute routes list`), then run
   `gcloud network-management connectivity-tests` for representative **spoke-to-spoke** and
   **spoke-to-on-prem** paths to confirm allowed/blocked reachability — capture spoke/route status and the
   connectivity-test results.

## Inputs
Transit topology (which VPCs and hybrid sites to interconnect), reachability model (mesh vs star/center
groups), spoke types (VPC / HA VPN / Interconnect / Router Appliance / PSC), CIDR plan (non-overlapping),
cross-project ownership and acceptance policy, redundancy requirements, IAM model, logging, and cost ceiling.

## Output
An NCC topology (hub with VPC and hybrid spokes, chosen mesh/star segmentation, dynamic routing via Cloud
Router, spoke-acceptance policy) with least-privilege hub/spoke IAM and logging, plus verification of spoke
acceptance, exchanged routes, and spoke-to-spoke / spoke-to-on-prem connectivity tests.

## Notes
- Gotchas: NCC gives **transitivity** that VPC peering lacks, but **overlapping CIDRs** across spokes still
  break route exchange (plan unique ranges); **star/center-group** topology is the lever to stop unwanted
  spoke-to-spoke traffic — mesh exposes everything; cross-project spokes need **acceptance** or they will
  not join; route/prefix **quotas** cap large hubs (summarize on-prem prefixes); hybrid spokes still depend
  on a healthy **Cloud Router** + redundant tunnels/attachments.
- IaC/CLI: Terraform `google_network_connectivity_hub`, `google_network_connectivity_spoke`
  (`linked_vpc_network` / `linked_vpn_tunnels` / `linked_interconnect_attachments` /
  `linked_router_appliance_instances`), plus `google_project_service` (networkconnectivity). CLI
  `gcloud network-connectivity hubs`, `... spokes`, and `gcloud network-management connectivity-tests` for
  reachability verification.
