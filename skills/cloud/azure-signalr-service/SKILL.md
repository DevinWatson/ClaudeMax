---
name: azure-signalr-service
description: Use when designing, provisioning, configuring, or operating Azure SignalR Service — Azure's fully managed real-time messaging service that handles persistent WebSocket (and SSE/long-polling) connections so apps push to thousands of clients without running their own SignalR backplane (Azure SignalR Service). Covers the Default, Serverless, and Classic service modes, hubs and client/server connection routing, units and autoscale, upstream endpoints + event handlers for Serverless, managed-identity upstream auth, private endpoints, and integration with ASP.NET Core SignalR and Azure Functions SignalR bindings. Loads the knowledge to pick a mode, size units, wire hub routing/upstream, and verify clients connect and receive broadcasts. Consumed by the azure-signalr-service specialist and by the Azure role team (azure-platform-engineer / azure-cloud-architect) when operating the managed service.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-signalr-service, web-mobile, realtime, websocket]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure SignalR Service

**Azure SignalR Service** is a fully managed **real-time messaging** layer: it terminates the persistent
**WebSocket** (or SSE/long-polling) connections and acts as a **backplane** so your app broadcasts to many clients
without managing sticky sessions or scaling sockets yourself. This skill owns the **single-service SignalR layer**:
service modes, hub/connection routing, units, upstream, and security.

## Core concepts and components
- **Service modes** — **Default** (your ASP.NET Core SignalR server stays in the loop; SignalR Service offloads the
  client connections), **Serverless** (no persistent server connection — clients talk to the service, server logic
  runs in **Azure Functions** via SignalR bindings + **upstream**), and **Classic** (legacy auto-detect; avoid for
  new work).
- **Hubs and routing** — logical **hubs** group connections; the service routes messages between **client
  connections** and **server connections** (Default) or to **upstream endpoints** (Serverless). Negotiation hands
  clients a token + the service URL.
- **Units** — capacity is bought in **units** (each unit = a fixed cap on **concurrent connections** and
  **messages/day**); scale by adding units, with **autoscale** on the Premium tier.
- **Upstream + event handlers** — in Serverless, **upstream endpoints** forward client events (connect/disconnect/
  message) to your handler (Functions/webhook), authenticated by **managed identity** or key, matched by hub/event
  rules.
- **Tiers** — **Free** (dev, capped), **Standard** (per-unit, manual scale), **Premium** (autoscale, availability
  zones, private endpoints, geo-replication).

## Configuration and sizing
- Pick the **mode** (Default for a stateful SignalR server, Serverless for Functions/no-server), provision on the
  right **tier**, and size **units** by **peak concurrent connections** and **message volume** (add headroom — a
  maxed unit drops connections). Configure **hubs/upstream**, networking (public vs **private endpoint**), and the
  connection-string/identity the app uses to reach the service.

## Security and IAM
- Authenticate the management plane via **Entra ID** + **RBAC**; prefer **managed identity** for app→service and
  for **upstream** auth over connection-string keys. Use **AAD/azure** access keys rotation, restrict with
  **private endpoints** + network ACLs on Premium, and never embed the full connection string in clients — clients
  receive a short-lived **negotiate** token, not the key.

## Cost levers
- Bill is **per unit per tier**; right-size units to peak concurrency (don't over-provision), use **Free** for dev,
  **autoscale** (Premium) so you pay for peak only when needed, and prefer **Serverless** mode when traffic is bursty
  so you avoid an always-on SignalR server VM/app.

## Scaling and limits
- Each **unit** caps concurrent connections (e.g. ~1k) and daily messages; exceeding either rejects connections or
  throttles. Premium adds **autoscale**, **availability zones**, and **geo-replication**. Message size and outbound
  fan-out are bounded per unit; very large fan-out needs more units or geo-replication.

## Operating procedure
1. **Provision** — create the service via Terraform **azurerm** (`azurerm_signalr_service`) or
   `az signalr create`; choose **tier** + **mode** (`serviceMode`) and initial **units** (`capacity`).
2. **Configure** — set the **mode**, define **hubs/upstream** + event handler rules (Serverless), wire the app
   (Default: SignalR server + `AddAzureSignalR`; Serverless: Functions SignalR bindings), and configure networking.
3. **Secure** — Entra **RBAC** + **managed identity** for app and upstream auth, **private endpoint** + network ACLs
   (Premium), and ensure clients only ever get the **negotiate token** — never the connection-string key.
4. **Verify** — apply [[verify-by-running]]: bring up the app, connect a test client (WebSocket/SignalR client),
   confirm **negotiate** returns the service URL + token, broadcast a message to the hub and confirm the client
   **receives** it (and in Serverless, confirm **upstream** fired your handler), and capture the results.

## Inputs
The chosen **service mode**, the **tier**, the expected **peak concurrent connections** + message volume (to size
**units**), the **hubs/upstream** topology, the app integration (ASP.NET Core SignalR vs Functions bindings), and
the **networking** posture.

## Output
A SignalR Service setup: a provisioned service on the right tier/mode, units sized to peak concurrency, hub/upstream
routing wired, managed-identity auth (no client-side keys), optional private endpoint — plus verification that a
client connects, negotiates, and receives a broadcast (and upstream fires in Serverless).

## Notes
- Gotchas: choosing the wrong **mode** breaks routing (Default needs a server connection; Serverless needs upstream);
  a **maxed unit** silently rejects new connections — size to peak; shipping the **connection string to clients** is
  a key leak (clients get only the negotiate token); **Classic** mode is legacy — avoid; autoscale/private
  endpoints/zones are **Premium**-only; sticky-session assumptions don't apply (the service is the backplane).
  2nd consumer: the Azure role team (azure-platform-engineer / azure-cloud-architect). Cross-cloud peer: AWS API
  Gateway WebSocket APIs.
- IaC/CLI: Terraform **azurerm** (`azurerm_signalr_service`, `azurerm_signalr_service_network_acl`,
  `azurerm_signalr_shared_private_link_resource`); CLI `az signalr ...`; Bicep `Microsoft.SignalRService/signalR`.
  Some upstream/event-handler details may need the SDK/REST or portal where azurerm coverage lags.
