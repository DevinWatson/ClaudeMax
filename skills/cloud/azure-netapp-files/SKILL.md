---
name: azure-netapp-files
description: Use when designing, provisioning, securing, or operating Azure NetApp Files (ANF) — enterprise-grade fully managed NFS/SMB/dual-protocol file storage powered by NetApp ONTAP for high-performance, low-latency workloads like SAP HANA, HPC, VDI, and databases (Azure NetApp Files). Covers the NetApp account → capacity pool → volume hierarchy, service levels (Standard/Premium/Ultra) and pool QoS (auto vs manual), NFSv3/v4.1 and SMB exports, snapshots and snapshot policies, backup, cross-region and cross-zone replication, large volumes, delegated subnets, Entra/AD integration for SMB, and private VNet access. Loads the knowledge: size a capacity pool and volumes by throughput, configure protocols/snapshots/replication, secure, provision, and verify a mount/read-write. Consumed by the azure-netapp-files specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure NetApp Files).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-netapp-files, storage, nfs, smb]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure NetApp Files

Azure's **enterprise-grade, fully managed file storage** powered by **NetApp ONTAP**, delivering
high-throughput, sub-millisecond-latency **NFS/SMB/dual-protocol** shares for demanding workloads (SAP HANA,
HPC, VDI, Oracle/SQL, file services migrations). Azure runs the ONTAP fabric; you own the **capacity-pool /
volume sizing**, **protocols**, **data protection**, and **access**. This skill owns the **managed-service
layer**.

## Core concepts and components
- **Hierarchy** — **NetApp account** (region container) → **capacity pool** (provisioned TiB at a service
  level) → **volumes** (the mountable shares, carved from the pool).
- **Service levels** — **Standard** (~16 MiB/s per TiB), **Premium** (~64), **Ultra** (~128); the pool's
  service level sets the throughput-per-TiB baseline and price.
- **QoS** — **auto** (throughput scales with volume size) or **manual** (assign throughput per volume
  independent of size); manual lets a small volume get high throughput.
- **Protocols** — **NFSv3**, **NFSv4.1**, **SMB**, or **dual-protocol**; SMB/dual-protocol need **AD
  (Entra Domain Services / on-prem AD) connections**.
- **Data protection** — **snapshots** (instant, space-efficient) + **snapshot policies**, **backup** (vault),
  and **cross-region / cross-zone replication** (DR/HA). **Large volumes** for multi-PiB single namespaces.
- **Delegated subnet** — volumes attach to a VNet subnet **delegated** to `Microsoft.NetApp/volumes`.

## Configuration and sizing
- Create a **NetApp account** in the region, size a **capacity pool** (min size, chosen **service level**) to
  cover total capacity + throughput, then create **volumes** with the right **protocol**, **export policy/
  mount path**, **QoS** (auto/manual), and **snapshot policy**. Use **manual QoS** when throughput must be
  decoupled from size, and **large volumes** for very large single namespaces.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC**; data-plane is **network + protocol** based — volumes are only
  reachable inside the **VNet** via the **delegated subnet** (no public endpoint). Lock down with **NFS export
  policies** (allowed clients, root squash, read-only/read-write) and **SMB share/NTFS ACLs** via **AD**. Use
  **NFSv4.1 with Kerberos** for in-transit encryption where required; encryption at rest is on by default
  (CMK supported).

## Cost levers
- Billed on **provisioned capacity-pool TiB × service level** (not on usage) — the pool, not the volume, is
  the cost unit. Levers: right-size the **pool** (don't over-provision), pick the **lowest adequate service
  level**, use **manual QoS** to give throughput only where needed, **cool access** (tiering) for infrequently
  accessed data, and consolidate volumes into a shared pool. Snapshots consume pool capacity.

## Scaling and limits
- Volumes scale to **100 TiB** (regular) or multi-**PiB** (large volumes) with very high throughput. Limits:
  **capacity pool has a minimum size** and you pay for provisioned (not used) TiB, the **subnet must be
  delegated** and cannot be shared with other services, **service-level changes** require pool moves/
  adjustments, regional availability varies, and SMB/dual-protocol require an **AD connection**. No public
  access — VNet only.

## Operating procedure
1. **Provision** — create the **NetApp account**, a **capacity pool** (service level + size), and a **volume**
   (protocol, delegated subnet, export/mount path) via Terraform `azurerm_netapp_account` +
   `azurerm_netapp_pool` + `azurerm_netapp_volume`, Bicep `Microsoft.NetApp/netAppAccounts` (+ `capacityPools`
   / `volumes`), or `az netapp account/pool/volume create`.
2. **Configure** — set **QoS** (auto/manual), **export policy / SMB share**, **snapshot policy**, and
   **replication** (cross-region/zone) for DR; configure the **AD connection** for SMB/dual-protocol.
3. **Secure** — restrict via **export policy / share ACLs**, keep access **VNet-only** (delegated subnet),
   enable **Kerberos/encryption** as required, and apply control-plane **RBAC** + CMK.
4. **Verify** — apply [[verify-by-running]]: confirm the volume provisioned and read the **mount target**
   (`az netapp volume show` for `mountTargets`), then **mount the export and write/read a file** from a VNet
   client and confirm the round-trip. Capture state and result.

## Inputs
Throughput + latency targets and total capacity (pool size + service level + QoS), protocol (NFSv3/4.1/SMB/
dual + AD), data-protection needs (snapshot policy/backup/replication), the **delegated subnet**/VNet, DR
topology (cross-region/zone), encryption (Kerberos/CMK), and region.

## Output
An Azure NetApp Files setup: a NetApp account, a right-sized capacity pool at the chosen service level, and
volumes with the right protocol, QoS, export/share ACLs, snapshot/replication policy, on a delegated subnet —
plus verification that a client can mount and read/write.

## Notes
- Gotchas: you pay for **provisioned pool TiB**, not usage — over-provisioning is the top cost mistake; the
  **subnet must be delegated** to `Microsoft.NetApp/volumes` and is dedicated; there is **no public
  endpoint** (VNet-only); SMB/dual-protocol **require an AD connection**; service-level/QoS changes happen at
  the **pool**; capacity pools have a **minimum size**. 2nd consumer: the Azure role team (azure-iac-engineer
  / azure-cloud-architect). Cross-cloud peers: AWS FSx (for ONTAP/NetApp), GCP Filestore.
- IaC/CLI: Terraform `azurerm_netapp_account` + `azurerm_netapp_pool` + `azurerm_netapp_volume` (+
  `azurerm_netapp_snapshot_policy`); Bicep/ARM `Microsoft.NetApp/netAppAccounts` (+ `capacityPools` /
  `volumes`). CLI `az netapp account/pool/volume create` / `az netapp volume show`.
