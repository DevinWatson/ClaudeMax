---
name: aws-timestream
description: Use when designing, provisioning, securing, or operating Amazon Timestream — the serverless time-series database for IoT, application metrics, and operational telemetry. Loads the Timestream knowledge: the LiveAnalytics two-tier storage (in-memory store for recent/fast writes and queries, magnetic store for long-term cheap reads), databases and tables, retention policies per tier, dimensions vs measures and multi-measure records, scheduled queries for rollups/downsampling, the time-series query language and built-in functions (interpolation, smoothing), KMS encryption, and least-privilege IAM. Covers how to size the memory/magnetic retention split, write and query records, encrypt, and verify ingestion and query latency. Consumed by the Timestream specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they provision time-series telemetry stores. For general-purpose relational/NoSQL workloads pick RDS/DynamoDB instead.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, timestream, time-series, telemetry, iot, metrics, serverless]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Timestream

Serverless **time-series** database purpose-built for high-volume timestamped data (IoT sensors,
DevOps metrics, clickstreams). It auto-scales ingestion and storage and separates hot from cold
data into two tiers so recent data is fast and old data is cheap. Use it for time-ordered
measurements; for general relational/NoSQL use RDS/Aurora or DynamoDB.

## Core concepts and components
- **Database → table** — tables hold time-series records; each record has a **timestamp**,
  **dimensions** (string metadata that identifies a series, e.g. `device_id`, `region`), and
  **measures** (the numeric/boolean values). Prefer **multi-measure records** (several measures per
  row) over single-measure to cut storage and speed queries.
- **Memory store** — in-memory tier for recent writes; fast point and recent-window queries; records
  must arrive within its retention window or are rejected as late.
- **Magnetic store** — durable, cost-optimized tier for historical reads; data ages out of memory
  into it automatically. **Magnetic store writes** allow backfilling late/historical data.
- **Retention** — set per table: memory-store retention (hours/days) and magnetic-store retention
  (days/years). Data older than magnetic retention is deleted.
- **Scheduled queries** — managed, periodic queries that compute rollups/downsamples into a
  derived table to cut query cost on dashboards.

## Configuration and sizing
- Set memory-store retention to cover your hot query window plus expected write lateness; set
  magnetic retention to your compliance/analysis horizon. Enable magnetic-store writes only if you
  must backfill. Model series cardinality from dimension combinations — high cardinality raises cost
  and query latency; keep dimensions stable and bounded.

## Security and IAM
- Encrypt at rest with a customer-managed **KMS** key (default is AWS-managed). Gate
  `timestream:WriteRecords`, `Select`, and `DescribeEndpoints` with least-privilege IAM; Timestream
  has no resource policies, so control access via identity policies + tags. Connect over the public
  endpoint or an **interface VPC endpoint** (PrivateLink). Enable CloudTrail for the control plane.

## Cost levers
- Priced on writes, stored GB per tier, and bytes scanned per query. Use multi-measure records,
  short memory retention, and **scheduled queries** to pre-aggregate dashboards. Query narrow time
  ranges and select only needed measures to reduce scanned bytes.

## Scaling and limits
- Ingestion and storage scale automatically; there is no instance to size. Watch per-table and
  per-account limits (records per write, query result size, dimension/measure counts) and high
  series cardinality, which degrades query performance.

## Operating procedure
1. **Provision** — create the database and table with memory- and magnetic-store retention via
   Terraform `aws_timestreamwrite_database` / `aws_timestreamwrite_table` or
   `aws timestream-write create-database` / `create-table`.
2. **Configure** — set retention per tier, enable magnetic-store writes only if backfilling, define
   multi-measure schema, and add scheduled queries for rollups.
3. **Secure** — customer-managed KMS key, least-privilege IAM, interface VPC endpoint for private
   access, CloudTrail on.
4. **Verify** — apply [[verify-by-running]]: `describe-table` shows the retention split and
   `ACTIVE`; `write-records` ingests and a `query` returns the rows within the expected latency; an
   unauthorized principal is denied; confirm KMS encryption on the table.

## Inputs
Series identity (dimensions) and measures, write volume + lateness, hot query window, retention
horizon, cardinality estimate, KMS key, VPC/private-access requirement, rollup/dashboard needs.

## Output
A database/table definition with per-tier retention, a multi-measure schema, scheduled-query
rollups, KMS encryption, least-privilege IAM, and verification of ingestion, query latency, and
denied unauthorized access.

## Notes
- Gotchas: records older than memory-store retention are rejected unless magnetic-store writes are
  enabled; you cannot lower magnetic retention below memory retention; high dimension cardinality
  blows up cost/latency; query cost is by scanned bytes — always bound the time range; SDK requires
  endpoint discovery (separate write/query endpoints).
- IaC/CLI: Terraform `aws_timestreamwrite_database`, `aws_timestreamwrite_table`,
  `aws_timestreamquery_scheduled_query`. CLI `aws timestream-write create-database`,
  `create-table`, `write-records`; `aws timestream-query query`. CloudFormation
  `AWS::Timestream::Database`, `AWS::Timestream::Table`, `AWS::Timestream::ScheduledQuery`.
