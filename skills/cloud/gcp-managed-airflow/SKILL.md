---
name: gcp-managed-airflow
description: Use when designing, provisioning, securing, or operating Cloud Composer — Google Cloud's fully managed Apache Airflow service for orchestrating workflows as DAGs (Composer 2/3 environments on GKE Autopilot, the DAGs Cloud Storage bucket, operators/sensors/hooks including Google Cloud operators, connections and variables, the Airflow web UI, environment scaling for scheduler/web/worker, and the managed Airflow/PyPI dependency model), plus environment sizing, IAM/service accounts, private environments, CMEK, and cost. Loads the Cloud Composer knowledge: provision an environment, deploy and schedule DAGs, wire connections, scale workers, and verify a DAG run succeeds. Consumed by the Cloud Composer specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they handle workflow orchestration (Cloud Composer / Managed Airflow).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, managed-airflow, data-analytics, cloud-composer, airflow, orchestration]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Composer (Managed Airflow)

Google Cloud's fully managed **Apache Airflow** service. It runs Airflow's scheduler, web server, and
workers on a Google-managed GKE environment so you author **DAGs** (workflow definitions) in Python and
let Composer handle the infrastructure, scaling, and upgrades.

## Core concepts and components
- **Environment** — a managed Airflow deployment (**Composer 2/3** on **GKE Autopilot**) in a region;
  the unit you provision, version, and scale.
- **DAGs** — Python files defining tasks and dependencies; you deploy them by syncing to the
  environment's **DAGs Cloud Storage bucket** (also `plugins/`, `data/`).
- **Operators / sensors / hooks** — task building blocks; the rich **Google Cloud operators**
  (BigQuery, Dataflow, Dataproc, GCS, Pub/Sub, etc.) integrate other services; **sensors** wait on
  conditions.
- **Connections / variables** — credentials/endpoints and config stored in Airflow's metadata DB
  (back connections by **Secret Manager**).
- **Web UI** — the Airflow UI for triggering, monitoring, logs, and backfills.
- **Scaling components** — scheduler count, web-server + worker CPU/memory, and worker
  min/max **autoscaling** (Composer 2/3 scale workers to task load).
- **Dependencies** — install **PyPI packages** at the environment level; the image bundles a specific
  Airflow + Python version.

## Configuration and sizing
- Pick **Composer version** (2/3) + Airflow version + region. Size the **environment**: scheduler
  count, web-server resources, and **worker** CPU/memory + min/max autoscaling to match concurrent task
  load. Set environment **variables**, **PyPI** packages, and Airflow config overrides
  (`core-parallelism`, `celery` settings). Use a **private environment** where required.

## Security and IAM
- Run the environment under a least-privilege **service account** granted only the roles its DAGs need
  (scoped BigQuery/Dataflow/Dataproc/GCS access), not broad project owner. Store connection secrets in
  **Secret Manager** (Airflow Secrets backend). Use a **Private IP / private environment** + authorized
  networks, **CMEK**, and Identity-Aware Proxy for the web UI; grant operators
  `roles/composer.user`/`admin` least-privilege; audit via Cloud Audit Logs.

## Cost levers
- Composer bills for the **environment compute continuously** (scheduler/web/workers + GKE) even when
  idle — the dominant lever. Right-size workers and use **autoscaling** (low min workers), consolidate
  DAGs into fewer environments, pause unused DAGs, and **delete dev environments** when not in use. The
  work DAGs trigger in other services (BigQuery/Dataflow/Dataproc) is billed there — keep heavy compute
  out of workers.

## Scaling and limits
- Workers autoscale between min/max to task demand; scheduler/parallelism settings bound concurrent
  task execution. Limits: environment count/region quotas, GKE node capacity, metadata-DB pressure
  from very large/frequent DAGs, and PyPI dependency conflicts with the bundled image. Scale by more
  workers/schedulers or splitting DAGs across environments.

## Operating procedure
1. **Provision** — enable the Composer API, create the **environment** (Terraform
   `google_composer_environment`, chosen Composer/Airflow version, region, private config) with a
   least-privilege **service account**.
2. **Configure** — set environment size (scheduler/web/worker + autoscaling), **PyPI** packages,
   Airflow config overrides, **variables**, and **connections** (via Secret Manager); deploy **DAGs**
   to the DAGs GCS bucket and schedule them.
3. **Secure** — scope the environment SA least-privilege, use a private environment + IAP for the UI,
   store secrets in Secret Manager, apply CMEK, and grant operator IAM least-privilege.
4. **Verify** — apply [[verify-by-running]]: confirm the environment is `RUNNING`
   (`gcloud composer environments describe`), the DAG parses with no import errors and is unpaused,
   then **trigger** a run (`gcloud composer environments run ... dags trigger` / the UI) and confirm
   the DAG run state is `success` with each task succeeded and the downstream effect occurred — capture
   the run state and task log evidence.

## Inputs
The workflows/DAGs to orchestrate, which GCP/external services the tasks touch, schedule + concurrency
needs, expected task load (for worker sizing), Composer/Airflow version, region, private-networking
requirement, IAM/service-account scope, secret/connection needs, CMEK requirement, and cost
constraints.

## Output
A Cloud Composer setup (sized environment with worker autoscaling, deployed scheduled DAGs, PyPI
packages, Secret-Manager-backed connections, private config) with a least-privilege service account,
plus verification that the environment is healthy and a DAG run succeeds.

## Notes
- Gotchas: the environment **bills continuously** even with no DAGs running (right-size + delete dev
  envs); DAG files must land in the **DAGs GCS bucket** and parse cleanly or they silently fail to
  appear; **PyPI** packages must be compatible with the image's Airflow/Python version (conflicts break
  the whole environment); the environment SA — not the operator — runs the tasks, so its IAM must cover
  every service the DAGs touch; heavy compute inside workers starves the scheduler (offload to
  Dataflow/Dataproc/BigQuery). Cloud Composer owns the MANAGED Airflow service (the GCP analog of **AWS
  MWAA**); cloud-agnostic pipeline orchestration DESIGN belongs to data/etl-architect.
- IaC/CLI: Terraform `google_composer_environment`, plus `google_project_service`,
  `google_service_account`, `google_storage_bucket` (DAGs bucket is managed by the environment). CLI
  `gcloud composer environments` (create, update, run, storage); deploy DAGs with `gcloud composer
  environments storage dags import` or `gsutil`/`gcloud storage` to the DAGs bucket.
