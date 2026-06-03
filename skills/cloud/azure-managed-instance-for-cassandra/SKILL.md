---
name: azure-managed-instance-for-cassandra
description: Use when designing, provisioning, securing, or operating Azure Managed Instance for Apache Cassandra — Azure's managed service running open-source Apache Cassandra / DataStax-compatible clusters on dedicated VMs (Azure Managed Instance for Apache Cassandra). Covers cluster/datacenter/node topology, SKU and disk sizing, multi-datacenter and multi-region replication, hybrid clusters that join on-prem/self-hosted Cassandra rings, automated repair and patching, backups, Cassandra/CQL authentication and Entra-integrated management, VNet injection/private networking, and encryption. Loads the knowledge: size the cluster and datacenters, choose replication, provision, secure, and verify the cluster is healthy and answers CQL. Consumed by the azure-managed-instance-for-cassandra specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Managed Instance for Apache Cassandra).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-managed-instance-for-cassandra, databases, cassandra, nosql, wide-column]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Managed Instance for Apache Cassandra

Azure's **managed service for open-source Apache Cassandra** (and DataStax-compatible workloads), running
real Cassandra on **dedicated VMs** that you control at the topology level while Azure handles deployment,
patching, scaling, and repair. Unlike the Cassandra API on Cosmos DB, this is **actual Apache Cassandra** —
ideal for lift-and-shift and **hybrid clusters**. This skill owns the **managed-service layer** —
cluster/datacenter sizing, replication, repair, backups, and access — not CQL data modeling / keyspace
design, which is the Cassandra engine team's job.

## Core concepts and components
- **Cluster → datacenter → node** — a **managed cluster** contains one or more **datacenters** (each in a
  region/VNet), each with a set of **nodes** running Cassandra. Nodes are dedicated VMs (SKU + data disks).
- **Replication** — multi-datacenter and multi-region replication via Cassandra's native ring; keyspace
  `NetworkTopologyStrategy` maps replicas across datacenters for HA/DR and read locality.
- **Hybrid clusters** — join Azure-managed datacenters to **self-hosted/on-prem Cassandra** datacenters in
  the same logical ring for migration or burst capacity.
- **SKU & disk sizing** — choose VM SKU (cores/memory) and **managed data disks** (P-series/Premium SSD) per
  node; sizing drives throughput, storage, and cost.
- **Operations** — Azure runs **automated repair**, OS/Cassandra **patching**, node health, and scaling
  (add/remove nodes and datacenters). **Backups** are managed.
- **Compatibility** — supports open-source Cassandra and DataStax-compatible drivers/CQL.

## Configuration and sizing
- Choose the **Cassandra version**, the **VM SKU** and **per-node data disk** size/type, and the **node
  count per datacenter** (replication factor typically 3). Add **datacenters** (in-region for capacity,
  cross-region for DR/locality) and set keyspace replication accordingly. For migration, configure a
  **hybrid cluster** joining existing self-hosted datacenters. Set the **VNet/subnet** for each datacenter.

## Security and IAM
- Manage the resource with **Microsoft Entra ID + Azure RBAC**; data-plane access uses **Cassandra
  authentication** (cassandra users/roles) over the native protocol. Deploy datacenters with **VNet
  injection** into your subnets (private networking, NSGs) — no public data endpoint. Enforce **client and
  node-to-node TLS**; encryption at rest on managed disks. Manage seed/credentials and rotate; least-
  privilege Cassandra roles.

## Cost levers
- Billed on **nodes (VM SKU) × node count × datacenters + managed disks + cross-region traffic/replication**.
  Levers: right-size the **SKU and node count**, scale node count to load, add datacenters/regions only for
  real HA/DR/locality needs, size **data disks** to working set, and use hybrid clusters to migrate
  incrementally instead of over-provisioning.

## Scaling and limits
- **Scale out/in** by adding/removing nodes (Cassandra rebalances/streams data) and **add/remove
  datacenters**; vertical SKU changes require node replacement. Limits: minimum node counts per datacenter
  for HA, streaming time when scaling large rings, and disk size caps per SKU. Repairs and topology changes
  are I/O-intensive — plan windows.

## Operating procedure
1. **Provision** — create the **managed cluster** then a **datacenter** (region, VNet subnet, SKU, node
   count, disk) via Terraform `azurerm_cosmosdb_cassandra_cluster` + `azurerm_cosmosdb_cassandra_datacenter`
   or Bicep `Microsoft.DocumentDB/cassandraClusters` (+ `/dataCenters`), or `az managed-cassandra cluster
   create` / `az managed-cassandra datacenter create`.
2. **Configure** — set **node count** and **replication** across datacenters, add **cross-region
   datacenters** for DR, configure **hybrid** joins for migration, and confirm managed **repair/backup**.
3. **Secure** — deploy into the **VNet/subnet** (private), enforce **client/node TLS**, manage Cassandra
   users/roles least-privilege, and govern the resource with **Entra RBAC**.
4. **Verify** — apply [[verify-by-running]]: confirm the datacenter `provisioningState` is `Succeeded` and
   nodes are healthy (`az managed-cassandra cluster show` / `... status`), then **connect and run CQL**
   (`cqlsh --ssl` then `DESCRIBE KEYSPACES;` / `SELECT release_version FROM system.local;`) and confirm ring
   status across datacenters. Capture state and CQL output.

## Inputs
The data volume and throughput (drives SKU/node count/disk), replication/HA topology (datacenters per
region, replication factor), migration scenario (hybrid cluster joining self-hosted rings), Cassandra
version, network placement (VNet/subnets), TLS and auth requirements, and region(s).

## Output
An Azure Managed Instance for Apache Cassandra setup: a managed cluster with one or more sized datacenters,
the right node count/replication topology (optionally hybrid), VNet-private networking, TLS and Cassandra
auth — plus verification that the cluster is Succeeded, nodes are healthy, and CQL works.

## Notes
- Gotchas: this is **real Apache Cassandra on dedicated VMs**, not the Cosmos DB Cassandra API (RU model) —
  pick deliberately; scaling/repair **streams data** and is I/O-heavy (plan windows); minimum node counts
  apply for HA; **VNet injection** is required (subnet sizing/NSG mistakes block deployment); hybrid clusters
  need network connectivity and matching configuration to the self-hosted ring. **CQL data modeling /
  keyspace and partition design** belong to the Cassandra engine team under `agents/data/`. 2nd consumer: the
  Azure role team (azure-iac-engineer / azure-cloud-architect). Cross-cloud peer: AWS Keyspaces / self-
  managed Cassandra.
- IaC/CLI: Terraform `azurerm_cosmosdb_cassandra_cluster` + `azurerm_cosmosdb_cassandra_datacenter`;
  Bicep/ARM `Microsoft.DocumentDB/cassandraClusters` (+ `/dataCenters`). CLI `az managed-cassandra cluster
  create` / `az managed-cassandra datacenter create` / `... cluster status`; verify with `cqlsh --ssl`.
