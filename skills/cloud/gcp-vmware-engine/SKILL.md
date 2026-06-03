---
name: gcp-vmware-engine
description: Use when designing, provisioning, securing, or operating Google Cloud VMware Engine (GCVE) — a fully managed VMware SDDC (vSphere, vCenter, vSAN, NSX-T, HCX) running on dedicated bare-metal nodes in Google Cloud: private clouds + clusters, node types (e.g. ve1/ve2 standard, storage-optimized), cluster sizing + autoscale + node add/remove, NSX-T networking + the VMware Engine network / VPC peering + Private Service Access to Google services, HCX for workload migration from on-prem vSphere, vSAN storage policies, and IAM/private connectivity. Loads the GCVE knowledge: provision a private cloud + cluster, wire NSX-T + VPC peering, migrate VMs via HCX, and verify vCenter reachability + VM health. Consumed by the VMware Engine specialist and by the GCP role team (gcp-cloud-architect / gcp-iac-engineer) when they run managed VMware (VMware Engine).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, vmware-engine, gcve, vmware, sddc, nsx-t, hcx, compute]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Google Cloud VMware Engine (GCVE)

A fully managed **VMware SDDC** running on dedicated **bare-metal** nodes inside Google Cloud. You get
native **vSphere / vCenter / vSAN / NSX-T / HCX** — run existing VMware workloads unchanged while Google
operates the hardware and software-defined stack. Ideal for lift-and-shift of VMware estates without
refactoring.

## Core concepts and components
- **Private cloud** — an isolated VMware **SDDC** (vCenter + NSX-T + vSAN) in a region, built from one or
  more **clusters**.
- **Clusters + node types** — clusters are groups of identical **bare-metal nodes** (e.g. **ve1/ve2**
  standard high-density, plus storage-optimized variants); add/remove nodes to scale CPU/RAM/vSAN capacity
  (autoscale policies available). Minimum node counts apply per cluster.
- **NSX-T networking** — software-defined networking (segments, gateways, firewall, load balancing) inside
  the SDDC; the **VMware Engine network** peers to your **VPC** and reaches Google services via **Private
  Service Access**.
- **vSAN storage** — distributed storage from the nodes' local disks, governed by **storage policies**
  (FTT/RAID); capacity scales with node count or storage-optimized nodes.
- **HCX** — VMware's migration/interconnect suite for moving workloads from **on-prem vSphere** to GCVE
  (bulk migration, vMotion, network extension) with minimal downtime.
- **Access + identity** — Google IAM gates the GCVE resources; inside the SDDC you use **vCenter/NSX-T
  credentials**; connectivity is private (no public vCenter by default).

## Configuration and sizing
- Pick the **node type** (compute-dense vs storage-optimized) and **cluster size** to meet CPU/RAM/vSAN
  needs (respect cluster **minimum node counts**), choose the **region**, plan the **VMware Engine network
  + VPC peering** CIDRs and **Private Service Access**, and set **vSAN storage policies** (FTT) for
  resilience vs usable capacity.

## Security and IAM
- Google IAM controls private-cloud lifecycle (VMware Engine roles); inside, secure **vCenter/NSX-T**
  (least-privilege roles, MFA), use **NSX-T firewall** + segments for east-west isolation, keep access
  **private** (VPN/Interconnect, no public vCenter), encrypt vSAN, and audit via Cloud Audit Logs + vCenter
  logs. Rotate the management credentials.

## Cost levers
- Billed primarily per **bare-metal node-hour** (the dominant cost) plus egress. Levers: right-size
  **cluster node count** (and shrink when idle), pick **storage-optimized nodes** when vSAN-bound rather
  than adding compute nodes, use **committed-use discounts** for steady estates, and tune **vSAN storage
  policies** (lower FTT = more usable capacity per node). Avoid overprovisioning above minimums.

## Scaling and limits
- Scale by **adding/removing nodes** (autoscale on CPU/storage thresholds available); scaling is at
  node granularity, not per-VM. Watch **per-cluster minimum/maximum node counts**, vSAN capacity headroom
  (slack space for rebuilds), regional node availability/quota, and NSX-T/VPC CIDR planning (hard to change).

## Operating procedure
1. **Provision** — enable the API (`gcloud services enable vmwareengine.googleapis.com`), create a
   **private cloud** with a management **cluster** of the chosen **node type/size** in the region
   (Terraform `google_vmwareengine_private_cloud` / `google_vmwareengine_cluster`,
   `google_project_service`).
2. **Configure** — set up the **VMware Engine network** + **VPC peering** + **Private Service Access**,
   configure **NSX-T** (segments, gateway, firewall), set **vSAN storage policies**, and obtain
   **vCenter/NSX-T** credentials.
3. **Secure + migrate** — least-privilege Google IAM + vCenter/NSX-T roles, private connectivity only,
   NSX-T firewall isolation, vSAN encryption; deploy **HCX** and migrate on-prem VMware workloads.
4. **Verify** — apply [[verify-by-running]]: confirm the private cloud + cluster report **ACTIVE**
   (`gcloud vmware private-clouds describe` / `... clusters list`), **vCenter/NSX-T are reachable** over the
   private network, a migrated VM **powers on and is reachable** through NSX-T, and vSAN reports healthy
   capacity. Capture the private-cloud state and the vCenter/VM reachability check.

## Inputs
Node type + cluster size (respecting minimums), region, VMware Engine network + VPC peering + PSA CIDR
plan, NSX-T network design, vSAN storage policies, HCX migration plan, and Google IAM + vCenter/NSX-T
access scope.

## Output
A GCVE deployment (private cloud + cluster of sized nodes, NSX-T networking + VPC peering + PSA, vSAN
storage policies, HCX migration, least-privilege IAM/vCenter access) plus verification that the private
cloud is ACTIVE, vCenter/NSX-T are reachable, and migrated VMs power on and are reachable.

## Notes
- Gotchas: billed by **bare-metal node** (expensive — right-size and respect cluster **minimum node
  counts**); **CIDR planning** for the VMware Engine network / VPC peering / NSX-T is hard to change later;
  vSAN needs **slack capacity** for rebuilds; **vCenter is private** — plan VPN/Interconnect access; scaling
  is **per node**, not per VM. Pick **GCVE** to run VMware **unchanged** vs **Migrate to VMs** (convert to
  native Compute Engine, gcp-migrate-to-vms) or **Migrate to Containers** (modernize to GKE/Cloud Run). AWS
  analog is VMware Cloud on AWS; the Azure equivalent is **Azure VMware Solution**.
- IaC/CLI: Terraform `google_vmwareengine_private_cloud`, `google_vmwareengine_cluster`,
  `google_vmwareengine_network`, `google_vmwareengine_network_peering`, `google_project_service`. CLI
  `gcloud vmware private-clouds create / describe`, `gcloud vmware clusters create / list`; HCX + NSX-T are
  driven via their own consoles/APIs.
