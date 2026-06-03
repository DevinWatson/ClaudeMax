---
name: azure-cosmos-db
description: Use when designing, provisioning, securing, or operating Azure Cosmos DB — Azure's globally distributed, multi-model NoSQL/relational PaaS database (Azure Cosmos DB). Covers the API surface (NoSQL/Core, MongoDB, Cassandra, Gremlin/graph, Table), partition-key design, RU/s throughput (provisioned, autoscale, serverless), the five consistency levels (strong→eventual), turnkey global distribution with multi-region writes, automatic and continuous backups (PITR), Entra ID/RBAC and key-based auth, managed identities, private endpoints, and CMK encryption. Loads the knowledge: choose an API and partition key, size throughput, pick consistency and regions, provision, secure, and verify the account answers reads/writes. Consumed by the azure-cosmos-db specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Cosmos DB).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-cosmos-db, databases, nosql, multi-model, global-distribution]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Cosmos DB

Azure's **globally distributed, multi-model NoSQL** PaaS database with single-digit-millisecond latency and
turnkey multi-region replication. Azure runs the infrastructure, replication, and indexing engine; you own
the **account/database/container**, the **API choice**, **partition-key design**, **throughput**,
**consistency**, and **region topology**. This skill owns the **managed-service layer** — not application
data modeling internals or per-engine (e.g. Mongo/Cassandra) query tuning, which belong to the data engine
teams.

## Core concepts and components
- **APIs (per account, fixed at creation)** — **NoSQL/Core** (native, richest features), **MongoDB**
  (wire-protocol compatible), **Cassandra** (CQL), **Gremlin** (graph), **Table** (key-value). Pick the API
  to match the client/driver and data shape; you cannot change it later.
- **Resource hierarchy** — **account → database → container** (collection/table/graph). Containers hold
  items and are the unit of throughput and partitioning.
- **Partition key** — chooses the **logical partition** for each item; the most important design decision.
  Aim for high cardinality and even read/write distribution; a hot/low-cardinality key throttles and limits
  scale. 20 GB per logical partition.
- **Throughput (RU/s)** — **provisioned** (manual), **autoscale** (scales 10%–100% of a max), or
  **serverless** (pay per RU, for spiky/dev). Set at database (shared) or container level.
- **Consistency levels** — **strong**, **bounded staleness**, **session** (default), **consistent prefix**,
  **eventual** — trading latency/availability for freshness.
- **Global distribution** — add regions for read locality and DR; enable **multi-region writes**
  (multi-master) for write locality with conflict resolution.
- **Backups** — **periodic** (default) or **continuous** with **point-in-time restore** (7/30-day).

## Configuration and sizing
- Choose the **API** (NoSQL unless a wire-protocol drives Mongo/Cassandra/Gremlin/Table), design the
  **partition key** for even distribution, and pick a throughput mode: **autoscale** for variable load,
  **serverless** for dev/spiky, **provisioned** for steady high volume. Set **consistency** (session is the
  pragmatic default), add **regions** and enable **multi-region writes** only if you need local writes.
  Choose **continuous backup** when PITR is required.

## Security and IAM
- Prefer **Microsoft Entra ID + Azure RBAC** (data-plane RBAC roles) and **managed identity** for app
  access over account keys; **disable local (key) auth** where possible and rotate keys otherwise. Restrict
  network with **private endpoints** / firewall / VNet rules (disable public). Encryption at rest is on by
  default; add **customer-managed keys (CMK)** in Key Vault when required. Scope keys/roles least-privilege.

## Cost levers
- Billed on **provisioned/autoscale RU/s (per region) + stored data + backup**. Levers: **autoscale** for
  variable workloads, **serverless** for low/spiky usage, right-size **max RU/s**, use **free tier** (first
  1000 RU/s + 25 GB) for dev, scope multi-region writes/extra regions only when needed (each replicated
  region multiplies RU cost), and tune the partition key to avoid over-provisioning around hot partitions.

## Scaling and limits
- Scale RU/s up/down online; autoscale reacts automatically within the max. Add/remove regions online.
  Limits: 20 GB per logical partition, RU/s caps per container, autoscale floor (10% of max), and the
  **API is immutable** after account creation. Cross-partition queries fan out and cost more RU/s.

## Operating procedure
1. **Provision** — create the **account** with the chosen **API** and consistency/region config, then
   **database** and **container** with the **partition key** and throughput via Terraform
   `azurerm_cosmosdb_account` + `azurerm_cosmosdb_sql_database` + `azurerm_cosmosdb_sql_container` (or Bicep
   `Microsoft.DocumentDB/databaseAccounts`, or `az cosmosdb create` / `az cosmosdb sql container create`).
2. **Configure** — set **throughput mode** (autoscale/serverless/provisioned), **consistency level**, add
   **regions** and **multi-region writes** if needed, and **continuous backup** for PITR.
3. **Secure** — assign **Entra RBAC** data roles to a **managed identity**, disable local auth where
   feasible, enable **private endpoint**/firewall (disable public), and configure **CMK** if required.
4. **Verify** — apply [[verify-by-running]]: confirm the account exists and shows `provisioningState`
   `Succeeded` and the expected regions (`az cosmosdb show`), then **issue a read/write** against the
   container (SDK with managed identity, `az cosmosdb sql container show`, or a sample item upsert/read) and
   confirm it returns. Capture state and the operation result.

## Inputs
The access pattern and data shape (drives API + partition key), throughput profile (steady vs spiky),
consistency requirement, region topology and write locality (single vs multi-region writes), backup/PITR
needs, auth model (Entra/managed identity vs keys), network exposure (private endpoint), encryption (CMK),
and target region(s).

## Output
An Azure Cosmos DB setup: an account on the chosen API with a database/container, a sound partition key, the
right throughput mode and consistency, the region/write topology, configured backups, secured by Entra
RBAC/managed identity and private networking (optionally CMK) — plus verification that the account is
Succeeded and serves reads/writes.

## Notes
- Gotchas: the **API is immutable** after account creation — choose deliberately; a **bad partition key** is
  the #1 scaling/throttling failure and is effectively a migration to fix; **autoscale** never bills below
  10% of max; **multi-region writes** multiply RU cost and introduce conflict resolution; **strong**
  consistency forbids multi-region writes and adds latency; **continuous backup** must be chosen at create
  time (cannot switch from periodic freely); cross-partition queries are RU-expensive. Engine-internal data
  modeling / Mongo/Cassandra/Gremlin query tuning belongs to the data engine teams under `agents/data/`.
  2nd consumer: the Azure role team (azure-iac-engineer / azure-cloud-architect). Cross-cloud peers: AWS
  DynamoDB, GCP Firestore.
- IaC/CLI: Terraform `azurerm_cosmosdb_account` (+ `azurerm_cosmosdb_sql_database` /
  `azurerm_cosmosdb_sql_container`, or the mongo/cassandra/gremlin/table variants); Bicep/ARM
  `Microsoft.DocumentDB/databaseAccounts`. CLI `az cosmosdb create` / `az cosmosdb sql container create` /
  `az cosmosdb show`.
