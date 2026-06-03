---
name: aws-codedeploy
description: Use when designing, provisioning, securing, or operating AWS CodeDeploy — the managed deployment service that automates application releases to EC2/on-premises, ECS, and Lambda with controlled rollout strategies and automatic rollback (AWS CodeDeploy). Loads the CodeDeploy knowledge: applications and deployment groups, compute platforms (EC2/on-prem, ECS, Lambda), the AppSpec file (hooks/lifecycle events), deployment strategies (in-place vs blue/green, all-at-once/canary/linear), traffic shifting and rollback/alarms, the CodeDeploy agent, target groups/load balancers, IAM service roles, deployment configs, cost/limits, and verification by running a deployment and confirming healthy traffic shift. The 2nd consumer is the AWS role team (aws-iac-engineer / aws-cloud-architect) provisioning release automation. Consumed by the CodeDeploy specialist.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, codedeploy, developer-tools, deployment, blue-green, devtools]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS CodeDeploy

A managed **deployment** service that automates releasing application revisions to **EC2/on-premises
instances, ECS services, and Lambda functions** with controlled rollout strategies (blue/green, canary,
linear) and automatic **rollback**. It is the **deploy** stage in the AWS-native CodePipeline →
CodeBuild → CodeDeploy chain — it moves a built artifact safely into production.

## Core concepts and components
- **Application** — a deployment target grouping tied to a **compute platform**: **EC2/on-premises**,
  **ECS**, or **Lambda**.
- **Deployment group** — the set of targets (tagged instances, ASG, ECS service, or Lambda alias) plus
  the deployment config, load balancer, alarms, and rollback settings.
- **AppSpec file** — `appspec.yml`/`.json` defining the revision: for EC2 the file mappings and
  **lifecycle hook** scripts (`BeforeInstall`, `AfterInstall`, `ApplicationStart`, `ValidateService`,
  etc.); for ECS/Lambda the task/function and hook **Lambda** validations.
- **Deployment strategies** — **in-place** (update existing, EC2 only) vs **blue/green** (new
  fleet/task set, shift traffic, terminate old); rollout shapes: **all-at-once**, **canary** (shift a %
  then the rest), **linear** (equal increments).
- **Traffic shifting + rollback** — shift via ELB target groups / Lambda alias weights / ECS task sets;
  **auto-rollback** on failed hooks or **CloudWatch alarms**.
- **CodeDeploy agent** — required on EC2/on-prem targets.

## Configuration and sizing
- Choose **in-place** for simple EC2 updates, **blue/green** for zero-downtime and instant rollback
  (required for ECS/Lambda). Pick a **deployment config** (canary/linear) sized to your risk tolerance
  and bake time; wire **CloudWatch alarms** so bad releases auto-rollback. For EC2 ensure the **agent**
  is installed and instances are correctly tagged into the group.

## Security and IAM
- The **service role** lets CodeDeploy read the revision (S3/GitHub), manage instances/ASG/ECS/Lambda,
  and register/deregister with load balancers — scope it to those resources, not wildcards. EC2 targets
  need an **instance profile** to pull the revision from S3 (+ KMS decrypt). Restrict who can create
  deployments. Hook scripts run with the instance role — keep them least-privilege and audited.

## Cost levers
- CodeDeploy itself is **free for EC2/Lambda deployments**; on-premises instance deployments are billed
  per update. Real cost is the underlying compute — **blue/green** briefly runs **double capacity**
  (extra instances/task sets) during the shift, so size the bake window and terminate the old fleet
  promptly. Canary/linear reduce blast radius without extra cost.

## Scaling and limits
- Per-account quotas on concurrent deployments, deployment groups, and revisions (raisable). ECS
  blue/green needs two target groups + a listener; Lambda shifts via alias weights. Bake/wait times and
  alarm evaluation extend deployment duration. Agent version must be current on EC2 targets.

## Operating procedure
1. **Provision** — create the **application** and **deployment group** (compute platform, targets,
   deployment config, load balancer, alarms, auto-rollback) via Terraform
   `aws_codedeploy_app` / `aws_codedeploy_deployment_group` or `aws deploy create-application` /
   `create-deployment-group`.
2. **Configure** — author the **AppSpec** (file mappings + lifecycle hooks for EC2, or task set /
   function + hook Lambdas for ECS/Lambda), choose in-place vs blue/green and canary/linear.
3. **Secure** — least-privilege service role + instance profile, KMS decrypt for the revision, audited
   hook scripts, restricted deployment creation.
4. **Verify** — apply [[verify-by-running]]: trigger a deployment (`aws deploy create-deployment`), poll
   `get-deployment` until `Succeeded`, confirm traffic shifted to the new version and target health is
   green (and that a forced failure **auto-rolls back**) — capture the deployment status/output.

## Inputs
Compute platform (EC2/on-prem/ECS/Lambda), revision source/artifact, in-place vs blue/green +
canary/linear choice, load balancer/target groups, lifecycle validation hooks, rollback alarms, IAM
roles, downtime/risk tolerance.

## Output
A CodeDeploy setup — application + deployment group, an AppSpec with validation hooks, a chosen
strategy with traffic shifting and alarm-based auto-rollback, and least-privilege roles — plus
verification that a deployment Succeeded, traffic shifted to a healthy target, and rollback fires on
failure.

## Notes
- Gotchas: missing/old **CodeDeploy agent** or wrong instance tags = targets never deploy; AppSpec hook
  failures stall or roll back the whole deployment; **blue/green doubles capacity** during the shift
  (cost + quota); ECS blue/green requires two target groups and a properly wired listener; without
  CloudWatch alarms a bad release won't auto-rollback; the instance profile must allow S3 read + KMS
  decrypt of the revision; in-place updates cause brief unavailability per instance.
- IaC/CLI: Terraform `aws_codedeploy_app`, `aws_codedeploy_deployment_group`,
  `aws_codedeploy_deployment_config`. CLI `aws deploy create-application`, `create-deployment-group`,
  `create-deployment`, `get-deployment`, `list-deployments`. CloudFormation
  `AWS::CodeDeploy::Application`, `AWS::CodeDeploy::DeploymentGroup`, `AWS::CodeDeploy::DeploymentConfig`.
