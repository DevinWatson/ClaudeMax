---
name: azure-notification-hubs
description: Use when designing, provisioning, configuring, or operating Azure Notification Hubs — Azure's massively-scalable cross-platform push notification engine that fans a single send out to APNs (iOS), FCM v1 (Android), WNS (Windows), and Baidu/Amazon ADM (Azure Notification Hubs). Covers namespaces and hubs, platform credentials (APNs token/cert, FCM v1 service account, WNS), device registrations vs installations, tag and tag-expression targeting, native vs template notifications, scheduled and direct/batch sends, and the data/standard pricing tiers. Loads the knowledge to provision a namespace + hub, wire each PNS credential, design a registration/tag model, and verify a push reaches a device. Consumed by the azure-notification-hubs specialist and by the Azure role team (azure-platform-engineer / azure-cloud-architect) when operating the managed service.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-notification-hubs, web-mobile, push-notifications, messaging]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Notification Hubs

**Azure Notification Hubs** is a managed **cross-platform push** engine: one send is fanned out to every
**Platform Notification System (PNS)** — **APNs** (iOS), **FCM v1** (Android), **WNS** (Windows), and
**Baidu/Amazon ADM** — at scale. This skill owns the **single-service Notification Hubs layer**: namespaces,
hubs, PNS credentials, registrations, tag targeting, templates, and scheduled sends.

## Core concepts and components
- **Namespace + hub** — a **namespace** is the regional container/billing boundary; it holds one or more **hubs**.
  Each hub is the push target your app sends to and carries its own PNS credentials and registrations.
- **PNS credentials** — per-hub credentials: **APNs** (token-based `.p8` key recommended over `.p12` certs, with
  key/team/bundle IDs), **FCM v1** (Google service-account JSON; legacy FCM is retired), **WNS** (package SID +
  secret), and Baidu/ADM. Sandbox vs production APNs is a per-hub toggle.
- **Registrations vs installations** — a **registration** binds a PNS handle (device token) + tags; an
  **installation** is the newer, richer model (installationId, tags, templates, per-device push variables) and is
  preferred for idempotent device management.
- **Tags and tag expressions** — target subsets by **tag** (e.g. `user:123`, `topic:sports`) and boolean
  **tag expressions** (`(sports && !optout)`); the basis for pub/sub and per-user fan-out.
- **Native vs template notifications** — **native** sends a raw PNS payload (aps/FCM message/WNS XML); **templates**
  let the device register a platform-agnostic shape so one send renders correctly across all PNS + localizes.
- **Send modes** — **direct** (to a handle), **tag-targeted broadcast**, **scheduled** (future-dated, Standard
  tier), and **batch/import** for bulk registration management.

## Configuration and sizing
- Provision a **namespace**, create a **hub**, upload each **PNS credential**, then pick a device model
  (installations recommended) and a tag scheme. **Tiers**: **Free** (limited pushes/devices, no scheduled/telemetry),
  **Basic**, and **Standard** (scheduled sends, rich telemetry, bulk import, higher device caps). Size by active
  devices and monthly push volume; pushes above the included quota are billed per million.

## Security and IAM
- Authenticate management plane via **Entra ID** with **RBAC** (Contributor/Reader on the namespace); use
  **managed identities** for app/CI access. Data-plane sends use **SAS** access policies (`Listen` for clients,
  `Full/Send` for backends) — issue narrow **Listen-only** SAS to clients and keep **Send** keys server-side. Store
  PNS secrets (APNs `.p8`, FCM service account) in **Key Vault**, never in source.

## Cost levers
- Choose the **lowest tier** that has the features you need (Free/Basic for dev, Standard only for scheduled
  sends/telemetry/bulk). Consolidate apps into fewer namespaces, prune **stale registrations/installations** (expired
  handles still count), and prefer **tag-targeted** sends over per-device direct sends at scale.

## Scaling and limits
- Per-tier caps on **active devices**, **tags per registration**, **registrations per hub**, and **send throughput**;
  tag-expression complexity and payload size are PNS-bounded (APNs/FCM/WNS each cap payload bytes). Very high fan-out
  uses tag broadcast; per-device direct send does not scale to broadcast.

## Operating procedure
1. **Provision** — create the **namespace** + **hub** via Terraform **azurerm** (`azurerm_notification_hub_namespace`,
   `azurerm_notification_hub`) or `az notification-hub namespace create` / `az notification-hub create`; pick the tier.
2. **Configure** — upload **PNS credentials** (`azurerm_notification_hub` APNs/GCM blocks or
   `az notification-hub credential apns/gcm update`), choose APNs sandbox vs production, and decide
   **installations vs registrations** + the **tag** scheme.
3. **Secure** — Entra **RBAC** + managed identity on the management plane; issue **Listen-only SAS** to clients,
   keep **Send** SAS server-side, and store PNS secrets in **Key Vault**.
4. **Verify** — apply [[verify-by-running]]: register a test device/installation with a tag, send a **native** and a
   **template** push (direct + tag-targeted) via `az notification-hub` / the REST send API or the Test Send in the
   portal, confirm a **200/Enqueued** and that the device receives it, and capture the outcome + any PNS feedback.

## Inputs
The target **platforms** (iOS/Android/Windows), each app's **PNS credentials**, the **device model**
(installations vs registrations), the **tag** scheme, the **notification shapes** (native/template), the send
patterns (direct/tag/scheduled), and the **tier**.

## Output
A Notification Hubs setup: a namespace + hub on the right tier, wired PNS credentials, a registration/tag model,
templates where cross-platform shapes are needed, Listen-only client SAS with server-side Send, and verification
that a tagged push reaches a real device.

## Notes
- Gotchas: **APNs sandbox vs production** mismatch silently drops pushes; **legacy FCM is retired** — use **FCM v1**
  with a service-account JSON; **expired/invalid handles** accumulate (read PNS feedback and prune); a client given a
  **Send** SAS can spam all devices — issue **Listen-only**; payloads exceeding PNS byte caps are rejected; scheduled
  sends/telemetry require **Standard**. 2nd consumer: the Azure role team (azure-platform-engineer /
  azure-cloud-architect). Cross-cloud peers: AWS SNS mobile push, GCP Firebase Cloud Messaging.
- IaC/CLI: Terraform **azurerm** (`azurerm_notification_hub_namespace`, `azurerm_notification_hub`,
  `azurerm_notification_hub_authorization_rule`); CLI `az notification-hub ...`; Bicep
  `Microsoft.NotificationHubs/namespaces/notificationHubs`. Some credential/template operations are REST/SDK-only —
  drop to the REST API or an SDK where azurerm/`az` lacks coverage.
