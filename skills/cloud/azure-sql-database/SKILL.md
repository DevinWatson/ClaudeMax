---
name: azure-sql-database
description: Use when designing, provisioning, securing, or operating Azure SQL Database — Azure's fully managed PaaS relational database engine (SQL Server based) for single databases and elastic pools (Azure SQL Database). Covers purchasing models (DTU vs vCore) and tiers (General Purpose, Business Critical, Hyperscale), the serverless auto-pause tier, elastic pools, zone-redundant HA, geo-replication and auto-failover groups, automated backups (PITR + long-term retention), Entra authentication and Azure RBAC, private endpoints/firewall, and TDE/Always Encrypted. Loads the knowledge: pick a purchasing model/tier and size, choose HA/DR, provision, secure, and verify the database is online and accepts queries. Consumed by the azure-sql-database specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure SQL Database).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-sql-database, databases, paas, hyperscale, failover-groups]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure SQL Database

Azure's **fully managed PaaS relational database** built on the SQL Server engine. Azure runs the OS,
patching, backups, and HA; you own the **database**, its sizing tier, security, and schema. This skill owns
the **managed-service layer** — provisioning, sizing, HA/DR, backups, and auth — not deep T-SQL/engine
tuning.

## Core concepts and components
- **Purchasing models** — **DTU** (bundled compute/storage/IO, simple) vs **vCore** (independent compute +
  storage, supports Hybrid Benefit and Reserved Capacity, recommended for most).
- **Service tiers (vCore)** — **General Purpose** (balanced, remote storage), **Business Critical**
  (local SSD + always-on replicas, lowest latency/highest SLA), **Hyperscale** (decoupled storage scaling
  to 100+ TB with fast restore and read replicas).
- **Serverless** — auto-scales compute within min/max vCores and **auto-pauses** when idle (you pay
  storage only) — ideal for intermittent workloads.
- **Elastic pools** — many databases share a pool of capacity (eDTU/vCore), smoothing variable per-DB load
  and cutting cost for fleets of small DBs.
- **HA / zone redundancy** — built-in HA; **zone-redundant** config spreads replicas across availability
  zones.
- **DR** — **active geo-replication** (readable secondaries) and **auto-failover groups** (a listener that
  fails over a set of databases to a paired region).
- **Backups** — automated full/diff/log backups giving **point-in-time restore** (7-35 days) plus **long-
  term retention** (weeks-years).

## Configuration and sizing
- Pick **vCore** (or DTU for simplicity), a **tier** (GP/BC/Hyperscale) by latency/HA/scale needs, and a
  **compute size**. Use **serverless** for intermittent load, **elastic pools** for many small DBs. Set
  **zone redundancy** for HA and an **auto-failover group** for cross-region DR. Configure backup
  short-term + **long-term retention**. Size storage and IO to the workload.

## Security and IAM
- Use **Microsoft Entra authentication** (Entra admin + Entra-only auth) and least-privilege database
  roles/**Azure RBAC**; prefer **managed identity** for app connections (no passwords). Lock down with
  **private endpoints** / firewall rules / VNet rules (disable public access). **Transparent Data
  Encryption** is on by default (optionally CMK in Key Vault); use **Always Encrypted** for sensitive
  columns and enable **Auditing** + **Defender for SQL**.

## Cost levers
- Billed on **compute (provisioned vCores/DTU or serverless usage) + storage + backup storage over the
  free quota + geo-replica/DR**. Levers: **serverless + auto-pause** for intermittent DBs, **elastic
  pools** to share capacity across many DBs, **Reserved Capacity + Azure Hybrid Benefit** for steady vCore
  workloads, right-size the tier (GP vs BC), and Hyperscale only when storage/scale demands it.

## Scaling and limits
- Scale **compute up/down online** (tier/size change, brief reconfiguration), **serverless** auto-scales
  within bounds, and **Hyperscale** scales storage and adds read replicas. Limits: max size and IO per
  tier/size, DTU/vCore caps, max databases per elastic pool, geo-replica count; some changes
  (e.g. into/out of Hyperscale) are one-way or require migration.

## Operating procedure
1. **Provision** — create the **logical server** then the **database** at the chosen purchasing model/tier/
   size via Terraform `azurerm_mssql_server` + `azurerm_mssql_database` (or Bicep
   `Microsoft.Sql/servers` + `/databases`, or `az sql server create` / `az sql db create`).
2. **Configure** — set **zone redundancy**, **elastic pool** membership if used, **serverless** min/max +
   auto-pause, backup short-term + **long-term retention**, and an **auto-failover group** for DR.
3. **Secure** — set the **Entra admin** (Entra-only auth), grant least-privilege roles / managed-identity
   access, enable **private endpoint**/firewall (disable public), confirm **TDE** (+ CMK if required),
   **Always Encrypted** for sensitive columns, and enable Auditing/Defender for SQL.
4. **Verify** — apply [[verify-by-running]]: confirm the database `status` is `Online` (`az sql db show`),
   then **connect and run a query** (`sqlcmd`/`az sql db` query or app using managed identity) — e.g.
   `SELECT 1` / `SELECT @@VERSION` — and confirm failover-group/replica state if configured. Capture status
   and query result.

## Inputs
The workload profile (size, IO, latency/HA needs, intermittent vs steady), purchasing model and tier
choice, single DB vs elastic pool, HA (zone redundancy) and DR (failover group) targets, backup retention,
auth model (Entra/managed identity), network exposure (private endpoint/firewall), encryption requirements,
and the region(s).

## Output
An Azure SQL Database setup: a logical server + database (or pool member) at the chosen model/tier/size,
with zone-redundant HA and/or an auto-failover group, configured backups + LTR, secured by Entra auth/
managed identity, private networking, TDE/Always Encrypted and auditing — plus verification that the
database is Online and accepts queries.

## Notes
- Gotchas: this owns the **managed-service layer** — deep **T-SQL/index/query-plan tuning** belongs to a SQL
  Server engine specialist / the data engine teams under `agents/data/`; **DTU vs vCore** and **into/out of
  Hyperscale** changes can be one-way/migrations; **serverless auto-pause** adds resume latency on first
  connection; firewall/private-endpoint misconfig is the top connectivity failure; **failover groups**
  operate at the server level for a set of DBs; cross-region DR adds replica cost. For near-100% SQL Server
  instance compatibility (SQL Agent, cross-DB queries, CLR) use **azure-sql-managed-instance**. 2nd
  consumer: the Azure role team (azure-iac-engineer / azure-cloud-architect). Cross-cloud peers: AWS RDS,
  GCP Cloud SQL.
- IaC/CLI: Terraform `azurerm_mssql_server` + `azurerm_mssql_database` (+ `azurerm_mssql_elasticpool`,
  `azurerm_mssql_failover_group`); Bicep/ARM `Microsoft.Sql/servers` + `/databases`. CLI `az sql server
  create` / `az sql db create` / `az sql db show`; verify with `sqlcmd -Q "SELECT 1"`.
