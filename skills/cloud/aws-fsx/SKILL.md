---
name: aws-fsx
description: Use when designing, provisioning, securing, or operating Amazon FSx — fully managed third-party file systems: FSx for Windows File Server (SMB, Active Directory, DFS), FSx for Lustre (high-performance/HPC, S3-linked data repositories), FSx for NetApp ONTAP (multi-protocol NFS/SMB/iSCSI, SnapMirror, dedup), and FSx for OpenZFS (NFS, snapshots, cloning), including deployment types (Single-AZ/Multi-AZ), storage/throughput capacity, encryption (KMS), backups, and SMB/NFS access (Amazon FSx). Loads the FSx knowledge: how to choose the file-system type for a workload, size storage/throughput, integrate AD/networking, encrypt and back up, and verify mounts and performance. Consumed by the FSx specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they handle managed file systems.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, fsx, file-storage, smb, lustre, netapp, openzfs, storage]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon FSx

Fully managed launches of popular third-party **file systems**, for workloads that need a specific
protocol or feature set EFS doesn't cover. FSx is managed **file** storage; pick the engine by
protocol/feature need (EFS for plain Linux NFS, EBS for block, S3 for objects).

## File-system types (choose by workload)
- **FSx for Windows File Server** — **SMB**, NTFS, Active Directory integration, DFS namespaces,
  shadow copies. For Windows apps, .NET, home directories, SQL Server file shares.
- **FSx for Lustre** — high-throughput, low-latency **HPC/ML/analytics**; can link to an **S3 data
  repository** (lazy-load + export). Scratch (ephemeral, cheapest) vs Persistent (durable) types.
- **FSx for NetApp ONTAP** — **multi-protocol** (NFS, SMB, iSCSI), SnapMirror replication, dedup/
  compression, FlexClone, tiering to capacity pool. For lift-and-shift of NetApp workloads.
- **FSx for OpenZFS** — **NFS** with ZFS snapshots, instant clones, high IOPS; for Linux workloads
  wanting ZFS semantics.

## Configuration and sizing
- **Deployment type**: Single-AZ (cheaper) vs **Multi-AZ** (HA, automatic failover) — use Multi-AZ
  for production Windows/ONTAP. Provision **storage capacity** (SSD/HDD where applicable) and
  **throughput capacity** independently; Lustre scales throughput with capacity (per-TiB tiers).
- For Lustre, link to S3 and choose import/export policy; for Windows/ONTAP, join the AD domain and
  size throughput for the SMB workload.

## Security and IAM
- **Encryption at rest** (KMS, set at create) and **in transit** (SMB encryption / NFS Kerberos /
  ONTAP). Access control: AD/NTFS ACLs (Windows), NFS export policies / Kerberos (Lustre, ONTAP,
  OpenZFS), **security groups** for ports (SMB 445; NFS 2049; Lustre 988/1018-1023). IAM gates the
  FSx control plane, not file access.

## Cost levers
- Right type + deployment (Single- vs Multi-AZ); Lustre **Scratch** for transient data; ONTAP
  capacity-pool **tiering** + dedup/compression for cold data; HDD storage for Windows where latency
  allows; size throughput to actual demand.

## Scaling and limits
- Storage and (for some types) throughput can scale up; Lustre links to effectively unlimited S3.
  Per-Region/account quotas on file systems and capacity; ONTAP/Windows need reachable AD + correct
  subnets.

## Operating procedure
1. **Provision** — create the file system of the chosen type (encrypted, deployment type, storage/
   throughput) in the right subnets via Terraform `aws_fsx_*_file_system` or `aws fsx
   create-file-system`.
2. **Configure** — AD join (Windows/ONTAP), S3 data-repository link (Lustre), volumes/SVMs (ONTAP),
   backups and maintenance window.
3. **Secure** — KMS encryption, security groups scoped to the protocol ports, AD/NFS export ACLs,
   in-transit encryption.
4. **Verify** — apply [[verify-by-running]]: `aws fsx describe-file-systems` shows the type,
   `KmsKeyId`, and deployment type; mount the share (`mount -t cifs`/`mount -t nfs`/Lustre client)
   and write/read a file; confirm an out-of-scope client/port is denied and a backup completes.

## Inputs
Protocol (SMB/NFS/iSCSI/Lustre) + workload (Windows app, HPC/ML, NetApp lift-and-shift, ZFS),
throughput/IOPS + capacity, HA (Single- vs Multi-AZ), AD/network details, S3 linkage (Lustre),
encryption/KMS, backup/DR.

## Output
A file-system definition (type, deployment, storage/throughput, encrypted), AD/network/S3-link
config, backup policy, and verification of type/encryption, a working mount, and a completed backup.

## Notes
- Gotchas: file-system **type cannot be changed** after create — choosing the wrong engine means
  recreate; Windows/ONTAP need a reachable, healthy AD; Lustre **Scratch** has no durability/backup;
  protocol ports must be open in the security group; throughput/storage can usually grow but not
  shrink; ONTAP introduces SVMs/volumes as extra layers.
- IaC/CLI: Terraform `aws_fsx_windows_file_system`, `aws_fsx_lustre_file_system`,
  `aws_fsx_ontap_file_system` (+ `_storage_virtual_machine`, `_volume`), `aws_fsx_openzfs_file_system`,
  `aws_fsx_backup`, `aws_fsx_data_repository_association`. CLI `aws fsx create-file-system`,
  `create-volume`, `create-data-repository-association`, `create-backup`. CloudFormation
  `AWS::FSx::FileSystem`, `AWS::FSx::Volume`, `AWS::FSx::StorageVirtualMachine`.
