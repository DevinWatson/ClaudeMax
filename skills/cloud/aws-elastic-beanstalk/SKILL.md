---
name: aws-elastic-beanstalk
description: Use when designing, deploying, securing, or operating AWS Elastic Beanstalk — applications, environments, platforms/solution stacks, environment tiers (web server vs worker), configuration via option settings and .ebextensions/.platform, deployment policies (all-at-once/rolling/immutable/blue-green via swap), managed updates, and the underlying EC2/ASG/ELB it provisions (AWS Elastic Beanstalk). Loads the Beanstalk-specific knowledge: how to pick a platform, configure environments, choose a deployment policy, secure it, and verify health. Consumed by the Beanstalk specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) for PaaS-style app deploys.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, elastic-beanstalk, paas, deployment, ebextensions, environments]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Elastic Beanstalk

A PaaS that deploys and operates web apps by orchestrating EC2, Auto Scaling, ELB, and CloudWatch
for you from an uploaded app bundle — you manage code and config, AWS manages the plumbing. Pick
Beanstalk for teams that want push-to-deploy on familiar platforms (Node/Python/Java/PHP/Ruby/Go/
.NET/Docker) without authoring all the infra; pick Fargate/ECS for pure container orchestration,
Lambda for event-driven, or raw EC2/IaC when you need full control of the underlying resources.

## Core concepts and components
- **Application** — top-level container holding versions and environments.
- **Application version** — a labeled, immutable deployable bundle (S3 source).
- **Environment** — a running deployment of one version on a **platform/solution stack**; comes
  in **web server tier** (handles HTTP behind an ELB) or **worker tier** (processes an SQS queue).
- **Configuration** — **option settings** plus `.ebextensions/*.config` and `.platform/` hooks
  to customize the provisioned resources.
- Beanstalk provisions and owns EC2 instances, an Auto Scaling group, optional load balancer, and
  CloudWatch alarms.

## Configuration and sizing
- Choose single-instance (dev) vs load-balanced + ASG (prod). Set instance type and ASG min/max
  via option settings; configure the ALB, health check path, and enhanced health reporting.
- Prefer `.platform/` hooks (current) over legacy `.ebextensions` commands where possible; keep
  config in source control with the app version.

## Security and IAM
- Two roles: the **service role** (Beanstalk manages resources) and the **EC2 instance profile**
  (what the app may call — least privilege).
- Terminate TLS at the ALB with ACM certs; put instances in private subnets; scope the
  environment security group to the ALB.
- Store secrets in SSM/Secrets Manager and read at runtime; avoid plaintext env properties for
  sensitive values.

## Cost levers
- You pay only for the underlying resources (EC2/EBS/ELB/data) — Beanstalk itself is free. Right-
  size instances and ASG bounds; use Spot in the ASG for tolerant workloads; single-instance for
  non-prod.

## Scaling and limits
- Scaling is the managed ASG with trigger-based policies (CPU/network/custom CloudWatch). Worker
  tier scales on queue depth. Managed platform updates keep the stack patched.

## Operating procedure
1. **Provision** — create the application + environment on the right platform via
   `aws elasticbeanstalk create-application`/`create-environment` or Terraform
   `aws_elastic_beanstalk_application` + `aws_elastic_beanstalk_environment`.
2. **Configure** — set option settings (instance type, ASG bounds, ALB, health path, env vars),
   add `.platform/`/`.ebextensions` hooks, choose a deployment policy.
3. **Secure** — least-privilege instance profile + service role, ACM TLS on the ALB, private
   subnets, secrets via SSM/Secrets Manager.
4. **Verify** — apply [[verify-by-running]]: deploy a version, confirm
   `aws elasticbeanstalk describe-environments` shows `Status: Ready` and `Health: Green`, the
   environment URL returns the expected response, and events show the deployment completed.

## Inputs
App platform/language, deployable bundle, environment tier (web vs worker), traffic profile +
ASG bounds, deployment-policy risk tolerance, downstream IAM needs, TLS/domain.

## Output
An application + environment definition with platform choice, tier, instance/ASG sizing,
deployment policy, the two IAM roles, config (option settings / hooks), and verification evidence.

## Notes
- Gotchas: deployment policy choice drives risk — all-at-once causes downtime, immutable/blue-
  green are safest; in-place rolling can leave a mixed fleet on failure; `.ebextensions` ordering
  and the move to `.platform/` hooks; managed updates need a maintenance window; the env owns its
  resources so out-of-band edits drift; blue-green is a manual URL/CNAME swap.
- IaC/CLI: Terraform `aws_elastic_beanstalk_application`, `aws_elastic_beanstalk_environment`,
  `aws_elastic_beanstalk_application_version`. CLI `aws elasticbeanstalk create-environment`,
  `describe-environments`, `update-environment`; the `eb` CLI. CloudFormation
  `AWS::ElasticBeanstalk::Environment`.
