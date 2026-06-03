---
name: azure-data-explorer
description: Use when designing, provisioning, securing, or operating Azure Data Explorer (ADX / Kusto) — the managed fast analytics engine for time-series, log, and telemetry data queried with KQL (Azure Data Explorer). Covers clusters and databases, the Kusto Query Language (KQL), ingestion (batch vs streaming, Event Hubs/IoT/Event Grid connectors, the ingestion wizard, queued vs direct), tables/update policies, materialized views, caching/retention policies, partitioning and the hot/cold cache tiers, and engine/data-management roles. Loads the knowledge: create the cluster and database, define tables and ingestion mappings, set caching/retention and materialized views, secure with Entra/managed identity, size SKU/cache, and verify ingest and a KQL query. Consumed by the azure-data-explorer specialist and by the Azure role team (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer) when standing up the managed service (Azure Data Explorer).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-data-explorer, analytics, kql, time-series]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Data Explorer

The managed **fast analytics engine** (Kusto) for **time-series, log, and telemetry** data, queried with
**KQL**. This skill owns the **Azure managed-service layer** — clusters, databases, ingestion, caching/
retention and materialized views, SKU/cache sizing, and security — and verifying ingest and a query; it defers
**KQL query-logic tuning** and **cloud-agnostic analytics design** to the data engine teams.

## Core concepts and components
- **Cluster** — the compute resource (`azurerm_kusto_cluster`) with an engine SKU + node count, autoscale, and
  hot-cache size; hosts one or more databases.
- **Database** — a container of tables (`azurerm_kusto_database`) with its own caching/retention policies and
  permissions.
- **KQL** — the **Kusto Query Language**, a read-optimized pipe-based language (`|`) for filtering,
  aggregating, and time-series analysis over huge volumes.
- **Ingestion** — **queued (batch)** ingestion (default, batched for efficiency) vs **streaming** ingestion
  (low latency); via **data connections** (Event Hubs/IoT Hub/Event Grid), the ingestion wizard, LightIngest,
  or SDKs. **Ingestion mappings** map source fields to columns.
- **Update policies** — transform/route rows from a source table into a derived table at ingest time.
- **Materialized views** — pre-aggregated, always-current views over a source table for fast queries.
- **Caching & retention** — the **hot cache** (fast, in-cluster SSD) vs **cold** (storage); per-table/db
  **caching** and **retention** policies tune cost vs query speed.

## Configuration and sizing
- Create the **cluster** (engine SKU + node count + autoscale), then **databases** and **tables** with
  **ingestion mappings**, choose **batch vs streaming** ingestion, define **update policies**/**materialized
  views**, and set **caching (hot)** + **retention** per table. Size **hot cache** to the queried window.

## Security and IAM
- **Entra ID** auth + **Azure RBAC** (control plane) and **database/table principals** (data plane: Admin,
  Ingestor, Viewer); prefer **managed identity** for ingestion connections and external data; reach private
  data via **private endpoints**; restrict with **IP firewall**. Scope database roles least-privilege.

## Cost levers
- Billing = **cluster compute (markup + VM)** + storage. Levers: **autoscale** + **stop the cluster** when
  idle (dev), shrink the **hot cache** window to what queries actually touch (the biggest lever), set tight
  **retention**, choose the right **engine SKU**, and use **materialized views** to avoid repeated heavy scans.

## Scaling and limits
- Scale **vertically** (engine SKU) and **horizontally** (node count + autoscale). Limits: **streaming
  ingestion** has lower throughput than batch and must be enabled per cluster/table; **hot cache** size bounds
  fast-query window; ingestion is **batched by default** (latency), and per-cluster concurrency/query limits
  apply; materialized views add background cost.

## Operating procedure
1. **Provision** — create the **cluster** + **database** via Terraform `azurerm_kusto_cluster` +
   `azurerm_kusto_database`, Bicep `Microsoft.Kusto/clusters`, or `az kusto cluster create`.
2. **Configure** — define **tables** + **ingestion mappings**, add **data connections** (Event Hubs/IoT/Event
   Grid) or batch ingestion, set **update policies**/**materialized views**, and tune **caching (hot)** +
   **retention**.
3. **Secure** — set **database principals** (Admin/Ingestor/Viewer), use **managed identity** for connections,
   add **private endpoints**/IP firewall, and scope least-privilege.
4. **Verify** — apply [[verify-by-running]]: confirm the cluster/database provisioned (`az kusto cluster
   show`), **ingest** a sample (connection or `.ingest`), then run a representative **KQL** query and confirm
   rows return with sane latency and cache hit. Capture result.

## Inputs
Data shape + volume (logs/telemetry/time-series), ingestion source + latency need (batch vs streaming), table/
mapping definitions, queried time window (drives hot-cache sizing) and retention, materialized-view/update-
policy needs, SKU + node sizing, security posture (managed identity, private endpoints), and region.

## Output
An Azure Data Explorer setup: a cluster (sized SKU + autoscale) with databases and tables, ingestion
connections/mappings, update policies/materialized views, tuned hot-cache + retention, Entra auth + database
principals + managed identity + private networking — plus verification that ingest and a KQL query succeed.

## Notes
- Gotchas: **hot-cache window** is the dominant cost/speed lever — size it to the queried window; **streaming
  ingestion** must be explicitly enabled and is lower-throughput than batch; default **batch ingestion** adds
  latency; forgetting to **stop** dev clusters burns money; materialized views cost background compute.
  **KQL query-logic tuning and cloud-agnostic analytics modeling are the data team's job** — defer to
  data/sql-optimizer (query rewrites) and data/etl-architect (analytics design). 2nd consumer: the Azure role
  team (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer). Cross-cloud peers: AWS
  OpenSearch/Timestream, GCP BigQuery.
- IaC/CLI: Terraform `azurerm_kusto_cluster` (+ `azurerm_kusto_database` / `azurerm_kusto_eventhub_data_
  connection` / `azurerm_kusto_database_principal_assignment`); Bicep/ARM `Microsoft.Kusto/clusters`. CLI `az
  kusto cluster create` / `az kusto database create`.
