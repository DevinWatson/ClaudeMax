---
name: aws-step-functions
description: Use when designing, provisioning, securing, or operating AWS Step Functions — state machines authored in Amazon States Language (ASL), Standard vs Express workflows, state types (Task, Choice, Parallel, Map/distributed Map, Wait, Pass, Succeed/Fail), optimized and AWS SDK service integrations, sync vs async and waitForTaskToken callbacks, error handling with Retry/Catch and timeouts, input/output processing (InputPath/Parameters/ResultSelector/ResultPath/OutputPath, JSONata), execution history, and CloudWatch/X-Ray observability (AWS Step Functions). Loads the Step Functions knowledge: how to model a reliable workflow with retries and compensation, pick Standard vs Express, and verify an execution. Consumed by the Step Functions specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they orchestrate workflows.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, step-functions, orchestration, workflow, state-machine, application-integration]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# AWS Step Functions

Serverless workflow orchestration. You author a **state machine** that coordinates steps
across AWS services with built-in retries, error handling, branching, and parallelism. Use
Step Functions to orchestrate a multi-step workflow; use EventBridge to route events and
SQS/SNS for plain messaging.

## Core concepts and components
- **State machine** — a workflow defined in **Amazon States Language (ASL)**, a JSON/YAML
  (or Workflow Studio) DSL.
- **Standard vs Express** — Standard: exactly-once, durable, up to 1 year, full execution
  history, ideal for long-running/auditable workflows; **Express**: at-least-once (or
  at-most-once for sync), high-volume short workflows (≤5 min), billed by duration/memory,
  logs to CloudWatch instead of full history.
- **State types** — **Task** (do work), **Choice** (branch), **Parallel** (concurrent
  branches), **Map** / **distributed Map** (fan out over a collection, distributed Map for
  large-scale/S3 datasets), **Wait**, **Pass**, **Succeed**/**Fail**.
- **Service integrations** — optimized integrations (Lambda, ECS, SNS, SQS, DynamoDB, Glue,
  EMR, Batch, etc.) and AWS SDK integrations for ~all services; **request/response**,
  **.sync** (wait for completion), and **.waitForTaskToken** (callback for human/external steps).
- **Error handling** — per-state **Retry** (with backoff/jitter) and **Catch** (route errors
  to a handler/compensation), plus heartbeat/total timeouts.
- **Data flow** — InputPath/Parameters/ResultSelector/ResultPath/OutputPath (JSONPath) or
  JSONata to shape state input/output.
- **Observability** — execution history, CloudWatch metrics/logs, X-Ray tracing.

## Configuration and sizing
- Choose Standard for durable/long/auditable orchestration; Express for high-volume,
  short-lived event processing. Use distributed Map for large fan-out over S3/arrays.
- Prefer direct service integrations over Lambda glue; use waitForTaskToken for human
  approval / external callbacks. Implement compensation (saga) via Catch branches.

## Security and IAM
- The state machine runs under an IAM execution role with least-privilege permissions for
  exactly the integrations it calls (and `iam:PassRole` only where required). Encrypt with
  KMS (state machine + CloudWatch logs). Avoid embedding secrets in ASL — reference Secrets
  Manager/SSM at runtime.

## Cost levers
- Standard is billed per state transition (minimize chatty states); Express is billed by
  request count + duration × memory. Use Express for high-volume short flows, distributed
  Map to parallelize cheaply, and avoid unnecessary Pass/Wait transitions.

## Scaling and limits
- Standard supports many concurrent executions (soft account limits); Express scales to very
  high request rates. Limits on state-machine definition size, execution history entries
  (Standard), and payload size between states (256 KB — offload large data to S3).

## Operating procedure
1. **Provision** — create the state machine (Standard or Express) with an execution role and
   ASL definition via Terraform `aws_sfn_state_machine` or `aws stepfunctions create-state-machine`.
2. **Configure** — states with service integrations, Retry/Catch, timeouts, Map/Parallel,
   waitForTaskToken callbacks, input/output processing, and CloudWatch logging + X-Ray.
3. **Secure** — least-privilege execution role (only the called integrations + scoped
   PassRole), KMS on state machine/logs, secrets fetched at runtime not embedded.
4. **Verify** — apply [[verify-by-running]]: `aws stepfunctions start-execution`, poll
   `describe-execution`/`get-execution-history`, confirm a successful path produces the
   expected output, and that an injected failure triggers Retry then the Catch/compensation branch.

## Inputs
The workflow steps + dependencies, durability/latency/volume profile (Standard vs Express),
service integrations to call, error/retry/compensation requirements, human-approval or
external callbacks, payload sizes, encryption/compliance needs.

## Output
A state machine (ASL definition, Standard/Express, execution role, Retry/Catch/timeouts,
Map/Parallel, logging + tracing) as code, plus verification of a successful execution and of
retry-then-catch behavior on a forced failure.

## Notes
- Gotchas: Express does not keep full execution history (rely on CloudWatch logs); .sync
  integrations need extra IAM (e.g. events/describe permissions); inter-state payload is
  capped at 256 KB (use ResultSelector and S3 pointers for big data); Choice rules are
  evaluated in order; distributed Map writes results to S3 and has its own concurrency
  controls; waitForTaskToken executions hang until SendTaskSuccess/Failure or timeout.
- IaC/CLI: Terraform `aws_sfn_state_machine`, `aws_sfn_activity`. CLI
  `aws stepfunctions create-state-machine`, `start-execution`, `start-sync-execution`,
  `describe-execution`, `get-execution-history`, `send-task-success`. CloudFormation
  `AWS::StepFunctions::StateMachine`. Author ASL in Workflow Studio or as code.
