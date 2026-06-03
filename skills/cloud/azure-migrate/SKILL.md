---
name: azure-migrate
description: Use when designing, provisioning, configuring, or operating Azure Migrate — Azure's central hub for discovering, assessing, and migrating on-premises servers, databases, and web apps to Azure (Azure Migrate). Covers the migration project, the appliance-based discovery, assessment (Azure VM/SQL/Web App readiness, right-sizing, cost estimates), dependency analysis (agentless/agent-based mapping), and migration tooling (server migration, database/web-app migration integrations). Loads the knowledge to stand up a project, run discovery, build assessments, map dependencies, and verify readiness before cutover. Consumed by the azure-migrate specialist and by the Azure role team (azure-platform-engineer / azure-cloud-architect) when operating the managed service.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-migrate, migration, assessment, discovery]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Migrate

**Azure Migrate** is the **central hub** for discovering, assessing, and migrating on-premises **servers,
databases, and web apps** to Azure. This skill owns the **single-service Azure Migrate layer** — the project, the
discovery appliance, assessments, dependency analysis, and the migration tools it orchestrates.

## Core concepts and components
- **Migration project** — the regional container that aggregates discovery data, assessments, and migration
  activity across the integrated tools.
- **Discovery (appliance)** — a lightweight **appliance** deployed on-prem (VMware/Hyper-V/physical) that
  continuously inventories servers, their configuration, and **performance data** for right-sizing.
- **Assessment** — evaluates **readiness** and produces **right-sized Azure VM SKUs**, **monthly cost estimates**,
  and confidence ratings. Types: **Azure VM** assessment, **SQL Server** assessment (to SQL MI/VM/DB), and
  **Azure App Service** (web app) assessment.
- **Dependency analysis** — maps inter-server communication (**agentless** via the appliance, or **agent-based**
  via Log Analytics/MMA) so you migrate dependent workloads together as **move groups**.
- **Migration tools** — **Server Migration** (replicate + migrate VMs), with database/web-app migration handed to
  the integrated tools (DMS for databases, App Service Migration Assistant for web apps).

## Configuration and sizing
- Create the **project**, deploy the **discovery appliance** + credentials, run **discovery**, then build
  **assessments** with the right **sizing criteria** (as-on-prem vs performance-based) and **target region/pricing**
  (reserved instances/Azure Hybrid Benefit). Sizing here means choosing assessment parameters, not running compute.

## Security and IAM
- Authenticate via **Entra ID**; control project access with **RBAC** (Contributor on the project resource group).
  The appliance uses **scoped credentials** (least-privilege read on the source hypervisor/guests) stored locally;
  use a **Key Vault** for migration replication secrets. Restrict who can run a **migration/cutover**.

## Cost levers
- The Migrate project + assessments are **free**; cost comes from migration **replication storage/egress** and the
  **target Azure footprint** the assessment sizes. Levers: use **performance-based** sizing to avoid over-
  provisioning, apply **Azure Hybrid Benefit / reservations** in the cost estimate, and clean up replication
  resources after cutover.

## Scaling and limits
- Servers discovered per appliance/project, assessment group sizes, dependency-mapping retention, and concurrent
  replications. Large estates use multiple appliances and split projects by datacenter/wave.

## Operating procedure
1. **Provision** — create the **migration project** via **azurerm** (`azurerm_resource_group` +
   `Microsoft.Migrate/migrateProjects` via Bicep/ARM) or the portal; the appliance is registered to it.
2. **Configure** — deploy the **discovery appliance**, add **source credentials**, run **discovery**, then create
   **assessments** (VM/SQL/Web App) with sizing + pricing criteria and run **dependency analysis** to form move
   groups.
3. **Secure** — wire **Entra/RBAC**, give the appliance **least-privilege** source credentials, store replication
   secrets in **Key Vault**, restrict cutover rights.
4. **Verify** — apply [[verify-by-running]]: confirm the project exists and discovery reports the expected server
   count (`az resource show` on the migrate project / portal API), confirm an **assessment** shows **Ready** with a
   sized SKU + cost, and confirm dependencies are mapped before cutover; capture the readiness summary.

## Inputs
The **source inventory** (hypervisor/physical), the **discovery appliance** + credentials, the **assessment types**
+ sizing/pricing criteria, the **dependency-analysis** mode, and the **target region**.

## Output
An Azure Migrate setup: a project with running discovery, readiness assessments (right-sized SKUs + cost estimates)
for VMs/SQL/web apps, dependency maps grouped into move waves, and least-privilege appliance credentials — plus
verification that discovery and at least one assessment report the expected, ready inventory.

## Notes
- Gotchas: assessments built on too-short **performance data** misjudge sizing (collect days/weeks); missing
  **dependency analysis** breaks apps when servers move separately; appliance credentials over-scoped;
  forgetting **Azure Hybrid Benefit** inflates cost estimates; replication resources left running after cutover
  cost money. 2nd consumer: the Azure role team (azure-platform-engineer / azure-cloud-architect). Cross-cloud
  peer: AWS Migration Hub.
- IaC/CLI: provisioned mostly via portal/ARM/Bicep (`Microsoft.Migrate/*`, `Microsoft.OffAzure/*`); Terraform
  coverage is limited (resource-group + ARM deployment); database migration defers to DMS
  (`azurerm_database_migration_*`). CLI: `az resource` on the migrate project; `az migrate` extension where
  available.
