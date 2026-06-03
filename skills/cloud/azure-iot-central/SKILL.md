---
name: azure-iot-central
description: Use when designing, provisioning, securing, or operating Azure IoT Central — the managed application platform (aPaaS/SaaS) for building IoT solutions without managing the underlying hub/DPS yourself (Azure IoT Central). Covers IoT Central applications and pricing plans, device templates (capability models from DTDL), device groups, rules and actions, dashboards/views and analytics, jobs for bulk device operations, data export to downstream targets, and access via Entra ID and API tokens. Loads the knowledge: create the application, model device templates, provision devices, configure rules/dashboards/exports, secure access, and verify devices report and rules fire. Consumed by the azure-iot-central specialist and by the Azure role team when standing up the managed service (Azure IoT Central).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-iot-central, iot, device-templates, saas]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure IoT Central

A **managed IoT application platform (aPaaS/SaaS)** — Microsoft runs the underlying IoT Hub and DPS for you,
and you build the solution declaratively: device templates, rules, dashboards, jobs, and data export. This
skill owns the **IoT Central application layer**: templates, devices, rules, views, and exports.

## Core concepts and components
- **Application** — the top-level resource (created from a template or blank) on a **pricing plan** (Standard
  tiers by device count + messages/month). Each app has a managed hub/DPS underneath you don't operate.
- **Device templates** — a **capability model** (authored in **DTDL**) defining a device's telemetry,
  properties, and commands. Devices are associated with a template; templates can be **published** and
  versioned.
- **Device groups** — saved queries grouping devices (by template/property) for targeting rules, jobs,
  analytics, and access.
- **Rules & actions** — threshold/condition rules on telemetry that trigger **actions** (email, webhook,
  Power Automate, Azure Monitor groups, Service Bus/Event Hubs export).
- **Dashboards & views** — app-level dashboards and per-template **views** (forms, charts, maps, commands) for
  operators; **analytics** for ad-hoc exploration.
- **Jobs** — bulk operations across a device group (set properties, run commands, update cloud props).
- **Data export** — continuous export of telemetry/property/lifecycle data to Event Hubs, Service Bus, Blob
  Storage, Azure Data Explorer, or webhooks.

## Configuration and sizing
- Choose a **pricing plan** (Standard 0/1/2 — differ by included messages/device/month and price/device);
  capacity scales with **device count × messages**. Model **device templates** to match firmware, define
  **rules** and **dashboards**, and configure **data export** for downstream analytics.

## Security and IAM
- **Access** via **Entra ID** users/service principals mapped to built-in or custom **roles** (Administrator,
  Operator, Builder) optionally scoped by **organization**; programmatic access via **API tokens**. Devices
  authenticate through the managed **DPS** with **SAS** or **X.509** group enrollment keys. Use organizations
  for multi-tenant isolation; rotate API tokens.

## Cost levers
- Billed **per device per month** by plan plus overage on **messages** beyond the included quota. Levers: pick
  the plan whose included messages match telemetry volume, **trim telemetry frequency/size**, retire unused
  devices, and export only needed data (export volume can drive downstream cost).

## Scaling and limits
- Scales to large device counts on the managed backend, but has caps on **device templates**, **rules per
  app**, **dashboards**, **API rate limits**, and continuous export throughput. For very large/complex
  solutions where you need hub-level control, a custom **IoT Hub** solution may fit better.

## Operating procedure
1. **Provision** — create the application (`azurerm_iotcentral_application` / `az iot central app create`) on
   the chosen plan and region.
2. **Configure** — author and **publish device templates** (DTDL capability models), provision/onboard devices
   via DPS group enrollment, build **dashboards/views**, define **rules + actions**, and set up **data export**.
3. **Secure** — assign **Entra roles** (least privilege, scoped by organization), create scoped **API tokens**,
   and use **X.509** group enrollment for device attestation.
4. **Verify** — apply [[verify-by-running]]: confirm the app provisioned (`az iot central app show`), connect a
   test device against a published template, confirm telemetry appears in a view, trigger a **rule** and
   confirm its action fires, and confirm **data export** lands in the target. Capture state and result.

## Inputs
Solution scope and device population, device capability models (telemetry/properties/commands → templates),
required rules/alerts and actions, operator dashboards/views, data export targets, access model (Entra roles,
organizations, API tokens), pricing plan, and region/subscription.

## Output
An Azure IoT Central application: published device templates, onboarded devices, dashboards/views, rules with
actions, data export, and scoped Entra/API access — plus verification that devices report, rules fire, and
export delivers.

## Notes
- Gotchas: IoT Central is **opinionated and managed** — you trade hub-level control for speed (drop to custom
  IoT Hub when you need fine-grained routing/scale control); **device templates must be published** before
  devices use them and template/version migration needs care; **data export** volume and frequency drive both
  IoT Central overage and downstream cost; API rate limits bite bulk automation. 2nd consumer: the Azure role
  team (azure-iot-engineer / azure-cloud-architect / azure-iac-engineer). Built on IoT Hub/DPS; sibling
  azure-iot-hub owns the raw hub. Cross-cloud peer: AWS IoT Core (app-layer; no direct SaaS equivalent).
- IaC/CLI: Terraform `azurerm_iotcentral_application` (+ template/device config via the Central REST API/CLI);
  Bicep/ARM `Microsoft.IoTCentral/IoTApps`. CLI `az iot central app create` / `az iot central device` /
  `az iot central device-template`.
