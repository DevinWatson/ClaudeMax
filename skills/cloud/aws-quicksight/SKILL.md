---
name: aws-quicksight
description: Use when designing, provisioning, securing, or operating Amazon QuickSight — the serverless, pay-per-session BI and dashboard service (Amazon QuickSight). Loads the QuickSight knowledge: the SPICE in-memory engine (capacity, scheduled/incremental refresh) vs direct query, data sources (Redshift/Athena/RDS/S3/Glue/SaaS) and datasets (joins, calculated fields, custom SQL, row/column-level security), analyses, dashboards and reports, parameters/controls/filters/themes, Amazon Q generative BI, ML insights/forecasting, embedding (registered/anonymous, namespaces), user/group/folder management (Identity Center/IAM/native, Standard vs Enterprise, authors vs readers), and the security model (VPC, KMS, RLS/CLS, asset permissions). Covers SPICE vs direct-query sizing, dataset modeling, dashboard design, embedding, and verification. Consumed by the QuickSight specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, quicksight, analytics, business-intelligence, dashboards, spice]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon QuickSight

A **serverless, pay-per-session business-intelligence** service for building interactive dashboards and
reports. Data is either cached in the **SPICE** in-memory engine for fast interaction or queried live
(**direct query**); analyses become **dashboards** shared with readers or **embedded** in apps.

## Core concepts and components
- **SPICE** — Super-fast Parallel In-memory Calculation Engine: import data into an in-memory store for
  fast, isolated queries; managed **capacity** per account/region, **scheduled** and **incremental
  refresh**. Alternative is **direct query** (every visual hits the source live — fresh but
  source-dependent).
- **Data sources & datasets** — connect Redshift, Athena, RDS/Aurora, S3, Glue, and SaaS sources; a
  **dataset** layers **joins**, **calculated fields**, **custom SQL**, and **row-level (RLS)** /
  **column-level (CLS)** security on top.
- **Analyses → dashboards** — an **analysis** is the authoring canvas (visuals, **parameters**,
  **controls**, **filters**, **themes**); publishing yields a **dashboard** for readers; **paginated
  reports** for pixel-perfect output.
- **Amazon Q in QuickSight** — natural-language Q&A and **generative BI** (build visuals/data stories
  from prompts). **ML insights** add anomaly detection and **forecasting**.
- **Embedding** — embed dashboards/consoles into web apps for **registered** or **anonymous** users via
  the embedding SDK and **namespaces** for multi-tenant isolation.
- **Editions & users** — **Standard** vs **Enterprise** (RLS/CLS, VPC, embedding, AD/Identity Center);
  **authors** vs **readers**, organized into **groups** and **folders** with asset permissions.

## Configuration and sizing
- Choose **SPICE** for fast, concurrent, isolated reads (and to offload the source) — size **SPICE
  capacity** to dataset size × refresh; use **incremental refresh** for large fact tables. Use **direct
  query** when data must be real-time or is too large/volatile to import. Model **datasets** once
  (joins/calculated fields/RLS) and reuse across analyses; organize assets into **folders**.

## Security and IAM
- Use **Enterprise edition** for **RLS/CLS**, **VPC connections** to private sources, and **KMS**
  encryption of SPICE. Manage identity via **IAM Identity Center** / IAM / native users + **groups**;
  grant least-privilege **asset/folder permissions**. For embedding, scope per-namespace and use
  short-lived embed URLs. The QuickSight service role governs which AWS data sources it can read.

## Cost levers
- **Authors** billed monthly; **readers** **pay-per-session** (capped) in Enterprise — cheaper at scale
  than per-user. **SPICE capacity** billed per GB — right-size and use incremental refresh; **direct
  query** shifts cost/load to the source (and may incur Athena bytes-scanned/Redshift compute). Amazon Q
  and paginated reports have add-on pricing.

## Scaling and limits
- SPICE has per-account capacity and per-dataset size/row limits; direct query concurrency is bounded by
  the underlying source. Reader sessions scale serverlessly. Refresh schedules and dataset/analysis
  counts have quotas; embedding URL generation is rate-limited.

## Operating procedure
1. **Provision** — set up the account/edition, SPICE capacity, and VPC connection if needed; manage
   data sources/datasets/templates/dashboards via Terraform `aws_quicksight_data_source` /
   `aws_quicksight_data_set` / `aws_quicksight_dashboard`, or `aws quicksight create-data-set` /
   `create-dashboard`.
2. **Configure** — datasets (joins, calculated fields, custom SQL), SPICE vs direct query + refresh
   schedule/incremental, RLS/CLS rulesets, analyses → published dashboards, parameters/controls/themes,
   folders.
3. **Secure** — Enterprise RLS/CLS, VPC connection + KMS, Identity Center/IAM users+groups, asset/folder
   permissions, embedding namespaces.
4. **Verify** — apply [[verify-by-running]]: trigger a SPICE refresh
   (`aws quicksight create-ingestion`) and confirm `describe-ingestion` reports `COMPLETED` with the
   expected row count; confirm the dashboard renders the right numbers and that **RLS** restricts a test
   user's rows; for embedding, generate an embed URL and confirm it loads — capture the actual output.

## Inputs
Data sources + freshness needs (SPICE vs direct query), dataset model (joins/calculated fields/RLS/CLS),
audience (authors/readers, embedding/multi-tenant), edition, security model (VPC/KMS/identity), refresh
cadence + data volume.

## Output
A QuickSight setup (data sources, datasets with joins/calculated fields/RLS-CLS, SPICE capacity +
refresh schedule or direct query, analyses → dashboards/reports, folders + permissions, optional
embedding) plus verification of refresh, correct numbers, and RLS enforcement.

## Notes
- Gotchas: SPICE data is a **snapshot** — stale until refreshed (schedule/incremental); large full
  refreshes can exceed SPICE capacity or run long; **direct query** can hammer the source and slow
  dashboards; **RLS/CLS** mistakes leak data — always test with a restricted user; embedding requires
  Enterprise + correct namespace/identity setup; reader pay-per-session caps differ from author
  pricing; custom-SQL datasets bypass some optimizations.
- IaC/CLI: Terraform `aws_quicksight_data_source`, `aws_quicksight_data_set`, `aws_quicksight_template`,
  `aws_quicksight_dashboard`, `aws_quicksight_analysis`, `aws_quicksight_folder`,
  `aws_quicksight_group`, `aws_quicksight_user`. CLI `aws quicksight create-data-set`/
  `create-ingestion`/`describe-ingestion`/`create-dashboard`/`generate-embed-url-for-registered-user`.
  CloudFormation `AWS::QuickSight::DataSource`, `AWS::QuickSight::DataSet`, `AWS::QuickSight::Analysis`,
  `AWS::QuickSight::Dashboard`, `AWS::QuickSight::Template`.
