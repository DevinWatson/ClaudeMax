---
name: data-pipeline-design
description: Use when designing or reviewing a batch/streaming data pipeline (ELT/ETL) — ingestion, orchestration (Airflow/Dagster/Prefect), idempotency and backfills, schema evolution, partitioning/file-sizing, and data contracts between producers and consumers. TRIGGER on pipeline design, non-idempotent or double-counting writes, backfill planning, schema-evolution/contract questions, or orchestration design. A pipeline reviewer or an on-call debugging a failed/duplicated run can both load it. NOT for tuning a single slow query and NOT for authoring the dbt transformation models themselves.
allowed-tools: Read, Write, Edit, Grep, Glob, Bash
category: data
tags: [etl, elt, pipelines, airflow, dagster, idempotency]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Data Pipeline Design

The substantive data-engineering capability: design and review the *movement and orchestration*
of data so pipelines are idempotent, reproducible, and safe to backfill — distinct from
transformation SQL (dbt) and query-plan tuning (sql-optimizer).

## When to use this skill
When designing or reviewing a pipeline, diagnosing a non-idempotent / double-counting run,
planning a backfill, handling schema evolution or data contracts, or designing orchestration
(DAGs/assets). Not for a single slow query or for writing dbt model SQL.

## Instructions
1. **Establish the shape first.** Batch vs. streaming vs. micro-batch; sources and sinks; the
   orchestrator (Airflow, Dagster, Prefect, dbt Cloud, cron); the warehouse/lakehouse
   (Snowflake, BigQuery, Redshift, Databricks/Delta, Iceberg). Read existing DAG/asset
   definitions, ingestion configs, and any schema/contract files. State in one line what you
   will and will not touch.
2. **Map the dataflow.** Source → land/raw → staging → curated/marts → consumers. Note the
   grain, the natural/business key, the watermark column, and the freshness SLA per stage.
3. **Make every step idempotent and replayable.** A task re-run for the same logical partition
   must produce the same result. Prefer:
   - Partition-scoped overwrite (`MERGE` / delete-insert / `INSERT OVERWRITE` by partition) over
     blind append; dedupe on the business key + ingestion timestamp.
   - Deterministic partition keys (event/business date, not wall-clock `now()`).
   - Explicit watermarks/high-water marks for incremental pulls; store them, don't infer.
4. **Design orchestration deliberately.**
   - Airflow: idempotent tasks keyed by `logical_date`/data interval; `catchup` and
     `max_active_runs` set intentionally; retries with backoff; sensors/deferrable operators
     over busy-waiting; pools to bound warehouse concurrency.
   - Dagster: model tables as software-defined assets with partitions and freshness policies;
     use asset checks for contracts; let lineage drive selective re-materialization.
   - Trigger downstream `dbt run`/`dbt build --select state:modified+` rather than rebuilding
     the world; hand transformation internals to dbt-modeler.
5. **Plan backfills as a first-class operation.** Define the partition range, bounded
   parallelism, and the cost ceiling. Backfill into a side/temp location and swap, or use
   partition-scoped overwrites so a re-run is safe. State how to resume after partial failure.
6. **Handle schema evolution and contracts.** Prefer additive, backward-compatible changes (new
   nullable columns); version breaking changes. Define a **data contract** at each boundary:
   schema, types, nullability, key uniqueness, allowed enum values, freshness, and
   row-count/volume expectations. Fail ingestion loudly on contract violation; quarantine bad
   rows rather than silently dropping or coercing them.
7. **Partition and file-size sanity.** Partition on the common filter (usually date) at a grain
   that avoids tiny-file explosions; compact small files; avoid high-cardinality partition keys.
   Note clustering/sort keys where the engine supports them.
8. **Verify.** Trace one partition end to end; confirm a re-run is a no-op (idempotent); confirm
   late/duplicate/out-of-order data is handled; confirm contract checks fire on bad input. Run
   `airflow dags test` / `dagster asset materialize` / `dbt build` in a dev target where possible
   and report results (or state you couldn't run it and give the exact commands).

## Inputs
- The pipeline definitions (DAGs/assets), ingestion configs, schema/contract files, the source
  and sink shapes, and the freshness/cost requirements.

## Output
```
Pipeline: <batch|streaming|micro-batch>, orchestrator=<...>, warehouse=<...>
Dataflow: source -> raw -> staging -> marts (grain, key, watermark, SLA per stage)
Idempotency: <write strategy + dedupe key>
Backfill plan: <range, parallelism, swap/overwrite strategy, resume>
Schema/contract: <checks enforced at each boundary; failure handling>
Risks/trade-offs: <cost, late data, ordering, small files>
Verification: <commands run + what was confirmed>
```

## Notes
- Never propose a non-idempotent append where a re-run could double-count.
- Don't run destructive backfills or `TRUNCATE`/overwrite against production; produce the plan
  and exact commands and require explicit confirmation.
- Don't claim a pipeline is idempotent or contract-safe unless you traced a re-run; hand
  transformation SQL to dbt-modeler and query-plan tuning to sql-optimizer.
