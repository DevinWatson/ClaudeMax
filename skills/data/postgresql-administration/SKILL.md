---
name: postgresql-administration
description: The substantive raw-PostgreSQL-engine capability — server config/tuning (shared_buffers, work_mem, effective_cache_size, WAL/checkpoint settings), indexes and query planning (EXPLAIN ANALYZE, B-tree/GIN/GiST/BRIN, index-only scans), vacuum/autovacuum/bloat management, replication and HA (streaming and logical replication, failover, PITR/WAL archiving), declarative partitioning, connection pooling (PgBouncer), roles/privileges/security and Row-Level Security, extensions (pg_stat_statements, pgvector, postgis), and tooling (psql, pg_dump/pg_restore, pg_basebackup). Use when administering, tuning, scaling, replicating, securing, or operating a self-managed PostgreSQL instance/cluster. Any agent operating a PostgreSQL instance can load it. NOT for managed Supabase BaaS (auth/realtime/storage on top of Postgres), managed cloud data warehouses/pipelines (BigQuery/Synapse/Redshift), cloud-agnostic pipeline orchestration design, or single-query SQL rewrites in isolation.
allowed-tools: Read, Grep, Glob, Bash
category: data
tags: [postgresql, postgres, tuning, indexing, vacuum, replication, partitioning, pgbouncer, rls, extensions]
version: 1.0.0
license: MIT
maintainer: devinwatson@gmail.com
status: stable
---

# PostgreSQL Administration

The substantive raw-PostgreSQL-engine capability: configuring and tuning the server, designing
indexes and reading the planner, keeping the heap healthy with vacuum/autovacuum, replicating for
HA and recovery, partitioning large tables, pooling connections, securing roles and rows, enabling
extensions, and operating the engine with the standard tooling. This is engine-level administration
of a self-managed instance — not a managed BaaS, not a cloud warehouse, and not a single-query rewrite.

## When to use this skill
Whenever the work targets the PostgreSQL engine itself: setting `postgresql.conf`/`pg_hba.conf`,
sizing memory and WAL/checkpoint behavior, choosing and validating indexes via `EXPLAIN ANALYZE`,
diagnosing and fixing table/index bloat and autovacuum lag, standing up streaming or logical
replication and rehearsing failover/PITR, partitioning a large table, configuring PgBouncer,
designing roles/privileges and RLS, enabling extensions (`pg_stat_statements`, `pgvector`,
`postgis`), or running `psql`/`pg_dump`/`pg_restore`/`pg_basebackup`. Use it alongside the
schema-design skill for modeling and the verification skill to confirm any change against a live
instance. Do NOT use it for managed Supabase, cloud DW/pipelines, pipeline-orchestration design, or
an isolated single-query rewrite.

## Instructions
1. **Establish context first.** Capture the PostgreSQL major version, instance role
   (primary/replica), workload shape (OLTP vs analytical, read/write ratio, concurrency), the host
   resources (RAM, cores, disk type), and the current settings via `SHOW`/`pg_settings`. Read the
   existing `postgresql.conf`, `pg_hba.conf`, schema, and any pooling/replication config before
   changing anything. Confirm whether the target is production and what a safe change window is.
2. **Tune server configuration to the workload and hardware.** Set `shared_buffers` (~25% of RAM as a
   starting point), `effective_cache_size` (~50-75% of RAM, an estimate for the planner), `work_mem`
   per-sort/hash (size against concurrency to avoid OOM), `maintenance_work_mem` for vacuum/index
   builds, and WAL/checkpoint settings (`max_wal_size`, `checkpoint_timeout`,
   `checkpoint_completion_target`) to smooth write spikes. Tune `random_page_cost`/`effective_io_concurrency`
   for SSDs. Change one dimension at a time and note which settings need a reload vs a restart.
3. **Design indexes and read the planner.** Use `EXPLAIN (ANALYZE, BUFFERS)` to see the actual plan,
   row estimates vs actuals, and buffer reads — never optimize on `EXPLAIN` estimates alone. Choose
   the index type deliberately: **B-tree** for equality/range/sort, **GIN** for arrays/JSONB/full-text,
   **GiST** for geometric/range/similarity, **BRIN** for large naturally-ordered tables. Target
   **index-only scans** with covering (`INCLUDE`) indexes where the access pattern allows; use partial
   and expression indexes for selective predicates. Run `ANALYZE` so statistics back the plan, and
   drop unused/redundant indexes (check `pg_stat_user_indexes`).
4. **Keep the heap healthy with vacuum.** Explain MVCC dead tuples and bloat; tune autovacuum
   (`autovacuum_vacuum_scale_factor`/`_threshold`, `autovacuum_vacuum_cost_limit`,
   `autovacuum_max_workers`) so it keeps pace with churn. Watch transaction-ID age to prevent
   wraparound, measure bloat (`pgstattuple` / `pg_stat_user_tables`), and use `VACUUM (VERBOSE)`,
   `VACUUM FULL` (locking — schedule it), or `pg_repack` to reclaim space. Never disable autovacuum
   on a busy table.
5. **Replicate for HA and recovery.** Stand up **streaming replication** (primary `wal_level`,
   `max_wal_senders`, replication slots, replica `primary_conninfo`/`hot_standby`) for read scaling
   and standby failover; use **logical replication** (publications/subscriptions) for selective or
   cross-version replication. Configure **WAL archiving + PITR** (`archive_command`/`archive_library`,
   base backup, restore to a recovery target). Define and rehearse failover/promotion; tie every
   measure to an RTO/RPO and surface replication-lag monitoring.
6. **Partition large tables declaratively.** Use range/list/hash declarative partitioning on a chosen
   key, plan partition maintenance (creating/detaching partitions, default partition), ensure
   partition pruning fires in the plan, and place indexes per partition. Migrate existing large tables
   to partitioned form carefully and verify pruning with `EXPLAIN`.
7. **Pool connections.** Use **PgBouncer** to bound backend connections: pick `transaction` mode for
   typical web workloads (note prepared-statement/session-feature caveats) vs `session` mode where
   session state is required; size `max_client_conn`, `default_pool_size`, and `max_db_connections`
   against the server's `max_connections`. Avoid one-backend-per-request connection storms.
8. **Secure roles, privileges, and rows.** Design login vs group `NOLOGIN` roles, grant least
   privilege on schemas/tables/sequences, set sane `DEFAULT PRIVILEGES`, and harden `pg_hba.conf`
   (host SSL, `scram-sha-256`). Use **Row-Level Security** (`ENABLE ROW LEVEL SECURITY` plus explicit
   `SELECT/INSERT/UPDATE/DELETE` policies with `USING`/`WITH CHECK`) for multi-tenant or per-user
   isolation; pin `search_path` on `SECURITY DEFINER` functions.
9. **Enable extensions for capability and insight.** Turn on `pg_stat_statements` (add to
   `shared_preload_libraries`, restart) for query-workload profiling; `pgvector` (`vector` type +
   `ivfflat`/`hnsw` index) for embeddings/semantic search; `postgis` for geospatial. Track what each
   extension preloads and any restart it requires.
10. **Operate with the standard tooling.** Use `psql` (with `\d`, `\timing`, `\watch`) for inspection;
    `pg_dump`/`pg_restore` (custom/directory format, parallel jobs) for logical backup/migration;
    `pg_basebackup` for physical base backups and standby seeding. Confirm every config change,
    backup, restore, and replication step against a live or staging instance with [[verify-by-running]]
    — report the exact command and the observed result, not just that the syntax is valid.

## Inputs
- The PostgreSQL version and instance role; workload shape, concurrency, and read/write ratio; host
  resources (RAM/cores/disk); current `postgresql.conf`/`pg_hba.conf` and `pg_settings`; the schema;
  existing pooling/replication/backup config; and the target RTO/RPO and change window.

## Output
- A concern-by-concern recommendation (config/tuning, indexing, vacuum, replication/HA, partitioning,
  pooling, roles/RLS, extensions) with each setting/mechanism named and the trade-off justified, plus
  the reload-vs-restart impact and blast radius of each change.
- Where changes are made: the config/SQL/tooling commands as diffs or runnable steps, plus the
  validation command(s) run (`EXPLAIN ANALYZE`, `pg_stat_statements`, restore/failover drill) and the
  observed result.

## Notes
- This is engine-level Postgres administration: pair it with [[relational-data-modeling]] for schema
  and key design, and confirm every applied change with [[verify-by-running]] against a live or
  staging instance.
- The most common failures are unbounded connections (no pooler), autovacuum that cannot keep up
  (bloat and TXID-wraparound risk), and tuning by estimate — always read `EXPLAIN (ANALYZE, BUFFERS)`
  and `pg_stat_statements`, not assumptions.
- Treat `VACUUM FULL`, destructive `pg_hba`/role changes, restores, and failover/promotion as
  high-blast-radius: surface the effect and require explicit confirmation before running them on a
  primary.
