---
name: azure-cache-for-redis
description: Use when designing, provisioning, securing, or operating Azure Cache for Redis — Azure's fully managed in-memory Redis cache/data store PaaS (Azure Cache for Redis). Covers the tiers (Basic, Standard, Premium, Enterprise, Enterprise Flash), clustering/sharding, data persistence (RDB/AOF), zone redundancy, active geo-replication, eviction policies and maxmemory, modules (RediSearch/RedisJSON/RedisTimeSeries/RedisBloom on Enterprise), Entra ID/microsoft-identity auth and access keys, managed identities, private endpoints/VNet, and TLS. Loads the knowledge: pick a tier and size, choose clustering/persistence/geo-replication, provision, secure, and verify the cache answers PING/SET/GET. Consumed by the azure-cache-for-redis specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Cache for Redis).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-cache-for-redis, databases, redis, cache, in-memory]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Cache for Redis

Azure's **fully managed in-memory Redis** cache and data store. Azure runs the nodes, patching, failover,
and replication; you own the **cache instance**, its tier/size, clustering, persistence, eviction, and
access policy. This skill owns the **managed-service layer** — provisioning, sizing, HA/geo-replication,
persistence, and auth — not Redis data-structure/command-level application design, which is the Redis engine
team's job.

## Core concepts and components
- **Tiers** — **Basic** (single node, no SLA, dev only), **Standard** (replicated two-node primary/replica
  with SLA), **Premium** (clustering, persistence, zone redundancy, VNet injection, geo-replication, larger
  sizes), **Enterprise** / **Enterprise Flash** (Redis Enterprise: modules, active geo-replication,
  higher throughput; Flash tier uses NVMe to extend memory cost-effectively).
- **Clustering / sharding** — Premium and Enterprise shard data across nodes to scale memory and throughput;
  clients must be cluster-aware.
- **Persistence** — **RDB** snapshots and/or **AOF** append-only logging (Premium+) to survive node loss;
  caches are otherwise volatile.
- **High availability** — primary/replica failover (Standard+) and **zone redundancy** (Premium/Enterprise).
- **Geo-replication** — **passive** (Premium, one-way to a linked secondary) or **active** (Enterprise,
  multi-region read/write).
- **Eviction & maxmemory** — eviction policy (e.g. `allkeys-lru`, `volatile-ttl`, `noeviction`) governs
  behavior when memory fills; `maxmemory-reserved` headroom matters.
- **Modules (Enterprise)** — RediSearch, RedisJSON, RedisTimeSeries, RedisBloom.

## Configuration and sizing
- Pick a **tier** by need: Basic for dev, Standard for simple HA caching, **Premium** for clustering/
  persistence/zone-redundancy/VNet/geo-replication, **Enterprise/Flash** for modules/active geo-replication/
  high throughput. Size the **cache (memory)**, enable **clustering** (set shard count) for scale-out,
  configure **persistence** (RDB/AOF) if data must survive restarts, set the **eviction policy** and
  `maxmemory-reserved`, and enable **zone redundancy** and **geo-replication** for HA/DR.

## Security and IAM
- Prefer **Microsoft Entra ID (microsoft-identity) authentication** with **managed identity** and Redis ACL
  data-access roles over **access keys**; **disable access-key auth** where possible and rotate keys
  otherwise. Restrict the network with **private endpoint** (or VNet injection on Premium) and disable
  public access. Enforce **TLS** (require min TLS 1.2, disable non-TLS port). Scope ACLs least-privilege.

## Cost levers
- Billed on **tier × cache size (per node/shard) + replicas + geo-replication + zones**. Levers: right-size
  the **tier and memory**, use **Enterprise Flash** to extend memory on NVMe cheaper than RAM, scale shard
  count to demand, enable persistence/zone-redundancy/geo-replication only when needed (each adds nodes/
  cost), and use Basic/Standard for dev/non-critical caches. Reserved pricing exists for steady Enterprise.

## Scaling and limits
- **Scale up** the tier/size (Premium scale is online; Basic↔Standard↔Premium changes can disrupt and some
  are one-way), **scale out** shards on Premium/Enterprise (rebalances data). Limits: connection count and
  bandwidth per tier/size, shard count caps, and downgrades/tier changes that require recreation. Persistence
  and geo-replication require Premium+/Enterprise.

## Operating procedure
1. **Provision** — create the cache at the chosen **tier/SKU/capacity** via Terraform `azurerm_redis_cache`
   (or `azurerm_redis_enterprise_cluster` + `_database` for Enterprise) or Bicep `Microsoft.Cache/redis`
   (`/redisEnterprise`), or `az redis create` / `az redisenterprise create`.
2. **Configure** — set **clustering** (shard count), **persistence** (RDB/AOF), **eviction policy** +
   `maxmemory-reserved`, **zone redundancy**, and **geo-replication** (passive/active); enable modules on
   Enterprise.
3. **Secure** — enable **Entra (microsoft-identity) auth** with a **managed identity** and ACL roles,
   disable access keys where feasible, enforce **TLS 1.2** and disable the non-TLS port, and add a **private
   endpoint**/VNet (disable public).
4. **Verify** — apply [[verify-by-running]]: confirm `provisioningState` is `Succeeded` (`az redis show`),
   then **connect over TLS and run commands** (`redis-cli -h <host> -p 6380 --tls` then `PING` / `SET k v` /
   `GET k`, or app via managed identity) and confirm geo/replica state if configured. Capture state and the
   command output.

## Inputs
The cache role and working-set size, durability need (volatile vs persisted), HA/DR target (zone redundancy/
geo-replication), throughput/connection profile (drives clustering/tier), module needs (Enterprise), auth
model (Entra/managed identity vs keys), network exposure (private endpoint/VNet), TLS policy, and region(s).

## Output
An Azure Cache for Redis setup: a cache at the chosen tier/size with optional clustering, persistence,
zone redundancy and geo-replication, secured by Entra/managed identity, TLS, and private networking — plus
verification that the cache is Succeeded and answers PING/SET/GET.

## Notes
- Gotchas: **Basic has no SLA** (single node) — never production; **persistence/clustering/geo-replication/
  zone-redundancy require Premium+ or Enterprise**; some **tier changes require recreation** (data loss for a
  pure cache); `noeviction` + full memory rejects writes; not disabling the non-TLS port and access keys is a
  common security gap; clients must be **cluster-aware** when clustering is on; Enterprise modules only on
  Enterprise tiers. Redis data-structure/command/application patterns belong to the Redis engine team under
  `agents/data/`. 2nd consumer: the Azure role team (azure-iac-engineer / azure-cloud-architect). Cross-cloud
  peers: AWS ElastiCache, GCP Memorystore.
- IaC/CLI: Terraform `azurerm_redis_cache` (+ `azurerm_redis_enterprise_cluster` / `_database`); Bicep/ARM
  `Microsoft.Cache/redis` (`/redisEnterprise`). CLI `az redis create` / `az redis show` / `az redisenterprise
  create`; verify with `redis-cli --tls PING`.
