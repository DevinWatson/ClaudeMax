---
name: redis-administration
description: The substantive raw-Redis-engine capability — data structures (strings, hashes, lists, sets, sorted-sets, streams, bitmaps, HyperLogLog), caching patterns (cache-aside, write-through, eviction policies, TTL/expiry), persistence (RDB snapshots, AOF, hybrid), replication (primary/replica), Redis Cluster (sharding, hash slots, resharding), pub/sub and keyspace notifications, Lua scripting and transactions (MULTI/EXEC/WATCH), Sentinel HA/failover, memory optimization (maxmemory, eviction, fragmentation), and tooling (redis-cli, INFO, SLOWLOG, MONITOR). Use when administering, tuning, scaling, replicating, securing, or operating a self-managed Redis instance/cluster. Any agent operating a Redis instance can load it. NOT for managed cloud Redis (AWS ElastiCache, GCP MemoryStore, Azure Cache for Redis — the cloud data-engineers own those), cloud-agnostic pipeline orchestration, relational/document engines (Postgres/MongoDB), or single SQL query rewrites (Redis isn't SQL).
allowed-tools: Read, Grep, Glob, Bash
category: data
tags: [redis, caching, data-structures, persistence, replication, cluster, sentinel, eviction, pubsub, lua]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Redis Administration

The substantive raw-Redis-engine capability: choosing the right data structures, applying caching
patterns and eviction policies, configuring persistence and replication, sharding with Redis Cluster,
using pub/sub and keyspace notifications, scripting atomic operations with Lua and transactions,
hardening HA with Sentinel, optimizing memory, and operating the engine with the standard tooling.
This is engine-level administration of a self-managed instance/cluster — not a managed cloud cache,
not a relational/document engine, and not SQL.

## When to use this skill
Whenever the work targets the Redis engine itself: picking a data structure for an access pattern,
designing a cache-aside or write-through layer with the right `maxmemory-policy` and TTLs, configuring
RDB/AOF persistence, standing up primary/replica replication or a Redis Cluster and resharding hash
slots, wiring pub/sub or keyspace notifications, writing a Lua script or `MULTI/EXEC` transaction for
atomicity, setting up Sentinel failover, diagnosing memory fragmentation or eviction storms, or running
`redis-cli`/`INFO`/`SLOWLOG`/`MONITOR`. Pair it with the verification skill to confirm any change
against a live instance. Do NOT use it for managed cloud Redis (ElastiCache/MemoryStore/Azure Cache),
cloud-agnostic pipeline orchestration, Postgres/MongoDB, or SQL query rewrites.

## Instructions
1. **Establish context first.** Capture the Redis version, deployment topology (standalone,
   primary/replica, Sentinel, or Cluster), the role this instance plays (cache vs durable store vs
   queue), the workload (read/write ratio, key cardinality, value sizes, ops/sec), host resources
   (RAM, cores), and current config via `CONFIG GET *` and `INFO`. Read the `redis.conf`, any Sentinel
   or cluster config, and the client access pattern before changing anything. Confirm whether the
   target is production and what a safe change window is.
2. **Choose data structures for the access pattern.** Map each use case to the right type: **strings**
   for simple values/counters (`INCR`), **hashes** for objects/field access, **lists** for queues/stacks
   (`LPUSH`/`BRPOP`), **sets** for membership/uniqueness, **sorted-sets** for leaderboards/rate-limits/
   priority by score, **streams** for append-only logs and consumer groups (`XADD`/`XREADGROUP`),
   **bitmaps** for compact boolean state, and **HyperLogLog** (`PFADD`/`PFCOUNT`) for approximate
   cardinality at fixed memory. Prefer the structure whose native ops avoid round-trips and large reads.
3. **Apply caching patterns and expiry.** Implement **cache-aside** (read-through on miss, write to
   cache after DB read) or **write-through**/**write-behind** when the cache fronts a system of record;
   set per-key TTLs (`EX`/`PX`, `EXPIRE`) sized to staleness tolerance, and add jitter to avoid
   thundering-herd expiry. Choose the **eviction policy** (`maxmemory-policy`) deliberately —
   `allkeys-lru`/`allkeys-lfu` for a pure cache, `volatile-*` when only some keys may be evicted,
   `noeviction` for a durable store — and set `maxmemory` to leave headroom for fork/copy-on-write.
4. **Configure persistence to the durability requirement.** Decide **RDB** (point-in-time snapshots via
   `save`/`bgsave` — compact, fast restart, can lose recent writes), **AOF** (`appendonly yes` with
   `appendfsync everysec`/`always` — durable, larger, rewrite via `BGREWRITEAOF`), or the **hybrid**
   `aof-use-rdb-preamble`. For a pure cache, persistence can be disabled; for a durable store, prefer
   AOF (`everysec`) plus periodic RDB. Account for fork memory and disk I/O during snapshot/rewrite.
5. **Replicate for read scaling and HA.** Configure primary/replica with `replicaof`; understand
   asynchronous replication (replicas can lag and lose recent writes on failover), `replica-read-only`,
   and `min-replicas-to-write` to bound write exposure. Monitor replication offset/lag via `INFO
   replication`. Replicas serve reads and seed failover but are not a backup.
6. **Shard with Redis Cluster when one node is not enough.** Use Cluster for horizontal scale across
   the 16384 **hash slots**; understand slot assignment, `MOVED`/`ASK` redirects, hash tags
   (`{...}`) to co-locate related keys, and multi-key command limits across slots. Reshard with
   `redis-cli --cluster reshard`/`rebalance`, add/remove nodes, and verify slot coverage and
   replica placement. Distinguish Cluster (sharding) from Sentinel (HA for a non-sharded primary).
7. **Wire pub/sub and keyspace notifications.** Use `PUBLISH`/`SUBSCRIBE` (fire-and-forget, no
   persistence — use Streams for durable messaging) for ephemeral fan-out, and enable **keyspace
   notifications** (`notify-keyspace-events`) to react to key events (expiry, eviction, writes). Note
   that pub/sub messages are lost if no subscriber is connected.
8. **Make multi-step operations atomic with Lua and transactions.** Use `MULTI`/`EXEC` with `WATCH`
   for optimistic-locking transactions, or **Lua scripts** (`EVAL`/`EVALSHA`) for atomic read-modify-write
   server-side logic that avoids round-trips and races. Keep scripts short (they block the single
   thread), pass keys via `KEYS[]` for Cluster compatibility, and cache by SHA with `SCRIPT LOAD`.
9. **Harden HA with Sentinel.** Configure **Sentinel** (`sentinel monitor`, quorum, `down-after-
   milliseconds`, `failover-timeout`) across an odd number of sentinels for automatic primary failover
   and client discovery. Ensure clients are Sentinel-aware, validate quorum and split-brain behavior,
   and rehearse a failover. Sentinel provides HA for non-sharded deployments; Cluster has its own
   failover.
10. **Optimize memory and operate the engine.** Read `INFO memory` (`used_memory`,
    `mem_fragmentation_ratio`), use `MEMORY USAGE`/`MEMORY DOCTOR` and `--bigkeys`/`OBJECT ENCODING`
    to find heavy or poorly-encoded keys (favor small hashes/ziplists, shorter key names, integer
    encodings), set `maxmemory` and the eviction policy, and consider `activedefrag` for fragmentation.
    Diagnose with `SLOWLOG GET`, `LATENCY` commands, and (briefly, never long-running in prod) `MONITOR`.
    Confirm every config change, persistence/replication/failover step against a live or staging
    instance with [[verify-by-running]] — report the exact command and the observed result, not just
    that the syntax is valid.

## Inputs
- The Redis version and topology (standalone/replica/Sentinel/Cluster); the instance's role
  (cache/durable store/queue); workload shape (read/write ratio, key cardinality, value sizes,
  ops/sec); host resources (RAM/cores); current `redis.conf`, Sentinel/cluster config, and
  `CONFIG GET`/`INFO` output; the durability requirement and any RTO/RPO; and the change window.

## Output
- A concern-by-concern recommendation (data structures, caching/eviction, persistence, replication,
  cluster/sharding, pub/sub, Lua/transactions, Sentinel HA, memory) with each mechanism/setting named
  and the trade-off justified, plus the restart-vs-`CONFIG SET` impact and blast radius of each change.
- Where changes are made: the config/command/script steps as diffs or runnable `redis-cli` steps, plus
  the validation command(s) run (`INFO`, `SLOWLOG`, a failover/restore drill) and the observed result.

## Notes
- This is engine-level Redis administration of a self-managed instance/cluster — confirm every applied
  change with [[verify-by-running]] against a live or staging instance.
- The most common failures are an unbounded dataset with `noeviction` (OOM), TTL-less keys that never
  expire, treating replicas/RDB as a substitute for backups, blocking the single thread with long Lua
  scripts or `KEYS *` scans (use `SCAN`), and assuming pub/sub is durable (use Streams).
- Treat `FLUSHALL`/`FLUSHDB`, eviction-policy and `maxmemory` changes, persistence reconfiguration,
  failover/promotion, and cluster resharding as high-blast-radius: surface the effect and require
  explicit confirmation before running them on a primary.
