---
name: azure-databricks
description: Use when designing, provisioning, securing, or operating Azure Databricks — the first-party Apache Spark lakehouse platform on Azure for data engineering, analytics, and ML (Azure Databricks). Covers the Databricks workspace (and VNet injection / secure cluster connectivity), compute (all-purpose vs job clusters, autoscaling, pools, instance types, Photon, serverless), Jobs and Workflows orchestration, notebooks and Repos, Unity Catalog for centralized governance (metastore, catalogs/schemas, lineage, access control), Delta Lake table format (ACID, time travel, OPTIMIZE/Z-ORDER), and Entra ID/SCIM identity with managed identities/credential passthrough. Loads the knowledge: create the workspace, configure compute/Unity Catalog, secure with Entra + VNet injection, and verify a job/notebook runs against Delta. Consumed by the azure-databricks specialist and by the Azure role team (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer) when standing up the managed service (Azure Databricks).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-databricks, analytics, spark, lakehouse]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Databricks

The first-party **Apache Spark lakehouse** on Azure for data engineering, analytics, and ML. This skill owns
the **Azure managed-service layer** — provisioning the workspace, configuring compute and Unity Catalog,
securing identity/networking, and verifying jobs run — and defers **pipeline/lakehouse data design** and
**query/Spark tuning** to the data engine teams.

## Core concepts and components
- **Workspace** — the deployed control resource (`azurerm_databricks_workspace`), with a managed resource
  group; supports **VNet injection** (deploy into your VNet) and **secure cluster connectivity (no public IP)**.
- **Compute** — **all-purpose clusters** (interactive) vs **job clusters** (per-run, cheaper), with
  **autoscaling**, **instance pools**, instance types, **Photon** (vectorized engine), and **serverless**
  compute options; configure Spark version (DBR) and node sizing.
- **Jobs & Workflows** — orchestrate notebooks/JARs/Python/SQL tasks with dependencies, schedules, retries,
  and alerts; jobs should use **job clusters**.
- **Notebooks & Repos** — collaborative notebooks; **Repos** sync to Git for code management.
- **Unity Catalog** — centralized **governance**: an account-level **metastore**, three-level **catalog.schema
  .table** namespace, fine-grained access control, **lineage**, and audit across workspaces.
- **Delta Lake** — the default table format: **ACID** transactions, **time travel**, schema enforcement,
  `OPTIMIZE`/**Z-ORDER** compaction, and `MERGE` upserts on the lake.

## Configuration and sizing
- Deploy the **workspace** (Premium for Unity Catalog/RBAC features), prefer **VNet injection + no-public-IP**
  for enterprise networking, enable **Unity Catalog** (metastore + catalogs) for governance, use **job
  clusters + autoscaling + pools** for cost, enable **Photon** for SQL/ETL, and store tables as **Delta** in
  ADLS Gen2.

## Security and IAM
- **Entra ID** identity with **SCIM** provisioning of users/groups; **Unity Catalog** for table/column grants
  and lineage; workspace deployed with **VNet injection** and **secure cluster connectivity (no public IP)**;
  reach storage via **managed identity / Unity Catalog storage credentials** (avoid hardcoded keys); private
  endpoints for the workspace; cluster policies to enforce safe configs.

## Cost levers
- Cost = **DBUs × VM compute**. Big levers: **job clusters over all-purpose** (terminate after run),
  **autoscaling** + **auto-termination**, **instance pools** + **Spot/low-priority** nodes, **Photon** for
  faster (cheaper) ETL, right-size node types, and **Delta OPTIMIZE/partitioning** to scan less. Avoid
  always-on interactive clusters.

## Scaling and limits
- Clusters autoscale within min/max; jobs scale horizontally. Limits: **DBU + VM core quotas** per region
  (request increases); **VNet injection and Unity Catalog must be planned up front** (hard to retrofit);
  no-public-IP requires NAT/egress; Unity Catalog needs an **account-level metastore** per region; cluster
  startup latency matters for interactive use (use pools).

## Operating procedure
1. **Provision** — create the **workspace** (Premium, optional VNet injection / no-public-IP) via Terraform
   `azurerm_databricks_workspace`, Bicep `Microsoft.Databricks/workspaces`, or `az databricks workspace
   create`; then configure clusters/jobs via the Databricks provider/API/CLI.
2. **Configure** — set up **Unity Catalog** (metastore, catalogs/schemas, storage credentials), **clusters/
   pools/policies**, and **Jobs/Workflows**; store data as **Delta** in ADLS Gen2.
3. **Secure** — enable **Entra/SCIM**, **VNet injection + no-public-IP**, **managed-identity** storage access,
   private endpoints, and Unity Catalog grants; scope **RBAC**.
4. **Verify** — apply [[verify-by-running]]: confirm the workspace provisioned (`az databricks workspace
   show`), then run a **job/notebook** (e.g. via Databricks CLI `databricks jobs run-now`) that reads/writes a
   **Delta** table under Unity Catalog and confirm it succeeds. Capture state and result.

## Inputs
Workload (data engineering / analytics / ML), networking posture (VNet injection, no-public-IP), governance
needs (Unity Catalog), compute strategy (job vs all-purpose, pools, Spot, Photon, serverless), storage (ADLS
Gen2 + Delta), identity (Entra/SCIM), and region/quota.

## Output
An Azure Databricks setup: a workspace (VNet-injected / no-public-IP as needed), Unity Catalog governance,
cost-aware compute (job clusters, autoscaling, pools, Photon), Jobs/Workflows, Delta tables, Entra/SCIM +
managed-identity access, scoped RBAC — plus verification that a job/notebook runs against Delta.

## Notes
- Gotchas: **VNet injection and Unity Catalog are hard to retrofit** — decide up front; always-on
  **all-purpose clusters** waste money (use job clusters + auto-termination); **no-public-IP** needs egress/
  NAT; hardcoded storage keys instead of **managed identity/UC credentials** are a smell; DBU + core **quotas**
  bite at scale. **Lakehouse data design and Spark/SQL query tuning are the data team's job** — defer to
  data/etl-architect (pipeline/lakehouse design) and data/sql-optimizer (query rewrites). 2nd consumer: the
  Azure role team (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer). Cross-cloud peers:
  AWS EMR, GCP managed Spark (Dataproc).
- IaC/CLI: Terraform `azurerm_databricks_workspace` (+ the `databricks/databricks` provider for clusters/jobs/
  Unity Catalog); Bicep/ARM `Microsoft.Databricks/workspaces`. CLI `az databricks workspace create` +
  `databricks` CLI (`databricks jobs run-now`, `databricks clusters create`).
