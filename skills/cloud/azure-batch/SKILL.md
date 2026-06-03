---
name: azure-batch
description: Use when designing, provisioning, securing, or operating Azure Batch — Microsoft Azure's managed service for large-scale parallel and high-performance batch compute (Azure Batch). Covers the Batch account and its pools/jobs/tasks model, compute-node pools (dedicated vs low-priority/Spot nodes, VM sizes, OS images and container support), autoscale formulas, task scheduling and dependencies and multi-instance/MPI tasks, application packages and resource/output files in Azure Storage, job/task constraints and retries, VNet pools and Entra ID/managed identities and pool allocation modes, and cost. Loads the Batch knowledge: create a pool, submit jobs/tasks with autoscale, secure, and verify tasks complete. Consumed by the azure-batch specialist and by the Azure role team (azure-iac-engineer / azure-cloud-architect) when standing up the managed service (Azure Batch).
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [azure, azure-batch, compute, hpc, batch-processing, autoscale]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Azure Batch

Microsoft Azure's **managed batch / HPC compute** — provision pools of VMs, schedule large numbers of
parallel tasks across them, and scale automatically, without managing the scheduler or cluster yourself.

## Core concepts and components
- **Batch account** — the top-level resource (region-scoped) that owns pools, jobs, and quota; the unit of
  RBAC, networking, and billing. **Pool allocation mode** is **Batch service** (managed subscription) or
  **User subscription** (nodes in your subscription, needed for some features).
- **Pool** — a managed set of **compute nodes** (VMs) of a chosen **size/series** and **OS image** (or
  container-enabled image); nodes are **dedicated** or **low-priority / Spot** (evictable, deeply
  discounted).
- **Job** — a container for tasks, scoped to a pool, with job-level constraints and an optional **job
  manager** task.
- **Task** — a unit of work (a command line) run on a node, with **resource files** (inputs from Storage),
  **output files** (uploaded to Storage), env vars, retry/constraint settings; supports **task
  dependencies** and **multi-instance (MPI)** tasks.
- **Autoscale** — a **formula** (expression over metrics like pending tasks, node counts, time) that
  resizes the pool automatically on an evaluation interval.
- **Application packages** — versioned app/binary bundles deployed to nodes for tasks to use.

## Configuration and sizing
- Choose the **node VM size/series** for the workload (compute/memory/GPU/HPC-RDMA), the **OS/container**
  image, and the **dedicated vs low-priority** mix. Write an **autoscale formula** (or set fixed target
  counts) to track pending tasks. Stage inputs as **resource files** and define **output files** to
  Storage. Set **task max retries / max wall-clock** constraints and **task dependencies**. Add
  **application packages** for binaries.

## Security and IAM
- Prefer **Entra ID** auth and **managed identities** on pools (node identity to reach Storage/ACR/Key
  Vault) over shared keys. Use **VNet pools** and Private Endpoints; restrict node public access (no
  default inbound). Apply least-privilege **RBAC**. Store secrets in **Key Vault**; pull container images
  from **ACR** via managed identity. Encrypt disks; use **User subscription** mode where policy requires
  nodes in your tenant.

## Cost levers
- Billed for **underlying VM compute** (per node-second) + Storage/data; **Batch itself is free**. Levers:
  use **low-priority / Spot nodes** for interruptible work (large discount, handle evictions); **autoscale
  to zero** when no pending tasks; right-size the node SKU and **tasks-per-node** (`maxTasksPerNode`) to
  pack work; **Reserved Instances / Savings Plans** for steady dedicated capacity; pick the cheapest region
  that meets latency/data-gravity.

## Scaling and limits
- Pools scale by **autoscale formula** or manual target (dedicated + low-priority counts). Per-region
  **core quota per account/family** and **active job/pool quotas** gate scale (request increases ahead of
  need). Low-priority nodes can be **evicted** at any time — design tasks to be idempotent/restartable.
  Autoscale evaluation interval limits how fast a pool reacts.

## Operating procedure
1. **Provision** — create the **Batch account** (and its linked **Storage account**) via Terraform
   `azurerm_batch_account` (+ `azurerm_batch_pool`) (or Bicep/`az batch account create`).
2. **Configure** — create a **pool** with node size/image, dedicated + low-priority targets, an
   **autoscale formula**, and **application packages**; define a **job** and submit **tasks** with resource/
   output files and constraints/dependencies (`az batch pool/job/task` or the Batch SDK).
3. **Secure** — assign a **managed identity** to the pool, use **VNet pools** + Private Endpoints,
   least-privilege RBAC, pull images from ACR via identity, and store secrets in Key Vault.
4. **Verify** — apply [[verify-by-running]]: confirm the pool reaches **steady** with nodes **idle/running**
   (`az batch pool show`, `az batch node list`), submit a small **job + task**, and confirm the task reaches
   **completed** with **exit code 0** and the expected **output file** in Storage (`az batch task show`).
   Capture the node state and the task result/output.

## Inputs
The workload (command, parallelism, MPI?), the node VM size/image and dedicated/low-priority mix, input/
output data in Storage, the autoscale strategy, task constraints/dependencies, application packages,
networking, the region, and the identity security requirements.

## Output
An Azure Batch setup: a Batch account with a pool (sized nodes, dedicated/low-priority mix, autoscale
formula, application packages) and a job/task definition reading/writing Storage — secured by managed
identity, VNet pools, and RBAC — plus verification that nodes provision and a task completes with the
expected output.

## Notes
- Gotchas: **low-priority/Spot nodes are evicted** without warning — make tasks idempotent and use retries;
  **core quota is per-family per-region per-account** and silently caps pools; **autoscale formulas** are
  easy to get wrong (reference pending tasks, add stability windows) and re-evaluate on a fixed interval;
  **resource/output file** SAS or managed-identity access must be correct or tasks fail at start;
  **User subscription** mode requires extra Key Vault/permissions setup. This owns **batch/HPC scheduling**
  — for general autoscaling app fleets defer to **azure-vm-scale-sets**, for single VMs to
  **azure-virtual-machines**. 2nd consumer: the Azure role team (azure-iac-engineer / azure-cloud-architect).
  Cross-cloud peers: AWS Batch, GCP Batch.
- IaC/CLI: Terraform `azurerm_batch_account` + `azurerm_batch_pool` (+ `azurerm_batch_job`); Bicep/ARM
  `Microsoft.Batch/batchAccounts` (+ `/pools`). CLI `az batch account create` / `az batch pool create` /
  `az batch job/task create` / `az batch task show`; verify by submitting a task and checking exit code +
  output file.
