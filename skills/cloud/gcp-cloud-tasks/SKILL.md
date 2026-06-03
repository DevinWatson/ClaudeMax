---
name: gcp-cloud-tasks
description: Use when designing, provisioning, securing, or operating Cloud Tasks — Google Cloud's fully managed asynchronous task-queue service: queues with rate + concurrency control (maxDispatchesPerSecond, maxConcurrentDispatches, maxBurstSize), task targets (HTTP/HTTPS endpoints and App Engine handlers), per-task scheduling (scheduleTime for deferred execution), dispatch deadlines, retry config (maxAttempts, min/max backoff, maxDoublings, maxRetryDuration), task deduplication by name, the invoker service account + OIDC/OAuth auth, and at-least-once delivery. Loads the Cloud Tasks knowledge: create a queue with rate limits, enqueue HTTP tasks with auth, tune retries/deadlines, and verify dispatch. Consumed by the Cloud Tasks specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they add async/decoupled task processing (Cloud Tasks).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-tasks, application-development, task-queue, async, rate-limiting]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Tasks

Google Cloud's fully managed **asynchronous task-queue** service. Producers **enqueue** tasks; Cloud
Tasks **dispatches** each task to an HTTP or App Engine target at a controlled **rate** and
**concurrency**, with per-task scheduling, retries, and at-least-once delivery — decoupling request
latency from background work.

## Core concepts and components
- **Queue** — the unit of rate/concurrency control and retry policy; lives in a region. Tasks within a
  queue share dispatch limits.
- **Task** — a single unit of work: a **target** (HTTP method + URL + body + headers, or an App Engine
  routing), an optional **`scheduleTime`** (deferred execution / "run at"), and an optional **name**
  (for dedup). A handler returning 2xx = success; non-2xx = retry.
- **Rate / concurrency control** — `maxDispatchesPerSecond` (sustained rate),
  `maxConcurrentDispatches` (in-flight cap), and `maxBurstSize` (token-bucket burst). This is the core
  reason to use Cloud Tasks over fire-and-forget.
- **Dispatch deadline** — how long a single dispatch may run before it's treated as failed and retried
  (HTTP target default ~10 min, up to 30 min).
- **Retry config** — `maxAttempts`, `minBackoff` / `maxBackoff`, `maxDoublings`, `maxRetryDuration`.
- **Auth** — HTTP targets carry an **OIDC** (Cloud Run / Functions) or **OAuth** (Google APIs) token
  minted from an **invoker service account**.
- **Delivery** — **at-least-once**; handlers must be idempotent. Task **name** enables ~1h dedup window.

## Configuration and sizing
- Create the queue with rate limits sized to what the downstream **target** can absorb
  (`maxDispatchesPerSecond` × handler latency ≈ needed `maxConcurrentDispatches`), set retry config +
  dispatch deadline, and pick the region. Enqueue tasks with the target, body, optional `scheduleTime`,
  and auth token. No servers to size.

## Security and IAM
- Enqueuers need `roles/cloudtasks.enqueuer`; admins `roles/cloudtasks.admin`. The queue's **invoker
  service account** must hold the target's invoke role (`roles/run.invoker`,
  `roles/cloudfunctions.invoker`) and `roles/iam.serviceAccountTokenCreator` to mint OIDC/OAuth tokens.
  The target endpoint must require auth (not public). Scope SAs least-privilege; audit via Audit Logs.

## Cost levers
- Billed per **task operation** (a free monthly tier exists); the first million operations/month are
  free. Levers: batch work into fewer larger tasks where possible, avoid redundant re-enqueues, tune
  retries so you don't pay for runaway retry storms, and right-size rate limits. Downstream target cost
  (Cloud Run invocations) is separate.

## Scaling and limits
- Queues scale dispatch automatically up to the configured rate/concurrency and per-project quotas;
  enqueue throughput and max queues per project are quota-bound (raise via quotas). `scheduleTime`
  supports far-future scheduling; dispatch deadline caps at 30 min — long work should ack fast and
  continue async.

## Operating procedure
1. **Provision** — enable the API (`gcloud services enable cloudtasks.googleapis.com`; Terraform
   `google_project_service`), create/scope the **invoker service account**, and grant it the target's
   invoke role + `serviceAccountTokenCreator`.
2. **Configure** — create the **queue** (`gcloud tasks queues create` or Terraform
   `google_cloud_tasks_queue`) with **rate limits** (`maxDispatchesPerSecond`,
   `maxConcurrentDispatches`, `maxBurstSize`), **retry config**, and dispatch deadline; enqueue tasks
   (`gcloud tasks create-http-task`) with target/body/`scheduleTime`/auth.
3. **Secure** — attach the invoker SA + **OIDC/OAuth** token to HTTP tasks, require auth on the target,
   scope IAM least-privilege.
4. **Verify** — apply [[verify-by-running]]: enqueue a test task, then confirm the **target handler
   actually received and processed it** (handler logs / a downstream side effect) and that the queue
   drains within the expected rate (`gcloud tasks queues describe` stats) — capture the dispatch result
   and observed handler effect.

## Inputs
The work to decouple, the target endpoint + payload shape, the required dispatch **rate/concurrency**,
retry/deadline + dedup needs, scheduling (immediate vs deferred), the auth model + invoker SA, region,
and IAM scope.

## Output
A Cloud Tasks setup (queue with rate/concurrency limits + retry/dispatch-deadline, tasks with target +
auth + optional `scheduleTime`, scoped invoker SA) plus verification that a task dispatched and the
handler processed it.

## Notes
- Gotchas: delivery is **at-least-once** — handlers must be idempotent; rate limits exist to **protect
  the target** (over-high `maxConcurrentDispatches` overwhelms downstream); the **dispatch deadline**
  bounds each attempt — long handlers must ack fast and continue async; HTTP tasks fail if the invoker
  SA lacks the invoke role or `serviceAccountTokenCreator`. Cloud Tasks gives explicit **per-task**
  control + rate limiting; **Pub/Sub** is for high-throughput pub/sub fan-out/streaming — pick Tasks
  when you need rate control + targeted HTTP delivery per task. AWS equivalent is SQS (+ Lambda);
  Azure is Storage Queues / Service Bus queues.
- IaC/CLI: Terraform `google_cloud_tasks_queue`, `google_project_service`, `google_service_account` +
  IAM. CLI `gcloud tasks queues create / update / describe / pause`,
  `gcloud tasks create-http-task / create-app-engine-task`, `gcloud tasks list`.
