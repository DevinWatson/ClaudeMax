---
name: azure-monitor
description: Use when designing, provisioning, configuring, or operating Azure Monitor — the umbrella observability platform for collecting, analyzing, and acting on metrics and logs across Azure, hybrid, and multicloud (Azure Monitor). Covers the two telemetry pillars (the Metrics time-series store and the Logs store backed by Log Analytics queried with KQL), Application Insights APM/tracing, data collection rules (DCRs) + the Azure Monitor Agent, alerts (metric/log/activity-log) with action groups (email/SMS/webhook/Logic App), autoscale, dashboards/workbooks, diagnostic settings that route resource logs/metrics, and Managed Prometheus + Grafana. Loads the knowledge: stand up the workspace + App Insights, wire diagnostic settings/DCRs, build alerts + action groups, dashboards, and verify telemetry flows. Consumed by the azure-monitor specialist and by the Azure role team (azure-observability-engineer / azure-cloud-architect / azure-iac-engineer) when standing up the managed service (Azure Monitor).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-monitor, management-governance, observability, log-analytics]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Monitor

**Azure Monitor** is the **umbrella observability platform** for Azure: it collects **metrics** and **logs**,
runs **alerts and autoscale**, and powers **dashboards**, **Application Insights** APM, and **Managed
Prometheus/Grafana**. This skill owns the **single-service Monitor layer** — workspace + App Insights, data
collection, alerts/action groups, and dashboards — for one workload or subscription.

## Core concepts and components
- **Metrics** — lightweight numeric **time-series** (platform + custom), near-real-time, cheap, retained
  ~93 days; queried via the metrics explorer and used by **metric alerts** and **autoscale**.
- **Logs** — rich, structured event/log data stored in a **Log Analytics workspace** and queried with **KQL**;
  the backbone for **log alerts**, workbooks, and cross-resource correlation.
- **Application Insights** — APM for apps: **distributed tracing**, requests/dependencies, exceptions, live
  metrics, the application map; **workspace-based** App Insights stores its data in a Log Analytics workspace.
- **Data collection** — **diagnostic settings** route a resource's platform logs/metrics to a workspace/Event
  Hub/Storage; **data collection rules (DCRs)** + the **Azure Monitor Agent (AMA)** collect from VMs/hybrid.
- **Alerts & action groups** — **alert rules** (metric / log / activity-log) evaluate signals and, on fire,
  trigger an **action group** (email/SMS/push/voice, **webhook**, **Logic App**, **Automation runbook**, ITSM).
- **Autoscale** — metric-driven scaling rules for VMSS/App Service/etc.
- **Dashboards & workbooks** — shared **Azure dashboards** and interactive **workbooks**; **Managed Prometheus**
  + **Azure Managed Grafana** for Kubernetes/OSS-style metrics.

## Configuration and sizing
- Create (or reuse) a **Log Analytics workspace** with a **retention/commitment tier**, enable **workspace-based
  App Insights** for apps, attach **diagnostic settings** on resources and **DCRs** on VMs, then author **alert
  rules** + **action groups** and build **workbooks/dashboards**. Size by **ingestion volume**, not instance.

## Security and IAM
- Control-plane via **Entra ID + Azure RBAC**: **Monitoring Contributor / Reader**, **Log Analytics
  Contributor/Reader**. Action groups that call other services should use **managed identities** (e.g. Logic
  App/Automation), not stored creds. Restrict workspace data access (table-level RBAC where needed), and route
  security-relevant logs onward to **Microsoft Sentinel**. App Insights connection strings should be handled
  as secrets.

## Cost levers
- Cost is dominated by **log ingestion + retention** (per GB) and App Insights data; metrics are largely free.
  Levers: **commitment tiers**, **DCR transforms** to filter/drop noise at ingest, **basic/auxiliary logs** for
  high-volume low-value data, **table-level retention**/archive, **sampling** in App Insights, and turning off
  diagnostic categories you don't query.

## Scaling and limits
- Scales to large multi-resource workspaces and cross-workspace queries. Limits: ingestion has **latency**
  (logs aren't instant); **metric** retention is fixed (~93 days) — persist to logs for longer; log/metric
  **alert** evaluation frequencies and query result caps apply; action group **rate limits**; commitment-tier
  changes have minimum periods. Plan workspace topology (central vs per-team) deliberately.

## Operating procedure
1. **Provision** — create the workspace and App Insights via Terraform `azurerm_log_analytics_workspace` +
   `azurerm_application_insights`, Bicep `Microsoft.OperationalInsights/workspaces` +
   `Microsoft.Insights/components`, or `az monitor log-analytics workspace create` + `az monitor app-insights
   component create`.
2. **Configure** — attach **diagnostic settings** (`azurerm_monitor_diagnostic_setting`) and **DCRs**
   (`azurerm_monitor_data_collection_rule`), author **alert rules** (`azurerm_monitor_metric_alert` /
   `azurerm_monitor_scheduled_query_rules_alert_v2`) + **action groups** (`azurerm_monitor_action_group`), and
   build **workbooks/dashboards**.
3. **Secure** — scope **Monitoring/Log Analytics RBAC**, give action-group Logic Apps **managed identities**,
   and route security logs to **Sentinel**.
4. **Verify** — apply [[verify-by-running]]: confirm telemetry is flowing — run a **KQL** query against the
   expected table (`az monitor log-analytics query`) and read a **metric** (`az monitor metrics list`) — then
   trigger/confirm an **alert** fires and its **action group** notifies. Capture state and result.

## Inputs
The resources/apps to monitor, the **workspace** topology + retention/commitment plan, which **diagnostic
settings/DCRs** to collect, the **alert rules** + **action groups** (and notification/automation targets), the
**dashboards/workbooks** required, and the RBAC model.

## Output
An Azure Monitor setup: a Log Analytics workspace + (workspace-based) App Insights, diagnostic settings/DCRs
collecting telemetry, metric/log alert rules wired to action groups, dashboards/workbooks, scoped RBAC and
managed-identity actions, cost controls (commitment tier, ingest transforms) — plus verification that metrics
and logs flow and an alert fires and notifies.

## Notes
- Gotchas: **ingestion cost** is the main risk — filter at ingest, use commitment tiers + basic logs; logs have
  **latency** (not real-time); **metric** retention is fixed (~93 days) so persist long-term data to logs;
  action groups have **rate limits**; don't collect diagnostic categories you never query. Cross-cutting
  observability strategy is the role team's call. 2nd consumer: the Azure role team
  (azure-observability-engineer / azure-cloud-architect / azure-iac-engineer). Cross-cloud peers: AWS CloudWatch
  (+ X-Ray), GCP Cloud Monitoring (+ Cloud Trace/Logging).
- IaC/CLI: Terraform `azurerm_log_analytics_workspace`, `azurerm_application_insights`,
  `azurerm_monitor_diagnostic_setting`, `azurerm_monitor_data_collection_rule`, `azurerm_monitor_metric_alert`,
  `azurerm_monitor_scheduled_query_rules_alert_v2`, `azurerm_monitor_action_group`, `azurerm_monitor_autoscale_setting`;
  Bicep/ARM `Microsoft.Insights/*` + `Microsoft.OperationalInsights/workspaces`. CLI `az monitor ...`.
