---
name: aws-efs
description: Use when designing, provisioning, securing, or operating Amazon EFS — fully managed, elastic, multi-AZ NFS (v4.1) shared file systems for Linux/EC2/containers/Lambda, performance modes (General Purpose vs Max I/O) and throughput modes (Elastic, Bursting, Provisioned), storage classes and Lifecycle Management (Standard / Infrequent Access / Archive), mount targets and access points, encryption at rest (KMS) and in transit (TLS), and EFS-to-EFS replication (Amazon EFS). Loads the EFS knowledge: how to create an encrypted multi-AZ file system, expose it via mount targets/access points, tune performance/throughput, control cost with IA/Archive lifecycle, and verify mounts and encryption. Consumed by the EFS specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they handle shared NFS file storage.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, efs, nfs, file-storage, shared-storage, encryption, storage]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon EFS

Fully managed, elastic **NFS (v4.1)** file system that grows/shrinks automatically and is shared
across many EC2 instances, containers (ECS/EKS), and Lambda — across multiple AZs in a Region. EFS
is POSIX shared **file** storage: use EBS for single-instance block, S3 for objects, FSx for managed
Windows/Lustre/NetApp/OpenZFS file systems.

## Core concepts and components
- **File system** — Regional (multi-AZ) or One Zone; **mount target** — an ENI in a subnet/AZ that
  clients mount via NFS; **access point** — an application-specific entry enforcing a POSIX
  user/group and root directory.
- **Standard** (multi-AZ) vs **One Zone** (single-AZ, cheaper, less durable).
- **Lifecycle Management** — transitions files between Standard, **Infrequent Access (IA)**, and
  **Archive** based on access age.

## Performance and throughput modes
- **Performance mode**: **General Purpose** (lowest latency, default — pick for almost everything) vs
  **Max I/O** (higher aggregate throughput, higher per-op latency; largely superseded by Elastic).
- **Throughput mode**: **Elastic** (auto-scales, pay per use — recommended default), **Bursting**
  (scales with stored size + burst credits), **Provisioned** (fixed MB/s regardless of size).

## Security and IAM
- **Encryption at rest** with KMS (set at create, immutable) and **in transit** with TLS via the
  EFS mount helper (`-o tls`). Control mount with **security groups** on mount targets,
  **file-system policy** (IAM, e.g. enforce TLS / read-only), and **access points** for POSIX
  enforcement. Use IAM authorization for NFS clients where supported.

## Cost levers
- Enable IA + Archive Lifecycle Management — biggest lever for cold data. Use One Zone for
  non-critical/dev data. Elastic throughput avoids paying for idle provisioned throughput; only use
  Provisioned for steady high throughput on small datasets.

## Scaling and limits
- Capacity is elastic (petabyte-scale), no provisioning. Throughput scales with mode; thousands of
  concurrent NFS clients. Mount targets: one per AZ; clients must reach the mount target in their AZ.

## Operating procedure
1. **Provision** — create an encrypted file system (Standard, Elastic throughput) with a mount
   target in each app subnet via Terraform `aws_efs_file_system` (+ `aws_efs_mount_target`) or
   `aws efs create-file-system`.
2. **Configure** — access points with POSIX root/user, Lifecycle Management (IA/Archive), backup
   (AWS Backup) and replication if needed.
3. **Secure** — mount-target security group scoped to NFS (2049) from app SGs only, file-system
   policy enforcing TLS, KMS encryption, access points per app.
4. **Verify** — apply [[verify-by-running]]: `aws efs describe-file-systems` shows `Encrypted=true`;
   mount with `mount -t efs -o tls fs-...:/ /mnt` and write/read a file from two AZs; confirm a
   non-TLS or wrong-SG client is denied.

## Inputs
Access pattern + concurrency (how many clients, throughput), latency needs, durability (Standard vs
One Zone), encryption/KMS key, network (VPC/subnets/SGs), retention/lifecycle, replication/DR.

## Output
A file-system definition (encrypted, throughput/performance mode), mount targets per AZ, access
points, lifecycle + backup/replication config, and verification of encryption, multi-AZ mount, and
TLS enforcement.

## Notes
- Gotchas: clients need a mount target in their own AZ + the right security group (NFS 2049);
  encryption and KMS key are immutable after create; Max I/O adds latency — prefer GP/Elastic; IA/
  Archive add per-access retrieval latency/cost; EFS latency is higher than EBS — not for low-latency
  single-instance DBs; One Zone data is lost if the AZ is lost.
- IaC/CLI: Terraform `aws_efs_file_system`, `aws_efs_mount_target`, `aws_efs_access_point`,
  `aws_efs_file_system_policy`, `aws_efs_backup_policy`, `aws_efs_replication_configuration`. CLI
  `aws efs create-file-system`, `create-mount-target`, `create-access-point`,
  `put-lifecycle-configuration`. CloudFormation `AWS::EFS::FileSystem`, `AWS::EFS::MountTarget`,
  `AWS::EFS::AccessPoint`.
