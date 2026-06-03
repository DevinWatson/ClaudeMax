---
name: aws-glue
description: Use when designing, provisioning, securing, or operating AWS Glue — the serverless data-integration, ETL, and cataloging service (AWS Glue). Loads the Glue knowledge: the Glue Data Catalog (databases, tables, partitions, schema registry) as a Hive-compatible metastore, crawlers that infer schema/partitions, ETL jobs (Spark and Python-shell, worker types/DPUs, Ray, streaming), Glue Studio, DataBrew, workflows and triggers, job bookmarks for incremental processing, connections to JDBC/Kafka/MongoDB, DynamicFrames vs DataFrames, data-quality rules, and the security model (IAM job roles, KMS, VPC connections, Lake Formation). Covers crawler/catalog design, job sizing and DPUs, bookmarking for incrementals, cost levers, and verification. Consumed by the Glue specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, glue, analytics, etl, data-catalog, crawlers]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Glue

A **serverless data-integration service** for **discovering, cataloging, transforming, and moving**
data. The **Glue Data Catalog** is a Hive-compatible metastore shared across Athena/EMR/Redshift
Spectrum; **crawlers** populate it; **ETL jobs** (Spark/Python) and **DataBrew** transform the data.

## Core concepts and components
- **Data Catalog** — **databases**, **tables** (schema + S3/JDBC location), **partitions**, and a
  **schema registry**; serves as the central metastore for Athena, EMR, Redshift Spectrum, and Lake
  Formation.
- **Crawlers** — connect to S3/JDBC/DynamoDB/etc., **infer schema and partitions**, and create/update
  catalog tables on a schedule or on demand (with classifiers for custom formats).
- **ETL jobs** — **Apache Spark** jobs (Scala/PySpark) or lightweight **Python-shell** jobs; **Glue
  version** sets the Spark/Python runtime; **worker types** (**G.1X/G.2X/G.4X/G.8X**) and **number of
  workers** set capacity (billed in **DPU-hours**). Also **Ray** jobs and **streaming ETL** (from
  Kinesis/Kafka).
- **DynamicFrames** — Glue's schema-flexible abstraction over Spark DataFrames (handles
  semi-structured/evolving schemas, resolve-choice).
- **Glue Studio** (visual job authoring) and **DataBrew** (no-code visual data prep / 250+ transforms).
- **Orchestration** — **workflows**, **triggers** (scheduled/event/conditional), and **job bookmarks**
  for **incremental** processing; **connections** to JDBC/Kafka/MongoDB; **data quality** rules (DQDL).

## Configuration and sizing
- Size jobs by data volume/shuffle: pick **worker type** (G.2X+ for memory-heavy/shuffle, Python-shell
  for small/light jobs) and **worker count**; enable **auto-scaling** so Glue adds/removes workers.
  Enable **job bookmarks** to process only new data. Run crawlers only as often as data lands; use
  **partition projection**-friendly layouts to keep catalog partition counts sane. Choose
  **DynamicFrames** for messy/evolving schemas, native DataFrames for raw Spark performance.

## Security and IAM
- Each job runs under an **IAM role** (least-privilege S3/JDBC/catalog access). Use **Glue connections**
  + **VPC** to reach private JDBC/Kafka sources; enable **KMS encryption** for catalog metadata, job
  bookmarks, CloudWatch logs, and S3 outputs (via **security configurations**). Govern catalog data with
  **Lake Formation** permissions. Avoid embedding credentials — use Secrets Manager.

## Cost levers
- Billed in **DPU-hours** (per-second, 1-min minimum) — biggest levers: right-size **worker type/count**,
  enable **auto-scaling**, use **Python-shell** for small jobs, and **bookmarks** to avoid reprocessing.
  Crawlers billed per DPU-hour while running — schedule sparingly. DataBrew billed per session/node.
  Catalog storage/requests are cheap but API-rate-limited.

## Scaling and limits
- Spark jobs scale with worker count / auto-scaling up to account DPU quotas; Python-shell is single-
  node (1 or 0.0625 DPU). Catalog has partitions-per-table and API-rate limits (throttling at high
  partition counts). Concurrent-job-runs and crawler concurrency have per-account quotas.

## Operating procedure
1. **Provision** — create catalog database, crawler, and job via Terraform `aws_glue_catalog_database` /
   `aws_glue_crawler` / `aws_glue_job`, or `aws glue create-database` / `create-crawler` / `create-job`;
   attach the job IAM role.
2. **Configure** — crawler source/schedule/classifiers, job script (Spark/Python) + worker type/count +
   auto-scaling + bookmarks, connections for private sources, workflows/triggers, data-quality rules.
3. **Secure** — least-privilege job role, VPC connection, security configuration (KMS for
   catalog/bookmarks/logs/S3), Lake Formation grants, Secrets Manager for credentials.
4. **Verify** — apply [[verify-by-running]]: run the crawler (`aws glue start-crawler`) and confirm the
   table/partitions appear in the catalog; run the job (`aws glue start-job-run` →
   `get-job-run`) and confirm it reaches `SUCCEEDED` and writes expected output to S3/target; confirm
   **bookmarks** cause a re-run to process only new data — capture the actual run state and counts.

## Inputs
Sources (S3/JDBC/Kafka) + formats, catalog/crawler needs, transform logic, batch vs streaming, data
volume + shuffle (for sizing), incremental vs full (bookmarks), orchestration (workflows/triggers),
security model (IAM/VPC/KMS/Lake Formation).

## Output
A Glue setup (catalog databases/tables, crawlers, Spark/Python jobs with worker sizing + auto-scaling +
bookmarks, connections, workflows/triggers, data-quality rules, security configuration) plus
verification of a successful crawl and job run with correct output.

## Notes
- Gotchas: crawlers can **mis-infer or overwrite** schema (use classifiers / pin schema); many small
  files cripple Spark — compact; **bookmarks** silently skip data if misconfigured or if the source
  lacks a sortable key; catalog API throttles at high partition counts; DynamicFrame resolve-choice is
  needed for evolving schemas; Glue version changes Spark/Python runtime (test on upgrade); private
  sources need a VPC connection + correct security groups + a self-referencing rule.
- IaC/CLI: Terraform `aws_glue_catalog_database`, `aws_glue_catalog_table`, `aws_glue_crawler`,
  `aws_glue_job`, `aws_glue_trigger`, `aws_glue_workflow`, `aws_glue_connection`,
  `aws_glue_security_configuration`, `aws_glue_data_quality_ruleset`, `aws_glue_registry`,
  `aws_glue_schema`. CLI `aws glue create-crawler`/`start-crawler`, `create-job`/`start-job-run`/
  `get-job-run`, `create-database`/`create-table`, `aws databrew`. CloudFormation `AWS::Glue::Database`,
  `AWS::Glue::Table`, `AWS::Glue::Crawler`, `AWS::Glue::Job`, `AWS::Glue::Trigger`,
  `AWS::Glue::Workflow`, `AWS::Glue::Connection`, `AWS::Glue::SecurityConfiguration`.
