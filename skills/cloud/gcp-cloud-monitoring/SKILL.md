---
name: gcp-cloud-monitoring
description: Use when designing, provisioning, securing, or operating Cloud Monitoring — Google Cloud's managed metrics, dashboards, alerting, uptime, and SLO service (Cloud Operations / formerly Stackdriver). Covers metric types (built-in, Ops Agent, log-based, custom, Managed Service for Prometheus / GMP), metric scopes for multi-project monitoring, dashboards, alerting policies (threshold, MQL/PromQL, rate-of-change, absence) with notification channels, uptime checks and synthetics, and SLO/SLI with burn-rate alerting, plus MQL/PromQL, IAM, cost (metric samples/cardinality), and scaling/limits. Loads the Cloud Monitoring knowledge: define metrics and scopes, build dashboards, author alerting policies and SLOs, set uptime checks, and verify alerts fire/resolve. Consumed by the Cloud Monitoring specialist and by the GCP role team (gcp-observability-engineer, which uses observability-instrumentation) when wiring the metrics/alerting signal (Cloud Monitoring).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-monitoring, observability, metrics, alerting, slo, uptime-checks]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Monitoring

Google Cloud's managed metrics, dashboards, alerting, uptime, and SLO platform (part of Cloud Operations,
formerly Stackdriver). It collects time-series metrics, visualizes them, evaluates **alerting policies**,
runs **uptime checks**, and tracks **SLOs** with burn-rate alerting. It owns the **metrics/alerting**
signal of GCP's observability suite (alongside Cloud Logging, Cloud Trace, Cloud Profiler).

## Core concepts and components
- **Metrics** — **built-in** GCP metrics, **agent** metrics (Ops Agent), **log-based** metrics (from Cloud
  Logging), **custom** metrics, and **Managed Service for Prometheus (GMP)** for Prometheus-compatible
  ingestion/querying.
- **Metric scope** — a monitoring project that can observe metrics from **multiple monitored projects**
  (the basis for centralized, multi-project monitoring).
- **Dashboards** — collections of widgets (line/heatmap/scorecard/table) over metric queries.
- **Alerting policies** — conditions (**metric-threshold**, **MQL/PromQL** condition, **rate-of-change**,
  **metric-absence**) with combiners, durations, auto-close, and **notification channels** (email,
  PagerDuty, Slack, Pub/Sub, webhook).
- **Uptime checks & synthetics** — HTTP/HTTPS/TCP probes from global locations (and **synthetic monitors**
  for scripted journeys) that feed availability alerts.
- **SLO / SLI** — define a service, an SLI (availability/latency), an SLO target over a window, and
  **burn-rate** alerting policies.
- **Query languages** — **MQL** and **PromQL** for advanced conditions/dashboards.

## Configuration and sizing
- Set up a **metric scope** in a central monitoring project for multi-project visibility. Deploy the **Ops
  Agent** / enable **GMP** for workload metrics. Build dashboards per service. Author alerting policies
  with sensible **duration windows** and **auto-close** to avoid flapping. Define **SLOs** and pair them
  with **multi-window burn-rate** alerts rather than raw thresholds for user-facing reliability.

## Security and IAM
- Grant least-privilege IAM (`roles/monitoring.viewer`, `roles/monitoring.editor`,
  `roles/monitoring.alertPolicyEditor`, `roles/monitoring.notificationChannelEditor`). Store notification
  channel secrets (webhook tokens) in Secret Manager. Scope metric-scope membership deliberately
  (cross-project visibility is an access boundary). Protect SLO/alerting config changes as they affect
  paging.

## Cost levers
- Cost is driven by **chargeable metric ingestion** (custom/GMP/agent metric samples and label
  cardinality) and **API calls**; built-in GCP metrics and uptime checks are largely free. Levers: control
  **label cardinality**, reduce sampling/scrape frequency for GMP, drop unused custom metrics, and avoid
  high-cardinality custom labels that explode time-series counts.

## Scaling and limits
- Scales to large fleets. Limits: **alerting policies / conditions / notification channels per project**,
  **uptime checks per project**, **dashboards**, time-series and **label cardinality** per metric, and SLO
  counts. High-cardinality metrics are the main scaling pitfall (cost + query latency). GMP follows
  Prometheus-style limits.

## Operating procedure
1. **Provision** — enable the Monitoring API; set the **metric scope** for multi-project monitoring and
   deploy Ops Agent / enable **GMP** on workloads as needed.
2. **Configure** — create **dashboards** (Terraform `google_monitoring_dashboard`), **notification
   channels** (`google_monitoring_notification_channel`), **alerting policies**
   (`google_monitoring_alert_policy`), **uptime checks** (`google_monitoring_uptime_check_config`), and
   **SLOs** (`google_monitoring_slo` on a `google_monitoring_custom_service`/`generic_service`) with
   burn-rate alerts.
3. **Secure** — grant Monitoring IAM least-privilege, scope the metric scope deliberately, and store
   notification secrets in Secret Manager.
4. **Verify** — apply [[verify-by-running]]: confirm metrics are ingesting
   (`gcloud monitoring time-series list` / dashboard render), then **trigger an alert** condition (or use a
   test/violating signal) and confirm the policy **fires and the notification channel delivers**, confirm
   it **auto-closes** when resolved, and confirm the uptime check/SLO reports — capture the time-series
   read, the alert incident, and notification delivery.

## Inputs
Workloads and metric sources (built-in/agent/log-based/custom/GMP), multi-project monitoring needs (metric
scope), dashboards required, alerting policy set + notification channels, uptime/synthetic checks, SLO/SLI
targets and burn-rate policy, IAM model, and cost/cardinality ceiling.

## Output
A Cloud Monitoring configuration (metric scope, Ops Agent/GMP ingestion, dashboards, alerting policies with
notification channels, uptime checks/synthetics, SLOs with burn-rate alerts) with least-privilege IAM, plus
verification that metrics ingest and an alert fires, notifies, and auto-closes.

## Notes
- Gotchas: **high label cardinality** is the top cost/scaling trap (each label combo is a time series);
  alerting policies without a **duration window** flap; **metric-absence** conditions need a baseline of
  data to evaluate; an untested **notification channel** silently fails when an incident finally fires;
  **SLO burn-rate** alerting beats static thresholds for user-facing reliability; metric-scope membership
  is an access boundary — adding a project exposes its metrics centrally.
- IaC/CLI: Terraform `google_monitoring_dashboard`, `google_monitoring_alert_policy`,
  `google_monitoring_notification_channel`, `google_monitoring_uptime_check_config`,
  `google_monitoring_slo`, `google_monitoring_custom_service`, plus `google_project_service` (monitoring).
  CLI `gcloud monitoring dashboards`, `... channels`, `... policies` (alpha/beta) and
  `gcloud monitoring time-series list` to verify ingestion.
