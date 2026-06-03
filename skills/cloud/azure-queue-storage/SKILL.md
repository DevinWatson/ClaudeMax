---
name: azure-queue-storage
description: Use when designing, provisioning, securing, or operating Azure Queue Storage — simple, durable HTTP/HTTPS message queues in a storage account for decoupling application components (Azure Queue Storage). Covers queues and messages, the visibility-timeout / lease model for at-least-once processing, message size (64 KB) and TTL, peek vs get/delete semantics, poison-message handling via dequeue count, Entra ID/RBAC vs account keys and SAS, managed identities, and private endpoints. Loads the knowledge: pick the storage account, create queues, choose visibility timeout and poison thresholds, secure with Entra, provision, and verify enqueue/dequeue/delete round-trips. Consumed by the azure-queue-storage specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Queue Storage).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-queue-storage, storage, messaging, queue]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Queue Storage

Azure's **simple, massively scalable message queue** for decoupling producers and consumers, exposed through
a **storage account** (`https://<account>.queue.core.windows.net`). It is a lightweight at-least-once queue —
not a broker. Azure owns durability/replication; you own the **queues**, the **processing model** (visibility
timeout, poison handling), and **access**. This skill owns the **managed-service layer**.

## Core concepts and components
- **Storage account + queues** — a queue holds an ordered (best-effort) list of **messages**; one account can
  hold many queues. StorageV2 standard is typical; redundancy (LRS/ZRS/GRS/GZRS) is inherited from the account.
- **Messages** — up to **64 KB** each (base64 for binary); a queue can hold millions of messages up to the
  account capacity. Each message has a **time-to-live (TTL)** (default 7 days, can be infinite).
- **Visibility timeout / lease model** — a consumer calls **Get Messages**, which hides the message for a
  **visibility timeout**; the consumer processes then calls **Delete Message** with the pop receipt. If it is
  not deleted before the timeout expires, the message becomes visible again (at-least-once, supports retries).
- **Peek vs Get** — **Peek** reads without acquiring a lease (no visibility change); **Get** leases.
- **Poison-message handling** — each message tracks a **dequeue count**; when it exceeds a threshold, move it
  to a separate **poison queue** (`<queue>-poison`) for inspection rather than looping forever.

## Configuration and sizing
- Pick the **storage account** (kind/SKU/redundancy) the queues live in; create one **queue per logical work
  stream**. Set **visibility timeout** to slightly more than worst-case processing time, set a **poison
  threshold** (commonly 5 dequeues), and choose **TTL** per retention need. Batch up to 32 messages per Get to
  reduce transactions.

## Security and IAM
- Prefer **Microsoft Entra ID + Azure RBAC** (Storage Queue Data Message Processor/Sender/Reader,
  Contributor) with a **managed identity** over **account keys**; disable shared-key auth and use
  **user-delegation SAS** rather than account-key SAS for scoped, short-lived URLs. Restrict with **private
  endpoints** / firewall (default-deny public), enforce HTTPS-only + TLS 1.2; encryption at rest is on by
  default (add CMK if required). Scope roles least-privilege per queue.

## Cost levers
- Billed on **stored GB + transactions (each Get/Put/Delete/Peek) + egress**. Levers: **batch** Get/Delete to
  cut transaction count, tune visibility timeout to avoid needless re-reads, expire stale messages via TTL,
  pick the cheapest adequate redundancy, and avoid hot polling — use longer poll intervals or move to Service
  Bus if you need true push/long-polling.

## Scaling and limits
- A single queue targets ~**2,000 messages/sec** (2 KB each) and scales horizontally by sharding across
  queues/accounts. Limits: **64 KB** max message, **7-day** default TTL, ordering is **best-effort not
  guaranteed**, and delivery is **at-least-once** (design idempotent consumers). For ordering, sessions,
  topics/subscriptions, dead-letter queues, or >64 KB, use **Azure Service Bus** instead.

## Operating procedure
1. **Provision** — ensure the **storage account** exists, then create the **queue(s)** via Terraform
   `azurerm_storage_queue`, Bicep `Microsoft.Storage/storageAccounts/queueServices/queues`, or `az storage
   queue create`.
2. **Configure** — decide **visibility timeout**, **TTL**, **poison-queue** name + dequeue threshold, and
   batch size in the consumer.
3. **Secure** — assign **Entra RBAC** to a **managed identity**, disable shared-key auth, prefer
   **user-delegation SAS**, enforce HTTPS-only/TLS 1.2, add a **private endpoint** + default-deny firewall,
   and configure CMK if required.
4. **Verify** — apply [[verify-by-running]]: confirm the queue exists (`az storage queue exists`), then
   **enqueue, dequeue, and delete** a message (`az storage message put` → `peek`/`get` → `delete`) and confirm
   the round-trip. Capture state and result.

## Inputs
The work stream(s) and throughput (queue count/sharding), worst-case processing time (visibility timeout),
retry/poison tolerance (dequeue threshold + poison queue), retention (TTL), auth model (Entra/managed identity
vs SAS), network exposure (private endpoint), redundancy/region, and whether richer messaging (Service Bus) is
actually required.

## Output
An Azure Queue Storage setup: queues in a chosen storage account with the right visibility timeout, TTL, and
poison-handling, secured by Entra RBAC/managed identity, HTTPS-only and private networking — plus verification
that enqueue/dequeue/delete round-trips work.

## Notes
- Gotchas: ordering is **best-effort**, not FIFO; delivery is **at-least-once** (build **idempotent**
  consumers); a too-short **visibility timeout** causes duplicate processing; without a **poison queue** a bad
  message loops forever; **64 KB** cap means store large payloads in Blob and queue a pointer; **shared-key/
  account-key SAS** is the top over-exposure risk. If you need topics, sessions, FIFO, or dead-lettering use
  **Azure Service Bus**, not Queue Storage. 2nd consumer: the Azure role team (azure-iac-engineer /
  azure-cloud-architect). Cross-cloud peers: AWS SQS, GCP Pub/Sub.
- IaC/CLI: Terraform `azurerm_storage_queue` (on `azurerm_storage_account`); Bicep/ARM
  `Microsoft.Storage/storageAccounts/queueServices/queues`. CLI `az storage queue create` / `az storage
  message put`/`peek`/`get`/`delete`.
