---
name: azure-digital-twins
description: Use when designing, provisioning, securing, or operating Azure Digital Twins — building a live, queryable graph of an environment (buildings, factories, fleets) from models (Azure Digital Twins). Covers DTDL models (interfaces, properties, telemetry, relationships, components), the twin graph (digital twin instances + relationships), the Azure Digital Twins query language, ingesting telemetry via event routes from IoT Hub/Event Grid (often through Azure Functions), event routes/endpoints to push twin change events downstream, ADT Explorer for authoring/visualizing, and Entra/RBAC plus private endpoints. Loads the knowledge: define DTDL models, build the twin graph, wire ingestion and event routes, secure access, and verify twins update and queries return live state. Consumed by the azure-digital-twins specialist and by the Azure role team when standing up the managed service (Azure Digital Twins).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-digital-twins, iot, dtdl, twin-graph]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Digital Twins

A managed service for building a **live, queryable digital model of a physical environment** — a graph of
**twins** (instances of **DTDL models**) connected by **relationships**, kept current by telemetry and emitting
change events. This skill owns the **ADT instance layer**: models, the twin graph, queries, and event routes.

## Core concepts and components
- **DTDL models** — JSON-LD interfaces (DTDL v2/v3) defining a twin's **properties**, **telemetry**,
  **relationships**, **components**, and commands; models are uploaded to the instance and form the schema for
  twins. Models can extend/compose others.
- **Twin graph** — **digital twin** instances (each conforming to a model) connected by typed **relationships**
  (e.g. `building contains floor contains room`), forming a queryable graph that mirrors reality.
- **Query language** — the Azure Digital Twins query language (SQL-like) traverses relationships and filters on
  properties to answer questions across the graph.
- **Ingestion / event routes (in)** — telemetry from devices arrives (typically **IoT Hub → Event Grid/Event
  Hubs → an Azure Function**) and the function updates twin properties via the ADT API. ADT does not connect to
  IoT Hub directly; you wire the glue.
- **Event routes / endpoints (out)** — ADT emits **twin lifecycle, property change, and telemetry** events to
  **Event Grid / Event Hubs / Service Bus** endpoints, filtered by route; downstream consumers (functions,
  analytics, time-series stores) react.
- **ADT Explorer** — sample tool to author models, build/visualize the graph, and run queries.

## Configuration and sizing
- Provision the **instance** (regional), enable a **system-assigned managed identity**, upload **DTDL models**,
  create **twins + relationships** (often programmatically from a source system), and define **event routes** to
  downstream endpoints. Capacity scales on managed query/operation units — no node provisioning.

## Security and IAM
- **Control + data plane** via **Entra ID + Azure RBAC** (Azure Digital Twins Data Owner/Reader) — there are no
  keys; all API access is Entra-authenticated. The instance's **managed identity** authorizes egress to event
  endpoints. Restrict with **private endpoints** and disable public network access; scope data-plane roles
  tightly.

## Cost levers
- Billed by **operations** (query units, API messages, twin/relationship operations) and routed **messages**.
  Levers: design **efficient models/queries** (deep relationship traversals cost more), update twins only on
  meaningful change (debounce telemetry in the ingestion function), and filter **event routes** so you only
  emit what consumers need.

## Scaling and limits
- Scales to large graphs but has caps on **twins per instance**, **model count**, query **page size**/units,
  and route/endpoint counts. Very deep/complex queries can hit unit limits — model for the queries you run.
  Telemetry is not stored by ADT; persist history downstream (e.g. Azure Data Explorer/Time Series).

## Operating procedure
1. **Provision** — create the instance (`azurerm_digital_twins_instance` / Bicep
   `Microsoft.DigitalTwins/digitalTwinsInstances` / `az dt create`) with a **managed identity**.
2. **Configure** — upload **DTDL models**, create **twins + relationships**, wire **ingestion** (IoT Hub →
   Event Grid/Hubs → Function → ADT update), and define **event routes** to downstream endpoints.
3. **Secure** — assign **data-plane RBAC** (no keys), grant the **managed identity** access to event endpoints,
   and restrict with **private endpoints**.
4. **Verify** — apply [[verify-by-running]]: confirm the instance provisioned (`az dt show`), push a test
   telemetry event through ingestion and confirm the twin's property **updated** (`az dt twin show`), run an
   ADT **query** that traverses a relationship to confirm live graph state, and confirm an **event route**
   delivers a change event downstream. Capture state and result.

## Inputs
The physical domain to model (entities + relationships → DTDL), telemetry sources and ingestion path (IoT
Hub/Event Grid/Function), queries the solution must answer, downstream consumers/event routes, history/
persistence needs, security posture (RBAC, private endpoints), and region/subscription.

## Output
An Azure Digital Twins setup: uploaded DTDL models, a populated twin graph with relationships, ingestion glue
keeping twins current, event routes to downstream endpoints, data-plane RBAC and private endpoints — plus
verification that twins update from telemetry and queries return live state.

## Notes
- Gotchas: ADT has **no built-in IoT Hub connector** — you build the ingestion Function glue; **all access is
  Entra RBAC** (no keys) so missing data-plane role assignments are the top failure; ADT **does not store
  telemetry history** — route it out for time-series; deep relationship **queries** consume more units; DTDL
  model edits are versioned and existing twins must be migrated. 2nd consumer: the Azure role team
  (azure-iot-engineer / azure-cloud-architect / azure-iac-engineer). Often fed by sibling azure-iot-hub.
  Cross-cloud peer: AWS IoT TwinMaker.
- IaC/CLI: Terraform `azurerm_digital_twins_instance`, `azurerm_digital_twins_endpoint_*`,
  `azurerm_digital_twins_time_series_database_connection`; Bicep/ARM `Microsoft.DigitalTwins/digitalTwinsInstances`
  (+ `/models`, `/endpoints`). CLI `az dt create` / `az dt model create` / `az dt twin create` / `az dt route`.
