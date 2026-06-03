---
name: azure-application-insights
description: Use when designing, provisioning, configuring, or operating Application Insights — the APM feature of Azure Monitor for instrumenting and observing live applications (Application Insights). Covers workspace-based App Insights resources, the connection string, auto + manual (OpenTelemetry/SDK) instrumentation, distributed tracing, requests/dependencies/exceptions, Live Metrics, the Application Map, availability (URL/standard) tests, sampling, and querying telemetry tables via KQL. Loads the knowledge to stand up the resource, instrument an app, wire availability tests + alerts, and verify telemetry flows. Consumed by the azure-application-insights specialist and by the Azure role team (azure-observability-engineer / azure-cloud-architect / azure-iac-engineer) when operating the managed service (Application Insights).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-application-insights, management-governance, apm, tracing]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Application Insights

**Application Insights** is the **APM** feature of Azure Monitor for **instrumenting and observing live
applications**: distributed traces, requests, dependencies, exceptions, and real-time metrics. This skill owns the
**single-service App Insights layer** — the (workspace-based) resource, instrumentation, availability tests, and
telemetry queries — for one application. (The umbrella collection/alerting platform is Azure Monitor.)

## Core concepts and components
- **Resource & connection string** — a **workspace-based** App Insights resource (telemetry stored in a Log
  Analytics workspace); apps send telemetry using the **connection string** (instrumentation keys are deprecated).
- **Instrumentation** — **auto-instrumentation** (codeless, for App Service/Functions/AKS/VMs) and **manual** via
  the **Azure Monitor OpenTelemetry Distro** / classic SDKs; correlation IDs enable distributed tracing.
- **Telemetry types** — **requests**, **dependencies**, **exceptions**, **traces**, **customEvents/customMetrics**,
  **pageViews** (browser); queried via KQL tables (`requests`, `dependencies`, `exceptions`, …).
- **Live Metrics** — sub-second streaming of request rate, failures, and CPU/memory for real-time triage.
- **Application Map** — auto-discovered topology of components + dependencies with health/latency overlays.
- **Availability tests** — **standard** (single-URL) and **custom TrackAvailability** synthetic tests that probe
  endpoints from multiple regions and alert on failures.
- **Sampling** — **adaptive/fixed/ingestion** sampling to cap volume while preserving correlated traces.

## Configuration and sizing
- Create the **workspace-based** resource, distribute the **connection string** (via app config/managed identity,
  not hardcoded), enable **auto-instrumentation** or wire the **OTel distro**, set **sampling**, add **availability
  tests**, and author **metric/log alerts**. Size by **telemetry ingestion volume**, not instances.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC**: **Monitoring Contributor / Reader**, plus **Log Analytics** RBAC on
  the backing workspace. Prefer **Entra-based (managed identity) ingestion** and treat the **connection string** as
  a secret (Key Vault / app settings). Restrict who can read telemetry (it may contain PII — scrub via telemetry
  processors).

## Cost levers
- Cost is **ingestion (per GB)** of telemetry into the workspace. Levers: **adaptive/fixed sampling**, drop noisy
  dependencies/traces with **telemetry processors**, raise log-level thresholds, disable unused **availability
  tests**, and use the workspace's **commitment tiers** (shared with Log Analytics).

## Scaling and limits
- Scales to high-throughput apps via sampling; governed by **ingestion latency** (telemetry isn't instant —
  except Live Metrics), per-resource **ingestion caps/daily cap**, availability-test region/frequency limits, and
  the backing workspace's retention/limits. Classic (non-workspace) resources are **retired** — use workspace-based.

## Operating procedure
1. **Provision** — create the resource via Terraform `azurerm_application_insights` (`workspace_id` set), Bicep
   `Microsoft.Insights/components` (`WorkspaceResourceId`), or `az monitor app-insights component create`.
2. **Configure** — wire the **connection string** into the app, enable **auto-instrumentation** or the **OTel
   distro**, set **sampling**, add **availability tests** (`azurerm_application_insights_standard_web_test`), and
   author alerts on failures/latency.
3. **Secure** — prefer **managed-identity ingestion**, store the connection string as a **secret**, scope
   Monitoring/Log Analytics RBAC, scrub PII via telemetry processors.
4. **Verify** — apply [[verify-by-running]]: generate traffic, then run a **KQL** query
   (`az monitor app-insights query` against `requests`/`dependencies`) confirming telemetry and end-to-end
   correlation appear; confirm an **availability test** reports and its alert path notifies. Capture state and result.

## Inputs
The **application(s)** to instrument, the backing **workspace**, the **instrumentation** approach (auto vs OTel/
SDK), the **sampling** target, the **availability tests** + alert rules, and the RBAC/secret-handling model.

## Output
An Application Insights setup: a workspace-based resource, an instrumented app emitting requests/dependencies/
exceptions/traces with distributed correlation, sampling configured, availability tests + alerts wired, scoped
RBAC + secret handling, cost controls — plus verification that telemetry flows and a test/alert fires.

## Notes
- Gotchas: use **workspace-based** (classic is retired) and the **connection string** (not the deprecated ikey);
  telemetry has **latency** (Live Metrics excepted); **sampling** affects metric accuracy/counts; telemetry can
  carry **PII** (scrub it); ingestion cost is the main risk. The collection/alerting umbrella is **Azure
  Monitor's**. 2nd consumer: the Azure role team (azure-observability-engineer / azure-cloud-architect /
  azure-iac-engineer). Cross-cloud peers: AWS X-Ray, GCP Cloud Trace.
- IaC/CLI: Terraform `azurerm_application_insights`, `azurerm_application_insights_standard_web_test`,
  `azurerm_application_insights_smart_detection_rule`; Bicep/ARM `Microsoft.Insights/components` +
  `webtests`. CLI `az monitor app-insights ...`.