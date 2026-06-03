---
name: aws-rds
description: Use when designing, provisioning, securing, or operating Amazon RDS — the managed relational database service for PostgreSQL, MySQL, MariaDB, Oracle, and SQL Server. Loads the RDS knowledge: choosing an engine and instance class, Multi-AZ for HA and read replicas for scale-out reads, storage (gp3/io2/magnetic) and autoscaling, parameter and option groups, automated backups/snapshots and point-in-time restore, encryption at rest with KMS and in transit with TLS, IAM database authentication, VPC/subnet-group/security-group placement, maintenance and minor-version upgrades, and Performance Insights. Covers how to pick a class, place it privately in a VPC, encrypt it, back it up, and verify failover and connectivity. Consumed by the RDS specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they provision managed relational databases. For engine-internal tuning/modeling defer to the postgres data team.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, rds, relational-database, managed-database, postgres, mysql, encryption]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon RDS

Managed **relational** database service that provisions, patches, backs up, and fails over
PostgreSQL, MySQL, MariaDB, Oracle, and SQL Server engines so you operate the database, not the
host. RDS owns the managed-service layer; engine-internal tuning, schema, and query modeling belong
to the engine teams (e.g. the postgres data team). For an AWS-native, cloud-optimized relational
engine prefer Aurora; for NoSQL key-value use DynamoDB.

## Core concepts and components
- **DB instance** — an isolated database environment running one engine on a chosen **instance
  class** (db.t/m/r families: burstable, general, memory-optimized). **DB engine + version** —
  Postgres/MySQL/MariaDB/Oracle/SQL Server; minor versions auto-upgrade in the maintenance window.
- **Multi-AZ** — synchronous standby (or Multi-AZ cluster with two readable standbys) for HA and
  automatic failover; does NOT scale reads. **Read replicas** — asynchronous copies for read
  scale-out and cross-Region DR; can be promoted to standalone.
- **Storage** — gp3/io2 SSD or magnetic, with storage autoscaling and provisioned IOPS.
- **Parameter groups** (engine config) and **option groups** (engine features); **subnet group**
  pins the instance to VPC subnets.
- **Backups** — automated daily backups + transaction logs enable point-in-time restore (PITR);
  manual snapshots persist until deleted.

## Configuration and sizing
- Size the instance class for working-set memory and connections; size storage for capacity AND
  IOPS/throughput (gp3 lets you raise IOPS independently). Enable storage autoscaling with a cap.
- Turn on Multi-AZ for any production database. Add read replicas only when reads are the
  bottleneck — they add async lag. Use a custom parameter group, never the default, so changes are
  reviewable.

## Security and IAM
- Place the instance in **private** subnets (`publicly_accessible = false`); restrict the security
  group to app subnets/SGs only. Encrypt at rest with a customer-managed KMS key (immutable after
  create) and require TLS in transit. Optionally enable **IAM database authentication** to mint
  short-lived tokens instead of static passwords; store the master credential in Secrets Manager
  with rotation. Gate `rds:*` actions with least-privilege IAM; enable CloudTrail + RDS event subs.

## Cost levers
- Right-size the class and use Reserved Instances / Savings Plans for steady state; prefer gp3 over
  io2 unless you need extreme IOPS. Stop non-prod instances; delete stale manual snapshots. Multi-AZ
  roughly doubles instance cost — reserve it for production.

## Scaling and limits
- Vertical scale = modify instance class (brief failover on Multi-AZ). Read scale = up to 15 read
  replicas (engine-dependent). Storage scales online up to engine limits; connection limits scale
  with instance memory — front with a pooler (e.g. RDS Proxy) for spiky/serverless callers.

## Operating procedure
1. **Provision** — create a DB subnet group, parameter group, and the instance (engine, version,
   class, encrypted storage, Multi-AZ) via Terraform `aws_db_instance` or `aws rds create-db-instance`.
2. **Configure** — attach the custom parameter/option groups, set backup retention + maintenance
   window, enable Performance Insights, and add read replicas if needed.
3. **Secure** — private placement, tight security group, KMS encryption, TLS-required, IAM auth or
   Secrets Manager rotation, least-privilege IAM.
4. **Verify** — apply [[verify-by-running]]: `aws rds describe-db-instances` shows
   `StorageEncrypted=true`, `MultiAZ=true`, `PubliclyAccessible=false`, and `available`; connect
   from an app subnet over TLS and run `SELECT 1`; confirm a public/unauthorized connection is
   refused; trigger/observe a reboot-with-failover and confirm the endpoint recovers.

## Inputs
Engine + version, workload size (connections, working set, IOPS), HA/DR requirements (Multi-AZ,
cross-Region replicas), backup retention/RPO/RTO, VPC/subnet placement, encryption/KMS key, auth
model (IAM vs Secrets Manager).

## Output
A DB instance definition (engine/version/class, encrypted, Multi-AZ, private), parameter/option
groups, backup + maintenance config, read-replica plan, and verification of encryption, Multi-AZ,
private placement, a working TLS connection, and a successful failover.

## Notes
- Gotchas: encryption can't be toggled after create (restore a snapshot to change); major-version
  upgrades are manual and may need parameter changes; the default parameter group is immutable;
  deleting an instance without a final snapshot loses data; Multi-AZ standby is NOT readable (use a
  Multi-AZ cluster or a read replica); read-replica lag breaks read-your-writes.
- IaC/CLI: Terraform `aws_db_instance`, `aws_db_subnet_group`, `aws_db_parameter_group`,
  `aws_db_option_group`, `aws_db_instance` (replicate via `replicate_source_db`),
  `aws_db_proxy`. CLI `aws rds create-db-instance`, `create-db-subnet-group`,
  `modify-db-instance`, `create-db-snapshot`, `reboot-db-instance --force-failover`.
  CloudFormation `AWS::RDS::DBInstance`, `AWS::RDS::DBSubnetGroup`, `AWS::RDS::DBParameterGroup`.
