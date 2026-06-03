---
name: azure-database-for-mysql
description: Use when designing, provisioning, securing, or operating Azure Database for MySQL — Azure's fully managed community MySQL PaaS, primarily the Flexible Server deployment (Azure Database for MySQL). Covers compute tiers (Burstable/General Purpose/Business Critical) and storage/IOPS sizing, zone-redundant and same-zone HA, read replicas, automated backups with point-in-time restore, maintenance windows and version upgrades, server parameters, Entra ID authentication and managed identities, VNet integration/private access and firewall, and CMK encryption. Loads the knowledge: pick a tier and size, choose HA/replicas, provision, secure, and verify the server accepts connections. Consumed by the azure-database-for-mysql specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Database for MySQL).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-database-for-mysql, databases, mysql, flexible-server, paas]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Database for MySQL

Azure's **fully managed community MySQL** PaaS. Azure runs the OS, patching, backups, and HA; you own the
**server**, its tier/sizing, security, parameters, and schema. The modern deployment is **Flexible Server**
(Single Server is retired). This skill owns the **managed-service layer** — provisioning, sizing,
HA/replicas, backups, parameters, and auth — not deep SQL/query/index/InnoDB tuning, which is the MySQL
engine team's job.

## Core concepts and components
- **Flexible Server** — the current deployment model with full control over compute, storage, HA placement,
  maintenance window, and server parameters.
- **Compute tiers** — **Burstable** (dev/low traffic, banked credits), **General Purpose** (balanced
  production), **Business Critical** (high-memory/throughput, formerly Memory Optimized). Sized by vCores.
- **Storage** — independently sized GiB with provisioned **IOPS** (or autoscaling IOPS/storage); affects
  throughput and cost.
- **High availability** — **zone-redundant HA** (standby in another AZ) or **same-zone HA**, with automatic
  failover. Adds a standby replica cost.
- **Read replicas** — asynchronous replicas (in-region or cross-region) to offload reads and aid DR.
- **Backups** — automated backups with **point-in-time restore** (configurable retention, geo-redundant
  option).
- **Server parameters** — tunable MySQL parameters (e.g. `max_connections`, `innodb_buffer_pool_size`); some
  require a restart.
- **Versions/maintenance** — supported MySQL major versions with in-place upgrades and a configurable
  maintenance window.

## Configuration and sizing
- Pick a **compute tier** (Burstable for dev, GP/Business Critical for prod) and **vCore size**, size
  **storage + IOPS** to the workload, set the **MySQL version**, enable **HA** (zone-redundant for
  production) and **read replicas** for read scaling/DR. Configure **backup retention** (+ geo-redundant if
  needed), the **maintenance window**, and **server parameters**.

## Security and IAM
- Use **Microsoft Entra ID authentication** alongside or instead of native MySQL auth, and prefer **managed
  identity** for app connections. Restrict the network with **private access (VNet integration)** or
  **private endpoint** and firewall rules (disable public access). SSL/TLS is enforced; encryption at rest
  is on by default with optional **customer-managed keys (CMK)** in Key Vault. Grant least-privilege MySQL
  users/privileges.

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
   Terraform `azurerm_mysql_flexible_server` (+ `_database`, `_configuration`, `_firewall_rule`) or Bicep
   `Microsoft.DBforMySQL/flexibleServers`, or `az mysql flexible-server create`.
2. **Configure** — set **HA** (zone-redundant), **read replicas**, **backup retention** (+ geo-redundant),
   **maintenance window**, and **server parameters**.
3. **Secure** — set the **Entra admin** and grant **managed identity** access, enable **private access/
   endpoint** + firewall (disable public), enforce SSL, and configure **CMK** if required.
4. **Verify** — apply [[verify-by-running]]: confirm the server `state` is `Ready` (`az mysql
   flexible-server show`), then **connect and run a query** (`mysql --ssl-mode=REQUIRED -e "SELECT
   VERSION();"` or app via managed identity) and confirm replica/HA state if configured. Capture state and
   query result.

## Inputs
The workload profile (size, IO, connections, read-heaviness), tier choice, MySQL version, HA target
(zone-redundant vs same-zone vs none), read replica needs, backup retention/geo-redundancy, server
parameters, auth model (Entra/managed identity), network exposure (VNet/private endpoint), encryption (CMK),
and region(s).

## Output
An Azure Database for MySQL setup: a Flexible Server at the chosen tier/size/version, sized storage/IOPS, HA
and/or read replicas, configured backups + maintenance + parameters, secured by Entra/managed identity,
private networking and CMK — plus verification that the server is Ready and accepts connections.

## Notes
- Gotchas: **storage cannot shrink** — size with headroom; **major version upgrades are one-way**; enabling
  HA requires a compatible tier and adds standby cost; firewall/private-access misconfig is the top
  connectivity failure; **Single Server is retired** — use Flexible Server; some **server parameters**
  require a restart; cross-region replicas/geo-redundant backup add cost. Deep **SQL/query/index/InnoDB
  tuning** belongs to the MySQL engine team under `agents/data/`. 2nd consumer: the Azure role team
  (azure-iac-engineer / azure-cloud-architect). Cross-cloud peers: AWS RDS (MySQL), GCP Cloud SQL (MySQL).
- IaC/CLI: Terraform `azurerm_mysql_flexible_server` (+ `_database`, `_configuration`, `_firewall_rule`,
  `_active_directory_administrator`); Bicep/ARM `Microsoft.DBforMySQL/flexibleServers`. CLI `az mysql
  flexible-server create` / `... show`; verify with `mysql -e "SELECT VERSION();"`.
