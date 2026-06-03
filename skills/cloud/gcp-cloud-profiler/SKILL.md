---
name: gcp-cloud-profiler
description: Use when designing, provisioning, securing, or operating Cloud Profiler — Google Cloud's continuous, low-overhead statistical profiler (Cloud Operations / formerly Stackdriver) that collects production CPU and heap profiles from running services to find hot paths and memory hogs. Covers the profiling agent per language (Go, Java, Node.js, Python), profile types (CPU time, heap, allocated heap, contention, wall/threads), service and service-version labeling for diffing, flame-graph analysis across versions/regions, sampling/overhead, and deployment across GKE/Compute Engine/Cloud Run/App Engine, plus IAM, cost (overhead), and scaling/limits. Loads the Cloud Profiler knowledge: add the agent, label service/version, collect profiles, analyze flame graphs and diffs, and verify profiles appear. Consumed by the Cloud Profiler specialist and by the GCP role team (gcp-observability-engineer, which uses observability-instrumentation) when wiring the profiling signal (Cloud Profiler).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, cloud-profiler, observability, profiling, cpu-profiling, heap-profiling, flame-graph]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Cloud Profiler

Google Cloud's **continuous, low-overhead statistical profiler** (part of Cloud Operations, formerly
Stackdriver). A small agent runs **in production** and periodically samples **CPU** and **heap** (plus
contention/wall/allocated-heap where supported), shipping aggregated profiles you analyze as **flame
graphs**. It owns the **profiling** signal of GCP's observability suite (alongside Cloud Logging, Cloud
Monitoring, Cloud Trace).

## Core concepts and components
- **Profiling agent/library** — language-specific: **Go** (`cloud.google.com/go/profiler`), **Java**
  (agent jar), **Node.js** (`@google-cloud/profiler`), **Python** (`google-cloud-profiler`). Started in the
  app with a service name + version.
- **Profile types** — **CPU time**, **heap** (in-use memory), **allocated heap**, **contention/mutex**,
  **wall/threads** — availability varies by language.
- **Service & service-version labels** — profiles are grouped by **service** and **version**, enabling
  **diffing** across releases (regression hunting) and across **regions/zones**.
- **Flame-graph analysis** — the UI aggregates samples into a flame graph (width = resource share); you can
  **compare** two profiles (e.g., before/after a deploy) to spot regressions.
- **Deployment surfaces** — GKE, Compute Engine, Cloud Run, App Engine (and on-prem/other clouds with the
  agent + credentials).

## Configuration and sizing
- Add the **agent** to each service with a stable **service name** and a **version** that matches the
  deployed release (so diffs are meaningful). Run it across all replicas (statistical sampling aggregates
  fleet-wide). Choose profile types per language. Overhead is low (single-digit %); no sizing beyond
  ensuring the agent can reach the Profiler API.

## Security and IAM
- Grant the workload identity `roles/cloudprofiler.agent` (write profiles) and humans
  `roles/cloudprofiler.user` (read); use `roles/cloudprofiler.admin` sparingly. On GKE use **Workload
  Identity** rather than node-key credentials. Profiles can reveal function/symbol names — treat as
  internal. No data-path PII typically, but restrict read access appropriately.

## Cost levers
- **Cloud Profiler itself is free.** The only cost is the **agent's runtime overhead** (CPU/memory, kept
  low by statistical sampling). Levers: keep the agent enabled fleet-wide (sampling already minimizes
  cost), and disable extra profile types you do not analyze if overhead matters in a tight workload.

## Scaling and limits
- Scales transparently via statistical sampling — more replicas just means better aggregate coverage at no
  extra cost. Limits: agent collects on a periodic cadence (profiles appear after the first collection
  window, typically minutes); per-language profile-type support varies; consistent **service/version**
  labeling is required for diffing to work. No per-profile ingestion quota concern like metrics/traces.

## Operating procedure
1. **Provision** — enable the Cloud Profiler API and grant the workload identity
   `roles/cloudprofiler.agent` (via Workload Identity on GKE). IaC is light:
   `google_project_service` (cloudprofiler) + the IAM binding.
2. **Configure** — add the **language agent** to the service startup with the **service name** and
   **version** label (matching the release), select profile types, and deploy across replicas. Agent
   config lives in app/runtime, not Terraform.
3. **Secure** — grant Profiler IAM least-privilege (agent for write, user for read), prefer Workload
   Identity over static keys, and restrict who can read profiles.
4. **Verify** — apply [[verify-by-running]]: deploy the agent, wait one collection window, and confirm
   **profiles appear** for the **service/version** in the Profiler UI/API, confirm the **flame graph**
   shows expected hot paths, and confirm **diffing** two versions works (deploy a known change and compare)
   — capture the profile listing and the flame-graph/diff observation.

## Inputs
Services and languages/runtimes, deployment surface (GKE/GCE/Cloud Run/App Engine), service-name and
version labeling scheme, profile types needed (CPU/heap/contention/wall), Workload Identity/credentials
setup, IAM model, and any overhead constraints.

## Output
A Cloud Profiler configuration (language agent added per service with consistent service/version labels,
selected profile types, Workload Identity + agent IAM) across replicas, plus verification that profiles
appear for the service/version and the flame graph / version diff renders expected hot paths.

## Notes
- Gotchas: profiles only appear **after the first collection window** (minutes) — do not assume failure
  immediately; **inconsistent service/version labels** break diffing (set the version to the actual
  release); the agent must reach the **Profiler API** (egress/credentials) — on GKE use **Workload
  Identity**; per-language **profile-type** support differs (e.g., heap availability); overhead is low but
  not zero; flame graphs expose internal **symbol names** — treat as internal.
- IaC/CLI: Terraform `google_project_service` (cloudprofiler) + `google_project_iam_member`
  (`roles/cloudprofiler.agent`); the profiling agent is added in app code/runtime (Go/Java/Node/Python
  libraries), not via Terraform. There is no rich `gcloud profiler` surface — verification is via the
  Profiler API/console (profiles list + flame graph) for the service/version.
