---
name: gcp-cloud-sql
description: Use when designing, provisioning, securing, or operating Cloud SQL — Google Cloud's fully managed relational database for MySQL, PostgreSQL, and SQL Server, with instances and tiers, high availability (regional, synchronous standby), read replicas (including cross-region), automated backups and point-in-time recovery, maintenance windows, and database flags, plus IAM database authentication, private IP/Cloud SQL Auth Proxy, CMEK, and cost/scaling levers. Loads the Cloud SQL knowledge: pick an engine and tier, configure HA and read replicas, set backups/PITR and maintenance, secure with private IP and IAM, and verify failover and connectivity. Consumed by the Cloud SQL specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they handle managed relational workloads (Cloud SQL).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-sql, databases, mysql, postgresql, sql-server, high-availability]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud SQL

Google Cloud's fully managed relational database service for **MySQL**, **PostgreSQL**, and
**SQL Server**. Google operates the engine, OS, patching, backups, and replication; you choose the
engine, instance tier, HA, and connectivity.

## Core concepts and components
- **Instance / tier** — a managed VM running one engine, sized by a **machine type / tier** (vCPU +
  memory) with attached SSD/HDD storage that can **auto-increase**.
- **High availability** — a **regional HA** instance keeps a **synchronous standby** in a second zone
  with automatic **failover** (shared regional storage). Single-zone instances have no automatic
  failover.
- **Read replicas** — asynchronous **read replicas** (in-region and **cross-region**) offload reads;
  a replica can be **promoted** to a standalone primary (also used in migrations/DR).
- **Backups / PITR** — automated daily **backups** plus binary/WAL logging for **point-in-time
  recovery**; on-demand backups; restore creates/overwrites an instance.
- **Maintenance** — Google-managed patching within a configurable **maintenance window** and
  **deny period**; **database flags** tune engine parameters.
- **Connectivity** — **private IP** (VPC private services access), public IP with authorized networks,
  and the **Cloud SQL Auth Proxy** for secure IAM-based connections.

## Configuration and sizing
- Choose the **engine + version**, then the **tier** sized to working set and connections. Enable
  **regional HA** for production. Add **read replicas** for read scale-out and cross-region DR. Set
  **storage auto-increase**, backup window + retention, **PITR**, maintenance window/deny periods, and
  engine **database flags**.

## Security and IAM
- Grant least-privilege roles (`roles/cloudsql.client`, `roles/cloudsql.editor`, `roles/cloudsql.admin`).
  Prefer **private IP** (no public IP) and the **Cloud SQL Auth Proxy**; enable **IAM database
  authentication**; require SSL/TLS; encrypt with **CMEK**; audit via Cloud Audit Logs.

## Cost levers
- The dominant levers are the **instance tier (vCPU/memory)**, **HA** (roughly doubles compute for the
  standby), **number of read replicas**, **storage size + auto-increase** (storage never shrinks), and
  backup retention/cross-region egress. Right-size the tier, scale replicas to read load, cap storage
  growth, and use **committed-use discounts** for steady instances.

## Scaling and limits
- Vertical scaling resizes the tier (brief restart); read scaling adds replicas; storage grows
  automatically and **cannot shrink**. Limits: max connections per tier, max read replicas per primary,
  per-instance storage caps, and per-region quotas. Failover and tier changes incur short downtime.

## Operating procedure
1. **Provision** — enable the Cloud SQL Admin API, create the **instance**
   (Terraform `google_sql_database_instance`) with engine/version, tier, **regional HA**, storage
   auto-increase, backup + PITR, and **private IP** via private services access.
2. **Configure** — create databases and users (`google_sql_database`, `google_sql_user`), set
   **database flags**, maintenance window/deny periods, and add **read replicas** (a second
   `google_sql_database_instance` with `master_instance_name`).
3. **Secure** — scope IAM least-privilege, disable public IP / set authorized networks, enable IAM
   database auth and SSL, apply CMEK, and enable audit logging.
4. **Verify** — apply [[verify-by-running]]: connect via the Auth Proxy (`gcloud sql connect` or
   the proxy + `mysql`/`psql`/`sqlcmd`) and confirm read/write on the primary; query a **read replica**
   and confirm replica reads; confirm HA by checking the failover-replica/availability type
   (`gcloud sql instances describe`) and that a backup exists (`gcloud sql backups list`) — capture the
   connection, replica read, and HA/backup output.

## Inputs
Engine + version, workload profile (read/write ratio, connections), data volume + growth, latency/HA
targets, DR/region needs, tier, replica count, backup/PITR retention, maintenance constraints,
connectivity model (private IP/proxy), IAM/auth + CMEK requirements, and cost ceiling.

## Output
A Cloud SQL setup (instance with chosen engine/tier, regional HA, read replicas, backups/PITR,
maintenance window, database flags) on private networking with least-privilege IAM, IAM database auth,
SSL, and CMEK, plus verification of primary/replica connectivity, HA, and backups.

## Notes
- Gotchas: storage auto-increases but **never shrinks** (cost ratchet); enabling HA roughly doubles
  compute cost; tier changes and failovers cause brief downtime; read replicas are asynchronous (lag);
  SQL Server and MySQL/PostgreSQL differ in supported flags and HA mechanics; public IP without
  authorized networks/SSL is a common exposure; cross-region replicas add egress cost.
- IaC/CLI: Terraform `google_sql_database_instance` (incl. replicas via `master_instance_name`),
  `google_sql_database`, `google_sql_user`, `google_sql_ssl_cert`, plus `google_project_service` and
  private-services-access resources. CLI `gcloud sql` (instances/databases/users/backups/connect) and
  the Cloud SQL Auth Proxy for connectivity.
