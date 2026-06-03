---
name: gcp-cloud-build
description: Use when designing, provisioning, securing, or operating Cloud Build — Google Cloud's managed CI/build service: build configs (cloudbuild.yaml / Dockerfile), build steps (containerized steps, builder images, `args`, `waitFor` for parallelism), substitutions, artifacts and images, triggers (push/PR/tag/manual/Pub-Sub/webhook from GitHub/GitLab/Cloud Source Repositories), the build service account and per-step permissions, private worker pools (private pools) for VPC/private access, machine types, caching, and Artifact Registry integration, plus IAM, timeouts, and cost (Cloud Build). Loads the Cloud Build knowledge: author cloudbuild.yaml, create a trigger, build/push artifacts, secure the build identity, and verify a green build. Consumed by the Cloud Build specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they add CI.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-build, application-development, ci, build-triggers, cloudbuild-yaml]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Build

Google Cloud's managed **CI / build** service. It runs each build as a sequence of containerized
**steps** defined in a build config, pulling source from a repo or Cloud Storage, producing images and
artifacts — typically triggered on commits/PRs and pushing to Artifact Registry.

## Core concepts and components
- **Build config** — `cloudbuild.yaml` (or `.json`), or an inferred build from a **Dockerfile**;
  defines the ordered **steps**, `images`/`artifacts` to produce, `options`, `timeout`, and
  `substitutions`.
- **Build steps** — each step runs a **builder image** (e.g. `gcr.io/cloud-builders/docker`,
  `gcloud`, language builders, or any container) with `args`; the `/workspace` dir is shared across
  steps. **`waitFor`** controls ordering/parallelism.
- **Triggers** — start builds on **push / pull-request / tag** events, **manual**, **Pub/Sub**, or
  **webhook**, connected to **GitHub**, **GitLab/Bitbucket**, or **Cloud Source Repositories** via the
  2nd-gen repository connection.
- **Substitutions** — built-in (`$PROJECT_ID`, `$COMMIT_SHA`, `$BRANCH_NAME`) and user-defined
  variables injected into steps.
- **Artifacts / images** — push container images and store build artifacts (to **Artifact Registry**
  / Cloud Storage).
- **Worker pools** — the default pool, or **private pools** (private worker pools) on a peered VPC for
  access to private resources, custom machine types, and egress control.

## Configuration and sizing
- Author `cloudbuild.yaml` with minimal, cacheable **steps**; pick a **machine type** (higher for
  heavy builds) and a **timeout**; enable caching (Kaniko/Docker layer cache, Artifact Registry).
  Use **private pools** when builds must reach private/VPC resources or need fixed egress IPs.
  Parameterize with substitutions. Choose the region for the pool/build.

## Security and IAM
- Builds run as a **build service account** — scope it least-privilege to exactly what the build needs
  (push to Artifact Registry, deploy, read Secret Manager) and avoid the default broad SA where
  possible; the 2nd-gen default uses a per-project service account you should scope explicitly. Pull
  secrets from **Secret Manager** (`availableSecrets`), never inline. Use **private pools** + VPC-SC
  for private/sensitive builds, restrict who can run/edit triggers, sign/attest images for supply
  chain, and audit via Cloud Audit Logs.

## Cost levers
- Cost is per **build-minute** by **machine type** (a free daily tier exists); private pools add
  per-minute + networking cost. Levers: cache aggressively (layers/dependencies), parallelize
  independent steps with `waitFor`, right-size the machine type (don't over-provision), keep timeouts
  tight, and avoid redundant triggered builds (path/branch filters).

## Scaling and limits
- The default pool autoscales concurrent builds up to per-project quotas; private pools scale within
  their configured concurrency/machine limits. Per-build timeout (default 10 min, raise as needed) and
  per-project concurrent-build quotas apply — raise via the quotas page.

## Operating procedure
1. **Provision** — enable the Cloud Build (+ Artifact Registry) APIs
   (`gcloud services enable cloudbuild.googleapis.com artifactregistry.googleapis.com`; Terraform
   `google_project_service`), scope the **build service account**, create the **Artifact Registry**
   repo, and (if needed) a **private worker pool** on a peered VPC.
2. **Configure** — author `cloudbuild.yaml` (steps, builder images, `args`, `waitFor`, substitutions,
   `images`/`artifacts`, `availableSecrets`), connect the repo, and create a **trigger**
   (push/PR/tag) with branch/path filters (Terraform `google_cloudbuild_trigger`).
3. **Secure** — least-privilege the build SA, pull secrets from Secret Manager, use a private pool +
   VPC-SC for private resources, restrict trigger edit/run IAM, attest images.
4. **Verify** — apply [[verify-by-running]]: run the build (`gcloud builds submit` or fire the
   trigger), confirm it reaches **`SUCCESS`** (`gcloud builds list` / `describe` + read the log), and
   confirm the expected **image/artifact** landed in Artifact Registry — capture the actual build
   status and produced artifact.

## Inputs
The repo + source, the build steps/toolchain, trigger events + branch/path filters, artifacts/images
to produce + registry, secret needs, private-resource/VPC requirements, machine-type/timeout needs,
and IAM scope.

## Output
A Cloud Build setup (`cloudbuild.yaml` with steps + substitutions + secrets, a trigger with filters,
Artifact Registry target, a scoped build service account, optional private pool) plus verification of
a green (`SUCCESS`) build that produced the expected artifact/image.

## Notes
- Gotchas: the build **service account** is a common over-privilege and supply-chain risk (scope it,
  don't use a broad default); secrets belong in **Secret Manager** (`availableSecrets`), never inline
  in `cloudbuild.yaml`; the default pool can't reach private/VPC resources — use a **private pool**;
  builds time out at 10 min by default (raise it); `waitFor: ['-']` runs a step immediately
  (parallel); 1st-gen vs 2nd-gen repo connections differ. Cloud Build produces artifacts; **Cloud
  Deploy** consumes them for delivery — together they form the GCP-native CI/CD chain. The AWS
  equivalent is AWS CodeBuild; Azure is Azure Pipelines (build).
- IaC/CLI: Terraform `google_cloudbuild_trigger`, `google_cloudbuild_worker_pool`,
  `google_cloudbuildv2_connection`/`_repository`, plus `google_project_service`,
  `google_service_account`/IAM, `google_artifact_registry_repository`. CLI `gcloud builds submit`,
  `gcloud builds triggers create / run`, `gcloud builds list / describe / log`.
