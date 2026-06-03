---
name: azure-synapse-analytics
description: Use when designing, provisioning, securing, or operating Azure Synapse Analytics — the unified analytics platform combining data warehousing, big-data Spark, and integration over a data lake (Azure Synapse Analytics). Covers the Synapse workspace, dedicated SQL pools (provisioned MPP data warehouse with DWU sizing and distribution strategy) and serverless SQL pools (query files in the lake pay-per-TB), Apache Spark pools (autoscaling notebooks), Synapse Pipelines (ADF-based orchestration), Synapse Studio, the linked Data Lake Storage Gen2 default storage, and Synapse Link (near-real-time HTAP from Cosmos DB/SQL). Loads the knowledge: create the workspace, choose pools, size/distribute, secure with Entra/managed identity, and verify queries/jobs. Consumed by the azure-synapse-analytics specialist and by the Azure role team (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer) when standing up the managed service (Azure Synapse Analytics).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-synapse-analytics, analytics, data-warehouse, spark]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Synapse Analytics

A unified platform that brings **data warehousing**, **big-data Spark**, and **data integration** together
over a **Data Lake Storage Gen2** account. This skill owns the **Azure managed-service layer** — the
workspace, the right pool type and its sizing/distribution, security, and verifying queries/jobs run — and
defers warehouse **data modeling / query rewrites** to the data engine teams.

## Core concepts and components
- **Workspace** — the top-level resource (`azurerm_synapse_workspace`) bound to a **default ADLS Gen2 file
  system**; **Synapse Studio** is the unified web IDE for SQL, Spark, pipelines, and monitoring.
- **Dedicated SQL pool** — a **provisioned MPP** data warehouse (`azurerm_synapse_sql_pool`) sized in **DWUs**
  (DW100c…DW30000c); choose a **table distribution** (hash / round-robin / replicated) and partitioning. Can be
  **paused** to stop compute billing.
- **Serverless SQL pool** — always-on, **pay-per-TB-scanned** T-SQL over files (Parquet/CSV/Delta) in the
  lake; no provisioning, ideal for ad-hoc lake querying via `OPENROWSET`/external tables.
- **Spark pool** — autoscaling **Apache Spark** clusters (`azurerm_synapse_spark_pool`) for notebooks/jobs,
  with node size, autoscale min/max, and auto-pause.
- **Pipelines** — ADF-based **orchestration** (copy, data flows, triggers) inside the workspace.
- **Synapse Link** — near-real-time **HTAP** analytics over Cosmos DB / Azure SQL with no ETL on the source.

## Configuration and sizing
- Create the workspace + **default ADLS Gen2**, then pick pools: **serverless** for ad-hoc/lake exploration,
  **dedicated** for a high-concurrency warehouse (size **DWUs** to workload, choose **hash distribution** on
  large fact tables / **replicated** on small dims, partition by date), **Spark** for ETL/ML (right-size +
  autoscale + auto-pause). **Pause** dedicated pools off-hours.

## Security and IAM
- **Entra ID** auth + **Azure RBAC** (control plane) and **Synapse RBAC** + SQL permissions (data plane);
  use a **workspace managed identity** for storage/key access; **managed VNet** + **managed private
  endpoints** to reach data sources privately; **TDE**, column/row-level security, and dynamic data masking on
  SQL pools; firewall/private endpoints on the workspace.

## Cost levers
- Big levers: **pause dedicated SQL pools** when idle (no compute charge); use **serverless** (per-TB scanned)
  for spiky/ad-hoc instead of a provisioned pool; **auto-pause Spark pools**; reduce serverless cost by
  **Parquet/Delta + partition pruning + column pruning** (scan less). Right-size DWUs and Spark node counts.

## Scaling and limits
- Dedicated pools scale by changing DWUs (brief pause); serverless scales automatically; Spark autoscales.
  Limits: dedicated pool **concurrency slots** scale with DWUs (bad distribution causes **data skew** and
  hotspots); serverless bills by **bytes scanned** (CSV/unpartitioned data is expensive); workspace/pool
  per-region quotas apply; some legacy "SQL DW" features map onto dedicated pools.

## Operating procedure
1. **Provision** — create the **workspace** + default ADLS Gen2 and the needed **pools** via Terraform
   `azurerm_synapse_workspace` (+ `azurerm_synapse_sql_pool` / `azurerm_synapse_spark_pool`), Bicep
   `Microsoft.Synapse/workspaces`, or `az synapse workspace create`.
2. **Configure** — size **DWUs**/Spark nodes, set **table distribution**/partitioning, wire **pipelines**/
   linked services, and (if needed) **Synapse Link**.
3. **Secure** — enable **Entra auth** + managed identity, **managed VNet/private endpoints**, **TDE** + RLS/CLS/
   masking, workspace firewall, and scope **RBAC**.
4. **Verify** — apply [[verify-by-running]]: confirm the workspace/pools provisioned (`az synapse sql pool
   show` / `spark pool show`), then run a **representative query** on serverless/dedicated and/or a **Spark
   notebook/job**, confirming it returns and DWU/scan/duration are sane. Capture state and result.

## Inputs
Workload shape (warehouse vs lake ad-hoc vs Spark ETL/ML), data volume + file formats in the lake, dedicated
pool DWU + distribution strategy, Spark node/autoscale sizing, pipeline/Synapse Link needs, security posture
(Entra, private networking), and region.

## Output
An Azure Synapse setup: a workspace with default ADLS Gen2, appropriate dedicated/serverless SQL and/or Spark
pools (sized + distributed), pipelines/Synapse Link as needed, Entra auth + managed identity + private
networking + TDE, scoped RBAC — plus verification that queries/jobs run and resource sizing is reasonable.

## Notes
- Gotchas: bad **distribution/skew** on dedicated pools kills performance; **serverless cost = bytes scanned**
  (use Parquet/Delta + partitioning); forgetting to **pause** dedicated pools burns money; managed VNet/private
  endpoints add setup steps; **engine-level data modeling, indexing, and query rewrites are the data team's
  job** — defer to data/etl-architect (warehouse design) and data/sql-optimizer (query tuning). 2nd consumer:
  the Azure role team (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer). Cross-cloud
  peers: AWS Redshift + EMR, GCP BigQuery.
- IaC/CLI: Terraform `azurerm_synapse_workspace` (+ `azurerm_synapse_sql_pool` / `azurerm_synapse_spark_pool`
  / `azurerm_synapse_firewall_rule`); Bicep/ARM `Microsoft.Synapse/workspaces`. CLI `az synapse workspace
  create` / `az synapse sql pool create` / `az synapse spark pool create`.
