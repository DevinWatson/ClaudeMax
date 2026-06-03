---
name: aws-x-ray
description: Use when designing, instrumenting, securing, or operating AWS X-Ray — the managed distributed-tracing service that collects traces across microservices to render a service map, latency/error analysis, and root-cause insight (AWS X-Ray). Loads the X-Ray knowledge: traces, segments and subsegments, the trace header and context propagation, the X-Ray daemon vs ADOT/OpenTelemetry collector, the SDK and auto-instrumentation, the service map, sampling rules, trace and group filter expressions, annotations vs metadata, insights and anomaly detection, integration with Lambda/API Gateway/ECS/EKS/EC2, IAM permissions, cost levers, retention/limits, and verification by generating traffic and confirming traces and the service map populate. The 2nd consumer is the AWS role team (aws-cloud-architect / observability roles) instrumenting distributed systems. Consumed by the X-Ray specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, x-ray, developer-tools, tracing, observability, devtools]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS X-Ray

A managed **distributed-tracing** service. It collects **traces** of requests as they flow through your
microservices, stitches them into a **service map**, and surfaces latency, error/fault rates, and
**root-cause** insight across the call graph. It answers "where did this request spend time / fail",
complementing metrics and logs in an observability stack.

## Core concepts and components
- **Trace / segment / subsegment** — a **trace** is one request end-to-end; each service emits a
  **segment**, and downstream calls (DB, HTTP, AWS SDK) become **subsegments**. The **trace header**
  (`X-Amzn-Trace-Id`) propagates context between services.
- **Collection agents** — the legacy **X-Ray daemon** or the **ADOT (OpenTelemetry) collector**
  receives spans/segments and forwards them to X-Ray; auto-instrumentation captures AWS SDK/HTTP/SQL.
- **SDK / instrumentation** — language SDKs (or OTel) create segments, capture downstream calls, and add
  **annotations** (indexed, filterable) and **metadata** (non-indexed context).
- **Service map** — the auto-generated topology with latency/error/fault stats per node and edge.
- **Sampling** — **sampling rules** (reservoir + rate) decide which requests are traced to control cost
  and volume.
- **Filtering & insights** — **filter expressions** and **groups** to slice traces; **Insights** detect
  anomalies/incidents automatically.

## Configuration and sizing
- Instrument via the **SDK or ADOT/OpenTelemetry**; run the **daemon/collector** as a sidecar (ECS/EKS)
  or it's built in for **Lambda**. Tune **sampling rules** — trace a fixed reservoir plus a small
  percentage of the rest — to keep volume/cost sane at scale. Add **annotations** for the dimensions you
  filter on (route, customer, version). Enable **API Gateway / Lambda / load balancer** tracing flags.

## Security and IAM
- Instrumented services need IAM to **`xray:PutTraceSegments`** and **`xray:PutTelemetryRecords`**;
  readers/consoles need **`xray:Get*`/`BatchGet*`** — grant least-privilege, not wildcards. Avoid putting
  PII/secrets in **annotations/metadata** (they are stored and queryable). Use the managed
  `AWSXRayDaemonWriteAccess` policy as a baseline and tighten it. Encryption can use an AWS-managed or
  **customer KMS key**.

## Cost levers
- Billed per **trace recorded**, **retrieved**, and **scanned**. Levers: **sampling** is the primary
  lever — lower the rate/reservoir for high-volume, low-value paths and trace errors/slow paths more;
  avoid over-broad filter scans; don't double-instrument (SDK + OTel) the same calls; keep annotations
  lean. Storage/retention is fixed (~30 days) — no idle compute cost.

## Scaling and limits
- Traces retained ~**30 days**; trace document and annotation-count limits per segment; sampling rule
  and group quotas per account (raisable). Very high request rates require careful sampling to avoid
  throttling/cost spikes. The daemon/collector must be reachable from every instrumented task.

## Operating procedure
1. **Provision** — enable tracing on the integrations (Lambda/API Gateway/ELB flags), deploy the
   **daemon or ADOT collector** (sidecar/daemonset) and grant the **IAM** write permissions; manage
   sampling/groups via Terraform `aws_xray_sampling_rule` / `aws_xray_group`.
2. **Configure** — instrument the app with the **SDK/OpenTelemetry**, add **annotations**, set
   **sampling rules**, and create **groups/filters** and **Insights** for the views you need.
3. **Secure** — least-privilege `xray:*` write/read split, no PII in annotations/metadata, KMS
   encryption.
4. **Verify** — apply [[verify-by-running]]: generate representative traffic, then confirm **traces
   appear** (`aws xray get-trace-summaries` / `batch-get-traces`) and the **service map** renders the
   expected nodes/edges with latency/error stats, and that a filter expression returns the traced
   requests — capture the trace summaries observed.

## Inputs
Service topology and runtimes, integration points (Lambda/API Gateway/ECS/EKS/EC2), instrumentation
approach (SDK vs ADOT/OpenTelemetry), key annotations to index, target sampling rate/volume, latency/
error questions to answer, IAM and KMS requirements, cost constraints.

## Output
An X-Ray setup — instrumented services emitting segments via the daemon/ADOT collector, tuned sampling
rules, useful annotations, groups/filters and Insights, and least-privilege IAM — plus verification that
traffic produces traces and a populated service map with latency/error breakdowns.

## Notes
- Gotchas: **without sampling** discipline, cost and volume explode on high-traffic services;
  **context/trace-header propagation** must be continuous or the map fragments into disconnected
  segments; **annotations are indexed/filterable, metadata is not** — and neither should hold PII;
  double-instrumenting (SDK + OTel) the same calls produces duplicate subsegments; the daemon/collector
  must be reachable and IAM-permitted or traces silently drop; traces expire (~30 days) so X-Ray is not
  long-term storage; X-Ray traces requests — pair it with metrics/logs for full observability.
- IaC/CLI: Terraform `aws_xray_sampling_rule`, `aws_xray_group`,
  `aws_xray_encryption_config` (no resource for app instrumentation itself — that is SDK/ADOT config).
  CLI `aws xray put-trace-segments`, `get-trace-summaries`, `batch-get-traces`,
  `get-service-graph`, `create-sampling-rule`, `create-group`. CloudFormation
  `AWS::XRay::SamplingRule`, `AWS::XRay::Group`.
