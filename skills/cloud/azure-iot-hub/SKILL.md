---
name: azure-iot-hub
description: Use when designing, provisioning, securing, or operating Azure IoT Hub — the managed bidirectional messaging hub between IoT devices and the cloud (Azure IoT Hub). Covers per-device identity and the device registry, device/module twins (desired vs reported properties + tags), cloud-to-device messages and direct methods, device-to-cloud telemetry, message routing to endpoints (Event Hubs/Service Bus/Storage), the Device Provisioning Service (DPS) for zero-touch enrollment, SKU/unit sizing and throttling, and Entra/RBAC plus per-device SAS/X.509/TPM auth. Loads the knowledge: provision the hub and DPS, model twins, wire routing, secure device identities, and verify telemetry/commands end-to-end. Consumed by the azure-iot-hub specialist and by the Azure role team when standing up the managed service (Azure IoT Hub).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-iot-hub, iot, device-twins, dps]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure IoT Hub

The **managed, bidirectional messaging gateway** between IoT devices and Azure — secure per-device
connectivity at scale, device management via twins, and routing of telemetry into the broader platform.
This skill owns the **IoT Hub managed-service layer**: device identities, twins, messaging, routing, and DPS.

## Core concepts and components
- **Device identity & registry** — every device has a unique identity in the hub's **identity registry** with
  per-device credentials (**SAS token**, **X.509** thumbprint/CA, or **TPM** attestation). Never share keys
  across devices.
- **Device & module twins** — JSON documents holding **tags** (cloud-only), **desired properties** (cloud sets
  config) and **reported properties** (device reports state). The backbone of device management at scale.
- **Direct methods** — synchronous request/response commands invoked on a connected device (e.g. `reboot`),
  with timeout and payload.
- **Cloud-to-device (C2D) messages** — queued, durable one-way messages to a device; **device-to-cloud (D2C)**
  telemetry flows in via the device-facing endpoint.
- **Message routing** — rules (query on message/body/twin) fan telemetry to **custom endpoints**: Event Hubs,
  Service Bus queues/topics, Blob Storage, or the built-in Event Hubs-compatible endpoint. Fallback route
  catches unmatched messages.
- **Device Provisioning Service (DPS)** — zero-touch, just-in-time enrollment that maps devices (individual or
  group enrollments) to one or more hubs with allocation policies; decouples devices from a specific hub.

## Configuration and sizing
- Pick a **tier**: **Free** (eval), **Basic (B1–B3)** (telemetry + per-device identity, no twins/methods/C2D),
  or **Standard (S1–S3)** (full features). Capacity is **units × tier**, each unit adding a daily message
  quota and sustained throughput. Scale units up before hitting throttles; consider multiple hubs + DPS for
  very high device counts.

## Security and IAM
- **Control plane** via **Entra ID + Azure RBAC** (IoT Hub Data Contributor/Reader). **Device auth** is
  per-device **SAS**, **X.509 CA-signed/self-signed**, or **TPM** via DPS — prefer X.509 for production.
  Use **managed identity** for the hub to write to routing endpoints (no connection-string secrets). Disable
  shared-access policies where possible, enforce **TLS 1.2**, and restrict public network access with private
  endpoints.

## Cost levers
- You pay per **unit/day** by tier (each unit bundles a message quota); overage is billed per message block.
  Levers: right-size **tier/unit**, **batch** telemetry and trim message size (messages metered in 4 KB
  blocks), use **Basic** where twins/methods aren't needed, and route only what's needed downstream.

## Scaling and limits
- Per-unit daily **message quotas** and per-second throttles (device connects, twin reads/updates, direct
  method calls) apply; exceeding them throttles. Twin document size, direct-method payload, and D2C message
  size have hard caps. For millions of devices use **DPS** with multiple hubs and an allocation policy.

## Operating procedure
1. **Provision** — create the hub (`azurerm_iothub` / Bicep `Microsoft.Devices/IotHubs` / `az iot hub create`)
   at the right tier/units, and a **DPS** instance (`azurerm_iothub_dps`) linked to the hub for enrollment.
2. **Configure** — register device identities or DPS **enrollments**, define **routing** rules and custom
   endpoints, and set **twin** desired properties / tags for device management.
3. **Secure** — use **X.509**/DPS attestation per device, the hub's **managed identity** for routing endpoints,
   scope **RBAC**, enforce TLS 1.2, and lock down public network access.
4. **Verify** — apply [[verify-by-running]]: confirm the hub/DPS provisioned (`az iot hub show`), send test
   telemetry (`az iot device simulate` / `send-d2c-message`), read it from the routing endpoint, invoke a
   **direct method** and read a **twin** to confirm command + management paths. Capture state and result.

## Inputs
Device population and growth, auth model (SAS/X.509/TPM), feature needs (twins/methods/C2D → tier), routing
targets (Event Hubs/Service Bus/Storage), provisioning model (manual vs DPS enrollments), throughput/quota
estimates, security posture (private endpoints, managed identity), and region/subscription.

## Output
An Azure IoT Hub setup: a right-sized hub (+ DPS), per-device identities/enrollments, device twins, message
routing to downstream endpoints, scoped RBAC and per-device auth — plus verification that telemetry flows,
routing delivers, and direct methods/twins work.

## Notes
- Gotchas: **Basic tier lacks twins, direct methods, and C2D** — choose Standard if you need device
  management; messages are metered in **4 KB blocks** so chatty small messages waste quota; never reuse device
  keys; **DPS** is what makes fleet provisioning and hub migration sane — design for it early; routing fallback
  route is off unless configured (unmatched messages are dropped). 2nd consumer: the Azure role team
  (azure-iot-engineer / azure-cloud-architect / azure-iac-engineer). Cross-cloud peer: AWS IoT Core.
- IaC/CLI: Terraform `azurerm_iothub`, `azurerm_iothub_dps`, `azurerm_iothub_dps_certificate`,
  `azurerm_iothub_route`/`azurerm_iothub_endpoint_*`; Bicep/ARM `Microsoft.Devices/IotHubs` +
  `Microsoft.Devices/provisioningServices`. CLI `az iot hub create` / `az iot dps create` / `az iot device`.
