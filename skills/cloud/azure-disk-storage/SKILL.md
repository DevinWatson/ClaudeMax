---
name: azure-disk-storage
description: Use when designing, provisioning, securing, or operating Azure Disk Storage — Azure managed disks attached as block storage to virtual machines (Azure Disk Storage). Covers disk types (Ultra Disk, Premium SSD v2, Premium SSD, Standard SSD, Standard HDD), performance tiers and provisioned IOPS/throughput, bursting, disk sizing and resize, snapshots and images, incremental snapshots, shared disks, host caching, zone-redundant (ZRS) disks, server-side encryption with platform or customer-managed keys, Azure Disk Encryption (in-guest), and disk-access private endpoints. Loads the knowledge: pick a disk type and size, configure performance/snapshots/encryption, provision, attach, secure, and verify the disk is attached and readable/writable. Consumed by the azure-disk-storage specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Disk Storage).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-disk-storage, storage, managed-disks, block-storage, snapshots]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Disk Storage

Azure **managed disks** — durable **block storage** attached to virtual machines as OS and data disks. Azure
manages placement, replication, and durability; you own the **disk type/size**, **performance**,
**snapshots**, **encryption**, and **attachment**. This skill owns the **managed-service layer** for block
storage and is the natural companion to azure-virtual-machines (which owns the compute).

## Core concepts and components
- **Disk types** — **Ultra Disk** (highest, independently tunable IOPS/throughput, sub-ms latency, data
  disks only), **Premium SSD v2** (flexible perf decoupled from size, modern default for performance),
  **Premium SSD** (production, perf scales with size tier P*), **Standard SSD** (light/dev), **Standard
  HDD** (cheap/cold/backup). OS + data disks.
- **Performance** — IOPS and throughput by type/size; **Premium SSD** supports **bursting** (on-demand or
  credit-based); Ultra/Premium SSD v2 let you set IOPS/throughput independently of capacity.
- **Host caching** — `ReadOnly`/`ReadWrite`/`None` cache on the VM host tunes effective performance per disk
  role (OS vs data vs logs).
- **Snapshots & images** — point-in-time **snapshots** (full or **incremental**, cost-efficient) for backup/
  clone; **managed images** capture a generalized VM.
- **Shared disks** — attach one disk to multiple VMs for clustered apps (SCSI PR); Premium/Ultra.
- **Redundancy** — **LRS** (default) or **ZRS** (zone-redundant) managed disks for resilience to a zonal
  outage.
- **Resize** — grow disks online (most types); shrinking is not supported.

## Configuration and sizing
- Pick a **disk type** by latency/IOPS/throughput need (Ultra/Premium SSD v2 for demanding, Premium SSD for
  general production, Standard SSD/HDD for light/cold), **size** for capacity and (for tiered types)
  performance, set **provisioned IOPS/throughput** (Ultra/Premium SSD v2), configure **host caching** per
  role, choose **LRS vs ZRS**, and set up **incremental snapshots** for backup. Use **shared disks** for
  clustering only when required.

## Security and IAM
- Manage disks/snapshots with **Azure RBAC**; use **managed identities** for automation. Encryption at rest
  is always on — choose **platform-managed keys** or **customer-managed keys (CMK)** via a **disk encryption
  set** (Key Vault), or **double encryption**; use **Azure Disk Encryption (ADE)** for in-guest OS/volume
  encryption (BitLocker/dm-crypt). Restrict snapshot/disk export with **disk-access private endpoints** and
  avoid public SAS export. Least-privilege RBAC on disks and snapshots.

## Cost levers
- Billed on **provisioned capacity (per disk, not used) + provisioned IOPS/throughput (Ultra/Premium SSD v2)
  + snapshot storage + cross-region snapshot copy**. Levers: right-size the **disk type/size** (don't pay
  Premium for cold data), use **Premium SSD v2** to pay for exactly the perf needed, **incremental
  snapshots** instead of full, delete orphaned disks/snapshots, deallocate to stop compute (disks still
  bill), and Standard HDD/SSD for backup/dev.

## Scaling and limits
- **Resize (grow) online** for most types (shrink unsupported); change performance tier on Premium SSD;
  detach/attach to move between VMs. Limits: max disks per VM (by VM size), max disk size/IOPS/throughput per
  type, Ultra Disk availability/zone constraints, shared-disk VM count, and that some changes (e.g. type
  conversion) require the disk be **detached/VM deallocated**. Disk and VM must share region/zone.

## Operating procedure
1. **Provision** — create the **managed disk** (type, size, IOPS/throughput, LRS/ZRS) via Terraform
   `azurerm_managed_disk` or Bicep `Microsoft.Compute/disks`, or `az disk create`; attach to a VM
   (`azurerm_virtual_machine_data_disk_attachment` / `az vm disk attach`).
2. **Configure** — set **host caching** per role, **bursting** where applicable, **incremental snapshots**
   for backup, and choose **LRS vs ZRS**.
3. **Secure** — choose **CMK via a disk encryption set** (or platform keys / double encryption), apply
   **ADE** for in-guest encryption if required, lock snapshot/disk export with **disk-access private
   endpoints**, and scope **RBAC** least-privilege.
4. **Verify** — apply [[verify-by-running]]: confirm the disk `provisioningState` is `Succeeded` and
   `diskState` is `Attached` (`az disk show`), then **read/write the volume from the VM** (Linux:
   format/mount then `touch`/`cat`; Windows: initialize/format then write a file) and confirm. Capture state
   and the read/write result.

## Inputs
The disk role (OS/data/logs), performance need (IOPS/throughput/latency), capacity, redundancy (LRS vs ZRS),
clustering (shared disk), snapshot/backup strategy, encryption requirement (platform/CMK/ADE/double),
target VM and its size/zone, and region.

## Output
An Azure Disk Storage setup: a managed disk of the chosen type/size with the right provisioned performance,
host caching, redundancy and incremental snapshots, encrypted (CMK/ADE as required) with locked-down export,
attached to the target VM — plus verification that the disk is Attached and the volume reads/writes.

## Notes
- Gotchas: disks bill on **provisioned (not used) capacity**, and **deallocated VMs still pay for disks**;
  **shrinking is unsupported** (only grow); **Ultra Disk** has zone/VM-size constraints and is data-disk
  only; type conversion often needs the **VM deallocated/disk detached**; **CMK requires a disk encryption
  set**; orphaned disks/snapshots are a common cost leak; disk and VM must be **same region/zone**. Cross-ref
  **azure-virtual-machines** for the compute side. 2nd consumer: the Azure role team (azure-iac-engineer /
  azure-cloud-architect). Cross-cloud peers: AWS EBS, GCP Persistent Disk.
- IaC/CLI: Terraform `azurerm_managed_disk` (+ `azurerm_virtual_machine_data_disk_attachment`,
  `azurerm_disk_encryption_set`, `azurerm_snapshot`); Bicep/ARM `Microsoft.Compute/disks` (+ `/snapshots`,
  `/diskEncryptionSets`). CLI `az disk create` / `az vm disk attach` / `az disk show`.
