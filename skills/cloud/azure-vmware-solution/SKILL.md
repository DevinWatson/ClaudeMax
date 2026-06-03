---
name: azure-vmware-solution
description: Use when designing, provisioning, securing, or operating Azure VMware Solution (AVS) — Microsoft Azure's service for running native VMware vSphere private clouds on dedicated bare-metal Azure infrastructure (Azure VMware Solution). Covers AVS private clouds and clusters on dedicated hosts, the full VMware stack (vCenter, ESXi, vSAN storage, NSX-T networking, HCX migration), node/host SKUs and cluster scaling, ExpressRoute connectivity (Global Reach and to Azure VNets), segments and NSX-T gateway firewall/DNS, vSAN encryption and identity (vCenter/NSX local + Entra ID for the Azure resource), stretched clusters and customer-managed keys, and cost. Loads the AVS knowledge: provision a private cloud, configure networking and connectivity, secure, and verify vCenter and a workload VM. Consumed by the azure-vmware-solution specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure VMware Solution).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-vmware-solution, compute, vmware, vsphere, private-cloud]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure VMware Solution

Microsoft Azure's service for running **native VMware vSphere private clouds** on **dedicated, bare-metal
Azure hosts** — lift-and-shift VMware workloads into Azure unchanged, with the full vSphere/vSAN/NSX-T
stack managed alongside Azure networking and identity.

## Core concepts and components
- **Private cloud** — the AVS resource: one or more **clusters** of **dedicated bare-metal hosts** running
  the VMware stack, provisioned and managed as an Azure resource.
- **VMware stack** — managed **vCenter Server** (VM management), **ESXi** hosts (hypervisor), **vSAN**
  (hyperconverged storage from local NVMe), and **NSX-T** (software-defined networking/firewalling); you
  operate workloads through native VMware tools.
- **Host SKUs / clusters** — node types (e.g. AV36 / AV36P / AV52 / AV64) defining CPU/RAM/storage per
  host; scale by adding hosts to a cluster or adding clusters (min host counts apply).
- **HCX** — VMware migration/mobility platform for bulk and live (vMotion) migration from on-prem to AVS.
- **Connectivity** — built-in **ExpressRoute** circuit connects the private cloud to **Azure VNets**;
  **ExpressRoute Global Reach** links it to on-prem ExpressRoute; managed via an ExpressRoute gateway.
- **NSX-T networking** — **segments** (logical L2 networks), **tier-0/tier-1 gateways**, distributed
  firewall and gateway firewall, DHCP/DNS for workload VMs.
- **Resilience** — **stretched clusters** (across two AZs with witness) for higher availability;
  customer-managed keys for vSAN.

## Configuration and sizing
- Size the **host SKU** and **host count per cluster** for the vCPU/RAM/vSAN-storage footprint (mind the
  vSAN slack/FTT overhead). Plan **NSX-T segments** and gateway routing. Provision **ExpressRoute** to your
  VNets and **Global Reach** to on-prem. Deploy **HCX** for migration. Choose a **stretched cluster** for
  cross-AZ HA where supported.

## Security and IAM
- Two identity planes: **Azure RBAC** governs the AVS resource (scale/connectivity) via **Entra ID**;
  **vCenter and NSX-T** have their own local admin accounts (rotate the cloudadmin credentials, integrate
  with AD/LDAP). Segment workloads with the **NSX-T distributed/gateway firewall**. Encrypt **vSAN** (data
  at rest) and enable **customer-managed keys** if required. Front management with Azure Bastion/jumpbox;
  avoid exposing vCenter/NSX publicly.

## Cost levers
- Billed primarily per **dedicated host per hour** (the largest cost) + ExpressRoute + egress. Levers:
  **right-size host count** (you pay for whole hosts, not VMs) and reclaim slack; use **Reserved Instances
  (1/3-year)** for steady footprints (large discount); consolidate workloads to fewer hosts; scale clusters
  down when capacity frees up; avoid over-provisioning stretched clusters unless HA requires it.

## Scaling and limits
- Scale by **adding/removing hosts** (minimum hosts per cluster, e.g. 3) or **adding clusters**; capacity
  is whole-host granular. **Host availability per region/SKU is constrained** — request/quota ahead of
  need. vSAN usable capacity is reduced by **FTT/slack** overhead. ExpressRoute bandwidth and Global Reach
  have their own limits.

## Operating procedure
1. **Provision** — create the **private cloud** with its initial **cluster**, host SKU, and host count via
   Terraform `azurerm_vmware_private_cloud` (+ `azurerm_vmware_cluster`) (or Bicep/`az vmware private-cloud
   create`).
2. **Configure** — set up **ExpressRoute** connectivity to Azure VNets and **Global Reach** to on-prem,
   define **NSX-T segments/gateways/firewall** and DNS/DHCP, and deploy **HCX** for migration; create
   workload VMs/clusters via vCenter.
3. **Secure** — apply **Azure RBAC** on the resource, rotate/integrate **vCenter & NSX-T** credentials,
   segment with the **NSX-T firewall**, enable **vSAN encryption / CMK**, and restrict management access.
4. **Verify** — apply [[verify-by-running]]: confirm the private cloud is provisioned and the cluster hosts
   are healthy (`az vmware private-cloud show`, `az vmware cluster show`), reach **vCenter** through the
   ExpressRoute path, and bring up a **test workload VM** on an NSX-T segment and confirm it gets an IP and
   is reachable. Capture the cluster health and the workload reachability.

## Inputs
The VMware workload footprint (vCPU/RAM/storage, host SKU and count), connectivity needs (ExpressRoute to
VNets, Global Reach to on-prem), NSX-T network/segment design, migration approach (HCX), HA needs
(stretched cluster), encryption/CMK requirements, the region, and the identity/RBAC requirements.

## Output
An Azure VMware Solution setup: a private cloud with sized cluster(s) of dedicated hosts running vCenter/
vSAN/NSX-T, ExpressRoute connectivity to VNets and on-prem, NSX-T segments/firewall, optional HCX and
stretched cluster — secured by Azure RBAC, rotated vCenter/NSX credentials, NSX firewall, and vSAN
encryption — plus verification that vCenter is reachable and a workload VM runs.

## Notes
- Gotchas: you pay for **whole dedicated hosts**, not per-VM — right-sizing host count is the main cost
  lever; **vSAN usable capacity** is far below raw due to FTT/slack; **host SKU availability is region-
  constrained** — confirm and reserve quota early; there are **two identity planes** (Azure RBAC vs
  vCenter/NSX local) — securing one does not secure the other; **ExpressRoute Global Reach** must be wired
  for on-prem connectivity; cluster scale-down requires data evacuation. This owns **VMware private clouds
  on Azure** — for native Azure IaaS VMs defer to **azure-virtual-machines**. 2nd consumer: the Azure role
  team (azure-iac-engineer / azure-cloud-architect). Cross-cloud peer: GCP VMware Engine.
- IaC/CLI: Terraform `azurerm_vmware_private_cloud` + `azurerm_vmware_cluster`
  (+ `azurerm_vmware_express_route_authorization`); Bicep/ARM `Microsoft.AVS/privateClouds` (+ `/clusters`).
  CLI `az vmware private-cloud create` / `... show` / `az vmware cluster show`; verify by reaching vCenter
  over ExpressRoute and bringing up a workload VM.
