---
name: gcp-dataflow
description: Use when designing, provisioning, securing, or operating Dataflow — Google Cloud's serverless, fully managed Apache Beam runner for unified streaming and batch data processing (pipelines, windowing/triggers/watermarks, sources/sinks, Dataflow templates — classic and Flex, Streaming Engine, Dataflow Prime), plus worker machine sizing, horizontal/vertical autoscaling, service accounts/IAM, CMEK, VPC/private workers, and cost. Loads the Dataflow knowledge: author or run a Beam pipeline (streaming or batch), pick windowing and autoscaling, deploy from a template, and verify the job drains/completes with correct output. Consumed by the Dataflow specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they handle stream/batch processing (Dataflow).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, dataflow, data-analytics, apache-beam, streaming, batch, etl]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Dataflow

Google Cloud's serverless, fully managed runner for **Apache Beam** pipelines. One programming model
expresses both **streaming** and **batch** processing; Dataflow provisions and autoscales the workers,
shuffles data, and handles fault tolerance.

## Core concepts and components
- **Apache Beam** — the SDK (Java, Python, Go) defining a pipeline as a DAG of `PTransform`s over
  `PCollection`s; Dataflow is the **runner** that executes it.
- **Batch vs streaming** — the same pipeline runs bounded (batch) or unbounded (streaming) data;
  streaming reads from Pub/Sub, Kafka, etc., and is long-lived.
- **Windowing / triggers / watermarks** — group unbounded data into **fixed/sliding/session** windows;
  **watermarks** track event-time progress; **triggers** + **allowed lateness** control when results
  emit; handle late/out-of-order data explicitly.
- **Sources and sinks** — connectors (I/O) for Pub/Sub, BigQuery, Cloud Storage, Bigtable, Kafka,
  JDBC, and more.
- **Templates** — **classic** (staged graph) and **Flex** (containerized) templates let you launch
  parameterized jobs without redeploying code; Google provides many ready-made templates.
- **Streaming Engine** — offloads shuffle/state from worker disks to the backend for smoother
  autoscaling. **Dataflow Prime** — vertical autoscaling + right-fitting per stage.

## Configuration and sizing
- Choose worker **machine type**, **disk size**, **max workers**, and region/zone; enable
  **horizontal autoscaling** (and **Streaming Engine** for streaming, **Dataflow Prime** for vertical
  right-fitting). Pick FlexRS for cost-flexible batch. Set the windowing/trigger strategy to match
  latency vs completeness needs.

## Security and IAM
- Run jobs under a dedicated **worker service account** with least-privilege roles
  (`roles/dataflow.worker` plus scoped source/sink access) — not the default Compute SA. Use
  **private (no-public-IP) workers** in a chosen VPC/subnetwork, **VPC-SC** to fence egress, **CMEK**
  for state/temp data, and `roles/dataflow.developer`/`viewer` for operators; audit via Cloud Audit
  Logs.

## Cost levers
- You pay for **worker vCPU/memory/disk per second** plus Streaming Engine/shuffle data processed.
  Levers: cap **max workers** and right-size machine type, enable autoscaling so idle capacity drains,
  use **FlexRS** for non-urgent batch, **Streaming Engine/Prime** to reduce over-provisioning, prefer
  batch over always-on streaming when latency allows, and **drain** (not cancel) streaming jobs to
  avoid reprocessing. Watch for hot keys causing skew and wasted workers.

## Scaling and limits
- Autoscaling adjusts worker count to backlog/throughput within `max_workers`; streaming throughput is
  bounded by source/sink and key parallelism (hot keys serialize). Per-project quotas on CPUs,
  in-use IPs, and concurrent jobs apply; raise via quotas. Shuffle/state size affects streaming
  scaling — use Streaming Engine.

## Operating procedure
1. **Provision** — enable the Dataflow + Compute APIs, create the **worker service account**, a
   staging/temp **Cloud Storage** bucket, and the VPC/subnet (Terraform `google_project_service`,
   `google_service_account`, `google_storage_bucket`); grant source/sink roles.
2. **Configure** — author the Beam pipeline (windowing, triggers, I/O) or pick a Google template;
   launch as a **Flex template** job (`google_dataflow_flex_template_job`) or classic job with machine
   type, max workers, Streaming Engine/Prime, and private workers.
3. **Secure** — scope the worker SA least-privilege, set `--no_use_public_ips` + subnetwork, apply
   CMEK and VPC-SC, and restrict launch permissions.
4. **Verify** — apply [[verify-by-running]]: launch the job and confirm it reaches `JOB_STATE_RUNNING`
   (streaming) or `JOB_STATE_DONE` (batch) via `gcloud dataflow jobs describe`, check the job metrics
   /element counts and that the sink received correct output (e.g. query BigQuery or read GCS), then
   **drain** a streaming job cleanly — capture the actual job state and output counts.

## Inputs
Streaming vs batch, source(s) and sink(s), event-time/windowing + latency-vs-completeness needs,
expected throughput + peak, machine type/max-workers preference, region + VPC, IAM/service-account
scope, CMEK/VPC-SC requirements, and cost constraints.

## Output
A Dataflow setup (worker service account + staging bucket, Beam pipeline or template job with chosen
windowing, autoscaling/Streaming Engine, private workers) with least-privilege IAM, plus verification
that the job runs/completes and the sink holds correct output.

## Notes
- Gotchas: **cancel** vs **drain** — cancel drops in-flight data, drain flushes it; hot keys serialize
  and stall autoscaling; Streaming Engine is usually required for healthy streaming autoscaling;
  classic templates stage a fixed graph (Flex is more flexible but slower to start); watermarks +
  allowed lateness determine when late data is dropped; default Compute SA is over-privileged. Dataflow
  owns the MANAGED Beam runtime — cloud-agnostic pipeline DESIGN belongs to data/etl-architect.
- IaC/CLI: Terraform `google_dataflow_job`, `google_dataflow_flex_template_job`, plus
  `google_project_service`, `google_service_account`, `google_storage_bucket`. CLI
  `gcloud dataflow jobs` (run, describe, drain, cancel, list) and `gcloud dataflow flex-template`;
  the Apache Beam SDK (Python/Java/Go) for pipeline code.
