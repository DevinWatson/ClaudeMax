---
name: gcp-bigquery
description: Use when designing, provisioning, securing, or operating BigQuery — Google Cloud's serverless, fully managed data warehouse with separated storage and compute (datasets, tables, views, materialized views), on-demand vs slot-based (reservations/editions/autoscaling) pricing, partitioning and clustering, BigQuery ML (BQML), BI Engine, external/BigLake tables, and streaming inserts, plus IAM, CMEK, VPC-SC, cost controls, and quotas. Loads the BigQuery knowledge: create datasets/tables, choose partitioning/clustering, pick on-demand vs slots, build BQML models or materialized views, and verify a query and a cost estimate. Consumed by the BigQuery specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they handle warehouse workloads (BigQuery).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, bigquery, data-analytics, data-warehouse, sql, bqml, slots]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# BigQuery

Google Cloud's serverless, fully managed, petabyte-scale data warehouse. Storage and compute are
decoupled: data lives in columnar storage organized into datasets, and queries run on a distributed
execution engine billed either on-demand (per TB scanned) or via slot reservations.

## Core concepts and components
- **Datasets / tables / views** — datasets are the top-level container (regional or multi-regional);
  tables hold data; **views** are saved queries; **materialized views** precompute and incrementally
  refresh aggregates.
- **Storage model** — columnar, separated from compute; **active** vs **long-term** storage pricing
  (tables untouched 90 days drop to long-term rate). Time-travel and snapshots for recovery.
- **Compute / pricing models** — **on-demand** (per-TB scanned, simple, capped by query) vs
  **capacity (slots)** via **reservations** and **Editions** (Standard/Enterprise/Enterprise Plus)
  with **slot autoscaling** and commitments; assignments map projects/folders to reservations.
- **Partitioning** — by ingestion time, a DATE/TIMESTAMP column, or integer range; **prunes** scanned
  bytes. **Clustering** — sorts within partitions on up to 4 columns; reduces scan for filtered/sorted
  queries.
- **BigQuery ML (BQML)** — train and serve models (linear/logistic, k-means, ARIMA+, boosted trees,
  matrix factorization, remote/Vertex models) with SQL.
- **BI Engine** — in-memory analysis accelerator for sub-second dashboards.
- **External / BigLake tables** — query Cloud Storage, Bigtable, Spanner, or other sources in place;
  BigLake adds fine-grained security over object data.
- **Streaming / Storage Write API** — real-time row inserts; load jobs for batch ingest.

## Configuration and sizing
- Choose dataset **location** (must match for joins; cannot move later). Pick **on-demand** for spiky
  or low volume, **slots/Editions autoscaling** for steady or high-concurrency workloads — size slots
  to p95 concurrency, set baseline + max for autoscaling. Always partition large fact tables and
  cluster on common filter/join keys.

## Security and IAM
- Grant least-privilege roles (`roles/bigquery.dataViewer`, `dataEditor`, `jobUser`) scoped to
  datasets, not project-wide `bigquery.admin`. Use **authorized views/datasets** and **routines** to
  expose subsets; **column-level** and **row-level security** with policy tags (Data Catalog) and
  row-access policies; **CMEK** for table encryption; **VPC-SC** to fence data exfiltration; audit via
  Cloud Audit Logs.

## Cost levers
- The dominant lever is **on-demand bytes scanned vs slot capacity** — partition + cluster to prune
  scans, SELECT only needed columns (never `SELECT *`), use **materialized views**/BI Engine for
  repeated aggregates, set **maximum bytes billed** and custom quotas as guardrails. For slots,
  right-size reservations and use autoscaling + idle-slot sharing; move cold tables to long-term
  storage; prefer batch loads (free) over streaming inserts when latency allows.

## Scaling and limits
- Serverless — no clusters to manage; queries scale automatically. Limits: load/query job
  concurrency, streaming insert quotas, max columns/partitions per table (4000 partitions), and slot
  contention within a reservation. Raise via quota requests; spread load across reservations.

## Operating procedure
1. **Provision** — enable the BigQuery API, create the **dataset** in the chosen location (Terraform
   `google_bigquery_dataset`), and tables (`google_bigquery_table`) with partitioning/clustering;
   create a **reservation** + **assignment** (`google_bigquery_reservation`,
   `google_bigquery_reservation_assignment`) if using slots.
2. **Configure** — define partitioning/clustering, materialized views, BQML models, BI Engine
   reservation, and external/BigLake tables; set table expiration and labels.
3. **Secure** — scope dataset IAM least-privilege, add authorized views, column/row-level policy tags,
   CMEK, and VPC-SC; set max-bytes-billed and custom cost quotas.
4. **Verify** — apply [[verify-by-running]]: run a representative query with `bq query --dry_run` to
   confirm bytes scanned (cost), then run it for real (`bq query` / `bq show` the table) and confirm
   row counts, partition pruning in the query plan, and that the reservation is assigned
   (`bq ls --reservation`) — capture the actual bytes-billed and result.

## Inputs
Data volume + growth, query patterns (filters/joins/aggregations), concurrency + latency targets,
on-demand-vs-slots preference, region, ingestion mode (batch/stream/external), IAM/data-classification
needs, CMEK/VPC-SC requirements, and cost ceiling.

## Output
A BigQuery setup (datasets, partitioned/clustered tables, optional materialized views/BQML/BI Engine,
external/BigLake tables, reservation + assignment if using slots) with least-privilege IAM and cost
guardrails, plus verification of a dry-run cost estimate and a working query.

## Notes
- Gotchas: dataset location is permanent (cross-region joins fail; you must copy to relocate);
  `SELECT *` scans every column and explodes on-demand cost; partition count is capped (4000);
  streaming inserts cost more and have a buffer before they're queryable consistently; clustering
  benefits filtered/sorted queries but not arbitrary ones; on-demand has no concurrency cap but slots
  do. BigQuery owns the MANAGED warehouse, slots/reservations, storage, and BQML — single-query
  tuning rewrites belong to the data sql-optimizer.
- IaC/CLI: Terraform `google_bigquery_dataset`, `google_bigquery_table`,
  `google_bigquery_routine`, `google_bigquery_reservation`, `google_bigquery_reservation_assignment`,
  `google_bigquery_data_transfer_config`, plus `google_project_service`. CLI `bq` (mk, query, load,
  show, ls, cp) and `gcloud` for reservations/IAM; the `google-cloud-bigquery` client libraries for
  programmatic access.
