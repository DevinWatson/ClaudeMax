---
name: azure-dedicated-host
description: Use when designing, provisioning, securing, or operating Azure Dedicated Host — single-tenant physical servers dedicated to one Azure subscription for VM placement, used for compliance, licensing (Bring-Your-Own-License / Azure Hybrid Benefit), and host-level isolation/control (Azure Dedicated Host). Covers host groups, host SKUs/families (Dsv3/Esv3/Fsv2 etc.), availability-zone placement, fault domains, host-level maintenance control, automatic vs manual VM placement, capacity reservations, and the relationship to Azure Virtual Machines that run on the host. Loads the knowledge: choose a host SKU and group, place hosts in zones/fault domains, provision, secure, and verify hosts are allocated and VMs land on them. Consumed by the azure-dedicated-host specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Dedicated Host).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-dedicated-host, compute, dedicated-hardware, isolation, byol]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Dedicated Host

Single-tenant **physical servers** dedicated to one subscription. You provision the host hardware, then
place Azure VMs onto it — giving host-level isolation, control over maintenance timing, and
hardware-bound licensing. The VMs themselves are still Azure Virtual Machines.

## Core concepts and components
- **Dedicated Host** — a physical server allocated to your subscription. Sized by a **host SKU** that ties
  a **VM family + hardware generation** (e.g. `DSv3-Type3`, `ESv3-Type4`, `FSv2-Type4`), which determines
  how many and which VM sizes can pack onto it.
- **Host group** — a logical container for hosts; set at create time with an **availability zone** and a
  **fault domain count** (1-3). Optionally **automatic placement** so VMs without an explicit host land on
  available hosts in the group.
- **VM placement** — VMs are assigned to a specific host (manual) or auto-placed into the group; capacity
  is bounded by the host's available vCPUs/cores for the SKU's family.
- **Maintenance control** — defer and self-schedule platform maintenance via a maintenance configuration,
  so host reboots/updates happen in your window.
- **Licensing** — **Azure Hybrid Benefit** and per-core **BYOL** (Windows Server / SQL Server) are
  host-bound, which is a primary reason to use Dedicated Host.

## Configuration and sizing
- Pick the **host SKU** from the VM family your workload needs (the host only accepts VM sizes from that
  family). Right-size the **host group**: choose a **zone** and **fault domain count** for resilience, and
  enable **automatic placement** unless you need pinned VMs. Size host count to fit your VM cores plus
  headroom. Reserve capacity with **capacity reservations** if you must guarantee future placement.

## Security and IAM
- Control host/group lifecycle with least-privilege **RBAC** scoped to the resource group. VMs on the host
  use **Microsoft Entra ID** login and **managed identities** like any VM; the host adds **physical
  isolation** for compliance. Combine with NSGs, Key Vault for secrets, and encryption-at-host. Use Azure
  Policy to enforce that regulated VMs deploy only onto dedicated hosts.

## Cost levers
- Billed **per host, per second, while allocated** — independent of how many VMs run on it (VMs incur no
  separate compute charge). Levers: **pack VMs densely** to amortize the host; use **Azure Hybrid
  Benefit/BYOL** to cut Windows/SQL licensing; buy a **Reserved Instance / Savings Plan** for the host for
  steady use; deallocate/delete idle hosts (an empty allocated host still bills).

## Scaling and limits
- Scale by adding **more hosts to the group** (no autoscale — host count is explicit). A host's capacity is
  fixed by its SKU's cores; oversubscription is not allowed. Per-region/subscription **dedicated-host vCPU
  quota per family** gates allocation. Fault domain count is fixed at host-group creation. Some host SKUs
  are zone- or region-restricted.

## Operating procedure
1. **Provision** — create the **host group** (zone + fault domain count + auto-placement) then the
   **dedicated host** (SKU) via Terraform `azurerm_dedicated_host_group` + `azurerm_dedicated_host` (or
   Bicep `Microsoft.Compute/hostGroups` + `/hosts`, or `az vm host group create` / `az vm host create`).
2. **Configure** — set automatic placement, attach a **maintenance configuration** for self-scheduled
   maintenance, and provision VMs onto the host (`azurerm_linux_virtual_machine` with `dedicated_host_id`
   or `dedicated_host_group_id`).
3. **Secure** — scope **RBAC**, apply **Azure Policy** to force regulated VMs onto the host, and secure the
   VMs (managed identity, NSGs, encryption-at-host, Key Vault).
4. **Verify** — apply [[verify-by-running]]: confirm the host is allocated and `provisioningState`
   `Succeeded` (`az vm host show`), then confirm **VMs landed on the host** (check `az vm host show
   --instance-view` for placed VM IDs / available capacity) and that a placed VM is `Running`. Capture host
   state and the placed-VM list.

## Inputs
The VM family/sizes to host, required host count and density, the **zone** and **fault domain** resilience
target, licensing model (Hybrid Benefit/BYOL), the region, maintenance-window needs, and the
compliance/isolation requirement driving dedicated hardware.

## Output
An Azure Dedicated Host setup: a host group (zoned, fault-domained, placement-configured) with one or more
hosts of the chosen SKU, VMs placed onto them, secured by RBAC/Policy and host isolation — plus
verification that hosts are allocated and VMs are placed and running.

## Notes
- Gotchas: an **empty allocated host still bills** the full host price; a host only accepts VM sizes from
  **its SKU's family**; **fault domain count and zone are immutable** after host-group creation; **dedicated
  host quota is per-family per-region** and separate from regular VM quota; VMs already running cannot always
  be moved onto a host without stop/redeploy. This owns the **dedicated hardware/host layer** — for the VMs
  themselves cross-ref **azure-virtual-machines**. 2nd consumer: the Azure role team (azure-iac-engineer /
  azure-cloud-architect). Cross-cloud peers: AWS EC2 Dedicated Hosts, GCP sole-tenant nodes.
- IaC/CLI: Terraform `azurerm_dedicated_host_group` + `azurerm_dedicated_host` (VMs via
  `azurerm_linux_virtual_machine`/`azurerm_windows_virtual_machine` `dedicated_host_id`); Bicep/ARM
  `Microsoft.Compute/hostGroups` + `Microsoft.Compute/hostGroups/hosts`. CLI `az vm host group create` /
  `az vm host create` / `az vm host show --instance-view`.
