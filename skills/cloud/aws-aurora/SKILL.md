---
name: aws-aurora
description: Use when designing, provisioning, securing, or operating Amazon Aurora — the AWS-native, cloud-optimized relational engine compatible with PostgreSQL and MySQL. Loads the Aurora knowledge: the cluster model (a shared distributed storage volume with one writer and up to 15 reader instances), the cluster/reader/custom endpoints, Aurora Serverless v2 autoscaling capacity (ACUs), Global Database for cross-Region replication and low-latency reads, fast clone and backtrack, continuous backup to S3 with PITR, encryption at rest with KMS and TLS in transit, IAM database authentication, RDS Proxy connection pooling, and VPC placement. Covers how to size a cluster, place it privately, encrypt it, add readers/auto-scale, and verify writer/reader failover. Consumed by the Aurora specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect). For engine-internal tuning/modeling defer to the postgres data team.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, aurora, relational-database, managed-database, serverless-v2, postgres, mysql]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Aurora

AWS-native relational engine, wire-compatible with **PostgreSQL** and **MySQL**, built on a
purpose-built distributed storage layer that decouples compute from a self-healing, 6-way-replicated
storage volume across three AZs. Aurora owns the managed-service/cluster layer; engine-internal
tuning, schema, and query modeling belong to the engine teams (e.g. the postgres data team). Choose
Aurora over plain RDS when you want higher throughput, faster failover, serverless autoscaling, or
Global Database; choose DynamoDB for serverless NoSQL key-value.

## Core concepts and components
- **Cluster** — one **writer** (primary) instance plus up to 15 **reader** replicas that all share a
  single distributed storage volume (no per-replica copy, so replica lag is milliseconds).
- **Endpoints** — **cluster** (writer), **reader** (load-balanced across readers), and **custom**
  endpoints; failover promotes a reader to writer in seconds.
- **Aurora Serverless v2** — autoscales instance capacity in fine-grained **ACUs** (Aurora Capacity
  Units) up/down with load; mix provisioned and serverless instances in one cluster.
- **Global Database** — one primary Region + up to 5 secondary Regions with sub-second storage-level
  replication for low-latency reads and cross-Region DR.
- **Fast clone** (copy-on-write) and **backtrack** (rewind a MySQL cluster in place); continuous
  backup to S3 enables PITR.

## Configuration and sizing
- Pick provisioned db.r/db.x instance classes for steady, predictable load; Serverless v2 (min/max
  ACU) for variable or spiky load. Add readers for read scale-out and HA. Storage auto-grows; you
  don't pre-provision it. Use a custom cluster parameter group, never the default.

## Security and IAM
- Place the cluster in **private** subnets, restrict the security group to app SGs, encrypt at rest
  with a customer-managed KMS key (immutable after create) and require TLS. Enable **IAM database
  authentication** for short-lived tokens; store the master credential in Secrets Manager with
  rotation. Front spiky/serverless callers with **RDS Proxy**. Gate `rds:*` with least-privilege IAM.

## Cost levers
- Serverless v2 bills per-ACU-second — set a sane max to cap spend and a low min for idle. Storage
  and I/O bill per use (or flat with **I/O-Optimized** for I/O-heavy workloads). Reserved Instances
  for steady provisioned compute. Each reader is billable compute even though storage is shared.

## Scaling and limits
- Read scale = up to 15 readers; write scale is single-writer (shard at the app layer or use
  Limitless Database where available). Serverless v2 scales compute online; storage scales
  automatically to the engine limit. Global Database secondaries can be promoted for DR.

## Operating procedure
1. **Provision** — create a DB subnet group, cluster parameter group, the `aws_rds_cluster`, and one
   or more `aws_rds_cluster_instance`s (writer + readers, or Serverless v2 min/max ACU) via Terraform
   or `aws rds create-db-cluster` + `create-db-instance`.
2. **Configure** — endpoints, backup retention + window, Performance Insights, add readers / Global
   Database secondaries, attach RDS Proxy.
3. **Secure** — private placement, tight security group, KMS encryption, TLS-required, IAM auth or
   Secrets Manager rotation, least-privilege IAM.
4. **Verify** — apply [[verify-by-running]]: `aws rds describe-db-clusters` shows
   `StorageEncrypted=true` and `available` with the expected members; connect to the cluster
   (writer) endpoint over TLS and run `SELECT 1`, and to the reader endpoint for read-only; confirm
   a public/unauthorized connection is refused; run `failover-db-cluster` and confirm a reader is
   promoted and the cluster endpoint recovers.

## Inputs
Engine flavor (Postgres/MySQL) + version, load profile (steady vs spiky → provisioned vs Serverless
v2), read scale + HA needs (reader count), cross-Region DR (Global Database), backup retention/RPO,
VPC placement, encryption/KMS key, auth model.

## Output
A cluster definition (engine, encrypted, private, writer + readers or Serverless v2 ACU range),
endpoints, parameter group, backup config, Global Database / Proxy plan, and verification of
encryption, private placement, working writer/reader connections, and a successful failover.

## Notes
- Gotchas: encryption is immutable after create (restore a snapshot to change key); a cluster always
  has exactly one writer (no multi-writer scale-out by default); Serverless v2 won't scale to zero;
  reader endpoint load-balances only across readers (not the writer); Global Database secondaries are
  read-only until promoted; backtrack is MySQL-only and must be enabled up front.
- IaC/CLI: Terraform `aws_rds_cluster`, `aws_rds_cluster_instance`, `aws_rds_cluster_parameter_group`,
  `aws_db_subnet_group`, `aws_rds_global_cluster`, `aws_db_proxy`. CLI `aws rds create-db-cluster`,
  `create-db-instance`, `failover-db-cluster`, `create-global-cluster`. CloudFormation
  `AWS::RDS::DBCluster`, `AWS::RDS::DBInstance`, `AWS::RDS::GlobalCluster`.
