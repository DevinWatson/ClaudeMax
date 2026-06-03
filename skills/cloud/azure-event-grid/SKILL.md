---
name: azure-event-grid
description: Use when designing, provisioning, securing, or operating Azure Event Grid — the managed event-routing / pub-sub service for reactive, event-driven architectures (Azure Event Grid). Covers system topics (events from Azure services like Storage/Resource Groups), custom topics, partner topics, and event domains (multi-tenant topic fan-out), event subscriptions and handlers (Functions, Webhooks, Service Bus, Event Hubs, Storage Queues, Hybrid Connections), the EventGridSchema vs CloudEvents 1.0 schemas, subject/event-type filtering and advanced filters, retry + dead-letter to Blob, and delivery/throughput characteristics. Loads the knowledge: create the topic/domain, define subscriptions with filters and handlers, configure retry/dead-letter, secure with Entra/managed identity, and verify event delivery. Consumed by the azure-event-grid specialist and by the Azure role team (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer) when standing up the managed service (Azure Event Grid).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-event-grid, integration, eventing, pub-sub]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Event Grid

The managed **event-routing / pub-sub** service for reactive, **event-driven** architectures — route discrete
events from sources to handlers at scale. This skill owns the **Azure managed-service layer** — topics/
domains, subscriptions + filters + handlers, retry/dead-letter, and security — and verifying delivery; it
defers **cloud-agnostic event-driven architecture design** to the architecture teams.

## Core concepts and components
- **System topics** — built-in events from Azure services (`azurerm_eventgrid_system_topic`): Storage
  blob-created, Resource Group changes, Key Vault expiry, etc.
- **Custom topics** — your application's events (`azurerm_eventgrid_topic`) published via the topic endpoint.
- **Partner topics** — events from third-party SaaS partners delivered into your subscription.
- **Event domains** — a management/fan-out construct (`azurerm_eventgrid_domain`) for **multi-tenant**
  publishing: many topics under one endpoint, each with its own subscriptions and access.
- **Event subscriptions & handlers** — a **subscription** (`azurerm_eventgrid_event_subscription`) routes
  filtered events to a **handler**: Azure **Functions**, **Webhook**, **Service Bus**, **Event Hubs**,
  **Storage Queue**, **Hybrid Connection**, or relay.
- **Schemas** — **EventGridSchema** vs **CloudEvents 1.0** (interop standard) — choose per topic/subscription.
- **Filtering** — by **event type**, **subject** prefix/suffix, and **advanced filters** (operators on event
  fields) so each handler gets only what it needs.
- **Retry & dead-letter** — at-least-once delivery with **exponential retry** + TTL; undeliverable events
  **dead-letter to Blob** for inspection/replay.

## Configuration and sizing
- Create the **topic/domain** (system/custom/partner), define **subscriptions** with **filters** (event-type/
  subject/advanced) pointed at **handlers**, pick the **schema** (CloudEvents for interop), and configure
  **retry policy** + **dead-letter** to Blob. Event Grid is **serverless** — no capacity sizing (pay per
  operation).

## Security and IAM
- **Entra ID** auth + **Azure RBAC** (EventGrid Data Sender/Contributor); prefer **managed identity** for
  publishing and for **delivery to handlers** (vs keys); secure **webhook** handlers with **validation
  handshake** + Entra; use **private endpoints**/IP firewall on topics. Scope least-privilege per topic.

## Cost levers
- Billing = **per operation** (events published/delivered/retried/dead-lettered) — serverless, scale-to-zero.
  Levers: **filter at the subscription** so you don't deliver-then-discard, avoid pathological **retry storms**
  (fix failing handlers), and don't fan an event to handlers that ignore it.

## Scaling and limits
- Auto-scales to very high event rates with no provisioning. Limits: **at-least-once** delivery means handlers
  must be **idempotent**; event size cap (1 MB); max event subscriptions per topic; webhook handlers require
  the **validation handshake**; ordering is **not guaranteed** (use Service Bus sessions if you need order).

## Operating procedure
1. **Provision** — create the **custom topic** / **system topic** / **domain** via Terraform
   `azurerm_eventgrid_topic` / `azurerm_eventgrid_system_topic` / `azurerm_eventgrid_domain`, Bicep
   `Microsoft.EventGrid/topics`, or `az eventgrid topic create`.
2. **Configure** — create **event subscriptions** with **filters** (event-type/subject/advanced) and
   **handlers**, choose the **CloudEvents/EventGridSchema** schema, and set the **retry policy** +
   **dead-letter** Blob.
3. **Secure** — use **managed identity** for publish/deliver, secure **webhook** handlers (validation + Entra),
   add **private endpoints**/firewall, and scope **RBAC**.
4. **Verify** — apply [[verify-by-running]]: confirm the topic/subscription provisioned (`az eventgrid topic
   show` / `event-subscription show`), **publish** a test event and confirm the **handler** received it (and
   that a deliberately-failing event lands in the **dead-letter** Blob). Capture result.

## Inputs
Event sources (system/custom/partner), the handlers to route to, filtering needs (event-type/subject/advanced),
schema (CloudEvents vs EventGridSchema), multi-tenant fan-out need (domain), retry/dead-letter policy,
idempotency of handlers, security posture (managed identity, private endpoints), and region.

## Output
An Azure Event Grid setup: topics/domains with event subscriptions routing filtered events to handlers, the
chosen schema, retry + dead-letter-to-Blob, managed-identity publish/deliver + secured webhooks + private
networking + scoped RBAC — plus verification that an event is delivered and a failed event dead-letters.

## Notes
- Gotchas: delivery is **at-least-once** — handlers must be **idempotent**; **ordering is not guaranteed**
  (use Service Bus sessions for order); failing handlers cause **retry storms** + dead-letter growth — set the
  **dead-letter Blob**; **webhook** handlers need the **validation handshake**; don't confuse discrete-event
  routing (Event Grid) with high-throughput streaming (Event Hubs). **Cloud-agnostic event-driven architecture
  design is the architecture team's job** — defer to engineering/integration architects. 2nd consumer: the
  Azure role team (azure-cloud-architect / azure-iac-engineer / azure-security-reviewer). Cross-cloud peers:
  AWS EventBridge, GCP Eventarc.
- IaC/CLI: Terraform `azurerm_eventgrid_topic` / `azurerm_eventgrid_system_topic` /
  `azurerm_eventgrid_domain` (+ `azurerm_eventgrid_event_subscription`); Bicep/ARM
  `Microsoft.EventGrid/topics`. CLI `az eventgrid topic create` / `az eventgrid event-subscription create`.
