---
name: aws-ebs
description: Use when designing, provisioning, securing, or operating Amazon EBS — block volumes for EC2, volume types (gp3/gp2 general-purpose SSD, io2 Block Express/io1 provisioned IOPS, st1/sc1 throughput/cold HDD), IOPS and throughput sizing, EBS encryption with KMS, snapshots and Data Lifecycle Manager (DLM), Fast Snapshot Restore, multi-attach, and resizing/modifying volumes online (Amazon EBS). Loads the EBS knowledge: how to size a volume for a workload, pick the right type, encrypt by default, snapshot/back up, and verify attachment, IOPS, and encryption. Consumed by the EBS specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they handle block storage for EC2.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, ebs, block-storage, ec2, encryption, snapshots, storage]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon EBS

Network-attached **block** storage for EC2 — durable volumes that persist independently of the
instance lifecycle. EBS is block (not object/file) storage: use S3 for objects, EFS/FSx for shared
file systems, instance store for ephemeral local disk.

## Core concepts and components
- **Volume** — a block device attached to one EC2 instance (or several with io1/io2 multi-attach) in
  one Availability Zone. **Snapshot** — incremental, point-in-time copy stored in S3, restorable to a
  new volume (possibly cross-AZ/Region).
- **AZ-bound** — a volume lives in one AZ; cross-AZ requires snapshot + restore.
- **Data Lifecycle Manager (DLM)** — policy-driven snapshot/AMI creation and retention.
- **Fast Snapshot Restore (FSR)** — pre-warms snapshots so restored volumes hit full performance
  immediately (otherwise first-touch blocks are lazy-loaded).

## Volume types and sizing
- **gp3** (default general-purpose SSD) — baseline 3,000 IOPS / 125 MB/s, IOPS and throughput
  provisioned independently of size; cheaper than gp2. **gp2** — legacy, IOPS scale with size.
- **io2 Block Express / io1** — provisioned IOPS SSD for latency-sensitive, high-IOPS DBs; io2 gives
  higher durability and up to 256,000 IOPS / 4,000 MB/s on Block Express; supports multi-attach.
- **st1** (throughput HDD) — big sequential workloads (logs, data warehouse). **sc1** (cold HDD) —
  infrequent, lowest cost.
- Size for both capacity AND the IOPS/throughput the workload needs; with gp3 raise IOPS/throughput
  directly instead of over-provisioning capacity.

## Security and IAM
- Enable **EBS encryption by default** at the account/Region level (KMS); encryption is set at
  create time and propagates to snapshots and volumes restored from them. Use a customer-managed KMS
  key for control over rotation and grants.
- Gate `ec2:CreateVolume`, `AttachVolume`, `DeleteSnapshot`, and `ModifyVolume` with least-privilege
  IAM; restrict snapshot sharing (`ModifySnapshotAttribute`) to avoid leaking data cross-account.

## Cost levers
- Prefer **gp3** over gp2; provision only the IOPS/throughput needed. Delete orphaned (unattached)
  volumes and stale snapshots; use DLM retention. Snapshots bill on changed blocks only.

## Scaling and limits
- Online **Elastic Volumes** — grow size and change type/IOPS without detaching (then extend the
  filesystem). One volume = one AZ; per-Region/instance volume and IOPS quotas apply. Instance
  EBS bandwidth caps the aggregate throughput across attached volumes.

## Operating procedure
1. **Provision** — create an encrypted volume of the right type/size/IOPS in the instance's AZ via
   Terraform `aws_ebs_volume` (+ `aws_volume_attachment`) or `aws ec2 create-volume`.
2. **Configure** — attach to the instance, format/mount and add to fstab; set a DLM snapshot policy;
   enable FSR if fast restore matters.
3. **Secure** — encryption-by-default on, customer-managed KMS key, least-privilege IAM, no broad
   snapshot sharing.
4. **Verify** — apply [[verify-by-running]]: `aws ec2 describe-volumes` shows `Encrypted=true`, the
   expected type/IOPS, and `State=in-use`; on the instance `lsblk`/`df -h` show the mounted volume;
   a snapshot completes and restores; an unauthorized principal is denied.

## Inputs
Workload IOPS/throughput + latency needs, capacity, AZ/instance placement, durability/backup
(RPO) requirements, encryption/KMS key, multi-attach need.

## Output
A volume definition (type/size/IOPS/throughput, encrypted), attachment + mount plan, DLM snapshot
policy, and verification of encryption, type/IOPS, attachment, and a working snapshot/restore.

## Notes
- Gotchas: volumes are AZ-bound (move via snapshot); you can't shrink a volume online; encryption is
  immutable after create (re-create from snapshot to change key); detaching a busy volume can corrupt
  data — unmount first; multi-attach only on io1/io2 with a cluster-aware filesystem; gp2 burst
  credits run out on sustained load.
- IaC/CLI: Terraform `aws_ebs_volume`, `aws_volume_attachment`, `aws_ebs_snapshot`,
  `aws_ebs_encryption_by_default`, `aws_dlm_lifecycle_policy`. CLI `aws ec2 create-volume`,
  `attach-volume`, `modify-volume`, `create-snapshot`, `enable-ebs-encryption-by-default`.
  CloudFormation `AWS::EC2::Volume`, `AWS::EC2::VolumeAttachment`, `AWS::DLM::LifecyclePolicy`.
