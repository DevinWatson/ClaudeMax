---
name: azure-sql-managed-instance
description: Use when designing, provisioning, securing, or operating Azure SQL Managed Instance — Azure's fully managed PaaS SQL Server instance offering near-100% engine compatibility for lift-and-shift of on-prem SQL Server (Azure SQL Managed Instance). Covers instance-scoped features (SQL Agent, cross-DB queries, CLR, Service Broker, linked servers, instance logins/collation), GP vs BC tiers and the vCore model, the mandatory delegated VNet subnet, instance pools, zone-redundant HA, auto-failover groups, automated backups (PITR + long-term retention), native migration (DMS / MI link / log replay), Entra auth, private connectivity, and TDE/Always Encrypted. Loads the knowledge: size the instance and VNet, choose HA/DR, provision, secure, and verify the instance is online and accepts queries. Consumed by the azure-sql-managed-instance specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure SQL Managed Instance).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-sql-managed-instance, databases, paas, sql-server-compat, vnet]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure SQL Managed Instance

Azure's **fully managed SQL Server instance** with **near-100% engine compatibility** — the lift-and-shift
target for on-prem SQL Server that needs **instance-level** features Azure SQL Database lacks. Azure runs
patching, backups, and HA; you own the instance, its databases, sizing, security, and migration. This
skill owns the **managed-service layer**, not deep T-SQL/engine tuning.

## Core concepts and components
- **Instance-scoped compatibility** — supports **SQL Server Agent**, **cross-database queries**, **CLR**,
  **Service Broker**, **linked servers**, instance-level **logins**, custom **collation**, and more — the
  features that make it a near-drop-in for on-prem SQL Server.
- **Service tiers (vCore)** — **General Purpose** (remote storage, cost-effective) vs **Business Critical**
  (local SSD + Always On replicas + a free **readable secondary**, lowest latency/highest SLA).
- **VNet deployment** — the instance is **always deployed into a delegated subnet** in your VNet (no public
  data endpoint by default); the subnet must be sized and dedicated to MI.
- **Instance pools** — share pre-provisioned compute across **small instances** to lower cost/density.
- **HA / DR** — built-in HA with optional **zone redundancy**; **auto-failover groups** replicate to a
  paired region for DR (replicating all databases on the instance).
- **Backups & migration** — automated backups (PITR 7-35 days + **long-term retention**); migrate via
  **Azure DMS**, the **Managed Instance link** (near-real-time replication from on-prem), or **log replay**.

## Configuration and sizing
- Pick a **tier** (GP vs BC) and **vCore + storage** size to the workload. Provision the **delegated
  subnet** (correctly sized, with the required route table/NSG) and decide **public data endpoint** on/off.
  Use an **instance pool** for several small instances. Set **zone redundancy** for HA and an **auto-
  failover group** for DR. Configure backup short-term + **long-term retention**. Plan the **migration**
  path (DMS / MI link / log replay).

## Security and IAM
- Use **Microsoft Entra authentication** (Entra admin) and least-privilege instance/database roles +
  **Azure RBAC**; prefer **managed identity** for app access. Keep the instance **private** (VNet subnet,
  no public endpoint, private connectivity / VPN/ExpressRoute) and lock the **NSG/route table**. **TDE** on
  by default (CMK in Key Vault optional), **Always Encrypted** for sensitive columns, **Auditing** +
  **Defender for SQL**.

## Cost levers
- Billed on **vCore compute + storage + backup storage over quota + DR replica**, with **Reserved Capacity
  + Azure Hybrid Benefit** discounts. Levers: **Hybrid Benefit** (reuse SQL Server licenses), **Reserved
  Capacity** for steady use, **instance pools** for many small instances, right-size GP vs BC, and stop/
  delete non-prod instances (MI cannot auto-pause like serverless SQL DB).

## Scaling and limits
- Scale **vCore/storage up or down online** (a reconfiguration with a brief failover). Limits: max vCore/
  storage per tier, **subnet size constrains the number of instances**, instance pool capacity, and a
  **non-trivial provisioning/scaling time** (can be hours for the first deploy due to the managed VNet
  setup). Tier/subnet changes are constrained.

## Operating procedure
1. **Provision** — create/prepare the **delegated VNet subnet** then the **managed instance** (tier, vCore,
   storage) via Terraform `azurerm_mssql_managed_instance` (with the subnet + `azurerm_subnet` delegation)
   (or Bicep `Microsoft.Sql/managedInstances`, or `az sql mi create`).
2. **Configure** — create databases (`azurerm_mssql_managed_database`), set **zone redundancy**, an **auto-
   failover group**, backup short-term + **long-term retention**, and the **migration** mechanism (DMS /
   MI link / log replay).
3. **Secure** — set the **Entra admin**, grant least-privilege roles / managed-identity access, keep it
   **private** (no public endpoint, locked NSG/routes), confirm **TDE** (+CMK), **Always Encrypted**, and
   enable Auditing/Defender for SQL.
4. **Verify** — apply [[verify-by-running]]: confirm the instance `state` is `Ready` (`az sql mi show`),
   then **connect over the private endpoint and run a query** (`sqlcmd -Q "SELECT @@VERSION"` / app via
   managed identity), confirm an **instance feature works** (e.g. SQL Agent job lists), and check failover-
   group state if configured. Capture state and query result.

## Inputs
The source SQL Server footprint and which **instance-level features** are required (Agent/CLR/linked
servers/cross-DB), tier (GP vs BC) and vCore/storage size, the VNet/subnet design and connectivity, HA
(zone) and DR (failover group) targets, backup retention, auth (Entra/managed identity), encryption
requirements, the migration path, and the region(s).

## Output
An Azure SQL Managed Instance setup: an instance in a delegated VNet subnet at the chosen tier/size, with
its databases, zone-redundant HA and/or auto-failover-group DR, backups + LTR, secured by Entra auth/
managed identity, private connectivity, TDE/Always Encrypted and auditing, plus a migration path — and
verification that the instance is Ready and accepts queries with instance features working.

## Notes
- Gotchas: this owns the **managed-service layer** — deep **T-SQL/index/query-plan tuning** belongs to a SQL
  Server engine specialist / the data engine teams under `agents/data/`; the instance **must live in a
  dedicated delegated subnet** (size it generously — it constrains instance count and is hard to change);
  **first provision/scale can take hours**; MI **cannot auto-pause** (unlike serverless SQL DB); use MI
  (not SQL DB) precisely when you need **instance-level features** (Agent, cross-DB, CLR, linked servers).
  For PaaS single databases without instance features use **azure-sql-database**. 2nd consumer: the Azure
  role team (azure-iac-engineer / azure-cloud-architect). Cross-cloud peers: AWS RDS for SQL Server, GCP
  Cloud SQL for SQL Server.
- IaC/CLI: Terraform `azurerm_mssql_managed_instance` + `azurerm_mssql_managed_database` (+
  `azurerm_mssql_managed_instance_failover_group`, delegated `azurerm_subnet`); Bicep/ARM
  `Microsoft.Sql/managedInstances`. CLI `az sql mi create` / `az sql mi show` / `az sql midb create`;
  verify with `sqlcmd -Q "SELECT @@VERSION"` over the private endpoint.
