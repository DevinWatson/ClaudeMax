---
name: gcp-cloud-data-fusion
description: Use when designing, provisioning, securing, or operating Cloud Data Fusion — Google Cloud's fully managed, code-free visual data integration service built on open-source CDAP for building ETL/ELT pipelines via a drag-and-drop UI (batch and realtime pipelines, the Wrangler for data prep, a plugin/connector ecosystem, the Hub, reusable plugins, triggers and schedules), executing on ephemeral Dataproc, plus instance editions/sizing, namespaces, IAM, networking, and cost. Loads the Cloud Data Fusion knowledge: provision an instance, build a visual pipeline with Wrangler and connectors, schedule it, and verify a run produces correct output. Consumed by the Cloud Data Fusion specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they handle visual ETL (Cloud Data Fusion).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-data-fusion, data-analytics, etl, cdap, visual-pipelines]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Data Fusion

Google Cloud's fully managed, **code-free visual data integration** service built on the open-source
**CDAP** project. You build ETL/ELT pipelines by dragging and connecting sources, transforms, and
sinks in a browser UI; pipelines execute as Spark/MapReduce jobs on **ephemeral Dataproc** clusters.

## Core concepts and components
- **Instance** — the managed CDAP deployment (Developer / Basic / Enterprise editions) hosting the UI
  and metadata; you create one per environment/region.
- **Pipelines** — **batch** and **realtime** DAGs of nodes (sources → transforms → sinks); deployed
  and run from the Studio.
- **Wrangler** — interactive data-prep tool to build transformation **directives** (parse, filter,
  cast, mask) on a sample, then materialize them into a pipeline.
- **Plugins / connectors / Hub** — a large library of sources/sinks (BigQuery, Cloud Storage, JDBC,
  databases, SaaS), transforms, and actions; the **Hub** distributes reusable plugins, pipelines, and
  drivers; you can add custom plugins.
- **Execution** — pipelines provision **ephemeral Dataproc** clusters (or use a compute profile) and
  tear them down after the run; **preview** runs against a sample.
- **Triggers / schedules** — time- or event-based scheduling and pipeline-to-pipeline triggers;
  **namespaces** isolate environments within an instance.

## Configuration and sizing
- Pick the **edition** (Enterprise for production: streaming, HA, more concurrency) and **region**;
  size via the **compute profile** (Dataproc machine type, worker count, autoscaling) per pipeline.
  Use namespaces to separate dev/prod. Enterprise is required for realtime pipelines and higher
  concurrency.

## Security and IAM
- Grant the **Data Fusion service account** and the **Dataproc runner service account** least-privilege
  roles (scoped BigQuery/GCS/source access); use `roles/datafusion.admin`/`viewer` for operators. Run
  in a **private instance** (peered VPC, no public IP) where required; store credentials/secrets in the
  secure store / Secret Manager; apply **CMEK**; audit via Cloud Audit Logs. Namespace-level RBAC
  isolates teams.

## Cost levers
- Two cost components: the **instance** (billed per-hour by edition — the biggest fixed lever; pause or
  delete dev instances when idle) and the **ephemeral Dataproc** compute per pipeline run (right-size
  the compute profile, autoscale, use preview/sample for dev). Prefer Basic/Developer editions for
  non-production; consolidate pipelines per instance.

## Scaling and limits
- Pipeline runtime scales with the Dataproc compute profile (workers/autoscaling); concurrency and
  realtime support depend on edition. Limits: concurrent runs per instance, plugin compatibility,
  instance count/region quotas. Scale out by larger compute profiles or splitting work across
  pipelines.

## Operating procedure
1. **Provision** — enable the Data Fusion + Dataproc APIs, create the **instance** (Terraform
   `google_data_fusion_instance`, chosen edition/region, private if needed), and the **runner service
   account** with scoped roles.
2. **Configure** — build the pipeline in Studio (sources, Wrangler transforms, sinks), set a
   **compute profile** (Dataproc sizing/autoscaling), add **macros** for parameterization, deploy it,
   and create **schedules/triggers**; use **namespaces** for env isolation.
3. **Secure** — scope both service accounts least-privilege, use a private peered instance, store
   secrets in the secure store, apply CMEK, and set namespace RBAC.
4. **Verify** — apply [[verify-by-running]]: **preview** the pipeline on a sample to confirm correct
   transforms, deploy and **run** it, confirm the run reaches `COMPLETED` (via the CDAP REST API /
   `gcloud beta data-fusion` / the UI run history), and confirm the sink holds correct output (e.g.
   `bq query` the BigQuery target) — capture the run status and a sample result.

## Inputs
Sources and sinks, transformation requirements, batch-vs-realtime, expected data volume, schedule/
trigger needs, edition + region, private-networking requirement, IAM/service-account scope, CMEK
requirement, and cost constraints.

## Output
A Cloud Data Fusion setup (instance with edition/region, deployed visual pipeline using Wrangler +
connectors, a sized compute profile, schedules/triggers, namespaces) with least-privilege IAM, plus
verification of a successful run and correct sink output.

## Notes
- Gotchas: the **instance bills per hour regardless of pipeline activity** — idle dev instances are a
  common cost surprise (pause/delete them); private instances need VPC peering set up first; pipeline
  runs spin up ephemeral Dataproc, so failures often trace to the runner SA's missing permissions or
  the compute profile; plugin versions must be compatible with the instance's CDAP version; Wrangler
  directives operate on a sample, so validate on full data. Cloud Data Fusion is the MANAGED visual ETL
  service — cloud-agnostic pipeline DESIGN belongs to data/etl-architect.
- IaC/CLI: Terraform `google_data_fusion_instance`, plus `google_project_service`,
  `google_service_account`, and VPC peering resources. CLI `gcloud beta data-fusion instances`; the
  **CDAP REST API** (and Pipeline Studio UI) for pipeline deploy/run/schedule operations.
