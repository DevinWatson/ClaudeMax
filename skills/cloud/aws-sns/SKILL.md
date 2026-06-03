---
name: aws-sns
description: Use when designing, provisioning, securing, or operating Amazon SNS — standard and FIFO topics, subscriptions (SQS, Lambda, HTTP/S, email, SMS, mobile push, Kinesis Data Firehose), pub/sub fan-out, message filtering with subscription filter policies, message attributes, ordering and deduplication on FIFO, dead-letter queues (redrive policy), delivery retries/status logging, KMS encryption, and access/topic policies (Amazon SNS). Loads the SNS knowledge: how to create an encrypted topic, fan a message out to many subscribers, filter per subscription, dead-letter undeliverable messages, and verify delivery. Consumed by the SNS specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they wire pub/sub messaging.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, sns, messaging, pub-sub, fan-out, application-integration]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon SNS

Fully managed pub/sub messaging. A publisher sends a message to a **topic**; SNS pushes
(fans out) a copy to every subscriber. Use SNS for one-to-many push delivery and fan-out;
use SQS for point-to-point pull queues and EventBridge for event routing/transformation.

## Core concepts and components
- **Topic** — the pub/sub channel. **Standard** topics give high throughput, best-effort
  ordering, at-least-once delivery; **FIFO** topics give strict ordering and exactly-once
  publish within a message group, and may only target SQS FIFO queues.
- **Subscription** — an endpoint bound to a topic: SQS, Lambda, HTTP/S, email/email-JSON,
  SMS, mobile push (APNS/FCM), or Kinesis Data Firehose.
- **Fan-out** — one publish delivers to many subscribers in parallel (classic
  SNS-to-many-SQS pattern decouples producers from consumers).
- **Filter policies** — per-subscription JSON over message attributes or message body so a
  subscriber only receives matching messages, avoiding consumer-side filtering.
- **FIFO ordering/dedup** — `MessageGroupId` orders within a group; `MessageDeduplicationId`
  or content-based dedup suppresses duplicates within a 5-minute window.
- **DLQ** — a redrive policy points a subscription at an SQS dead-letter queue for messages
  that exhaust delivery retries.
- **Delivery retries / status logging** — configurable retry policy for HTTP/S; delivery
  status logging to CloudWatch.

## Configuration and sizing
- Pick standard for scale/throughput; FIFO only when strict order/exactly-once matters
  (lower throughput, SQS-FIFO targets only). Set message attributes that filter policies key on.
- Tune raw message delivery (skip SNS envelope for SQS/Firehose) to simplify consumers.

## Security and IAM
- Encrypt topics with SSE-KMS (customer-managed key for sensitive data); the KMS key policy
  must allow the publishing/subscribing principals. Use a topic (resource) policy with
  least privilege; restrict `sns:Publish`/`Subscribe` by principal and `aws:SourceArn`.
- Require TLS via `aws:SecureTransport`. Cross-account fan-out needs both the topic policy
  and the target's (e.g. SQS queue) policy to allow SNS.

## Cost levers
- Billed per request, per delivery, and per data volume; SMS/mobile push and cross-Region
  delivery cost more. Reduce cost with filter policies (fewer useless deliveries) and by
  batching publishes; avoid email/SMS for high-volume internal fan-out — target SQS/Lambda.

## Scaling and limits
- Standard topics scale to very high publish rates automatically; FIFO has lower per-topic
  throughput. Default soft limits on topics/subscriptions per account and per-topic
  subscriptions; message size up to 256 KB (use the SNS extended client / S3 for larger).

## Operating procedure
1. **Provision** — create the topic (standard or FIFO) with SSE-KMS via Terraform
   `aws_sns_topic` or `aws sns create-topic`.
2. **Configure** — add subscriptions (`aws_sns_topic_subscription`), per-subscription filter
   policies, raw message delivery, FIFO group/dedup settings, and a redrive (DLQ) policy.
3. **Secure** — least-privilege topic policy (scope `Publish`/`Subscribe` by principal +
   `aws:SourceArn`), KMS key policy for publishers/subscribers, TLS-only, delivery status logging.
4. **Verify** — apply [[verify-by-running]]: `aws sns publish` a test message, confirm it
   arrives at each subscriber (e.g. `aws sqs receive-message`), confirm a non-matching
   message is dropped by the filter policy, and that an undeliverable message lands in the DLQ.

## Inputs
Message shape + size, ordering/exactly-once needs (FIFO vs standard), subscriber set and
protocols, per-subscriber filtering rules, encryption/compliance needs, cross-account
targets, expected publish rate, DLQ/retry requirements.

## Output
A topic definition (standard/FIFO, SSE-KMS, least-privilege policy), subscriptions with
filter policies and DLQ redrive, FIFO ordering/dedup config where needed, and verification
that messages fan out, filters drop non-matching messages, and the DLQ catches failures.

## Notes
- Gotchas: FIFO topics only deliver to SQS FIFO queues; standard delivery is at-least-once
  so consumers must be idempotent; HTTP/S subscriptions require confirmation; filter
  policies match message attributes by default (set scope to body to filter on payload);
  the KMS key policy is a common silent failure for cross-account/cross-service publish;
  SMS spend has account-level limits and may need a spend-limit increase.
- IaC/CLI: Terraform `aws_sns_topic`, `aws_sns_topic_subscription`, `aws_sns_topic_policy`,
  `aws_sns_sms_preferences`. CLI `aws sns create-topic`, `subscribe`, `set-subscription-attributes`
  (FilterPolicy/RedrivePolicy), `publish`. CloudFormation `AWS::SNS::Topic`,
  `AWS::SNS::Subscription`, `AWS::SNS::TopicPolicy`.
