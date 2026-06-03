---
name: aws-batch
description: Use when designing, building, securing, or operating AWS Batch — compute environments (managed/unmanaged, EC2/Spot/Fargate), job queues with priorities, job definitions (container, vCPU/memory/GPU, retries, timeouts), array jobs, job dependencies, scheduling policies/fair-share, and CE scaling/allocation strategies (AWS Batch). Loads the Batch-specific knowledge: how to model queues and compute environments, size jobs, scope job/execution roles, control cost with Spot, and verify a job runs. Consumed by the Batch specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) for large-scale batch/HPC workloads.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, batch, hpc, job-queue, spot, compute-environment]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Batch

Fully managed batch and HPC job scheduling: you define containerized jobs and queues, and Batch
provisions/scales the compute (EC2, Spot, or Fargate) to run them, then scales back to zero. Pick
Batch for large fleets of independent jobs, array/parameter sweeps, dependency DAGs, GPU/HPC, and
cost-driven Spot batch; pick Lambda for short event functions, Step Functions for orchestration
of heterogeneous steps, and ECS/Fargate services for long-running online services.

## Core concepts and components
- **Compute environment (CE)** — the pool that runs jobs: **managed** (Batch provisions EC2 ASG
  or Fargate) or **unmanaged**; instance types or Fargate, On-Demand or **Spot**, with an
  **allocation strategy** (BEST_FIT_PROGRESSIVE / SPOT_CAPACITY_OPTIMIZED).
- **Job queue** — priority-ordered queue mapped to one or more CEs; jobs land here.
- **Job definition** — container image, vCPU/memory/GPU, command, env, **retry strategy**,
  **timeout**, **job role** and **execution role**.
- **Array jobs** — one submission, N indexed children. **Dependencies** — DAG ordering between
  jobs. **Scheduling policy** — fair-share across share identifiers.

## Configuration and sizing
- Size vCPU/memory (and GPU) in the job definition to the actual job; use array jobs for
  embarrassingly parallel work. Set realistic timeouts and bounded retries.
- Map a high-priority queue to a fast CE and a bulk queue to a Spot CE; set CE min/max/desired
  vCPUs to bound scale.

## Security and IAM
- **Job role** (`taskRoleArn`) — least-privilege permissions the running container needs.
  **Execution role** — image pull (ECR), logs, secrets for Fargate jobs. Keep them distinct.
- Run in private subnets with VPC endpoints/NAT for ECR/S3/logs; scope the CE security group.
- Pull secrets from Secrets Manager/SSM; encrypt outputs (S3 SSE/KMS).

## Cost levers
- **Spot CEs** with capacity-optimized allocation cut cost dramatically for retry-tolerant jobs.
  Scale-to-zero between bursts; right-size job vCPU/memory; pack with array jobs; Fargate for
  spiky small jobs (no idle nodes) vs EC2 for dense bin-packing.

## Scaling and limits
- Managed CEs scale compute up to max vCPUs based on queued demand and back to zero when idle.
  EC2 service quotas (On-Demand/Spot vCPUs) cap the CE; per-region Batch limits apply.

## Operating procedure
1. **Provision** — create a CE (EC2/Spot or Fargate, allocation strategy, min/max vCPU), a job
   queue mapped to it, and a job definition via Terraform `aws_batch_compute_environment` +
   `aws_batch_job_queue` + `aws_batch_job_definition` or `aws batch create-*`.
2. **Configure** — queue priority + CE mapping, job vCPU/memory/GPU, retries/timeout, array/
   dependency structure, scheduling policy for fair-share.
3. **Secure** — distinct least-privilege job vs execution roles, private subnets + endpoints,
   scoped CE SG, secrets via Secrets Manager.
4. **Verify** — apply [[verify-by-running]]: submit a job with `aws batch submit-job`, confirm it
   transitions to `SUCCEEDED` via `describe-jobs`, the CE scaled up then back down, and the job
   logs in CloudWatch show the expected output.

## Inputs
Job container + command, per-job vCPU/memory/GPU, parallelism (single vs array vs DAG),
interruption tolerance (Spot?), priority/fair-share needs, downstream IAM, region/quotas.

## Output
A CE + job queue + job definition set with sizing and allocation rationale, queue/priority
mapping, job vs execution role split, retry/timeout policy, Spot strategy, and verification
evidence.

## Notes
- Gotchas: Spot interruptions require idempotent, retry-safe jobs; Fargate CEs can't use GPUs or
  large local scratch (use EC2); CE min vCPUs > 0 keeps idle cost; array job index via
  `AWS_BATCH_JOB_ARRAY_INDEX`; queue is blocked if its CEs hit vCPU quota; job role vs execution
  role confusion (same trap as ECS).
- IaC/CLI: Terraform `aws_batch_compute_environment`, `aws_batch_job_queue`,
  `aws_batch_job_definition`, `aws_batch_scheduling_policy`. CLI `aws batch
  create-compute-environment`, `create-job-queue`, `register-job-definition`, `submit-job`,
  `describe-jobs`. CloudFormation `AWS::Batch::*`.
