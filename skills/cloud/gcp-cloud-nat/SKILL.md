---
name: gcp-cloud-nat
description: Use when designing, provisioning, securing, or operating Cloud NAT — Google Cloud's distributed, software-defined managed network address translation that gives instances and resources without external IPs outbound internet (and some Google API) connectivity without exposing them to inbound connections. Loads the Cloud NAT knowledge: attach a NAT gateway to a Cloud Router per region/VPC, choose subnets/ranges to NAT, manage NAT IP allocation (auto vs manual) and static vs dynamic port allocation, tune timeouts and per-VM port limits, enable endpoint-independent mapping and logging, plus IAM and cost/scaling levers. Consumed by the Cloud NAT specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they enable private-instance egress (Cloud NAT).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-nat, networking, egress, nat-gateway, cloud-router, port-allocation]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud NAT

Cloud NAT is a fully managed, **distributed** (no proxy VM, no single bottleneck) network address
translation service. It lets instances **without external IPs** make outbound connections to the
internet (and certain Google APIs) while remaining unreachable from inbound connections, providing
secure egress for private workloads.

## Core concepts and components
- **NAT gateway on a Cloud Router** — Cloud NAT is configured as a NAT entry on a **Cloud Router**, scoped
  to a **region** and **VPC**; the router is the control-plane object (no data-plane VM).
- **Subnet/range selection** — choose which **subnetworks and IP ranges** (primary and/or secondary) are
  allowed to use the NAT (all subnets, a list, or specific secondary ranges for alias IP).
- **NAT IP allocation** — **automatic** (Google allocates/scales external IPs) or **manual** (you reserve
  static IPs for allowlisting at destinations).
- **Port allocation** — **static** per-VM port allocation (`minPortsPerVm`) vs **dynamic** port
  allocation (scales ports per VM between a min/max). Each NAT IP provides ~64K ports shared across VMs.
- **Timeouts & mappings** — TCP established/transitory, UDP, and ICMP **timeouts**; **endpoint-independent
  mapping** (EIM) for protocols needing consistent source mapping. **NAT logging** records
  translations/errors (including dropped due to port exhaustion).

## Configuration and sizing
- Size **ports per VM** and **NAT IP count** to expected concurrent connections (ports/VM × VMs ≤ IPs ×
  ~64K). Use **dynamic port allocation** for bursty workloads, **static** + **manual NAT IPs** when
  destinations require IP allowlisting. Pick which subnets/ranges to NAT (avoid NATing ranges that have
  their own external IPs). Tune timeouts to free ports faster for short-lived connections.

## Security and IAM
- Cloud NAT enables **outbound only** — it never permits inbound connections, keeping instances private.
  Pair with **least-privilege egress firewall rules** to restrict destinations and **Private Google
  Access** so Google-API traffic avoids NAT where possible. Grant least-privilege IAM
  (`roles/compute.networkAdmin`). Enable **NAT logging** (errors and/or translations) for audit and
  port-exhaustion detection; use **manual static NAT IPs** for partner allowlisting.

## Cost levers
- Cost is **NAT gateway uptime** plus **data processed** through NAT and reserved **external IP** charges.
  Reduce NAT data by using **Private Google Access** (Google APIs don't traverse NAT), restricting which
  subnets/ranges NAT, releasing unused reserved IPs, and keeping egress destinations minimal.

## Scaling and limits
- Cloud NAT scales horizontally with no single VM bottleneck. The hard constraint is **port exhaustion**:
  ports/VM × number of VMs must fit within NAT-IP capacity (~64K ports per IP × IP count); high
  fan-out-to-same-destination workloads exhaust ports fastest. Use dynamic allocation and add NAT IPs as
  VM count grows. One NAT config is per region per VPC.

## Operating procedure
1. **Provision** — ensure a **Cloud Router** exists in the region (Terraform `google_compute_router`),
   then create the **Cloud NAT** (`google_compute_router_nat`) on it.
2. **Configure** — select **subnets/ranges to NAT**, set **NAT IP allocation** (auto or manual reserved
   IPs), choose **port allocation** (static `min_ports_per_vm` or `enable_dynamic_port_allocation`), tune
   **timeouts** and **endpoint-independent mapping**.
3. **Secure** — keep it egress-only, add least-privilege **egress firewall rules**, enable **Private
   Google Access** on subnets, grant least-privilege IAM, and enable **NAT logging** (errors/translations).
4. **Verify** — apply [[verify-by-running]]: from a **private instance** (no external IP) confirm outbound
   egress works and the source IP is a NAT IP (`curl ifconfig.me` / check egress IP), confirm no inbound
   reachability, inspect **NAT logs/metrics** for **dropped/port-exhaustion** events
   (`gcloud compute routers get-nat-mapping-info`, monitoring), and confirm Private Google Access bypass —
   capture the egress check and NAT status/metrics.

## Inputs
VPC/region and subnets-ranges needing egress, expected concurrent connections per VM and destination
fan-out, NAT IP strategy (auto vs manual/static for allowlisting), port-allocation mode, timeout tuning,
logging requirements, IAM model, and cost target.

## Output
A Cloud NAT gateway on a Cloud Router (selected subnets/ranges, NAT IP allocation, static/dynamic port
allocation, tuned timeouts) with egress-only posture, least-privilege egress firewall rules, Private
Google Access, least-privilege IAM and NAT logging, plus verification of private-instance egress and
port-exhaustion-free operation.

## Notes
- Gotchas: **port exhaustion** is the top failure — size ports/VM and NAT IP count to concurrent
  connections (especially high fan-out to one destination) and watch NAT logs for drops; Cloud NAT is
  **egress-only** and never replaces a load balancer for inbound; instances with their **own external IP**
  bypass NAT; **Private Google Access** lets Google-API traffic skip NAT (cheaper, fewer ports); NAT is
  **per region per VPC** so multi-region needs multiple configs; manual NAT IPs are required if a
  destination allowlists source IPs.
- IaC/CLI: Terraform `google_compute_router`, `google_compute_router_nat` (`nat_ip_allocate_option`,
  `source_subnetwork_ip_ranges_to_nat`, `min_ports_per_vm` / `enable_dynamic_port_allocation`,
  `log_config`), `google_compute_address` for manual IPs. CLI `gcloud compute routers nats` (create/update),
  `gcloud compute routers get-nat-mapping-info`, and monitoring for port-usage/dropped metrics.
