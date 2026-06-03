---
name: aws-memorydb
description: Use when designing, provisioning, securing, or operating Amazon MemoryDB — the durable, Redis OSS / Valkey-compatible in-memory database. Loads the MemoryDB knowledge: how MemoryDB differs from ElastiCache (a multi-AZ transactional log makes it a durable primary database, not just a cache), the cluster model (shards/node groups each with a primary + up to 5 replicas across AZs), node types (db.t/r families) and sizing, cluster mode and online resharding, microsecond reads / single-digit-ms durable writes, MemoryDB Serverless, automatic failover, snapshots, encryption at rest with KMS and in transit with TLS, ACLs / RBAC users and IAM authentication, and VPC/subnet-group/security-group placement. Covers how to size shards/replicas, place it privately, secure it, and verify durability, connectivity, and failover. Consumed by the MemoryDB specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect). For engine-internal data-structure/command tuning defer to the redis data team.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, memorydb, in-memory, durable-redis, valkey, redis, managed-database]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon MemoryDB

Durable, **Redis OSS / Valkey-compatible** in-memory **database** — microsecond reads and
single-digit-millisecond durable writes, backed by a Multi-AZ transactional log so it survives node
loss without data loss. MemoryDB owns the managed-service layer (cluster topology, durability,
Multi-AZ, backups); engine-internal data-structure design and command-level tuning belong to the
**redis data team**. Choose MemoryDB when Redis is your **primary, durable** datastore; choose
**ElastiCache** for an ephemeral cache, or DynamoDB for serverless KV.

## Core concepts and components
- **Durable primary** — unlike ElastiCache, every write is committed to a distributed, Multi-AZ
  transactional log, so MemoryDB is a system of record, not a cache.
- **Cluster** — sharded: each **shard (node group)** has one primary + up to 5 replicas spread
  across AZs; **cluster mode** distributes keys across shards. **Automatic failover** promotes a
  replica on primary loss with no data loss (log-backed).
- **Node** — a Redis/Valkey node on a **node type** (db.t burstable, db.r memory-optimized).
- **MemoryDB Serverless** — auto-scales capacity with no node/shard sizing.
- **Snapshots** — point-in-time backups to S3 for restore/clone.

## Configuration and sizing
- Size node memory to the working dataset + overhead + replica copies; add shards (cluster mode)
  when one shard's memory or throughput is the limit, and replicas for read scale-out and faster
  failover. Use Serverless for spiky/unknown load. Set eviction/parameters via a custom parameter
  group (but remember MemoryDB is durable — eviction means data loss for a primary store).

## Security and IAM
- Place clusters in **private** subnets, restrict the security group to app SGs. Encryption **at rest
  (KMS) and in transit (TLS) is always on** — use a customer-managed KMS key. Require **ACLs / RBAC
  users**; optionally IAM authentication. Store credentials in Secrets Manager. Gate `memorydb:*`
  with least-privilege IAM; export engine/slow logs and enable CloudTrail.

## Cost levers
- Right-size node type, shard count, and replica count; Reserved Nodes for steady state. Serverless
  bills on data + ECPUs — good for spiky/low-baseline, can exceed reserved nodes at steady high load.
  Fewer replicas if you don't need extra read scale (you still get HA via the log). Scale in
  oversized clusters; snapshots bill on storage.

## Scaling and limits
- Reads scale via replicas (reader endpoint) and memory/writes via shards (cluster mode) with online
  resharding/scaling. Single-threaded per shard caps per-shard CPU. Because it's durable, treat it as
  a database: plan capacity for the full working set, not just hot keys. Cluster-mode clients need
  cluster-aware drivers.

## Operating procedure
1. **Provision** — create a subnet group, parameter group, an ACL, and the cluster (node type,
   shards, replicas-per-shard) via Terraform `aws_memorydb_cluster` (+ `_subnet_group`,
   `_parameter_group`, `_acl`, `_user`) or `aws memorydb create-cluster`.
2. **Configure** — shard/replica counts, parameters, automatic snapshots + retention, reader
   endpoint, or switch to Serverless.
3. **Secure** — private placement, tight security group, KMS at-rest + TLS in-transit (always on),
   ACL/RBAC users in Secrets Manager, least-privilege IAM.
4. **Verify** — apply [[verify-by-running]]: `aws memorydb describe-clusters` shows the KMS key,
   `TLSEnabled=true`, expected shards/replicas, and `available`; connect with `redis-cli --tls`
   (+ ACL user) and run `PING` + a SET/GET round-trip on the primary and a GET on a replica; confirm
   an unauthenticated/public connection is refused; trigger a failover and confirm a replica is
   promoted with no data loss and the endpoint recovers.

## Inputs
Working dataset size + throughput, durability requirement (the reason to pick MemoryDB over
ElastiCache), shard/replica topology, load profile (nodes vs Serverless), snapshot/RPO needs, VPC
placement, KMS key, ACL/RBAC user model.

## Output
A cluster definition (node type, shards, replicas-per-shard, KMS key, TLS on), parameter group,
snapshot config, ACL/RBAC plan, endpoints, and verification of always-on encryption, expected
topology, a working authenticated round-trip (primary + replica), denied public access, and a
no-data-loss failover.

## Notes
- Gotchas: MemoryDB is **durable** (a database) — eviction or under-provisioned memory means real
  data loss, unlike a cache; encryption (at rest + in transit) is mandatory; durable writes are
  single-digit-ms (slower than a non-durable cache write); single-threaded per shard caps per-shard
  CPU; cluster-mode needs cluster-aware clients; deleting a cluster without a final snapshot loses data.
- IaC/CLI: Terraform `aws_memorydb_cluster`, `aws_memorydb_subnet_group`,
  `aws_memorydb_parameter_group`, `aws_memorydb_acl`, `aws_memorydb_user`,
  `aws_memorydb_snapshot`. CLI `aws memorydb create-cluster`, `create-subnet-group`, `create-acl`,
  `create-snapshot`, `failover-shard`. CloudFormation `AWS::MemoryDB::Cluster`,
  `AWS::MemoryDB::SubnetGroup`, `AWS::MemoryDB::ACL`, `AWS::MemoryDB::User`.
