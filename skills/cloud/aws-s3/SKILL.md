---
name: aws-s3
description: Use when designing, provisioning, securing, or operating Amazon S3 — buckets, objects/prefixes, storage classes and lifecycle/Intelligent-Tiering, versioning, Block Public Access, bucket/IAM policies and ACLs, default + KMS encryption (SSE-S3/SSE-KMS/DSSE), access points and Object Lambda, replication (CRR/SRR), Object Lock/WORM, static hosting, presigned URLs, and event notifications (Amazon S3). Loads the S3 knowledge: how to create a private encrypted bucket, scope access, control cost with storage classes/lifecycle, replicate, and verify access and encryption. Consumed by the S3 specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they handle object storage.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, s3, object-storage, encryption, lifecycle, storage]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon S3

Virtually unlimited, durable (11 nines) object storage. The default landing zone for files,
backups, data lakes, static assets, and logs. S3 is object (not block/file) storage — use EBS for
block, EFS/FSx for shared file systems, Glacier (S3 storage classes) for archive.

## Core concepts and components
- **Bucket** — a globally-named container in a Region; **object** — data + key (the "path") +
  metadata; prefixes are virtual folders.
- **Storage classes** — Standard, Standard-IA, One Zone-IA, Intelligent-Tiering, Glacier
  Instant/Flexible, Glacier Deep Archive — trade retrieval latency/cost for storage cost.
- **Versioning** — keeps every version (protects against overwrite/delete). **Lifecycle rules** —
  transition between classes / expire objects automatically.
- **Access** — **Block Public Access** (account + bucket), bucket policy, IAM policy, (legacy)
  ACLs, **access points**, **Object Lambda**.
- **Encryption** — SSE-S3 (default), SSE-KMS, DSSE-KMS. **Object Lock** — WORM/compliance retention.
- **Replication** (CRR/SRR), **event notifications** (to SQS/SNS/Lambda/EventBridge).

## Configuration and sizing
- New buckets are private and encrypted by default — keep Block Public Access ON unless serving
  truly public content (and even then prefer CloudFront OAC). Turn on versioning for important data.
- Use Intelligent-Tiering for unknown/changing access patterns; explicit lifecycle rules when the
  pattern is known. Partition keys for high request rates (S3 scales per prefix).

## Security and IAM
- Default to **Block Public Access** at the account level. Use bucket policies + IAM with least
  privilege; prefer `aws:SecureTransport`/`s3:x-amz-server-side-encryption` policy conditions.
- SSE-KMS with a CMK for sensitive data; deny unencrypted puts. Enable access logging / CloudTrail
  data events. Object Lock for immutability/compliance.

## Cost levers
- Right storage class + lifecycle transitions are the biggest lever; expire incomplete multipart
  uploads and old versions. Watch request and data-transfer (egress) costs; use VPC gateway
  endpoints to avoid NAT charges; S3 Storage Lens to find waste.

## Scaling and limits
- Effectively unlimited objects; ~3,500 PUT/5,500 GET per prefix per second (scales with prefix
  spread). Bucket names are globally unique; soft limit on buckets per account.

## Operating procedure
1. **Provision** — create a private, encrypted, versioned bucket with Block Public Access via
   Terraform `aws_s3_bucket` (+ `_public_access_block`, `_versioning`, `_server_side_encryption_*`)
   or `aws s3api create-bucket`.
2. **Configure** — lifecycle/Intelligent-Tiering rules, replication, event notifications, access
   points as needed.
3. **Secure** — least-privilege bucket/IAM policies, KMS encryption + deny-unencrypted, Block
   Public Access ON, TLS-only, logging, Object Lock if required.
4. **Verify** — apply [[verify-by-running]]: `aws s3api get-public-access-block` confirms public
   access is blocked, `get-bucket-encryption` confirms KMS, a `put-object`/`get-object` round-trip
   succeeds for the intended principal, and an unauthorized/HTTP request is denied.

## Inputs
Data type/sensitivity, access pattern + who reads/writes, retention/compliance needs, expected
volume + request rate, replication/DR requirements, public vs private, encryption requirements.

## Output
A bucket definition (private, encrypted, versioned, BPA on), lifecycle/storage-class plan, access
policy, replication/notification config, and verification of blocked public access, encryption,
and a working authorized round-trip.

## Notes
- Gotchas: bucket names are global and immutable; Block Public Access overrides permissive
  policies (good); deleting a versioned bucket needs all versions purged; eventual vs strong
  consistency (now strong read-after-write); KMS adds per-request cost/throttling at high rates;
  presigned URLs inherit the signer's permissions and expire.
- IaC/CLI: Terraform `aws_s3_bucket`, `aws_s3_bucket_public_access_block`,
  `aws_s3_bucket_versioning`, `aws_s3_bucket_server_side_encryption_configuration`,
  `aws_s3_bucket_policy`, `aws_s3_bucket_lifecycle_configuration`, `aws_s3_bucket_replication_configuration`.
  CLI `aws s3api create-bucket`, `put-bucket-policy`, `get-public-access-block`,
  `get-bucket-encryption`, `aws s3 cp/sync`. CloudFormation `AWS::S3::Bucket`.
