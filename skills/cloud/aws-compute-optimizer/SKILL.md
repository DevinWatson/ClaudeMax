---
name: aws-compute-optimizer
description: Use when designing, enabling, securing, or operating AWS Compute Optimizer — machine-learning rightsizing recommendations for EC2 instances, Auto Scaling groups, EBS volumes, Lambda functions, and ECS services on Fargate; over-/under-provisioned and optimized findings, recommendation reasons and risk, enhanced infrastructure metrics (3-month lookback), external metrics ingestion, the savings/performance trade-off, and multi-account opt-in via Organizations with a delegated administrator (AWS Compute Optimizer). Loads the Compute Optimizer knowledge: how to enable it, read and prioritize rightsizing recommendations, and verify findings export and an applied resize holds performance. Consumed by the Compute Optimizer specialist and by the AWS role team (aws-cloud-architect / aws-reliability-engineer) and cross-refs the aws-cost-governor role for cost rightsizing.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, compute-optimizer, rightsizing, cost, performance, management-governance]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Compute Optimizer

AWS's ML-driven rightsizing advisor: it analyzes CloudWatch utilization history and
recommends better-fit configurations for compute resources to cut cost or improve
performance. It is the **rightsizing recommendation engine** — it advises; applying changes
and broader cost governance live with the workload owners and the aws-cost-governor role.

## Core concepts and components
- **Supported resources** — **EC2 instances**, **Auto Scaling groups**, **EBS volumes**,
  **Lambda functions**, and **ECS services on Fargate** (and commercial software licenses).
- **Findings** — each resource is classified **Under-provisioned**, **Over-provisioned**,
  **Optimized**, or **None**; recommendations list candidate configurations with projected
  utilization, **savings opportunity**, and **performance risk**.
- **Recommendation reasons** — which dimension drives the finding (CPU, memory, network,
  EBS throughput/IOPS, etc.).
- **Enhanced infrastructure metrics** — a paid option extending the lookback to **3 months**
  for more stable recommendations; default lookback is ~14 days.
- **Memory metrics** — EC2 memory requires the CloudWatch agent (memory is not a default EC2
  metric) for accurate memory-based findings.
- **External metrics ingestion** — bring third-party observability metrics for richer EC2
  analysis.
- **Multi-account** — opt in org-wide via Organizations with a **delegated administrator**
  for a consolidated view.

## Configuration and sizing
- Enable account- or org-wide; install the CloudWatch agent on EC2 where memory matters.
  Turn on enhanced infrastructure metrics for production fleets where the 3-month lookback
  improves confidence. Export recommendations to S3 for analysis/automation.

## Security and IAM
- Uses a service-linked role to read CloudWatch metrics and resource metadata (read-only —
  it does not modify resources). Scope who can view recommendations and configure org-level
  opt-in; the delegated admin manages the org view. Applying a recommendation is a separate,
  privileged action performed by the resource owner.

## Cost levers
- The base recommendations are **free**; **enhanced infrastructure metrics** are billed per
  resource-hour analyzed. The value is downstream: acting on over-provisioned findings is a
  primary **rightsizing cost lever** (cross-ref the aws-cost-governor role).

## Scaling and limits
- Analyzes all supported resources in opted-in accounts/regions; recommendations refresh
  periodically (not instant after a change) and require enough metric history to be
  meaningful; newly launched resources show `None` until data accrues.

## Operating procedure
1. **Provision** — enable Compute Optimizer for the account or org (delegated admin); install
   the CloudWatch agent on EC2 for memory metrics where needed.
2. **Configure** — optionally enable enhanced infrastructure metrics for key fleets and set
   up S3 export of recommendations.
3. **Secure** — confirm the read-only service-linked role and scope recommendation visibility;
   keep apply actions with the resource owner.
4. **Verify** — apply [[verify-by-running]]: `aws compute-optimizer get-ec2-instance-recommendations`
   (and the ASG/EBS/Lambda/ECS equivalents) and confirm findings/savings appear; export
   recommendations and confirm the file lands in S3; after applying a sample resize, confirm
   performance holds (CloudWatch utilization within target) — capture the output.

## Inputs
Accounts/regions to analyze, resource types in scope, whether memory metrics are needed
(CloudWatch agent), enhanced-metrics budget, export destination, and the savings-vs-performance
risk tolerance for acting on findings.

## Output
The Compute Optimizer enablement (account/org opt-in, delegated admin, agent for memory,
enhanced metrics, S3 export) plus the prioritized rightsizing recommendations, and
verification that recommendations are retrievable/exported and an applied resize holds
performance.

## Notes
- Gotchas: EC2 **memory** findings are inaccurate without the CloudWatch agent (memory is not
  a default metric); recommendations need ~14 days of history (or 3 months with enhanced
  metrics) — new/idle resources show `None`; Compute Optimizer **only recommends**, it never
  changes resources — applying is a separate privileged step; savings figures assume on-demand
  pricing and may differ under Savings Plans/RIs; ASG recommendations assume the group's
  scaling behavior. For broad cost governance/allocation defer to the aws-cost-governor role;
  for reliability impact of resizing defer to the aws-reliability-engineer role.
- IaC/CLI: enablement is via `aws compute-optimizer update-enrollment-status` (and
  `put-recommendation-preferences` for enhanced metrics); read with
  `get-ec2-instance-recommendations`, `get-auto-scaling-group-recommendations`,
  `get-ebs-volume-recommendations`, `get-lambda-function-recommendations`,
  `get-ecs-service-recommendations`, and `export-*-recommendations`. Terraform support is
  limited (no first-class recommendation resources) — manage enrollment via the CLI/SDK or an
  AWS provider data source and treat recommendations as read-only inputs to rightsizing IaC.
