---
name: aws-documentdb
description: Use when designing, provisioning, securing, or operating Amazon DocumentDB — the managed, MongoDB-compatible document database. Loads the DocumentDB knowledge: the cluster model (a shared distributed storage volume with one primary and up to 15 replica instances), cluster/reader endpoints and failover, instance-based vs Elastic Clusters (sharded) deployments, MongoDB API/driver compatibility and its limitations, instance class sizing, automated backups/snapshots with PITR, encryption at rest with KMS and TLS in transit, in-database users + role-based access control, VPC/subnet-group placement and security groups, and change streams. Covers how to size a cluster, place it privately, encrypt it, add replicas, and verify connectivity and failover. Consumed by the DocumentDB specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect). For engine-internal modeling/query tuning defer to the mongodb data team.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, documentdb, document-database, mongodb-compatible, managed-database, encryption]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon DocumentDB

Managed, **MongoDB-compatible** document (JSON) database built on the same decoupled, distributed,
self-healing storage layer as Aurora. DocumentDB owns the managed-service/cluster layer;
engine-internal document modeling, index strategy, and aggregation-pipeline tuning belong to the
**mongodb data team**. Choose DocumentDB for managed MongoDB-API document workloads in a VPC; choose
DynamoDB for serverless key-value, or RDS/Aurora for relational.

## Core concepts and components
- **Cluster** — one **primary** (read/write) instance plus up to 15 **replica** instances sharing a
  single distributed storage volume (replica lag in the tens of ms). **Endpoints** — cluster
  (primary) and reader; failover promotes a replica in seconds.
- **Deployment types** — **instance-based** clusters (you choose instance classes) and **Elastic
  Clusters** (sharded, scale to petabytes/millions of reads-writes without choosing instances).
- **MongoDB compatibility** — speaks the MongoDB 4.x/5.x wire protocol and works with MongoDB
  drivers/tools, but is a re-implementation: some operators, commands, and features are unsupported.
- **Change streams** — tailable feed of collection changes for CDC.

## Configuration and sizing
- Pick db.r/db.t instance classes sized for the working set and connections; add replicas for read
  scale-out and HA across AZs. Storage auto-grows; you don't pre-provision it. Use Elastic Clusters
  when a single primary's write throughput or dataset size is the limit. Always use a custom cluster
  parameter group.

## Security and IAM
- DocumentDB authenticates with **in-database users + RBAC** (not native IAM database auth); store
  those credentials in Secrets Manager with rotation. Place the cluster in **private** subnets,
  restrict the security group to app SGs, encrypt at rest with a customer-managed KMS key (immutable
  after create), and require TLS in transit. Gate `rds:*`/`docdb` management actions with
  least-privilege IAM; enable auditing and CloudTrail.

## Cost levers
- Right-size instance classes and use Reserved Instances for steady state; each replica is billable
  compute even though storage is shared. Storage and I/O bill per use. Scale in replicas you don't
  need; stop non-prod clusters.

## Scaling and limits
- Read scale = up to 15 replicas; instance-based clusters are single-primary for writes (use Elastic
  Clusters to shard writes). Vertical scale = modify instance class (brief failover). Connection
  limits scale with instance memory. Not 100% MongoDB-feature-complete — validate driver/feature
  support before migrating.

## Operating procedure
1. **Provision** — create a DB subnet group, cluster parameter group, the `aws_docdb_cluster`, and
   `aws_docdb_cluster_instance`s (primary + replicas) via Terraform or `aws docdb create-db-cluster`
   + `create-db-instance`.
2. **Configure** — endpoints, backup retention + window, replicas across AZs, TLS parameter, change
   streams, and an Elastic Cluster if sharding is needed.
3. **Secure** — private placement, tight security group, KMS encryption, TLS-required, in-database
   RBAC users in Secrets Manager with rotation, least-privilege management IAM.
4. **Verify** — apply [[verify-by-running]]: `aws docdb describe-db-clusters` shows
   `StorageEncrypted=true` and `available` with expected members; connect with the `mongo`/driver
   over TLS and run `db.runCommand({ping:1})` plus an insert/find round-trip on the primary and a
   read on the reader endpoint; confirm a public/unauthorized connection is refused; run
   `failover-db-cluster` and confirm a replica is promoted and the cluster endpoint recovers.

## Inputs
MongoDB version compatibility needed + feature list to validate, working-set size + connections,
read scale/HA (replica count), sharding need (Elastic Clusters), backup retention/RPO, VPC
placement, encryption/KMS key, in-DB user/role model.

## Output
A cluster definition (encrypted, private, primary + replicas or Elastic), endpoints, parameter
group, backup config, RBAC user/role plan, and verification of encryption, private placement, a
working TLS connection (primary + reader), and a successful failover.

## Notes
- Gotchas: NOT fully MongoDB-compatible — confirm every operator/command/feature your app uses;
  encryption is immutable after create (restore a snapshot to change key); authentication is in-DB
  RBAC, not IAM database auth; the primary is single-writer (use Elastic Clusters to shard); replica
  lag breaks read-your-writes; deleting a cluster without a final snapshot loses data.
- IaC/CLI: Terraform `aws_docdb_cluster`, `aws_docdb_cluster_instance`,
  `aws_docdb_cluster_parameter_group`, `aws_docdb_subnet_group`. CLI `aws docdb create-db-cluster`,
  `create-db-instance`, `failover-db-cluster`, `create-db-cluster-snapshot`. CloudFormation
  `AWS::DocDB::DBCluster`, `AWS::DocDB::DBInstance`, `AWS::DocDB::DBClusterParameterGroup`.
