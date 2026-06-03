---
name: aws-athena
description: Use when designing, provisioning, securing, or operating Amazon Athena — the serverless query service that runs SQL directly on data in S3 (Amazon Athena). Loads the Athena knowledge: the Trino/Presto SQL engine (engine v3), pay-per-scan model, the AWS Glue Data Catalog and crawlers, external tables over S3 with SerDes (Parquet/ORC/JSON/CSV) and partitioning + partition projection, workgroups (isolation, result location, data-scanned limits, cost controls), CTAS/INSERT INTO ETL, federated queries via Lambda connectors, views, and the columnar/partition/compression levers that cut bytes scanned. Covers how to register schemas, partition and format data for cheap fast scans, isolate workloads with workgroups, secure with IAM + Lake Formation, and verify results and bytes scanned. Consumed by the Athena specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, athena, analytics, serverless-sql, presto, s3]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Athena

A **serverless, interactive query service** that runs standard SQL (Trino/Presto engine) directly
against data in **Amazon S3** — no clusters to manage, billed **per terabyte scanned**. Schemas live
in the **AWS Glue Data Catalog**; performance and cost are governed by how the S3 data is formatted
and partitioned.

## Core concepts and components
- **Engine** — Athena engine v3 is Trino/Presto-based ANSI SQL; **serverless** with automatic
  concurrency, billed on **bytes scanned** (not compute time).
- **Glue Data Catalog** — the metastore: **databases**, **tables** (external, pointing at an S3
  location), and **schemas**. **Crawlers** auto-infer schema/partitions; you can also define DDL.
- **Tables + SerDes** — external tables over S3 objects in **Parquet/ORC** (columnar, preferred),
  JSON, CSV, Avro; the SerDe defines parsing. **Partitions** (e.g. by `dt`, `region`) prune scanned
  data; **partition projection** computes partitions from a pattern without catalog calls.
- **Workgroups** — isolate teams/workloads: separate **query-result S3 location**, **per-query and
  per-workgroup data-scanned limits**, enforced result encryption, CloudWatch metrics, and cost
  control.
- **CTAS / INSERT INTO** — create tables/partitions as query results (lightweight ETL into Parquet).
- **Federated queries** — query non-S3 sources (RDS, DynamoDB, etc.) via Lambda **connectors**.
- **Athena for Spark**, **views**, and **prepared statements** round out the surface.

## Configuration and sizing
- There is no cluster to size — tune **bytes scanned**: store **columnar (Parquet/ORC)**, **compress**
  (Snappy/ZSTD), **partition** on common filters, compact small files, and `SELECT` only needed
  columns. Set workgroup **data-scanned limits** as guardrails and a dedicated result bucket with
  lifecycle expiry. Use partition projection for high-cardinality time partitions.

## Security and IAM
- Gate access with IAM (`athena:*`, plus `glue:Get*` on catalog and `s3:GetObject` on data) and
  optionally **AWS Lake Formation** for fine-grained table/column/row permissions. Enforce result
  **encryption** (SSE-KMS) and a locked-down result bucket per workgroup; restrict who can change
  workgroup settings. Enable CloudTrail; results may contain sensitive data — control the result
  location.

## Cost levers
- Cost = **$ per TB scanned**. Biggest levers: columnar format, compression, partition pruning,
  projecting fewer columns, compacting small files, and CTAS to materialize hot subsets. Workgroup
  data-scanned limits cap runaway queries. Reserved-capacity (provisioned) pricing exists for steady
  high volume.

## Scaling and limits
- Serverless concurrency scales automatically but has per-account query/DDL rate limits and result-
  size considerations. Glue catalog has partitions-per-table and API-rate limits — partition
  projection avoids hot catalog calls at high partition counts.

## Operating procedure
1. **Provision** — create the workgroup, result-bucket, and Glue database via Terraform
   `aws_athena_workgroup` / `aws_glue_catalog_database` / `aws_s3_bucket`, or
   `aws athena create-work-group` + `aws glue create-database`.
2. **Configure** — define external tables (DDL or crawler) with the right SerDe, partitioning (or
   partition projection), result location, and data-scanned limits.
3. **Secure** — scoped IAM (+ Lake Formation), result encryption, locked result bucket, workgroup
   settings restricted.
4. **Verify** — apply [[verify-by-running]]: run a representative query via
   `aws athena start-query-execution` + `get-query-execution`/`get-query-results`; confirm correct
   results and inspect **DataScannedInBytes** — adding a partition filter or columnar format
   measurably reduces bytes scanned; the workgroup limit blocks an over-budget query — capture the
   actual output.

## Inputs
S3 data layout + formats, query patterns (filters/joins), partition keys, workgroup isolation/limits,
catalog source (crawler vs DDL), security model (IAM/Lake Formation), ETL needs (CTAS).

## Output
An Athena setup (Glue database/tables with SerDe + partitioning/projection, workgroup with result
location + scan limits + encryption, IAM/Lake Formation, optional CTAS pipeline), plus verification of
correct results and reduced bytes scanned.

## Notes
- Gotchas: cost is bytes-scanned not rows-returned, so `SELECT *` on row formats is expensive — use
  Parquet + partitions + column projection; new S3 partitions aren't visible until `MSCK REPAIR`/
  `ALTER TABLE ADD PARTITION` (or projection); many tiny files kill performance — compact; the result
  bucket can leak sensitive output; Glue catalog API limits bite at high partition counts; engine v3
  is Trino-flavored SQL (function/syntax differences from older Presto).
- IaC/CLI: Terraform `aws_athena_workgroup`, `aws_athena_database`, `aws_athena_named_query`,
  `aws_glue_catalog_database`, `aws_glue_catalog_table`, `aws_glue_crawler`,
  `aws_lakeformation_permissions`. CLI `aws athena start-query-execution`, `get-query-execution`,
  `get-query-results`, `create-work-group`; `aws glue create-table`, `start-crawler`. CloudFormation
  `AWS::Athena::WorkGroup`, `AWS::Athena::NamedQuery`, `AWS::Glue::Database`, `AWS::Glue::Table`,
  `AWS::Glue::Crawler`.
