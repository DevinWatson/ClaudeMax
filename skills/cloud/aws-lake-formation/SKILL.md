---
name: aws-lake-formation
description: Use when designing, provisioning, securing, or operating AWS Lake Formation — the centralized fine-grained governance layer for data lakes on S3 and the Glue Data Catalog (AWS Lake Formation). Loads the Lake Formation knowledge: registering S3 locations via a service-linked role, the permission model (database/table/column/row/cell grants, named-resource vs LF-Tag-based access control / TBAC), LF-Tag taxonomy and policies, data filters for column/row security, data-lake admins and the IAMAllowedPrincipals legacy mode, blueprints, governed tables/transactions (and the shift to Apache Iceberg), cross-account sharing via RAM, and how it enforces permissions for Athena, Redshift Spectrum, EMR, and Glue. Covers migrating from IAM-only, LF-Tag taxonomy design, fine-grained grants, and verifying enforcement. Consumed by the Lake Formation specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, lake-formation, analytics, data-lake, governance, permissions]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Lake Formation

A **centralized governance layer** for data lakes on **S3 + the Glue Data Catalog**. It adds
**fine-grained, database/table/column/row/cell-level permissions** on top of the catalog and enforces
them across **Athena, Redshift Spectrum, EMR, and Glue** — replacing coarse IAM/S3-bucket policies for
data access.

## Core concepts and components
- **Registered locations** — register S3 prefixes as **data-lake locations**; Lake Formation uses a
  **service-linked role** to vend scoped, temporary credentials so engines never need direct S3 grants.
- **Permission model** — grant **SELECT/ALTER/DROP/INSERT** etc. at **database, table, column, row, and
  cell** level to IAM principals. Two paradigms: **named-resource** (grant on specific db/table) and
  **LF-Tag-based access control (TBAC)** — attach **LF-Tags** to resources and grant on tag
  expressions for scalable governance.
- **LF-Tags & data filters** — define a **tag taxonomy** (key=value) and tag policies; **data filters**
  express **column** projections and **row** filter predicates for fine-grained sharing.
- **Administrators & legacy mode** — **data-lake administrators** manage settings; the legacy
  **IAMAllowedPrincipals** "super" grant makes catalog behave IAM-only — must be removed to actually
  enforce Lake Formation.
- **Blueprints** — managed templates that build Glue ingestion workflows (bulk/incremental DB → lake).
- **Governed tables / transactions** — ACID transactions and time-travel (now largely superseded by
  **Apache Iceberg** tables under Lake Formation governance).
- **Sharing** — **cross-account** and Data Catalog resource sharing via **AWS RAM**.

## Configuration and sizing
- Not a sized service — design the **governance model**: register S3 locations, choose **TBAC (LF-Tags)**
  for scale over named-resource grants, define a clear **tag taxonomy** (e.g. `classification`,
  `domain`, `sensitivity`), and grant on tag expressions. Use **data filters** for column/row security.
  Migrate off **IAMAllowedPrincipals** deliberately so enforcement actually turns on.

## Security and IAM
- Lake Formation **is** the security layer: principals get **fine-grained grants** instead of broad S3/
  Glue IAM. Lock down who is a **data-lake admin**, who can grant (GRANT WITH GRANT OPTION), and the
  service-linked role's S3 scope. Combine with KMS encryption on the underlying S3 data and CloudTrail
  for grant auditing. Removing `IAMAllowedPrincipals` is required for column/row filtering to apply.

## Cost levers
- Lake Formation itself has **no direct charge** for permissions; you pay for the underlying S3, Glue
  catalog requests, and the query engine (Athena bytes-scanned, Redshift/EMR compute). **Storage
  optimization** (compaction) for governed/Iceberg tables and transaction APIs may incur cost. The cost
  lever is really the engines it governs.

## Scaling and limits
- TBAC scales governance far better than per-table named grants (fewer policies as tables grow).
  Per-account limits on LF-Tags, values per tag, grants, and data filters apply; cross-account sharing
  is bounded by RAM. Permission propagation to engines is near-immediate but cache-aware.

## Operating procedure
1. **Provision** — set data-lake administrators and register S3 locations via Terraform
   `aws_lakeformation_data_lake_settings` / `aws_lakeformation_resource`, or
   `aws lakeformation put-data-lake-settings` / `register-resource`.
2. **Configure** — define **LF-Tags** + taxonomy, attach tags to catalog resources, create **data
   filters** (column/row), and choose TBAC vs named-resource model.
3. **Secure** — remove **IAMAllowedPrincipals**, grant fine-grained permissions on tag expressions/
   resources to specific principals, restrict admins and grant-option, enable CloudTrail.
4. **Verify** — apply [[verify-by-running]]: assume a granted principal and run an Athena/Redshift
   Spectrum query, confirming it returns **only** the permitted columns/rows; assume an ungranted
   principal and confirm the query is **denied** (proving IAMAllowedPrincipals was removed and TBAC/data
   filters enforce) — capture the actual allowed and denied results.

## Inputs
S3 data-lake layout + catalog, classification/sensitivity model, principals + access matrix, TBAC vs
named-resource preference, cross-account sharing needs, current IAM-only state (migration), engines to
govern (Athena/Spectrum/EMR/Glue).

## Output
A Lake Formation governance setup (registered locations, LF-Tag taxonomy + tagged resources, fine-grained
grants via TBAC and/or named resources, data filters for column/row security, admins, removed
IAMAllowedPrincipals, cross-account shares) plus verification that grants allow/deny correctly.

## Notes
- Gotchas: leaving **IAMAllowedPrincipals** in place silently bypasses Lake Formation (column/row
  filters do nothing); forgetting to **register** the S3 location means engines fall back to IAM;
  principals need both LF grants **and** baseline IAM to call the engine; column/row filters apply only
  on engines that integrate (Athena/Spectrum/EMR/Glue) — direct S3 access bypasses them, so revoke broad
  S3; LF-Tag explosion if the taxonomy is too granular; governed tables are legacy — prefer Iceberg.
- IaC/CLI: Terraform `aws_lakeformation_resource`, `aws_lakeformation_permissions`,
  `aws_lakeformation_data_lake_settings`, `aws_lakeformation_lf_tag`,
  `aws_lakeformation_resource_lf_tags`, `aws_lakeformation_data_cells_filter`. CLI
  `aws lakeformation register-resource`, `grant-permissions`, `add-lf-tags-to-resource`,
  `create-data-cells-filter`, `put-data-lake-settings`. CloudFormation `AWS::LakeFormation::Resource`,
  `AWS::LakeFormation::Permissions`, `AWS::LakeFormation::Tag`, `AWS::LakeFormation::TagAssociation`,
  `AWS::LakeFormation::DataCellsFilter`, `AWS::LakeFormation::PrincipalPermissions`.
