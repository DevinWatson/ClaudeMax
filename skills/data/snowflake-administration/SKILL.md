---
name: snowflake-administration
description: The substantive Snowflake data-warehouse capability — virtual warehouses (sizing, auto-suspend/resume, multi-cluster scaling), micro-partitions and clustering keys and partition pruning, cost/credit management and resource monitors, RBAC (roles, grants, role hierarchy, secure views), secure data sharing and the Marketplace, ingestion (Snowpipe, streams, tasks, COPY), Time Travel/zero-copy cloning/Fail-safe, and query optimization (query profile, result cache, materialized views, search optimization). Use when administering, sizing, securing, ingesting into, governing the cost of, or optimizing a Snowflake account/warehouse/database. Any agent operating Snowflake can load it. NOT for cloud-managed warehouses on other platforms (Redshift/BigQuery/Synapse — the AWS/GCP/Azure data-engineers own those), self-managed PostgreSQL/MongoDB/Redis engines, managed Supabase BaaS, cloud-agnostic pipeline orchestration design, or single-query SQL rewrites in isolation.
allowed-tools: Read, Grep, Glob, Bash
category: data
tags: [snowflake, data-warehouse, virtual-warehouse, micro-partitions, clustering, rbac, snowpipe, time-travel, cost-management, query-optimization]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# Snowflake Administration

The substantive Snowflake capability: sizing and scaling virtual warehouses, exploiting
micro-partitions and clustering keys for pruning, governing credit spend with resource monitors,
designing RBAC and secure data sharing, ingesting with Snowpipe/streams/tasks/COPY, leveraging
Time Travel / zero-copy cloning / Fail-safe, and optimizing queries with the query profile, result
cache, materialized views, and search optimization. This is Snowflake-specific administration of an
account/warehouse/database — not another cloud warehouse, not a self-managed OLTP engine, and not a
single-query rewrite.

## When to use this skill
Whenever the work targets Snowflake itself: choosing warehouse size and auto-suspend/auto-resume,
turning on multi-cluster scaling for concurrency, setting clustering keys and verifying pruning,
standing up resource monitors and analyzing credit consumption, designing the role hierarchy and
grants or secure views, publishing/consuming a secure share or Marketplace listing, wiring Snowpipe
or stream-and-task continuous ingestion or a `COPY` load, configuring Time Travel retention / cloning
/ Fail-safe expectations, or optimizing with the query profile, result/metadata cache, materialized
views, or search optimization. Pair it with the schema-design skill for relational modeling and the
verification skill to confirm any change against a live account. Do NOT use it for Redshift/BigQuery/
Synapse, a self-managed Postgres/Mongo/Redis engine, managed Supabase, cloud-agnostic pipeline
orchestration design, or an isolated single-query rewrite.

## Instructions
1. **Establish context first.** Capture the account edition (Standard/Enterprise/Business Critical),
   the cloud/region, the warehouse inventory and their sizes/auto-suspend settings, the role
   hierarchy, the databases/schemas and their data volume and growth, and the current credit burn
   (`SNOWFLAKE.ACCOUNT_USAGE` / `ORGANIZATION_USAGE`, `WAREHOUSE_METERING_HISTORY`). Read existing
   warehouse, RBAC, ingestion, and monitor definitions before changing anything. Confirm whether the
   target is production and what a safe change window is.
2. **Size and scale virtual warehouses to the workload.** Pick the smallest warehouse size that meets
   latency, scaling up one t-shirt size at a time only when the query profile shows local spilling or
   the work is genuinely large; warehouses are compute-only and bill per-second (60s minimum). Set
   `AUTO_SUSPEND` low (e.g. 60s) so idle compute stops, and `AUTO_RESUME = TRUE`. For concurrency,
   use **multi-cluster warehouses** (`MIN_CLUSTER_COUNT`/`MAX_CLUSTER_COUNT`, `SCALING_POLICY` of
   `STANDARD` vs `ECONOMY`) to add clusters under queueing rather than over-sizing a single cluster.
   Separate workloads onto distinct warehouses (load vs BI vs ad-hoc) so they don't contend.
3. **Exploit micro-partitions, clustering, and pruning.** Snowflake auto-partitions data into
   immutable micro-partitions with per-column min/max metadata; query performance comes from
   **partition pruning**. Inspect the query profile's "Partitions scanned / Partitions total" to
   confirm pruning. Only define a **clustering key** on large tables (multi-TB) whose natural ingest
   order doesn't match the filter/join columns; choose low-to-moderate cardinality expressions, check
   `SYSTEM$CLUSTERING_INFORMATION`, and weigh the ongoing automatic-reclustering credit cost. Do not
   add clustering keys to small or well-ordered tables.
4. **Govern cost and credits.** Attribute spend with `WAREHOUSE_METERING_HISTORY`,
   `QUERY_HISTORY`, `METERING_DAILY_HISTORY`, and storage views. Create **resource monitors** with
   credit quotas and `NOTIFY`/`SUSPEND`/`SUSPEND_IMMEDIATE` triggers at thresholds, assigned at the
   account or per-warehouse level. Drive savings through right-sizing, aggressive auto-suspend,
   multi-cluster over over-provisioning, result-cache reuse, and reducing reclustering/Snowpipe churn
   — not by guessing. Account for storage cost of Time Travel and Fail-safe retention.
5. **Design RBAC.** Snowflake authorization is role-based and hierarchical. Build functional roles
   (e.g. `ANALYST`, `LOADER`, `TRANSFORMER`) granted to access roles that hold object privileges, and
   roll up to `SYSADMIN`; keep `ACCOUNTADMIN`/`SECURITYADMIN` tightly held and avoid granting object
   privileges directly to users. Use **future grants** so new objects inherit privileges, **managed
   access schemas** to centralize grant control, and **secure views**/**secure UDFs** (and row-access
   policies / dynamic data masking on supported editions) to expose data without leaking definition or
   underlying rows. Apply least privilege and separate the warehouse-usage grant from data grants.
6. **Share data securely.** Use **Secure Data Sharing** to grant another account live, read-only
   access to objects via a share with no data copy and no extra storage; use **reader accounts** for
   consumers without their own Snowflake account, and the **Marketplace/Data Exchange** for
   listing/consuming. Share secure views (not base tables) to control exposure, and remember the
   provider pays storage while the consumer pays compute.
7. **Ingest continuously and in bulk.** For bulk/batch loads use **`COPY INTO`** from a stage
   (internal or external on S3/GCS/Azure), sizing files to ~100-250MB compressed for parallelism. For
   continuous micro-batch ingest use **Snowpipe** (auto-ingest via cloud notifications or the REST
   API). For change-data processing, combine **streams** (offset-based CDC on a table) with **tasks**
   (scheduled or triggered SQL/`MERGE`) to build declarative pipelines, optionally chained into a task
   graph (DAG). Validate loads with `COPY` validation mode, `COPY_HISTORY`, and `PIPE_USAGE_HISTORY`.
8. **Use Time Travel, cloning, and understand Fail-safe.** **Time Travel** lets you query
   (`AT`/`BEFORE`), clone, or `UNDROP` data within the retention window (`DATA_RETENTION_TIME_IN_DAYS`,
   up to 90 on Enterprise) — set it deliberately per object since it drives storage cost. **Zero-copy
   cloning** (`CREATE … CLONE`) makes instant metadata-only copies of databases/schemas/tables for
   dev/test/branching, billing only for subsequent changes. **Fail-safe** is a non-configurable
   7-day Snowflake-only recovery period after Time Travel ends — it is disaster recovery, not a backup
   you can self-serve; do not rely on it operationally.
9. **Optimize queries from the profile.** Read the **query profile** to find the bottleneck — look for
   poor pruning (high partitions-scanned), spilling to local/remote disk (warehouse too small),
   exploding joins, or queueing. Exploit the **result cache** (identical query, 24h, no warehouse
   compute) and metadata cache; add **materialized views** for expensive, frequently-repeated
   aggregations over large slowly-changing tables (note maintenance credit cost and limitations); and
   enable the **search optimization service** for selective point-lookup/equality filters on large
   tables. Prefer pruning, right-sizing, and caching over brute-force warehouse upsizing.
10. **Verify every change against the account.** Confirm warehouse settings (`SHOW WAREHOUSES`),
    grants (`SHOW GRANTS`), pruning and timings (query profile / `QUERY_HISTORY`), load results
    (`COPY_HISTORY`/`PIPE_USAGE_HISTORY`), and credit impact (`WAREHOUSE_METERING_HISTORY`) on a live
    or dev account with [[verify-by-running]] — report the exact command and the observed result, not
    just that the syntax is valid. Note that `ACCOUNT_USAGE` views have latency (up to ~45 min) versus
    real-time `INFORMATION_SCHEMA`/`SHOW`.

## Inputs
- The account edition, cloud/region, and organization context; the warehouse inventory with sizes and
  auto-suspend/scaling settings; the role hierarchy and grants; the databases/schemas with data volume
  and growth and Time-Travel retention; existing ingestion (Snowpipe/streams/tasks/COPY) and resource
  monitors; the credit/storage spend from the usage views; and the target SLOs, budget, and change
  window.

## Output
- A concern-by-concern recommendation (warehouse sizing/scaling, clustering/pruning, cost/monitors,
  RBAC, sharing, ingestion, Time-Travel/cloning/Fail-safe, query optimization) with each
  mechanism/setting named and the trade-off (latency vs credits vs storage) justified, plus the blast
  radius of each change.
- Where changes are made: the SQL/config as diffs or runnable steps, plus the validation command(s)
  run (query profile, `SHOW`, the relevant `ACCOUNT_USAGE`/`INFORMATION_SCHEMA` views, a load/clone
  test) and the observed result.

## Notes
- This is Snowflake-specific administration: pair it with [[relational-data-modeling]] for schema and
  key design, and confirm every applied change with [[verify-by-running]] against a live or dev
  account.
- The most common failures are over-sized always-on warehouses (no/late auto-suspend), pointless
  clustering keys on small or already-ordered tables (paying reclustering credits for nothing),
  granting object privileges directly to users instead of through roles, and ignoring the query
  profile (tuning by upsizing the warehouse instead of fixing pruning/spilling).
- Treat resource-monitor `SUSPEND`/`SUSPEND_IMMEDIATE`, dropping/recreating shares, role-hierarchy
  changes, and reducing Time-Travel retention (which can purge recovery history) as high-blast-radius:
  surface the effect and require explicit confirmation before applying on a production account.
- Snowflake is relational/SQL but compute (warehouses) and storage are decoupled, so cost and
  performance tuning is mostly about warehouse sizing/scaling, pruning, and caching — not the
  index/vacuum/replication concerns of a self-managed OLTP engine.
