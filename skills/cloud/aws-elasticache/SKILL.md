---
name: aws-elasticache
description: Use when designing, provisioning, securing, or operating Amazon ElastiCache — the managed in-memory cache/datastore service for Redis OSS / Valkey and Memcached. Loads the ElastiCache knowledge: choosing the engine (Redis/Valkey for rich types, replication, persistence-ish, and clustering vs Memcached for simple multi-threaded caching), node types (cache.t/m/r families) and sizing, cluster topology (shards + replicas, cluster mode enabled/disabled), Multi-AZ with automatic failover, ElastiCache Serverless, replication groups and reader endpoints, snapshots/backups, encryption at rest with KMS and in transit with TLS, AUTH / Redis ACLs and RBAC, and VPC/subnet-group/security-group placement. Covers how to pick an engine, size nodes, place it privately, secure it, and verify connectivity and failover. Consumed by the ElastiCache specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect). For engine-internal data-structure/eviction tuning defer to the redis data team.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, elasticache, in-memory, cache, redis, valkey, memcached]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon ElastiCache

Managed **in-memory** cache and datastore that runs **Redis OSS / Valkey** or **Memcached** for
microsecond-latency caching, sessions, leaderboards, and pub/sub. ElastiCache owns the
managed-service layer (engine/node selection, topology, Multi-AZ, backups); engine-internal
data-structure design, eviction/TTL policy, and command-level tuning belong to the **redis data
team**. Choose ElastiCache for an ephemeral cache; choose **MemoryDB** when you need Redis as a
durable primary database; DynamoDB for serverless KV persistence.

## Core concepts and components
- **Engines** — **Redis/Valkey**: rich data types, replication, snapshots, pub/sub, clustering,
  single-threaded per shard. **Memcached**: simple, multi-threaded, sharded key-value with no
  replication or persistence.
- **Node** — a cache instance on a **node type** (cache.t burstable, cache.m general, cache.r
  memory-optimized). **Cluster / replication group** — for Redis, shards (node groups) each with a
  primary + up to 5 replicas; **cluster mode enabled** spreads keys across shards, **disabled** is a
  single shard with replicas.
- **Multi-AZ + automatic failover** promotes a replica on primary loss. **Reader endpoint**
  load-balances reads across replicas. **ElastiCache Serverless** auto-scales capacity, no node sizing.

## Configuration and sizing
- Pick Redis/Valkey for anything needing data structures, replication, or pub/sub; Memcached only
  for simple, horizontally-sharded caching. Size node memory to the working set + overhead + replica
  copies; enable cluster mode when one shard's memory or throughput is the limit. Set a maxmemory
  eviction policy. Use Serverless for spiky/unknown load. Always use a custom parameter group.

## Security and IAM
- Place clusters in **private** subnets, restrict the security group to app SGs. Encrypt at rest with
  a customer-managed KMS key and enable **in-transit TLS**. Require **Redis AUTH** or **Redis ACLs /
  RBAC** (per-user); optionally IAM authentication for Redis. Store AUTH tokens in Secrets Manager.
  Gate `elasticache:*` with least-privilege IAM; enable CloudWatch + slow-log/engine-log export.

## Cost levers
- Right-size node type and replica count; Reserved Nodes for steady state. Serverless bills on
  data stored + ECPUs — good for spiky/low-baseline, can cost more at steady high load than reserved
  nodes. Fewer replicas if you don't need read scale/HA; scale in oversized clusters.

## Scaling and limits
- Redis scales reads via replicas (reader endpoint) and writes/memory via shards (cluster mode);
  online resharding and scaling up/out are supported. Memcached scales by adding nodes (client-side
  sharding). Single-threaded Redis means one CPU per shard caps per-shard throughput. Cache data is
  ephemeral — treat it as a cache, not a system of record.

## Operating procedure
1. **Provision** — create a subnet group, parameter group, and the cluster/replication group (engine,
   node type, shards/replicas, cluster mode, Multi-AZ) via Terraform `aws_elasticache_replication_group`
   /`aws_elasticache_cluster` or `aws elasticache create-replication-group`.
2. **Configure** — eviction policy + parameters, automatic backups (Redis), reader endpoint, Multi-AZ
   failover, or switch to Serverless.
3. **Secure** — private placement, tight security group, KMS at-rest + TLS in-transit, Redis
   AUTH/ACLs in Secrets Manager, least-privilege IAM.
4. **Verify** — apply [[verify-by-running]]: `aws elasticache describe-replication-groups` shows
   `AtRestEncryptionEnabled`/`TransitEncryptionEnabled` true, `AutomaticFailover=enabled`, and
   `available`; connect with `redis-cli --tls -a <auth>` and run `PING` + a SET/GET round-trip on the
   primary and a GET on the reader endpoint; confirm an unauthenticated/public connection is refused;
   trigger a `test-failover` and confirm a replica is promoted and the endpoint recovers.

## Inputs
Engine (Redis/Valkey vs Memcached), working-set size + throughput, read scale/HA need (replicas,
Multi-AZ), cluster-mode (sharding) need, load profile (nodes vs Serverless), persistence/snapshot
need, VPC placement, encryption/KMS key, AUTH/ACL model.

## Output
A cluster/replication-group definition (engine, node type, shards/replicas, encrypted, Multi-AZ),
parameter group, backup config, endpoints, AUTH/ACL plan, and verification of at-rest + in-transit
encryption, automatic failover, a working authenticated round-trip (primary + reader), denied public
access, and a successful test failover.

## Notes
- Gotchas: ElastiCache is a **cache**, not durable storage — use MemoryDB if you need a durable Redis
  primary; in-transit encryption and AUTH must be set up front (changing them is disruptive);
  Memcached has no replication/persistence/failover; single-threaded Redis caps per-shard CPU;
  cluster-mode clients need cluster-aware drivers; resizing/resharding can briefly affect latency.
- IaC/CLI: Terraform `aws_elasticache_replication_group`, `aws_elasticache_cluster`,
  `aws_elasticache_subnet_group`, `aws_elasticache_parameter_group`, `aws_elasticache_user`/`_user_group`,
  `aws_elasticache_serverless_cache`. CLI `aws elasticache create-replication-group`,
  `create-cache-cluster`, `test-failover`, `create-snapshot`. CloudFormation
  `AWS::ElastiCache::ReplicationGroup`, `AWS::ElastiCache::CacheCluster`, `AWS::ElastiCache::ServerlessCache`.
