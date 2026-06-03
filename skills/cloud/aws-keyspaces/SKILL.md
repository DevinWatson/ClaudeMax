---
name: aws-keyspaces
description: Use when designing, provisioning, securing, or operating Amazon Keyspaces — the serverless, Apache Cassandra-compatible (CQL) wide-column database. Loads the Keyspaces knowledge: keyspaces and tables, the Cassandra data model (partition key + clustering columns) and modeling for CQL access patterns, on-demand vs provisioned throughput with auto scaling, point-in-time recovery, TTL, CQL/driver compatibility and its limitations (no native secondary indexes, lightweight transactions caveats), Multi-Region replication, encryption at rest with KMS, IAM authentication (SigV4) plus service-specific credentials, and VPC (PrivateLink) endpoints. Covers how to model keys for CQL queries, pick a throughput mode, secure access, and verify reads/writes. Consumed by the Keyspaces specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they provision a serverless Cassandra workload. For deep Cassandra engine/CQL modeling defer to Cassandra expertise.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, keyspaces, cassandra, cql, wide-column, serverless, nosql]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Keyspaces

Fully managed, **serverless**, Apache **Cassandra-compatible** (CQL) wide-column database — no
clusters or nodes to run, single-digit-millisecond latency, capacity scales automatically. The
data-modeling discipline is Cassandra's (partition key + clustering columns chosen for the queries
you run); for deep engine/CQL modeling defer to **Cassandra** expertise. Choose Keyspaces for
serverless Cassandra/CQL workloads; choose DynamoDB for AWS-native serverless KV/document, or
RDS/Aurora for relational.

## Core concepts and components
- **Keyspace** — a namespace (like a database) containing **tables**. **Table** — rows with a
  **primary key** = a **partition key** (one or more columns; determines storage partition) plus
  optional **clustering columns** (order rows within a partition).
- **CQL** — Cassandra Query Language and Cassandra drivers work against Keyspaces, but it is a
  re-implementation: **no native secondary indexes**, restricted/eventually-consistent lightweight
  transactions, and some CQL features differ — model for query patterns, not ad-hoc queries.
- **Throughput** — **on-demand** (pay-per-request, auto scale) vs **provisioned** (RCU/WCU with
  application auto scaling). **TTL** auto-expires rows; **PITR** restores to any second in 35 days.
- **Multi-Region replication** — keyspaces replicated active-active across Regions.

## Configuration and sizing
- Model **access patterns first**, then choose a high-cardinality partition key to spread load and
  clustering columns to support your range queries. Avoid wide partitions and hot partitions. Start
  on-demand; switch hot tables to provisioned + auto scaling once traffic is predictable. There are
  no node/instance sizes to choose — it's serverless.

## Security and IAM
- Authenticate with **IAM (SigV4)** via the SigV4 authentication plugin, or with **service-specific
  credentials** (generated per IAM user) for standard Cassandra drivers. Encrypt at rest with a
  customer-managed KMS key. Reach it privately over **PrivateLink (VPC interface endpoints)** so
  traffic never leaves the VPC; always use TLS. Gate `cassandra:*` actions with least-privilege IAM
  scoped to keyspaces/tables; enable CloudTrail.

## Cost levers
- On-demand is convenient but pricier per request than well-utilized provisioned + auto scaling.
  Pay per read/write unit and per GB stored — keep rows/partitions lean and use TTL to expire data.
  PITR and Multi-Region replication add cost. No idle node cost (serverless), so non-prod is cheap.

## Scaling and limits
- Effectively unlimited scale; throughput auto-scales. Per-row size cap (~1 MB), per-partition and
  per-request limits apply — design partitions to stay bounded. No native secondary indexes (model
  alternate tables or use a separate search/index service). LWT (lightweight transactions) have
  consistency/throughput caveats.

## Operating procedure
1. **Provision** — create the keyspace and table with the partition/clustering key schema and
   throughput mode via Terraform `aws_keyspaces_keyspace` + `aws_keyspaces_table`, CQL `CREATE
   KEYSPACE/TABLE`, or `aws keyspaces create-keyspace`/`create-table`. Enable KMS encryption + PITR.
2. **Configure** — TTL, capacity mode + auto-scaling targets (provisioned), Multi-Region replication
   if needed.
3. **Secure** — KMS encryption, IAM (SigV4) or service-specific credentials, PrivateLink VPC
   endpoint + TLS, least-privilege IAM scoped to keyspace/table, CloudTrail.
4. **Verify** — apply [[verify-by-running]]: `aws keyspaces get-table` shows the expected schema,
   `encryptionSpecification` (KMS), `pointInTimeRecovery` enabled, and `ACTIVE`; with a CQL driver
   over TLS run an `INSERT` + `SELECT` round-trip for the intended principal and confirm expected
   rows; confirm an unauthorized principal/non-VPC request is denied; check CloudWatch for throttling.

## Inputs
Access patterns (every CQL query), partition + clustering key candidates and cardinality,
read/write volume + spikiness (→ throughput mode), consistency needs, Multi-Region need,
retention/TTL, encryption/KMS key, auth model (SigV4 vs service-specific credentials).

## Output
A keyspace + table definition (partition/clustering keys, throughput mode, KMS encryption, PITR on),
an access-pattern → key mapping, Multi-Region/TTL plan, IAM policy + VPC endpoint, and verification of
the schema, encryption, a working authorized CQL round-trip, denied unauthorized access, and no throttling.

## Notes
- Gotchas: **no native secondary indexes** — model an alternate table per query pattern; you can't
  change a table's primary key after creation (recreate); LWT consistency/throughput caveats vs
  open-source Cassandra; not 100% CQL-feature-complete — validate driver/feature support; hot/wide
  partitions throttle; ~1 MB row cap; some Cassandra admin/tuning concepts don't apply (it's serverless).
- IaC/CLI: Terraform `aws_keyspaces_keyspace`, `aws_keyspaces_table` (schema, `capacity_specification`,
  `point_in_time_recovery`, `encryption_specification`, `ttl`). CLI `aws keyspaces create-keyspace`,
  `create-table`, `get-table`, `update-table`; CQL via a Cassandra driver with the SigV4 plugin or
  service-specific credentials. CloudFormation `AWS::Cassandra::Keyspace`, `AWS::Cassandra::Table`.
