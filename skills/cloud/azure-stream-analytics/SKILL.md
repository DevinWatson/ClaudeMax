---
name: azure-stream-analytics
description: Use when designing, provisioning, securing, or operating Azure Stream Analytics — the managed real-time stream-processing service that runs SQL-like queries over streaming data (Azure Stream Analytics). Covers streaming jobs, the Stream Analytics Query Language (SAQL), inputs (Event Hubs, IoT Hub, Blob/ADLS) and outputs (SQL, Synapse, Blob, Cosmos DB, Event Hubs, Power BI), windowing (tumbling/hopping/sliding/session/snapshot), event ordering and watermarks (event-time vs arrival-time, late/out-of-order policies), reference data joins, and Streaming Units (SU) scaling with partition-aligned parallelism. Loads the knowledge: create the job, wire inputs/outputs, author the SAQL query with windowing, secure with Entra/managed identity, size SUs, and verify the job runs. Consumed by the azure-stream-analytics specialist and by the Azure role team (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer) when standing up the managed service (Azure Stream Analytics).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-stream-analytics, analytics, streaming, real-time]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Stream Analytics

The managed **real-time stream-processing** service that runs a **SQL-like query** continuously over streaming
data. This skill owns the **Azure managed-service layer** — the job, its inputs/outputs, the SAQL query and
windowing, event-ordering policy, SU sizing, and security — and verifying the job runs; it defers
**cloud-agnostic streaming pipeline design** and **query-logic tuning** to the data engine teams.

## Core concepts and components
- **Streaming job** — the top-level resource (`azurerm_stream_analytics_job`) that binds inputs, a query, and
  outputs and runs continuously; has a compatibility level and an event-ordering policy.
- **SAQL query** — the **Stream Analytics Query Language**, a T-SQL dialect with temporal extensions
  (windowing functions, `TIMESTAMP BY`, `OVER`); the single query routes results to one or more outputs via
  `INTO`.
- **Inputs** — **stream** inputs (**Event Hubs**, **IoT Hub**, **Blob/ADLS Gen2**) and **reference** inputs
  (slow-changing lookup data from Blob/SQL) joined into the stream.
- **Outputs** — sinks such as **Azure SQL/Synapse**, **Blob/ADLS**, **Cosmos DB**, **Event Hubs**, **Service
  Bus**, **Power BI**, and **Functions**.
- **Windowing** — **tumbling** (fixed non-overlapping), **hopping** (overlapping), **sliding**, **session**,
  and **snapshot** windows for time-based aggregation.
- **Event ordering & watermarks** — choose **event-time** (`TIMESTAMP BY`) vs **arrival-time**; configure
  **late-arrival** and **out-of-order** tolerance windows and the **drop/adjust** action.

## Configuration and sizing
- Create the job, wire **inputs/outputs**, author the **SAQL** query (windowing + `TIMESTAMP BY`), set the
  **event-ordering** policy, and size **Streaming Units (SU)**. Align **input partitions** (Event Hubs
  partitions) with **embarrassingly parallel** queries (`PARTITION BY PartitionId`) so SUs scale linearly.

## Security and IAM
- **Entra ID** auth + **Azure RBAC**; prefer the job's **managed identity** to read Event Hubs/Blob and write
  to SQL/Synapse/Storage instead of connection strings/keys; reach private sources via **VNet integration**
  where supported; scope least-privilege on every input/output.

## Cost levers
- Billing = **provisioned Streaming Units (SU)**. Levers: right-size SUs to the watermark/backlog signal,
  use **partition-parallel** queries so each SU does useful work, avoid oversized hopping windows that
  multiply output, and stop the job when not needed.

## Scaling and limits
- Scale by increasing **SUs** and partition-parallelism; a fully parallel job scales near-linearly with input
  partitions. Limits: max SUs per job/region quota; **non-parallel** queries (cross-partition joins/aggregates)
  bottleneck on a single node; **SU % utilization** and **watermark delay** are the health signals; reference
  data has size limits.

## Operating procedure
1. **Provision** — create the **job** via Terraform `azurerm_stream_analytics_job`, Bicep
   `Microsoft.StreamAnalytics/streamingjobs`, or `az stream-analytics job create`.
2. **Configure** — add **inputs** (Event Hubs/IoT/Blob + reference data) and **outputs**, author the **SAQL**
   query with **windowing** and **`TIMESTAMP BY`**, set the **event-ordering** policy, and size **SUs** with
   partition-parallelism.
3. **Secure** — enable **managed identity** for inputs/outputs, use private networking where available, and
   scope **RBAC** least-privilege.
4. **Verify** — apply [[verify-by-running]]: confirm the job provisioned and **start** it (`az stream-analytics
   job start`), then push representative events and confirm rows land in the output with sane **SU%** and
   **watermark delay**; the **Test query** sample-input feature validates SAQL before go-live. Capture result.

## Inputs
Stream sources (Event Hubs/IoT/Blob), reference data, the aggregation/transform needed and its windowing,
output sinks, event-ordering tolerance (late/out-of-order), partition layout, SU sizing, security posture
(managed identity, private networking), and region.

## Output
An Azure Stream Analytics setup: a streaming job with wired inputs/outputs, a SAQL query with appropriate
windowing and event-ordering policy, partition-aligned parallelism, managed-identity auth + scoped RBAC, and
right-sized SUs — plus verification that the job runs and output lands.

## Notes
- Gotchas: a **non-parallel** query (cross-partition aggregate/join) caps throughput regardless of SUs —
  align partitions and `PARTITION BY`; watch **watermark delay** for backlog; oversized **hopping** windows
  explode output volume; **late-arrival** policy silently drops/adjusts events; SAQL is not full T-SQL.
  **Cloud-agnostic streaming pipeline design and query-logic tuning are the data team's job** — defer to
  data/etl-architect (pipeline design) and data/sql-optimizer (query rewrites). 2nd consumer: the Azure role
  team (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer). Cross-cloud peer: AWS Kinesis
  Data Analytics, GCP Dataflow.
- IaC/CLI: Terraform `azurerm_stream_analytics_job` (+ `azurerm_stream_analytics_stream_input_eventhub` /
  `azurerm_stream_analytics_reference_input_blob` / `azurerm_stream_analytics_output_*`); Bicep/ARM
  `Microsoft.StreamAnalytics/streamingjobs`. CLI `az stream-analytics job create` / `az stream-analytics job
  start`.
