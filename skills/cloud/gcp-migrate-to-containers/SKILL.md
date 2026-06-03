---
name: gcp-migrate-to-containers
description: Use when planning or executing a Migrate to Containers (M2C) modernization — Google Cloud's tool that converts running VM workloads (on-prem, AWS, Azure, Compute Engine) into containerized workloads on GKE or Cloud Run: the processing cluster + migration source, fit assessment, extracting a workload into a migration plan + Dockerfile + Kubernetes manifests (Deployment/StatefulSet, PVCs, ConfigMaps), handling data/stateful volumes, building the image to Artifact Registry, and deploying + cutting over to GKE/Cloud Run. Loads the M2C knowledge: assess fit, generate + tune the migration plan, build the container image, deploy to GKE/Cloud Run, and verify the modernized workload serves. Consumed by the Migrate to Containers specialist and by the GCP role team (gcp-cloud-architect / gcp-iac-engineer) when they modernize VMs into containers (Migrate to Containers).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, migrate-to-containers, modernization, gke, cloud-run, migration, compute]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Migrate to Containers (M2C)

Google Cloud's tool to **modernize VM workloads into containers** running on **GKE** or **Cloud Run**. It
inspects a source VM, generates a container image + Kubernetes/Cloud Run artifacts, and helps you deploy
and cut over — turning lift-and-shift VMs into containerized workloads.

## Core concepts and components
- **Migration source** — the VM(s) being modernized: on-prem (vSphere), other clouds (AWS/Azure), or
  Compute Engine. M2C connects to extract the OS/app layout.
- **Processing cluster** — a GKE cluster running the **M2C runtime** that performs extraction and builds
  artifacts (or the standalone CLI for some flows).
- **Fit assessment** — analyze whether a workload is a good container candidate (stateless-ish web/app
  servers fit; kernel-coupled, GUI, or licensing-bound apps may not).
- **Migration plan** — a generated, tunable spec describing what to copy/exclude, exposed ports, env, and
  the target shape; you edit it before generating artifacts.
- **Generated artifacts** — a **Dockerfile**, the container **image**, and **Kubernetes manifests**
  (Deployment/StatefulSet, Service, **PVCs** for stateful volumes, ConfigMaps) or a **Cloud Run** config.
- **Image registry + target** — the built image lands in **Artifact Registry**; deploy target is **GKE**
  (full K8s) or **Cloud Run** (serverless containers).

## Configuration and sizing
- Choose the **target** (GKE for stateful/long-running/full-control, Cloud Run for stateless HTTP). Decide
  what data to **migrate vs externalize** (move DBs to managed services, keep app stateless). Tune the
  **migration plan** (excluded paths, ports, env, resource requests) and pick the **processing cluster**
  size to fit extraction throughput.

## Security and IAM
- The migration needs `roles/migrationcenter.*` / Migrate to Containers roles + access to the source and
  to **Artifact Registry** (`roles/artifactregistry.writer`). Scope the processing-cluster SA and the
  target workload SA least-privilege (use **Workload Identity** on GKE). Scan the generated image, keep
  secrets in Secret Manager, and audit via Cloud Audit Logs.

## Cost levers
- Costs come from the **processing cluster** (during migration only — tear it down after) plus the **target
  runtime** (GKE nodes / Autopilot pods or Cloud Run usage). Levers: run the processing cluster only during
  migrations, prefer **Cloud Run / Autopilot** for the target (pay-per-use), right-size workload requests,
  and externalize data to cheaper managed stores.

## Scaling and limits
- Throughput is bounded by the processing cluster and source bandwidth; migrate in **waves** by app. Watch
  workloads that **don't fit containers** (kernel modules, GUI, hardware/licensing dependencies — keep on
  VMs via Migrate to VMs), stateful data handling, and that the migration plan needs human tuning.

## Operating procedure
1. **Provision** — enable the API (`gcloud services enable ...`), set up the **processing cluster** (GKE)
   + the **migration source** connection, and scope IAM to the source + Artifact Registry.
2. **Assess + plan** — run a **fit assessment**, then create a migration + generate a **migration plan**;
   tune it (excluded paths, ports, env, target = GKE vs Cloud Run, resource requests).
3. **Generate + secure** — generate the **Dockerfile + image + manifests/Cloud Run config**, build to
   **Artifact Registry**, scan the image, set least-privilege workload SA / Workload Identity, externalize
   data and secrets.
4. **Verify** — apply [[verify-by-running]]: **deploy** the generated artifacts to GKE/Cloud Run, confirm
   the workload starts and **serves correctly** (`kubectl get pods` Ready / `gcloud run services describe`,
   curl the endpoint / health check), run the app's functional checks against the modernized container,
   and validate data/state before cutting over from the source VM. Capture the deployed status and the
   served response.

## Inputs
The source VM(s) + connection, target choice (GKE vs Cloud Run), fit-assessment results, the tunable
migration plan (excluded paths, ports, env, resource requests), data/stateful handling strategy, Artifact
Registry destination, and IAM scope for source + registry + target.

## Output
A modernized workload (generated Dockerfile + image in Artifact Registry + Kubernetes manifests or Cloud
Run config deployed to the target, with externalized data/secrets and a scoped SA) plus verification that
the container serves correctly and functional/data checks pass before cutover.

## Notes
- Gotchas: not every VM **fits a container** — run the fit assessment first; **stateful data** must be
  handled deliberately (externalize to managed DBs / mount PVCs); the **migration plan needs human
  tuning** (don't ship the raw generated artifacts blindly); tear down the **processing cluster** after to
  stop billing; for lift-and-shift VMs that should stay VMs, use **Migrate to VMs** instead (gcp-migrate-to-vms).
  Pick GKE target for stateful/full-control, Cloud Run for stateless HTTP. AWS analog is App2Container /
  the Application Migration Service modernization paths.
- IaC/CLI: largely a console/CLI-driven workflow on a GKE processing cluster (the `migctl` tooling) plus
  Terraform for the **processing GKE cluster** (`google_container_cluster`), Artifact Registry
  (`google_artifact_registry_repository`), and `google_project_service`; deploy targets via
  `google_container_*` / `google_cloud_run_v2_service`.
