---
name: azure-load-testing
description: Use when designing, provisioning, configuring, or operating Azure Load Testing — Azure's fully managed load-testing service that runs Apache JMeter and Locust scripts at cloud scale (Azure Load Testing). Covers the load-testing resource, test plans (JMeter .jmx / Locust scripts or URL-based quick tests), load configuration (engine instances/virtual users/ramp-up), app components + server-side metrics correlation (App Insights/Azure Monitor), test criteria/pass-fail thresholds, and CI/CD integration (Azure Pipelines/GitHub Actions). Loads the knowledge to stand up the resource, author a test plan, scale engines, wire metrics, set thresholds, and verify a run. Consumed by the azure-load-testing specialist and by the Azure role team (azure-platform-engineer / azure-cloud-architect) when operating the managed service.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-load-testing, devops, performance, jmeter]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Load Testing

**Azure Load Testing** is a **fully managed** load-generation service that runs **Apache JMeter** and **Locust**
scripts at cloud scale, correlating client-side results with **server-side metrics** from the system under test.
This skill owns the **single-service Azure Load Testing layer** — the resource, test plans, load configuration,
metrics correlation, pass/fail criteria, and CI/CD integration.

## Core concepts and components
- **Load Testing resource** — the regional Azure resource that hosts your **tests** and **test runs**; the engines
  are provisioned and torn down by the service per run.
- **Test plan** — either a **JMeter `.jmx`** script (with CSV/data files, JMeter plugins), a **Locust** script, or
  a **URL-based quick test** the service generates; parameterized via **environment variables/secrets**.
- **Load configuration** — number of **engine instances** (parallel load generators), target **virtual users** per
  engine, **ramp-up time**, and duration; total load = engines x per-engine users.
- **App components + server-side metrics** — attach the **Azure resources under test** (App Service, AKS, VMSS,
  databases) so the service pulls **Azure Monitor / Application Insights** metrics (CPU, memory, response time)
  alongside client results.
- **Test criteria** — **pass/fail thresholds** (e.g., p95 response time, error %, requests/sec) that mark a run
  passed or failed — the basis for automated gates.

## Configuration and sizing
- Create the **resource**, upload the **test plan + data files**, set the **load configuration** (engines/VUs/
  ramp-up), attach **app components** for metrics, and define **test criteria**. Sizing = choosing **engine count
  and per-engine VUs** to reach the target throughput without overloading a single engine.

## Security and IAM
- Authenticate via **Entra ID**; control access with **RBAC** (`Load Test Contributor`, `Load Test Owner`,
  `Load Test Reader`). Use a **managed identity** on the resource to read app-component metrics and to fetch
  secrets/certs from **Key Vault** (store API tokens/credentials there, reference by URI — never inline secrets in
  the `.jmx`). Pipeline runs authenticate via workload identity, not PATs.

## Cost levers
- Billed by **virtual user hours** (engines x VUs x duration). Levers: cap **engine count/VUs** to the needed load,
  shorten **ramp-up/duration**, run targeted tests in CI rather than full soak tests on every commit, and use
  **quick tests** for smoke checks before scaling up.

## Scaling and limits
- Per-engine **virtual-user** ceiling, max **engine instances** per test, max test-plan/data-file size, and run
  duration limits. Scale out by adding engines (distributed load); regions limit where engines run.

## Operating procedure
1. **Provision** — create the resource via **azurerm** (`azurerm_load_test`) or `az load create`; assign a
   **managed identity**.
2. **Configure** — upload the **test plan** + data files, set **load config** (engines/VUs/ramp-up), attach
   **app components**, and define **test criteria**; parameterize secrets via **Key Vault**
   (`az load test create` / `az load test-run create`).
3. **Secure** — wire **Entra/RBAC**, grant the **managed identity** access to app-component metrics and Key Vault,
   keep credentials out of the script.
4. **Verify** — apply [[verify-by-running]]: kick off a test run (`az load test-run create`), poll status until it
   completes, confirm the run **passed/failed against the criteria** and that **server-side metrics** were
   captured, and record the p95/error-rate result.

## Inputs
The **test plan** (JMeter/Locust/URL) + data files, the **load configuration** (engines/VUs/ramp-up/duration), the
**app components** to monitor, the **test criteria** (thresholds), and the **identity/secret** wiring.

## Output
An Azure Load Testing setup: the resource with a managed identity, an authored test plan, a sized load
configuration, attached app components for server-side metrics, pass/fail criteria, and optional CI integration —
plus verification that a run executes, evaluates against criteria, and reports client + server metrics.

## Notes
- Gotchas: secrets hardcoded in `.jmx` (use **Key Vault** + env vars); under-sizing engines so one engine is the
  bottleneck (watch engine CPU); missing **app components** means no server-side correlation; ramp-up too steep
  skews results; managed identity not granted metric-reader on the target resource. 2nd consumer: the Azure role
  team (azure-platform-engineer / azure-cloud-architect).
- IaC/CLI: Terraform **azurerm** (`azurerm_load_test`); CLI `az load create`, `az load test create`,
  `az load test-run create`; Bicep `Microsoft.LoadTestService/loadTests`. Test definitions in YAML config consumed
  by the Azure Load Testing pipeline task / GitHub Action.
