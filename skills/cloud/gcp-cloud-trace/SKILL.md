---
name: gcp-cloud-trace
description: Use when designing, provisioning, securing, or operating Cloud Trace — Google Cloud's managed distributed-tracing service (Cloud Operations / formerly Stackdriver) for analyzing latency across requests in distributed/microservice systems. Covers traces and spans (parent/child, attributes, events), context propagation (W3C Trace Context, X-Cloud-Trace-Context), OpenTelemetry / Cloud Trace exporter instrumentation, sampling rate vs cost, the trace waterfall and latency analysis, and log-trace correlation with Cloud Logging, plus IAM, cost (spans ingested), and scaling/limits. Loads the Cloud Trace knowledge: instrument services and propagate context, set sampling, ingest spans, analyze latency, and verify traces appear with correct parent/child spans. Consumed by the Cloud Trace specialist and by the GCP role team (gcp-observability-engineer, which uses observability-instrumentation) when wiring the tracing signal (Cloud Trace).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-trace, observability, distributed-tracing, spans, opentelemetry, latency]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Trace

Google Cloud's managed **distributed-tracing** service (part of Cloud Operations, formerly Stackdriver).
It collects **traces** made of **spans** as requests flow through distributed/microservice systems, so you
can see end-to-end latency, find slow hops, and spot tail-latency outliers. It owns the **traces** signal
of GCP's observability suite (alongside Cloud Logging, Cloud Monitoring, Cloud Profiler).

## Core concepts and components
- **Trace & spans** — a **trace** is the tree of **spans** for one request; each span has a name, start/end
  time, **parent span ID**, **attributes/labels**, and **events**. Parent/child links build the waterfall.
- **Context propagation** — trace context flows across services via headers: **W3C Trace Context**
  (`traceparent`) and Google's **`X-Cloud-Trace-Context`**. Broken propagation = disconnected/orphan spans.
- **Instrumentation** — emit spans via **OpenTelemetry** (recommended) with the **Cloud Trace exporter**,
  legacy Cloud Trace client libraries, or auto-instrumentation; many GCP front ends (LB/App Engine/Cloud
  Run) inject spans automatically.
- **Sampling** — only a fraction of requests are traced (head/parent-based sampling). The **sampling rate**
  trades fidelity for **span ingestion cost**.
- **Analysis** — the **trace list** and **waterfall** view, **latency reports** (distribution over a
  window), and **log↔trace correlation** (Cloud Logging entries link to their trace) plus Monitoring.

## Configuration and sizing
- Standardize on **OpenTelemetry** with the Cloud Trace exporter across services and ensure **consistent
  context propagation** (one header standard end-to-end). Set a **sampling rate** appropriate to traffic
  and budget (e.g., a small percentage at high volume, higher in lower environments). Add meaningful **span
  attributes** (route, status, user-tier) for analysis, and correlate logs by writing the **trace ID**.

## Security and IAM
- Grant least-privilege IAM (`roles/cloudtrace.user` to read, `roles/cloudtrace.agent` for the workload
  identity that writes spans, `roles/cloudtrace.admin` sparingly). Avoid putting **PII in span attributes**.
  Ensure the service account / Workload Identity used by the exporter has the agent role only.

## Cost levers
- Cost is driven by **spans ingested** (chargeable after a free tier). The dominant lever is the **sampling
  rate** — lower it at high traffic, raise it for debugging. Also avoid emitting excessive low-value spans
  and over-instrumenting hot loops; keep attribute volume reasonable.

## Scaling and limits
- Scales with traffic via sampling. Limits: **spans per trace**, **attributes/labels per span**, attribute
  value sizes, and ingestion quotas. Very chatty services should sample down; deep span trees can hit the
  spans-per-trace cap (consolidate spans). Trace retention is fixed (about 30 days).

## Operating procedure
1. **Provision** — enable the Cloud Trace API and grant the workload's identity `roles/cloudtrace.agent`.
2. **Configure** — instrument services with **OpenTelemetry** + the **Cloud Trace exporter**, set a
   **sampler/sampling rate**, ensure **context propagation** (W3C / `X-Cloud-Trace-Context`) across all
   hops, add useful **span attributes**, and write the **trace ID** into logs for correlation. IaC is
   light (`google_project_service` for the API; instrumentation lives in app/runtime config).
3. **Secure** — grant Trace IAM least-privilege, keep PII out of span attributes, and scope the exporter
   service account to the agent role.
4. **Verify** — apply [[verify-by-running]]: drive a request through the service and confirm a **trace
   appears** with the expected **parent/child span tree** (`gcloud trace traces list` /
   `gcloud trace traces describe <TRACE_ID>` or the console waterfall), confirm context **propagates across
   services** (no orphan spans), and confirm **log↔trace correlation** links an entry to its trace —
   capture the trace listing/describe output and the span tree.

## Inputs
Service topology and languages/runtimes, current instrumentation (OpenTelemetry vs none), propagation
header standard, target sampling rate and budget, span attributes needed for analysis, log-correlation
requirements, IAM model, and cost ceiling.

## Output
A Cloud Trace configuration (OpenTelemetry + Cloud Trace exporter across services, consistent context
propagation, sampling rate, meaningful span attributes, log↔trace correlation) with least-privilege IAM,
plus verification that traces appear with the correct parent/child spans and propagate across services.

## Notes
- Gotchas: **broken context propagation** (mismatched/missing headers, or a hop that does not forward them)
  yields orphan spans and disconnected traces — standardize one header end-to-end; **sampling** means most
  requests are not traced (do not expect every request); **PII in span attributes** is a leak; deep trees
  can exceed the **spans-per-trace** limit; auto-instrumented GCP front ends may already create root spans —
  avoid double-rooting; trace retention is limited (~30 days).
- IaC/CLI: Terraform `google_project_service` (cloudtrace) and IAM bindings; instrumentation via
  OpenTelemetry SDK + Cloud Trace exporter in app config (not Terraform). CLI `gcloud trace traces list`
  and `gcloud trace traces describe <TRACE_ID>` to verify spans/waterfall.
