---
name: gcp-memorystore
description: Use when designing, provisioning, securing, or operating Memorystore — Google Cloud's fully managed in-memory data store for Redis (and Redis Cluster) and Memcached, with service tiers (Basic vs Standard HA with replicas/automatic failover), node/shard sizing, read replicas, persistence (RDB/AOF), maintenance windows, and private VPC connectivity, plus IAM/AUTH, in-transit TLS, and cost/scaling levers. Loads the Memorystore knowledge: pick Redis vs Memcached and a tier, size memory/shards/replicas, enable HA and persistence, secure with private IP and AUTH/TLS, and verify connectivity and failover. Consumed by the Memorystore specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they handle managed in-memory cache workloads (Memorystore).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, memorystore, databases, redis, memcached, cache, high-availability]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Memorystore

Google Cloud's fully managed in-memory data store providing **Redis** (including **Redis Cluster**) and
**Memcached** for low-latency caching, session stores, leaderboards, and pub/sub. Google manages
provisioning, patching, replication, and failover; instances live on a customer VPC via private IP.

## Core concepts and components
- **Engines** — **Redis** (rich data structures, persistence, pub/sub, single-shard or **Redis Cluster**
  with sharding) and **Memcached** (simple, multi-threaded, sharded key/value cache with no
  persistence/replication).
- **Service tiers (Redis)** — **Basic** (single node, no failover, cache-only) vs **Standard** (primary +
  **replica(s)** across zones with **automatic failover** and a read endpoint). Redis Cluster shards data
  across multiple primaries with replicas.
- **Sizing** — Redis Basic/Standard sized by **memory capacity (GB)**; Redis Cluster and Memcached sized
  by **shards/nodes × per-node memory + vCPU**. Read replicas add read throughput.
- **Persistence (Redis)** — optional **RDB** snapshots and/or **AOF** for durability across restarts;
  Basic tier and Memcached are not durable.
- **Maintenance** — Google-managed updates within a configurable **maintenance window**; **config
  parameters** tune engine behavior (e.g., `maxmemory-policy`).
- **Connectivity** — **private IP** on a VPC (private services access / PSC); no public endpoint.

## Configuration and sizing
- Choose **Redis vs Memcached**, then the **tier** (Redis Standard for HA) and **capacity** sized to the
  working set plus headroom for replication/fork overhead. For sharding use **Redis Cluster** or Memcached
  node counts; add **read replicas** for read scale. Set the **eviction policy** (`maxmemory-policy`),
  persistence (RDB/AOF), and maintenance window.

## Security and IAM
- Grant least-privilege roles (`roles/redis.viewer`, `roles/redis.editor`, `roles/redis.admin`;
  `roles/memcache.*`). Enable **Redis AUTH** and **in-transit TLS**; deploy on **private IP** only
  (no public access); restrict the VPC/firewall; audit via Cloud Audit Logs. CMEK is available for
  persistence where supported.

## Cost levers
- The dominant levers are **provisioned memory (GB)**, **tier** (Standard/HA and replicas multiply cost),
  **shard/node count** (Redis Cluster/Memcached), and **read replicas**. Right-size capacity to the
  working set, choose Basic only for non-critical caches, scale replicas to read load, and avoid
  over-provisioning shards. Memory is billed whether used or not.

## Scaling and limits
- Redis Basic/Standard scale **vertically** (resize capacity, brief impact); **Redis Cluster** and
  **Memcached** scale **horizontally** by adding shards/nodes. Read replicas scale reads. Limits: max
  capacity per instance/tier, max shards/replicas, single-key/structure size limits, and per-region
  quotas. Scaling a non-cluster Redis instance can disrupt connections briefly.

## Operating procedure
1. **Provision** — enable the Memorystore (Redis/Memcached) API and create the instance
   (Terraform `google_redis_instance` / `google_redis_cluster` / `google_memcache_instance`) with engine,
   **tier**, capacity/shards, region/zones, and **private IP** via private services access.
2. **Configure** — set **read replicas**, engine **config parameters** (eviction policy, etc.),
   persistence (RDB/AOF) for Redis, and the maintenance window.
3. **Secure** — enable **AUTH** and **TLS**, keep it private-IP only, restrict VPC/firewall, apply
   CMEK where supported, and enable audit logging.
4. **Verify** — apply [[verify-by-running]]: connect from a VPC client over TLS (`redis-cli` with AUTH /
   `gcloud redis instances describe`), run `PING`/`SET`/`GET` (or Memcached `stats`), confirm the read
   endpoint serves reads, and for Standard tier validate **automatic failover** behavior / replica state —
   capture the connection, command output, and failover/replica status.

## Inputs
Use case (cache/session/leaderboard/pub-sub), engine (Redis vs Memcached), HA/durability needs (tier +
persistence), working-set size + growth, read throughput, sharding requirements, region/zones,
connectivity (private IP/PSC), AUTH/TLS/CMEK requirements, and cost ceiling.

## Output
A Memorystore setup (Redis or Memcached instance/cluster at the chosen tier with sized memory/shards,
read replicas, persistence, eviction policy, maintenance window) on private networking with AUTH, TLS,
and least-privilege IAM, plus verification of connectivity, reads, and failover.

## Notes
- Gotchas: Basic tier and Memcached are **not durable** and have no failover (data loss on
  restart/eviction); memory is billed at provisioned size regardless of use; the `maxmemory-policy` /
  eviction choice changes correctness for cache vs store use; Redis fork/replication needs memory
  headroom; scaling/maintenance on non-cluster Redis can briefly drop connections; public access is not
  available — clients must be on the VPC.
- IaC/CLI: Terraform `google_redis_instance`, `google_redis_cluster`, `google_memcache_instance`, plus
  `google_project_service` and private-services-access/PSC resources. CLI `gcloud redis`
  (instances/clusters) and `gcloud memcache`, with `redis-cli` for the data path.
