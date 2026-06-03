---
name: azure-container-apps
description: Use when designing, provisioning, securing, or operating Azure Container Apps — Azure's serverless container platform for microservices and event-driven apps built on Kubernetes + KEDA without exposing the cluster (Azure Container Apps). Covers the Container Apps environment (the shared boundary/VNet/Log Analytics), apps and containers, revisions and traffic splitting (blue/green, canary), ingress (external/internal, HTTP and TCP), KEDA-based autoscaling (HTTP, queue, custom) including scale-to-zero, Dapr sidecars for service invocation/pub-sub/state, jobs (manual/scheduled/event), managed identities, ACR pulls, secrets, and consumption vs dedicated plans. Loads the knowledge: define the environment and app, set scaling/ingress/revisions, provision, secure, and verify the app is healthy and reachable. Consumed by the azure-container-apps specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Container Apps).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-container-apps, containers, serverless, keda, dapr]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Container Apps (ACA)

Azure's **serverless container platform** for microservices and event-driven workloads. It runs on managed
Kubernetes + **KEDA** but hides the cluster — you deploy apps, not nodes — with built-in autoscaling
(including scale-to-zero), revisions, and optional **Dapr**.

## Core concepts and components
- **Environment** — the secure boundary that hosts a set of apps; defines the **VNet**, the **Log
  Analytics** workspace, and the Dapr/observability config. Apps in one environment share networking.
- **App + containers** — a Container App runs one or more containers (a main + sidecars) with CPU/memory
  requests; the app is the deployable/scalable unit.
- **Revisions** — each config/image change can create an immutable **revision**; **traffic splitting**
  across revisions enables blue/green and **canary** rollouts (single- vs multiple-revision mode).
- **Ingress** — **external** (public FQDN) or **internal** (within the environment/VNet), HTTP or TCP,
  with built-in TLS and a managed certificate.
- **KEDA autoscaling** — scale on **HTTP concurrency**, **queue depth** (Service Bus/Storage), or any KEDA
  custom scaler, with **scale-to-zero** for idle apps.
- **Dapr** — optional sidecar for service-to-service invocation, pub/sub, state, and bindings.
- **Jobs** — run-to-completion **jobs** (manual, scheduled, or event-triggered) alongside long-running apps.

## Configuration and sizing
- Create the **environment** (VNet + Log Analytics) once, then deploy **apps** with CPU/memory and a
  **scale rule** (min/max replicas, KEDA trigger). Choose **external vs internal ingress** and HTTP vs TCP.
  Use **revisions + traffic splits** for safe rollout. Enable **Dapr** for microservice patterns. Pick the
  **Consumption** plan (scale-to-zero) or a **Dedicated** workload profile for reserved compute/larger SKUs.

## Security and IAM
- Use a **managed identity** to pull from **ACR** and reach Azure services (no stored creds). Store
  secrets as **app secrets** or **Key Vault references**. Use **internal ingress + VNet** for private
  services; restrict external ingress with IP rules. Scope **RBAC** to the resource group/environment.
  Dapr components reference identities/Key Vault for their connections.

## Cost levers
- **Consumption** bills per **vCPU-second and GB-second of active replicas plus requests**, with
  **scale-to-zero** so idle apps cost nothing. **Dedicated** workload profiles bill reserved compute.
  Levers: scale-to-zero for spiky/idle apps, tune **min replicas to 0** where cold start is acceptable,
  right-size CPU/memory, set sensible max replicas, and use Dedicated only for steady/large/GPU needs.

## Scaling and limits
- KEDA scales replicas between **min and max** on the chosen trigger; min 0 = scale-to-zero (cold start on
  first request). Limits: max replicas per app, CPU/memory per replica (plan-dependent), environment-level
  quotas, regional availability of workload profiles/GPU. Long-running connections and scale-to-zero
  interact (set min>=1 for always-warm services).

## Operating procedure
1. **Provision** — create the **environment** (VNet + Log Analytics) then the **app** (image, CPU/memory,
   ingress, scale rule) via Terraform `azurerm_container_app_environment` + `azurerm_container_app` (or
   Bicep `Microsoft.App/managedEnvironments` + `Microsoft.App/containerApps`, or `az containerapp env
   create` / `az containerapp create`).
2. **Configure** — set the **scale rule** (KEDA trigger, min/max), **ingress** (external/internal, HTTP/
   TCP), **revisions + traffic split**, **Dapr** if used, env vars/secrets, and ACR.
3. **Secure** — assign a **managed identity** for ACR/Key Vault, store secrets as Key Vault references, use
   internal ingress + VNet for private apps, and scope RBAC.
4. **Verify** — apply [[verify-by-running]]: confirm the app `provisioningState` `Succeeded` and the latest
   revision is `Provisioned`/`Running` and healthy (`az containerapp show`, `az containerapp revision
   list`), then **curl the ingress FQDN** and confirm a healthy response; check active replica count
   reflects the scale rule. Capture revision health and the response.

## Inputs
The app/microservice topology (containers, sidecars), CPU/memory per app, the **scale trigger** and min/max
replicas, ingress (external/internal, HTTP/TCP), revision/rollout strategy, Dapr needs, secrets/config, ACR/
identity, Consumption vs Dedicated plan, and the region/VNet.

## Output
An ACA setup: an environment (VNet + Log Analytics) hosting apps with sized containers, KEDA scale rules
(incl. scale-to-zero), ingress, revisions/traffic splits, optional Dapr, managed identity + Key Vault
secrets — plus verification that the latest revision is healthy and the ingress responds.

## Notes
- Gotchas: this owns **serverless microservices** — for single ad-hoc containers/jobs use
  **azure-container-instances**, for full cluster control use **azure-aks**; **scale-to-zero adds cold
  start** (set min replicas >=1 for latency-sensitive/always-warm apps); the **environment's VNet is set at
  creation**; revision mode (single vs multiple) governs whether traffic splitting is possible; internal
  ingress requires apps to be in the same environment/VNet. 2nd consumer: the Azure role team
  (azure-iac-engineer / azure-cloud-architect). Cross-cloud peers: AWS App Runner, GCP Cloud Run.
- IaC/CLI: Terraform `azurerm_container_app_environment` + `azurerm_container_app`; Bicep/ARM
  `Microsoft.App/managedEnvironments` + `Microsoft.App/containerApps`. CLI `az containerapp env create` /
  `az containerapp create` / `az containerapp show` / `az containerapp revision list`; verify by curling
  the ingress FQDN.
