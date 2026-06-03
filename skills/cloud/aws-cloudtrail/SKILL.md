---
name: aws-cloudtrail
description: Use when designing, provisioning, securing, or operating AWS CloudTrail — management events and data events (S3/Lambda/DynamoDB), trails (single-region/multi-region) delivering to S3 and CloudWatch Logs, organization trails, CloudTrail Lake event data stores and SQL queries, CloudTrail Insights (anomaly detection on API rate/error), event selectors and advanced event selectors, log file integrity validation, and KMS encryption (AWS CloudTrail). Loads the CloudTrail knowledge: how to capture an immutable audit trail of API activity, scope event selectors for cost, query history with Lake, and verify events land and validate. Consumed by the CloudTrail specialist and by the AWS role team (aws-security-reviewer / aws-cloud-architect) when they need audit logging.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, cloudtrail, audit-logging, security, governance, management-governance]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS CloudTrail

AWS's API activity audit service: records who did what, when, and from where across AWS
APIs and delivers an immutable trail for security, compliance, and forensics. CloudTrail is
the **audit log** of control-plane (and selected data-plane) activity — it is distinct from
CloudWatch, which owns operational **metrics and logs**.

## Core concepts and components
- **Management events** — control-plane operations (create/modify/delete resources, logins);
  read and write events; the first copy of management events is free per account.
- **Data events** — high-volume data-plane operations (S3 object GetObject/PutObject, Lambda
  Invoke, DynamoDB item ops); off by default, billed per event — scope tightly.
- **Trails** — deliver events to an S3 bucket (durable archive) and optionally CloudWatch
  Logs (for metric filters/alarms); single- or **multi-region**; **organization trails**
  capture all accounts in an AWS Organization from the management/delegated-admin account.
- **CloudTrail Lake** — managed event data stores you query with SQL; longer retention
  (up to ~10 years), aggregates CloudTrail, Config, and external sources.
- **CloudTrail Insights** — detects unusual API call-rate and error-rate patterns.
- **Event selectors / advanced event selectors** — filter which data events are logged by
  resource type, ARN, and field, controlling cost and noise.
- **Integrity** — **log file validation** (digest files + hashing) proves logs were not
  tampered with; logs can be encrypted with SSE-KMS.

## Configuration and sizing
- Create one **multi-region organization trail** as the account-wide baseline; add scoped
  data-event trails only where needed (e.g., a sensitive S3 bucket). Use Lake for long-term
  searchable retention; keep S3 lifecycle rules for cold archive. Enable log file validation.

## Security and IAM
- The S3 bucket needs the CloudTrail service bucket policy; enable **SSE-KMS** and block
  public access; protect the bucket with an SCP/Object Lock against deletion. Scope
  `cloudtrail:*` admin actions narrowly and treat trail stop/delete as high-risk (alarm on
  `StopLogging`/`DeleteTrail`). Use a delegated administrator for org trails.

## Cost levers
- Management events: first copy free, additional trails billed. **Data events and Insights
  are the main cost** — restrict data events with advanced event selectors, avoid logging
  high-traffic buckets wholesale, and watch Lake ingestion/query/retention charges.

## Scaling and limits
- Up to 5 trails per region; Lake event data stores and advanced selector limits apply;
  event delivery to S3 is typically within ~15 minutes (not real-time). Org trails scale
  automatically to new member accounts.

## Operating procedure
1. **Provision** — create an S3 bucket (KMS, block public access, lifecycle), then a
   multi-region (org) trail delivering to it and optionally to CloudWatch Logs.
2. **Configure** — set management event read/write capture, scope data events with advanced
   event selectors, enable Insights, and create a CloudTrail Lake store for query/retention.
3. **Secure** — enable log file validation, KMS encryption, bucket Object Lock/SCP
   protection, and a CloudWatch alarm on StopLogging/DeleteTrail.
4. **Verify** — apply [[verify-by-running]]: perform a tracked API call, then
   `aws cloudtrail lookup-events` (or query Lake) and confirm the event appears with the
   expected identity; run `aws cloudtrail validate-logs` and confirm integrity is valid;
   confirm `get-trail-status` shows `IsLogging: true` — capture the output.

## Inputs
Accounts/regions/org scope to audit, which data events (if any) to capture and on which
resources, retention/compliance requirements, S3/KMS targets, alerting needs (StopLogging,
Insights), Lake query needs, and tagging conventions.

## Output
The CloudTrail configuration (trail(s)/org trail, S3+KMS target, event selectors, Insights,
Lake store, integrity validation, protective alarms) as code, plus verification that a test
event was captured, log integrity validates, and logging is active.

## Notes
- Gotchas: data events are **not** logged by default and can be expensive — scope them;
  CloudTrail is for **audit**, CloudWatch Logs is for operational logging (a trail can feed
  CloudWatch Logs for alarming, but they answer different questions); event delivery is
  near-real-time, not instant — do not build synchronous logic on it; the management-account
  trail alone does not cover members unless it is an org trail; deleting the S3 bucket breaks
  the trail silently. Use S3 Object Lock + SCPs to make logs tamper-resistant.
- IaC/CLI: Terraform `aws_cloudtrail`, `aws_cloudtrail_event_data_store`, plus the S3 bucket
  and policy. CLI `aws cloudtrail create-trail`, `start-logging`, `put-event-selectors`,
  `get-trail-status`, `lookup-events`, `validate-logs`, `start-query` (Lake). CloudFormation
  `AWS::CloudTrail::Trail`, `AWS::CloudTrail::EventDataStore`.
