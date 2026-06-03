---
name: aws-codepipeline
description: Use when designing, provisioning, securing, or operating AWS CodePipeline — the managed continuous-delivery service that models a release as ordered stages of actions (source → build → test → deploy) with artifacts flowing between them (AWS CodePipeline). Loads the CodePipeline knowledge: pipelines, stages and actions (source/build/test/deploy/approval/invoke), action providers (CodeCommit/GitHub via CodeConnections, CodeBuild, CodeDeploy, ECS, CloudFormation, Lambda), artifact store (S3) and input/output artifacts, V1 vs V2 pipeline types and triggers/filters, parallel actions and run order, manual approvals, variables/namespaces, cross-account/cross-region, IAM service roles, cost/limits, and verification by executing the pipeline and confirming each stage succeeds. The 2nd consumer is the AWS role team (aws-iac-engineer / aws-cloud-architect) provisioning delivery automation. Consumed by the CodePipeline specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, codepipeline, developer-tools, cd, pipeline, devtools]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS CodePipeline

A managed **continuous-delivery orchestration** service. It models a release as ordered **stages**, each
containing **actions**, with **artifacts** passed stage to stage. It ties the AWS-native chain together:
it consumes source, invokes **CodeBuild** to build/test, and drives **CodeDeploy** (or ECS/CloudFormation/
Lambda) to deploy — the conductor over those execution services.

## Core concepts and components
- **Pipeline** — the top-level workflow; **V2** type adds richer triggers/filters, variables, and
  pricing by active minutes; **V1** is the original per-pipeline model.
- **Stages and actions** — stages run in order; each holds **actions** of a category: **source**,
  **build**, **test**, **deploy**, **approval**, **invoke**. Actions in a stage can run in parallel via
  **run order**.
- **Action providers** — source (CodeCommit, S3, GitHub/Bitbucket via **CodeConnections**), build/test
  (**CodeBuild**), deploy (**CodeDeploy**, **ECS**, **CloudFormation**, S3, Lambda), and manual
  **approval**.
- **Artifacts** — actions read **input artifacts** and emit **output artifacts** stored in the
  pipeline's **artifact store** (S3 bucket, KMS-encrypted).
- **Triggers** — V2 trigger/filter rules (branch/tag/path) and webhooks start executions; **variables**
  and **namespaces** pass values between actions.
- **Cross-account / cross-region** — deploy across accounts/regions with shared roles and region
  artifact stores.

## Configuration and sizing
- Structure stages to mirror your release (source → build → deploy, plus test/approval gates). Use
  **parallel actions** (same run order) to speed independent steps. Choose **V2** for branch/tag/path
  triggers and variables. Place a **manual approval** before production. Keep one artifact store per
  region; encrypt it with **KMS**.

## Security and IAM
- The pipeline **service role** assumes into each action's permissions — scope it to the specific
  CodeBuild projects, CodeDeploy apps, S3 buckets, ECR/ECS, CloudFormation stacks, and **CodeConnections**
  it uses (no wildcards). Cross-account deploys use **assumed roles** in the target account. Encrypt the
  **artifact bucket** with KMS and restrict who can edit pipelines or approve production stages.

## Cost levers
- **V2** bills per **active pipeline-minute**; **V1** bills a flat fee per active pipeline/month. Levers:
  use V1 for always-active simple pipelines and V2 where you want fine-grained/triggered execution,
  consolidate rarely-used pipelines, and remember the real spend is the **downstream CodeBuild minutes
  and deploy compute** the pipeline drives. Artifact S3 storage is minor; lifecycle-expire old artifacts.

## Scaling and limits
- Quotas on pipelines, stages/actions per pipeline, and concurrent executions (raisable). Pipeline
  **superseding** can skip intermediate runs when executions queue. Cross-region actions need a regional
  artifact store. Approval actions block until acted on (with timeout).

## Operating procedure
1. **Provision** — create the **pipeline** (artifact store, stages, actions, service role) via Terraform
   `aws_codepipeline` (+ `aws_codestarconnections_connection`/`aws_codeconnections_connection`) or
   `aws codepipeline create-pipeline`.
2. **Configure** — define stages/actions and providers (source via CodeConnections, build via
   CodeBuild, deploy via CodeDeploy/ECS/CloudFormation), wire artifacts, triggers/filters (V2), and
   approval gates.
3. **Secure** — least-privilege service role scoped to referenced resources, cross-account assume roles,
   KMS-encrypted artifact bucket, restricted edit/approval.
4. **Verify** — apply [[verify-by-running]]: start an execution (`aws codepipeline start-pipeline-execution`),
   poll `get-pipeline-state` / `get-pipeline-execution` until every stage shows **Succeeded**, and
   confirm the artifact flowed end-to-end and the deploy stage updated the target — capture the
   execution status/output.

## Inputs
Release flow (stages/gates), source provider + connection, build/test (CodeBuild) and deploy
(CodeDeploy/ECS/CFN) targets, V1 vs V2 + trigger/filter rules, approval points, cross-account/region
needs, IAM roles, cost constraints.

## Output
A CodePipeline setup — a staged pipeline (source/build/test/deploy + approvals) wiring CodeBuild and
CodeDeploy/ECS/CloudFormation, with artifacts, triggers, least-privilege roles, and a KMS-encrypted
artifact store — plus verification that an execution ran every stage to Succeeded and deployed the
artifact.

## Notes
- Gotchas: service roles routinely over-broad — scope to referenced projects/apps/buckets; the artifact
  bucket and KMS key must be reachable cross-region/cross-account or actions fail; source via GitHub
  needs a **CodeConnections** connection (not a raw token); V1↔V2 type changes affect triggers and
  billing; superseded executions can silently skip runs; approval actions stall the pipeline until
  acted on/timeout; the real cost and failures usually live in the downstream CodeBuild/CodeDeploy
  actions, not the pipeline itself.
- IaC/CLI: Terraform `aws_codepipeline`, `aws_codeconnections_connection`
  (legacy `aws_codestarconnections_connection`), `aws_codepipeline_webhook`. CLI
  `aws codepipeline create-pipeline`, `start-pipeline-execution`, `get-pipeline-state`,
  `get-pipeline-execution`, `list-pipeline-executions`. CloudFormation `AWS::CodePipeline::Pipeline`,
  `AWS::CodePipeline::Webhook`, `AWS::CodeStarConnections::Connection`.
