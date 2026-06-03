---
name: aws-dynamodb
description: Use when designing, provisioning, securing, or operating Amazon DynamoDB — the fully serverless NoSQL key-value and document database. Loads the DynamoDB knowledge: tables and the primary key (partition key, optional sort key), single-table design, global and local secondary indexes (GSI/LSI), on-demand vs provisioned capacity with auto scaling, DynamoDB Streams and change data capture, DynamoDB Accelerator (DAX) caching, global tables for multi-Region active-active, point-in-time recovery and on-demand backups, TTL expiry, encryption at rest with KMS, fine-grained IAM (including leading-key conditions) and VPC endpoints. Covers how to pick keys/indexes, choose a capacity mode, secure access, and verify reads/writes and throttling. Consumed by the DynamoDB specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they provision serverless NoSQL.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, dynamodb, nosql, key-value, serverless, gsi, streams]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon DynamoDB

Fully managed, **serverless** NoSQL key-value and document database with single-digit-millisecond
latency at any scale and no servers to run. The design discipline (access patterns first, then keys
and indexes) is the whole game — DynamoDB has no engine team to defer to; this skill owns both the
service AND the data-model layer. Choose DynamoDB for high-scale, predictable-access KV/document
workloads; choose RDS/Aurora for relational/ad-hoc-query workloads.

## Core concepts and components
- **Table** — a collection of items; each item has a **primary key**: a **partition key** (hash,
  determines storage partition) and an optional **sort key** (range, orders items within a
  partition). Composite keys + overloaded attributes enable **single-table design**.
- **Indexes** — **GSI** (different partition/sort key, eventually consistent, own capacity) and
  **LSI** (same partition key, alternate sort key, must be created at table creation, shares
  capacity, strongly consistent).
- **Capacity** — **on-demand** (pay-per-request, instant scale, no planning) vs **provisioned**
  (RCU/WCU with auto scaling, cheaper for steady predictable load).
- **Streams** — ordered change log of item-level modifications (24h) for CDC → Lambda/Kinesis.
- **DAX** — in-memory write-through cache for microsecond reads. **Global tables** —
  multi-Region, multi-active replication. **TTL** — automatic item expiry.

## Configuration and sizing
- Model **access patterns first**, then design keys so queries hit a single partition and avoid
  scans. Pick high-cardinality partition keys to spread load and avoid hot partitions. Add a GSI per
  additional query pattern. Start on-demand; switch hot tables to provisioned + auto scaling once
  traffic is predictable. Use sparse GSIs and projection to trim index cost.

## Security and IAM
- Encrypt at rest (KMS — AWS-owned, AWS-managed, or customer-managed CMK). Use least-privilege IAM
  with `dynamodb:LeadingKeys` conditions to scope items per principal/tenant. Access via a **VPC
  gateway endpoint** to avoid the public internet. Enable CloudTrail; use PITR for recovery.

## Cost levers
- On-demand is convenient but pricier per request than well-utilized provisioned + auto scaling.
  Cut item size (shorter attribute names, compression) — you pay per KB of throughput. Avoid Scans;
  use Query. Sparse/projected GSIs reduce index storage and write amplification. DAX cuts read cost
  for hot keys. Standard-IA table class for infrequently accessed data.

## Scaling and limits
- Effectively unlimited scale; per-partition limits ~3,000 RCU / 1,000 WCU drive partition spread.
  Item max 400 KB; Query/Scan page at 1 MB. Each write replicates to every GSI (write amplification).
  Transactions span up to 100 items. Throttling surfaces when a partition or table exceeds capacity.

## Operating procedure
1. **Provision** — create the table with the chosen partition/sort key, capacity mode, and any GSIs
   via Terraform `aws_dynamodb_table` or `aws dynamodb create-table`. Enable encryption + PITR.
2. **Configure** — add GSIs/LSIs for each access pattern, set TTL, enable Streams and a DAX cluster
   or global tables if needed; set auto scaling targets on provisioned tables.
3. **Secure** — KMS encryption, least-privilege IAM (leading-key conditions for multi-tenant), VPC
   gateway endpoint, CloudTrail.
4. **Verify** — apply [[verify-by-running]]: `aws dynamodb describe-table` shows the expected keys,
   GSIs, `SSEDescription` (KMS), and `ACTIVE`; a `put-item`/`get-item`/`query` round-trip succeeds
   for the intended principal and returns expected items; an unauthorized principal is denied; check
   CloudWatch `ThrottledRequests` is zero under load.

## Inputs
Access patterns (every query the app runs), key candidates + cardinality, read/write volume +
spikiness (→ capacity mode), consistency needs, multi-Region/active-active need, retention/TTL,
encryption/KMS key, tenancy/isolation model.

## Output
A table definition (keys, capacity mode, GSIs/LSIs, encrypted, PITR on), an access-pattern → key/index
mapping, Streams/DAX/global-table plan, IAM policy, and verification of the schema, encryption, a
working authorized round-trip, denied unauthorized access, and no throttling.

## Notes
- Gotchas: you cannot change a table's primary key or add an LSI after creation (recreate); hot
  partitions throttle even with spare table capacity; Scan is expensive and slow; every GSI multiplies
  write cost and an under-provisioned GSI throttles base-table writes; eventual consistency on GSIs
  and global tables; 400 KB item cap; deleting a table is irreversible without a backup.
- IaC/CLI: Terraform `aws_dynamodb_table` (+ `global_secondary_index`, `ttl`, `point_in_time_recovery`,
  `replica` for global tables), `aws_dynamodb_table_item`, `aws_appautoscaling_target/_policy`. CLI
  `aws dynamodb create-table`, `update-table`, `put-item`, `query`, `update-continuous-backups`.
  CloudFormation `AWS::DynamoDB::Table`, `AWS::DynamoDB::GlobalTable`.
