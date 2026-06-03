---
name: gcp-cloud-scheduler
description: Use when designing, provisioning, securing, or operating Cloud Scheduler — Google Cloud's fully managed enterprise cron / job-scheduling service: scheduled jobs defined by unix-cron / App Engine cron schedules and a timezone, targets (HTTP/HTTPS endpoints, Pub/Sub topics, App Engine HTTP), retry config (max retries, min/max backoff, max doublings, max retry duration), attempt deadlines, the invoker service account + OIDC/OAuth auth headers, and the guaranteed at-least-once delivery model. Loads the Cloud Scheduler knowledge: define a cron schedule, wire a target with auth, set retries/deadline, and verify a job fires. Consumed by the Cloud Scheduler specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they add scheduled invocations (Cloud Scheduler).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-scheduler, application-development, cron, scheduled-jobs, pubsub]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Scheduler

Google Cloud's fully managed **cron / job-scheduling** service. It fires **jobs** on a recurring
**cron schedule**, invoking an HTTP endpoint, publishing to a **Pub/Sub** topic, or hitting an
**App Engine** handler — with retries, deadlines, and at-least-once delivery.

## Core concepts and components
- **Job** — the unit of scheduling: a name, a **schedule**, a **timezone**, a **target**, and
  **retry config**. A job belongs to a region (location).
- **Schedule** — a **unix-cron** string (`* * * * *`, fields minute/hour/day-of-month/month/day-of-week)
  or App Engine cron syntax, evaluated in the configured **IANA timezone** (DST-aware).
- **Targets** — **HTTP/HTTPS** (any reachable URL, with method + body + headers), **Pub/Sub**
  (publish a message + attributes to a topic), or **App Engine HTTP** (route to a service/version).
- **Auth** — for HTTP targets, attach an **OIDC** token (for Cloud Run / Cloud Functions / IAP) or an
  **OAuth** token (for Google APIs) minted from an **invoker service account**.
- **Retry config** — `maxRetryAttempts`, `minBackoffDuration` / `maxBackoffDuration`, `maxDoublings`,
  and `maxRetryDuration`; plus the per-attempt **attempt deadline**.
- **Delivery model** — **at-least-once**: a target must be idempotent; a slow target past the attempt
  deadline counts as a failure and retries.

## Configuration and sizing
- Pick the **region**, write the cron schedule + timezone, choose the target type, set the HTTP
  method/body/headers or Pub/Sub topic/attributes, configure retries + attempt deadline (default 180s
  for HTTP, raise toward the max for slow targets), and attach the invoker SA + OIDC/OAuth token. There
  is no capacity to size — Scheduler is fully managed.

## Security and IAM
- Caller needs `roles/cloudscheduler.admin` (or `jobRunner`) to manage/run jobs. The job's **invoker
  service account** must hold the target's invoke role (e.g. `roles/run.invoker`,
  `roles/cloudfunctions.invoker`) and `roles/iam.serviceAccountTokenCreator` to mint OIDC/OAuth tokens;
  for Pub/Sub targets grant `roles/pubsub.publisher`. Prefer OIDC over a static shared secret; scope
  the SA least-privilege; audit via Cloud Audit Logs.

## Cost levers
- Billed per **job** per month (the first 3 jobs per billing account are free); job *executions* are
  not separately billed. Levers: consolidate redundant jobs, delete unused jobs, and avoid spawning
  one job per tenant when a single job + fan-out (Pub/Sub) suffices. Downstream target cost (Cloud Run
  invocations, Pub/Sub) is separate.

## Scaling and limits
- Default quota is on the order of hundreds of jobs per region per project (raise via quotas).
  Minimum granularity is 1 minute. The HTTP attempt deadline caps at ~30 min; for long-running work,
  trigger an async target (Pub/Sub → worker, or a Workflow) rather than blocking the attempt.

## Operating procedure
1. **Provision** — enable the API (`gcloud services enable cloudscheduler.googleapis.com`; Terraform
   `google_project_service`), create/scope the **invoker service account**, and grant it the target's
   invoke role + `serviceAccountTokenCreator` (or `pubsub.publisher`).
2. **Configure** — create the **job** (`gcloud scheduler jobs create http|pubsub|app-engine` or
   Terraform `google_cloud_scheduler_job`): set the cron **schedule** + **timezone**, the target
   (URI/method/body/headers, or topic + message), **retry config**, and **attempt deadline**.
3. **Secure** — attach the invoker SA + **OIDC/OAuth** token to HTTP targets, scope IAM least-privilege,
   and ensure the target endpoint enforces auth (not public).
4. **Verify** — apply [[verify-by-running]]: force a run (`gcloud scheduler jobs run JOB`), then confirm
   the target actually received and processed the invocation (target logs / Pub/Sub message / a
   downstream side effect) and that `gcloud scheduler jobs describe` shows a successful last attempt —
   capture the run result and the observed target-side effect.

## Inputs
The cron schedule + timezone, the target type + endpoint/topic + payload, retry/deadline needs, the
auth model (OIDC/OAuth + invoker SA), the region, and IAM scope.

## Output
A Cloud Scheduler job (schedule + timezone, target with auth, retry config + attempt deadline, scoped
invoker SA) plus verification that a forced run fired and the target processed it.

## Notes
- Gotchas: delivery is **at-least-once** — make targets idempotent; the cron is evaluated in the job's
  **timezone**, so DST shifts wall-clock fire time; the **attempt deadline** (not the target's own
  timeout) bounds each attempt — long work must be async; HTTP targets that require auth fail silently
  if the invoker SA lacks the invoke role or `serviceAccountTokenCreator`; min granularity is 1 minute.
  Scheduler triggers, it does not orchestrate multi-step flows (use Workflows) or queue/rate-limit fan
  out (use Cloud Tasks). AWS equivalent is EventBridge Scheduler; Azure is Logic Apps / Scheduler.
- IaC/CLI: Terraform `google_cloud_scheduler_job`, `google_project_service`,
  `google_service_account` + IAM. CLI `gcloud scheduler jobs create http|pubsub|app-engine`,
  `gcloud scheduler jobs run / list / describe / pause / resume`.
