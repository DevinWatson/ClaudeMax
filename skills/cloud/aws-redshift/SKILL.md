---
name: aws-redshift
description: Use when designing, provisioning, securing, or operating Amazon Redshift — the petabyte-scale managed columnar data warehouse (Amazon Redshift). Loads the Redshift knowledge: provisioned clusters (leader + compute nodes, slices) on RA3 vs legacy DC2, Redshift Serverless (RPUs, base capacity, auto-pause), table design (distribution styles KEY/EVEN/ALL/AUTO, sort keys, compression encodings, PK/FK hints), workload management (WLM/automatic WLM, concurrency scaling, short-query acceleration), Spectrum over S3 via the Glue Data Catalog, data sharing, materialized views, COPY/UNLOAD, federated and zero-ETL ingestion, VACUUM/ANALYZE maintenance, the security model (IAM, KMS, VPC, RBAC, column/row security, Lake Formation), and cost levers. Covers how to model tables, load data, tune queries, and verify performance. Consumed by the Redshift specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, redshift, analytics, data-warehouse, columnar, spectrum]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Redshift

A **petabyte-scale, managed columnar data warehouse** with massively parallel processing (MPP). Runs as
**provisioned clusters** or **Redshift Serverless**, queries S3 directly via **Spectrum**, and is tuned
primarily through **distribution** and **sort** key design.

## Core concepts and components
- **Provisioned cluster** — a **leader node** (planning/aggregation) + **compute nodes** divided into
  **slices** (the unit of parallelism). **RA3** nodes (managed storage in S3, scale compute and storage
  independently, support data sharing) vs legacy **DC2** (local SSD).
- **Redshift Serverless** — no cluster to manage; capacity in **RPUs** with a **base capacity** and
  **auto-pause**; billed per RPU-second while active. Good for variable/intermittent workloads.
- **Table design** — **distribution style** (**KEY** to co-locate joins, **EVEN**, **ALL** for small
  dimensions, **AUTO**), **sort keys** (compound vs interleaved) for zone-map pruning, and **column
  compression encodings** (AZ64/ZSTD). PK/FK declared as optimizer hints (not enforced).
- **Workload management** — **automatic WLM** or manual **query queues**, **concurrency scaling**
  (transient clusters absorb bursts), **short-query acceleration**.
- **Spectrum** — query external tables over S3 (Glue Data Catalog) without loading. **Data sharing**
  exposes data across clusters/accounts live. **Materialized views**, **COPY**/**UNLOAD** for bulk S3
  I/O, **federated queries** to RDS/Aurora, and **zero-ETL** ingestion from Aurora/RDS.

## Configuration and sizing
- Choose **RA3** for elastic storage + data sharing, **Serverless** for spiky/intermittent use. Size by
  data volume and concurrency. Model tables: distribute large fact tables on a high-cardinality
  **join/distribution key**, replicate small dimensions with **DIST ALL**, set **sort keys** on common
  filter/range columns, and let **AUTO** + **ANALYZE** handle the rest where unsure. Use **concurrency
  scaling** for bursty read concurrency.

## Security and IAM
- Launch in a **VPC**, use **IAM roles** attached to the cluster for COPY/UNLOAD/Spectrum (no embedded
  keys), enable **KMS encryption at rest** and TLS in transit, manage in-database access with
  **roles/RBAC**, **column-level** and **row-level security**, and **Lake Formation** for Spectrum data.
  Enable audit logging and restrict the master/admin user.

## Cost levers
- **Provisioned**: node type/count, **reserved nodes** for steady use, pause/resume dev clusters,
  concurrency-scaling **free credits** then per-second. **RA3 managed storage** billed per GB
  separately from compute. **Serverless**: base capacity + auto-pause cut idle cost. Spectrum billed per
  TB scanned (format/partition S3 data). UNLOAD/COPY incur S3 cost.

## Scaling and limits
- Resize provisioned clusters via **elastic resize** (fast, node count) or **classic resize** (type
  change). Concurrency scaling adds transient capacity for read bursts. Serverless scales RPUs to
  workload within configured limits. Per-cluster connection/query and Spectrum/Glue quotas apply;
  interleaved sort keys need periodic VACUUM REINDEX.

## Operating procedure
1. **Provision** — create the cluster or serverless workgroup via Terraform `aws_redshift_cluster` /
   `aws_redshiftserverless_workgroup` + `aws_redshiftserverless_namespace`, or
   `aws redshift create-cluster` / `aws redshift-serverless create-workgroup`; attach the IAM role and
   place it in the VPC.
2. **Configure** — node type/count or RPU base capacity, WLM/automatic WLM + concurrency scaling, table
   DDL with distribution/sort keys + compression, Spectrum external schema (Glue), materialized views.
3. **Secure** — VPC + security groups, IAM role for COPY/UNLOAD/Spectrum, KMS at rest + TLS, RBAC +
   column/row security, audit logging.
4. **Verify** — apply [[verify-by-running]]: load a sample with `COPY` from S3, run a representative
   join/aggregation, and check `EXPLAIN`/`STL_*`/`SVL_*` system tables and `SVL_QUERY_REPORT` to confirm
   the distribution/sort keys prune data and avoid broadcast/redistribution; confirm concurrency scaling
   or serverless capacity adjusts under load — capture the actual plan and runtime.

## Inputs
Data volume + growth, query/join patterns + concurrency, provisioned vs serverless, table grain +
join/filter columns (for dist/sort keys), S3 data for Spectrum, ingestion (COPY/zero-ETL/federated),
security model (VPC/IAM/KMS/RBAC/Lake Formation).

## Output
A Redshift setup (cluster or serverless workgroup, WLM/concurrency scaling, table DDL with
distribution/sort/encoding, Spectrum external schema, materialized views, IAM/KMS/RBAC security) plus
verification of query plans and runtime improvement.

## Notes
- Gotchas: a bad **distribution key** causes data-redistribution/broadcast that dominates runtime;
  missing/maintained **sort keys** lose zone-map pruning; PK/FK are hints, not enforced — duplicate-free
  loads are your responsibility; **VACUUM/ANALYZE** needed after big loads (and VACUUM REINDEX for
  interleaved keys); leader-node bottlenecks on heavy aggregation; Spectrum cost is bytes-scanned (use
  Parquet+partitions); data sharing requires RA3; serverless auto-pause adds cold-start latency.
- IaC/CLI: Terraform `aws_redshift_cluster`, `aws_redshift_parameter_group`,
  `aws_redshift_subnet_group`, `aws_redshiftserverless_namespace`, `aws_redshiftserverless_workgroup`,
  `aws_redshift_scheduled_action`. CLI `aws redshift create-cluster`/`resize-cluster`/`pause-cluster`,
  `aws redshift-serverless create-workgroup`, `aws redshift-data execute-statement`. CloudFormation
  `AWS::Redshift::Cluster`, `AWS::Redshift::ClusterParameterGroup`,
  `AWS::RedshiftServerless::Namespace`, `AWS::RedshiftServerless::Workgroup`.
