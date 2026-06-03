---
name: gcp-managed-spark
description: Use when designing, provisioning, securing, or operating Dataproc — Google Cloud's fully managed Apache Spark and Hadoop service for running Spark/Hadoop/Hive/Presto/Flink jobs on clusters or serverless (Dataproc Serverless for Spark / Spark batches and interactive sessions, Dataproc on GKE), with cluster shapes (master/worker/preemptible-secondary), autoscaling policies, initialization actions, the component gateway, and ephemeral job-scoped clusters, plus machine sizing, IAM/service accounts, Kerberos/Personal Cluster Auth, CMEK, and cost (preemptible VMs, serverless). Loads the Dataproc knowledge: choose cluster vs serverless, size and autoscale workers, submit Spark/Hadoop jobs, and verify a job succeeds with correct output. Consumed by the Dataproc specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they handle managed Spark/Hadoop (Dataproc / Managed Spark).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, managed-spark, data-analytics, dataproc, spark, hadoop]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Dataproc (Managed Spark)

Google Cloud's fully managed **Apache Spark and Hadoop** service. It runs the open-source big-data
ecosystem (Spark, Hadoop/MapReduce, Hive, Presto/Trino, Flink, Pig) either on managed **clusters** or
**serverless**, so you submit jobs without operating Hadoop yourself.

## Core concepts and components
- **Clusters** — managed clusters of a **master** node, **primary workers**, and optional
  **secondary (preemptible/Spot)** workers; you choose the image version (component versions) and
  optional components.
- **Dataproc Serverless** — **Spark batches** and **interactive sessions** with no cluster to manage;
  Dataproc autoscales the executors per workload (the modern default for many Spark jobs).
- **Dataproc on GKE** — run Dataproc jobs on an existing GKE cluster.
- **Jobs** — submit Spark/PySpark, SparkSQL, Hadoop, Hive, Presto, Flink jobs to a cluster or as a
  serverless batch.
- **Autoscaling policies** — scale worker (and secondary worker) counts to YARN demand within bounds.
- **Initialization actions** — startup scripts to install/configure software on cluster nodes.
- **Component Gateway** — secure web access to Spark/YARN/Jupyter/etc. UIs.
- **Ephemeral (job-scoped) clusters** — create a cluster for one job/workflow and delete it after — the
  recommended cost pattern.

## Configuration and sizing
- Choose **serverless** (bursty/independent jobs, no idle cost) vs a **cluster** (long-lived,
  interactive, or many small jobs). For clusters: pick master/worker **machine types**, worker count,
  **secondary preemptible** workers, disk, image version, and an **autoscaling policy**. For
  serverless: set executor sizing and autoscaling. Prefer **ephemeral** job-scoped clusters or
  serverless over long-running clusters.

## Security and IAM
- Run clusters/jobs under a least-privilege **service account** (cluster VM SA) with scoped
  GCS/BigQuery/source access, not the default Compute SA. Use **no-public-IP** clusters in a chosen
  VPC/subnet, **CMEK**, **Kerberos** (Secure Mode) or **Personal Cluster Authentication** for
  multi-tenant security, OS Login, and the Component Gateway (not open firewall ports) for UIs; grant
  operators `roles/dataproc.editor`/`viewer`; audit via Cloud Audit Logs.

## Cost levers
- Biggest levers: **ephemeral job-scoped clusters** or **serverless** instead of always-on clusters;
  **secondary preemptible/Spot workers** for fault-tolerant batch (large discount); right-size machine
  types and use **autoscaling** so idle workers drop; pick the right storage (GCS, not HDFS, for
  durable data so clusters can be torn down). Serverless bills per-workload, eliminating idle cost.

## Scaling and limits
- Autoscaling policies adjust worker count to YARN pending memory within min/max; serverless scales
  executors per batch. Limits: per-region CPU/IP/disk quotas, preemptible-VM availability (workers can
  be reclaimed — Spark reruns lost tasks), and cluster-per-project quotas. Scale via more/larger
  workers, autoscaling, or serverless.

## Operating procedure
1. **Provision** — enable the Dataproc API, create the **VM service account** with scoped roles and the
   VPC/subnet + staging **GCS** bucket; create a **cluster** (Terraform `google_dataproc_cluster` with
   machine types, secondary preemptible workers, autoscaling policy, no-public-IP) — or skip clusters
   entirely and use **serverless batches**.
2. **Configure** — set the image version + optional components, initialization actions, the
   **autoscaling policy** (`google_dataproc_autoscaling_policy`), Component Gateway, and labels; or
   define the serverless batch runtime config.
3. **Secure** — scope the VM SA least-privilege, use no-public-IP + subnet, enable CMEK and (for
   multi-tenant) Kerberos/Personal Cluster Auth, and reach UIs via Component Gateway only.
4. **Verify** — apply [[verify-by-running]]: submit the job (`gcloud dataproc jobs submit spark ...` or
   `gcloud dataproc batches submit ...`), confirm it reaches `DONE`/`SUCCEEDED`
   (`gcloud dataproc jobs describe` / `batches describe`), inspect the driver output/logs, and confirm
   the output landed in the sink (e.g. `gcloud storage ls` / `bq query`) — capture the job state and a
   sample of the output.

## Inputs
Job type (Spark/PySpark/Hive/Presto/etc.) + framework versions, data location/volume, batch-vs-
interactive + concurrency, cluster-vs-serverless preference, fault tolerance (preemptible tolerance),
machine sizing/autoscaling bounds, region + VPC, IAM/service-account scope, CMEK/Kerberos requirements,
and cost constraints.

## Output
A Dataproc setup (ephemeral/serverless or autoscaling cluster with right-sized + preemptible workers,
no-public-IP + CMEK, init actions, Component Gateway) under a least-privilege service account, plus
verification that a submitted job succeeds and writes correct output.

## Notes
- Gotchas: **long-running clusters bill continuously** — prefer ephemeral job-scoped clusters or
  serverless; **secondary workers are preemptible** and can vanish mid-job (fine for Spark retries, bad
  for HDFS data — keep durable data in **GCS**, not HDFS); the default Compute SA is over-privileged;
  image-version upgrades change component versions (pin them); Component Gateway is the safe way to
  reach UIs (don't open firewall ports); autoscaling reacts to YARN memory, not CPU. Dataproc owns the
  MANAGED Spark/Hadoop runtime (the GCP analog of **AWS EMR**); cloud-agnostic pipeline DESIGN belongs
  to data/etl-architect.
- IaC/CLI: Terraform `google_dataproc_cluster`, `google_dataproc_autoscaling_policy`,
  `google_dataproc_job`, plus `google_project_service`, `google_service_account`,
  `google_storage_bucket`. CLI `gcloud dataproc clusters`, `gcloud dataproc jobs submit`,
  `gcloud dataproc batches submit` (serverless), `gcloud dataproc autoscaling-policies`.
