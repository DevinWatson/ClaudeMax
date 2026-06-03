---
name: azure-log-analytics
description: Use when designing, provisioning, configuring, or operating Azure Log Analytics — the log/telemetry data store and KQL query engine behind Azure Monitor, Sentinel, and Defender (Azure Log Analytics). Covers the Log Analytics workspace, tables and table plans (Analytics/Basic/Auxiliary), KQL queries + saved searches/functions, data retention + archive, ingestion-time transformations via DCRs, solutions/insights, and cross-workspace queries. Loads the knowledge to stand up the workspace, model tables/retention, author KQL, and verify data is queryable. Consumed by the azure-log-analytics specialist and by the Azure role team (azure-observability-engineer / azure-cloud-architect / azure-iac-engineer) when operating the managed service (Azure Log Analytics).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-log-analytics, management-governance, kql, observability]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Log Analytics

**Azure Log Analytics** is the **log/telemetry data store and KQL query engine** that backs **Azure Monitor**,
**Microsoft Sentinel**, and **Defender for Cloud**. This skill owns the **single-service workspace layer** —
the workspace, tables/retention, KQL, and ingest transforms — for one workload or subscription. (For the broader
collection + alerting umbrella, cross-reference Azure Monitor.)

## Core concepts and components
- **Log Analytics workspace** — the boundary for data storage, **retention**, **RBAC**, and pricing
  (`Microsoft.OperationalInsights/workspaces`); telemetry lands in **tables**.
- **Tables & table plans** — built-in and custom tables, each with a **plan**: **Analytics** (full KQL, alerts,
  longest interactive retention), **Basic** (cheap, high-volume, limited query/8-day interactive), and
  **Auxiliary** (lowest cost, verbose logs, search-job access).
- **KQL** — the **Kusto Query Language** for filtering, aggregating, joining, and time-series analysis; reusable
  **saved searches** and **functions** (computed columns / parameterized queries).
- **Retention & archive** — per-workspace and **per-table** interactive retention plus long-term **archive**;
  **search jobs** and **restore** to query archived data.
- **Ingestion-time transformation** — **DCR transformations** (KQL) to filter, enrich, or drop columns/rows at
  ingest, lowering cost and shaping schema.
- **Solutions/insights & cross-workspace** — installed **insights/solutions** add tables + queries; **cross-
  workspace/resource** queries (`workspace()` / `union`) span boundaries.

## Configuration and sizing
- Create the **workspace** with a **pricing/commitment tier**, set **per-table plans + retention**, attach data
  sources (diagnostic settings/DCRs — owned with Azure Monitor), add **DCR transforms** to trim ingest, and author
  **saved functions**. Size by **ingestion GB/day**, not instances; pick **commitment tiers** above a few hundred
  GB/day.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC**: **Log Analytics Contributor / Reader**; use **resource-context**
  vs **workspace-context** access and **table-level RBAC** to scope who sees which tables. Prefer **managed
  identity** for ingest where applicable; protect any **shared keys/DCE** endpoints; route security tables to
  **Sentinel**.

## Cost levers
- Cost is dominated by **ingestion (per GB) + retention**. Levers: **commitment tiers**, **Basic/Auxiliary**
  table plans for high-volume low-value logs, **DCR transforms** to drop noise at ingest, **per-table retention/
  archive** instead of blanket retention, and not collecting categories you never query.

## Scaling and limits
- Scales to large multi-source workspaces and cross-workspace queries; governed by **ingestion latency** (logs
  aren't real-time), query **result/timeout caps**, **Basic/Auxiliary** query limitations (no alerts on Basic in
  the classic sense, search-job latency), **commitment-tier** minimum periods, and daily-cap/throttling if set.

## Operating procedure
1. **Provision** — create the workspace via Terraform `azurerm_log_analytics_workspace` (sku/retention), Bicep
   `Microsoft.OperationalInsights/workspaces`, or `az monitor log-analytics workspace create`.
2. **Configure** — set **per-table plans + retention** (`az monitor log-analytics workspace table update`), add
   **custom tables/DCRs** + transforms, install needed **solutions/insights**, and author **saved functions**.
3. **Secure** — scope **Log Analytics RBAC** + **table-level RBAC**, prefer managed identity for ingest, route
   security tables to **Sentinel**.
4. **Verify** — apply [[verify-by-running]]: run a **KQL** query against the expected table
   (`az monitor log-analytics query`) and confirm rows return with the expected schema and recency; confirm a
   table plan/retention took effect. Capture state and result.

## Inputs
The **workspace** topology + pricing/commitment tier, the **tables + plans + retention** model, the **ingest
sources/DCRs** + transforms, the **saved functions/queries** needed, and the RBAC model.

## Output
An Azure Log Analytics setup: a workspace with the right pricing/commitment tier, per-table plans + retention/
archive, DCR ingest transforms, saved functions, scoped RBAC (incl. table-level), cost controls — plus
verification that a KQL query returns the expected data.

## Notes
- Gotchas: **ingestion cost** dominates (use Basic/Auxiliary + transforms + commitment tiers); logs have
  **latency**; **Basic/Auxiliary** tables can't be queried/alerted like Analytics; **retention changes** and
  commitment tiers have minimum periods; cross-workspace queries need permissions on each. The collection/alert
  umbrella is **Azure Monitor's**. 2nd consumer: the Azure role team (azure-observability-engineer /
  azure-cloud-architect / azure-iac-engineer). Cross-cloud peers: AWS CloudWatch Logs (Logs Insights), GCP Cloud
  Logging.
- IaC/CLI: Terraform `azurerm_log_analytics_workspace`, `azurerm_log_analytics_saved_search`,
  `azurerm_log_analytics_solution`, `azurerm_monitor_data_collection_rule` (transforms); Bicep/ARM
  `Microsoft.OperationalInsights/workspaces`. CLI `az monitor log-analytics ...`.