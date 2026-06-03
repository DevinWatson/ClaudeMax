---
name: azure-database-for-postgresql
description: Use when designing, provisioning, securing, or operating Azure Database for PostgreSQL — Azure's fully managed community PostgreSQL PaaS, primarily the Flexible Server deployment (Azure Database for PostgreSQL). Covers compute tiers (Burstable/General Purpose/Memory Optimized) and storage/IOPS sizing, zone-redundant and same-zone HA, read replicas, automated backups with point-in-time restore, maintenance windows and version upgrades, extensions and server parameters, connection pooling (PgBouncer), Entra ID authentication and managed identities, VNet integration/private access and firewall, and CMK encryption. Loads the knowledge: pick a tier and size, choose HA/replicas, provision, secure, and verify the server accepts connections. Consumed by the azure-database-for-postgresql specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Database for PostgreSQL).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-database-for-postgresql, databases, postgresql, flexible-server, paas]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Database for PostgreSQL

Azure's **fully managed community PostgreSQL** PaaS. Azure runs the OS, patching, backups, and HA; you own
the **server**, its tier/sizing, security, parameters, and schema. The modern deployment is **Flexible
Server** (Single Server is retired). This skill owns the **managed-service layer** — provisioning, sizing,
HA/replicas, backups, parameters, and auth — not deep SQL/query/index tuning, which is the Postgres engine
team's job.

## Core concepts and components
- **Flexible Server** — the current deployment model with full control over compute, storage, HA placement,
  maintenance window, and server parameters.
- **Compute tiers** — **Burstable** (dev/low traffic, banked credits), **General Purpose** (balanced
  production), **Memory Optimized** (high-memory workloads). Sized by vCores.
- **Storage** — independently sized GiB with provisioned **IOPS** (or autoscaling storage); storage and IOPS
  affect throughput and cost.
- **High availability** — **zone-redundant HA** (standby in another AZ) or **same-zone HA**, with automatic
  failover. Adds a standby replica cost.
- **Read replicas** — asynchronous replicas (in-region or cross-region) to offload reads and aid DR.
- **Backups** — automated backups with **point-in-time restore** (configurable retention, geo-redundant
  option).
- **Extensions & parameters** — allow-listed **extensions** (e.g. PostGIS, pg_stat_statements) and tunable
  **server parameters**; **PgBouncer** connection pooling is built in.
- **Versions/maintenance** — major/minor version support with in-place major upgrades and a configurable
  maintenance window.

## Configuration and sizing
- Pick a **compute tier** (Burstable for dev, GP/MO for prod) and **vCore size**, size **storage + IOPS** to
  the workload, set the **PostgreSQL version**, enable **HA** (zone-redundant for production) and
  **read replicas** for read scaling/DR. Configure **backup retention** (+ geo-redundant if needed), the
  **maintenance window**, required **extensions**, and **server parameters** (e.g. `max_connections`,
  `work_mem`); enable **PgBouncer** for many short-lived connections.

## Security and IAM
- Use **Microsoft Entra ID authentication** (Entra admin) alongside or instead of native Postgres auth, and
  prefer **managed identity** for app connections. Restrict the network with **private access (VNet
  integration)** or **private endpoint** and firewall rules (disable public access). SSL/TLS is enforced;
  encryption at rest is on by default with optional **customer-managed keys (CMK)** in Key Vault. Grant
  least-privilege Postgres roles.

## Cost levers
- Billed on **compute (vCores) + storage + IOPS + backup storage over the free quota + HA standby + replica
  + geo-redundancy**. Levers: **Burstable** for dev/low traffic, **stop/start** for non-prod, right-size
  vCores and IOPS, **Reserved Capacity** for steady production, enable HA/replicas only where required, and
  scope geo-redundant backup/cross-region replicas to real DR needs.

## Scaling and limits
- Scale **compute up/down** (brief restart) and grow **storage** online (storage cannot shrink); add/remove
  **read replicas**; enable/disable HA. Limits: max storage/IOPS and connection caps per tier/size, replica
  count, and some parameter changes require a restart. Major version upgrade is one-way.

## Operating procedure
1. **Provision** — create the **Flexible Server** at the chosen tier/size/version with storage + IOPS via
   Terraform `azurerm_postgresql_flexible_server` (+ `_database`, `_configuration`, `_firewall_rule`) or
   Bicep `Microsoft.DBforPostgreSQL/flexibleServers`, or `az postgres flexible-server create`.
2. **Configure** — set **HA** (zone-redundant), **read replicas**, **backup retention** (+ geo-redundant),
   **maintenance window**, **extensions**, **server parameters**, and **PgBouncer**.
3. **Secure** — set the **Entra admin** and grant **managed identity** access, enable **private access/
   endpoint** + firewall (disable public), enforce SSL, and configure **CMK** if required.
4. **Verify** — apply [[verify-by-running]]: confirm the server `state` is `Ready` (`az postgres
   flexible-server show`), then **connect and run a query** (`psql "...sslmode=require" -c "SELECT
   version();"` or app via managed identity) and confirm replica/HA state if configured. Capture state and
   query result.

## Inputs
The workload profile (size, IO, connections, read-heaviness), tier choice, PostgreSQL version, HA target
(zone-redundant vs same-zone vs none), read replica needs, backup retention/geo-redundancy, required
extensions and parameters, auth model (Entra/managed identity), network exposure (VNet/private endpoint),
encryption (CMK), and region(s).

## Output
An Azure Database for PostgreSQL setup: a Flexible Server at the chosen tier/size/version, sized
storage/IOPS, HA and/or read replicas, configured backups + maintenance + extensions/parameters + PgBouncer,
secured by Entra/managed identity, private networking and CMK — plus verification that the server is Ready
and accepts connections.

## Notes
- Gotchas: **storage cannot shrink** — size with headroom; **major version upgrades are one-way**; enabling
  HA requires a compatible tier and adds standby cost; firewall/private-access misconfig is the top
  connectivity failure; **Single Server is retired** — use Flexible Server; some **server parameters**
  require a restart; cross-region replicas/geo-redundant backup add cost. Deep **SQL/query/index/vacuum
  tuning** belongs to the Postgres engine team under `agents/data/`. 2nd consumer: the Azure role team
  (azure-iac-engineer / azure-cloud-architect). Cross-cloud peers: AWS RDS (PostgreSQL), GCP Cloud SQL
  (PostgreSQL).
- IaC/CLI: Terraform `azurerm_postgresql_flexible_server` (+ `_database`, `_configuration`,
  `_firewall_rule`, `_active_directory_administrator`); Bicep/ARM
  `Microsoft.DBforPostgreSQL/flexibleServers`. CLI `az postgres flexible-server create` / `... show`; verify
  with `psql -c "SELECT version();"`.
