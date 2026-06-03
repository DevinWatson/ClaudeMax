---
name: gcp-pubsub
description: Use when designing, provisioning, securing, or operating Pub/Sub — Google Cloud's fully managed, global messaging / event-streaming service: topics and subscriptions, push vs pull delivery (incl. StreamingPull and BigQuery / Cloud Storage subscriptions), message ordering (ordering keys), exactly-once delivery, ack deadlines + redelivery, dead-letter topics + retry policy, message retention + seek/replay, schemas (Avro / Protobuf) + schema enforcement, message filtering, flow control, the publisher/subscriber service accounts + IAM, and CMEK. Loads the Pub/Sub knowledge: create a topic + subscription, choose push/pull + ordering/exactly-once, wire dead-letter + schema, and verify end-to-end delivery. Consumed by the Pub/Sub specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they add managed messaging (Pub/Sub).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, pubsub, application-development, messaging, event-streaming, dead-letter]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Pub/Sub

Google Cloud's fully managed, **global messaging / event-streaming** service. Publishers send messages
to a **topic**; each **subscription** delivers an independent copy to its subscribers (**push** or
**pull**) — decoupling producers from consumers with durable buffering, ordering, dead-lettering, and
schema enforcement.

## Core concepts and components
- **Topic** — the named channel publishers write to; optionally bound to a **schema** and CMEK.
- **Subscription** — an independent stream of a topic's messages to one consumer group. Types: **pull**
  (subscriber calls Pull / StreamingPull), **push** (Pub/Sub POSTs to an HTTPS endpoint), and managed
  **BigQuery** / **Cloud Storage** subscriptions (write directly to those sinks, no code).
- **Ordering** — with **ordering keys**, messages sharing a key are delivered in publish order (within
  a region); without keys, order is best-effort.
- **Exactly-once delivery** — opt-in on pull subscriptions: no redelivery of an acked message within
  the ack deadline window (vs default at-least-once).
- **Ack deadline + redelivery** — unacked messages are redelivered after the ack deadline (extendable);
  tune to handler latency.
- **Dead-letter topic + retry policy** — after `maxDeliveryAttempts`, route poison messages to a DLQ;
  retry policy sets min/max backoff.
- **Retention + seek/replay** — retain messages (up to 7 days, longer with topic retention) and
  **seek** to a timestamp or snapshot to replay.
- **Schemas** — **Avro** / **Protobuf** schema attached to a topic; publishes are validated.
- **Filtering** — subscriptions can filter by message attributes so consumers see only relevant
  messages. **Flow control** bounds in-flight messages on the subscriber.

## Configuration and sizing
- Create a **topic** (+ schema/CMEK if needed), then a **subscription** per consumer: choose push vs
  pull, set the **ack deadline** to handler latency, enable **ordering**/**exactly-once** if required,
  attach a **dead-letter topic** + retry policy, set **retention**, and add **filters**. Capacity is
  managed — Pub/Sub autoscales throughput.

## Security and IAM
- Grant publishers `roles/pubsub.publisher` and subscribers `roles/pubsub.subscriber` on the specific
  topic/subscription (resource-level, least-privilege). Push subscriptions to private/auth endpoints
  use an **OIDC** token from a push **service account** (which needs invoke on the target). Dead-letter
  requires the Pub/Sub service agent to have publisher/subscriber on the DLQ. Use CMEK for sensitive
  data and VPC-SC to bound exfiltration; audit via Cloud Audit Logs.

## Cost levers
- Billed primarily by **message throughput** (volume of data, min 1 KB per message billed) plus storage
  for retained/snapshotted messages and any **BigQuery/GCS** subscription egress. Levers: batch publishes,
  keep messages small, set retention no longer than needed, filter at the subscription to avoid
  delivering (and processing) irrelevant messages, and clean up unused subscriptions/snapshots.

## Scaling and limits
- Throughput autoscales globally; no provisioning. Watch **ordering** (ordering keys serialize per key,
  limiting per-key throughput), the 7-day default max retention, push endpoint rate limits, and
  per-project quotas. Slow/erroring subscribers grow the **backlog** — alert on `oldest_unacked` age.

## Operating procedure
1. **Provision** — enable the API (`gcloud services enable pubsub.googleapis.com`; Terraform
   `google_project_service`), create publisher/subscriber **service accounts**, and (optionally) a
   **schema**.
2. **Configure** — create the **topic** (`gcloud pubsub topics create` or Terraform
   `google_pubsub_topic`, attach schema/CMEK) and **subscription** (`google_pubsub_subscription`):
   push vs pull, **ack deadline**, **ordering**/**exactly-once**, **dead-letter topic** +
   `maxDeliveryAttempts` + retry policy, **retention**, **filter**.
3. **Secure** — resource-level `publisher`/`subscriber` IAM, push OIDC SA + target invoke role,
   service-agent IAM on the DLQ, CMEK/VPC-SC for sensitive data.
4. **Verify** — apply [[verify-by-running]]: **publish** a test message
   (`gcloud pubsub topics publish`) and confirm the subscriber **receives and acks it** (pull:
   `gcloud pubsub subscriptions pull --auto-ack`; push: target logs / side effect), then confirm DLQ
   routing on a forced failure and that ordering/exactly-once behave as configured — capture the
   published message and the observed delivery.

## Inputs
The event/message shape (+ schema), producers and consumers, delivery mode (push/pull/BQ/GCS), ordering
+ exactly-once + dead-letter + retention needs, filtering, throughput expectations, security (IAM/CMEK/
VPC-SC), and region.

## Output
A Pub/Sub setup (topic + schema, subscription(s) with the chosen delivery mode, ack deadline,
ordering/exactly-once, dead-letter + retry, retention, filters, resource-level IAM) plus verification of
end-to-end publish→receive→ack and dead-letter routing.

## Notes
- Gotchas: default delivery is **at-least-once** (consumers must be idempotent unless exactly-once is
  enabled); **ordering keys** serialize per key and cap per-key throughput; a slow/failing subscriber
  silently grows **backlog** — monitor unacked age; **dead-letter** needs the Pub/Sub **service agent**
  granted publisher/subscriber on the DLQ; push endpoints must be reachable + (for private) carry an
  OIDC token; schema changes are constrained by compatibility. Pub/Sub is GCP's **managed** messaging
  bus — for self-managed Kafka the **kafka data team** owns the broker/cluster; this skill owns the
  managed Pub/Sub service. AWS analogs are SNS + SQS / Kinesis; Azure is Event Hubs / Service Bus.
- IaC/CLI: Terraform `google_pubsub_topic`, `google_pubsub_subscription`, `google_pubsub_schema`,
  `google_pubsub_topic_iam_*`, `google_project_service`. CLI `gcloud pubsub topics create / publish`,
  `gcloud pubsub subscriptions create / pull / seek`, `gcloud pubsub schemas create`.
