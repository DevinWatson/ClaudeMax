---
name: aws-opensearch-service
description: Use when designing, provisioning, securing, or operating Amazon OpenSearch Service — the managed search, log-analytics, and observability service running OpenSearch/Elasticsearch (Amazon OpenSearch Service). Loads the OpenSearch knowledge: managed domains (dedicated master/manager + data nodes, UltraWarm/cold tiers, instance/EBS sizing, multi-AZ standby), OpenSearch Serverless (collections for search/time-series/vector, OCUs), index design (shards/replicas, mappings, index templates, ISM lifecycle/rollover/aliases), Dashboards, ingestion (OpenSearch Ingestion/Data Prepper, Firehose, Logstash), search/aggregations, k-NN vector search, the security model (FGAC, IAM/SAML/Cognito, VPC, domain access policies, encryption), and scaling/cost levers. Covers domain sizing, index lifecycle, security, and verification. Consumed by the OpenSearch specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, opensearch-service, analytics, search, log-analytics, vector-search]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon OpenSearch Service

A **managed search, log-analytics, and observability** service running **OpenSearch** (and legacy
Elasticsearch). Runs as **managed domains** (clusters you size) or **OpenSearch Serverless**
(collections), with **OpenSearch Dashboards** for visualization and **k-NN vector search** for
semantic/RAG workloads.

## Core concepts and components
- **Managed domain** — a cluster of **data nodes** (index/search), optional **dedicated master/manager
  nodes** (cluster stability), and storage tiers: **hot** (data nodes), **UltraWarm** (S3-backed, cheap
  read-mostly), and **cold** (archived, attach on demand). **Multi-AZ with standby** for HA.
- **OpenSearch Serverless** — **collections** typed for **search**, **time-series**, or **vector**;
  capacity in **OpenSearch Compute Units (OCUs)** that auto-scale; no nodes/shards to manage.
- **Index design** — **shards** (primary + **replicas**), **mappings**, **index templates**, **ISM**
  (Index State Management) lifecycle policies with **rollover** and **aliases** (hot→UltraWarm→cold→
  delete). Shard sizing is the key tuning lever.
- **Ingestion** — **OpenSearch Ingestion** pipelines (managed Data Prepper), **Kinesis Data Firehose**,
  Logstash, or direct bulk API.
- **Search & analytics** — full-text search, **aggregations**, **k-NN vector** search for semantic
  search / RAG. **Dashboards** for visualization and observability.

## Configuration and sizing
- Size **data nodes** by hot data volume, indexing rate, and query concurrency; add **dedicated
  master/manager** nodes (3, odd) once the cluster is non-trivial for stability. Keep **shards ~10–50
  GB** and shard count proportional to data nodes (avoid oversharding). Use **ISM + UltraWarm/cold** to
  age out logs cheaply. Prefer **Serverless** for spiky/unpredictable or low-ops workloads. Use Multi-AZ
  with standby for production HA.

## Security and IAM
- Place domains in a **VPC** (preferred over public + IP/domain access policy). Enable **fine-grained
  access control (FGAC)** for index/document/field-level security mapped to IAM or **SAML/Cognito**
  users/roles. Enforce **encryption at rest (KMS)** and **node-to-node encryption** + HTTPS. Domain
  **access policies** gate the data-plane; restrict who can run cluster-admin APIs.

## Cost levers
- Biggest levers: right-size **data-node instance type/count** and **EBS**, move read-mostly data to
  **UltraWarm**/**cold** via ISM, avoid oversharding (wasted heap), and use **Serverless OCUs** for
  intermittent workloads (pay for OCUs vs always-on nodes). Reserved Instances for steady domains.
  Replicas double storage — tune replica count to durability needs.

## Scaling and limits
- Scale domains by changing instance type/count, EBS, or tiers (blue/green deployment — takes time and
  needs headroom). Serverless auto-scales OCUs within min/max. Per-cluster shard, field-mapping, and
  request-size limits; oversharding exhausts JVM heap. Hot→UltraWarm migration and domain config changes
  are background operations, not instant.

## Operating procedure
1. **Provision** — create the domain or serverless collection via Terraform
   `aws_opensearch_domain` / `aws_opensearchserverless_collection`, or
   `aws opensearch create-domain` / `aws opensearchserverless create-collection`; set engine version,
   topology, VPC.
2. **Configure** — data/master node counts + storage tiers (or OCU limits), index templates + mappings,
   **ISM** lifecycle (rollover → UltraWarm → cold → delete), ingestion pipeline, Dashboards.
3. **Secure** — VPC placement, FGAC + IAM/SAML/Cognito roles, KMS at rest + node-to-node encryption,
   domain access policy, serverless data-access + network policies.
4. **Verify** — apply [[verify-by-running]]: index a sample document (bulk/`_doc`), run a search/
   aggregation and confirm correct hits; confirm an **FGAC** test user sees only permitted
   indices/fields; confirm an **ISM** rollover/UltraWarm transition fires on the test index — capture the
   actual responses and cluster/index state (`_cluster/health`, `_cat/shards`).

## Inputs
Workload type (search/log-analytics/vector), data volume + indexing/query rate + retention, domain vs
serverless, HA needs (multi-AZ), shard/index strategy, ingestion path, security model (VPC/FGAC/
encryption/identity).

## Output
An OpenSearch setup (domain with node topology + storage tiers or serverless collection, index templates/
mappings, ISM lifecycle, ingestion pipeline, Dashboards, VPC + FGAC + encryption security) plus
verification of indexing, search, FGAC enforcement, and lifecycle transitions.

## Notes
- Gotchas: **oversharding** (too many small shards) exhausts JVM heap and degrades the cluster; no
  dedicated master nodes on a large cluster risks split-brain/instability; missing **ISM** lets log
  indices grow unbounded and blow up cost; scaling/version upgrades are **blue/green** (need headroom,
  not instant); **FGAC** misconfig exposes indices/fields; public domains with weak access policies are
  a common breach vector — prefer VPC; UltraWarm is read-mostly (no updates); serverless has different
  feature support than domains.
- IaC/CLI: Terraform `aws_opensearch_domain`, `aws_opensearch_domain_policy`,
  `aws_opensearch_domain_saml_options`, `aws_opensearchserverless_collection`,
  `aws_opensearchserverless_security_policy`, `aws_opensearchserverless_access_policy`,
  `aws_opensearch_inbound_connection_accepter`. CLI `aws opensearch create-domain`/
  `update-domain-config`/`describe-domain`, `aws opensearchserverless create-collection`. CloudFormation
  `AWS::OpenSearchService::Domain`, `AWS::OpenSearchServerless::Collection`,
  `AWS::OpenSearchServerless::SecurityPolicy`, `AWS::OpenSearchServerless::AccessPolicy`.
