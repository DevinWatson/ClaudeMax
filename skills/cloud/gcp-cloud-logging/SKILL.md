---
name: gcp-cloud-logging
description: Use when designing, provisioning, securing, or operating Cloud Logging — Google Cloud's managed log-management service (Cloud Operations / formerly Stackdriver). Covers the Log Router and sinks routing to log buckets / BigQuery / Cloud Storage / Pub/Sub, log buckets (retention, regionalization, CMEK), inclusion/exclusion filters, log-based metrics (counter/distribution) feeding Cloud Monitoring, Log Analytics (BigQuery-backed SQL) and linked datasets, aggregated org/folder sinks, and the Logging query language, plus IAM, CMEK/audit, cost (ingestion vs retention), and scaling/limits. Loads the Cloud Logging knowledge: design buckets/retention, route with sinks and filters, build log-based metrics, query logs, and verify routing and metrics. Consumed by the Cloud Logging specialist and by the GCP role team (gcp-observability-engineer, which uses observability-instrumentation) when wiring the logging signal (Cloud Logging).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-logging, observability, log-router, sinks, log-based-metrics, log-analytics]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Logging

Google Cloud's managed log-management service (part of Cloud Operations, formerly Stackdriver). It
ingests platform, audit, and application logs, **routes** them via the Log Router, **stores** them in log
buckets with configurable retention, and lets you **query, export, and derive metrics** from them. It owns
the **logs** signal of GCP's observability suite (alongside Cloud Monitoring, Cloud Trace, Cloud Profiler).

## Core concepts and components
- **Log Router & sinks** — every log entry passes through the **Log Router**, which evaluates **sinks**.
  Each sink has an **inclusion filter** (and optional exclusions) and a **destination**: a log bucket,
  **BigQuery** dataset, **Cloud Storage** bucket, or **Pub/Sub** topic.
- **Log buckets** — storage containers: the **_Default** and **_Required** buckets exist automatically;
  create **custom buckets** with **retention** (1–3650 days), **regionalization**, **CMEK**, and optional
  **Log Analytics** upgrade.
- **Inclusion / exclusion filters** — Logging-query-language predicates that decide what a sink stores
  and what is dropped before storage (exclusions cut ingestion cost).
- **Log-based metrics** — **counter** and **distribution** metrics extracted from matching log entries,
  surfaced in **Cloud Monitoring** for dashboards/alerting.
- **Log Analytics** — BigQuery-backed **SQL** over upgraded buckets (and **linked datasets**) for ad-hoc
  analysis at scale.
- **Aggregated sinks** — org/folder-level sinks that route logs from all child projects to a central
  destination (security/audit lake).

## Configuration and sizing
- Decide **retention** per bucket (compliance vs cost), **regionalize** buckets for residency, and apply
  **CMEK** where required. Build a **routing plan**: keep operational logs in custom buckets, fan out to
  BigQuery/Log Analytics for analysis, archive to Cloud Storage, and stream to Pub/Sub for real-time
  consumers. Use an **aggregated org sink** for centralized security logging.

## Security and IAM
- Grant least-privilege IAM (`roles/logging.viewer`, `roles/logging.privateLogViewer` for Data Access
  logs, `roles/logging.configWriter` for sinks/buckets, `roles/logging.admin` sparingly). Protect
  **Data Access audit logs** (enable deliberately — they are high-volume). Apply **CMEK** to buckets,
  configure **locked retention** for compliance, and grant sink **writer service accounts** only the
  destination permission they need.

## Cost levers
- Cost is driven by **ingestion volume** (chargeable after the free tier), **retention beyond the free
  period**, and **Log Analytics** scanning. Levers: **exclusion filters** to drop noisy logs before
  storage, shorter retention on low-value buckets, route high-volume logs to cheap **Cloud Storage** or
  BigQuery instead of long bucket retention, and disable unnecessary Data Access logs.

## Scaling and limits
- Logging scales to very high ingest. Limits: **sinks per project/org**, **log-based metrics per project**,
  retention bounds, bucket counts/regions, and exclusion counts. Log Analytics query scope follows
  BigQuery limits. High Data Access log volume is the usual surprise — control with exclusions.

## Operating procedure
1. **Provision** — enable the Logging API and create **custom log buckets**
   (Terraform `google_logging_project_bucket_config`) with retention/region/CMEK and Log Analytics enabled
   where needed.
2. **Configure** — create **sinks** (`google_logging_project_sink` / folder/org/billing-account sinks)
   with inclusion/exclusion filters and destinations (bucket/BigQuery/GCS/Pub/Sub), grant the sink
   **writer identity** on the destination, and define **log-based metrics**
   (`google_logging_metric`).
3. **Secure** — set least-privilege Logging IAM, protect/scope Data Access logs, apply CMEK and locked
   retention for compliance, and configure an **aggregated sink** for centralized audit logging.
4. **Verify** — apply [[verify-by-running]]: emit a representative log entry and confirm it lands via the
   sink in the destination (`gcloud logging read '<filter>'`, check BigQuery/GCS/Pub/Sub), confirm
   exclusions drop the noisy logs, and confirm the **log-based metric** increments in Cloud Monitoring —
   capture the query output, sink delivery, and metric data point.

## Inputs
Log sources (platform/audit/app), retention and residency/CMEK requirements, routing plan (which logs go
to which bucket/BigQuery/GCS/Pub/Sub), exclusion/noise policy, log-based metrics to derive, Log Analytics
needs, IAM model, compliance (locked retention, Data Access logs), and cost ceiling.

## Output
A Cloud Logging configuration (custom buckets with retention/CMEK, routing sinks + inclusion/exclusion
filters to the right destinations, log-based metrics, Log Analytics, aggregated org sink) with
least-privilege IAM, plus verification of sink delivery, exclusions, and metric increment.

## Notes
- Gotchas: a sink's **writer service account** must be granted on the destination or delivery silently
  fails; **exclusions** drop logs *before* storage (irrecoverable) — be careful; **_Required** bucket
  retention is fixed; **Data Access audit logs** are huge and off by default — enabling everything blows up
  cost; log-based **distribution** metrics need correct bucketing; Log Analytics requires upgrading the
  bucket and cannot be undone in place.
- IaC/CLI: Terraform `google_logging_project_bucket_config`, `google_logging_project_sink` (and
  folder/org/billing variants), `google_logging_metric`, `google_logging_linked_dataset`, plus
  `google_project_service` (logging). CLI `gcloud logging buckets`, `... sinks`, `... metrics`, and
  `gcloud logging read '<filter>'` to verify routing/queries.
