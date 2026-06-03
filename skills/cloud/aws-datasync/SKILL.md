---
name: aws-datasync
description: Use when designing, configuring, securing, or operating AWS DataSync — online data transfer and synchronization between on-prem/other-cloud storage and AWS (and AWS-to-AWS): tasks and task executions, source/destination locations (NFS, SMB, HDFS, object storage / other clouds, S3, EFS, FSx for Windows/Lustre/ONTAP/OpenZFS), the DataSync agent (VM/EC2/appliance for on-prem), scheduling, filters/includes-excludes, bandwidth throttling, data-integrity verification, transfer modes, and encryption in transit (DataSync). Loads the DataSync knowledge: how to define source/dest locations, deploy an agent, build a task with filters/schedule, throttle bandwidth, and verify a transfer completed with integrity. Consumed by the DataSync specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they implement data migration/sync.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, datasync, data-transfer, migration, sync, nfs, smb, storage]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS DataSync

A managed **online data transfer/sync** service that moves large datasets between on-prem (or other
clouds) and AWS, and between AWS storage services — with built-in scheduling, integrity verification,
and incremental sync. Use it for one-time migrations and recurring sync; for hybrid live file access
use Storage Gateway, for offline petabyte transfer use Snow Family, for backups use AWS Backup.

## Core concepts and components (tasks and agents)
- **Location** — a source or destination endpoint: on-prem **NFS / SMB / HDFS / object storage**,
  other-cloud object storage, or AWS **S3 / EFS / FSx (Windows/Lustre/ONTAP/OpenZFS)**.
- **Task** — pairs a source + destination location with options; a **task execution** is one run.
- **Agent** — a VM/EC2/hardware appliance deployed near the on-prem source to read it and stream to
  AWS over TLS (not needed for AWS-to-AWS transfers).
- **Schedule** — run on a cron/rate; DataSync transfers **incrementally** (only changed data) after
  the first run.

## Configuration
- **Filters** — include/exclude patterns to scope what transfers. **Transfer mode** — changed data
  only vs all data. **Verification** — verify only transferred data, or all data, or none.
  **Bandwidth throttle** to protect the WAN. Options for preserving metadata/POSIX/ownership and
  handling deleted files (mirror vs additive).

## Security and IAM
- Data is encrypted **in transit (TLS)** between agent and AWS; destination at-rest encryption is the
  target service's (S3/EFS/FSx with SSE/KMS). The DataSync task uses an IAM role with least-privilege
  access to the destination (e.g. the S3 bucket); the agent activates to one account/Region. Use VPC
  endpoints / PrivateLink to keep traffic off the public internet; security groups for the agent.

## Cost levers
- Billed **per GB transferred**. Use **filters** + **incremental** mode to move only what's needed;
  schedule during off-peak and throttle bandwidth; for huge first-time loads compare cost/time vs
  **Snow Family** (offline) over a constrained WAN.

## Scaling and limits
- Multiple agents and tasks parallelize throughput; a single task scales to tens of millions of
  files. Per-account quotas on tasks/locations/agents; throughput bounded by agent resources + WAN.

## Operating procedure
1. **Provision** — deploy and activate the DataSync agent (for on-prem), then define source +
   destination locations and the task via Terraform `aws_datasync_agent` +
   `aws_datasync_location_*` + `aws_datasync_task`, or `aws datasync create-agent` /
   `create-location-*` / `create-task`.
2. **Configure** — task options: filters/includes-excludes, schedule, transfer + verification mode,
   bandwidth limit, metadata/delete behavior.
3. **Secure** — TLS in transit, least-privilege task IAM role to the destination, KMS on the
   destination service, VPC endpoints + agent security group.
4. **Verify** — apply [[verify-by-running]]: `aws datasync start-task-execution` then
   `describe-task-execution` shows `Status=SUCCESS` with `FilesTransferred`/`BytesTransferred` and
   verification passed; spot-check files exist intact in the destination; confirm an unauthorized
   role is denied.

## Inputs
Source + destination (protocol/service), dataset size + file count, one-time vs recurring + schedule,
what to include/exclude, delete/mirror semantics, WAN bandwidth, metadata-preservation needs,
encryption/KMS on destination.

## Output
Agent (if on-prem) + source/destination location definitions, a task with filters/schedule/mode/
throttle, IAM role, and verification of a SUCCESS execution with files transferred and integrity
verified.

## Notes
- Gotchas: on-prem sources need a deployed, activated **agent** with network reach to the source +
  AWS; **delete/mirror** options can remove destination files — confirm intent; per-GB cost adds up
  on huge datasets (compare Snow Family); verification mode trades runtime for assurance; first run
  is full, later runs incremental; SMB/NFS metadata/ACL preservation depends on options. DataSync is
  for **transfer/sync** — not for live hybrid access (Storage Gateway) or scheduled backups
  (AWS Backup).
- IaC/CLI: Terraform `aws_datasync_agent`, `aws_datasync_location_nfs`, `aws_datasync_location_smb`,
  `aws_datasync_location_s3`, `aws_datasync_location_efs`, `aws_datasync_location_fsx_windows_file_system`,
  `aws_datasync_task`. CLI `aws datasync create-agent`, `create-location-nfs`/`-s3`/`-efs`,
  `create-task`, `start-task-execution`, `describe-task-execution`. CloudFormation
  `AWS::DataSync::Agent`, `::LocationNFS`, `::LocationS3`, `::Task`.
