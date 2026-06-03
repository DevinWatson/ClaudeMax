---
name: gcp-batch
description: Use when designing, provisioning, securing, or operating Batch — Google Cloud's fully managed batch/HPC job scheduler that runs containerized or script jobs on Compute Engine: the job spec (task groups, task count + parallelism, runnables as container or script, retries, max-run-duration), compute resources (machine type, CPU/memory per task, GPUs), provisioning models (standard vs Spot), allocation policies + instance templates + locations, environment + volumes (Cloud Storage / NFS / persistent disk), the job service account + IAM, and logging/monitoring of task status. Loads the Batch knowledge: author a job spec, choose provisioning + parallelism, mount storage, submit the job, and verify tasks succeed. Consumed by the Batch specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they run managed batch/HPC jobs (Batch).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, batch, hpc, jobs, task-groups, spot, compute]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Batch

Google Cloud's fully managed **batch / HPC job** service. You describe a job (what to run, how many
tasks, what compute); Batch provisions Compute Engine VMs, schedules and runs the tasks, retries
failures, and tears the VMs down — no cluster to manage.

## Core concepts and components
- **Job + task groups** — a **job** contains one or more **task groups**; each group defines a
  **task count** and **parallelism** (how many tasks run concurrently), plus retry policy and
  **max-run-duration**.
- **Runnables** — each task runs one or more **runnables**: a **container** (image + command) or a
  **script** (inline/path). Runnables execute in order; barriers coordinate task groups.
- **Compute resources** — per-task **CPU/memory** requirements and the **machine type** (or a list);
  optional **GPUs/accelerators** for HPC/ML.
- **Allocation policy** — where/how VMs are provisioned: **instance template** or inline machine spec,
  **provisioning model** (**standard** vs **Spot** = cheap/reclaimable), **locations** (regions/zones),
  disks, and network.
- **Environment + volumes** — env vars/secrets per task; mount **Cloud Storage** buckets, **NFS/
  Filestore**, or **persistent disks** so tasks share input/output.
- **Identity + observability** — a **job service account**; task/job state and logs flow to Cloud
  Logging / Monitoring; tasks expose `BATCH_TASK_INDEX` for sharded work.

## Configuration and sizing
- Size **CPU/memory per task** and pick a **machine type** that fits, set **task count** + **parallelism**
  (cap concurrency to fit quota/budget), choose **standard vs Spot**, and pick **locations** for capacity/
  cost. Mount the right **storage** (GCS for object I/O, Filestore/PD for POSIX). Use GPUs only when the
  workload needs them.

## Security and IAM
- Submitters need `roles/batch.jobsEditor`; the **job service account** needs only what tasks touch
  (e.g. `roles/storage.objectAdmin` for a bucket) — least-privilege it. Use private IPs + firewall,
  Secret Manager for credentials, CMEK on disks, and Cloud Audit Logs. Tasks should not run as broad
  project SAs.

## Cost levers
- You pay for the underlying **Compute Engine VMs** for the job's duration (plus storage/egress). Levers:
  **Spot VMs** (big discount, handle reclamation via retries), right-size **CPU/memory per task** and
  machine type, tune **parallelism** so VMs stay busy (less idle time), pick cheaper **locations**, and
  set **max-run-duration** to cap runaway tasks.

## Scaling and limits
- Batch autoscales VM count to the requested **parallelism** then tears down on completion. Watch regional
  **CPU/GPU quotas** (parallelism is capped by quota), Spot reclamation (set retries / use standard for
  short critical jobs), per-job task limits, and that very large fan-outs may queue.

## Operating procedure
1. **Provision** — enable the API (`gcloud services enable batch.googleapis.com`) and scope the **job
   service account** for the storage/APIs the tasks touch (Terraform `google_batch_job`,
   `google_service_account`, `google_project_service`).
2. **Configure** — author the **job spec** (JSON/YAML): task group(s) with **runnables**
   (container/script), **task count** + **parallelism**, per-task **CPU/memory**, **allocation policy**
   (machine type, **standard vs Spot**, locations), retries + max-run-duration, env/secrets, and **volume**
   mounts (GCS/NFS/PD).
3. **Secure** — least-privilege the job SA, private networking + firewall, secrets via Secret Manager,
   CMEK on disks.
4. **Verify** — apply [[verify-by-running]]: **submit** the job (`gcloud batch jobs submit --config=...`),
   confirm it reaches **SUCCEEDED** with the expected task counts (`gcloud batch jobs describe`,
   `gcloud batch tasks list`), inspect task logs for the expected output, and confirm artifacts landed in
   the mounted storage. Capture the job state and a representative task's logs/output.

## Inputs
The workload (container image or script), per-task CPU/memory + machine type + optional GPU, task count +
parallelism, provisioning model (standard/Spot), locations, retry + max-run-duration, env/secrets, volume
mounts (GCS/NFS/PD), and the job service account + IAM scope.

## Output
A Batch job spec (task groups with runnables, parallelism, sized compute, allocation policy, volumes,
scoped SA) plus verification that the job SUCCEEDED, tasks produced the expected output, and artifacts
landed in storage.

## Notes
- Gotchas: **parallelism is capped by Compute Engine quota** — request quota for large fan-outs; **Spot
  tasks get reclaimed** — rely on retries / idempotent tasks; size **CPU/memory per task** correctly or VMs
  pack poorly; set **max-run-duration** to avoid runaway billing; use `BATCH_TASK_INDEX` to shard input.
  Pick **Batch** for fire-and-forget batch/HPC fan-out vs **GKE/Cloud Run jobs** (when you already run
  K8s/serverless) vs **Compute Engine MIGs** (long-running services). AWS analog is AWS Batch.
- IaC/CLI: Terraform `google_batch_job`, `google_service_account` + IAM bindings,
  `google_compute_instance_template` (for templated allocation), `google_project_service`. CLI
  `gcloud batch jobs submit / describe / list`, `gcloud batch tasks list`.
