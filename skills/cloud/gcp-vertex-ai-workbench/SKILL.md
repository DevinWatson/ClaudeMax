---
name: gcp-vertex-ai-workbench
description: Use when designing, provisioning, securing, or operating Vertex AI Workbench — Google Cloud's managed JupyterLab notebook environment for data science and ML development: instances (managed JupyterLab 3 instances), machine type + GPU selection, idle-shutdown and auto-upgrade, custom containers/conda environments, integration with Cloud Storage/BigQuery/Vertex AI training, networking (VPC, private IP, no public IP), and IAM/service-account scoping (Vertex AI Workbench). Loads the Workbench knowledge: create a notebook instance, scope its identity, enable idle shutdown, and verify the kernel runs. Consumed by the Vertex AI Workbench specialist and by the GCP role team (gcp-iac-engineer / gcp-cloud-architect) when they provision notebook environments.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [gcp, vertex-ai-workbench, ai-ml, jupyterlab, notebooks, data-science]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Vertex AI Workbench

A managed JupyterLab environment for data science and ML development on Google Cloud. It gives
analysts and ML engineers a notebook server that is pre-integrated with BigQuery, Cloud Storage, and
Vertex AI training/prediction, while handling the underlying VM, OS, and JupyterLab lifecycle.

## Core concepts and components
- **Instances** — managed **JupyterLab** servers (the current "instances" offering supersedes the
  older managed/user-managed notebooks). Each runs on a Compute Engine VM you choose.
- **Machine type + accelerator** — pick CPU/memory and optional **GPU** per instance; GPU drivers are
  managed.
- **Lifecycle** — **idle shutdown** (auto-stop after N minutes idle — the key cost control),
  **auto-upgrade**, scheduled health checks, and start/stop on demand.
- **Environments** — pre-built images (TensorFlow/PyTorch/base) plus **custom containers** and
  conda/pip environments; persistent home disk preserves work across stops.
- **Integrations** — BigQuery and Cloud Storage browsers, the Vertex AI SDK for submitting training
  jobs/pipelines, and Git integration for notebooks.

## Configuration and sizing
- Right-size the machine type to the interactive workload (notebooks are for development, not heavy
  training — submit large jobs to Vertex AI training). Add a GPU only for local prototyping that
  needs it. Always set an **idle-shutdown** timeout. Use a custom container/conda env to pin
  dependencies; size the boot/data disk for datasets cached locally.

## Security and IAM
- Attach a dedicated **service account** scoped to exactly the BigQuery datasets, Cloud Storage
  buckets, and Vertex AI resources the user needs — the notebook code runs as this identity.
  Deploy with **no public IP** + private IP in a controlled VPC/subnet, behind IAP or VPC-SC where
  required. Disable root/terminal or restrict OS Login as policy dictates, use **CMEK** for disks,
  and audit via Cloud Audit Logs. Avoid storing credentials in notebooks.

## Cost levers
- The dominant lever is **idle shutdown** — an always-on instance (especially with a GPU) bills
  continuously even when nobody is using it. Right-size machine type, stop instances when not in use,
  prefer CPU for development and offload training to Vertex AI training jobs, and clean up unused
  instances and oversized disks.

## Scaling and limits
- Workbench is single-user interactive compute, not an autoscaling service — scale by instance count
  and machine type. Per-project/region quotas govern CPUs, GPUs, and addresses; GPU availability is
  region-bound. Raise quotas via the quotas page.

## Operating procedure
1. **Provision** — enable the Notebooks API, then create the **instance** (machine type, optional
   GPU, image/container, disk) via Terraform `google_workbench_instance` or
   `gcloud workbench instances create`, attaching the runtime **service account**.
2. **Configure** — set the **idle-shutdown** timeout and auto-upgrade, pin the environment
   (container/conda), wire BigQuery/Cloud Storage access, and enable Git integration.
3. **Secure** — scope the service account least-privilege, deploy with no public IP + private VPC,
   apply CMEK to disks, and restrict access via IAM/IAP.
4. **Verify** — apply [[verify-by-running]]: confirm the instance is `ACTIVE`
   (`gcloud workbench instances describe`), the JupyterLab endpoint opens, a kernel starts and runs a
   cell, and a scoped action works (e.g. a small BigQuery query or Cloud Storage read from the
   notebook) — capture the actual output.

## Inputs
Workload (interactive dev vs prototyping), machine type + GPU needs, framework/environment, data
access (BigQuery/Cloud Storage), region, networking (public vs private IP, VPC/subnet),
IAM/service-account scope, idle-shutdown policy, and cost constraints.

## Output
A Workbench instance (right-sized machine type, optional GPU, pinned environment) with idle shutdown,
a least-privilege service account, private networking, and CMEK, plus verification of an active
instance whose kernel runs and can access its scoped data.

## Notes
- Gotchas: forgetting idle shutdown is the top cost mistake (especially GPU instances); use Vertex AI
  training for heavy jobs rather than running them in a notebook; the home disk persists across stops
  but the VM still incurs disk cost when stopped; public-IP instances are an exposure risk (prefer
  private IP + IAP); the newer "instances" offering differs from legacy managed/user-managed notebooks.
- IaC/CLI: Terraform `google_workbench_instance` (plus `google_project_service`,
  `google_service_account`, `google_compute_network`/`_subnetwork` for private networking). CLI
  `gcloud workbench instances create / describe / start / stop / list`. The Notebooks/Workbench API
  for programmatic management.
