---
name: gcp-spanner
description: Use when designing, provisioning, securing, or operating Cloud Spanner — Google Cloud's fully managed, globally distributed, horizontally scalable relational database with strong external consistency backed by TrueTime, regional vs multi-region instance configurations sized in nodes or processing units, interleaved tables and primary-key design to avoid hotspots, secondary indexes, the GoogleSQL and PostgreSQL dialects, and backups/PITR, plus IAM, CMEK, VPC connectivity, and cost/scaling levers. Loads the Spanner knowledge: design schemas/keys and interleaving, choose an instance config and capacity, secure with IAM, and verify consistency and throughput. Consumed by the Spanner specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they handle globally distributed relational workloads (Spanner).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, spanner, databases, distributed-sql, strong-consistency, truetime, interleaving]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Spanner

Google Cloud's fully managed, globally distributed relational database that combines SQL semantics and
transactions with horizontal scale and **strong (external) consistency** backed by **TrueTime**. It
delivers high availability (up to 99.999% in multi-region) without sacrificing relational integrity.

## Core concepts and components
- **Instance / configuration** — an **instance** has a **configuration** that is **regional** (single
  region, 3 zones) or **multi-region** (cross-region replication, higher availability + global reads).
  Capacity is provisioned in **nodes** or finer-grained **processing units (PUs)** (1 node = 1000 PUs).
- **Databases / tables / schema** — relational schemas with **secondary indexes**; choose the
  **GoogleSQL** or **PostgreSQL** dialect per database.
- **Primary-key design** — keys determine data distribution across **splits**; avoid monotonically
  increasing keys (timestamps, sequential IDs) that **hotspot** a split — use UUIDs, hashed/bit-reversed
  keys, or sharding.
- **Interleaving** — child tables can be **interleaved** in a parent so related rows are co-located,
  making parent+child reads/joins local and efficient.
- **TrueTime / consistency** — globally synchronized clocks enable externally consistent distributed
  transactions; reads can be strong or **stale (bounded)** for lower latency.
- **Backups / PITR** — managed backups and **point-in-time recovery** (version retention) plus
  import/export.

## Configuration and sizing
- Choose **regional vs multi-region** for the latency/availability/cost trade-off. Size capacity in
  **nodes/PUs** to CPU utilization (target <65% high-priority) and storage (per-node storage limit).
  Design **primary keys** to spread load and **interleave** parent/child tables; add **secondary
  indexes** for query shapes. Enable **autoscaling** (Autoscaler) where load varies.

## Security and IAM
- Grant least-privilege roles (`roles/spanner.databaseReader`, `databaseUser`, `databaseAdmin`,
  `roles/spanner.viewer`) scoped to instance/database; fine-grained access control supports
  table/column/row-level grants. Encrypt with **CMEK**; restrict with VPC-SC/Private Google Access;
  audit via Cloud Audit Logs.

## Cost levers
- The dominant levers are **provisioned capacity (nodes/PUs)**, the **instance configuration**
  (multi-region costs more than regional), **storage** consumed, **backups**, and **cross-region network
  egress**. Right-size capacity with **Autoscaler** to keep CPU near target, use **PUs** (sub-node
  granularity) for small workloads, choose regional unless multi-region availability/global reads are
  required, and trim backup retention.

## Scaling and limits
- Scales **horizontally and online** by adding nodes/PUs with no downtime; storage and throughput grow
  with capacity. Limits: per-node CPU/storage ceilings (keep CPU <65%), mutation limits per transaction,
  index and schema-change constraints (some are long-running), and per-region quotas. Hotspotting keys
  cap throughput regardless of node count.

## Operating procedure
1. **Provision** — enable the Spanner API and create the **instance** with a **configuration**
   (regional/multi-region) and capacity in nodes/PUs (Terraform `google_spanner_instance`), then the
   **database** with its dialect (`google_spanner_database`).
2. **Configure** — define the schema (DDL) with sound **primary keys**, **interleaved** child tables,
   and **secondary indexes**; set version retention/PITR; configure **Autoscaler** if used; grant
   fine-grained access if needed.
3. **Secure** — scope IAM least-privilege (instance/database/fine-grained), apply CMEK, restrict with
   VPC-SC, and enable audit logging.
4. **Verify** — apply [[verify-by-running]]: run a write + strong read with `gcloud spanner databases execute-sql`
   and confirm read-your-writes consistency, verify an interleaved parent/child query and that the
   intended **secondary index** is used (query plan), check instance CPU utilization is within target,
   and confirm a backup/PITR window exists (`gcloud spanner backups list`) — capture the query result,
   plan, and backup/CPU output.

## Inputs
Consistency + availability targets (regional vs multi-region), throughput (QPS) and latency targets,
data model + access patterns (key design, interleaving, indexes), dialect (GoogleSQL/PostgreSQL),
data volume + growth, autoscaling needs, IAM/fine-grained access, CMEK/VPC-SC requirements,
backup/PITR retention, and cost ceiling.

## Output
A Spanner setup (instance config + capacity in nodes/PUs, database in the chosen dialect, schema with
sound keys/interleaving/indexes, optional Autoscaler, backups/PITR) with least-privilege IAM and CMEK,
plus verification of consistency, index usage, capacity headroom, and backups.

## Notes
- Gotchas: **primary-key design is critical** — monotonic keys hotspot a split and cap throughput
  regardless of nodes; keep CPU under the recommended target (~65%) or latency degrades; some schema
  changes (index backfills, type changes) are long-running/online; multi-region is more expensive and
  adds write latency; interleaving must be planned at schema time; mutation limits cap transaction size;
  GoogleSQL and PostgreSQL dialects differ.
- IaC/CLI: Terraform `google_spanner_instance`, `google_spanner_database`, `google_spanner_database_iam_*`,
  `google_spanner_backup_schedule`, plus `google_project_service`. CLI `gcloud spanner`
  (instances/databases/backups/execute-sql), the Spanner Autoscaler, and client libraries for the data path.
