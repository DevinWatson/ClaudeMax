---
name: azure-database-migration-service
description: Use when designing, provisioning, configuring, or operating Azure Database Migration Service (DMS) — Azure's managed service for migrating databases to Azure with minimal downtime (Azure Database Migration Service). Covers the DMS instance, online (continuous-sync, near-zero-downtime) vs offline (one-time) migrations, source/target pairs (SQL Server to Azure SQL DB/MI/VM, PostgreSQL to Azure Database for PostgreSQL, MySQL, MongoDB to Cosmos DB), pre-migration assessment, schema + data migration, and cutover. Loads the knowledge to stand up DMS, configure a migration project/activity, run online or offline, and verify the cutover. Consumed by the azure-database-migration-service specialist and by the Azure role team (azure-platform-engineer / azure-cloud-architect) when operating the managed service.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-database-migration-service, migration, database, dms]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Database Migration Service

**Azure Database Migration Service (DMS)** is a **managed** service for migrating databases to Azure with **minimal
downtime**. This skill owns the **single-service DMS layer** — the instance, online vs offline migrations, source/
target pairing, schema + data movement, and cutover. Engine-internal tuning belongs to the per-engine data teams.

## Core concepts and components
- **DMS instance** — the regional service resource (injected into a **VNet/subnet** with line-of-sight to source +
  target) that runs migration **projects** and **activities**.
- **Online vs offline migration** — **offline** is a one-time bulk copy with downtime for the cutover window;
  **online** does an initial load then **continuous sync** of changes, enabling **near-zero-downtime** cutover.
- **Source / target pairs** — common paths: **SQL Server to Azure SQL Database / Managed Instance / SQL on VM**,
  **PostgreSQL to Azure Database for PostgreSQL**, **MySQL to Azure Database for MySQL**, and **MongoDB to Cosmos
  DB**. Each pair has its own connectivity + support matrix.
- **Pre-migration assessment** — checks compatibility/blocking issues (often via Data Migration Assistant / the
  assessment step) before data moves.
- **Schema + data migration** — migrate **schema** first, then **data**, then **continuous sync** (online) until
  **cutover** stops the source and promotes the target.

## Configuration and sizing
- Create the **DMS instance** (pick the **SKU/pricing tier**, place it in a VNet/subnet), create a **migration
  project** (source + target + migration type), define the **activity** (databases/tables, online/offline), and run
  it. Sizing = the DMS **SKU** (compute) sufficient for the data volume/throughput and the cutover window.

## Security and IAM
- Authenticate via **Entra ID**; use **RBAC** (Contributor on the DMS resource) plus **least-privilege database
  logins** on source (read/replication) and target (write/DDL). Place DMS in a **VNet** with NSG/firewall rules to
  source + target; store credentials in **Key Vault**; prefer private connectivity over public endpoints.

## Cost levers
- Billed by the **DMS SKU** (General Purpose/Business Critical vCores) while provisioned. Levers: choose the
  smallest SKU that meets the window, **delete the DMS instance** once migration completes, run **offline** when a
  downtime window is acceptable (cheaper/simpler), and batch databases to avoid idle time.

## Scaling and limits
- Concurrent databases per activity, throughput per SKU, supported source/target versions, and online-sync
  feature limits per engine. Large datasets scale by SKU + parallel activities; some engines cap online support.

## Operating procedure
1. **Provision** — create the **DMS instance** via **azurerm** (`azurerm_database_migration_service`) in a
   VNet/subnet, or `az dms create`; pick the SKU.
2. **Configure** — create a **project** (`azurerm_database_migration_project`) and **activity** (source/target,
   online vs offline, database list); run the **pre-migration assessment**, migrate **schema then data**, and start
   **continuous sync** for online (`az dms project task create`).
3. **Secure** — wire **Entra/RBAC**, least-privilege source/target logins, VNet + NSG connectivity, secrets in
   **Key Vault**.
4. **Verify** — apply [[verify-by-running]]: confirm the project/task status reports **sync in progress / completed**
   (`az dms project task show`), validate **row counts / checksums** on a sample of tables between source and
   target, perform/confirm the **cutover**, and record the validation result. Defer engine performance tuning to
   the data engine team.

## Inputs
The **source** (engine/version/connectivity), the **target** (Azure DB service), the **migration type** (online vs
offline), the **database/table scope**, the **DMS SKU + VNet** placement, and the **credentials/Key Vault** wiring.

## Output
A DMS migration: a right-sized instance in the correct VNet, a project/activity for the chosen source-target pair,
assessment cleared, schema + data migrated (with continuous sync for online), and a cutover plan — plus
verification that the task reports complete and sampled row counts/checksums match.

## Notes
- Gotchas: DMS instance left running after cutover (delete it); **VNet/NSG** connectivity to source+target missed;
  online sync **not supported** for every source/target combo (check the matrix); skipping the **assessment** hits
  blocking incompatibilities mid-migration; over-privileged migration logins; cutover without row-count
  validation. Engine tuning (indexes/query plans/parameters) is the per-engine data team's job. 2nd consumer: the
  Azure role team (azure-platform-engineer / azure-cloud-architect). Cross-cloud peer: AWS DMS.
- IaC/CLI: Terraform **azurerm** (`azurerm_database_migration_service`, `azurerm_database_migration_project`); CLI
  `az dms create`, `az dms project create`, `az dms project task create`; Bicep
  `Microsoft.DataMigration/*`. Assessment via Data Migration Assistant.
