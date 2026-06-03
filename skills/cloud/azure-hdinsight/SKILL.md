---
name: azure-hdinsight
description: Use when designing, provisioning, securing, or operating Azure HDInsight — the managed open-source big-data service that runs full Apache cluster distributions (Hadoop, Spark, Kafka, HBase, Interactive Query/LLAP) on Azure (Azure HDInsight). Covers cluster types and the head/worker/zookeeper node topology, VM SKU sizing and autoscale (load-based and schedule-based), ADLS Gen2 as the cluster's default/linked storage, deployment into a VNet, Enterprise Security Package (Entra Domain Services + Apache Ranger for Kerberized multi-user clusters), Kafka broker/partition layout and HBase region design, and script actions/edge nodes for customization. Loads the knowledge: pick the cluster type, size nodes, attach storage + VNet, secure with ESP, and verify a job/topic/table works. Consumed by the azure-hdinsight specialist and by the Azure role team (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer) when standing up the managed service (Azure HDInsight).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-hdinsight, analytics, hadoop, spark, kafka]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure HDInsight

A **managed** deployment of full **open-source Apache** big-data distributions — Hadoop, Spark, Kafka, HBase,
Interactive Query (LLAP) — on Azure VMs. This skill owns the **Azure managed-service layer** (cluster type,
node sizing, storage/VNet, ESP security, autoscale) and verifying a workload runs; it defers **job/query/data
design** to the data engine teams.

## Core concepts and components
- **Cluster types** — choose one per cluster: **Spark**, **Hadoop**, **Kafka**, **HBase**, **Interactive
  Query (LLAP)**. Each maps to a Terraform resource (`azurerm_hdinsight_spark_cluster`,
  `azurerm_hdinsight_kafka_cluster`, `azurerm_hdinsight_hbase_cluster`, `..._hadoop_cluster`, `..._interactive
  _query_cluster`).
- **Node topology** — **head nodes** (typically 2 for HA), **worker nodes** (scale-out compute), and
  **zookeeper** nodes; **edge nodes** for client tooling; size each role's **VM SKU** independently.
- **Storage** — clusters use **ADLS Gen2** (or Blob) as **default/linked storage** so data outlives the
  cluster — clusters are meant to be **transient compute** over durable lake storage.
- **Autoscale** — **load-based** (scale on YARN metrics) or **schedule-based** worker autoscale.
- **Kafka specifics** — broker = worker node count, **partitions** + **replication factor**, and **managed
  disks per broker** for throughput/retention. **HBase** designs **region servers** and row-key splits.
- **ESP** — the **Enterprise Security Package**: **Entra Domain Services** + **Kerberos** + **Apache Ranger**
  for multi-user, role-based, audited clusters.

## Configuration and sizing
- Pick the **cluster type** for the engine, size **head/worker/zookeeper** SKUs to the workload, deploy into a
  **VNet** (and your ADLS Gen2), set **autoscale**, and add **ESP** for multi-user security. For **Kafka**,
  size brokers + **managed disks** + partitions/replication for throughput and retention; for **HBase**, plan
  region servers. Treat clusters as **transient** over the lake — delete when idle.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC**. Multi-user data-plane security uses the **Enterprise Security
  Package** (Entra Domain Services + Kerberos + **Apache Ranger** policies + audit). Deploy in a **VNet** with
  NSGs, use **managed identity** for ADLS Gen2 access, encrypt at rest, and avoid exposing cluster gateways
  publicly without restriction.

## Cost levers
- Cost = **VM hours across all nodes** (always-on). Big levers: **delete/recreate clusters** for transient
  jobs (storage in ADLS Gen2 persists), **autoscale** workers down off-peak, right-size **worker SKUs** and
  count, and use **schedule-based** scaling. Long-lived clusters (Kafka/HBase) are inherently costlier —
  size carefully. For ephemeral Spark, **Databricks/Synapse** may be cheaper.

## Scaling and limits
- Workers scale out via autoscale/manual resize. Limits: **cluster type is fixed at creation** (no mixing
  engines — create separate clusters); clusters are **always-on VMs** (no pause — delete to stop cost); **core
  quotas** per region/VM family apply (request increases); **ESP requires Entra Domain Services** in the VNet;
  Kafka/HBase clusters are **stateful** and not throwaway.

## Operating procedure
1. **Provision** — create the cluster of the chosen type with head/worker/zookeeper roles + ADLS Gen2 + VNet
   via Terraform `azurerm_hdinsight_<type>_cluster`, Bicep `Microsoft.HDInsight/clusters`, or `az hdinsight
   create`.
2. **Configure** — set **VM SKUs** per role, **autoscale** (load/schedule), Kafka **partitions/replication +
   managed disks** / HBase region layout, and **script actions/edge nodes** for customization.
3. **Secure** — enable **ESP** (Entra Domain Services + Ranger) for multi-user, deploy in a **VNet** with NSGs,
   use **managed identity** for storage, and scope **RBAC**.
4. **Verify** — apply [[verify-by-running]]: confirm the cluster provisioned (`az hdinsight show`), then run an
   engine-appropriate smoke test — submit a **Spark job**, produce/consume a **Kafka topic**, or read/write an
   **HBase/Hive table** — and confirm success. Capture state and result.

## Inputs
The engine/cluster type, expected throughput/data volume, head/worker/zookeeper SKU + count, autoscale policy,
ADLS Gen2 + VNet, Kafka partition/replication/disk or HBase region design, multi-user/security needs (ESP),
and region/quota.

## Output
An Azure HDInsight setup: a cluster of the right type with sized node roles, ADLS Gen2 + VNet, autoscale,
engine-specific config (Kafka partitions/disks, HBase regions), ESP security where needed, scoped RBAC — plus
verification that a representative job/topic/table works.

## Notes
- Gotchas: **cluster type is fixed at creation** (one engine per cluster); clusters are **always-on VMs** with
  **no pause** — delete transient clusters (lake storage persists); **ESP needs Entra Domain Services** in the
  VNet; **core quotas** bite; Kafka/HBase are **stateful** — size disks/regions carefully; for ephemeral Spark,
  **Databricks/Synapse** are often cheaper. **Job/query/topic-schema and data design are the data team's job**
  — defer to data/etl-architect (pipeline design) and data/sql-optimizer (query rewrites); **Kafka
  event/streaming workloads** also cross-reference the kafka data team for topic/consumer design. 2nd
  consumer: the Azure role team (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer).
  Cross-cloud peer: AWS EMR.
- IaC/CLI: Terraform `azurerm_hdinsight_spark_cluster` / `azurerm_hdinsight_kafka_cluster` /
  `azurerm_hdinsight_hbase_cluster` / `azurerm_hdinsight_hadoop_cluster` / `azurerm_hdinsight_interactive
  _query_cluster`; Bicep/ARM `Microsoft.HDInsight/clusters`. CLI `az hdinsight create`.
