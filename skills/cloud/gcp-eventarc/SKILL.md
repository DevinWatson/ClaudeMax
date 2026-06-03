---
name: gcp-eventarc
description: Use when designing, provisioning, securing, or operating Eventarc — Google Cloud's managed event-routing service that delivers events as CloudEvents to a destination: triggers (the routing rule), event sources (Cloud Audit Logs from any Google service, direct Pub/Sub messages, and third-party/Eventarc Advanced sources), event filters (matching by event type / service / methodName / resource attributes), destinations (Cloud Run, Cloud Functions 2nd gen, GKE, Workflows), the trigger service account + invoker IAM, the transport Pub/Sub topic, delivery + retry semantics, channels, and regions. Loads the Eventarc knowledge: build a trigger with filters, route CloudEvents to a target, secure the delivery identity, and verify an event arrives. Consumed by the Eventarc specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they wire event-driven flows (Eventarc).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, eventarc, application-development, event-routing, cloudevents, triggers]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Eventarc

Google Cloud's managed **event-routing** service. A **trigger** subscribes to events from a **source**,
applies **filters**, and delivers matching events — in the **CloudEvents** format — to a **destination**
(Cloud Run, Functions 2nd gen, GKE, Workflows), decoupling producers from consumers.

## Core concepts and components
- **Trigger** — the routing rule binding a **source + filters → destination**, plus a delivery
  **service account**. Regional.
- **Event sources** — **Cloud Audit Logs** (turn almost any Google Cloud API call into an event via
  `serviceName` + `methodName`), **direct events** from specific services (e.g. Cloud Storage,
  Pub/Sub), and **Pub/Sub** messages (route a topic's messages as CloudEvents). Eventarc **Advanced**
  adds third-party/custom sources, buses, pipelines, and transformations.
- **CloudEvents** — the standardized event envelope (type, source, subject, data) delivered to the
  destination; consumers parse a uniform format regardless of producer.
- **Event filters** — match by `type` (e.g. `google.cloud.audit.log.v1.written`), `serviceName`,
  `methodName`, and resource attributes; only matching events are delivered.
- **Destinations** — **Cloud Run**, **Cloud Functions (2nd gen)**, **GKE** services, or **Workflows**.
- **Transport** — Eventarc provisions a **Pub/Sub topic + subscription** under the hood for buffering
  and retry; understand it for delivery/retry behavior.

## Configuration and sizing
- Choose the **source** (Audit Log vs direct vs Pub/Sub), write **filters** tight enough to deliver
  only the events you want, pick the **destination** + its path/region, and assign a delivery **service
  account**. Nothing to capacity-size — Eventarc is managed; the destination (Cloud Run, etc.) is what
  scales.

## Security and IAM
- The trigger's **service account** must hold the destination invoke role (`roles/run.invoker`,
  `roles/workflows.invoker`) and, for Audit Log sources, **Data Access audit logs must be enabled** for
  the watched service. Creating triggers needs `roles/eventarc.admin`/`developer`. Restrict who can
  create triggers, scope the delivery SA least-privilege, prefer private destinations + auth, and audit
  via Cloud Audit Logs.

## Cost levers
- Eventarc itself has no per-event charge for most paths; cost accrues in the underlying **Pub/Sub**
  (for Pub/Sub/Advanced paths) and in the **destination** (Cloud Run invocations). Levers: tighten
  **filters** so you don't invoke (and pay for) the destination on irrelevant events, and avoid
  fan-out to expensive destinations on high-volume Audit Log events.

## Scaling and limits
- Delivery scales with the backing Pub/Sub and the destination's own autoscaling; per-project trigger
  quotas apply (raise via quotas). **Audit Log** events have inherent latency (seconds) and only
  **Admin Activity** logs are always on — **Data Access** logs must be explicitly enabled. Delivery is
  at-least-once; destinations must be idempotent.

## Operating procedure
1. **Provision** — enable APIs (`gcloud services enable eventarc.googleapis.com pubsub.googleapis.com`;
   Terraform `google_project_service`), deploy/identify the **destination** (Cloud Run/Functions/
   Workflows), create/scope the trigger **service account**, and (for Audit Log sources) enable the
   relevant **Data Access audit logs**.
2. **Configure** — create the **trigger** (`gcloud eventarc triggers create` or Terraform
   `google_eventarc_trigger`): set the **event filters** (type/service/method), the **destination**
   (Cloud Run service + path, or Workflow), the transport topic (auto or named), and the SA.
3. **Secure** — grant the SA the destination invoke role, keep the destination auth-required, scope IAM
   least-privilege, and confirm audit logging.
4. **Verify** — apply [[verify-by-running]]: cause the source event (e.g. perform the watched API call
   / drop the GCS object / publish to the topic), then confirm the **destination actually received the
   CloudEvent** (Cloud Run/Functions logs show the event, or a downstream side effect) and
   `gcloud eventarc triggers describe` is active — capture the event and the observed destination
   handling.

## Inputs
The event source + the exact events to react to, the filter attributes, the destination + path, the
delivery SA, region/transport needs, and IAM scope (incl. Data Access audit log enablement).

## Output
An Eventarc trigger (source + tight filters → destination, scoped delivery SA, transport topic) plus
verification that the source event was produced and the destination received and handled the
CloudEvent.

## Notes
- Gotchas: **Audit Log** triggers need **Data Access logs enabled** for the service and incur seconds
  of latency; **filters** that are too broad invoke the destination (and bill) on every matching API
  call; the trigger **SA needs the destination invoke role** or delivery silently fails; delivery is
  **at-least-once** — destinations must be idempotent; the auto-created **transport Pub/Sub** topic is
  where retries live. Eventarc *routes* events; for multi-step orchestration use Workflows, for
  rate-limited targeted delivery use Cloud Tasks, for general pub/sub messaging use Pub/Sub directly.
  AWS equivalent is EventBridge; Azure is Event Grid.
- IaC/CLI: Terraform `google_eventarc_trigger`, `google_eventarc_channel`, `google_project_service`,
  `google_service_account` + IAM, `google_project_iam_audit_config`. CLI `gcloud eventarc triggers
  create / list / describe / update`, `gcloud eventarc providers list`.
