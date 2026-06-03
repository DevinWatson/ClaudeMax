---
name: gcp-database-migration-service
description: Use when planning or executing database migrations with Database Migration Service (DMS) — Google Cloud's managed, minimal-downtime service that migrates MySQL, PostgreSQL, and SQL Server into Cloud SQL or AlloyDB using source and destination connection profiles, an initial full dump followed by continuous change data capture (CDC) replication, connectivity methods (VPC peering, reverse SSH, IP allowlist, PSC), and a promote/cutover step, plus IAM and security around the migration. Loads the DMS knowledge: create connection profiles, configure a continuous or one-time migration job, run CDC, monitor lag, and verify and promote the cutover. Consumed by the Database Migration Service specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they plan managed database migrations (Database Migration Service).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, database-migration-service, databases, migration, cdc, replication, cutover]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Database Migration Service (DMS)

Google Cloud's managed service for migrating relational databases into Cloud SQL or AlloyDB with
minimal downtime. DMS performs an initial full load and then keeps the destination in sync via
continuous **change data capture (CDC)** until you promote (cut over).

## Core concepts and components
- **Migration job** — the unit of work linking a source to a destination; **one-time** (full dump only)
  or **continuous** (full dump + ongoing **CDC** replication).
- **Connection profiles** — reusable **source** and **destination** definitions (host/port/credentials,
  TLS, engine) referenced by jobs.
- **Supported engines/targets** — **MySQL**, **PostgreSQL**, and **SQL Server** sources migrating into
  **Cloud SQL** or **AlloyDB** (homogeneous; some heterogeneous PostgreSQL paths via the Conversion
  Workspace / dump-based flow).
- **CDC** — after the initial dump, DMS streams source changes (binlog/WAL/replication slot) so the
  destination stays current; you monitor **replication lag**.
- **Connectivity methods** — **VPC peering**, **reverse SSH tunnel** (through a bastion), **IP
  allowlist**, or **Private Service Connect** to reach the source securely.
- **Promotion / cutover** — when lag is near zero and validated, **promote** the destination to a
  standalone primary, stopping replication and completing the migration.

## Configuration and sizing
- Define **source** and **destination connection profiles** (the destination is the Cloud SQL/AlloyDB
  instance to create or target). Configure the source for replication (binlog/WAL/replication slot,
  required grants). Choose **continuous** for minimal downtime. Pick a **connectivity method** matching
  the network topology. Size the destination instance to handle full-load throughput and steady CDC.

## Security and IAM
- Grant least-privilege roles (`roles/datamigration.admin`, `roles/datamigration.viewer`) for operating
  DMS, plus source DB users with only the privileges needed for dump + replication. Use **private
  connectivity** (VPC peering/PSC/SSH) over public IP, require **TLS** to the source, store credentials
  securely, and audit via Cloud Audit Logs.

## Cost levers
- DMS migration jobs themselves are generally free; cost comes from the **destination Cloud SQL/AlloyDB
  instance** running during migration, **network egress** (especially for off-cloud or cross-region
  sources), and any bastion/connectivity infrastructure. Keep the migration window tight, right-size the
  destination, and tear down connectivity helpers (bastions) after cutover.

## Scaling and limits
- Full-load and CDC throughput depend on source change rate, network bandwidth, and destination
  capacity. Limits: supported engine/version combinations, objects DMS does/doesn't migrate (some
  schema/objects need manual handling), one promotion per job, and replication-slot/binlog retention on
  the source. CDC lag grows if the destination cannot keep up.

## Operating procedure
1. **Provision** — enable the Database Migration API, prepare the **source** for replication (enable
   binlog/WAL, create the migration user + grants, replication slot), and create **source** and
   **destination connection profiles** (Terraform `google_database_migration_service_connection_profile`).
2. **Configure** — create the **migration job** (one-time vs **continuous**), choose the **connectivity
   method**, map source→destination, then **start** the job to run the initial dump and begin CDC.
3. **Secure** — scope DMS IAM least-privilege, use private connectivity + TLS, limit source-user
   privileges, and enable audit logging.
4. **Verify** — apply [[verify-by-running]]: monitor job status and **replication lag** with
   `gcloud database-migration migration-jobs describe`, run a **verification** (the job's verify step /
   row-count and checksum spot checks against source vs destination), confirm CDC is caught up
   (near-zero lag), then **promote** and confirm the destination accepts writes as a standalone primary —
   capture the lag, verification, and post-promote write output.

## Inputs
Source engine + version and connection details, destination (Cloud SQL/AlloyDB target), downtime
tolerance (one-time vs continuous), network topology / connectivity method, source replication
prerequisites, data volume + change rate, IAM/credentials, and the cutover plan.

## Output
A migration setup (source + destination connection profiles, a one-time or continuous migration job with
CDC, a connectivity method) plus verification of replication lag, source/destination data validation, and
a promoted cutover to the standalone destination.

## Notes
- Gotchas: the source must be prepared for replication (binlog/WAL, slot, grants) before CDC works;
  continuous jobs hold a replication slot — monitor source disk/WAL retention; some objects (certain
  schema, sequences, large objects) may not migrate and need manual steps; **promotion is one-way** —
  validate thoroughly first; CDC lag accumulates if the destination is undersized; heterogeneous paths
  are more limited than homogeneous; long migrations keep the destination billing.
- IaC/CLI: Terraform `google_database_migration_service_connection_profile`, plus
  `google_project_service`; many job operations are driven by `gcloud database-migration`
  (connection-profiles, migration-jobs: create/start/promote/verify/describe). The Conversion Workspace
  assists heterogeneous PostgreSQL conversions.
