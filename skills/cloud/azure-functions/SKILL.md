---
name: azure-functions
description: Use when designing, provisioning, securing, or operating Azure Functions — Microsoft Azure's serverless, event-driven compute (Azure Functions). Covers triggers and bindings (HTTP, Timer, Queue/Service Bus, Event Hub/Grid, Blob, Cosmos DB), hosting plans (Consumption, Flex Consumption, Elastic Premium, Dedicated/App Service, Container Apps), the isolated vs in-process worker models and language stacks, Durable Functions (orchestrations/activities/entities and patterns), cold starts and scaling/concurrency, the storage account requirement, app settings and Key Vault references, Entra ID/managed identities and function/host keys, VNet integration and Private Endpoints, and cost. Loads the Functions knowledge: pick a plan and trigger, provision, secure, and verify a function executes. Consumed by the azure-functions specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Functions).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-functions, compute, serverless, durable-functions, triggers-bindings]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Functions

Microsoft Azure's **serverless, event-driven compute** — small functions invoked by triggers, scaled
automatically by the platform, with declarative I/O bindings and a stateful orchestration layer (Durable
Functions), behind Azure identity and networking.

## Core concepts and components
- **Triggers** — what invokes a function: **HTTP**, **Timer** (cron), **Queue / Service Bus**, **Event
  Hub / Event Grid**, **Blob**, **Cosmos DB change feed**, and more; exactly one trigger per function.
- **Bindings** — declarative **input/output** connections (e.g. read a queue message, write to Blob/Cosmos/
  Service Bus) that remove boilerplate SDK code.
- **Hosting plans** — **Consumption** (pay-per-execution, scale-to-zero, cold starts), **Flex
  Consumption** (modern serverless with always-ready instances + VNet), **Elastic Premium** (pre-warmed,
  no cold start, VNet), or **Dedicated/App Service plan** (run on an existing plan); also hostable on
  **Container Apps**.
- **Worker model** — **isolated worker process** (recommended; decoupled from host runtime, .NET/Node/
  Python/Java/PowerShell) vs the legacy **in-process** .NET model.
- **Durable Functions** — stateful orchestrations built from **orchestrator / activity / entity**
  functions, enabling patterns: function chaining, fan-out/fan-in, async HTTP, monitor, human interaction.
- **Storage account** — every function app requires an associated **storage account** for triggers,
  state, and the Durable task hub.

## Configuration and sizing
- Choose the **plan** by latency/scale/networking needs (Consumption for spiky/cheap, Flex/Premium to kill
  cold starts and get VNet, Dedicated to reuse a plan). Pick **isolated worker** + a supported runtime.
  Set **app settings** (with **Key Vault references** for secrets), concurrency/`maxScale`, and timeout.
  Use **Durable Functions** when you need orchestration/state. Bind triggers/outputs declaratively.

## Security and IAM
- Prefer **Microsoft Entra ID + managed identity** for downstream access and **identity-based** trigger/
  binding connections over connection strings; reserve **function/host keys** for simple HTTP auth, or
  front with **APIM/Easy Auth**. Store secrets via **Key Vault references**. Isolate with **VNet
  integration + Private Endpoints** (Flex/Premium/Dedicated) and disable public access where possible.
  Apply least-privilege RBAC; protect the storage account.

## Cost levers
- **Consumption**/Flex bill per **execution count + GB-seconds** (scale to zero when idle); **Premium/
  Dedicated** bill for reserved instances regardless of load. Levers: stay on **Consumption** for spiky/
  low-volume; right-size **Premium** instance count + always-ready; cap concurrency/`maxScale` to bound
  cost; reduce execution time/memory; use **Flex Consumption** to balance cold-start vs cost.

## Scaling and limits
- Consumption/Flex scale **out per-instance automatically** (event-driven, scale to zero); Premium keeps
  **pre-warmed** instances (no cold start) with a max burst; Dedicated scales with the plan/VMSS. Per-app
  and per-plan instance caps apply; **HTTP timeout** is bounded (longer on Premium/Dedicated). The shared
  **storage account** can throttle high-fan-out triggers — isolate per app.

## Operating procedure
1. **Provision** — create the function app + its **storage account** and **plan** via Terraform
   `azurerm_linux_function_app` / `azurerm_windows_function_app` + `azurerm_service_plan` +
   `azurerm_storage_account` (or Bicep/`az functionapp create`).
2. **Configure** — set the **runtime/worker model**, **app settings** (Key Vault references), wire
   **triggers/bindings**, set concurrency/timeout, and add **Durable** task hub if needed; deploy code
   (`func azure functionapp publish` / zip deploy).
3. **Secure** — assign a **managed identity**, use **identity-based connections**, set function/host key
   or Easy Auth/APIM, add **VNet + Private Endpoints**, and store secrets in Key Vault.
4. **Verify** — apply [[verify-by-running]]: confirm the app is `Running` (`az functionapp show`) and the
   function is listed (`az functionapp function list`), then **invoke it** — curl the HTTP trigger (with
   key/Entra token) or enqueue a message and confirm the expected output/side effect and check logs/App
   Insights. Capture the invocation response and the log.

## Inputs
The event source/trigger and bindings, the runtime/language and worker model, whether you need Durable
orchestration, the hosting plan (Consumption/Flex/Premium/Dedicated), concurrency/timeout needs,
networking, secrets, the region, and the identity security requirements.

## Output
An Azure Functions setup: a function app on the chosen plan with its storage account, configured triggers/
bindings (and Durable task hub if used), app settings with Key Vault references — secured by managed
identity, identity-based connections, keys/Easy Auth, and VNet/Private Endpoints — plus verification that
a function executes and produces the expected result.

## Notes
- Gotchas: **cold starts** on Consumption hurt latency (use Flex/Premium always-ready); every app needs a
  **storage account** and sharing one across busy apps causes throttling; **HTTP timeout** is capped
  (don't run long sync work — use Durable); prefer the **isolated worker** model (in-process .NET is
  legacy); **identity-based connections** need correct data-plane RBAC, not just the managed identity;
  Durable **task hub** name collisions corrupt state. This owns **serverless functions** — for full PaaS
  web apps defer to **azure-app-service**, for containerized event/HTTP workloads to azure-container-apps.
  2nd consumer: the Azure role team (azure-iac-engineer / azure-cloud-architect). Cross-cloud peers: AWS
  Lambda, GCP Cloud Functions.
- IaC/CLI: Terraform `azurerm_linux_function_app` / `azurerm_windows_function_app` + `azurerm_service_plan`
  + `azurerm_storage_account`; Bicep/ARM `Microsoft.Web/sites` (`kind = "functionapp"`). CLI
  `az functionapp create` / `az functionapp show` / `az functionapp function list` and `func` core tools;
  verify by invoking the trigger and checking App Insights.
