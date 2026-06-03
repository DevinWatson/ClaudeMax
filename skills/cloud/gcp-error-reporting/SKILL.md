---
name: gcp-error-reporting
description: Use when designing, provisioning, securing, or operating Error Reporting — Google Cloud's managed service that aggregates and deduplicates application crashes/exceptions into error groups across services (Cloud Operations / formerly Stackdriver Error Reporting). Covers automatic error capture from Cloud Logging stack traces, error groups and deduplication, group state (open/acknowledged/resolved/muted), notifications, the reportErrorEvents API for custom exception reporting, supported languages/runtimes, and integration with Cloud Run / GKE / App Engine / Cloud Functions, plus IAM, cost, and scaling/limits. Loads the Error Reporting knowledge: ensure exceptions surface as groups, tune capture, wire notifications, manage group lifecycle, and verify a thrown error appears as a group. Consumed by the Error Reporting specialist and by the GCP role team (gcp-observability-engineer, which uses observability-instrumentation) when wiring the application-error signal (Error Reporting).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, error-reporting, observability, errors, exceptions, crash-reporting]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Error Reporting

Google Cloud's managed service that **counts, analyzes, and aggregates** the crashes/exceptions in running
cloud services (part of Cloud Operations, formerly Stackdriver Error Reporting). It groups errors that share
a root cause into **error groups**, deduplicates them, and surfaces the count, first/last seen, affected
services/versions, and a representative stack trace. It owns the **application-error** signal of GCP's
observability suite (alongside Cloud Logging, Cloud Monitoring, Cloud Trace, Cloud Profiler).

## Core concepts and components
- **Error capture** — errors are captured automatically when a **stack trace is written to Cloud Logging**
  in a recognized format (via the language client libraries or by emitting a structured log entry with the
  exception), or sent explicitly through the **`reportErrorEvents`** API / client libraries.
- **Error groups** — exceptions sharing a root cause are deduplicated into a **group** keyed by the stack
  trace; the group tracks **count over time**, **first/last seen**, **affected service/version**, and a
  sample event.
- **Group state** — a group is **open**, **acknowledged**, **resolved**, or **muted**; muted groups stop
  notifying (useful for known/benign noise).
- **Notifications** — per-project email/notification on **new** error groups (and via Pub/Sub for custom
  routing); useful to alert on regressions or newly introduced crashes.
- **Service context** — errors are attributed to a `service` + `version`, enabling regression detection
  across deploys.
- **Integrations** — first-class on **Cloud Run, GKE, App Engine, Cloud Functions, and Compute Engine**;
  supported runtimes include Go, Java, Node.js, Python, Ruby, PHP, and .NET.

## Configuration and sizing
- Ensure workloads emit **uncaught exceptions with stack traces to Cloud Logging** (use the language client
  library or log the exception as structured JSON), and set `service`/`version` resource labels so
  regressions map to deploys. For custom/handled exceptions, call **`reportErrorEvents`**. There is no
  cluster to size — capacity is governed by log ingestion and API quotas.

## Security and IAM
- Grant least-privilege IAM: `roles/errorreporting.viewer` (read groups), `roles/errorreporting.user`
  (manage group state), and `roles/errorreporting.writer` (workload SA that calls `reportErrorEvents`).
  Avoid embedding **PII in exception messages/stack traces** — error events are retained and visible to
  viewers. Scope writer roles to the workload service account only.

## Cost levers
- Error Reporting itself has **no separate per-error charge**; cost flows through **Cloud Logging
  ingestion** of the stack traces it reads (and any Pub/Sub used for notification routing). Levers: keep
  exception logging at appropriate severity (`ERROR`+), avoid logging the same exception redundantly at
  multiple layers, and don't inflate log volume with verbose traces you won't act on.

## Scaling and limits
- Scales to high error rates; the practical limits are **`reportErrorEvents` API quotas**, log ingestion
  limits, and the **error-event retention window** (recent events; counts persist longer). Extremely
  high-cardinality stack traces (e.g. unique per-request frames) can fragment groups — normalize dynamic
  frames so related errors deduplicate into one group.

## Operating procedure
1. **Provision** — enable the Error Reporting API (`clouderrorreporting.googleapis.com`) and ensure Cloud
   Logging is active for the workload; install/enable the language client library where you want automatic
   capture.
2. **Configure** — emit uncaught exceptions with stack traces (or call `reportErrorEvents`), set
   `service`/`version` labels, and enable **new-error-group notifications** (email and/or Pub/Sub routing).
3. **Secure** — grant least-privilege Error Reporting IAM (viewer/user to people, writer to the workload
   SA), and keep PII out of exception payloads.
4. **Verify** — apply [[verify-by-running]]: deploy a build that **throws a test exception** (or POST a
   synthetic event via `reportErrorEvents` / `gcloud beta error-reporting events report`), then confirm the
   error **appears as a group** with the correct service/version and a stack trace
   (`gcloud beta error-reporting events list` / `gcloud beta error-reporting groups`), confirm the **new-group
   notification** fires, and confirm **resolving/muting** the group changes its state — capture the reported
   event, the group, and the notification.

## Inputs
Workloads and their runtimes, how exceptions reach Cloud Logging (client library vs structured logs vs
`reportErrorEvents`), `service`/`version` labeling, notification routing (email/Pub/Sub), IAM model, and any
PII constraints on error payloads.

## Output
An Error Reporting configuration (automatic and/or explicit error capture, service/version attribution,
new-group notifications, group-lifecycle conventions) with least-privilege IAM, plus verification that a
thrown/reported error surfaces as a group and notifies.

## Notes
- Gotchas: errors only appear if the **stack trace reaches Cloud Logging in a recognized format** — a
  bare error string without a trace may not group; **dynamic frames** (per-request IDs, timestamps in the
  trace) fragment one bug into many groups; missing `version` hides which deploy regressed; **PII in stack
  traces** is exposed to viewers; muted groups silently stop notifying. Error Reporting reads logs — it is
  not a replacement for alerting (pair with Cloud Monitoring for paging).
- IaC/CLI: Error Reporting has minimal Terraform surface — enable via
  `google_project_service` (`clouderrorreporting.googleapis.com`) and manage notification routing with
  `google_pubsub_topic`/`google_logging_project_sink` where used; configuration is largely API/SDK-driven.
  CLI `gcloud beta error-reporting events report|list` and `gcloud beta error-reporting groups` to verify.
