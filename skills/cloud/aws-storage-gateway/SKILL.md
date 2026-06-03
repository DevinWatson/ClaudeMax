---
name: aws-storage-gateway
description: Use when designing, deploying, securing, or operating AWS Storage Gateway — the hybrid on-prem-to-AWS storage bridge: S3 File Gateway (NFS/SMB shares backed by S3 objects), FSx File Gateway (low-latency on-prem cache of FSx for Windows), Volume Gateway (iSCSI block volumes, cached vs stored, EBS snapshots), and Tape Gateway (virtual tape library to S3/Glacier replacing physical tapes), including gateway appliance deployment (VM/hardware/EC2), local cache/upload buffer sizing, bandwidth throttling, and encryption (Storage Gateway). Loads the gateway knowledge: how to pick the gateway type, deploy and activate the appliance, size cache, expose shares/volumes/tapes, and verify on-prem-to-AWS data flow. Consumed by the Storage Gateway specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they handle hybrid storage.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, storage-gateway, hybrid, on-premises, nfs, smb, iscsi, storage]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Storage Gateway

A **hybrid** service that gives on-premises applications standard file/block/tape protocols backed by
AWS storage (S3, FSx, EBS snapshots, Glacier). It runs as a **gateway appliance** (VMware/Hyper-V/KVM
VM, hardware appliance, or EC2) that caches hot data locally and transfers to AWS asynchronously. Use
it for hybrid/on-prem; for cloud-native data movement use DataSync (transfer) or the S3/EFS/FSx
services directly.

## Gateway types (choose by protocol/use)
- **S3 File Gateway** — exposes **NFS/SMB** file shares; files become **S3 objects** one-to-one. For
  hybrid file shares, lift-and-shift to S3, on-prem ingest to data lakes.
- **FSx File Gateway** — low-latency on-prem **SMB** cache in front of **FSx for Windows File
  Server**, for branch offices accessing a central FSx file system.
- **Volume Gateway** — **iSCSI** block volumes backed by S3, with **EBS snapshots**; **Cached**
  (primary data in AWS, hot cache local) vs **Stored** (primary data on-prem, async backup to AWS).
- **Tape Gateway** — **Virtual Tape Library (VTL)** to existing backup software; tapes stored in S3
  and archived to S3 Glacier / Deep Archive — replaces physical tape infrastructure.

## Configuration and sizing
- Deploy + **activate** the appliance, then attach local disks for the **cache** (hot data) and
  **upload buffer** (staged for upload). Size cache to the working set; size upload buffer to peak
  write throughput × upload latency. Set **bandwidth rate limits** to protect the WAN.

## Security and IAM
- Data encrypted **in transit (TLS)** to AWS and **at rest** (S3/EBS/Glacier with SSE-S3/KMS). SMB
  shares integrate with **Active Directory** (or guest); NFS with client allow-lists / squash.
  Least-privilege IAM for the gateway's S3/FSx access role; restrict who can activate gateways and
  delete volumes/tapes. Use VPC endpoints / Direct Connect for private connectivity.

## Cost levers
- You pay for the AWS storage consumed (S3/EBS-snapshot/Glacier) + data written to AWS; the gateway
  software is free. Right-size the local cache (too small → cache misses/latency), archive tape data
  to Deep Archive, and throttle bandwidth to avoid surprise transfer patterns.

## Scaling and limits
- Per-gateway limits on shares/volumes/tapes and cache disk size; throughput bounded by the
  appliance resources + WAN. Multiple gateways scale out by site/workload.

## Operating procedure
1. **Provision** — deploy the gateway appliance (VM/hardware/EC2), activate it to a Region, and
   attach cache + upload-buffer disks; on AWS define the gateway/shares via Terraform
   `aws_storagegateway_gateway` (+ share/volume/tape resources) or the console/CLI.
2. **Configure** — create NFS/SMB shares (File), iSCSI volumes (Volume), or virtual tapes (Tape);
   set bandwidth limits and AD join.
3. **Secure** — TLS to AWS, KMS on the backing storage, AD/NFS access control, least-privilege
   gateway IAM role, private connectivity.
4. **Verify** — apply [[verify-by-running]]: `aws storagegateway describe-gateway-information` shows
   `GatewayState=RUNNING`; mount the share / connect the iSCSI target / inventory the VTL, write a
   file on-prem and confirm the object/snapshot/tape appears in S3/EBS/Glacier; confirm an
   unauthorized client is denied.

## Inputs
On-prem protocol need (NFS/SMB/iSCSI/tape), use case (file share, block backup, tape replacement,
FSx cache), working-set size (cache), WAN bandwidth, backing storage class, AD/network details,
encryption/KMS, RPO/RTO.

## Output
A gateway definition (type, appliance, cache/upload sizing), shares/volumes/tapes config, bandwidth/
AD/security settings, and verification of a running gateway plus on-prem-to-AWS data flow.

## Notes
- Gotchas: gateway **type is fixed per appliance**; under-sized cache causes latency/eviction; the
  appliance needs adequate local disk + CPU/RAM + a stable WAN; Stored Volume Gateway keeps primary
  data on-prem (limited by local disk); activation ties the gateway to one Region; recovering a
  failed appliance needs the cache disks or a fresh gateway + AWS-side data. This is for **hybrid**
  on-prem access — use DataSync for one-time/scheduled bulk transfer and Snow Family for offline.
- IaC/CLI: Terraform `aws_storagegateway_gateway`, `aws_storagegateway_smb_file_share`,
  `aws_storagegateway_nfs_file_share`, `aws_storagegateway_cached_iscsi_volume`,
  `aws_storagegateway_stored_iscsi_volume`, `aws_storagegateway_tape_pool`. CLI `aws storagegateway
  activate-gateway`, `create-smb-file-share`, `create-cached-iscsi-volume`, `create-tapes`,
  `describe-gateway-information`. CloudFormation `AWS::StorageGateway::Gateway`, `::SMBFileShare`,
  `::NFSFileShare`, `::CachediSCSIVolume`.
