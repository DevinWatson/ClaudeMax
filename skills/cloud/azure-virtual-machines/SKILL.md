---
name: azure-virtual-machines
description: Use when designing, provisioning, securing, or operating Azure Virtual Machines — Microsoft Azure's IaaS compute for Linux and Windows VMs (Azure Virtual Machines). Covers VM sizes and series (B/D/E/F/M/N GPU families), OS and data disks (Managed Disks, Standard/Premium SSD/Ultra), images (Marketplace, custom, Shared Image Gallery), availability sets vs availability zones, proximity placement, Spot VMs and reserved instances, networking (NICs/NSGs/public IPs), boot diagnostics and extensions, Entra ID/managed identities and disk encryption, and cost. Loads the VM knowledge: pick a size and disks, choose an availability model, provision, secure, and verify the VM boots and is reachable. Consumed by the azure-virtual-machines specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Virtual Machines).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-virtual-machines, compute, iaas, vm, managed-disks]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Virtual Machines

Microsoft Azure's **IaaS compute** — on-demand Linux and Windows virtual machines with attached managed
disks, virtual NICs, and availability options, behind Azure identity, networking, and SLAs.

## Core concepts and components
- **VM size / series** — the SKU (vCPU, RAM, accelerated networking, temp disk) grouped into series:
  **B** (burstable), **D** (general purpose), **E** (memory-optimized), **F** (compute-optimized), **M**
  (large memory), **N** (GPU: NC/ND/NV). Choose by workload profile.
- **Disks (Managed Disks)** — an **OS disk** plus optional **data disks**, each a tier: **Standard HDD /
  Standard SSD / Premium SSD / Premium SSD v2 / Ultra Disk**; size drives IOPS/throughput. Ephemeral OS
  disks use local storage for stateless/cattle workloads.
- **Images** — Marketplace images, **custom images**, or versioned images from a **Shared Image
  (Compute) Gallery** for fleet consistency.
- **Availability** — **Availability Zones** (physically separate datacenters, highest SLA) vs
  **Availability Sets** (fault/update domains within a datacenter); single-instance VMs get an SLA only
  with Premium/Ultra disks.
- **Spot VMs** — deeply discounted evictable capacity for interruptible workloads; **Reserved Instances /
  Savings Plans** discount steady-state usage.
- **Networking & extensions** — NIC(s) with NSGs and optional public IP; **VM extensions** (custom
  script, monitoring agent, DSC) for bootstrap/config; boot diagnostics for serial console.

## Configuration and sizing
- Right-size the **series + size** to CPU/RAM/GPU needs; enable **accelerated networking** where
  supported. Pick **disk tiers** by IOPS/throughput and latency. Choose **zones** for HA. Use a **Shared
  Image Gallery** image for repeatable fleets. Bootstrap with **cloud-init** (Linux) or a custom-script
  extension. Decide Spot vs on-demand vs reserved per workload.

## Security and IAM
- Use **Microsoft Entra ID** for VM login (AAD login extension) and **managed identities** for the VM to
  reach other Azure services (no embedded secrets); apply least-privilege **RBAC**. Lock down NSGs;
  prefer **Azure Bastion / Just-in-Time access** over open SSH/RDP. Enable **Azure Disk Encryption** or
  platform/CMK encryption-at-host. Store secrets in **Key Vault**. Apply Defender for Servers.

## Cost levers
- Billed per **second of running compute** + provisioned disk + outbound data + public IP. Levers:
  right-size and **auto-shutdown** dev VMs; use **B-series** for bursty low-average load; **Reserved
  Instances / Savings Plans** for steady workloads; **Spot** for interruptible; deallocate (not just stop)
  to halt compute charges; choose the cheapest disk tier that meets IOPS; use ephemeral OS disks for
  stateless VMs.

## Scaling and limits
- Single VMs scale **vertically** (resize the SKU; requires a stop for some families) — for **horizontal**
  autoscale use **VM Scale Sets**. Per-region/subscription **vCPU quotas per family** gate how many you can
  run (request increases ahead of need). Disk IOPS/throughput are capped by tier+size; some sizes are
  zone- or region-restricted.

## Operating procedure
1. **Provision** — create the VM with its NIC, OS/data **disks**, **size**, image, and **zone** via
   Terraform `azurerm_linux_virtual_machine` / `azurerm_windows_virtual_machine` (+ `azurerm_network_interface`,
   `azurerm_managed_disk`) (or Bicep/`az vm create`).
2. **Configure** — attach data disks, set **accelerated networking**, apply **extensions**/cloud-init for
   bootstrap, and configure boot diagnostics.
3. **Secure** — assign a **managed identity** and least-privilege RBAC, lock down **NSGs**, enable
   Bastion/JIT, turn on **disk encryption**, and store secrets in Key Vault.
4. **Verify** — apply [[verify-by-running]]: confirm the VM is `Running` and provisioning `Succeeded`
   (`az vm show -d`), then **reach it** — SSH/RDP via Bastion or run a command in-guest
   (`az vm run-command invoke`) and confirm the OS responds and the app/port is up. Capture the power state
   and the command output.

## Inputs
The workload profile (vCPU/RAM/GPU, OS), the image source, required disks (tier/size/count), the
availability model (zone vs set vs single), Spot/reserved choice, networking (subnet/NSG/public IP), the
region, and the identity/encryption security requirements.

## Output
An Azure VM setup: a sized Linux/Windows VM with managed OS/data disks from the chosen image, placed in a
zone/availability set, networked with NSGs — secured by managed identity, RBAC, Bastion/JIT, and disk
encryption — plus verification that the VM is Running and reachable with the app responding.

## Notes
- Gotchas: a single VM has **no SLA without Premium/Ultra disks**; use **zones** (not just sets) for the
  highest SLA; **resizing** some series requires a stop/deallocate; **stopped (not deallocated)** VMs still
  bill compute; **vCPU quota is per-family per-region** and silently blocks creation; some sizes lack
  accelerated networking or are zone-restricted; data disks must be **partitioned/mounted in-guest** after
  attach. This owns **single-VM IaaS** — for horizontal autoscaling defer to **azure-vm-scale-sets**. 2nd
  consumer: the Azure role team (azure-iac-engineer / azure-cloud-architect). Cross-cloud peers: AWS EC2,
  GCP Compute Engine.
- IaC/CLI: Terraform `azurerm_linux_virtual_machine` / `azurerm_windows_virtual_machine` +
  `azurerm_managed_disk` + `azurerm_network_interface`; Bicep/ARM `Microsoft.Compute/virtualMachines`. CLI
  `az vm create` / `az vm show -d` / `az vm run-command invoke`; verify reachability via Bastion or
  run-command.
