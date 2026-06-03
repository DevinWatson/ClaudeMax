---
name: aws-sqs
description: Use when designing, provisioning, securing, or operating Amazon SQS — standard vs FIFO queues, visibility timeout, message retention, short vs long polling, dead-letter queues and redrive (policy + redrive allow policy), delivery delay and per-message timers, FIFO message group ordering and deduplication, batching, SSE-KMS encryption, and queue access policies (Amazon SQS). Loads the SQS knowledge: how to create an encrypted queue with a DLQ, tune visibility timeout and long polling, preserve order with FIFO, and verify send/receive/delete and dead-lettering. Consumed by the SQS specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they wire decoupled queues.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, sqs, messaging, queue, fifo, application-integration]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon SQS

Fully managed message queuing for decoupling producers from consumers. A producer sends a
message to a **queue**; one consumer pulls and processes it, then deletes it. Use SQS for
point-to-point buffering/work distribution; use SNS for one-to-many fan-out and EventBridge
for event routing.

## Core concepts and components
- **Standard queue** — near-unlimited throughput, at-least-once delivery, best-effort
  ordering (occasional duplicates/reorders). **FIFO queue** — exactly-once processing and
  strict ordering within a message group, at lower throughput (name ends in `.fifo`).
- **Visibility timeout** — after a consumer receives a message it is hidden for this window;
  the consumer must delete it before the timeout or it reappears for redelivery.
- **Polling** — short polling returns immediately (may return empty); **long polling**
  (`WaitTimeSeconds` up to 20s) waits for messages, cutting empty receives and cost.
- **Retention** — messages live up to 14 days (default 4). **Delivery delay** / per-message
  timers postpone visibility.
- **DLQ** — a redrive policy sends a message to a dead-letter queue after `maxReceiveCount`
  failed receives; a redrive allow policy controls which source queues may target a DLQ.
- **FIFO ordering/dedup** — `MessageGroupId` orders within a group and enables parallel
  groups; `MessageDeduplicationId` / content-based dedup suppresses duplicates for 5 minutes.

## Configuration and sizing
- Set visibility timeout to ~6x the consumer's processing time (or use the
  `ChangeMessageVisibility` heartbeat for long jobs). Enable long polling everywhere.
- Size `maxReceiveCount` so poison messages dead-letter quickly. Use FIFO only when order /
  exactly-once is required; otherwise standard for throughput. Batch sends/receives (up to 10).

## Security and IAM
- Encrypt with SSE-KMS (customer-managed key for sensitive data) or SSE-SQS. Use a
  least-privilege queue policy; restrict `sqs:SendMessage`/`ReceiveMessage` by principal and
  `aws:SourceArn` (e.g. allow an SNS topic or EventBridge rule to send). Require TLS.

## Cost levers
- Billed per request (each API call, incl. empty receives) plus data; long polling and
  batching are the biggest levers. Avoid tight short-polling loops. DLQ + alarms prevent
  costly infinite redelivery of poison messages.

## Scaling and limits
- Standard queues scale horizontally and automatically; FIFO supports high throughput with
  batching/high-throughput mode but is lower than standard. Message size up to 256 KB (use
  the extended client / S3 for larger). In-flight message limits apply (esp. FIFO).

## Operating procedure
1. **Provision** — create the queue (standard or `.fifo`) with SSE-KMS via Terraform
   `aws_sqs_queue` or `aws sqs create-queue`.
2. **Configure** — visibility timeout, long-poll `ReceiveMessageWaitTimeSeconds`, retention,
   delivery delay, a separate DLQ + redrive policy/`maxReceiveCount`, FIFO group/dedup.
3. **Secure** — least-privilege queue policy (scope by principal + `aws:SourceArn`), KMS key
   policy for producers/consumers, TLS-only.
4. **Verify** — apply [[verify-by-running]]: `aws sqs send-message`, `receive-message`
   (with long polling), `delete-message`; confirm a message hidden during visibility timeout
   does not redeliver to a second receiver, and a repeatedly-failed message lands in the DLQ.

## Inputs
Message shape + size, ordering/exactly-once needs (FIFO vs standard), expected throughput,
consumer processing time (for visibility timeout), retention window, who sends/receives,
encryption/compliance needs, DLQ/poison-message handling requirements.

## Output
A queue definition (standard/FIFO, SSE-KMS, least-privilege policy), tuned visibility
timeout + long polling + retention, a DLQ with redrive policy, FIFO group/dedup config where
needed, and verification of send/receive/delete and dead-lettering behavior.

## Notes
- Gotchas: at-least-once delivery on standard queues means consumers must be idempotent;
  forgetting to delete a message redelivers it after the visibility timeout; the DLQ should
  share the source queue's encryption and have a longer retention; FIFO throughput requires
  many message groups + batching/high-throughput mode; cross-service senders (SNS/EventBridge)
  need both the sender's permission and the queue policy; a too-short visibility timeout
  causes duplicate processing of slow jobs.
- IaC/CLI: Terraform `aws_sqs_queue`, `aws_sqs_queue_policy`, `aws_sqs_queue_redrive_policy`,
  `aws_sqs_queue_redrive_allow_policy`. CLI `aws sqs create-queue`, `set-queue-attributes`,
  `send-message`, `receive-message`, `delete-message`. CloudFormation `AWS::SQS::Queue`,
  `AWS::SQS::QueuePolicy`.
