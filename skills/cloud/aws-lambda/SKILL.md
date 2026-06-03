---
name: aws-lambda
description: Use when designing, building, securing, or operating AWS Lambda — functions, runtimes, handlers, triggers/event sources, memory/timeout sizing, concurrency (reserved/provisioned), cold starts, layers, container images, execution roles, environment/secrets, and packaging/deploy (AWS Lambda). Loads the Lambda-specific knowledge: how to size and tune a function, wire event sources, scope its execution role, control concurrency and cost, and verify an invocation. Consumed by the Lambda specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they touch serverless compute.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, lambda, serverless, functions, concurrency, event-driven]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Lambda

Event-driven, serverless functions: you ship code, AWS runs it on demand and scales to zero. No
servers to patch. Pick Lambda for event/glue/API-backend workloads with bursty or low-baseline
traffic and sub-15-minute executions; pick Fargate/EC2 for long-running, high-steady-throughput,
or large-image workloads where per-invocation overhead dominates.

## Core concepts and components
- **Function** — code + config (runtime, handler, memory, timeout, role).
- **Runtime** — managed (Node, Python, Java, .NET, Go, Ruby), custom runtime, or **container
  image** (up to 10 GB).
- **Event source / trigger** — API Gateway/Function URL, S3, SQS, SNS, EventBridge, DynamoDB
  Streams, Kinesis; pull sources use **event source mappings**.
- **Execution role** — IAM role the function assumes; **resource policy** controls who may
  invoke it.
- **Layers** — shared dependencies/runtimes. **Versions + aliases** — immutable publishes with
  traffic-shifting aliases.
- **Concurrency** — **reserved** (caps/guarantees), **provisioned** (pre-warmed, kills cold
  starts).

## Configuration and sizing
- Memory (128 MB–10 GB) also scales CPU/network proportionally — tune memory to minimize
  `duration * price`, not just to fit. Use Lambda Power Tuning.
- Timeout ≤ 15 min; set it to a realistic ceiling, not the max.
- Keep deploy package small; init heavy SDK clients outside the handler for reuse.

## Security and IAM
- Execution role: least privilege — grant only the specific actions/ARNs the function needs.
- Pull secrets from Secrets Manager/Parameter Store at runtime; never hardcode. Encrypt env vars
  with a customer KMS key for sensitive values.
- Put network-bound functions in a VPC (subnets + SG) only when they need private resources;
  otherwise stay out of VPC to avoid ENI overhead.
- Restrict invoke via resource policy / source ARN conditions.

## Cost levers
- Billed per request + GB-seconds (memory * duration). Reduce memory-time product; cache/reuse
  connections; batch SQS records. Use ARM (`arm64`) for ~20% lower price/perf.
- Provisioned concurrency costs even when idle — use only for latency-sensitive paths.

## Scaling and limits
- Scales automatically; account concurrency quota (default 1000) is shared across all functions —
  use reserved concurrency to protect critical functions and to throttle downstream.
- Payload limits (6 MB sync / 256 KB async), `/tmp` up to 10 GB, 15-min max.

## Operating procedure
1. **Provision** — define the function (runtime/image, handler, memory, timeout, role, env) via
   Terraform `aws_lambda_function` or `aws lambda create-function`; publish a version + alias.
2. **Configure** — wire the trigger / event source mapping; set concurrency; add layers.
3. **Secure** — least-privilege execution role, KMS-encrypted env/secrets, tight resource policy,
   VPC only if needed.
4. **Verify** — apply [[verify-by-running]]: `aws lambda invoke` with a sample event, confirm a
   200/expected payload, check the function returned without timeout/throttle, and inspect
   CloudWatch logs for errors and init/duration.

## Inputs
Trigger type and event shape, expected RPS/burstiness, latency SLO, runtime/language, dependency
size, downstream resources, secrets needs.

## Output
A function definition with sizing rationale (memory/timeout/concurrency), execution role,
trigger/event-source wiring, packaging strategy, and the invoke verification + log evidence.

## Notes
- Gotchas: cold starts (worst in VPC + large packages/Java); SQS partial-batch failures need
  `ReportBatchItemFailures`; recursive S3→Lambda→S3 loops; async retries (2) + DLQ; concurrency
  exhaustion throttles the whole account; idempotency required for at-least-once sources.
- IaC/CLI: Terraform `aws_lambda_function`, `aws_lambda_event_source_mapping`,
  `aws_lambda_permission`, `aws_lambda_alias`. CLI `aws lambda create-function`, `invoke`,
  `update-function-configuration`. CloudFormation/SAM `AWS::Serverless::Function`,
  `AWS::Lambda::Function`.
