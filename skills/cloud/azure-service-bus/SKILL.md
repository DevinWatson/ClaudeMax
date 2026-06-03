---
name: azure-service-bus
description: Use when designing, provisioning, securing, or operating Azure Service Bus — the managed enterprise messaging broker for reliable, ordered, transactional messaging (Azure Service Bus). Covers namespaces, queues (point-to-point) and topics + subscriptions (publish/subscribe with subscription filters/rules), sessions (FIFO + correlated processing), dead-letter queues, message TTL, duplicate detection, peek-lock vs receive-and-delete, scheduled/deferred messages, transactions, auto-forwarding, and the Basic/Standard/Premium tiers (Premium = dedicated Messaging Units, VNet, large messages, geo-DR). Loads the knowledge: create the namespace, define queues/topics + subscriptions and filters, configure sessions/dead-letter/dedup, secure with Entra/managed identity, size MUs, and verify send/receive. Consumed by the azure-service-bus specialist and by the Azure role team (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer) when standing up the managed service (Azure Service Bus).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-service-bus, integration, messaging, queues]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Service Bus

The managed **enterprise messaging broker** for reliable, **ordered, transactional** messaging between
decoupled components. This skill owns the **Azure managed-service layer** — the namespace, queues/topics +
subscriptions, delivery semantics, tier/MU sizing, and security — and verifying send/receive; it defers
**cloud-agnostic messaging/event-driven design** to the architecture teams.

## Core concepts and components
- **Namespace** — the container (`azurerm_servicebus_namespace`) with a **tier** (Basic/Standard/Premium); the
  unit of capacity and network isolation.
- **Queue** — **point-to-point** messaging (`azurerm_servicebus_queue`) with competing consumers; one receiver
  gets each message.
- **Topic + subscriptions** — **publish/subscribe** (`azurerm_servicebus_topic` +
  `azurerm_servicebus_subscription`): a topic fans out to subscriptions, each filtered by **rules** (SQL/
  correlation filters).
- **Sessions** — **FIFO** + correlated processing: messages with the same session ID are processed in order by
  one locked receiver.
- **Dead-letter queue (DLQ)** — sub-queue for messages that exceed **max delivery count**, TTL, or fail filter
  evaluation — inspect/replay later.
- **Delivery semantics** — **peek-lock** (at-least-once, explicit complete/abandon) vs **receive-and-delete**
  (at-most-once); **duplicate detection**, **message TTL**, **scheduled/deferred** messages, and
  **transactions** (atomic multi-message operations).

## Configuration and sizing
- Create the **namespace** (tier), then **queues** for point-to-point and **topics + subscriptions** for
  pub/sub with **filters**, enable **sessions** for ordering, set **max delivery count** (→ DLQ), **TTL**, and
  **duplicate detection**, and pick **peek-lock**. On **Premium** size **Messaging Units (MU)** for throughput
  and isolation.

## Security and IAM
- **Entra ID** auth + **Azure RBAC** data roles (Service Bus Data Sender/Receiver/Owner); prefer **managed
  identity** over SAS connection strings; on **Premium** use **private endpoints**/VNet + IP firewall;
  **customer-managed keys** for encryption. Scope least-privilege per queue/topic.

## Cost levers
- **Basic/Standard** = per-**operation** (+ Standard brokered-connection/feature charges); **Premium** =
  fixed **Messaging Units**. Levers: choose **Standard** for low/moderate variable load, **Premium** for
  predictable high throughput / VNet / large messages; avoid chatty **long-polling**; right-size MUs; let
  **auto-delete-on-idle** clean up transient entities.

## Scaling and limits
- Standard scales elastically (shared); **Premium** scales by **MUs** (1/2/4/8/16) with predictable latency.
  Limits: message size (256 KB Standard / up to 100 MB Premium), entity/subscription counts per namespace,
  **sessions serialize** per session ID (ordering trades throughput), and DLQ growth if poison messages aren't
  handled.

## Operating procedure
1. **Provision** — create the **namespace** via Terraform `azurerm_servicebus_namespace`, Bicep
   `Microsoft.ServiceBus/namespaces`, or `az servicebus namespace create`.
2. **Configure** — create **queues** and/or **topics + subscriptions** with **filter rules**; set
   **sessions**, **max delivery count** (DLQ), **TTL**, **duplicate detection**, **peek-lock**; size **MUs**
   on Premium.
3. **Secure** — assign **RBAC data roles** to managed identities, add **private endpoints**/firewall
   (Premium), and configure CMK if required.
4. **Verify** — apply [[verify-by-running]]: confirm the namespace/entities provisioned (`az servicebus queue
   show`), **send** a message and **receive** it (peek-lock complete), then confirm a poison message lands in
   the **DLQ** as configured. Capture result.

## Inputs
Messaging pattern (queue vs topic/subscriptions), ordering/FIFO need (sessions), delivery semantics + retry/
DLQ policy, throughput + latency + isolation requirements (drives Standard vs Premium + MUs), message size,
security posture (managed identity, private endpoints), and region.

## Output
An Azure Service Bus setup: a namespace on the right tier with queues and/or topics + subscriptions and
filters, configured sessions/DLQ/TTL/dedup/peek-lock, sized MUs (Premium), RBAC data roles on managed
identities + private networking — plus verification that send/receive (and DLQ) work.

## Notes
- Gotchas: **sessions** give ordering but **serialize** per session (throughput cost); unhandled poison
  messages flood the **DLQ** (set max delivery count + a DLQ drain); **256 KB** message limit on Standard (use
  Premium/claim-check for big payloads); SAS keys leak — use **managed identity**; topic **filters** must be
  correct or subscriptions miss/duplicate. **Cloud-agnostic messaging/event-driven design is the architecture
  team's job** — defer to engineering/integration architects. 2nd consumer: the Azure role team
  (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer). Cross-cloud peers: AWS SQS + SNS,
  GCP Pub/Sub.
- IaC/CLI: Terraform `azurerm_servicebus_namespace` (+ `azurerm_servicebus_queue` /
  `azurerm_servicebus_topic` / `azurerm_servicebus_subscription` / `azurerm_servicebus_subscription_rule`);
  Bicep/ARM `Microsoft.ServiceBus/namespaces`. CLI `az servicebus namespace create` / `az servicebus queue
  create`.
