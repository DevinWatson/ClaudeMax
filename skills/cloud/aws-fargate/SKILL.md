---
name: aws-fargate
description: Use when designing, building, securing, or operating AWS Fargate — serverless containers on ECS (and EKS), task definitions, services, task/CPU-memory sizing, awsvpc networking, task vs execution roles, load balancer integration, autoscaling, capacity providers (Fargate/Fargate Spot), and logging (AWS Fargate). Loads the Fargate-specific knowledge: how to size a task, split task vs execution roles, wire networking/ALB, autoscale, control cost, and verify a service is healthy. Consumed by the Fargate specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they run containers without managing nodes.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, fargate, ecs, containers, serverless, task-definition]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Fargate

Serverless container compute: run containers on ECS or EKS without provisioning or patching EC2
nodes — you specify CPU/memory per task and AWS runs it. Pick Fargate for containerized
long-running services/jobs when you want containers but not node management; pick EC2 launch type
when you need GPUs, custom kernels, daemon sets, or sub-cent bin-packing density; pick Lambda for
short event-driven functions.

## Core concepts and components
- **Task definition** — immutable, versioned blueprint: container image(s), CPU/memory at task
  and container level, ports, env, log config, **task role** and **execution role**.
- **Task** — a running instance of a task definition. **Service** — keeps N tasks running behind
  optional load balancer with rolling/blue-green deploys.
- **awsvpc networking** — every task gets its own ENI, private IP, and security group.
- **Capacity providers** — `FARGATE` and `FARGATE_SPOT`; cluster-level capacity strategy.
- **Cluster** — logical grouping of services/tasks.

## Configuration and sizing
- Fargate CPU/memory come in fixed valid combinations (e.g. 0.25 vCPU → 0.5–2 GB; 1 vCPU →
  2–8 GB). Size to steady-state plus headroom; scale out, not up, for spiky load.
- Use `awslogs`/`awsfirelens` for logs; set `healthCheck` in the container def.
- Platform version `LATEST` unless pinning for a specific feature; ARM64 (`runtimePlatform`) for
  price/perf.

## Security and IAM
- **Execution role** — pulls images (ECR), writes logs, fetches secrets at start. **Task role** —
  what the *app* may call at runtime (least privilege; keep distinct from execution role).
- Inject secrets via `secrets` from Secrets Manager/SSM, not plaintext env.
- One security group per service scoped to the ALB SG; tasks in private subnets with NAT or VPC
  endpoints for ECR/S3/logs.

## Cost levers
- Billed per vCPU-second + GB-second while tasks run. Right-size CPU/memory; **Fargate Spot** for
  interruptible/batch (big discount); Compute Savings Plans for steady baseline.
- Scale to the real concurrency; avoid over-provisioning desired count.

## Scaling and limits
- Service Auto Scaling (target tracking on CPU/memory/ALB request count or step scaling); min/max
  task bounds. Tasks start in seconds but slower than Lambda. Per-region task/ENI quotas apply.

## Operating procedure
1. **Provision** — register a task definition (image, CPU/mem, task+execution roles, log config,
   secrets) and create a service via Terraform `aws_ecs_task_definition` + `aws_ecs_service` or
   `aws ecs register-task-definition` / `create-service`.
2. **Configure** — awsvpc subnets/SG, ALB target group + health check, autoscaling target/policy.
3. **Secure** — distinct least-privilege task vs execution roles, secrets via Secrets Manager,
   private subnets + VPC endpoints, tight SG chained to the ALB.
4. **Verify** — apply [[verify-by-running]]: confirm `aws ecs describe-services` shows
   `runningCount == desiredCount` and a completed deployment, ALB target group targets are
   `healthy`, and a request through the ALB returns the expected response; check task logs.

## Inputs
Container image(s), CPU/mem profile, port/protocol, ingress (public/internal ALB), scaling
signal + bounds, downstream IAM needs, secrets.

## Output
A task definition + service definition with sizing rationale, task/execution role split, awsvpc
networking + ALB wiring, autoscaling policy, capacity (on-demand vs Spot), and verification
evidence.

## Notes
- Gotchas: confusing task role vs execution role is the #1 mistake; awsvpc consumes an ENI/IP per
  task (subnet IP exhaustion); no privileged containers/daemonsets/GPUs on Fargate; image pulls
  need ECR access via the execution role; ephemeral storage default 20 GB (configurable to 200).
- IaC/CLI: Terraform `aws_ecs_cluster`, `aws_ecs_task_definition`, `aws_ecs_service`,
  `aws_appautoscaling_target/policy`. CLI `aws ecs register-task-definition`, `create-service`,
  `describe-services`, `update-service`. CloudFormation `AWS::ECS::TaskDefinition`,
  `AWS::ECS::Service`.
