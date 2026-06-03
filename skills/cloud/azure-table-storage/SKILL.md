---
name: azure-table-storage
description: Use when designing, provisioning, securing, or operating Azure Table Storage — a schemaless NoSQL key-value/wide-column store in a storage account for structured non-relational data at low cost (Azure Table Storage). Covers tables and entities, the PartitionKey + RowKey composite primary key and partition design, properties/typing, the OData query/filter API and the cost of point vs partition vs table scans, batch (entity group) transactions within a partition, optimistic concurrency via ETag, Entra ID/RBAC vs account keys and SAS, managed identities, and private endpoints. Loads the knowledge: pick the account, design the key scheme, create tables, secure with Entra, provision, and verify insert/query/delete. Consumed by the azure-table-storage specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Table Storage).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-table-storage, storage, nosql, key-value]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Table Storage

Azure's **schemaless NoSQL key-value / wide-column store** for structured, non-relational data (device
telemetry, user profiles, metadata, lookup tables) at very low cost, exposed through a **storage account**
(`https://<account>.table.core.windows.net`). Azure owns durability; you own the **key design**, **tables**,
**query patterns**, and **access**. This skill owns the **managed-service layer**.

## Core concepts and components
- **Tables & entities** — a table holds **entities** (rows); each entity is a bag of **properties** (typed
  key/value pairs). There is **no fixed schema** — entities in a table can differ.
- **PartitionKey + RowKey** — the **composite primary key**. **PartitionKey** groups entities into a
  partition (the unit of scale/transactions); **RowKey** uniquely identifies an entity within a partition. A
  **point query** (PartitionKey + RowKey) is the fastest, cheapest access; designing these well is the whole
  game.
- **Query/filter (OData)** — filter on properties via **OData**. **Point** (PK+RK) ≪ **partition scan** (PK +
  range/filter) ≪ **table scan** (no PK) in cost/latency; secondary-key lookups need **denormalization** (a
  second copy keyed differently).
- **Batch / entity group transactions** — atomic batch of up to **100 operations** that must all share the
  **same PartitionKey** (no cross-partition transactions).
- **Concurrency** — **optimistic** via **ETag** (If-Match) to avoid lost updates.

## Configuration and sizing
- Pick the **storage account** (kind/SKU/redundancy) and design the **PartitionKey/RowKey** for your dominant
  read pattern (favor point queries; spread writes across partitions to avoid hot partitions). Create one
  **table per entity type**. Denormalize for alternate access paths. There is no provisioned throughput knob —
  it autoscales within account targets.

## Security and IAM
- Prefer **Microsoft Entra ID + Azure RBAC** (Storage Table Data Reader/Contributor) with a **managed
  identity** over **account keys**; disable shared-key auth and use **SAS** (account/service) only when
  scoped, short-lived URLs are required. Restrict with **private endpoints** / firewall (default-deny public),
  enforce HTTPS-only + TLS 1.2; encryption at rest is on by default (add CMK if required). Scope roles
  least-privilege.

## Cost levers
- Billed on **stored GB + transactions + egress** — one of the **cheapest** Azure data stores. Levers: design
  for **point queries** (avoid table scans, which read & bill many entities), **batch** writes within a
  partition to cut transactions, denormalize sparingly, pick the cheapest adequate redundancy, and expire
  stale data with application TTL logic (no native TTL).

## Scaling and limits
- A table scales to the account's capacity and a partition targets ~**2,000 entities/sec**; total account
  targets apply. Limits: **no native TTL/secondary indexes**, **no cross-partition transactions** (batch =
  same PK, ≤100 ops), property value/entity size caps, and only **eventual** secondary-region consistency
  under GRS. For SQL queries, secondary indexes, global distribution, or guaranteed throughput, use **Cosmos
  DB (Table API)** instead.

## Operating procedure
1. **Provision** — ensure the **storage account** exists, then create the **table(s)** via Terraform
   `azurerm_storage_table`, Bicep `Microsoft.Storage/storageAccounts/tableServices/tables`, or `az storage
   table create`.
2. **Configure** — finalize the **PartitionKey/RowKey** scheme and any **denormalized** secondary tables for
   alternate lookups; define batch boundaries.
3. **Secure** — assign **Entra RBAC** to a **managed identity**, disable shared-key auth, enforce
   HTTPS-only/TLS 1.2, add a **private endpoint** + default-deny firewall, and configure CMK if required.
4. **Verify** — apply [[verify-by-running]]: confirm the table exists (`az storage table exists`), then
   **insert, query (by PK+RK), and delete** an entity (`az storage entity insert` → `query` → `delete`) and
   confirm the round-trip. Capture state and result.

## Inputs
The dominant query pattern (drives PartitionKey/RowKey), write distribution (avoid hot partitions), entity
types (table count), alternate-lookup needs (denormalization), retention, auth model (Entra/managed identity
vs SAS), network exposure (private endpoint), redundancy/region, and whether Cosmos DB (Table API) features
are required.

## Output
An Azure Table Storage setup: tables in a chosen storage account with a sound PartitionKey/RowKey design and
any denormalized lookup tables, secured by Entra RBAC/managed identity, HTTPS-only and private networking —
plus verification that insert/query/delete round-trips work.

## Notes
- Gotchas: **PartitionKey/RowKey choice is essentially permanent** and dominates performance — table scans are
  slow and expensive; **hot partitions** throttle; there is **no native TTL or secondary index** (denormalize
  or expire in app code); **batch = same PartitionKey only**; **shared-key/account-key SAS** is the top
  over-exposure risk. For rich queries, secondary indexes, global distribution, or SLA-backed throughput use
  **Cosmos DB (Table API)**. 2nd consumer: the Azure role team (azure-iac-engineer / azure-cloud-architect).
  Cross-cloud peer: AWS DynamoDB.
- IaC/CLI: Terraform `azurerm_storage_table` (on `azurerm_storage_account`); Bicep/ARM
  `Microsoft.Storage/storageAccounts/tableServices/tables`. CLI `az storage table create` / `az storage entity
  insert`/`query`/`delete`.
