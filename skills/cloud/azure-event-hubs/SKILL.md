---
name: azure-event-hubs
description: Use when designing, provisioning, securing, or operating Azure Event Hubs — the managed big-data event-ingestion and streaming platform with a Kafka-compatible endpoint (Azure Event Hubs). Covers namespaces, event hubs (topics) and partitions, consumer groups and checkpointing, the partition/ordering model, Capture (auto-archive to Blob/ADLS), the Kafka protocol endpoint, Throughput Units / Processing Units / Capacity Units across Standard/Premium/Dedicated tiers, auto-inflate, and Schema Registry. Loads the knowledge: create the namespace and hubs, choose partition count and consumer groups, enable Capture, secure with Entra/managed identity and Schema Registry, size throughput, and verify ingest/consume. Consumed by the azure-event-hubs specialist and by the Azure role team (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer) when standing up the managed service (Azure Event Hubs).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-event-hubs, analytics, streaming, kafka]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Event Hubs

The managed **big-data event-ingestion** platform — a high-throughput, partitioned event stream with a
**Kafka-compatible endpoint**. This skill owns the **Azure managed-service layer** — the namespace, hubs,
partitions, consumer groups, Capture, throughput sizing, and security — and verifying ingest/consume; it
defers **Kafka protocol/client semantics** to the Kafka data team and **cloud-agnostic streaming design** to
the data engine teams.

## Core concepts and components
- **Namespace** — the top-level container (`azurerm_eventhub_namespace`) with a tier (Standard/Premium/
  Dedicated), throughput sizing, and the Kafka endpoint toggle.
- **Event hub** — a hub (`azurerm_eventhub`, the Kafka "topic") that holds events across a fixed number of
  **partitions** chosen at create time (the unit of parallelism and ordering).
- **Partitions** — events are ordered **within a partition**; a partition key routes related events to the
  same partition; partition count is largely fixed (Premium/Dedicated allow scale-up).
- **Consumer groups** — independent **views/cursors** over a hub (`azurerm_eventhub_consumer_group`); each
  consumer group checkpoints its own offset, enabling multiple independent readers.
- **Capture** — auto-archive raw events to **Blob/ADLS Gen2** as Avro on a time/size window — zero-code
  landing for batch analytics.
- **Kafka endpoint** — Event Hubs speaks the **Apache Kafka 1.0+ protocol**, so Kafka producers/consumers
  connect without code changes (no ZooKeeper).
- **Throughput** — **Throughput Units (TU)** on Standard (with **auto-inflate**), **Processing Units (PU)** on
  Premium, **Capacity Units (CU)** on Dedicated.

## Configuration and sizing
- Create the **namespace** (tier), then hubs with a **partition count** sized to peak parallelism and
  retention, add **consumer groups** per downstream reader, enable **Capture** if batch landing is needed, and
  size throughput (**TU/PU/CU**) with **auto-inflate** on Standard. Set **message retention** days.

## Security and IAM
- **Entra ID** auth + **Azure RBAC** data roles (Event Hubs Data Sender/Receiver/Owner); prefer **managed
  identity** over SAS connection strings; restrict with **private endpoints**/firewall and **IP rules**; use
  the **Schema Registry** to enforce payload contracts.

## Cost levers
- Billing = throughput units (**TU/PU/CU**) + capture + retention. Levers: **auto-inflate** Standard TUs to
  peak instead of over-provisioning, choose **Premium/Dedicated** only at sustained high scale, right-size
  **partition count** (you cannot easily shrink), and keep **retention** to what is actually needed.

## Scaling and limits
- Throughput scales with **TU/PU/CU**; consumer parallelism is capped by **partition count** (set it for peak
  fan-out — hard to change on Standard). Limits: 1 MB/2 MB request size, per-TU ingress/egress caps, max
  consumer groups per tier, and ordering is **only per partition**, not per hub.

## Operating procedure
1. **Provision** — create the **namespace** + **event hub(s)** via Terraform `azurerm_eventhub_namespace` +
   `azurerm_eventhub`, Bicep `Microsoft.EventHub/namespaces`, or `az eventhubs namespace create`.
2. **Configure** — set **partition count** + retention, add **consumer groups**, enable **Capture**, toggle
   the **Kafka endpoint**, and size **TU/PU/CU** (+ auto-inflate).
3. **Secure** — assign **RBAC data roles** to managed identities, add **private endpoints**/firewall, and
   register schemas in the **Schema Registry**.
4. **Verify** — apply [[verify-by-running]]: confirm the namespace/hub provisioned (`az eventhubs eventhub
   show`), **send** a test event and **receive** it from a consumer group, confirming partition routing and
   (if enabled) a **Capture** file lands in Blob. Capture result.

## Inputs
Expected ingress/egress throughput and parallelism, partition count + retention, number of independent
consumers (consumer groups), Capture/batch-landing need, Kafka-client compatibility requirement, tier, schema
contracts, security posture (managed identity, private endpoints), and region.

## Output
An Azure Event Hubs setup: a namespace + hubs with appropriate partition count/retention, consumer groups,
optional Capture and Kafka endpoint, right-sized throughput units, RBAC data roles on managed identities +
private networking + Schema Registry — plus verification that events ingest and consume.

## Notes
- Gotchas: **partition count is essentially fixed** on Standard — size for peak fan-out up front; ordering is
  **per-partition only**; 1 MB request size limit; SAS keys leak — prefer **managed identity**; **Capture**
  writes Avro, not raw JSON. **Kafka protocol/client semantics and topic-design conventions are the Kafka
  team's job** (the Event Hubs specialist owns the Azure managed service, not the Kafka surface) — defer to the
  Kafka data team; cloud-agnostic streaming design to data/etl-architect. 2nd consumer: the Azure role team
  (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer). Cross-cloud peers: AWS Kinesis Data
  Streams / MSK, GCP Pub/Sub.
- IaC/CLI: Terraform `azurerm_eventhub_namespace` (+ `azurerm_eventhub` / `azurerm_eventhub_consumer_group` /
  `azurerm_eventhub_namespace_authorization_rule`); Bicep/ARM `Microsoft.EventHub/namespaces`. CLI `az
  eventhubs namespace create` / `az eventhubs eventhub create`.
