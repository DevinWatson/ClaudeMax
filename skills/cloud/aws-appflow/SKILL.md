---
name: aws-appflow
description: Use when designing, provisioning, securing, or operating Amazon AppFlow — no-code SaaS data integration: connector profiles for SaaS sources/targets (Salesforce, ServiceNow, Slack, Zendesk, SAP, Marketo, Google Analytics, etc.) and AWS targets (S3, Redshift, EventBridge), flows with field mappings/transformations/filters/validations, trigger types (run-on-demand, scheduled, event-triggered), incremental pulls, data catalog integration, KMS encryption, and PrivateLink connectivity (Amazon AppFlow). Loads the AppFlow knowledge: how to create a connector profile, build a mapped/filtered flow, schedule or event-trigger it, and verify a run landed correct records. Consumed by the AppFlow specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they integrate SaaS data.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, appflow, saas-integration, data-integration, no-code, application-integration]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon AppFlow

Fully managed, no-code integration that securely transfers data between SaaS applications and
AWS services without writing custom connectors. Use AppFlow for SaaS<->AWS data movement with
mapping/filtering; use EventBridge for event routing and Glue/Step Functions for general ETL
orchestration.

## Core concepts and components
- **Connector** — the integration type for a system (Salesforce, ServiceNow, Slack, Zendesk,
  SAP OData, Marketo, Google Analytics, S3, Redshift, EventBridge, and custom connectors).
- **Connector profile** — stored, named credentials/config for a connector (OAuth tokens, API
  keys, instance URLs), secured in Secrets Manager and reusable across flows.
- **Flow** — a configured transfer: a source object, a destination, **field mappings**,
  **transformations** (map, merge, mask, truncate), **filters**, and **validations**.
- **Trigger types** — **run-on-demand**, **scheduled** (with optional incremental pull on a
  timestamp field), and **event-triggered** (e.g. on a Salesforce change event).
- **Incremental transfer** — pull only records changed since the last run via a chosen field.
- **Data catalog integration** — register S3 destination data in the Glue Data Catalog.

## Configuration and sizing
- Use incremental (delta) pulls on scheduled flows to avoid re-pulling full datasets. Map only
  needed fields and add filters/validations at the source to reduce volume and errors.
- For S3 targets, choose Parquet + aggregation/partitioning and register in Glue for query.

## Security and IAM
- Credentials live in connector profiles backed by Secrets Manager; encrypt flow data with
  SSE-KMS (customer-managed key for sensitive PII). Use field masking/truncation transforms
  for sensitive columns. Use PrivateLink for private connectivity to supported SaaS sources so
  data does not traverse the public internet. Scope the AppFlow IAM role to the destination
  (e.g. one S3 prefix / Redshift schema).

## Cost levers
- Billed per flow run + data processed; schedule frequency and incremental pulls are the main
  levers — avoid frequent full pulls. Mask/filter early to move less data. PrivateLink adds
  endpoint cost but may save egress and meet compliance.

## Scaling and limits
- Throughput depends on the SaaS source's API limits and AppFlow per-flow limits; large
  backfills may need pagination/scheduled batches. Limits on flows per account and fields per
  flow; SaaS API rate limits are the usual bottleneck.

## Operating procedure
1. **Provision** — create the connector profile (credentials in Secrets Manager) via Terraform
   `aws_appflow_connector_profile` or `aws appflow create-connector-profile`.
2. **Configure** — a flow with source/destination, field mappings + transformations + filters
   + validations, trigger (on-demand/scheduled+incremental/event), and Glue catalog registration.
3. **Secure** — SSE-KMS on flow data, field masking for sensitive columns, PrivateLink where
   required, least-privilege IAM role scoped to the destination.
4. **Verify** — apply [[verify-by-running]]: `aws appflow start-flow`, then
   `describe-flow-execution-records` confirms a successful run with the expected record count;
   inspect the destination (e.g. S3 objects / Redshift rows) to confirm mappings/filters
   produced correct data, and confirm an incremental re-run pulls only new records.

## Inputs
Source + destination systems, credentials/auth method, the objects/fields to move, mapping/
transformation/filter/validation rules, trigger type + schedule, incremental field, data
sensitivity (masking/KMS/PrivateLink), expected volume + SaaS API limits.

## Output
A connector profile (secrets-backed), a flow (mappings/transforms/filters/validations, trigger,
incremental config, KMS, optional Glue registration), and verification of a successful run with
correct record count and field mappings at the destination.

## Notes
- Gotchas: SaaS API rate limits throttle large pulls — prefer incremental/scheduled batches;
  OAuth tokens in connector profiles expire and need refresh; event-triggered flows require the
  source to emit change events (extra SaaS config); incremental pulls depend on a reliable
  last-modified field; field mappings are validated against the source schema, which can drift;
  custom connectors use the Connector SDK and a separate registration.
- IaC/CLI: Terraform `aws_appflow_connector_profile`, `aws_appflow_flow`. CLI
  `aws appflow create-connector-profile`, `create-flow`, `start-flow`,
  `describe-flow-execution-records`. CloudFormation `AWS::AppFlow::ConnectorProfile`,
  `AWS::AppFlow::Flow`.
