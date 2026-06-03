---
name: gcp-dataform
description: Use when designing, provisioning, securing, or operating Dataform — Google Cloud's managed service for developing, versioning, and orchestrating SQL transformation workflows inside BigQuery (SQLX definitions, dependency graph with ref(), incremental tables/views/materialized views, assertions/data tests, declarations, includes/JS, Git-backed repositories, release configs and scheduled workflow executions), plus IAM/service accounts and cost. Loads the Dataform knowledge: model a SQLX dependency graph, add assertions and incremental logic, wire a Git repo and scheduled releases, and verify a compiled and executed workflow in BigQuery. Consumed by the Dataform specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they handle in-warehouse transforms (Dataform).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, dataform, data-analytics, sqlx, bigquery, transformations, elt]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Dataform

Google Cloud's managed service for developing and operating **SQL-based transformation workflows
inside BigQuery** (the T/ELT layer). You define transformations as code, Dataform builds a dependency
graph, compiles it to BigQuery SQL, and executes it in dependency order on a schedule.

## Core concepts and components
- **Repository** — a Git-backed container (Cloud Source Repositories, GitHub, GitLab) holding the
  project; **workspaces** are editable dev branches.
- **SQLX** — SQL plus a config block; each `.sqlx` file defines a **table**, **view**,
  **materialized view**, **incremental** table, **operations**, or **assertion**.
- **`ref()` / dependency graph** — referencing another dataset with `ref("name")` auto-builds the DAG
  and execution order; `declaration` registers external source tables.
- **Incremental tables** — process only new rows (`when(incremental(), …)`) instead of full rebuilds.
- **Assertions / data tests** — declarative quality checks (uniqueness, non-null, row conditions, or
  custom SQL) that fail the run when violated.
- **Includes / JS** — reusable JavaScript constants and functions for templating SQL.
- **Release configurations + workflow configurations** — compile a Git commit into a **release** and
  **schedule** workflow executions (full graph or tags) against a target.

## Configuration and sizing
- Dataform itself has no clusters — execution cost is the underlying **BigQuery** compute. Configure
  the default BigQuery **location**, target dataset/project, assertion schema, and `vars`. Use
  **tags** to run subsets, **incremental** models for large fact tables, and schedule frequency to
  match data freshness needs.

## Security and IAM
- Dataform executes via a **service account** (the Dataform SA or a user-specified one) that needs
  BigQuery roles (`roles/bigquery.dataEditor`, `jobUser`) scoped to the target datasets, plus read on
  sources. Grant developers `roles/dataform.editor`/`admin` on the repository least-privilege; store
  Git credentials in **Secret Manager**; respect BigQuery column/row-level security on referenced
  tables; audit via Cloud Audit Logs.

## Cost levers
- Cost flows through BigQuery, so the levers are BigQuery's: prefer **incremental** over full-refresh
  tables, materialize only what's reused, partition/cluster output tables, run on the right
  reservation, and avoid over-frequent scheduled runs. Assertions also run queries — keep them
  targeted. Dataform compilation/orchestration is free.

## Scaling and limits
- Scales with BigQuery (serverless); workflow execution runs the DAG with bounded parallelism. Limits:
  Dataform API quotas, repository/workspace counts, and BigQuery job concurrency on the target
  project/reservation. Large graphs benefit from tags and incremental builds to bound per-run work.

## Operating procedure
1. **Provision** — enable the Dataform API, create the **repository** (Terraform
   `google_dataform_repository`) and connect the Git remote; configure the execution **service
   account** and grant it scoped BigQuery roles.
2. **Configure** — author SQLX definitions, `declaration`s for sources, `ref()` dependencies,
   incremental logic, assertions, and includes; set `dataform.json` (default location, dataset,
   vars); create **release** + **workflow** configs (`google_dataform_repository_release_config`,
   `google_dataform_repository_workflow_config`) with a schedule.
3. **Secure** — scope the execution SA and developer IAM least-privilege, store Git tokens in Secret
   Manager, and honor BigQuery data-access policies.
4. **Verify** — apply [[verify-by-running]]: **compile** the graph and confirm no errors, trigger a
   **workflow invocation** (`gcloud dataform ...` or the API), confirm it reaches a succeeded state,
   that assertions passed, and that the output tables exist with expected rows in BigQuery
   (`bq query`/`bq show`) — capture the invocation state and a sample result.

## Inputs
Source tables/declarations, the transformation logic + target datasets, full-vs-incremental strategy,
data-quality assertions, schedule/freshness needs, BigQuery location + reservation, Git remote,
IAM/service-account scope, and cost constraints.

## Output
A Dataform repository (SQLX models with a `ref()` dependency graph, incremental tables, assertions,
release + scheduled workflow configs) executing into BigQuery with least-privilege IAM, plus
verification of a clean compile and a succeeded workflow invocation with passing assertions.

## Notes
- Gotchas: Dataform is BigQuery-only (it orchestrates SQL in the warehouse, it is not a general
  runtime); incremental models need a correct unique key and `updates`/merge logic or they duplicate
  rows; assertions that query large tables add cost; declarations must match real source schemas;
  workspace changes must be committed/pushed and a release recompiled to take effect; the execution SA
  is a common least-privilege miss. Dataform is the GCP-native analog of **dbt** — choose it when you
  want managed in-BigQuery transforms; cloud-agnostic ELT modeling patterns are data/etl-architect's.
- IaC/CLI: Terraform `google_dataform_repository`, `google_dataform_repository_release_config`,
  `google_dataform_repository_workflow_config`, plus `google_project_service`,
  `google_service_account`. CLI `gcloud dataform` (repositories, workspaces, compilation-results,
  workflow-invocations) and the Dataform REST API / VS Code workflows.
