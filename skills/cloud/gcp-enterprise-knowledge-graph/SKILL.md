---
name: gcp-enterprise-knowledge-graph
description: Use when designing, provisioning, securing, or operating Enterprise Knowledge Graph (EKG) — Google Cloud's managed service for entity reconciliation and knowledge-graph construction: running entity reconciliation jobs that cluster and link records (people, organizations, etc.) across BigQuery datasets into resolved entities, building a knowledge graph from the reconciled entities, and the Knowledge Graph search/lookup API backed by Google's public KG, plus schema mapping, BigQuery I/O, IAM, residency, and cost (Enterprise Knowledge Graph). Loads the EKG knowledge: configure schema mapping, run a reconciliation job over BigQuery, construct/query the graph, secure the identity, and verify resolved entities. Consumed by the EKG specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they add entity resolution.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, enterprise-knowledge-graph, ai-ml, entity-reconciliation, bigquery, knowledge-graph]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Enterprise Knowledge Graph

A managed service for **entity reconciliation** (record linkage / entity resolution) and **knowledge
graph construction**. You point it at structured records in BigQuery, it clusters and links records
that refer to the same real-world entity, and it can build and serve a knowledge graph plus look up
entities in Google's public Knowledge Graph.

## Core concepts and components
- **Entity reconciliation** — the core capability: an asynchronous **reconciliation job** ingests one
  or more **BigQuery** tables, applies Google's machine-learning entity-resolution models to cluster
  records that represent the same entity, and writes resolved clusters (with a stable entity ID) back
  to BigQuery.
- **Schema mapping** — you map your source columns to EKG's expected **entity schema** (entity type +
  properties such as name, address, identifiers) so the models know how to compare records.
- **Entity types** — supported types include people (`Person`), organizations (`Organization`),
  and local businesses; the type drives which matching signals apply.
- **Knowledge graph construction** — build a graph from reconciled entities and their relationships.
- **Knowledge Graph search / lookup API** — query Google's public Knowledge Graph (the Search API,
  successor to Freebase) to look up and enrich entities by name/ID.

## Configuration and sizing
- Define the **schema mapping** from your BigQuery columns to the EKG entity schema and pick the
  **entity type**; quality depends heavily on mapping identifiers and names correctly. Choose the
  region for the job and the BigQuery datasets. Sizing is driven by record count — larger datasets
  mean longer reconciliation jobs; there is no infrastructure to provision (fully managed jobs).

## Security and IAM
- Run reconciliation with a dedicated **service account** scoped to
  `roles/enterpriseknowledgegraph.admin`/`.editor` and least-privilege BigQuery access to only the
  source/output datasets. Records often contain **PII**: restrict dataset access, CMEK-encrypt the
  BigQuery datasets, enable **VPC Service Controls**, keep data in the required region for residency,
  and audit via Cloud Audit Logs.

## Cost levers
- Cost is driven by **reconciliation job volume** (records processed) plus the BigQuery storage/query
  it reads and writes, and per-call charges for the Knowledge Graph search API. Levers: reconcile only
  the columns/records needed, de-duplicate inputs first, avoid unnecessary re-runs (entities are
  stable), and prune BigQuery output retention.

## Scaling and limits
- Reconciliation jobs scale with input size (the service manages the compute); very large datasets
  take longer. Per-project quotas govern concurrent jobs and Knowledge Graph search QPS — raise via
  the quotas page. Regional availability is limited — confirm the service is offered in the target
  region.

## Operating procedure
1. **Provision** — enable the Enterprise Knowledge Graph API
   (`gcloud services enable enterpriseknowledgegraph.googleapis.com`; Terraform
   `google_project_service`), create the least-privilege **service account**, and prepare the source
   and output **BigQuery** datasets.
2. **Configure** — define the **schema mapping** (source columns → entity schema), pick the **entity
   type** and region, and configure the **reconciliation job** input/output BigQuery tables.
3. **Secure** — scope the service account least-privilege, restrict + CMEK-encrypt the BigQuery
   datasets (PII), enable VPC-SC, and keep data in the residency region.
4. **Verify** — apply [[verify-by-running]]: confirm the API is enabled
   (`gcloud services list`), run the reconciliation job, confirm it reaches a succeeded state, and
   query the output BigQuery table to confirm records are clustered into resolved entities with stable
   IDs (and/or a Knowledge Graph lookup returns a sensible entity) — capture the actual output.

## Inputs
Source BigQuery dataset(s) + record volume, the source schema and the column→entity-schema mapping,
entity type(s), output dataset, region/residency, PII/encryption requirements, and IAM scope.

## Output
An Enterprise Knowledge Graph setup (schema mapping, reconciliation job over BigQuery writing resolved
entity clusters, optional graph construction / KG lookup, scoped service account, CMEK on datasets)
plus verification that records are reconciled into resolved entities with stable IDs.

## Notes
- Gotchas: reconciliation quality depends almost entirely on the **schema mapping** (map names and
  identifiers carefully); jobs are asynchronous and can take a while on large datasets; entity IDs are
  meant to be stable across runs (don't reconcile redundantly); records are usually PII (CMEK, VPC-SC,
  residency); regional availability is limited; the Knowledge Graph search API queries Google's
  PUBLIC graph (distinct from your reconciled private entities). This is entity resolution / KG
  construction — generic ML modeling belongs to Vertex AI.
- IaC/CLI: Terraform coverage is limited to `google_project_service` (enable) + IAM/BigQuery
  resources (`google_service_account`, `google_bigquery_dataset`); reconciliation jobs are created via
  the API/SDK rather than Terraform. CLI/SDK: the Enterprise Knowledge Graph REST/client libraries
  (`CreateEntityReconciliationJob`, list/get jobs) and the Knowledge Graph Search API for lookups.
