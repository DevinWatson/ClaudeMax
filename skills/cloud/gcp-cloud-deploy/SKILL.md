---
name: gcp-cloud-deploy
description: Use when designing, provisioning, securing, or operating Cloud Deploy — Google Cloud's managed continuous-delivery service: delivery pipelines, targets (GKE / Cloud Run / GKE Enterprise / Anthos), the promotion sequence and approvals, releases and rollouts, Skaffold-based render/deploy, canary and progressive deployment strategies (phases, percentages, verify), automation rules, deploy hooks, rollback, and the per-target execution service account, plus IAM, multi-environment promotion, and cost (Cloud Deploy). Loads the Cloud Deploy knowledge: define a delivery pipeline + targets with Skaffold, create a release, promote/approve through environments with a canary strategy, secure the identity, and verify a rollout. Consumed by the Cloud Deploy specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they add continuous delivery.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-deploy, application-development, continuous-delivery, delivery-pipeline, skaffold]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Deploy

Google Cloud's managed **continuous-delivery** service. It promotes a built artifact through ordered
environments (dev → staging → prod) using a declarative **delivery pipeline** and **Skaffold**, with
approvals, canary strategies, verification, and one-click rollback.

## Core concepts and components
- **Delivery pipeline** — a declarative resource defining the ordered **promotion sequence** of
  stages (each pointing at a target) and the **deployment strategy**.
- **Targets** — the deploy destinations: **GKE**, **Cloud Run**, **GKE Enterprise/Anthos** clusters;
  a target can **require approval** before deploying.
- **Releases** — an immutable snapshot rendered (via **Skaffold**) from your manifests + the built
  image; the unit you promote.
- **Rollouts** — the deployment of a release to a specific target; tracks status and supports
  **rollback** to a previous rollout.
- **Strategies** — **standard** (all at once) or **canary** (phased percentages, e.g. 25/50/100) with
  optional **verify** phases; progressive delivery per target.
- **Skaffold** — `skaffold.yaml` drives render + deploy (manifests/Helm/Kustomize → applied to the
  target).
- **Automation + deploy hooks** — automation rules (auto-promote, auto-advance, repair/rollback) and
  pre/post **deploy hooks** (containerized steps for tests/migrations).

## Configuration and sizing
- Author the **delivery pipeline** YAML (ordered stages → targets, approval gates, **canary**
  strategy with phase percentages + verify), define each **target** (GKE/Cloud Run cluster +
  execution config), and provide `skaffold.yaml` for render/deploy. Choose the region. There's no
  capacity to size — it's a managed control plane; the workload runs on your targets.

## Security and IAM
- Each target uses an **execution service account** that performs the render/deploy/verify — scope it
  least-privilege to only that environment (deploy to that GKE/Cloud Run target, read the image, run
  hooks); use **separate SAs per environment** so prod isn't reachable from dev. Gate prod targets
  with **required approval**, restrict who can create releases/promote/approve via Cloud Deploy IAM
  roles, keep targets private where possible, enable VPC-SC, and audit via Cloud Audit Logs.

## Cost levers
- Cloud Deploy is priced per **active delivery pipeline** (per month), plus the cost of the
  render/verify executions and the target compute. Levers: consolidate pipelines, retire unused ones,
  keep verify/hook executions lean, and avoid redundant releases. The dominant cost is usually the
  underlying GKE/Cloud Run targets, not Cloud Deploy itself.

## Scaling and limits
- The control plane is managed; throughput scales with your targets. Per-project quotas govern
  pipelines, targets, releases, and rollouts — raise via the quotas page. Canary phases and verify
  add wall-clock time to a promotion.

## Operating procedure
1. **Provision** — enable the Cloud Deploy API (`gcloud services enable clouddeploy.googleapis.com`;
   Terraform `google_project_service`), create per-environment **execution service accounts**, and
   ensure the **targets** (GKE / Cloud Run) exist.
2. **Configure** — author the **delivery pipeline** (ordered stages → **targets**, approval gates,
   **canary** strategy + verify) and **target** definitions, provide `skaffold.yaml`, and apply with
   `gcloud deploy apply` (Terraform `google_clouddeploy_delivery_pipeline`, `google_clouddeploy_target`).
3. **Secure** — scope each target's execution SA least-privilege and per-environment, require approval
   on prod, restrict promote/approve IAM, enable VPC-SC.
4. **Verify** — apply [[verify-by-running]]: create a **release** (`gcloud deploy releases create`),
   confirm the first **rollout** reaches **`SUCCEEDED`** (`gcloud deploy rollouts list / describe`),
   **promote** through the pipeline (approving where gated), and confirm the app is actually serving
   the new revision on the target — capture the actual rollout status and a live check.

## Inputs
The artifact/image to deliver, the environment sequence + targets (GKE / Cloud Run), the strategy
(standard vs canary + phases/verify), approval gates, `skaffold.yaml`/manifests, per-environment IAM
scope, and region.

## Output
A Cloud Deploy setup (delivery pipeline with ordered targets + canary strategy + approval gates,
target definitions, `skaffold.yaml`, per-environment execution service accounts) plus verification of
a release whose rollout reaches SUCCEEDED and a confirmed live deployment after promotion.

## Notes
- Gotchas: each target's **execution service account** is a key boundary — scope per-environment so
  dev can't deploy to prod, and don't over-grant; **releases are immutable** (rendered via Skaffold at
  create time — fix forward with a new release or **rollback**, don't mutate); approval gates block
  promotion until approved; canary phases + verify add time and need a working verify; targets
  (GKE/Cloud Run) must already exist. **Cloud Build** produces the artifact and **Cloud Deploy**
  delivers it — together they are the GCP-native CI/CD chain. The AWS equivalent is AWS CodeDeploy/
  CodePipeline; Azure is Azure Pipelines (release).
- IaC/CLI: Terraform `google_clouddeploy_delivery_pipeline`, `google_clouddeploy_target`,
  `google_clouddeploy_automation`, plus `google_project_service` and `google_service_account`/IAM for
  execution SAs; pipeline/target YAML is commonly applied via `gcloud deploy apply`. CLI
  `gcloud deploy apply`, `gcloud deploy releases create`, `gcloud deploy rollouts list / describe`,
  `gcloud deploy releases promote`.
