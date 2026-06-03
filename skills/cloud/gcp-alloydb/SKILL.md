---
name: gcp-alloydb
description: Use when designing, provisioning, securing, or operating AlloyDB for PostgreSQL — Google Cloud's fully managed, PostgreSQL-compatible database with a disaggregated storage engine, a columnar engine for analytics, primary and read-pool instances, automatic backups/PITR, and cross-region replication, plus IAM, CMEK, private/VPC connectivity, and cost/scaling levers. Loads the AlloyDB knowledge: create clusters and instances, size primary and read pools, enable the columnar engine, secure with IAM and private networking, and verify connectivity and replication. Consumed by the AlloyDB specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they handle managed PostgreSQL workloads (AlloyDB for PostgreSQL).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, alloydb, databases, postgresql, columnar-engine, read-pool, managed-database]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AlloyDB for PostgreSQL

Google Cloud's fully managed, PostgreSQL-compatible database designed for high-performance
transactional and analytical workloads. Compute and storage are disaggregated: a log-based,
distributed storage layer serves the primary and read pool instances, and an in-memory columnar
engine accelerates analytical queries on the same data.

## Core concepts and components
- **Cluster** — the top-level container holding a single primary instance plus optional read pools;
  bound to a region and a VPC network. **Secondary clusters** in other regions provide cross-region
  replication and disaster recovery.
- **Instances** — the **primary instance** (read/write) and one or more **read-pool instances**
  (read-only, horizontally scalable nodes sharing the cluster's storage) sized by vCPU/memory machine
  shapes.
- **Disaggregated storage** — a log-processing, regionally replicated storage layer; compute scales
  independently of storage and storage auto-grows.
- **Columnar engine** — an in-memory column store that automatically populates hot columns to
  accelerate scans, joins, and aggregations alongside the row store.
- **Backups / PITR** — automatic and on-demand backups with continuous WAL archiving enabling
  point-in-time recovery; restore creates a new cluster.
- **PostgreSQL compatibility** — wire- and feature-compatible with community PostgreSQL (extensions,
  `psql`, drivers); IAM database authentication is available.

## Configuration and sizing
- Size the **primary** to write throughput and working set; add **read pools** for read scale-out and
  isolate analytical traffic. Choose machine shapes (vCPU/RAM) per instance; enable the **columnar
  engine** and size its memory budget for analytical columns. Set the maintenance window and the
  backup/PITR retention. Add **secondary clusters** for cross-region DR.

## Security and IAM
- Grant least-privilege project roles (`roles/alloydb.client`, `roles/alloydb.admin`, `roles/alloydb.viewer`)
  scoped narrowly. Prefer **IAM database authentication** and the **AlloyDB Auth Proxy** over static
  passwords. Deploy with **private services access / PSC** on a VPC (no public IP); encrypt with **CMEK**;
  audit via Cloud Audit Logs.

## Cost levers
- The dominant levers are **instance vCPU/memory** for the primary and each read pool, the **number of
  read-pool nodes**, **columnar-engine memory**, and **storage** consumed (auto-grows). Right-size
  instances, scale read pools to actual read concurrency, drop idle read pools, and tune backup/PITR
  retention. Consider committed-use discounts for steady workloads.

## Scaling and limits
- Read scales horizontally by adding read-pool nodes; the single primary scales vertically (resize the
  machine shape). Storage scales automatically. Limits apply to read-pool node counts, max instance
  shapes per cluster, and per-region quotas — raise via quota requests.

## Operating procedure
1. **Provision** — enable the AlloyDB API, create the **cluster** (Terraform `google_alloydb_cluster`)
   on a VPC with private services access, then the **primary instance** (`google_alloydb_instance`) and
   any **read-pool instances**; create **secondary clusters** for DR if required.
2. **Configure** — set machine shapes, enable the **columnar engine** and its memory budget, configure
   the maintenance window, backups/PITR retention, database flags, and read-pool node counts.
3. **Secure** — scope IAM least-privilege, enable IAM database auth, attach the Auth Proxy / PSC,
   disable public IP, apply CMEK, and enable audit logging.
4. **Verify** — apply [[verify-by-running]]: connect through the Auth Proxy (`psql` /
   `gcloud alloydb instances describe`) and confirm the primary accepts writes; query a read-pool
   endpoint and confirm replica reads; confirm the columnar engine is populated
   (`SELECT * FROM g_columnar_relations`) and that a backup exists
   (`gcloud alloydb backups list`) — capture the connection, replica read, and backup output.

## Inputs
Workload profile (OLTP/OLAP mix, read/write ratio), data volume + growth, concurrency + latency
targets, region(s) and DR needs, machine shapes, columnar-engine requirements, VPC/private-connectivity
config, IAM/auth model, CMEK requirements, backup/PITR retention, and cost ceiling.

## Output
An AlloyDB setup (cluster, primary + read-pool instances, optional secondary cluster, columnar engine,
backups/PITR) on private networking with least-privilege IAM and CMEK, plus verification of write/read
connectivity, replication, and backups.

## Notes
- Gotchas: the cluster has exactly one primary — write scaling is vertical only; read pools serve reads
  only and are eventually consistent; the columnar engine consumes instance memory, so budget it
  against the row store; AlloyDB is PostgreSQL-compatible but not byte-identical (verify extensions);
  deleting a cluster removes its instances and (per policy) backups; public IP is discouraged — prefer
  PSC/private services access.
- IaC/CLI: Terraform `google_alloydb_cluster`, `google_alloydb_instance`, `google_alloydb_backup`,
  `google_alloydb_user`, plus `google_project_service` and `google_compute_global_address` /
  `google_service_networking_connection` for private services access. CLI `gcloud alloydb clusters`,
  `gcloud alloydb instances`, `gcloud alloydb backups`, and the AlloyDB Auth Proxy for connectivity.
