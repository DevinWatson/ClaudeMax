---
name: aws-iot-greengrass
description: Use when designing, provisioning, securing, or operating AWS IoT Greengrass V2 — the edge runtime (Greengrass nucleus) on gateway/edge devices, components (public AWS, custom, and Lambda/Docker container components), deployments to core devices and thing groups, local pub/sub and the MQTT bridge to IoT Core, stream manager, local ML inference, and offline/local operation at the edge (AWS IoT Greengrass). Loads the Greengrass knowledge: how to install the nucleus on an edge device, author and deploy components, run compute/ML locally with cloud sync, and verify components run on the core device. Consumed by the IoT Greengrass specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they build edge compute.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, iot-greengrass, edge-compute, components, edge-ml, nucleus]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS IoT Greengrass (V2)

An **edge runtime** that brings AWS compute, messaging, and ML *to the device*. The Greengrass
**nucleus** runs on a gateway/edge "core device" and runs **components** (your code, AWS-provided
components, Lambda or container workloads) locally — processing data, doing local ML inference, and
buffering messages even when offline, then syncing to the cloud via **IoT Core**. Greengrass is the
edge/on-device side; IoT Core is the cloud connectivity side it talks back to.

## Core concepts and components
- **Nucleus** — the core runtime installed on the edge device; manages component lifecycle,
  deployments, and connectivity to IoT Core.
- **Core device** — the edge machine running the nucleus (registered as an IoT thing).
- **Components** — versioned units of software: **public** AWS components (e.g. log manager, MQTT
  bridge, stream manager, ML inference), **custom** components (recipes + artifacts), and
  **Lambda/Docker container** components for existing workloads.
- **Deployments** — target a single core device or a **thing group**; declare the component set +
  versions + configuration, rolled out to the fleet.
- **Local messaging** — local pub/sub between components and an **MQTT bridge** to relay to/from
  IoT Core; **stream manager** buffers/forwards data streams.
- **Local ML inference** and offline operation — run models and logic at the edge with intermittent
  connectivity.

## Configuration and sizing
- Match the edge device OS/arch to component requirements; size CPU/RAM for the local compute + ML
  workload. Use thing-group deployments to manage fleets uniformly.
- Use the MQTT bridge + stream manager to decouple local processing from cloud connectivity so
  devices keep working offline.

## Security and IAM
- The core device uses an IoT thing cert + an **IAM role alias / token exchange role** for AWS
  access (scope it least-privilege). Components run with the device user's permissions — restrict
  filesystem/network access in recipes.
- Mutual TLS to IoT Core, signed component artifacts where possible, and least-privilege local
  resource access; rotate the device cert and audit deployments.

## Cost levers
- Greengrass itself bills per active core device/month; the bigger levers are the edge hardware
  and reducing cloud round-trips (local processing cuts IoT Core message + data-transfer cost).

## Scaling and limits
- Scales to large fleets via thing-group deployments; per-device capacity is bounded by the edge
  hardware. Component artifact sizes, deployment rollout config (rate/failure handling), and local
  storage are the practical limits.

## Operating procedure
1. **Provision** — install the Greengrass nucleus on the edge device (registers a core device,
   thing, cert, and token-exchange role) via the installer; or define with Terraform
   `aws_greengrassv2_component_version` / deployment resources where available.
2. **Configure** — author custom components (recipe + artifacts) or select public/Lambda/container
   components, then create a **deployment** to the core device or thing group with the component
   set + configuration (MQTT bridge, stream manager, local ML, etc.).
3. **Secure** — least-privilege token-exchange role, mutual TLS to IoT Core, constrained component
   permissions, signed artifacts, cert rotation.
4. **Verify** — apply [[verify-by-running]]: `aws greengrassv2 get-core-device` shows the device
   HEALTHY, `aws greengrassv2 list-installed-components` (or on-device `greengrass-cli component list`)
   shows components RUNNING, and confirm the deployment status COMPLETED plus local pub/sub or the
   MQTT bridge delivering a message to IoT Core.

## Inputs
Edge device OS/arch + resources, the local compute/ML workload, components needed (public/custom/
Lambda/container), fleet size + grouping, connectivity/offline requirements, cloud targets via the
bridge, and security constraints.

## Output
Core device(s) with the nucleus installed, authored/selected components, a deployment to the
device or thing group, secured token-exchange role + TLS, and verification that the core device is
HEALTHY, components are RUNNING, and the deployment COMPLETED with messages reaching IoT Core.

## Notes
- Gotchas: Greengrass V2 differs significantly from V1 (component model, not the old group/Lambda
  model); the token-exchange role governs the device's AWS access — scope it tightly; components
  run with local user permissions (constrain them); deployments are declarative per
  device/thing-group; the MQTT bridge config controls cloud relay; Greengrass is the edge side and
  connects back to IoT Core (the cloud connectivity layer) for fleet messaging.
- IaC/CLI: Terraform `aws_greengrassv2_component_version`, `aws_greengrassv2_deployment` (coverage
  is partial; the nucleus install is via the installer). CLI `aws greengrassv2 create-component-version`,
  `create-deployment`, `get-core-device`, `list-installed-components`, `list-effective-deployments`;
  on-device `greengrass-cli component list/restart`. Pair with aws-iot-core for the cloud side.
