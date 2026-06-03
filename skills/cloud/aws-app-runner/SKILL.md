---
name: aws-app-runner
description: Use when designing, building, securing, or operating AWS App Runner — services from a container image (ECR) or source repo (auto-build), automatic HTTPS endpoints, autoscaling configurations (concurrency/min/max), instance CPU/memory sizing, VPC connectors for private egress, instance vs access roles, custom domains, observability, and auto-deploy on push (AWS App Runner). Loads the App Runner-specific knowledge: how to choose source, size and autoscale, scope its roles, reach private resources, and verify the service. Consumed by the App Runner specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) for fully managed web-service hosting.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, app-runner, containers, paas, autoscaling, web-service]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS App Runner

A fully managed service that runs a containerized web app or API directly from an image or source
repo, giving you an HTTPS URL, autoscaling, and load balancing with almost no infrastructure to
manage. Pick App Runner for a single HTTP/HTTPS web service or API when you want the simplest path
from container/repo to a managed scalable endpoint; pick Fargate/ECS when you need fine-grained
networking, sidecars, non-HTTP protocols, or multiple coordinated containers; pick Lambda for
event-driven functions; pick Beanstalk when you want it to own the EC2/ASG stack.

## Core concepts and components
- **Service** — the deployable unit, fronted by a managed HTTPS endpoint and load balancer.
- **Source** — either a **container image** (ECR private/public) or a **source code repo**
  (App Runner builds it) with optional **auto-deploy on push**.
- **Instance configuration** — CPU/memory per instance and the **instance role** (app's runtime
  IAM). **Access role** — pulls private ECR images.
- **Autoscaling configuration** — `MaxConcurrency` per instance, plus `MinSize`/`MaxSize`.
- **VPC connector** — routes outbound traffic into a VPC to reach private resources (RDS, etc.).
- **Custom domains** with managed certificates; built-in metrics/logs.

## Configuration and sizing
- Pick a CPU/memory pair (e.g. 0.25 vCPU/0.5 GB up to 4 vCPU/12 GB); App Runner scales out by
  adding instances when concurrent requests exceed `MaxConcurrency`.
- Set a health check path; tune `MaxConcurrency` to per-instance capacity; bound Max instances.

## Security and IAM
- **Instance role** — least-privilege IAM the app uses at runtime. **Access role** — only ECR
  pull permissions for private images. Keep distinct.
- Use a **VPC connector** so egress reaches private subnets; the service endpoint itself is
  public unless you use a private-endpoint configuration. Inject secrets via env from Secrets
  Manager/SSM references.

## Cost levers
- Billed for provisioned memory always + active CPU when handling requests; idle instances bill
  memory-only at a reduced rate. Lower Min size, tune concurrency to need fewer instances, and
  scale to the Min when idle. ARM is not separately configured; right-size CPU/memory.

## Scaling and limits
- Autoscales between Min and Max instances on concurrent-request load; scales toward Min when
  idle (does not fully scale to zero like Lambda). HTTP/HTTPS only; one service = one container
  image/app. Per-region service quotas apply.

## Operating procedure
1. **Provision** — create the service from an ECR image or source repo with instance config and
   autoscaling config via `aws apprunner create-service` or Terraform `aws_apprunner_service`
   (+ `aws_apprunner_auto_scaling_configuration_version`).
2. **Configure** — health check path, `MaxConcurrency`/Min/Max, env + secret references, custom
   domain, auto-deploy, VPC connector if it needs private resources.
3. **Secure** — least-privilege instance role, ECR-only access role, VPC connector for private
   egress, secrets via Secrets Manager references.
4. **Verify** — apply [[verify-by-running]]: confirm `aws apprunner describe-service` shows
   `Status: RUNNING` with a successful operation, the service URL returns the expected HTTPS
   response, and the application logs show a clean startup.

## Inputs
Source (image vs repo + runtime), CPU/memory profile, expected concurrency + scaling bounds,
private-resource egress needs, secrets, custom domain.

## Output
A service definition with source + build config, instance sizing, autoscaling configuration,
instance vs access role split, VPC connector decision, and verification evidence.

## Notes
- Gotchas: HTTP/HTTPS only (no TCP/UDP/websocket-heavy edge cases historically limited); does not
  scale to zero (Min always billed for memory); single container per service (no sidecars);
  source-build mode rebuilds on push (CI implications); reaching RDS/private endpoints requires a
  VPC connector; cold provisioning on scale-up adds latency.
- IaC/CLI: Terraform `aws_apprunner_service`, `aws_apprunner_auto_scaling_configuration_version`,
  `aws_apprunner_vpc_connector`, `aws_apprunner_custom_domain_association`. CLI
  `aws apprunner create-service`, `describe-service`, `update-service`, `start-deployment`.
  CloudFormation `AWS::AppRunner::Service`.
