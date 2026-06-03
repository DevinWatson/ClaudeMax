---
name: aws-ecs
description: Use when designing, provisioning, securing, or operating Amazon ECS — clusters, task definitions, services, the Fargate vs EC2 launch types, task/execution IAM roles, awsvpc networking and service connect/discovery, load balancer integration, autoscaling, and rolling/blue-green deploys (Amazon ECS). Loads the ECS knowledge: how to write a task definition, run it as a service, scope its two IAM roles, wire networking and a load balancer, scale it, and verify tasks are healthy. Consumed by the ECS specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they run containers.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, ecs, containers, fargate, task-definition, orchestration]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon ECS

AWS's native container orchestrator. You define tasks (one or more containers) and run them as
long-lived services or one-off tasks on either Fargate (serverless) or EC2 capacity. Choose ECS
over EKS when you want AWS-native simplicity without Kubernetes; choose EKS when you need the
Kubernetes API/ecosystem or multi-cloud portability.

## Core concepts and components
- **Cluster** — a logical grouping of capacity (Fargate and/or EC2 capacity providers).
- **Task definition** — the immutable, versioned blueprint: containers, image, CPU/memory, ports,
  env/secrets, log config, the task role and execution role, volumes.
- **Task** — a running instantiation of a task definition. **Service** — keeps N tasks running,
  integrates with a load balancer, and handles deployments.
- **Launch type / capacity provider** — **Fargate** (no servers to manage) or **EC2** (you run
  the container instances; cheaper at scale, more control).
- **Networking** — `awsvpc` mode gives each task its own ENI/IP + SG; Service Connect / Cloud Map
  for service-to-service discovery.

## Configuration and sizing
- Set task-level CPU/memory (Fargate uses fixed CPU/mem combinations); container-level limits
  optional. Right-size from CloudWatch/Container Insights.
- Use Fargate for spiky/low-ops workloads; EC2 capacity providers (with Spot) for steady, dense,
  or GPU/large-image workloads.

## Security and IAM
- **Two roles**: the **execution role** (lets ECS pull images from ECR and write logs/fetch
  secrets) and the **task role** (what the app's code may call) — keep both least-privilege.
- Pull secrets from Secrets Manager/SSM via the task definition, not env vars. `awsvpc` + tight
  SGs; private subnets with NAT/endpoints; enable image scanning upstream in ECR.

## Cost levers
- Fargate billed per vCPU/GB-second — right-size tasks, use Fargate Spot for interruptible work.
  EC2 capacity providers + Spot + bin-packing are cheaper at steady high density.

## Scaling and limits
- **Service Auto Scaling** (target tracking on CPU/mem/ALB request count) scales task count;
  cluster Auto Scaling (capacity providers) scales EC2 capacity. Account/region task and ENI
  quotas apply; `awsvpc` consumes a subnet IP per task.

## Operating procedure
1. **Provision** — create a cluster and register a task definition (image from ECR, CPU/mem,
   ports, log driver, execution + task roles) via Terraform `aws_ecs_cluster` /
   `aws_ecs_task_definition` or `aws ecs register-task-definition`.
2. **Configure** — create a service (desired count, launch type/capacity provider, `awsvpc`
   subnets/SG, ALB target group, deployment controller) and service autoscaling.
3. **Secure** — least-privilege execution + task roles, secrets via Secrets Manager/SSM, private
   subnets + tight SGs.
4. **Verify** — apply [[verify-by-running]]: `aws ecs describe-services` shows `runningCount` ==
   desired and rollout `COMPLETED`, target group health checks pass, a request to the ALB
   returns the expected response, and `describe-tasks`/logs show no crashloop.

## Inputs
Container image(s) + ports, CPU/mem profile, launch-type preference (Fargate vs EC2), networking
(subnets/SG/LB), required AWS permissions for the app, scaling signal and bounds, secrets.

## Output
A task definition, a service with networking + LB + autoscaling, the two IAM roles, the
launch-type/capacity-provider choice, and verification of healthy tasks behind the LB.

## Notes
- Gotchas: task defs are immutable (new revision per change); execution-role vs task-role
  confusion is the #1 ECR-pull/secret failure; `awsvpc` tasks each take a subnet IP (plan CIDR);
  Fargate has fixed CPU/mem pairings; stopped tasks' `stoppedReason` is your first debug stop.
- IaC/CLI: Terraform `aws_ecs_cluster`, `aws_ecs_task_definition`, `aws_ecs_service`,
  `aws_appautoscaling_target`/`_policy`. CLI `aws ecs register-task-definition`, `create-service`,
  `update-service`, `describe-services`, `describe-tasks`. CloudFormation `AWS::ECS::*`.
