---
name: gcp-app-engine
description: Use when designing, provisioning, securing, or operating App Engine — Google Cloud's fully managed PaaS for running web apps and APIs: the standard vs flexible environments (sandboxed language runtimes + scale-to-zero vs Docker containers on managed Compute VMs), the application / services / versions hierarchy, app.yaml configuration (runtime, handlers, env vars, instance_class, scaling blocks), traffic splitting + migration across versions (blue-green / canary / A-B), automatic / basic / manual scaling, the App Engine service account + IAM + Identity-Aware Proxy, custom domains + managed TLS, cron (legacy) and task handling, and regional pinning. Loads the App Engine knowledge: author app.yaml, deploy a version, split/migrate traffic, secure with IAP, and verify the served app. Consumed by the App Engine specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they host apps on PaaS (App Engine).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, app-engine, application-hosting, paas, traffic-splitting, autoscaling]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# App Engine

Google Cloud's fully managed **PaaS** for web apps and APIs. You deploy code (or a container); App
Engine builds, runs, autoscales, load-balances, and patches it for you — organized as one **application**
per project containing **services**, each with deployable **versions** you can split traffic across.

## Core concepts and components
- **Environments**:
  - **Standard** — sandboxed, language-specific **runtimes** (Python, Java, Go, Node, PHP, Ruby), very
    fast scaling **including scale-to-zero**, per-instance-hour billing; constrained (no arbitrary
    binaries, limited filesystem).
  - **Flexible** — your app in a **Docker container** on managed **Compute Engine VMs**: any runtime/
    binary, VPC access, but slower scaling, **no scale-to-zero** (min 1 instance), VM-based billing.
- **Application / services / versions** — one **application** per project (region-pinned for life);
  multiple **services** (microservices); each service has multiple **versions** (immutable deploys).
- **`app.yaml`** — per-service config: `runtime`, `handlers` (routing/static), `env_variables`,
  `instance_class`, and a **scaling** block (`automatic_scaling` / `basic_scaling` / `manual_scaling`).
- **Traffic splitting + migration** — route a percentage of traffic across versions for **blue-green /
  canary / A-B**, by IP or cookie; migrate gradually or instantly.
- **Scaling modes** — **automatic** (target CPU/throughput/concurrency, min/max instances),
  **basic** (spin up on request, idle-shutdown), **manual** (fixed instance count).
- **Security** — the **App Engine service account** is the app identity; **Identity-Aware Proxy (IAP)**
  gates access; **custom domains** get Google-managed TLS.

## Configuration and sizing
- Pick **standard** (bursty/spiky traffic, scale-to-zero, supported runtime) vs **flexible** (custom
  runtime/binaries, VPC, steady traffic). Set **`instance_class`** (CPU/RAM tier) and the **scaling**
  block (min/max instances, target utilization, max concurrent requests). The **region** is fixed when
  the application is first created — choose carefully.

## Security and IAM
- Deploys need `roles/appengine.deployer` + `roles/cloudbuild.builds.editor`; the running app uses the
  **App Engine default service account** — scope it least-privilege (or use a user-managed SA on
  flexible). Front with **IAP** for internal apps, enforce HTTPS, use `ingress`/firewall rules to
  restrict sources, keep secrets in Secret Manager, and audit via Cloud Audit Logs.

## Cost levers
- **Standard** bills per **instance-hour** by `instance_class` and **scales to zero** (a free tier
  exists) — ideal for spiky/low-traffic apps. **Flexible** bills the **underlying VMs** continuously
  (min 1). Levers: prefer standard + scale-to-zero where possible, cap `max_instances`, raise
  `max_concurrent_requests` to pack more per instance, and delete stopped/old versions (they may still
  reserve resources on basic/manual/flexible).

## Scaling and limits
- Standard autoscaling is near-instant and scales to zero; flexible scales by VM (minutes, min 1).
  Watch the per-application **region lock**, standard's runtime/sandbox restrictions, flexible's slower
  deploys, request timeout limits (standard auto: 10 min), and per-project instance quotas.

## Operating procedure
1. **Provision** — enable the API (`gcloud services enable appengine.googleapis.com`), create the
   **application** in the chosen **region** (`gcloud app create --region=REGION`; Terraform
   `google_app_engine_application`), and scope the App Engine **service account**.
2. **Configure** — author **`app.yaml`** per service (runtime, handlers, env vars, `instance_class`,
   scaling block) choosing **standard vs flexible**, and deploy a **version**
   (`gcloud app deploy --no-promote`).
3. **Secure** — least-privilege the app SA, front internal apps with **IAP**, restrict ingress/firewall,
   enforce HTTPS + custom-domain TLS, keep secrets in Secret Manager.
4. **Verify** — apply [[verify-by-running]]: deploy the version, then **split/migrate traffic**
   (`gcloud app services set-traffic --splits=...`) and confirm the app **serves correctly** — hit the
   URL / health check, confirm the new version takes the intended traffic %, and watch logs/error rate
   before full cutover (`gcloud app versions list`, `gcloud app browse`) — capture the served response
   and the traffic split.

## Inputs
The app + runtime, standard-vs-flexible drivers (runtime support, VPC, scale-to-zero, traffic shape),
scaling targets + instance class, traffic-migration strategy, domain/TLS, IAP/ingress requirements, the
fixed region, and IAM scope.

## Output
An App Engine deployment (`app.yaml` per service with runtime + handlers + scaling, deployed version(s),
a traffic split, scoped SA, IAP/ingress + TLS) plus verification that the app serves and the intended
version takes the configured traffic.

## Notes
- Gotchas: the **application region is permanent** (one per project) — picking wrong means a new
  project; **standard scales to zero** (cheap, spiky) while **flexible has min 1 VM** (always billing);
  standard's **sandbox** forbids arbitrary binaries/local FS — use flexible for those; deploy
  `--no-promote` then **split traffic** for safe canary/blue-green; old versions on basic/manual/flex
  can keep billing — delete them. Pick App Engine (**PaaS**, opinionated, autoscaled apps) vs **Cloud
  Run** (serverless **containers**, more control + scale-to-zero) vs **GKE** (full **Kubernetes**); App
  Engine flexible overlaps Cloud Run — prefer Cloud Run for new container workloads. AWS analog is
  Elastic Beanstalk; Azure is App Service.
- IaC/CLI: Terraform `google_app_engine_application`, `google_app_engine_standard_app_version` /
  `_flexible_app_version`, `google_app_engine_service_split_traffic`, `google_project_service`. CLI
  `gcloud app create / deploy / browse`, `gcloud app services set-traffic`,
  `gcloud app versions list / migrate / delete`.
