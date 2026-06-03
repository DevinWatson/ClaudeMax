---
name: azure-communication-services
description: Use when designing, provisioning, configuring, or operating Azure Communication Services (ACS) — Azure's multichannel communication platform exposing voice/video calling, chat, SMS, email, and PSTN telephony as APIs/SDKs over the same backbone as Teams (Azure Communication Services). Covers the Communication Services resource, identities and access tokens (scoped to chat/voip), phone-number provisioning + PSTN calling, SMS and Email Communication Services domains, Call Automation (server-driven IVR/recording/routing), Teams interoperability, and event handling via Event Grid. Loads the knowledge to provision the resource, mint scoped identities/tokens, wire a channel (call/chat/SMS/email), and verify a message or call succeeds. Consumed by the azure-communication-services specialist and by the Azure role team (azure-platform-engineer / azure-cloud-architect) when operating the managed service.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-communication-services, web-mobile, communications, telephony]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Communication Services

**Azure Communication Services (ACS)** exposes **voice/video calling, chat, SMS, email, and PSTN telephony** as
APIs/SDKs over the same global backbone that powers Microsoft Teams. This skill owns the **single-service ACS
layer**: the resource, identities/tokens, channel provisioning, Call Automation, Teams interop, and events.

## Core concepts and components
- **Communication Services resource** — the top-level resource; a separate **Email Communication Services** resource
  + verified **domain** (Azure-managed or custom) backs the Email channel and is linked to it.
- **Identities + access tokens** — ACS has its own **identity** primitive (not Entra users); your backend mints
  short-lived **access tokens** scoped to capabilities (**voip**, **chat**) for each client. Tokens are issued
  server-side and refreshed; never minted in the client.
- **Channels** — **Voice/Video calling** (WebRTC + SDKs), **Chat** (threads, participants, read receipts),
  **SMS** (send/receive via provisioned numbers), **Email** (via the Email resource + domain), and **PSTN calling**
  to/from the public phone network.
- **Phone numbers + PSTN** — provision **toll-free/geographic** numbers (eligibility + regulatory docs may apply),
  used for SMS and inbound/outbound **PSTN** calls.
- **Call Automation** — server-driven call control (answer, route, play/recognize prompts/**IVR**, record, transfer)
  via the Call Automation SDK + callback webhooks.
- **Teams interoperability** — ACS users can join **Teams meetings** and ACS↔Teams calls/chat are supported.

## Configuration and sizing
- Provision the **Communication Services** resource (and **Email** resource + domain for email), provision **phone
  numbers** for SMS/PSTN, stand up a **token service** in your backend to mint scoped identities/tokens, and wire
  client SDKs per channel. ACS is **consumption-priced** — no fixed sizing; cost tracks usage (minutes, messages,
  emails, number leases).

## Security and IAM
- Authenticate the management/data plane via **Entra ID** + **RBAC** and prefer **managed identity** over the
  connection-string access key for backend calls. Mint **scoped, short-lived** ACS access tokens server-side; never
  expose the connection string/key to clients. Subscribe to delivery/call events via **Event Grid**; store secrets
  in **Key Vault**.

## Cost levers
- Pay-per-use: **call minutes**, **SMS/email** sent, and **phone-number** monthly leases dominate. Levers: release
  unused **numbers**, prefer **email/SMS** over PSTN where it fits, cap **recording** retention, and short-token TTLs
  to limit abuse. No idle base cost beyond leased numbers/domains.

## Scaling and limits
- ACS scales as a managed multitenant service; practical limits are **per-channel rate limits** (SMS/email
  throughput, calling concurrency), **regulatory** constraints on number acquisition by country, and **token**
  issuance throughput. Email sending is throttled until domain reputation/volume is established.

## Operating procedure
1. **Provision** — create the **Communication Services** resource via Terraform **azurerm**
   (`azurerm_communication_service`) or `az communication create`; for email add an **Email Communication Services**
   resource + **domain** (`azurerm_email_communication_service` / `..._domain`) and link it.
2. **Configure** — provision **phone numbers** (portal/REST where CLI/azurerm coverage is thin), stand up a backend
   **token service** to mint scoped (**voip**/**chat**) identities/tokens, wire the per-channel SDKs, and set up
   **Call Automation** callbacks + **Event Grid** subscriptions if used.
3. **Secure** — Entra **RBAC** + **managed identity** for backend access, server-side **short-lived** tokens, no
   connection string in clients, **Key Vault** for secrets, Event Grid for delivery/call events.
4. **Verify** — apply [[verify-by-running]]: mint a token, then exercise the wired channel — **send an SMS/email**
   and confirm a **delivery report**, or place a **chat/PSTN/video** call and confirm connect — capturing the
   message/call IDs and delivery status.

## Inputs
The **channels** in scope (call/video/chat/SMS/email/PSTN), required **phone numbers** + regulatory docs, the
**email domain**, the backend **token service** design, **Call Automation**/Teams-interop needs, and **Event Grid**
event wiring.

## Output
An ACS setup: a provisioned resource (plus Email resource + verified domain), provisioned numbers, a server-side
scoped-token service, wired channel SDKs and Call Automation/Event Grid, managed-identity backend auth — plus
verification that a message sends with a delivery report or a call connects.

## Notes
- Gotchas: minting **access tokens in the client** (or shipping the connection string) is a critical leak — tokens
  are server-side + short-lived; **email** needs a verified **domain** and is throttled until reputation builds;
  **phone-number** acquisition has per-country **regulatory** requirements and lead time; **number/domain
  provisioning** is often **portal/REST-only** (azurerm/`az` coverage is partial); ACS identities are **not** Entra
  users. 2nd consumer: the Azure role team (azure-platform-engineer / azure-cloud-architect). Cross-cloud peers:
  AWS Connect / Pinpoint / Chime.
- IaC/CLI: Terraform **azurerm** (`azurerm_communication_service`, `azurerm_email_communication_service`,
  `azurerm_email_communication_service_domain`); CLI `az communication ...`; Bicep
  `Microsoft.Communication/communicationServices`. Phone-number and some channel operations are REST/SDK/portal-only.
