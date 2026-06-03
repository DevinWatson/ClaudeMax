---
name: mongodb-administration
description: The substantive MongoDB capability — document data modeling and schema design (embedding vs referencing, the bucket/outlier/computed/subset patterns), the aggregation pipeline, indexes (single/compound/multikey/text/wildcard and the ESR rule), sharding and shard-key selection, replica sets (elections, oplog, read preference, read/write concerns), change streams, multi-document transactions, Atlas vs self-managed operations, performance analysis via explain plans, and tooling (mongosh, mongodump/mongorestore). Use when modeling, indexing, aggregating, sharding, replicating, securing, tuning, or operating a MongoDB deployment (Atlas or self-managed). Any agent operating MongoDB can load it. NOT for relational/SQL engines (PostgreSQL), managed cloud DW/pipelines (BigQuery/Synapse/Redshift), Supabase BaaS, cloud-agnostic pipeline orchestration design, or isolated single-SQL-query rewrites.
allowed-tools: Read, Grep, Glob, Bash
category: data
tags: [mongodb, document-modeling, aggregation-pipeline, indexing, sharding, replica-set, change-streams, transactions, atlas, mongosh]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# MongoDB Administration

The substantive MongoDB capability: modeling documents (embedding vs referencing and the schema
design patterns), building aggregation pipelines, designing indexes with the ESR rule, choosing a
shard key and scaling out, operating replica sets for HA, streaming changes, running multi-document
transactions, operating Atlas or self-managed clusters, reading explain plans, and driving the
standard tooling. This is document-database engine work — not a relational/SQL engine, not a managed
cloud warehouse, and not an isolated query rewrite.

## When to use this skill
Whenever the work targets MongoDB itself: deciding what to embed vs reference and applying the
bucket/outlier/computed/subset patterns; writing or tuning an aggregation pipeline; choosing index
types and ordering compound keys; selecting a shard key and planning chunk distribution; configuring
a replica set, read preference, and read/write concerns; wiring change streams; running
multi-document transactions; operating Atlas or a self-managed cluster; diagnosing a slow operation
with `explain`; or running `mongosh`/`mongodump`/`mongorestore`. Pair it with the verification skill
to confirm any change against a live deployment. Do NOT use it for relational/SQL engines, managed
cloud DW/pipelines, Supabase BaaS, cloud-agnostic orchestration design, or an isolated SQL rewrite.

## Instructions
1. **Establish context first.** Capture the MongoDB version, deployment type (Atlas tier vs
   self-managed replica set/sharded cluster), topology (members, regions), the workload shape
   (read/write ratio, document size, access patterns), the collections and existing indexes
   (`db.coll.getIndexes()`), and current concerns (`rs.status()`, `sh.status()`, `db.serverStatus()`).
   Read the existing schema/usage before changing anything; confirm whether the target is production
   and the safe change window.
2. **Model documents to the access patterns.** Design for how data is read, not normalized purity.
   **Embed** when data is accessed together and the child is bounded (one-to-few) — single-document
   reads and atomic updates. **Reference** when the related set is large/unbounded (one-to-many,
   many-to-many), independently mutated, or shared. Apply the schema patterns deliberately: **bucket**
   (group time-series/IoT readings into capped sub-arrays to cut document count), **outlier** (handle
   the rare oversized document separately), **computed** (pre-aggregate read-heavy rollups on write),
   and **subset** (embed only the hot slice, reference the rest). Respect the 16 MB document limit and
   avoid unbounded array growth.
3. **Build aggregation pipelines deliberately.** Compose `$match`/`$project` early to shrink the
   stream, then `$group`/`$lookup`/`$unwind`/`$facet`/`$bucket` as needed. Push `$match` and `$sort`
   before `$group` so indexes apply; prefer `$lookup` only when a reference must be joined and watch
   its cost. Mind the 100 MB per-stage memory limit (`allowDiskUse` for large sorts/groups), use
   `$merge`/`$out` for materialized rollups, and validate the stage order with `explain`.
4. **Design indexes for the queries and the ESR rule.** Choose the type by access pattern: **single**
   for one-field predicates, **compound** for multi-field filters/sorts, **multikey** (automatic) for
   array fields, **text** for search, **wildcard** for unpredictable/polymorphic key sets, plus
   geospatial/hashed where needed. Order compound-index keys by **ESR**: **E**quality fields first,
   then **S**ort fields, then **R**ange fields — so the index serves filter and sort without an
   in-memory sort. Use partial/sparse/TTL indexes for selectivity and expiry; target covered queries;
   drop unused indexes (check `$indexStats`).
5. **Shard for horizontal scale only when needed.** Pick the **shard key** to spread writes and route
   reads: prefer high-cardinality, low-frequency keys; use **hashed** sharding for even write
   distribution on monotonic keys (e.g. `_id`/timestamps) or **ranged** when range queries must be
   targeted; consider a compound/`refineCollectionShardKey` design. Avoid monotonically increasing
   ranged keys (hot chunk) and low-cardinality keys (jumbo chunks). Ensure queries include the shard
   key to stay targeted rather than scatter-gather; understand the balancer and chunk migration.
6. **Operate the replica set for HA.** Understand **elections** (majority vote, priority, the primary
   step-down) and the **oplog** (sizing for replication window and PITR). Set **read preference**
   (`primary`/`primaryPreferred`/`secondary`/`nearest`) per workload and tolerance for staleness, and
   choose **write concern** (`w: "majority"` for durability vs `w: 1` for latency, with `wtimeout`)
   and **read concern** (`local`/`majority`/`snapshot`/`linearizable`) for the consistency the use
   case needs. Monitor replication lag and member health.
7. **Use change streams and transactions where they fit.** Use **change streams**
   (`db.coll.watch()` with a resume token) for event-driven reactions to inserts/updates/deletes
   instead of polling; they require a replica set and respect read concern. Use **multi-document
   transactions** only when a single well-modeled document cannot express the atomic unit — keep them
   short, expect retryable transient errors, and prefer redesigning the schema so the atomic update
   fits one document.
8. **Decide Atlas vs self-managed operations.** On **Atlas**, drive provisioning, auto-scaling,
   backups/PITR, alerting, and the Performance Advisor through the managed surface, and respect tier
   limits. **Self-managed**: configure `mongod`/`mongos`/config servers, the storage engine cache
   (WiredTiger), authentication/authorization (SCRAM/x.509, role-based access), TLS, and your own
   backup/monitoring. State which surface applies before recommending an operational action.
9. **Analyze performance with explain plans.** Run `db.coll.find(...).explain("executionStats")` (or
   `aggregate(..., {explain:true})`) and read the **winning plan**: prefer `IXSCAN` over `COLLSCAN`,
   compare `totalDocsExamined`/`totalKeysExamined` against `nReturned` (close to 1:1 is good), watch
   for in-memory `SORT` stages (add an index per ESR), and check `executionTimeMillis`. Profile slow
   ops with the database profiler / Atlas Performance Advisor; never optimize on assumption.
10. **Operate with the standard tooling.** Use **`mongosh`** for inspection and admin
    (`db.coll`, `explain`, `rs.status()`, `sh.status()`, index management); **`mongodump`/`mongorestore`**
    for logical backup/migration (with `--archive`/`--gzip`, and `--oplog` for point-in-time
    consistency). Confirm every schema/index/shard/replication/backup change against a live or staging
    deployment with [[verify-by-running]] — report the exact command and the observed result
    (`explain` output, `rs.status()`, a test restore), not just that the syntax is valid.

## Inputs
- The MongoDB version and deployment type (Atlas tier vs self-managed); topology and regions; workload
  shape, document sizes, and access patterns; the collections, schema, and existing indexes; current
  `rs.status()`/`sh.status()`/`serverStatus()`; and the target consistency/durability and change window.

## Output
- A concern-by-concern recommendation (document model, aggregation, indexing/ESR, sharding/shard key,
  replica set/read-write concerns, change streams/transactions, Atlas-vs-self-managed ops) with each
  pattern/mechanism named and the trade-off justified, plus the operational blast radius of each change.
- Where changes are made: the schema/index/shard/config/tooling commands as runnable steps or diffs,
  plus the validation command(s) run (`explain("executionStats")`, `rs.status()`, restore drill) and the
  observed result.

## Notes
- This is document-database engine work: model to the access patterns rather than normalizing, and
  confirm every applied change with [[verify-by-running]] against a live or staging deployment.
- The most common failures are a poor shard key (hot chunk / scatter-gather), unbounded array growth
  past 16 MB, compound indexes that ignore the ESR rule (forcing in-memory sorts), and tuning by
  assumption — always read the `explain` plan, not guesses.
- Treat shard-key choice (effectively immutable), index builds on large collections, restores, and
  replica-set reconfiguration as high-blast-radius: surface the effect and require explicit
  confirmation before running them against production.
