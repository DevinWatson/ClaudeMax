---
name: gcp-cloud-run
description: Use when designing, provisioning, securing, or operating Cloud Run — Google Cloud's serverless container platform: services (request/HTTP-driven, autoscaling) vs jobs (run-to-completion tasks/task arrays), immutable revisions + traffic splitting (blue-green/canary), concurrency (requests per container), scale-to-zero vs min-instances (warm), CPU allocation (always-on vs only-during-requests) + CPU boost, memory/CPU sizing, the per-service service account + IAM invoker, ingress controls + IAP + VPC connectors / Direct VPC egress, Cloud SQL connections, and Artifact Registry images. Loads the Cloud Run knowledge: deploy a container service or job, set concurrency/scaling, split traffic, scope IAM/ingress, and verify the served endpoint. Consumed by the Cloud Run specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they host serverless containers (Cloud Run).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-run, serverless, containers, autoscaling, jobs, application-hosting]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Run

Google Cloud's fully managed **serverless container** platform. You ship a container image; Cloud Run
runs, autoscales (including **to zero**), load-balances, and patches it — billing only while containers
are active. Two resource kinds: **services** (HTTP/event-driven, long-lived, autoscaled) and **jobs**
(run-to-completion batch tasks).

## Core concepts and components
- **Services** — request-driven containers that listen on `$PORT`; each deploy creates an immutable
  **revision**; you route a **traffic split** across revisions for blue-green / canary.
- **Jobs** — run a container to completion as one or more **tasks** (task arrays via `--tasks` with
  `CLOUD_RUN_TASK_INDEX`), retried on failure; triggered manually, by Cloud Scheduler, or Eventarc.
- **Concurrency** — max simultaneous **requests per container instance** (default 80; set 1 for
  CPU-bound or non-thread-safe apps). Higher concurrency packs more requests per instance = cheaper.
- **Scaling** — **scale-to-zero** by default; set **min-instances** to keep warm (kill cold starts) and
  **max-instances** to cap. Autoscales on concurrency/CPU.
- **CPU allocation** — **CPU only during request processing** (cheaper, throttled between requests) vs
  **CPU always allocated** (for background work / min-instances). **Startup CPU boost** speeds cold start.
- **Networking** — **ingress** (all / internal / internal+LB), **IAP**, **VPC connector** or **Direct
  VPC egress** for private resources, Cloud SQL via Unix socket.
- **Identity** — a per-service **service account**; callers need `roles/run.invoker` (or public via
  `allUsers`). Images come from **Artifact Registry**.

## Configuration and sizing
- Set **CPU** (e.g. 1–8 vCPU) and **memory** (128 MiB–32 GiB) per revision, **concurrency**,
  **min/max-instances**, **timeout** (up to 60 min), and **CPU allocation** mode. Pick gen1 vs gen2
  execution environment (gen2 = full Linux/filesystem, faster CPU). Region per service (multi-region via
  external HTTPS LB).

## Security and IAM
- Deploys need `roles/run.developer` + `roles/iam.serviceAccountUser`; the running container uses its
  **service account** — scope least-privilege. Default to **`--no-allow-unauthenticated`** (require
  `run.invoker`); front public apps with IAP; restrict **ingress** to internal/LB; keep secrets in
  Secret Manager (mounted as env/volume); audit via Cloud Audit Logs.

## Cost levers
- Billed per **vCPU-second + memory-second** while active (request-based billing with CPU-during-request)
  plus per-request fee; a free tier exists. Levers: **scale-to-zero**, raise **concurrency** to pack
  requests, prefer **CPU-only-during-request**, keep **min-instances** low (warm = always billing), cap
  **max-instances**, and right-size CPU/memory.

## Scaling and limits
- Near-instant autoscaling + scale-to-zero; cold starts mitigated by **min-instances** / startup boost.
  Watch the **request timeout** ceiling, **max-instances** quota, concurrency-vs-memory tradeoffs, and
  that **jobs** have a task timeout + retry count, not request concurrency.

## Operating procedure
1. **Provision** — enable the API (`gcloud services enable run.googleapis.com`), ensure the image is in
   **Artifact Registry**, and create/scope the per-service **service account** (Terraform
   `google_cloud_run_v2_service` / `google_cloud_run_v2_job`, `google_project_service`).
2. **Configure** — deploy a **service** (`gcloud run deploy --image ... --no-allow-unauthenticated`) or
   **job** (`gcloud run jobs create`), setting CPU/memory, **concurrency**, **min/max-instances**,
   timeout, CPU-allocation mode, ingress, and VPC egress; deploy with `--no-traffic` for canary.
3. **Secure** — least-privilege the SA, require `run.invoker` (or IAP), restrict **ingress**, wire VPC
   connector / Direct VPC egress + Cloud SQL, mount secrets from Secret Manager.
4. **Verify** — apply [[verify-by-running]]: deploy the revision, **split traffic**
   (`gcloud run services update-traffic --to-revisions=REV=PCT`), then confirm the endpoint **serves
   correctly** — curl the service URL / health check (with an identity token if authenticated), confirm
   the new revision takes the intended traffic %, and watch logs/error rate before full cutover; for a
   **job**, `gcloud run jobs execute` and confirm task success. Capture the served response and split.

## Inputs
The container image (Artifact Registry), service-vs-job choice, CPU/memory + concurrency + scaling
(min/max, scale-to-zero), CPU-allocation mode, timeout, traffic/canary strategy, ingress + auth (IAP /
invoker), VPC egress + Cloud SQL needs, secrets, region, and IAM scope.

## Output
A Cloud Run deployment (service or job with image, CPU/memory, concurrency, scaling, CPU-allocation,
ingress + auth, VPC egress, secrets, scoped SA) plus a traffic split and verification that the endpoint
serves and the intended revision takes the configured traffic.

## Notes
- Gotchas: containers must listen on **`$PORT`** and start fast (cold start); **min-instances keep
  billing** even idle (with CPU-always); **CPU is throttled between requests** unless CPU-always —
  background threads stall otherwise; default concurrency 80 can overload thread-unsafe apps (set 1);
  `--allow-unauthenticated` makes it public (`allUsers` invoker) — avoid by default. Pick **Cloud Run**
  for serverless **containers** (more control + scale-to-zero) vs **App Engine** (opinionated PaaS) vs
  **GKE** (full Kubernetes); prefer Cloud Run over App Engine flexible for new container workloads. AWS
  analogs are App Runner / Fargate; Azure is Container Apps.
- IaC/CLI: Terraform `google_cloud_run_v2_service`, `google_cloud_run_v2_job`,
  `google_cloud_run_service_iam_member`, `google_vpc_access_connector`, `google_project_service`. CLI
  `gcloud run deploy / services update-traffic / services describe`, `gcloud run jobs create / execute`.
