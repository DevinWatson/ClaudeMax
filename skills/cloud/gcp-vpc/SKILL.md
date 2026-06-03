---
name: gcp-vpc
description: Use when designing, provisioning, securing, or operating a Virtual Private Cloud (VPC) — Google Cloud's global software-defined network with VPC networks (auto vs custom mode), regional subnets and secondary ranges (alias IP), firewall rules and hierarchical firewall policies, routes and Cloud NAT, Private Google Access and Private Service Connect, VPC Network Peering, and Shared VPC for centralized network administration, plus IAM, flow logs, and cost/scaling levers. Loads the VPC knowledge: design networks/subnets and IP plans, write firewall rules and routes, enable private access and Shared VPC/peering, secure with IAM, and verify connectivity and rules. Consumed by the VPC specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they build the network foundation (Virtual Private Cloud (VPC)).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, vpc, networking, subnets, firewall-rules, shared-vpc, private-google-access]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Virtual Private Cloud (VPC)

Google Cloud's global, software-defined virtual network. A single VPC network spans all regions; its
**subnets are regional**, and resources across regions communicate over Google's backbone without a VPN.
The VPC is the foundation that compute, databases, and managed services attach to.

## Core concepts and components
- **VPC network (auto vs custom mode)** — **auto mode** creates a subnet per region automatically;
  **custom mode** (recommended for production) gives you full control of subnets and IP ranges.
- **Subnets / IP ranges** — **regional** subnets with a **primary** CIDR plus optional **secondary
  ranges** used by **alias IP** (e.g., GKE Pod/Service ranges). Plan non-overlapping CIDRs.
- **Firewall rules / policies** — stateful **VPC firewall rules** (ingress/egress, priority, by
  tags/service accounts) and **hierarchical firewall policies** at the org/folder level; default-deny
  ingress, default-allow egress.
- **Routes** — **system** routes (subnet + default) and **custom/static** routes; dynamic routes via
  Cloud Router (with VPN/Interconnect). **Cloud NAT** gives private instances outbound internet without
  external IPs.
- **Private access** — **Private Google Access** lets private instances reach Google APIs;
  **Private Service Connect (PSC)** and **private services access** reach Google/partner managed services
  privately.
- **Connectivity** — **VPC Network Peering** (private RFC1918 connectivity between VPCs, non-transitive)
  and **Shared VPC** (a host project shares subnets with service projects for centralized admin).

## Configuration and sizing
- Prefer **custom-mode** networks. Plan a non-overlapping **IP address scheme** (primary + secondary
  ranges sized for growth and alias IP). Choose **Shared VPC** for centralized network governance across
  projects, or **peering** for VPC-to-VPC. Add **Cloud NAT** for egress, **Private Google Access** on
  subnets, and **PSC/private services access** for managed-service connectivity.

## Security and IAM
- Use **least-privilege firewall rules** (deny-by-default ingress, scope by service account/tag, avoid
  `0.0.0.0/0` to sensitive ports) and **hierarchical policies** for org guardrails. Grant network IAM
  least-privilege (`roles/compute.networkAdmin`, `roles/compute.networkUser`,
  `roles/compute.securityAdmin`); for **Shared VPC** grant `networkUser` narrowly to service projects.
  Enable **VPC Flow Logs** and **Firewall Rules Logging**; pair with VPC-SC for data-exfiltration
  controls.

## Cost levers
- The network itself is largely free; cost comes from **network egress** (inter-region, internet,
  inter-zone), **Cloud NAT** (gateway + data processed), **external IPs**, **flow-log volume**, and
  **PSC/peering** data. Keep traffic regional, minimize external IPs (use NAT), sample flow logs, and
  consolidate networks to reduce cross-network egress.

## Scaling and limits
- A network is global and scales across regions automatically; subnet ranges can be **expanded**
  (not shrunk). Limits: routes, firewall rules, subnets, and peerings per network/project; peering is
  **non-transitive** (no chaining); secondary-range and alias-IP quotas. Raise via quota requests; design
  IP ranges with headroom since shrinking is not supported.

## Operating procedure
1. **Provision** — enable the Compute API and create the **custom-mode VPC**
   (Terraform `google_compute_network` with `auto_create_subnetworks=false`) and **subnets**
   (`google_compute_subnetwork`) with primary + secondary ranges and **Private Google Access**.
2. **Configure** — add **firewall rules** (`google_compute_firewall`) / hierarchical policies, **routes**
   and **Cloud NAT** (`google_compute_router`, `google_compute_router_nat`), set up **Shared VPC**
   (`google_compute_shared_vpc_host_project` / `..._service_project`) or **peering**
   (`google_compute_network_peering`), and **PSC/private services access** as needed.
3. **Secure** — enforce deny-by-default ingress, scope rules by SA/tag, grant network IAM
   least-privilege, enable **Flow Logs** and **Firewall Rules Logging**, and apply hierarchical policies.
4. **Verify** — apply [[verify-by-running]]: list effective rules/routes
   (`gcloud compute firewall-rules list`, `gcloud compute routes list`), run **connectivity tests**
   (`gcloud network-management connectivity-tests create/run`) between representative endpoints to
   confirm allowed/blocked paths, confirm **Cloud NAT** egress and **Private Google Access** from a
   private instance, and verify Shared-VPC/peering reachability — capture the rule/route listing and
   connectivity-test results.

## Inputs
Topology (single VPC vs Shared VPC vs peered), region footprint, IP address plan (primary + secondary
ranges, alias IP needs), egress/NAT requirements, private-access needs (Private Google Access/PSC),
firewall/segmentation policy, IAM model, logging requirements, and cost ceiling.

## Output
A VPC network foundation (custom-mode network, regional subnets with primary/secondary ranges,
least-privilege firewall rules/policies, routes + Cloud NAT, Private Google Access/PSC, Shared VPC or
peering) with network IAM, flow/firewall logging, plus verification of effective rules/routes and
connectivity tests.

## Notes
- Gotchas: subnet ranges can grow but **cannot shrink** — plan IP space with headroom and avoid overlaps
  (overlaps block peering/VPN); **peering is non-transitive** (spoke-to-spoke needs hub routing/NCC);
  default ingress is deny and egress is allow — open egress can leak data (tighten + VPC-SC); auto-mode
  networks are convenient but discouraged for production; Cloud NAT and egress are the real cost drivers;
  Shared VPC requires correct host/service-project `networkUser` grants.
- IaC/CLI: Terraform `google_compute_network`, `google_compute_subnetwork`, `google_compute_firewall`,
  `google_compute_route`, `google_compute_router`, `google_compute_router_nat`,
  `google_compute_network_peering`, `google_compute_shared_vpc_host_project` /
  `google_compute_shared_vpc_service_project`, plus `google_project_service`. CLI `gcloud compute networks`,
  `... networks subnets`, `... firewall-rules`, `... routers`, and `gcloud network-management
  connectivity-tests` for path verification.
