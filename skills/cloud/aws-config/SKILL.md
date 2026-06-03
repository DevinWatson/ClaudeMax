---
name: aws-config
description: Use when designing, provisioning, securing, or operating AWS Config — the configuration recorder and delivery channel, resource configuration items and timeline/snapshots, Config rules (AWS managed and custom Lambda/Guard rules), conformance packs, remediation actions (SSM Automation), multi-account/multi-region aggregators, advanced queries (SQL over resource config), and compliance reporting (AWS Config). Loads the Config knowledge: how to record resource configuration, evaluate compliance with rules and conformance packs, auto-remediate drift, aggregate across accounts, and verify a rule evaluates and remediates. Consumed by the Config specialist and by the AWS role team (aws-security-reviewer / aws-cloud-architect) when they need resource compliance.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, config, compliance, governance, remediation, management-governance]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Config

AWS's resource configuration and compliance service: it continuously records the
configuration of your AWS resources, evaluates them against rules, and reports compliance
over time. Config answers "is this resource configured the way policy requires, and how did
it change?" — distinct from CloudTrail (who called the API) and CloudWatch (metrics/logs).

## Core concepts and components
- **Configuration recorder + delivery channel** — the recorder captures **configuration
  items** (point-in-time resource state) for selected resource types; the delivery channel
  ships snapshots/history to S3 and notifications to SNS. The **configuration timeline**
  shows how a resource changed over time.
- **Config rules** — evaluate resources against desired state: **AWS managed rules**
  (hundreds prebuilt) and **custom rules** backed by Lambda or **Guard** (policy-as-code).
  Triggered by configuration change and/or periodically.
- **Conformance packs** — a deployable collection of rules + remediation as a single
  artifact, deployable org-wide for a compliance framework (e.g., PCI, CIS).
- **Remediation** — associate an **SSM Automation** document with a rule to auto- or
  manually remediate non-compliant resources.
- **Aggregators** — collect compliance/config data across accounts and regions into a single
  view (via Organizations or explicit source accounts).
- **Advanced queries** — SQL over the current resource configuration inventory.

## Configuration and sizing
- Record all supported resource types (or scope to what you govern) with a recorder per
  region; route to a central S3 bucket. Deploy conformance packs org-wide via the delegated
  administrator. Attach remediation to high-value rules; keep noisy/expensive rules periodic
  rather than change-triggered.

## Security and IAM
- Config uses a service-linked / IAM role to read resource config and write to S3/SNS; the
  S3 bucket needs the Config bucket policy and should use KMS + block public access.
  Remediation runs via an SSM Automation assume role — scope it least-privilege. Protect the
  recorder from being stopped (alarm on `StopConfigurationRecorder`).

## Cost levers
- Billed per **configuration item recorded** and per **rule evaluation** (and conformance
  pack evaluations). Levers: scope recorded resource types, prefer periodic over
  change-triggered for high-churn resources, and avoid duplicate rules across overlapping
  conformance packs.

## Scaling and limits
- Rules per account and conformance packs per account have limits (mostly soft); aggregators
  span many accounts/regions; recording is regional (deploy per region you use). Evaluations
  are eventually consistent, not instantaneous.

## Operating procedure
1. **Provision** — enable the configuration recorder + delivery channel (S3/KMS/SNS) in each
   region; for multi-account, enable via Organizations with a delegated admin and an
   aggregator.
2. **Configure** — deploy managed/custom rules and conformance packs; attach SSM Automation
   remediation to selected rules.
3. **Secure** — scope the Config and remediation roles, KMS-encrypt the S3 bucket, and alarm
   on recorder-stop.
4. **Verify** — apply [[verify-by-running]]: create a deliberately non-compliant resource,
   then `aws configservice start-config-rules-evaluation` and confirm the rule reports
   `NON_COMPLIANT` via `get-compliance-details-by-config-rule`; trigger remediation and
   confirm the resource returns to `COMPLIANT`; confirm `describe-configuration-recorder-status`
   shows recording — capture the output.

## Inputs
Resource types/accounts/regions to govern, compliance frameworks/rules required, custom rule
logic, remediation actions, aggregation scope, S3/KMS/SNS targets, and tagging conventions.

## Output
The Config setup (recorder + delivery channel, rules, conformance packs, remediation,
aggregator) as code, plus verification that a rule correctly flags a non-compliant resource,
remediation restores compliance, and the recorder is active.

## Notes
- Gotchas: rules only evaluate resource **types the recorder records** — a rule on an
  unrecorded type silently never evaluates; first-time recording produces a burst of
  configuration items (cost spike); change-triggered rules need the relevant resource type
  recorded; remediation needs the SSM Automation role to actually have permission or it
  fails silently as non-remediated; Config is regional — a missing region has no coverage.
  Config answers compliance/state, CloudTrail answers API activity — use both.
- IaC/CLI: Terraform `aws_config_configuration_recorder`, `aws_config_delivery_channel`,
  `aws_config_config_rule`, `aws_config_conformance_pack`,
  `aws_config_remediation_configuration`, `aws_config_configuration_aggregator`. CLI
  `aws configservice put-configuration-recorder`, `put-config-rule`,
  `put-conformance-pack`, `start-config-rules-evaluation`,
  `get-compliance-details-by-config-rule`, `select-resource-config`. CloudFormation
  `AWS::Config::ConfigRule`, `AWS::Config::ConformancePack`,
  `AWS::Config::ConfigurationRecorder`.
