---
name: aws-dms
description: Use when designing, provisioning, securing, or operating AWS Database Migration Service — replication instances (or DMS Serverless), source/target endpoints, migration tasks (full-load, CDC, full-load+CDC), the Schema Conversion Tool / DMS Schema Conversion for heterogeneous engine changes, table mappings and transformation rules, and validation for homogeneous and heterogeneous database migrations (AWS Database Migration Service). Loads the DMS knowledge: how to move/replicate data between database engines with minimal downtime, convert schemas, run CDC, and verify row counts and data integrity. Consumed by the DMS specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they plan a database migration.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, dms, database-migration, cdc, replication, schema-conversion]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Database Migration Service

Moves and replicates data between databases with minimal downtime. DMS handles **homogeneous**
migrations (same engine, e.g. Oracle→Oracle) and **heterogeneous** ones (different engines, e.g.
Oracle→Aurora PostgreSQL) where it pairs with schema conversion. DMS moves and continuously
replicates *data*; it does not tune the source/target engine — that is the database engine team's
job — and it is for one-time or migration-window replication, not long-running analytics pipelines.

## Core concepts and components
- **Replication instance** — the managed compute that runs migration tasks (or **DMS Serverless**,
  which auto-scales capacity units).
- **Endpoints** — source and target connection definitions (engine, host, creds/Secrets Manager,
  SSL); test each before use.
- **Migration task** — the unit of work: **full-load** (bulk copy), **CDC** (change data capture,
  ongoing replication), or **full-load + CDC** (load then keep in sync for cutover).
- **Schema conversion** — **AWS SCT** (downloadable) or **DMS Schema Conversion** converts DDL,
  code objects, and flags manual-conversion items for heterogeneous moves; homogeneous moves keep
  the schema and only need DMS for data.
- **Table mappings & transformation rules** — JSON selecting/renaming/filtering schemas, tables,
  and columns; **premigration assessments** and **data validation** check feasibility and row
  integrity.

## Configuration and sizing
- Size the replication instance to source change volume and table width; use Multi-AZ for
  long-running CDC. Enable **CloudWatch** task logging and **data validation** for correctness.
- For low-downtime cutover use full-load+CDC: load, let CDC catch up, then stop the source,
  drain the final changes, and switch the app to the target.

## Security and IAM
- Put endpoints in private subnets; use a DMS subnet group + security groups that reach both
  databases. Store credentials in **Secrets Manager** and reference them from endpoints.
- Enable SSL on endpoints; encrypt the replication instance storage with KMS. Grant DMS the
  minimum source (CDC/binlog/redo read) and target (DDL/DML) privileges.

## Cost levers
- Pay for replication-instance hours (or Serverless capacity), storage, and data transfer. Stop
  idle tasks/instances, right-size, prefer Serverless for spiky/short jobs, and delete the
  instance after cutover.

## Scaling and limits
- One instance runs multiple tasks; very high change rates may need a larger instance or split
  tasks. LOB handling, very wide tables, and certain data types have limits — check the
  source/target support matrix; CDC requires source logging (binlog/redo/logical replication) on.

## Operating procedure
1. **Provision** — create a replication subnet group + replication instance (or Serverless) via
   Terraform `aws_dms_replication_instance` / `aws dms create-replication-instance`.
2. **Configure** — create + test source/target endpoints; convert the schema with SCT/DMS Schema
   Conversion for heterogeneous; create the task (full-load / CDC / both) with table mappings.
3. **Secure** — Secrets Manager creds, SSL endpoints, KMS storage, private networking,
   least-privilege DB grants, premigration assessment.
4. **Verify** — apply [[verify-by-running]]: `aws dms test-connection` for both endpoints,
   `aws dms describe-replication-tasks` for task status and `describe-table-statistics` for
   rows loaded plus validation pending/failed counts, confirming source and target row counts
   match before cutover.

## Inputs
Source + target engine/version and connectivity, homogeneous vs heterogeneous, downtime tolerance,
data volume + change rate, schema/code-object complexity, security/compliance, and cutover plan.

## Output
A replication instance (or Serverless), tested endpoints, converted schema (if heterogeneous), a
migration task with table mappings, scoped/secured connectivity, and verification of endpoint
connectivity, task status, and matching validated row counts.

## Notes
- Gotchas: DMS migrates data, not performance tuning — defer engine tuning to the database engine
  team (postgres/mongodb/etc.) and ongoing pipelines to data/etl-architect; heterogeneous moves
  need SCT first; CDC requires source supplemental logging/binlog enabled; LOBs and some types
  need special handling (limited/full LOB mode); validation can lag full-load; don't forget to
  delete the instance post-cutover to stop billing.
- IaC/CLI: Terraform `aws_dms_replication_instance`, `aws_dms_replication_subnet_group`,
  `aws_dms_endpoint`, `aws_dms_replication_task` (and `aws_dms_replication_config` for Serverless).
  CLI `aws dms create-replication-instance`, `create-endpoint`, `test-connection`,
  `create-replication-task`, `start-replication-task`, `describe-table-statistics`. CloudFormation
  `AWS::DMS::ReplicationInstance`, `::Endpoint`, `::ReplicationTask`.
