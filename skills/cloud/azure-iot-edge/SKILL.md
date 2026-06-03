---
name: azure-iot-edge
description: Use when designing, provisioning, securing, or operating Azure IoT Edge — running cloud workloads as containerized modules on edge devices managed from IoT Hub (Azure IoT Edge). Covers the IoT Edge runtime (edgeAgent + edgeHub system modules), custom and Azure-service modules, deployment manifests and module twins, routes between modules and the cloud, layered/at-scale deployments targeted by device tags, offline operation with local store-and-forward, gateway/transparent-gateway patterns, and device provisioning via DPS with X.509. Loads the knowledge: prepare devices, author deployment manifests, set routes, secure module identities, and verify modules run and route messages offline and online. Consumed by the azure-iot-edge specialist and by the Azure role team when standing up the managed service (Azure IoT Edge).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-iot-edge, iot, edge-runtime, deployment-manifest]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure IoT Edge

Run **cloud logic at the edge** — containerized **modules** deployed to and managed on edge devices from
**IoT Hub**, with local routing, offline buffering, and gateway capabilities. This skill owns the **IoT Edge
device-and-deployment layer**: runtime, modules, manifests, routes, and at-scale deployments.

## Core concepts and components
- **IoT Edge runtime** — runs on the device; two **system modules**: **edgeAgent** (pulls and manages module
  lifecycle from the deployment manifest) and **edgeHub** (local message broker proxying to IoT Hub, with
  store-and-forward). Plus a container engine (Moby/Docker).
- **Modules** — containers: **custom modules** (your code), **Azure service modules** (Stream Analytics,
  Functions, ML, SQL Edge), and partner modules. Each module gets a **module identity/twin** in IoT Hub.
- **Deployment manifest** — JSON declaring which modules run, their images/settings, **createOptions**,
  desired twin properties, and **routes**. Applied to a single device or, via **at-scale/layered deployments**,
  to all devices matching a **target condition** (device-twin tag query) with priority layering.
- **Routes** — declarative rules moving messages between modules and **$upstream** (to IoT Hub) using
  source/condition syntax; this is how modules chain locally.
- **Offline operation** — edgeHub persists messages and twins when disconnected and syncs on reconnect; the
  device can keep operating with cached identities (time-to-live configurable).
- **Gateway patterns** — **transparent** (leaf devices talk to IoT Hub through edgeHub) and **translation**
  (protocol/identity translation) gateways; leaf devices provision through the edge.

## Configuration and sizing
- Provision the device with the **runtime** and a **DPS** enrollment (X.509 preferred). Size the **host**
  (CPU/RAM/disk/arch — arm32/arm64/amd64) for the module set; pin **module images** by tag/digest; set
  edgeHub storage and message TTL for the expected offline window.

## Security and IAM
- Device identity via **DPS + X.509** (or TPM); the runtime uses the **IoT Edge security daemon/identity
  service** to issue module identities. Pull images from **ACR** using the device's **managed identity** or
  scoped credentials. Scope **RBAC** on IoT Hub for deployment management, sign/verify images, and isolate
  module networks; enforce TLS for edgeHub.

## Cost levers
- IoT Edge runtime is **free**; you pay for the underlying **IoT Hub** (each edge device + leaf devices consume
  hub quota), container registry, and any **per-module Azure service** licensing. Levers: right-size the hub
  tier/units, do local **filtering/aggregation** at the edge to cut upstream messages, and consolidate modules.

## Scaling and limits
- Manage fleets with **at-scale deployments** keyed on twin tags + **priority layering**; limits include
  modules per deployment, deployment count per hub, edgeHub local storage, and host resource constraints.
  Layered deployments let you compose a base + targeted overlays without one giant manifest.

## Operating procedure
1. **Provision** — register the edge device (DPS enrollment, X.509), install the **runtime**, and connect it to
   IoT Hub.
2. **Configure** — author a **deployment manifest** (modules, images, createOptions, twin desired props,
   **routes**), apply it to the device or as an **at-scale deployment** by target condition; configure edgeHub
   storage/TTL for offline.
3. **Secure** — use **DPS + X.509** per device, pull images via **managed identity/ACR**, scope IoT Hub RBAC,
   and isolate module networking.
4. **Verify** — apply [[verify-by-running]]: confirm modules report **running** (`az iot hub module-twin show`
   / on-device `iotedge list`), confirm **routes** deliver (send a message through the module chain to
   `$upstream` and read it in the hub), and validate **offline** behavior by disconnecting and confirming
   store-and-forward resync. Capture state and result.

## Inputs
Edge device fleet and host specs (arch/resources), module set (custom + Azure service modules) and images,
routing topology, offline window requirements, gateway needs (transparent/translation + leaf devices),
provisioning model (DPS/X.509), deployment strategy (single vs at-scale/layered), and region/subscription.

## Output
An Azure IoT Edge setup: provisioned edge devices running the runtime, a deployment manifest (or at-scale
deployment) of modules with routes, edgeHub offline configuration, secured module identities and image pulls —
plus verification that modules run, routes deliver upstream, and offline store-and-forward works.

## Notes
- Gotchas: a bad **createOptions**/image tag silently leaves a module in **backoff** — check edgeAgent logs;
  **routes** are easy to misorder so messages never reach `$upstream`; **at-scale deployment priorities** layer
  and the highest-priority matching deployment wins per module; offline **message TTL** and storage limits drop
  data if the outage exceeds them; clock skew breaks X.509. 2nd consumer: the Azure role team
  (azure-iot-engineer / azure-cloud-architect / azure-iac-engineer). Managed from IoT Hub (sibling
  azure-iot-hub). Cross-cloud peer: AWS IoT Greengrass.
- IaC/CLI: Terraform `azurerm_iothub` + device/deployment config applied via the IoT extension/REST (edge
  deployments are not first-class azurerm resources — manage manifests via `az iot edge`); Bicep/ARM
  `Microsoft.Devices/IotHubs`. CLI `az iot edge deployment create` / `az iot hub module-twin` / on-device
  `iotedge`.
