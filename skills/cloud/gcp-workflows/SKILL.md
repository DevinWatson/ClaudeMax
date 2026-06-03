---
name: gcp-workflows
description: Use when designing, provisioning, securing, or operating Workflows — Google Cloud's serverless orchestration service that runs a sequence of steps defined in a YAML/JSON workflow definition: steps (assign, call, switch, for/parallel iteration, try/retry/except, return), expressions and variables, HTTP calls and Google Cloud connectors (Cloud Run, Functions, Pub/Sub, BigQuery, etc.), authenticated calls (OIDC/OAuth) via the workflow service account, subworkflows, callbacks + waits (human-in-the-loop / event-driven pauses), error handling + retry policies, executions and their state, and triggers (Scheduler / Eventarc / direct). Loads the Workflows knowledge: author a workflow definition, wire authenticated connector calls, add retries/callbacks, and verify an execution succeeds. Consumed by the Workflows specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they orchestrate multi-service flows (Workflows).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, workflows, application-development, orchestration, serverless, connectors]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Workflows

Google Cloud's **serverless orchestration** service. A **workflow definition** (YAML or JSON) describes
an ordered sequence of **steps** — calling HTTP endpoints and Google Cloud services, branching,
looping, retrying, and waiting — and Workflows runs each as an **execution**, fully managed and
pay-per-step.

## Core concepts and components
- **Workflow definition** — YAML/JSON listing named **steps**. Step types: **`assign`** (set
  variables), **`call`** (invoke `http.get/post` or a **connector**), **`switch`** (branching),
  **`for`** / **parallel** iteration, **`try`/`retry`/`except`** (error handling), **subworkflows**
  (call reusable blocks), and **`return`**.
- **Expressions / variables** — `${...}` expressions, built-in functions, JSON parsing; pass data
  between steps via variables.
- **Connectors** — typed wrappers for Google Cloud APIs (Cloud Run, Functions, Pub/Sub, BigQuery,
  Compute, Firestore, etc.) that handle auth, polling long-running ops, and retries.
- **Authenticated calls** — attach **OIDC** (Cloud Run/Functions) or **OAuth** (Google APIs) tokens
  minted from the **workflow service account**.
- **Callbacks + waits** — `create_callback_endpoint` + `await_callback` pause an execution until an
  external event/human posts back (event-driven / human-in-the-loop); `sys.sleep` for timed waits.
- **Error handling / retries** — `retry` with predicates + backoff and `except` blocks for compensation.
- **Executions** — each run is an **execution** with inputs, state (ACTIVE/SUCCEEDED/FAILED), and a
  full step-by-step result/log. **Triggers**: Cloud Scheduler, Eventarc, direct API/`gcloud`.

## Configuration and sizing
- Author the definition with idempotent, well-named steps; use **connectors** over raw HTTP where
  available; add **retry**/`except` around flaky calls; use **parallel** for independent fan-out; set
  the **workflow service account**. Nothing to size — Workflows scales executions automatically.

## Security and IAM
- Deployers need `roles/workflows.editor`; invokers `roles/workflows.invoker`. The **workflow service
  account** must hold every role the steps need (e.g. `roles/run.invoker`, `roles/bigquery.jobUser`,
  `roles/pubsub.publisher`) — least-privilege to exactly the called services. Use OIDC for private
  targets; keep secrets in Secret Manager (read via connector); audit via Cloud Audit Logs.

## Cost levers
- Billed per **step executed** (internal vs external steps priced differently; a free monthly tier
  exists). Levers: collapse trivial steps, avoid busy-wait polling loops (use connector long-running-op
  handling or callbacks instead of tight `sys.sleep` loops), and keep retries bounded. Called services
  (Cloud Run, BigQuery) bill separately.

## Scaling and limits
- Executions scale concurrently up to per-project quotas (raise via quotas). Watch the **max execution
  duration** (up to ~1 year with callbacks/sleep; active compute is bounded), per-step memory/expression
  limits, and HTTP call timeouts. For very high-throughput per-message work, a queue/stream (Tasks /
  Pub/Sub) may fit better than one execution per item.

## Operating procedure
1. **Provision** — enable the API (`gcloud services enable workflows.googleapis.com`; Terraform
   `google_project_service`), create/scope the **workflow service account** and grant it the roles for
   every service the workflow calls.
2. **Configure** — author the **workflow definition** (steps: `assign`/`call`/`switch`/`for`/
   `try`-`retry`-`except`/`return`, connectors, callbacks) and deploy it (`gcloud workflows deploy` or
   Terraform `google_workflows_workflow`); wire a **trigger** (Scheduler/Eventarc) if event-driven.
3. **Secure** — least-privilege the workflow SA, use OIDC/OAuth for authenticated calls, pull secrets
   from Secret Manager, restrict invoke/deploy IAM.
4. **Verify** — apply [[verify-by-running]]: run an **execution**
   (`gcloud workflows run WORKFLOW --data=...`) and confirm it reaches **`SUCCEEDED`**
   (`gcloud workflows executions describe`), reading the per-step result and confirming the intended
   side effects (downstream service calls) actually happened — capture the execution state and step
   output.

## Inputs
The multi-step process to orchestrate, the services/endpoints each step calls, branching/looping/
error-handling + retry needs, callbacks/waits, the trigger model, the workflow SA + required roles, and
region.

## Output
A Workflows setup (a deployed workflow definition with steps + connectors + retries + callbacks, a
scoped workflow SA, optional trigger) plus verification of a `SUCCEEDED` execution with the expected
step results and side effects.

## Notes
- Gotchas: the **workflow SA** must hold a role for **every** called service or the step fails (a top
  misconfiguration); tight `sys.sleep` polling loops waste steps/cost — use connector LRO handling or
  **callbacks**; expressions and step inputs have size limits; make steps **idempotent** since retries
  re-run them; HTTP `call` has timeouts — long work belongs in a connector LRO or a callback wait.
  Workflows **orchestrates** (state, branching, waits) — for fire-and-forget rate-limited delivery use
  Cloud Tasks, for event routing use Eventarc, for pub/sub use Pub/Sub. AWS equivalent is Step
  Functions; Azure is Logic Apps / Durable Functions.
- IaC/CLI: Terraform `google_workflows_workflow`, `google_project_service`, `google_service_account` +
  IAM. CLI `gcloud workflows deploy / run / list / describe`,
  `gcloud workflows executions run / describe / list`.
