---
name: aws-cloudwatch
description: Use when designing, provisioning, securing, or operating Amazon CloudWatch — metrics (standard, custom, high-resolution), namespaces/dimensions and statistics, metric math and anomaly detection, alarms (metric, composite) and actions (SNS/Auto Scaling/EC2/SSM OpsItems), Logs (log groups/streams, retention, subscription filters, metric filters), Logs Insights queries, dashboards, the CloudWatch agent and EMF embedded metrics, Container Insights / Lambda Insights / Application Signals, Synthetics canaries, and Events via EventBridge (Amazon CloudWatch). Loads the CloudWatch knowledge: how to publish/collect metrics and logs, build alarms + dashboards, query with Logs Insights, and verify they fire and render. Consumed by the CloudWatch specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they wire up observability.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, cloudwatch, observability, metrics, logs, alarms, management-governance]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon CloudWatch

AWS's native monitoring and observability service: collects metrics and logs, evaluates
alarms, renders dashboards, and runs log queries. It is the metrics/logs/alarms/dashboards
implementation layer — broad observability *strategy* (SLOs, tracing architecture across
tools) is owned elsewhere; CloudWatch owns the AWS-native plumbing.

## Core concepts and components
- **Metrics** — time series keyed by **namespace** + **dimensions**, aggregated by statistic
  (Sum/Avg/p99/etc.). Standard (free) AWS metrics, **custom** metrics, and **high-resolution**
  (1s) metrics. **Metric math** combines series; **anomaly detection** learns expected bands.
- **Alarms** — **metric alarms** on a metric/expression vs a threshold, and **composite
  alarms** combining alarm states; actions notify SNS, trigger Auto Scaling / EC2 actions, or
  create SSM OpsItems.
- **Logs** — **log groups** (retention/KMS) contain **log streams**; **metric filters** turn
  log patterns into metrics; **subscription filters** stream logs to Lambda/Firehose/OpenSearch.
- **Logs Insights** — query language for ad-hoc log analysis and dashboards.
- **Dashboards** — JSON-defined widgets (metrics, logs, alarms, text) for at-a-glance views.
- **Agent / EMF** — the **CloudWatch agent** ships host metrics + logs from EC2/on-prem;
  **Embedded Metric Format** emits metrics from structured log lines.
- **Higher-level insights** — **Container Insights** (ECS/EKS), **Lambda Insights**,
  **Application Signals** (APM/SLOs), **Synthetics** canaries; events flow via EventBridge.

## Configuration and sizing
- Set sensible **log retention** (default is never-expire = unbounded cost). Use
  high-resolution metrics only where 1s granularity matters. Prefer EMF/structured logs so you
  can derive metrics without extra PutMetricData calls. Build composite alarms to cut noise.

## Security and IAM
- Scope `cloudwatch:PutMetricData`, `logs:*`, and dashboard permissions least-privilege; the
  CloudWatch agent / app uses an instance role or scoped credentials. Encrypt log groups with
  KMS (key policy must allow the Logs service). Avoid logging secrets/PII — mask via data
  protection policies. Cross-account observability uses the monitoring-account sharing model.

## Cost levers
- Biggest levers: **log ingestion + storage retention** (set retention, archive/export cold
  logs to S3), custom + high-resolution metrics (count and resolution), Logs Insights bytes
  scanned, dashboards, canaries, and Container/Lambda Insights. Use metric filters/EMF instead
  of many PutMetricData calls; sample verbose logs.

## Scaling and limits
- Metrics/logs scale automatically; PutMetricData and API calls have TPS limits, metric data
  has 15-month retention with rollups, and there are limits on alarms, dashboards, and metric
  filters per account/log group (mostly soft/raisable).

## Operating procedure
1. **Provision** — create log groups (retention + KMS) and any custom metric namespaces via
   Terraform `aws_cloudwatch_log_group` (and the agent/EMF on sources).
2. **Configure** — metric/composite alarms with actions, metric/subscription filters,
   Logs Insights saved queries, dashboards, and Container/Lambda Insights / Synthetics canaries.
3. **Secure** — least-privilege metric/log/dashboard IAM, KMS on log groups, data-protection
   masking, cross-account sharing where needed.
4. **Verify** — apply [[verify-by-running]]: `aws cloudwatch put-metric-data` (or trigger the
   workload) then confirm the alarm transitions to ALARM and fires its SNS action; run an
   `aws logs start-query` Logs Insights query and confirm expected rows; confirm the dashboard
   renders the widgets and retention is set (not unbounded).

## Inputs
What to observe (services/apps/hosts), metrics + logs sources, thresholds/SLOs for alarms,
alarm actions/notification targets, log retention + compliance needs, dashboards required,
container/serverless insight needs, expected log volume (for cost), encryption requirements.

## Output
The CloudWatch configuration (log groups with retention + KMS, metric/composite alarms with
actions, metric/subscription filters, Logs Insights queries, dashboards, Insights/canaries) as
code, plus verification that an alarm fires its action, a Logs Insights query returns expected
data, and dashboards render with retention bounded.

## Notes
- Gotchas: default log retention is **never expire** — always set it or pay forever; alarms on
  metrics with sparse data need `treatMissingData` set or they flap; standard-resolution alarms
  evaluate per minute (use high-resolution for faster reaction at higher cost); metric-filter
  metrics only start counting after the filter is created; the KMS key policy must allow
  `logs.<region>.amazonaws.com`; Logs Insights is billed by bytes scanned (narrow the time
  range/fields). For cross-cutting observability strategy/tracing across tools, defer to the
  observability role; for distributed tracing internals see X-Ray/Application Signals.
- IaC/CLI: Terraform `aws_cloudwatch_log_group`, `aws_cloudwatch_metric_alarm`,
  `aws_cloudwatch_composite_alarm`, `aws_cloudwatch_dashboard`, `aws_cloudwatch_log_metric_filter`,
  `aws_cloudwatch_log_subscription_filter`, `aws_cloudwatch_query_definition`. CLI
  `aws cloudwatch put-metric-data`, `put-metric-alarm`, `put-dashboard`, `aws logs put-retention-policy`,
  `start-query`, `get-query-results`. CloudFormation `AWS::Logs::LogGroup`, `AWS::CloudWatch::Alarm`,
  `AWS::CloudWatch::Dashboard`.
