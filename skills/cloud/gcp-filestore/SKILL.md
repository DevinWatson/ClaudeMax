---
name: gcp-filestore
description: Use when designing, provisioning, securing, or operating Filestore — Google Cloud's fully managed NFS file storage for Compute Engine and GKE workloads needing a shared POSIX filesystem (Filestore). Covers service tiers (Basic HDD/SSD, Zonal, Regional, Enterprise) and their capacity/performance/availability tradeoffs, NFSv3 shares mounted by VMs and GKE (the Filestore CSI driver), VPC network attachment and private connectivity, snapshots and backups for point-in-time recovery, capacity scaling, IP-range/access controls and IAM, multishares for GKE, plus cost and limits. Loads the Filestore knowledge: pick a tier, provision an instance on a VPC, mount it, set snapshots/backups, and verify. Consumed by the Filestore specialist and by the GCP role team (gcp-cloud-architect / gcp-security-reviewer) when providing shared NFS storage (Filestore).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, filestore, storage, nfs, file-storage, snapshots, backups]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Filestore

Google Cloud's **fully managed NFS file storage**. It provides a shared, POSIX, **NFSv3** filesystem
that many Compute Engine VMs and GKE pods can mount concurrently — for content management, dev shares,
media rendering, HPC scratch, and lift-and-shift apps that expect a network file share.

## Core concepts and components
- **Service tiers** — **Basic HDD** and **Basic SSD** (single share, zonal), **Zonal** (high
  performance, scalable capacity, one zone), **Regional** (synchronously replicated across zones for
  high availability), and **Enterprise** (regional HA + features like multishares). Tier sets the
  capacity range, throughput/IOPS, and availability.
- **Instance + file share** — an instance hosts one (Basic) or more shares, exposed as an **NFSv3**
  export with a private **IP address** on an attached VPC.
- **VPC network attachment** — the instance attaches to a **VPC** (often via private services access /
  a reserved IP range); clients mount it over the private network.
- **Mounting** — VMs mount with the NFS client (`mount -t nfs <ip>:/<share> <dir>`); GKE uses the
  **Filestore CSI driver** for dynamically/ statically provisioned `ReadWriteMany` volumes.
- **Snapshots** — point-in-time, space-efficient copies of a share for quick recovery (tier-dependent).
- **Backups** — independent, regional backups for disaster recovery and restore to a new instance.
- **Multishares (Enterprise)** — pack many small GKE shares onto one instance for efficiency.

## Configuration and sizing
- Pick the **tier** by performance + availability need: **Basic** for simple/dev, **Zonal** for high
  throughput in one zone, **Regional/Enterprise** for HA. **Capacity** is provisioned (and on higher
  tiers scalable up) — and **performance scales with capacity**, so size for IOPS/throughput, not just
  GB. Choose the **VPC + region/zone** near the clients. Plan a non-overlapping **reserved IP range**.

## Security and IAM
- Filestore exports are reached over the **private VPC** — control access with **firewall rules** and
  the share's allowed **client IP ranges/NFS export options** (and `root_squash`); do not expose it
  publicly. IAM (`roles/file.editor`/`viewer`/`admin`) governs **managing** instances; **filesystem**
  permissions are standard POSIX (UID/GID) — coordinate UIDs across clients. Data is encrypted at rest
  (CMEK supported on supported tiers).

## Cost levers
- Billed by **provisioned capacity × tier rate** (per GB-hour), not usage — higher tiers cost more per
  GB; **backups** are billed separately. Levers: right-size capacity (since you pay for provisioned, not
  used), choose the **lowest tier** that meets performance/HA needs, and prune snapshots/backups.

## Scaling and limits
- Each tier has **min/max capacity** and throughput tied to capacity; Basic has fewer scaling options
  than Zonal/Enterprise. NFSv3 only. **Region/zone availability** and capacity scaling are tier-
  specific. Shrinking capacity is restricted; instance **network attachment** is set at creation.

## Operating procedure
1. **Provision** — enable `file.googleapis.com`; reserve a non-overlapping **IP range** on the target
   **VPC**; create the **instance** with the chosen **tier**, **capacity**, **region/zone**, and share
   name, via Terraform `google_filestore_instance`.
2. **Configure** — set **NFS export options** (allowed client ranges, access mode, `root_squash`); mount
   on VMs (`mount -t nfs`) or wire the **Filestore CSI driver** in GKE (StorageClass/PVC `ReadWriteMany`);
   configure **CMEK** if required.
3. **Secure** — restrict reach with **firewall rules** and **client IP ranges/export options**, keep it
   off public networks, set least-privilege **file.* IAM** for management, and coordinate POSIX UID/GID.
4. **Verify** — apply [[verify-by-running]]: from an authorized client **mount the share and read/write**
   a file (confirm RW and concurrency from a second client), confirm a **non-allowed client/IP cannot
   mount**, take a **snapshot** and **restore**/list it, and run a **backup** and confirm it completes.
   Capture the successful mount + read/write, the blocked client, and the snapshot/backup result.

## Inputs
The workloads needing shared NFS (VMs and/or GKE), required performance + availability (tier), capacity,
target VPC/region/zone, recovery needs (snapshots/backups), client access ranges, and any CMEK
requirement.

## Output
A Filestore instance on the right tier/capacity attached to the VPC with NFS export options scoped to
authorized clients, mounted on VMs and/or via the GKE CSI driver, snapshots/backups configured, CMEK
where required, plus verification of a working RW mount, a blocked unauthorized client, and a
snapshot/backup.

## Notes
- Gotchas: **performance scales with provisioned capacity** (size for IOPS/throughput, not just GB);
  you **pay for provisioned, not used** capacity; **NFSv3 only**; the **reserved IP range must not
  overlap** the VPC; coordinate **POSIX UID/GID** across clients; **shrinking capacity** is restricted;
  Basic tier has limited scaling/HA vs Zonal/Regional/Enterprise. 2nd consumer: the GCP role team
  provides shared storage for compute, not just the specialist. Cross-cloud peers: AWS EFS, Azure
  Files.
- IaC/CLI: Terraform `google_filestore_instance` (`tier`, `file_shares` with `nfs_export_options`,
  `networks`), `google_filestore_backup`, `google_filestore_snapshot`, and the GKE Filestore CSI
  `StorageClass`/`PersistentVolumeClaim`. CLI `gcloud filestore instances` /
  `snapshots` / `backups`, plus `mount -t nfs` on a client to verify.
