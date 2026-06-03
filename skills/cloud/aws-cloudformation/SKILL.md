---
name: aws-cloudformation
description: Use when designing, authoring, provisioning, or operating AWS CloudFormation — templates (YAML/JSON), stacks and StackSets, change sets, drift detection, nested stacks and cross-stack exports/imports, intrinsic functions (Ref/GetAtt/Sub/Join/Select/If) and pseudo parameters, parameters/mappings/conditions/outputs, custom resources and Lambda-backed providers, modules, resource import, deletion/update policies, and stack policies (AWS CloudFormation). Loads the CloudFormation knowledge: how to write templates, deploy/update stacks safely, manage multi-account/multi-region StackSets, detect drift, and verify a stack reaches CREATE/UPDATE_COMPLETE. Consumed by the CloudFormation specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when AWS-native IaC is the chosen tool.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, cloudformation, iac, stacks, stacksets, management-governance]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS CloudFormation

AWS's native infrastructure-as-code service: you declare resources in a template and
CloudFormation provisions, updates, and deletes them as a single managed unit called a
stack. This service IS the IaC engine — Terraform is a sibling, third-party alternative
that targets the same APIs; this skill owns the CloudFormation-native path.

## Core concepts and components
- **Templates** — YAML/JSON documents with sections: `Parameters`, `Mappings`, `Conditions`,
  `Resources` (required), `Outputs`, `Transform`, `Metadata`. Resources are typed
  (`AWS::S3::Bucket`) with properties.
- **Stacks** — a deployed template instance; CloudFormation tracks every resource and rolls
  back on failure. **Nested stacks** (`AWS::CloudFormation::Stack`) compose reusable child
  templates; **cross-stack references** share values via `Export`/`Fn::ImportValue`.
- **StackSets** — deploy one template across many accounts/regions with self-managed or
  service-managed (Organizations) permissions and automatic deployment to new accounts.
- **Change sets** — preview the resource-level diff (add/modify/replace) before executing an
  update; surfaces replacements that cause downtime.
- **Drift detection** — compares live resource config to the template to find out-of-band edits.
- **Intrinsic functions** — `Ref`, `Fn::GetAtt`, `Fn::Sub`, `Fn::Join`, `Fn::Select`,
  `Fn::If`, `Fn::ImportValue`, `Fn::FindInMap`, plus pseudo parameters (`AWS::Region`,
  `AWS::AccountId`, `AWS::StackName`).
- **Extensibility** — **custom resources** (Lambda/SNS-backed) for non-native logic,
  **modules** and the **CloudFormation registry** for reusable typed components, and
  **resource import** to bring existing resources under management.

## Configuration and sizing
- Keep templates modular: split by lifecycle (network/data/app) and wire via exports or
  nested stacks. Parameterize per-environment values; use `Conditions` for env variants.
  Use `DeletionPolicy: Retain`/`Snapshot` and `UpdateReplacePolicy` on stateful resources;
  set `UpdatePolicy` for ASG/rolling updates. Stack policies guard critical resources from
  accidental update.

## Security and IAM
- Deploy with a least-privilege **service role** (`--role-arn`) so the stack's permissions
  are decoupled from the operator's. Restrict `cloudformation:*` actions and use stack
  policies + IAM `Condition` keys. For StackSets, prefer service-managed permissions via
  Organizations. Never put secrets in templates/parameters — use SSM Parameter Store
  (`{{resolve:ssm-secure}}`) or Secrets Manager dynamic references.

## Cost levers
- CloudFormation itself is free; you pay for provisioned resources and for StackSets
  third-party/registry operations beyond the free tier. Avoid orphaning resources on
  failed deletes (drift, retained resources) that keep billing.

## Scaling and limits
- Template body up to 1 MB (use S3 for large templates), 500 resources per stack (nest to
  exceed), 200 stacks region default (soft), and concurrency limits on StackSet operations.
  Large estates: prefer nested stacks/StackSets over one monolith.

## Operating procedure
1. **Provision** — author or lint the template; create the stack via
   `aws cloudformation create-stack` (or `deploy`) with a least-privilege service role and
   parameters; for multi-account use a StackSet.
2. **Configure** — add parameters/conditions/outputs, set Deletion/UpdateReplace/Update
   policies and a stack policy; modularize via nested stacks/exports.
3. **Secure** — scope the service role, replace inline secrets with dynamic references,
   enable drift detection and stack termination protection.
4. **Verify** — apply [[verify-by-running]]: create a **change set** and inspect the diff,
   `aws cloudformation deploy`/`execute-change-set`, then confirm the stack reaches
   `CREATE_COMPLETE`/`UPDATE_COMPLETE` via `describe-stacks`, run `detect-stack-drift` and
   confirm `IN_SYNC`, and check `describe-stack-events` has no rollback — capture the output.

## Inputs
Resources to manage, target accounts/regions, environment parameters, existing
templates/stacks or resources to import, secret sources, deletion/update policy needs for
stateful resources, multi-account governance model (Organizations), and naming/tagging
conventions.

## Output
The CloudFormation template(s) and stack/StackSet definitions as code, plus verification
that a change set was reviewed, the stack reached a COMPLETE state, drift is IN_SYNC, and no
rollback occurred.

## Notes
- This service IS CloudFormation — when AWS-native IaC is chosen, the artifacts here ARE the
  IaC. Terraform is a sibling alternative targeting the same resources; do not mix ownership
  of the same resource across both.
- Gotchas: some property changes force **replacement** (new physical resource, downtime) —
  always review the change set's `Replacement` column; failed creates roll back and delete
  resources unless `--disable-rollback`; `Export` names must be unique per region and cannot
  be deleted while imported; circular cross-stack imports are rejected; `DeletionPolicy`
  defaults to Delete (data loss on stack delete); custom resources must always send a
  response or the stack hangs an hour.
- IaC/CLI: `aws cloudformation create-stack`, `update-stack`, `deploy`,
  `create-change-set`, `execute-change-set`, `describe-stacks`, `describe-stack-events`,
  `detect-stack-drift`, `create-stack-set`, `create-stack-instances`. Terraform equivalent:
  `aws_cloudformation_stack`, `aws_cloudformation_stack_set` (or model resources natively in
  Terraform instead). The `cfn-lint` and `cfn-guard` tools validate templates and policy.
