---
name: aws-clean-rooms
description: Use when designing, provisioning, securing, or operating AWS Clean Rooms — the service that lets multiple parties analyze their combined data without sharing or copying the underlying records (AWS Clean Rooms). Loads the Clean Rooms knowledge: collaborations and members (with roles like creator, member who can query, and member who pays), configured tables that map to each party's data in Glue/S3 (or Snowflake/Athena), analysis rules (aggregation, list, and custom/SQL) that constrain what queries may run, query controls and output, differential privacy budgets and noise, AWS Clean Rooms ML (lookalike modeling) and Clean Rooms Spark/SQL. Covers join/aggregation constraints, IAM and collaboration membership, KMS-protected outputs, cost (CRPU / query compute) and quotas, and verification that a permitted query runs while a disallowed one is blocked. Consumed by the Clean Rooms specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, clean-rooms, analytics, privacy, data-collaboration, differential-privacy]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Clean Rooms

A managed service for **privacy-preserving data collaboration**: multiple parties bring their own data
and run **approved analyses on the combined data set without sharing, copying, or exposing the
underlying rows**. Each party keeps its data in its own account; Clean Rooms enforces what queries are
allowed and what results can leave.

## Core concepts and components
- **Collaboration** — the secure workspace that defines the participating **members** and the rules of
  engagement. Roles include the **collaboration creator**, **members** (each can be allowed to query),
  the **member who can query**, and the **member who pays** for query compute.
- **Configured table** — a member's mapping to its own underlying data (an **AWS Glue** table over S3,
  or Athena/Snowflake sources). The member associates it with the collaboration and attaches rules.
- **Analysis rules** — the guardrails on a configured table: **aggregation** (only aggregate metrics,
  with min-aggregation thresholds), **list** (row-level overlap of allowed columns), and **custom**
  (approved parameterized SQL / Spark, optionally with allowed analysis templates).
- **Differential privacy** — an optional layer that adds calibrated **noise** within a per-collaboration
  **privacy budget** to bound what any individual record reveals across queries.
- **Clean Rooms ML** — privacy-preserving **lookalike** modeling on combined data without sharing it.
- **Query & output** — members run permitted queries (SQL/Spark); results write to a designated **S3
  output** location for the receiving member only.

## Configuration and sizing
- Compute is measured in **Clean Rooms Processing Units (CRPU)** / query compute — there is no cluster
  to size. Shape behavior with analysis rules: set **aggregation thresholds** to prevent
  re-identification, choose **list vs aggregation vs custom** per use case, and enable **differential
  privacy** with an appropriate epsilon/budget for high-sensitivity overlaps. Map configured tables to
  well-partitioned Glue/S3 data for efficient queries.

## Security and IAM
- Each member keeps data in its own account; Clean Rooms uses **service roles** to read each member's
  configured-table data (`glue:Get*`, `s3:GetObject` on that member's data) and write results to the
  querying member's **S3 output** (`s3:PutObject`). Gate membership and configuration with IAM
  (`cleanrooms:*`). Encrypt with **SSE-KMS** (cryptographic computing / KMS-protected outputs) and
  restrict output buckets. The analysis rules are the primary privacy control — review them as security
  boundaries.

## Cost levers
- Billed per **CRPU-hour** of query compute, paid by the designated **member who pays**; plus the
  underlying S3/Glue costs. Levers: partition/format source data to scan less, prefer aggregation over
  broad custom queries, cap query frequency, and use differential-privacy budgets to bound runaway
  analysis. Right-size collaborations rather than spinning up many.

## Scaling and limits
- Per-account quotas apply to collaborations, members per collaboration, configured tables, and
  concurrent queries. Differential-privacy **budgets** hard-stop further queries once exhausted.
  Aggregation minimums and disallowed columns will block queries by design — that is the control, not a
  bug.

## Operating procedure
1. **Provision** — create the collaboration and invite members via Terraform
   `aws_cleanrooms_collaboration`, or `aws cleanrooms create-collaboration`; each member creates a
   **membership**.
2. **Configure** — each member creates a **configured table** over its Glue/S3 data, attaches an
   **analysis rule** (aggregation/list/custom), associates it with the collaboration, and (optionally)
   enables a **differential privacy** policy and budget; set the query output S3 location.
3. **Secure** — least-privilege service roles per member's data, SSE-KMS outputs, locked output bucket,
   and analysis rules reviewed as the privacy boundary.
4. **Verify** — apply [[verify-by-running]]: run a permitted query
   (`aws cleanrooms start-protected-query`) and confirm the result lands in the output bucket
   (`aws s3 ls`), then run a query that violates an analysis rule (e.g. selects a disallowed column or
   under-aggregates) and confirm it is **blocked** — capture the actual output of both.

## Inputs
Participating parties + their data locations (Glue/S3), each member's allowed columns and analysis type
(aggregation/list/custom), join keys, privacy requirements (thresholds, differential privacy budget),
output location + KMS, who queries and who pays.

## Output
A Clean Rooms collaboration with configured tables and analysis rules (and optional differential
privacy) that lets approved cross-party queries run into a secured S3 output while blocking disallowed
ones — plus verification of both the permitted and blocked paths.

## Notes
- Gotchas: data never leaves each member's account, so misconfigured service roles cause silent "no
  access" failures; aggregation min-thresholds and disallowed columns block queries by design; the
  differential-privacy budget is finite and stops queries once spent; custom analysis rules can leak
  more than intended if templates are too broad — review them; only the querying member receives the
  output; the member who pays must accept query-compute cost.
- IaC/CLI: Terraform `aws_cleanrooms_collaboration`, `aws_cleanrooms_configured_table`,
  `aws_cleanrooms_configured_table_association`, `aws_cleanrooms_membership`. CLI
  `aws cleanrooms create-collaboration`, `create-configured-table`,
  `create-configured-table-analysis-rule`, `create-membership`, `start-protected-query`,
  `get-protected-query`. CloudFormation `AWS::CleanRooms::Collaboration`,
  `AWS::CleanRooms::ConfiguredTable`, `AWS::CleanRooms::Membership`.
