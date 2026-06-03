---
name: aws-eventbridge
description: Use when designing, provisioning, securing, or operating Amazon EventBridge — event buses (default, custom, partner/SaaS), rules with event patterns, targets and input transformers, the schema registry/discovery, EventBridge Pipes (source→filter→enrich→target), EventBridge Scheduler (cron/rate/one-time, flexible time windows), archives and replay, dead-letter queues and retry policy, and resource/bus policies for cross-account events (Amazon EventBridge). Loads the EventBridge knowledge: how to route events with patterns, fan out to targets, schedule jobs, build a pipe, and verify delivery. Consumed by the EventBridge specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they wire event-driven routing.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, eventbridge, events, event-bus, scheduler, application-integration]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon EventBridge

Serverless event bus for routing events between AWS services, SaaS partners, and your own
applications using content-based rules. Use EventBridge to route/transform/filter events and
schedule jobs; use SNS for simple pub/sub fan-out and SQS for point-to-point buffering.

## Core concepts and components
- **Event bus** — receives events. The **default** bus carries AWS service events; **custom**
  buses isolate your application events; **partner** buses ingest SaaS sources.
- **Rule** — matches events with an **event pattern** (JSON over the event envelope/detail)
  or runs on a schedule, then sends to one or more **targets** (Lambda, SQS, SNS, Step
  Functions, Kinesis, API destinations, another bus, etc.).
- **Input transformer** — reshapes the matched event before it reaches the target.
- **Schema registry / discovery** — infers and stores event schemas; generates code bindings.
- **Pipes** — point-to-point integration: a source (SQS/Kinesis/DynamoDB Streams/MSK) with
  optional **filter** and **enrichment** (Lambda/Step Functions/API) to a single target.
- **Scheduler** — managed cron/rate/one-time schedules with flexible time windows, time
  zones, and a built-in retry/DLQ — the modern replacement for scheduled rules.
- **Archive & replay** — archive matching events and replay them to reprocess.
- **DLQ + retry policy** — per-target dead-letter queue and retry/max-age for failed delivery.

## Configuration and sizing
- Prefer narrow event patterns (match on `source`, `detail-type`, and specific `detail`
  fields) so rules only fire when needed. Use custom buses per domain/bounded context.
- Use Pipes for stream/queue-to-target with filtering/enrichment instead of glue Lambda; use
  Scheduler (not scheduled rules) for new cron/rate jobs.

## Security and IAM
- EventBridge assumes an IAM role to invoke most targets (least privilege per target);
  resource policies on targets (SQS/SNS/Lambda) must also allow EventBridge. Cross-account
  events need a bus resource policy granting `events:PutEvents` to the source account.
- Encrypt archives and DLQ contents with KMS; require TLS on API destinations and store their
  credentials in a connection (Secrets Manager backed).

## Cost levers
- Custom/partner events and Scheduler invocations are billed per event/invocation; AWS
  service events on the default bus are free to match. Narrow patterns and filtering in Pipes
  cut downstream invocation cost. Schema discovery and archive storage add cost.

## Scaling and limits
- Buses scale automatically to high event rates (soft `PutEvents` TPS limit, raisable). Limits
  on rules per bus and targets per rule (commonly 5); event size up to 256 KB.

## Operating procedure
1. **Provision** — create the custom bus via Terraform `aws_cloudwatch_event_bus` or
   `aws events create-event-bus`.
2. **Configure** — rules with event patterns + targets + input transformers
   (`aws_cloudwatch_event_rule`/`_target`), Pipes (`aws_pipes_pipe`), Scheduler schedules
   (`aws_scheduler_schedule`), archives/replay, and per-target DLQ + retry policy.
3. **Secure** — least-privilege invocation roles per target, target resource policies allowing
   EventBridge, bus resource policy for cross-account, KMS on archives/DLQ, TLS connections.
4. **Verify** — apply [[verify-by-running]]: `aws events put-events` a test event, confirm the
   rule matches and the target is invoked (e.g. message in SQS / Lambda log), confirm a
   non-matching event does not fire the rule, and a failed delivery lands in the DLQ.

## Inputs
Event sources + shapes, routing/filtering rules, target set, transformation needs, schedule
requirements (cron/rate/one-time, time zone), cross-account/partner sources, replay/archival
needs, encryption/compliance, DLQ/retry requirements.

## Output
A bus definition, rules with event patterns + targets + transformers (or Pipes / Scheduler
schedules), per-target DLQ + retry, cross-account/KMS config, and verification that matching
events route to targets, non-matching events are ignored, and failures dead-letter.

## Notes
- Gotchas: event patterns match exactly and case-sensitively (test with put-events); targets
  need both the EventBridge invocation role and their own resource policy; the default bus is
  free to match but custom/SaaS events are billed; Scheduler supersedes scheduled rules and
  has its own role/DLQ; archives only capture events that match their pattern from the time
  they are created; cross-Region routing uses bus-to-bus targets.
- IaC/CLI: Terraform `aws_cloudwatch_event_bus`, `aws_cloudwatch_event_rule`,
  `aws_cloudwatch_event_target`, `aws_cloudwatch_event_bus_policy`, `aws_pipes_pipe`,
  `aws_scheduler_schedule`, `aws_scheduler_schedule_group`. CLI `aws events put-events`,
  `put-rule`, `put-targets`, `aws scheduler create-schedule`, `aws pipes create-pipe`.
  CloudFormation `AWS::Events::EventBus`, `AWS::Events::Rule`, `AWS::Pipes::Pipe`,
  `AWS::Scheduler::Schedule`.
