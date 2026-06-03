---
name: aws-s3-glacier
description: Use when designing, configuring, securing, or operating Amazon S3 Glacier archive storage — the Glacier Instant Retrieval, Glacier Flexible Retrieval, and Glacier Deep Archive S3 storage classes, lifecycle transitions into Glacier, retrieval tiers (Instant / Expedited / Standard / Bulk) and restore requests, minimum storage durations and early-deletion fees, Vault Lock / S3 Object Lock for compliance WORM, encryption (SSE-S3/SSE-KMS), and the legacy Glacier vault API (Amazon S3 Glacier). Loads the Glacier knowledge: how to move cold data into the right archive class, lifecycle into it, restore with the right retrieval tier, lock for compliance, and verify class, restore, and retention. Consumed by the S3 Glacier specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they handle archival object storage.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, s3-glacier, archive, cold-storage, object-storage, compliance, storage]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon S3 Glacier

Lowest-cost **archive** tier of S3 for rarely-accessed, long-retention data (backups, compliance,
media archives, logs). Today Glacier is best used as **S3 storage classes** on objects in a normal
bucket (managed via S3 + lifecycle), not the legacy standalone vault API. It is the archive tier
*under* S3 object storage — for hot/warm objects stay in S3 Standard/IA via the aws-s3 skill.

## Core concepts and components (retrieval tiers)
- **Glacier Instant Retrieval** — millisecond access, same as S3 IA latency; for archive data still
  occasionally read. Cheapest "instant" archive.
- **Glacier Flexible Retrieval** (formerly "Glacier") — minutes-to-hours retrieval via a restore
  job; tiers: **Expedited** (1–5 min), **Standard** (3–5 h), **Bulk** (5–12 h, cheapest).
- **Glacier Deep Archive** — lowest cost of all; retrieval **Standard** (~12 h) or **Bulk** (~48 h).
  For 7–10 year compliance retention rarely or never read.
- **Restore** — Glacier Flexible/Deep objects must be **restored** (temporary copy in the bucket for
  N days) before download; Instant Retrieval needs no restore.

## Configuration and minimums
- Reach Glacier via **S3 Lifecycle rules** that transition objects from Standard/IA after N days, or
  PUT directly into a Glacier class. **Minimum storage durations**: Instant 90 days, Flexible 90
  days, Deep Archive 180 days — early deletion incurs prorated charges.
- Choose the class by access need: occasional reads → Instant; rare, can-wait → Flexible; almost
  never → Deep Archive. Pick the restore tier by how fast/cheap you need it.

## Security and IAM
- Encryption SSE-S3 (default) or SSE-KMS; same Block Public Access, bucket/IAM policies as S3.
  **S3 Object Lock** (or legacy **Vault Lock**) provides WORM/compliance retention that even the
  root user cannot delete during the retention period — use for regulatory archives.

## Cost levers
- Deepest tier the access pattern tolerates is the biggest lever; mind **minimum-duration** and
  **early-deletion** fees, **per-request restore** costs (especially Expedited), and the temporary
  restore-copy storage. Lifecycle small objects carefully — per-object overhead can dominate.

## Scaling and limits
- Effectively unlimited capacity (it's S3). Restore latency is governed by the tier; Expedited
  capacity can be reserved (provisioned capacity) for guaranteed fast restores.

## Operating procedure
1. **Provision** — on an existing/private encrypted S3 bucket, define lifecycle transitions to the
   chosen Glacier class via Terraform `aws_s3_bucket_lifecycle_configuration` or `aws s3api
   put-bucket-lifecycle-configuration`.
2. **Configure** — set the right class per prefix; enable Object Lock for compliance archives;
   document retrieval tier expectations.
3. **Secure** — KMS encryption, Block Public Access on, least-privilege policy, Object Lock/Vault
   Lock retention for WORM.
4. **Verify** — apply [[verify-by-running]]: `aws s3api head-object` shows the expected
   `StorageClass`; issue `aws s3api restore-object` and confirm `Restore` ongoing→completed; for
   Deep/Flexible confirm the object is downloadable only after restore; confirm Object Lock blocks
   deletion.

## Inputs
Data retention + compliance (WORM) needs, how fast/often it must be retrieved, volume + object
sizes, current storage class/source bucket, encryption/KMS, budget for restore latency vs cost.

## Output
A lifecycle/transition plan into the chosen Glacier class, restore-tier guidance, Object Lock/
retention config, and verification of storage class, a working restore, and retention enforcement.

## Notes
- Gotchas: Flexible/Deep objects are **not directly readable** — must restore first (jobs take
  hours); **minimum-duration and early-deletion fees** punish churning small/short-lived objects;
  Expedited restores can throttle without provisioned capacity; restore creates a temporary copy you
  also pay for; Deep Archive Standard restore can take ~12 h — size your RTO accordingly.
- IaC/CLI: Terraform `aws_s3_bucket_lifecycle_configuration` (transition `GLACIER_IR`/`GLACIER`/
  `DEEP_ARCHIVE`), `aws_s3_bucket_object_lock_configuration`; legacy `aws_glacier_vault`,
  `aws_glacier_vault_lock`. CLI `aws s3api put-bucket-lifecycle-configuration`, `restore-object`,
  `head-object`. CloudFormation `AWS::S3::Bucket` (LifecycleConfiguration), `AWS::Glacier::Vault`.
